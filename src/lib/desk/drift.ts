/**
 * WHERE THE LIVE DESTINATION AND THE AUTHORED FILE HAVE PARTED.
 *
 * ── THE PROBLEM THIS EXISTS TO MAKE VISIBLE ─────────────────────────
 *
 * The desk edits the database. `src/lib/destinations.ts` is the authored text
 * that SEEDS a database. `scripts/seed-destinations.mjs` deliberately never
 * overwrites a row that already exists — it says so at length in its own
 * header, and there is no `--overwrite` flag on it — because a curator's edit
 * in the tool outranks the module and silently reverting her work is the
 * failure this house cares about most.
 *
 * The consequence is a permanent, invisible divergence. Once anybody edits a
 * destination at the desk, the file and the database differ forever, and until
 * this module the ONLY place that fact appeared was one line in a deploy log:
 *
 *   [seed-destinations] voice havana v1 differs from src/lib/destinations.ts
 *   — left in force
 *
 * A log line on a deploy nobody watches is not a product telling you something.
 *
 * ── WHAT DRIFT MEANS, AND WHAT IT DOES NOT ──────────────────────────
 *
 * NEITHER SIDE IS WRONG. The database is what SHIPS: a Revelle issued today
 * carries the row, not the file. The file is what SEEDS A FRESH ENVIRONMENT:
 * a new database, a colleague's machine, a restored backup. So a difference
 * left un-reconciled means a rebuild would silently revert a curator's work —
 * which is exactly the thing the seeder's no-overwrite rule was protecting
 * against, arriving by the other door.
 *
 * ── THE SPLIT THAT GOVERNS THIS WHOLE MODULE ────────────────────────
 *
 * PROSE is surfaced and never offered as an edit. The name, the tagline, the
 * premise and every field of the voice are authored ESSAYS with arguments
 * around them — `src/lib/destinations.ts` is 4,900 lines and most of it is
 * reasoning a generator would destroy. There is no exporter here and there
 * must never be one: a "write the desk's copy back to the file" button emits
 * a data literal and deletes the argument beside it, and rule 10 of CLAUDE.md
 * exists because a deleted argument gets re-made. There is no importer either
 * — overwriting the row from the file is precisely what the seeder refuses.
 * So prose drift is REPORTED, both sides shown, and reconciled by a person.
 *
 * TAGS are mechanical. A tone code and a weight carry no argument, they are
 * data, and `DESTINATION_TONES` is a flat list of `{ code, weight }`. So where
 * the tags differ, this module ALSO emits the file's own literal with the
 * desk's values in it — a curator's judgement made at the desk can then be
 * committed as a code change, which is the loop the whole thing was missing.
 * Emitting text is not writing a file: a person still reads it, pastes it, and
 * puts it through review.
 *
 * ── WHAT IS DELIBERATELY NOT COMPARED ───────────────────────────────
 *
 *   THE LOOK (`world.tokens` against `Destination.look`). It is mechanical and
 *   it could be compared, but a palette diff is a colour picker's job and
 *   showing sixteen hex pairs would bury the two differences that matter. It
 *   is named on screen as un-compared rather than left to be assumed.
 *
 *   FACET TAGS OUTSIDE `voice_tone`. The file authors NONE — `DESTINATION_TONES`
 *   is the only tag list in it, and `taggingVocabulary("world")` offers many
 *   more dimensions at the desk. Those tags have no authored counterpart, so
 *   there is nothing to differ FROM; they are reported as live-only rather
 *   than dressed up as drift, and no literal is emitted for them because there
 *   is no shape in the file to paste one into. Inventing one here would be
 *   inventing a file format from the reporting side, which is backwards.
 *
 * Framework-free and database-free: pure functions over values the caller has
 * already fetched, so the comparison is testable and the SQL stays in the page.
 */

import { DESTINATIONS, DESTINATION_TONES } from "@/lib/destinations";
import { voiceToForm, type VoiceFormValues } from "@/lib/desk/voice-form";
import type { Destination } from "@/lib/tokens";

/* ── the file, indexed by slug ─────────────────────────────────────── */

/*
 * Both maps are `as const satisfies Record<…>` at their definition, so the
 * shape is already proven there. These two aliases widen the key to `string`,
 * because a `world` row's slug is whatever is in the database — it may name a
 * destination the file has never heard of, and that is a real state (a
 * curator can start one at the desk) rather than an error.
 */
const FILE: Readonly<Record<string, Destination>> = DESTINATIONS;
const FILE_TONES: Readonly<Record<string, readonly { code: string; weight: number }[]>> =
  DESTINATION_TONES;

/** The authored destination for a slug, or null when the file has none. */
export function authored(slug: string): Destination | null {
  return Object.hasOwn(FILE, slug) ? FILE[slug] : null;
}

/* ── tone weights, read defensively ────────────────────────────────── */

export type ToneTag = { code: string; weight: number };

/**
 * Weights are `numeric` in the database, and node-postgres hands `numeric`
 * back as a STRING — the same trap the destinations list already documents for
 * `count(*)`. Everything that arrives here is therefore treated as unknown and
 * parsed, whether it came from a `json_agg` or from a `weight::text` column.
 */
function toWeight(value: unknown): number | null {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : NaN;
  // Six places is far beyond any weight a curator types and well inside what a
  // float can hold exactly enough to compare; it exists to stop 0.7 read back
  // as 0.7000000000000001 from reading as a curator's edit.
  return Number.isFinite(n) ? Math.round(n * 1e6) / 1e6 : null;
}

/**
 * A live tone list out of whatever the query produced.
 *
 * The database is unreachable from a laptop by design, so this was written
 * against the schema and not against a result set. It therefore assumes
 * nothing: not that the value is an array, not that its entries are objects,
 * not that a weight is a number. Anything unreadable is dropped rather than
 * guessed at, because a guessed weight would print into a code block somebody
 * commits.
 */
export function readToneTags(value: unknown): ToneTag[] {
  if (!Array.isArray(value)) return [];
  const out: ToneTag[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const record = item as Record<string, unknown>;
    const code = typeof record.code === "string" ? record.code.trim() : "";
    if (code === "") continue;
    const weight = toWeight(record.weight);
    if (weight === null) continue;
    out.push({ code, weight });
  }
  return out;
}

/* ── prose ─────────────────────────────────────────────────────────── */

export type ProseDrift = {
  /** Stable across renders; used as a React key. */
  key: string;
  label: string;
  /** `row` is the world row itself; `voice` is the published voice document. */
  source: "row" | "voice";
  /** Where the live half lives, named so a reader can go and look at it. */
  where: string;
  file: string;
  live: string;
};

/** The file's word for the field, then the column the seeder puts it in. */
const ROW_FIELDS: readonly {
  key: string;
  label: string;
  where: string;
  from: (destination: Destination) => string;
  live: (row: LiveDestination) => unknown;
}[] = [
  {
    key: "name",
    label: "Name",
    where: "world.name",
    from: (d) => d.name,
    live: (r) => r.name,
  },
  {
    key: "tagline",
    label: "Tagline",
    where: "world.tagline",
    from: (d) => d.tagline,
    live: (r) => r.tagline,
  },
  {
    // `premise` in the file, `description` in the database. The two names are
    // reconciled in exactly one place — the insert in seed-destinations.mjs —
    // and it is written down again here, because a reader of this screen will
    // look for "premise" and find a column called something else.
    key: "premise",
    label: "Premise",
    where: "world.description",
    from: (d) => d.premise,
    live: (r) => r.description,
  },
];

/**
 * The voice, field by field, in the curator's own vocabulary.
 *
 * `voiceToForm` is reused rather than a second flattening being written here:
 * it already turns a voice — or a half-written one, or a malformed one, which
 * is the case that matters when the value came out of a jsonb column — into
 * the same flat set of strings the voice form edits. Comparing what the
 * curator SEES is the only comparison she can act on, and it means a key
 * re-ordering inside the jsonb can never read as a change to the words.
 *
 * The labels are the voice form's own, so a difference reported here can be
 * found on the screen that edits it without translating anything.
 */
const VOICE_FIELDS: readonly { key: keyof VoiceFormValues; label: string }[] = [
  { key: "speaker", label: "Speaker" },
  { key: "selfReference", label: "It calls itself" },
  { key: "audience", label: "Audience" },
  { key: "addressMode", label: "How it addresses" },
  { key: "addressNote", label: "…and what that means here" },
  { key: "register", label: "Register" },
  { key: "formality", label: "Formality" },
  { key: "cadence", label: "Cadence" },
  { key: "typicalWords", label: "Typical sentence, in words" },
  { key: "maxWords", label: "Longest sentence, in words" },
  { key: "punctuation", label: "Punctuation" },
  { key: "orthography", label: "On the page" },
  { key: "humourMode", label: "Humour" },
  { key: "humourMechanism", label: "…and its mechanism" },
  { key: "lexicon", label: "Lexicon" },
  { key: "formulae", label: "Sentence shapes it reuses" },
  { key: "banned", label: "Words that must never appear" },
  { key: "signOffs", label: "How a piece ends" },
  { key: "always", label: "Always" },
  { key: "never", label: "Never" },
  { key: "breaksCharacterFor", label: "Written straight, with no voice at all" },
  { key: "exemplars", label: "Lines from this house" },
  { key: "rejected", label: "Lines that were rejected, and why" },
];

/**
 * Trailing whitespace and Windows line endings are not a curator's judgement.
 * Everything else — capitalisation, a comma, a word — is.
 */
function normalise(value: unknown): string {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim() : "";
}

/* ── the copy predicate, and its ONE owner ─────────────────────────── */

/**
 * WHERE THE MEMBER-FACING COPY OF ONE ROOM HAS PARTED FROM THE FILE.
 *
 * The name, the tagline and the premise — nothing else. Split out of
 * `destinationDrift` and exported because THREE surfaces now have to agree
 * about what "the copy has drifted" means, and rule 21 says a fact two
 * surfaces must agree on has exactly one owner:
 *
 *   · this module's own report, on a destination's page;
 *   · `copyAgrees` / `copyDrift` in src/app/api/health/route.ts;
 *   · the reconciliation desk, /desk/reconcile.
 *
 * IT WAS ALREADY TWO. The health route compared with a bare `!==` on the raw
 * column while this module compared through `normalise`, so a premise
 * differing only by a trailing newline was drift on one surface and not on
 * the other — the exquisite failure rule 21 describes, where both look right
 * and mean different things. The reconciliation table records a verdict
 * against a FIELD, and a field that is drifted here and clean there cannot be
 * reconciled at all: it would show as settled on one screen and unreconciled
 * on the next, forever.
 *
 * So the predicate is here, once, and the two other surfaces call it. Trailing
 * whitespace is not a curator's judgement; everything else is.
 */
export function copyDrift(live: LiveDestination): ProseDrift[] {
  const file = authored(live.slug);
  if (!file) return [];
  const out: ProseDrift[] = [];
  for (const field of ROW_FIELDS) {
    const fileValue = normalise(field.from(file));
    const liveValue = normalise(field.live(live));
    if (fileValue !== liveValue) {
      out.push({
        key: field.key,
        label: field.label,
        source: "row",
        where: field.where,
        file: fileValue,
        live: liveValue,
      });
    }
  }
  return out;
}

/**
 * The same predicate over a whole catalogue, rendered the way /api/health
 * names a drifting room: `westhampton-1976 (tagline, premise)`.
 *
 * The STRING is here rather than in the route for the same reason the
 * comparison is: the reconciliation desk quotes the health line back at a
 * person ("this is what the detector is still reporting"), and two spellings
 * of one report is how a person concludes the screens disagree.
 *
 * A room the file does not author contributes nothing — there is no other side
 * to differ from, which is exactly what `copyDrift` already returns for it.
 * Retired rooms are the CALLER'S to exclude: this module cannot see a status
 * and must not pretend to.
 */
export function copyDriftReport(
  live: readonly LiveDestination[]
): string[] {
  return live.flatMap((row) => {
    const fields = copyDrift(row);
    return fields.length > 0
      ? [`${row.slug} (${fields.map((field) => field.key).join(", ")})`]
      : [];
  });
}

/** The three fields this house reconciles, in the file's own vocabulary. */
export const COPY_FIELDS = ROW_FIELDS.map((field) => field.key);

/** The authored value of one copy field, or null when the file has no room. */
export function authoredCopy(slug: string, field: string): string | null {
  const file = authored(slug);
  if (!file) return null;
  const found = ROW_FIELDS.find((entry) => entry.key === field);
  return found ? normalise(found.from(file)) : null;
}

/* ── tones ─────────────────────────────────────────────────────────── */

export type ToneDrift = {
  code: string;
  /** null when the file does not tag this destination with the tone at all. */
  file: number | null;
  /** null when the tag is not on the row at the desk. */
  live: number | null;
};

/* ── the whole report ──────────────────────────────────────────────── */

export type DestinationDrift = {
  slug: string;
  /** False when src/lib/destinations.ts authors no destination with this slug. */
  authored: boolean;
  /** Prose differences. Surfaced only — see the header. */
  prose: ProseDrift[];
  /** Tag differences. These get a literal, below. */
  tones: ToneDrift[];
  /** Live tones, whether or not they drift — what the literal is built from. */
  liveTones: ToneTag[];
  /**
   * Facet tags on the row in dimensions the file does not author. Not drift:
   * there is nothing on the other side to differ from.
   */
  unauthoredTags: number;
  /**
   * False when there is no published voice to compare — that is "look only",
   * which db/004 treats as legal, and it is not a difference.
   */
  voiceCompared: boolean;
};

export type LiveDestination = {
  slug: string;
  name?: string | null;
  tagline?: string | null;
  description?: string | null;
  /** The published voice document, as it came out of the jsonb column. */
  voice?: unknown;
  /** Every voice_tone tag on the row. */
  tones?: unknown;
  /** How many tags the row carries in dimensions the file does not author. */
  unauthoredTags?: number | string | null;
};

export function destinationDrift(live: LiveDestination): DestinationDrift {
  const slug = live.slug;
  const file = authored(slug);
  const liveTones = readToneTags(live.tones);
  const unauthored = Number(live.unauthoredTags ?? 0);

  const empty: DestinationDrift = {
    slug,
    authored: false,
    prose: [],
    tones: [],
    liveTones,
    unauthoredTags: Number.isFinite(unauthored) ? unauthored : 0,
    voiceCompared: false,
  };

  if (!file) return empty;

  // The row half comes from `copyDrift` rather than being computed again
  // here: /api/health and /desk/reconcile ask the same question of the same
  // three fields, and the day this loop and that function differ by a `trim`
  // is the day a reconciled field reads as unreconciled on the next screen.
  const prose: ProseDrift[] = copyDrift(live);

  // `undefined` means the caller did not fetch a voice; `null` means the query
  // ran and there is none published. Neither is a difference, and the two are
  // kept apart so the screen can say which it is.
  const voiceCompared = live.voice !== undefined && live.voice !== null;
  if (voiceCompared) {
    const fileVoice = voiceToForm(file.voice);
    const liveVoice = voiceToForm(live.voice);
    for (const field of VOICE_FIELDS) {
      const a = normalise(fileVoice[field.key]);
      const b = normalise(liveVoice[field.key]);
      if (a !== b) {
        prose.push({
          key: `voice.${field.key}`,
          label: field.label,
          source: "voice",
          where: `world_voice.voice → ${field.key}`,
          file: a,
          live: b,
        });
      }
    }
  }

  const fileTones = Object.hasOwn(FILE_TONES, slug) ? FILE_TONES[slug] : [];
  const byCode = new Map<string, ToneDrift>();
  for (const tone of fileTones) {
    const weight = toWeight(tone.weight);
    byCode.set(tone.code, { code: tone.code, file: weight, live: null });
  }
  for (const tone of liveTones) {
    const found = byCode.get(tone.code);
    if (found) found.live = tone.weight;
    else byCode.set(tone.code, { code: tone.code, file: null, live: tone.weight });
  }

  const tones = [...byCode.values()]
    .filter((tone) => tone.file !== tone.live)
    .sort((a, b) => a.code.localeCompare(b.code));

  return {
    slug,
    authored: true,
    prose,
    tones,
    liveTones,
    unauthoredTags: Number.isFinite(unauthored) ? unauthored : 0,
    voiceCompared,
  };
}

/** True when there is anything at all for a person to reconcile. */
export function hasDrift(report: DestinationDrift): boolean {
  return report.prose.length > 0 || report.tones.length > 0;
}

/**
 * A drift report in a handful of words, for a cell in the library list.
 *
 * Short on purpose. The list says WHETHER and WHERE; the destination's own
 * page says what the two sides actually say, because the answer is often two
 * paragraphs and a paragraph does not go in a table cell.
 */
export function driftSummary(report: DestinationDrift): string[] {
  if (!report.authored) return [];
  const parts: string[] = [];
  for (const item of report.prose) {
    if (item.source === "row") parts.push(item.label.toLowerCase());
  }
  const voice = report.prose.filter((item) => item.source === "voice").length;
  if (voice > 0) parts.push(`voice (${voice} field${voice === 1 ? "" : "s"})`);
  if (report.tones.length > 0) {
    parts.push(`${report.tones.length} tone${report.tones.length === 1 ? "" : "s"}`);
  }
  return parts;
}

/* ── the literal ───────────────────────────────────────────────────── */

/** `1`, not `1.0`; `0.9`, not `0.90`. What a person would have typed. */
function formatWeight(weight: number): string {
  return String(Math.round(weight * 1e6) / 1e6);
}

/**
 * The desk's tone tags, as the line of TypeScript that would put them in
 * src/lib/destinations.ts.
 *
 * The shape is copied from the file itself and must stay copied from it:
 *
 *   { code: "good_natured", weight: 1 },
 *   { code: "lingers", weight: 0.9 },
 *
 * Two indents, a trailing comma on every line including the last, the code
 * double-quoted, the weight bare. Sorted heaviest first and then by code,
 * which is the order every authored `*_TONES` array is already in — so a paste
 * produces a small diff about weights rather than a large one about ordering.
 *
 * The array's NAME is not emitted, and the comment says which array to paste
 * into instead. The file names its arrays by hand — `HAVANA_TONES`, but
 * `LAS_VEGAS_1960_TONES` for the slug `las-vegas` and `COTE_DAZUR_1962_TONES`
 * for `cote-dazur` — so a name derived from a slug would be wrong for a third
 * of them, and a confidently wrong identifier in a block somebody pastes is
 * worse than no identifier at all.
 *
 * `code` is put through JSON.stringify rather than wrapped in quotes, because
 * it arrives from the database and a value that is not a bare identifier must
 * not be able to close the string it is printed into.
 */
export function toneLiteral(slug: string, tones: readonly ToneTag[]): string {
  const sorted = [...tones].sort(
    (a, b) => b.weight - a.weight || a.code.localeCompare(b.code)
  );
  const head = [
    `// src/lib/destinations.ts — the tones for ${JSON.stringify(slug)}, as the`,
    `// desk has them. Paste over the body of the *_TONES array that`,
    `// DESTINATION_TONES maps this slug to, and commit it as a change.`,
  ];
  const body =
    sorted.length === 0
      ? ["  // The desk carries no tone tags for this destination."]
      : sorted.map(
          (tone) => `  { code: ${JSON.stringify(tone.code)}, weight: ${formatWeight(tone.weight)} },`
        );
  return [...head, ...body].join("\n");
}
