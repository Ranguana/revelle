#!/usr/bin/env python3
"""Build the self-hosted type library for dispatcherie.

    python3 scripts/build-fonts.py            # acquire, build, write everything
    python3 scripts/build-fonts.py --offline  # rebuild from the source cache only

Requires fontTools (with brotli/zopfli for woff2):

    python3 -m venv .venv && .venv/bin/pip install "fonttools[woff]" brotli cu2qu
    .venv/bin/python scripts/build-fonts.py

Pipeline, per face:

  1. acquire the upstream source — Google Fonts is read at a pinned commit
     (GF_COMMIT) so a rebuild a year from now produces the same shelf; XCharter
     comes from CTAN.
  2. variable source  -> pin axes to a static instance (varLib.instancer)
     CFF/.otf source  -> convert cubic CFF outlines to quadratic glyf (cu2qu)
  3. normalise the name table so the PDF's embedded font name is legible, and
     so a renamed-for-licensing family says its new name everywhere a user or a
     font menu can see it
  4. synthesise a `tnum` (tabular figures) feature if the source ships none
  5. pyftsubset -> latin + latin-ext, keeping kern/liga/tnum/onum, flavour woff2
  6. content-hash the file name

Outputs (all generated — edit this script, not them):

    public/fonts/*.woff2         the faces
    public/fonts/LICENSES.txt    per-family attribution + licence texts
    src/lib/fonts.generated.ts   the manifest; tokens.ts derives FONT_STACKS
    src/app/fonts.css            @font-face rules

── Why every face is TrueType-flavoured ──────────────────────────────────────
Chromium can embed a CFF-flavoured face into a PDF as an unnamed "Type 3
Custom" font (puppeteer#7401), which destroys text extraction at a print shop.
Sources that ship CFF are converted; the build asserts no CFF survives.

── Why the licence rules are enforced in code ────────────────────────────────
Every file here is a subset, and OFL-FAQ 2.6 is explicit that subsetting a
webfont is a modification, which "would not normally allow the use of RFNs"
(Reserved Font Names). OFL-FAQ 5.4 goes further: a modified version may not use
any whole *word* from a Reserved Font Name. So the shelf is built from families
that declare no RFN, and the two exceptions — Playfair Display and IBM Plex
Mono, which predate this rule and are wired into saved sheets as the `modern`
and `typewriter` keys — ship under new names, with the upstream copyright and
licence notice intact (OFL clause 2) and provenance recorded in LICENSES.txt
and in the manifest's `basedOn`. check_name_safety() below fails the build if a
reserved word ever reaches a user-visible name record.
"""

import argparse
import hashlib
import io
import re
import shutil
import subprocess
import sys
import urllib.parse

import zipfile
from dataclasses import dataclass, field
from pathlib import Path

from fontTools.ttLib import TTFont, newTable
from fontTools.ttLib.tables import otTables as ot
from fontTools.ttLib.tables.otBase import ValueRecord
from fontTools.otlLib.builder import buildSinglePos
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.varLib.instancer import instantiateVariableFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SRC = HERE / "src-fonts"      # download cache, gitignored
WORK = HERE / "work"          # staged statics, gitignored
OUT = ROOT / "public" / "fonts"
CSS = ROOT / "src" / "app" / "fonts.css"
MANIFEST_TS = ROOT / "src" / "lib" / "fonts.generated.ts"

# google/fonts is a moving target; pin it. Bump deliberately, then rebuild and
# re-run the verification in the README rather than letting it drift silently.
GF_COMMIT = "352f6b7d9d6cc4fa9e242b931291d31b21a6dc84"  # 2026-08-14
GF_RAW = "https://raw.githubusercontent.com/google/fonts/" + GF_COMMIT
XCHARTER_ZIP = "https://mirrors.ctan.org/fonts/xcharter.zip"

# Google's latin + latin-ext ranges, plus the few marks this sheet actually
# prints (section sign, pilcrow, arrows) that fall outside them.
UNICODES = ",".join([
    # latin
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC",
    "U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193",
    "U+2212,U+2215,U+FEFF,U+FFFD",
    # latin-ext
    "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF",
    "U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0",
    "U+2113,U+2C60-2C7F,U+A720-A7FF",
    # sheet furniture
    "U+2018-201F,U+2022,U+2026,U+2032-2033,U+2190,U+2192,U+25A0,U+25CF",
])

# pyftsubset's default feature list already carries kern/liga/calt/ccmp/locl.
# tnum and onum are NOT in it, and the sheet's time and tally columns depend on
# tabular figures, so they are added explicitly (with their pnum/lnum partners
# so the pairs stay switchable).
EXTRA_FEATURES = "tnum,onum,pnum,lnum,case"

# name IDs kept in the binary: 0-6 for identification, 7 for the upstream
# trademark notice (OFL-FAQ 3.7 requires it to survive into a derivative),
# 13/14 for the licence.
NAME_IDS = "0,1,2,3,4,5,6,7,13,14"


# ── the shelf ────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class Source:
    """Where the three faces of a family come from.

    `regular`/`bold`/`italic` are (filename, axis pins). Pins are None for an
    already-static source; a variable source is pinned to a static instance.
    `italic` is None for a masthead-only face that ships no true italic.
    """
    dir: str
    regular: tuple
    bold: tuple
    italic: tuple | None
    italic_dir: str | None = None      # when the italic comes from a sibling
    kind: str = "gf"                   # "gf" | "ctan"
    licence_file: str = "OFL.txt"
    # A sibling lending its italic may sit in a different licence bucket:
    # Roboto Slab is Apache, Roboto Serif is OFL.
    italic_licence_file: str | None = None


def GF(d, roman, italic, *, italic_dir=None, licence_file="OFL.txt",
       italic_licence_file=None):
    """A Google Fonts family shipped as variable sources."""
    return Source(d, (roman, {"wght": 400}), (roman, {"wght": 700}),
                  (italic, {"wght": 400}) if italic else None,
                  italic_dir=italic_dir, licence_file=licence_file,
                  italic_licence_file=italic_licence_file)


def GFS(d, regular, bold, italic, *, licence_file="OFL.txt"):
    """A Google Fonts family shipped as static instances."""
    return Source(d, (regular, None), (bold, None),
                  (italic, None) if italic else None, licence_file=licence_file)


SERIF_FB = 'Georgia, "Times New Roman", serif'
SANS_FB = '"Helvetica Neue", Arial, sans-serif'
SLAB_FB = 'Rockwell, "Rockwell Nova", Georgia, serif'
MONO_FB = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'


@dataclass
class Family:
    key: str            # the token key saved in a sheet — never change one
    name: str           # the family name we ship under, and the CSS family
    category: str       # serif | sans | slab | display | mono | quirky
    source: Source
    fallback: str       # the rest of the CSS stack, after our own face
    based_on: str | None = None   # upstream name, when renamed for licensing
    italic_from: str | None = None  # sibling family lending its italic
    note: str = ""
    # filled in by the build
    licence: str = ""
    copyright: str = ""
    reserved: list = field(default_factory=list)
    faces: dict = field(default_factory=dict)
    synthetic_tnum: bool = False


# The seven original keys come first and keep their exact fallback stacks: a
# saved sheet stores the key, and the whole point of the stack is that it
# renders the same today as it did when the sheet was made.
FAMILIES = [
    # ── the original seven ───────────────────────────────────────────────────
    Family("oldstyle", "Source Serif 4", "serif",
           GF("sourceserif4", "SourceSerif4[opsz,wght].ttf",
              "SourceSerif4-Italic[opsz,wght].ttf"),
           '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif'),
    Family("transitional", "XCharter", "serif",
           Source("xcharter",
                  ("XCharter-Roman.otf", None), ("XCharter-Bold.otf", None),
                  ("XCharter-Italic.otf", None), kind="ctan"),
           'Charter, "Bitstream Charter", Cambria, Georgia, serif'),
    # Playfair Display reserves its own name; see the licensing note at the top.
    Family("modern", "Dispatch Didone", "display",
           GF("playfairdisplay", "PlayfairDisplay[wght].ttf",
              "PlayfairDisplay-Italic[wght].ttf"),
           'Didot, "Bodoni MT", Georgia, serif',
           based_on="Playfair Display"),
    Family("slab", "Roboto Slab", "slab",
           GF("robotoslab", "RobotoSlab[wght].ttf",
              "RobotoSerif-Italic[GRAD,opsz,wdth,wght].ttf",
              italic_dir="robotoserif", licence_file="LICENSE.txt",
              italic_licence_file="OFL.txt"),
           'Rockwell, "Rockwell Nova", "Bookman Old Style", Georgia, serif',
           italic_from="Roboto Serif"),
    Family("grotesque", "Inter", "sans",
           GF("inter", "Inter[opsz,wght].ttf", "Inter-Italic[opsz,wght].ttf"),
           'ui-sans-serif, -apple-system, "Helvetica Neue", "Segoe UI", Arial, sans-serif'),
    Family("humanist", "Cabin", "sans",
           GF("cabin", "Cabin[wdth,wght].ttf", "Cabin-Italic[wdth,wght].ttf"),
           '"Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif'),
    # IBM Plex reserves "Plex"; see the licensing note at the top.
    Family("typewriter", "Dispatch Mono", "mono",
           GFS("ibmplexmono", "IBMPlexMono-Regular.ttf", "IBMPlexMono-Bold.ttf",
               "IBMPlexMono-Italic.ttf"),
           'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
           based_on="IBM Plex Mono"),

    # ── serif, for setting text ──────────────────────────────────────────────
    Family("fraunces", "Fraunces", "serif",
           GF("fraunces", "Fraunces[SOFT,WONK,opsz,wght].ttf",
              "Fraunces-Italic[SOFT,WONK,opsz,wght].ttf"), SERIF_FB),
    Family("newsreader", "Newsreader", "serif",
           GF("newsreader", "Newsreader[opsz,wght].ttf",
              "Newsreader-Italic[opsz,wght].ttf"), SERIF_FB),
    Family("literata", "Literata", "serif",
           GF("literata", "Literata[opsz,wght].ttf",
              "Literata-Italic[opsz,wght].ttf"), SERIF_FB),
    Family("petrona", "Petrona", "serif",
           GF("petrona", "Petrona[wght].ttf", "Petrona-Italic[wght].ttf"), SERIF_FB),
    Family("spectral", "Spectral", "serif",
           GFS("spectral", "Spectral-Regular.ttf", "Spectral-Bold.ttf",
               "Spectral-Italic.ttf"), SERIF_FB),
    Family("eb-garamond", "EB Garamond", "serif",
           GF("ebgaramond", "EBGaramond[wght].ttf",
              "EBGaramond-Italic[wght].ttf"), SERIF_FB),
    Family("cormorant-garamond", "Cormorant Garamond", "serif",
           GF("cormorantgaramond", "CormorantGaramond[wght].ttf",
              "CormorantGaramond-Italic[wght].ttf"), SERIF_FB),
    Family("crimson-pro", "Crimson Pro", "serif",
           GF("crimsonpro", "CrimsonPro[wght].ttf",
              "CrimsonPro-Italic[wght].ttf"), SERIF_FB),
    Family("vollkorn", "Vollkorn", "serif",
           GF("vollkorn", "Vollkorn[wght].ttf", "Vollkorn-Italic[wght].ttf"), SERIF_FB),
    Family("alegreya", "Alegreya", "serif",
           GF("alegreya", "Alegreya[wght].ttf", "Alegreya-Italic[wght].ttf"), SERIF_FB),
    Family("brygada-1918", "Brygada 1918", "serif",
           GF("brygada1918", "Brygada1918[wght].ttf",
              "Brygada1918-Italic[wght].ttf"), SERIF_FB),

    # ── sans ─────────────────────────────────────────────────────────────────
    Family("work-sans", "Work Sans", "sans",
           GF("worksans", "WorkSans[wght].ttf", "WorkSans-Italic[wght].ttf"), SANS_FB),
    Family("karla", "Karla", "sans",
           GF("karla", "Karla[wght].ttf", "Karla-Italic[wght].ttf"), SANS_FB),
    Family("jost", "Jost", "sans",
           GF("jost", "Jost[wght].ttf", "Jost-Italic[wght].ttf"), SANS_FB),
    Family("archivo", "Archivo", "sans",
           GF("archivo", "Archivo[wdth,wght].ttf",
              "Archivo-Italic[wdth,wght].ttf"), SANS_FB),
    Family("archivo-narrow", "Archivo Narrow", "sans",
           GF("archivonarrow", "ArchivoNarrow[wght].ttf",
              "ArchivoNarrow-Italic[wght].ttf"),
           '"Arial Narrow", ' + SANS_FB),
    Family("chivo", "Chivo", "sans",
           GF("chivo", "Chivo[wght].ttf", "Chivo-Italic[wght].ttf"), SANS_FB),
    Family("epilogue", "Epilogue", "sans",
           GF("epilogue", "Epilogue[wght].ttf", "Epilogue-Italic[wght].ttf"), SANS_FB),
    Family("familjen-grotesk", "Familjen Grotesk", "sans",
           GF("familjengrotesk", "FamiljenGrotesk[wght].ttf",
              "FamiljenGrotesk-Italic[wght].ttf"), SANS_FB),
    Family("schibsted-grotesk", "Schibsted Grotesk", "sans",
           GF("schibstedgrotesk", "SchibstedGrotesk[wght].ttf",
              "SchibstedGrotesk-Italic[wght].ttf"), SANS_FB),
    Family("instrument-sans", "Instrument Sans", "sans",
           GF("instrumentsans", "InstrumentSans[wdth,wght].ttf",
              "InstrumentSans-Italic[wdth,wght].ttf"), SANS_FB),

    # ── slab ─────────────────────────────────────────────────────────────────
    Family("zilla-slab", "Zilla Slab", "slab",
           GFS("zillaslab", "ZillaSlab-Regular.ttf", "ZillaSlab-Bold.ttf",
               "ZillaSlab-Italic.ttf"), SLAB_FB),
    Family("aleo", "Aleo", "slab",
           GF("aleo", "Aleo[wght].ttf", "Aleo-Italic[wght].ttf"), SLAB_FB),
    Family("rokkitt", "Rokkitt", "slab",
           GF("rokkitt", "Rokkitt[wght].ttf", "Rokkitt-Italic[wght].ttf"), SLAB_FB),
    Family("epunda-slab", "Epunda Slab", "slab",
           GF("epundaslab", "EpundaSlab[wght].ttf",
              "EpundaSlab-Italic[wght].ttf"), SLAB_FB),
    Family("solway", "Solway", "slab",
           GFS("solway", "Solway-Regular.ttf", "Solway-Bold.ttf", None), SLAB_FB,
           note="No italic upstream — masthead use only."),

    # ── display ──────────────────────────────────────────────────────────────
    Family("bodoni-moda", "Bodoni Moda", "display",
           GF("bodonimoda", "BodoniModa[opsz,wght].ttf",
              "BodoniModa-Italic[opsz,wght].ttf"),
           'Didot, "Bodoni MT", Georgia, serif'),
    Family("ibarra-real-nova", "Ibarra Real Nova", "display",
           GF("ibarrarealnova", "IbarraRealNova[wght].ttf",
              "IbarraRealNova-Italic[wght].ttf"), SERIF_FB),
    Family("cinzel", "Cinzel", "display",
           GF("cinzel", "Cinzel[wght].ttf", None), 'Trajan, Georgia, serif',
           note="No italic upstream — masthead use only."),
    Family("grenze-gotisch", "Grenze Gotisch", "display",
           GF("grenzegotisch", "GrenzeGotisch[wght].ttf", None), SERIF_FB,
           note="No italic upstream — masthead use only."),
    Family("big-shoulders-display", "Big Shoulders Display", "display",
           GF("bigshouldersdisplay", "BigShouldersDisplay[wght].ttf", None),
           '"Arial Narrow", ' + SANS_FB,
           note="No italic upstream — masthead use only."),
    Family("frank-ruhl-libre", "Frank Ruhl Libre", "display",
           GF("frankruhllibre", "FrankRuhlLibre[wght].ttf", None), SERIF_FB,
           note="No italic upstream — masthead use only."),
    Family("syne", "Syne", "display",
           GF("syne", "Syne[wght].ttf", None), SANS_FB,
           note="No italic upstream — masthead use only."),
    Family("oswald", "Oswald", "display",
           GF("oswald", "Oswald[wght].ttf", None), '"Arial Narrow", ' + SANS_FB,
           note="No italic upstream — masthead use only."),
    Family("eczar", "Eczar", "display",
           GF("eczar", "Eczar[wght].ttf", None), SERIF_FB,
           note="No italic upstream — masthead use only."),
    Family("bricolage-grotesque", "Bricolage Grotesque", "display",
           GF("bricolagegrotesque", "BricolageGrotesque[opsz,wdth,wght].ttf", None),
           SANS_FB, note="No italic upstream — masthead use only."),
    Family("martel", "Martel", "display",
           GFS("martel", "Martel-Regular.ttf", "Martel-Bold.ttf", None), SERIF_FB,
           note="No italic upstream — masthead use only."),

    # ── mono ─────────────────────────────────────────────────────────────────
    Family("space-mono", "Space Mono", "mono",
           GFS("spacemono", "SpaceMono-Regular.ttf", "SpaceMono-Bold.ttf",
               "SpaceMono-Italic.ttf"), MONO_FB),
    Family("courier-prime", "Courier Prime", "mono",
           GFS("courierprime", "CourierPrime-Regular.ttf",
               "CourierPrime-Bold.ttf", "CourierPrime-Italic.ttf"),
           '"Courier New", ' + MONO_FB),
    Family("sometype-mono", "Sometype Mono", "mono",
           GF("sometypemono", "SometypeMono[wght].ttf",
              "SometypeMono-Italic[wght].ttf"), MONO_FB),

    # ── quirky ───────────────────────────────────────────────────────────────
    Family("grenze", "Grenze", "quirky",
           GF("grenze", "Grenze[wght].ttf", "Grenze-Italic[wght].ttf"), SERIF_FB),
    Family("anybody", "Anybody", "quirky",
           GF("anybody", "Anybody[wdth,wght].ttf",
              "Anybody-Italic[wdth,wght].ttf"), SANS_FB),
    Family("texturina", "Texturina", "quirky",
           GF("texturina", "Texturina[opsz,wght].ttf",
              "Texturina-Italic[opsz,wght].ttf"), SERIF_FB),
    Family("tourney", "Tourney", "quirky",
           GF("tourney", "Tourney[wdth,wght].ttf",
              "Tourney-Italic[wdth,wght].ttf"), SANS_FB),
    Family("amiri", "Amiri", "quirky",
           GFS("amiri", "Amiri-Regular.ttf", "Amiri-Bold.ttf",
               "Amiri-Italic.ttf"), SERIF_FB),
    Family("silkscreen", "Silkscreen", "quirky",
           GFS("silkscreen", "Silkscreen-Regular.ttf", "Silkscreen-Bold.ttf",
               None), SANS_FB,
           note="A pixel face with no italic — masthead use only."),
]

STYLES = (("regular", 400, False), ("bold", 700, False), ("italic", 400, True))
SUBFAMILY = {"regular": "Regular", "bold": "Bold", "italic": "Italic"}


# ── acquisition ──────────────────────────────────────────────────────────────

def download(url: str, dest: Path, offline: bool) -> Path:
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    if offline:
        raise SystemExit(f"--offline but {dest} is not cached")
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"  ↓ {url}")
    # curl rather than urllib: python.org builds on macOS ship without a CA
    # bundle wired up, and a font pipeline is not the place to debug that.
    subprocess.run(["curl", "--fail", "--silent", "--show-error", "--location",
                    "--max-time", "180", "--output", str(dest), url], check=True)
    return dest


def gf_url(fam_dir: str, path: str, licence_file: str) -> str:
    # Which licence bucket a family lives in is a property of the family, and
    # the one Apache family here (Roboto Slab) is the only one that differs.
    bucket = "apache" if licence_file == "LICENSE.txt" else "ofl"
    return f"{GF_RAW}/{bucket}/{fam_dir}/{urllib.parse.quote(path)}"


def acquire(fam: Family, offline: bool) -> None:
    """Put every source file this family needs into SRC, and read its licence."""
    src = fam.source
    if src.kind == "ctan":
        zip_path = download(XCHARTER_ZIP, SRC / "xcharter.zip", offline)
        with zipfile.ZipFile(zip_path) as z:
            for member in z.namelist():
                leaf = Path(member).name
                if leaf in {src.regular[0], src.bold[0],
                            src.italic[0] if src.italic else ""}:
                    (SRC / src.dir).mkdir(parents=True, exist_ok=True)
                    (SRC / src.dir / leaf).write_bytes(z.read(member))
        fam.licence = "Bitstream Charter licence"
        fam.copyright = ("Copyright 1989-1992 Bitstream Inc.; modifications "
                         "(c) 2009-2012 Andrey Panov, (c) 2013-2024 Michael Sharpe")
        fam.reserved = []
        return

    for name, (leaf, _) in (("regular", src.regular), ("bold", src.bold),
                            ("italic", src.italic or (None, None))):
        if leaf is None:
            continue
        sibling = name == "italic" and src.italic_dir
        d = src.italic_dir if sibling else src.dir
        lf = (src.italic_licence_file or src.licence_file) if sibling else src.licence_file
        download(gf_url(d, leaf, lf), SRC / d / leaf, offline)

    lic = download(gf_url(src.dir, src.licence_file, src.licence_file),
                   SRC / src.dir / src.licence_file, offline)
    text = lic.read_text(errors="replace")
    if src.licence_file == "LICENSE.txt":
        fam.licence = "Apache License 2.0"
        fam.copyright = "Copyright Google LLC"
        fam.reserved = []
    else:
        fam.licence = "SIL OFL 1.1"
        # The header is everything before the licence proper; the phrase
        # "Reserved Font Name" appears in the licence body too, so slicing
        # matters — reading the whole file finds a false positive every time.
        cut = re.search(r"This Font Software is licensed under", text)
        head = text[:cut.start()] if cut else text[:1500]
        fam.copyright = " ".join(
            l.strip() for l in head.splitlines() if l.strip().startswith("Copyright"))
        fam.reserved = [n.strip().rstrip(".").strip('"\'')
                        for n in re.findall(r"with Reserved Font Names?\s*(.+)", head)]

    if src.italic_dir:
        # The sibling lending its italic is a separate family with its own
        # copyright, and LICENSES.txt has to say so.
        lf = src.italic_licence_file or src.licence_file
        sib = download(gf_url(src.italic_dir, lf, lf),
                       SRC / src.italic_dir / lf, offline)
        text = sib.read_text(errors="replace")
        cut = re.search(r"This Font Software is licensed under", text)
        head = text[:cut.start()] if cut else text[:1500]
        line = " ".join(l.strip() for l in head.splitlines()
                        if l.strip().startswith("Copyright"))
        fam.copyright += f"; italic: {line}"
        fam.licence += ("; italic: SIL OFL 1.1" if lf == "OFL.txt"
                        else "; italic: Apache License 2.0")


def check_name_safety(fam: Family, font: TTFont) -> None:
    """OFL-FAQ 5.4: a modified version may not use any whole word of an RFN.

    Checked against the built binary rather than the table above, because the
    name records are what a font menu and a PDF actually show. IDs 0/7/13/14 are
    the copyright, trademark and licence notices, which the OFL requires us to
    keep intact (clause 2, FAQ 3.7) and which are not names presented to the
    user in a font menu.
    """
    words = set()
    for reserved in fam.reserved:
        words |= {w.lower() for w in re.findall(r"[A-Za-z0-9]+", reserved)}
    if not words:
        return
    for record in font["name"].names:
        if record.nameID in (0, 7, 13, 14):
            continue
        value = record.toUnicode()
        hit = words & {w.lower() for w in re.findall(r"[A-Za-z0-9]+", value)}
        if hit:
            raise SystemExit(
                f"{fam.key}: name ID {record.nameID} ({value!r}) uses reserved "
                f"font name word(s) {sorted(hit)}. Rename the family or drop it.")


# ── CFF -> TrueType ──────────────────────────────────────────────────────────

def glyphs_to_quadratic(glyph_set, max_err=1.0):
    out = {}
    for name in glyph_set.keys():
        pen = TTGlyphPen(glyph_set)
        glyph_set[name].draw(Cu2QuPen(pen, max_err, reverse_direction=True))
        out[name] = pen.glyph()
    return out


def otf_to_ttf(font, max_err=1.0):
    assert font.sfntVersion == "OTTO" and "CFF " in font
    order = font.getGlyphOrder()
    glyph_set = font.getGlyphSet()

    font["loca"] = newTable("loca")
    glyf = font["glyf"] = newTable("glyf")
    glyf.glyphOrder = order
    glyf.glyphs = glyphs_to_quadratic(glyph_set, max_err)
    del font["CFF "]
    if "VORG" in font:
        del font["VORG"]
    glyf.compile(font)

    # lsb must be re-derived: it is implicit in CFF, explicit in glyf.
    hmtx = font["hmtx"]
    for name, glyph in glyf.glyphs.items():
        width, _ = hmtx[name]
        glyph.recalcBounds(glyf)
        hmtx[name] = (width, glyph.xMin if hasattr(glyph, "xMin") else 0)

    maxp = font["maxp"] = newTable("maxp")
    maxp.tableVersion = 0x00010000
    maxp.maxZones = 1
    maxp.maxTwilightPoints = 0
    maxp.maxStorage = 0
    maxp.maxFunctionDefs = 0
    maxp.maxInstructionDefs = 0
    maxp.maxStackElements = 0
    maxp.maxSizeOfInstructions = 0
    maxp.maxComponentElements = max(
        (len(g.components) if g.isComposite() else 0) for g in glyf.glyphs.values()
    )
    maxp.compile(font)

    post = font["post"]
    post.formatType = 2.0
    post.extraNames = []
    post.mapping = {}
    post.glyphOrder = order
    try:
        post.compile(font)
    except OverflowError:
        post.formatType = 3.0

    font.sfntVersion = "\000\001\000\000"
    return font


# ── name table ───────────────────────────────────────────────────────────────

def set_names(font, family, subfamily, ps_name):
    name = font["name"]
    full = f"{family} {subfamily}"
    for nid, value in ((1, family), (2, subfamily), (3, f"{full}; dispatcherie subset"),
                       (4, full), (6, ps_name), (16, family), (17, subfamily)):
        name.setName(value, nid, 3, 1, 0x409)
        name.setName(value, nid, 1, 0, 0)


def set_style_bits(font, weight, italic):
    os2 = font["OS/2"]
    os2.usWeightClass = weight
    fs = os2.fsSelection & ~(1 | 1 << 5 | 1 << 6)  # italic, bold, regular
    if italic:
        fs |= 1
    if weight >= 700:
        fs |= 1 << 5
    if not italic and weight < 700:
        fs |= 1 << 6
    os2.fsSelection = fs
    head = font["head"]
    mac = head.macStyle & ~0b11
    if weight >= 700:
        mac |= 0b01
    if italic:
        mac |= 0b10
    head.macStyle = mac


# ── tabular figures ────────────────────────────────────────────────
# Plenty of families ship proportional figures and no tnum feature at all, so
# `font-variant-numeric: tabular-nums` is a no-op in them and the sheet's time
# and tally columns come out ragged (Cabin's '1' is 0.37em narrower than its
# '0'). Rather than accept that, build a real tnum: a GPOS single-adjustment
# that pads every digit out to the widest one and re-centres the glyph inside
# the padding. Same result the type designer would have shipped.

def empty_gpos(font):
    """A minimal GPOS for a face that ships none, so tnum has somewhere to go."""
    table = ot.GPOS()
    table.Version = 0x00010000
    table.ScriptList = ot.ScriptList()
    table.ScriptList.ScriptRecord = []
    table.FeatureList = ot.FeatureList()
    table.FeatureList.FeatureRecord = []
    table.LookupList = ot.LookupList()
    table.LookupList.Lookup = []

    script = ot.Script()
    script.DefaultLangSys = ot.DefaultLangSys()
    script.DefaultLangSys.FeatureIndex = []
    script.DefaultLangSys.FeatureCount = 0
    script.DefaultLangSys.ReqFeatureIndex = 0xFFFF
    script.DefaultLangSys.LookupOrder = None
    script.LangSysRecord = []
    script.LangSysCount = 0
    record = ot.ScriptRecord()
    record.ScriptTag = "DFLT"
    record.Script = script
    table.ScriptList.ScriptRecord.append(record)
    table.ScriptList.ScriptCount = 1
    table.FeatureList.FeatureCount = 0
    table.LookupList.LookupCount = 0

    gpos = newTable("GPOS")
    gpos.table = table
    font["GPOS"] = gpos
    return gpos


def add_tnum_padding(font) -> bool:
    """Make `tnum` produce genuinely tabular figures, whatever the font shipped.

    Two cases, one mechanism. A face with no tnum at all gets a whole feature:
    a GPOS single-adjustment that pads every digit out to the widest one and
    re-centres the glyph inside the padding — the same result the type designer
    would have shipped. A face whose tnum *nearly* works — Crimson Pro's
    tabular figures are 539 units wide except '1', which is 540 — gets the same
    adjustment appended to the tnum it already has, on the substituted glyphs.
    One rounded-off unit is 0.01px at print size, which is not zero, and the
    time column has to stack exactly.

    Returns True if anything was added.
    """
    names, widths = effective_digit_glyphs(font)
    if names is None or len(set(widths)) == 1:
        return False

    if "GPOS" not in font:
        empty_gpos(font)
    gpos = font["GPOS"].table
    if getattr(gpos, "FeatureVariations", None):
        raise SystemExit("GPOS has FeatureVariations; feature indices are not safe to renumber")

    target = max(widths)
    mapping = {}
    for name, width in zip(names, widths):
        delta = target - width
        if delta == 0:
            continue
        value = ValueRecord()
        value.XPlacement = delta // 2
        value.XAdvance = delta
        mapping[name] = value

    lookup = ot.Lookup()
    lookup.LookupType = 1
    lookup.LookupFlag = 0
    lookup.SubTable = buildSinglePos(mapping, font.getReverseGlyphMap())
    lookup.SubTableCount = len(lookup.SubTable)
    gpos.LookupList.Lookup.append(lookup)
    gpos.LookupList.LookupCount = len(gpos.LookupList.Lookup)
    lookup_index = len(gpos.LookupList.Lookup) - 1

    # If a Latin-reachable tnum already exists in GPOS, extend it rather than
    # declaring a second feature with the same tag under the same language.
    existing = [r for r in gpos.FeatureList.FeatureRecord if r.FeatureTag == "tnum"]
    reachable = latin_tnum_lookups(font, "GPOS")
    if existing and reachable:
        for record in existing:
            record.Feature.LookupListIndex.append(lookup_index)
            record.Feature.LookupCount = len(record.Feature.LookupListIndex)
        return True

    feature = ot.Feature()
    feature.FeatureParams = None
    feature.LookupListIndex = [lookup_index]
    feature.LookupCount = 1
    record = ot.FeatureRecord()
    record.FeatureTag = "tnum"
    record.Feature = feature

    # FeatureRecords must stay sorted by tag, so every LangSys index that points
    # into the list has to be renumbered after the insert.
    fl = gpos.FeatureList
    records = fl.FeatureRecord + [record]
    order = sorted(range(len(records)), key=lambda i: records[i].FeatureTag)
    remap = {old: new for new, old in enumerate(order)}
    fl.FeatureRecord = [records[i] for i in order]
    fl.FeatureCount = len(fl.FeatureRecord)
    new_index = remap[len(records) - 1]

    for script_record in gpos.ScriptList.ScriptRecord:
        script = script_record.Script
        lang_systems = [script.DefaultLangSys] + [
            r.LangSys for r in script.LangSysRecord
        ]
        for lang in lang_systems:
            if lang is None:
                continue
            lang.FeatureIndex = sorted(
                {remap[i] for i in lang.FeatureIndex} | {new_index}
            )
            lang.FeatureCount = len(lang.FeatureIndex)
            if lang.ReqFeatureIndex != 0xFFFF:
                lang.ReqFeatureIndex = remap[lang.ReqFeatureIndex]
    return True


def layout_features(path):
    """Which layout features exist in a font file at all."""
    font = TTFont(path, lazy=True)
    tags = set()
    for table in ("GSUB", "GPOS"):
        if table in font:
            t = font[table].table
            if t.FeatureList:
                tags |= {r.FeatureTag for r in t.FeatureList.FeatureRecord}
    if "kern" in font and "GPOS" not in font:
        tags.add("kern")
    font.close()
    return tags


def latin_tnum_lookups(font, table_tag):
    """The `tnum` lookups a Latin run would actually reach, resolved."""
    if table_tag not in font:
        return []
    table = font[table_tag].table
    if not (table.FeatureList and table.ScriptList and table.LookupList):
        return []
    records = table.FeatureList.FeatureRecord
    indices = set()
    for script_record in table.ScriptList.ScriptRecord:
        if script_record.ScriptTag not in ("DFLT", "latn"):
            continue
        script = script_record.Script
        langs = [script.DefaultLangSys] + [r.LangSys for r in script.LangSysRecord]
        for lang in langs:
            if lang is None:
                continue
            for i in lang.FeatureIndex:
                if i < len(records) and records[i].FeatureTag == "tnum":
                    indices |= set(records[i].Feature.LookupListIndex)
    return [table.LookupList.Lookup[i] for i in sorted(indices)
            if i < len(table.LookupList.Lookup)]


def _subtables(lookup):
    """Lookup subtables, seeing through type-7/9 extension records."""
    for sub in lookup.SubTable:
        if lookup.LookupType in (7, 9) and hasattr(sub, "ExtSubTable"):
            yield sub.ExtSubTable
        else:
            yield sub


def effective_digit_glyphs(font):
    """Which glyphs 0-9 become with `tnum` on, and what they then measure.

    Returns (glyph names, advances) — the advances a Latin run of figures would
    actually print with, after the font's own tnum has had its say.

    Asking the outcome rather than "is there a tnum feature" is the only
    reliable test. Eczar, for one, registers a tnum under `latn` whose lookups
    cover only its Devanagari digits: the tag is present, the Latin figures stay
    ragged, and the subsetter then drops the now-empty feature entirely. The
    same trap catches Arabic-first and Indic-first families generally.
    """
    cmap = font.getBestCmap()
    names = [cmap.get(ord(d)) for d in "0123456789"]
    if not all(names):
        return None, None
    hmtx = font["hmtx"]

    # GSUB: tnum usually swaps in dedicated tabular figures.
    for lookup in latin_tnum_lookups(font, "GSUB"):
        for sub in _subtables(lookup):
            mapping = getattr(sub, "mapping", None)
            if mapping:
                names = [mapping.get(n, n) for n in names]

    widths = [hmtx[n][0] for n in names]

    # GPOS: a padding-style tnum (including the one this script synthesises).
    for lookup in latin_tnum_lookups(font, "GPOS"):
        for sub in _subtables(lookup):
            if getattr(sub, "LookupType", None) not in (None, 1):
                continue
            coverage = getattr(sub, "Coverage", None)
            if coverage is None:
                continue
            glyphs = coverage.glyphs
            values = getattr(sub, "Value", None)
            for i, name in enumerate(names):
                if name not in glyphs:
                    continue
                if isinstance(values, list):
                    value = values[glyphs.index(name)]
                else:
                    value = values
                widths[i] += getattr(value, "XAdvance", 0) or 0

    return names, widths


def effective_digit_widths(font) -> set:
    """The distinct advances 0-9 print with, with `tnum` on. One = tabular."""
    _, widths = effective_digit_glyphs(font)
    return {None} if widths is None else set(widths)


# ── build ────────────────────────────────────────────────────────────────────

def build_face(fam: Family, style: str, weight: int, italic: bool) -> dict:
    src = fam.source
    leaf, axes = getattr(src, style if style != "regular" else "regular")
    src_dir = src.italic_dir if (style == "italic" and src.italic_dir) else src.dir
    path = SRC / src_dir / leaf

    font = TTFont(path)
    was_cff = font.sfntVersion == "OTTO"
    if was_cff:
        otf_to_ttf(font)
    if axes is not None:
        if "fvar" not in font:
            raise SystemExit(f"{fam.key}/{style}: {leaf} is not variable but axes were pinned")
        wght = next((a for a in font["fvar"].axes if a.axisTag == "wght"), None)
        want = axes["wght"]
        if wght is None or wght.minValue > want or wght.maxValue < want:
            raise SystemExit(
                f"{fam.key}/{style}: {leaf} cannot reach wght {want} "
                f"(axis {wght.minValue}-{wght.maxValue})" if wght else
                f"{fam.key}/{style}: {leaf} has no wght axis")
        pins = dict(axes)
        for axis in font["fvar"].axes:
            pins.setdefault(axis.axisTag, axis.defaultValue)
        font = instantiateVariableFont(font, pins, inplace=True,
                                       updateFontNames=False, optimize=True)
    else:
        # A static source must really be the weight we are claiming: shipping a
        # Regular in the Bold slot is exactly the faked face this shelf refuses.
        got = font["OS/2"].usWeightClass
        if weight == 700 and got < 600:
            raise SystemExit(f"{fam.key}/{style}: {leaf} is weight {got}, not a real bold")

    set_names(font, fam.name, SUBFAMILY[style], f"{fam.name.replace(' ', '')}-{SUBFAMILY[style]}")
    set_style_bits(font, weight, italic)
    check_name_safety(fam, font)
    synth = add_tnum_padding(font)

    staged = WORK / f"{fam.key}-{style}.ttf"
    font.save(staged)
    font.close()

    out_tmp = WORK / f"{fam.key}-{style}.woff2"
    subprocess.run([
        sys.executable, "-m", "fontTools.subset", str(staged),
        f"--unicodes={UNICODES}",
        f"--layout-features+={EXTRA_FEATURES}",
        f"--name-IDs={NAME_IDS}",
        "--flavor=woff2",
        f"--output-file={out_tmp}",
    ], check=True, capture_output=True)

    digest = hashlib.sha256(out_tmp.read_bytes()).hexdigest()[:8]
    final = OUT / f"{fam.key}-{style}.{digest}.woff2"
    shutil.copyfile(out_tmp, final)

    check = TTFont(final)
    if "glyf" not in check or "CFF " in check:
        raise SystemExit(f"{final.name} is not glyf-flavoured")
    # The sheet's time and tally columns are set with tabular-nums, so a face
    # whose figures still measure differently with tnum on would print ragged.
    # Chromium is the final arbiter (see scripts/check-fonts.mjs); this catches
    # it here, where the fix is cheap.
    if len(effective_digit_widths(check)) != 1:
        raise SystemExit(f"{final.name}: figures are not tabular with tnum on")
    check.close()

    return {"style": style, "weight": weight, "italic": italic,
            "file": final.name, "bytes": final.stat().st_size,
            "converted_from_cff": was_cff, "synthetic_tnum": bool(synth),
            "source": f"{src_dir}/{leaf}"}


# ── emit ─────────────────────────────────────────────────────────────────────

def quote_family(name: str) -> str:
    return f'"{name}"' if " " in name else name


def stack(fam: Family) -> str:
    return f"{quote_family(fam.name)}, {fam.fallback}"


def ts_string(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def write_manifest(fams) -> None:
    lines = [
        "/**",
        " * The type library — GENERATED by scripts/build-fonts.py. Do not edit.",
        " *",
        " * One entry per family the app ships. tokens.ts derives FONT_STACKS from",
        " * this, fonts.css is written from it, and the PDF renderer uses it to",
        " * decide which faces a sheet must prove it loaded before it will print.",
        " *",
        " * `realItalic: false` means the family ships no italic upstream and none",
        " * was faked: it is a masthead face, the sheet sets its display line",
        " * upright, and nothing may ask it for an italic.",
        " *",
        " * `syntheticTnum: true` means the source shipped no tabular figures and",
        " * the build synthesised a `tnum` GPOS feature (see the script).",
        " */",
        "",
        "export type FontCategory =",
        '  | "serif"',
        '  | "sans"',
        '  | "slab"',
        '  | "display"',
        '  | "mono"',
        '  | "quirky";',
        "",
        "export type FontFile = {",
        "  file: string;",
        "  weight: 400 | 700;",
        '  style: "normal" | "italic";',
        "};",
        "",
        "export type FontFamily = {",
        "  key: string;",
        "  /** The family name in the CSS stack and in the embedded PDF font. */",
        "  name: string;",
        "  category: FontCategory;",
        "  /** Our face first, then the system fallbacks. */",
        "  stack: string;",
        "  license: string;",
        "  copyright: string;",
        "  /** Reserved Font Names declared upstream, if any. */",
        "  reservedFontNames: readonly string[];",
        "  /** Upstream family, when ours was renamed to respect an RFN. */",
        "  basedOn?: string;",
        "  /** Sibling family lending its italic, when the family has none. */",
        "  italicFrom?: string;",
        "  realItalic: boolean;",
        "  syntheticTnum: boolean;",
        "  note: string | undefined;",
        "  files: readonly FontFile[];",
        "  bytes: number;",
        "};",
        "",
        "export const FONTS = [",
    ]
    for fam in fams:
        faces = fam.faces
        total = sum(f["bytes"] for f in faces.values())
        lines.append("  {")
        lines.append(f"    key: {ts_string(fam.key)},")
        lines.append(f"    name: {ts_string(fam.name)},")
        lines.append(f"    category: {ts_string(fam.category)},")
        lines.append(f"    stack: {ts_string(stack(fam))},")
        lines.append(f"    license: {ts_string(fam.licence)},")
        lines.append(f"    copyright: {ts_string(fam.copyright)},")
        reserved = ", ".join(ts_string(r) for r in fam.reserved)
        lines.append(f"    reservedFontNames: [{reserved}],")
        # Emitted even when empty: `as const` turns this array into a union of
        # 53 object types, and a key that is missing from some of them cannot be
        # read off the union without a cast at every call site.
        lines.append(f"    basedOn: {ts_string(fam.based_on) if fam.based_on else 'undefined'},")
        lines.append(f"    italicFrom: {ts_string(fam.italic_from) if fam.italic_from else 'undefined'},")
        lines.append(f"    realItalic: {'true' if 'italic' in faces else 'false'},")
        synth = any(f["synthetic_tnum"] for f in faces.values())
        lines.append(f"    syntheticTnum: {'true' if synth else 'false'},")
        lines.append(f"    note: {ts_string(fam.note) if fam.note else 'undefined'},")
        lines.append("    files: [")
        for style, _, _ in STYLES:
            f = faces.get(style)
            if not f:
                continue
            css_style = "italic" if f["italic"] else "normal"
            lines.append(
                f'      {{ file: {ts_string(f["file"])}, weight: {f["weight"]}, '
                f'style: {ts_string(css_style)} }},')
        lines.append("    ],")
        lines.append(f"    bytes: {total},")
        lines.append("  },")
    lines += [
        "] as const satisfies readonly FontFamily[];",
        "",
        "export type FontKey = (typeof FONTS)[number][\"key\"];",
        "",
        "/** Every family, by key. */",
        "export const FONTS_BY_KEY: Record<FontKey, (typeof FONTS)[number]> =",
        "  Object.fromEntries(FONTS.map((f) => [f.key, f])) as Record<",
        "    FontKey,",
        "    (typeof FONTS)[number]",
        "  >;",
        "",
    ]
    MANIFEST_TS.write_text("\n".join(lines))


CSS_HEADER = '''/**
 * Self-hosted webfaces — GENERATED by scripts/build-fonts.py. Do not edit.
 *
 * Why these are hosted rather than named: a sheet is printed by headless
 * Chromium in a Linux container that has almost no fonts installed. Naming
 * "Iowan Old Style" or "Gill Sans" there resolves to DejaVu, so distinct themes
 * collapse into one generic face and the PDF stops matching the preview.
 * Everything the sheet can ask for ships with the app.
 *
 * Every file is TrueType-flavoured (glyf outlines), never CFF: Chromium can
 * embed a CFF face into a PDF as an unnamed "Type 3 Custom" font
 * (puppeteer#7401), which destroys copy-and-paste and text search for whoever
 * receives the file at a print shop.
 *
 * Each face is a latin + latin-ext subset that keeps kern, liga, tnum and onum.
 * tnum is load-bearing — Sheet.module.css sets font-variant-numeric:
 * tabular-nums on the time column and the tally column — so families that ship
 * no tabular figures carry a synthesised tnum instead. See fonts.generated.ts
 * for which ones, and the build script for how.
 *
 * A family with no italic rule below has no italic upstream and is a masthead
 * face: the sheet sets the display line upright for it (--display-italic) and
 * nothing else may select it, so the browser never fakes an oblique.
 *
 * Filenames carry a content hash, so next.config.ts can serve /fonts/* as
 * immutable for a year.
 *
 * font-display is `block`, not `swap`. A swap would let the preview paint in a
 * fallback and reflow a moment later, which means the on-screen sheet and the
 * PDF disagree about line breaks for as long as the swap lasts. Block keeps
 * them identical at every moment; these files are small and same-origin.
 */
'''


def write_css(fams) -> None:
    out = [CSS_HEADER]
    by_cat = {}
    for fam in fams:
        by_cat.setdefault(fam.category, []).append(fam)
    for cat in ("serif", "sans", "slab", "display", "mono", "quirky"):
        if cat not in by_cat:
            continue
        out.append(f"\n/* ══ {cat} " + "═" * (66 - len(cat)) + " */\n")
        for fam in by_cat[cat]:
            head = f"/* {fam.key} — {fam.name}"
            if fam.based_on:
                head += f" (subset of {fam.based_on}, renamed: RFN)"
            head += f" — {fam.licence} */"
            out.append(head)
            if fam.note:
                out.append(f"/* {fam.note} */")
            if fam.italic_from:
                out.append(f"/* Italic is {fam.italic_from}'s — this family draws none. */")
            for style, _, _ in STYLES:
                face = fam.faces.get(style)
                if not face:
                    continue
                out.append("@font-face {")
                out.append(f'  font-family: "{fam.name}";')
                out.append(f'  src: url("/fonts/{face["file"]}") format("woff2");')
                out.append(f'  font-weight: {face["weight"]};')
                out.append(f'  font-style: {"italic" if face["italic"] else "normal"};')
                out.append("  font-display: block;")
                out.append("}")
            out.append("")
    CSS.write_text("\n".join(out))


LICENCE_INTRO = """Fonts bundled in public/fonts/
==============================

Every file here is a latin + latin-ext subset of a freely licensed family,
rebuilt by scripts/build-fonts.py: variable sources were pinned to static
instances, CFF outlines were converted to TrueType, and families that ship no
tabular figures carry a `tnum` feature synthesised by the build. All of that is
modification, so per OFL-FAQ 2.6 and 5.4 no family here ships under a Reserved
Font Name. Two families whose keys predate that rule were renamed rather than
dropped; their upstream copyright notices are intact, below and in the files.

"""


def write_licences(fams) -> None:
    rows = []
    for fam in fams:
        head = fam.name
        if fam.based_on:
            head += f"  (subset of {fam.based_on})"
        rows.append(f"  {head}\n      {fam.copyright}\n      — {fam.licence}"
                    + (f"; upstream Reserved Font Name(s): {', '.join(fam.reserved)}"
                       if fam.reserved else ""))
    text = LICENCE_INTRO + "\n".join(rows) + "\n\n"
    old = (OUT / "LICENSES.txt")
    # The licence texts themselves are stable; carry them over from the file
    # already in the tree rather than re-downloading three legal documents.
    if old.exists():
        previous = old.read_text()
        marker = previous.find("-" * 79)
        if marker != -1:
            text += previous[marker:]
    old.write_text(text)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--offline", action="store_true",
                        help="build from the source cache; never hit the network")
    parser.add_argument("--only", nargs="*", help="build only these family keys")
    args = parser.parse_args()

    fams = FAMILIES
    if args.only:
        fams = [f for f in FAMILIES if f.key in set(args.only)]

    keys = [f.key for f in FAMILIES]
    if len(keys) != len(set(keys)):
        raise SystemExit("duplicate family key")

    SRC.mkdir(parents=True, exist_ok=True)
    WORK.mkdir(parents=True, exist_ok=True)
    if OUT.exists() and not args.only:
        for f in OUT.glob("*.woff2"):
            f.unlink()
    OUT.mkdir(parents=True, exist_ok=True)

    for fam in fams:
        print(f"→ {fam.name} ({fam.key})")
        acquire(fam, args.offline)
        for style, weight, italic in STYLES:
            if style == "italic" and fam.source.italic is None:
                continue
            fam.faces[style] = build_face(fam, style, weight, italic)

    if args.only:
        print("\n--only build: manifest, css and licences left untouched")
        return

    write_manifest(fams)
    write_css(fams)
    write_licences(fams)

    files = sum(len(f.faces) for f in fams)
    total = sum(sum(x["bytes"] for x in f.faces.values()) for f in fams)
    synth = [f.key for f in fams if any(x["synthetic_tnum"] for x in f.faces.values())]
    no_italic = [f.key for f in fams if "italic" not in f.faces]
    print(f"\n{len(fams)} families, {files} faces, {total/1024/1024:.2f} MiB")
    print(f"synthetic tnum ({len(synth)}): {', '.join(synth)}")
    print(f"masthead-only, no italic ({len(no_italic)}): {', '.join(no_italic)}")


if __name__ == "__main__":
    main()
