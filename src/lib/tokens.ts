/**
 * The house theme — the entire style surface of Revelle, as DATA.
 *
 * Why a closed set of named values rather than CSS: a world's look is data, and
 * it will one day be authored per world (see world.tokens in db/001-schema.sql)
 * and merged over this. A token set that conforms to this shape can be ugly,
 * but it cannot leak arbitrary CSS or break a layout. Anything that could break
 * layout — spacing scale, grid, measure — is deliberately NOT here; that
 * belongs to the stylesheet, which owns whether the page still fits.
 *
 * Framework-free on purpose. No next/font, no React.
 *
 * ── A destination is a LOOK and a VOICE ───────────────────────────────
 * The first half of this file is the look: palette and type, consumed by the
 * RENDERER. The second half is the voice: how every written piece reads,
 * consumed by the WRITER. They are two halves of one `Destination` object
 * because they are two halves of one idea — an invitation that is set in the
 * right face and worded in the wrong register is not half right, it is wrong.
 * See docs/copy.md, "The voice is half the destination".
 *
 * ── The two hard rules of this identity ───────────────────────────────
 *  1. NO ITALICS. Anywhere. The owner reads a slanted face as machine-made.
 *     This is enforced three ways: no italic @font-face is declared, so the
 *     browser has nothing real to reach for; a global rule sets font-style to
 *     normal on em/i/cite/address/blockquote so it cannot synthesise an
 *     oblique either; and there is no italic token here to ask for.
 *  2. Restraint. One or two elements, never a stack of shapes. The bone arc is
 *     approved and stays; it is the only ornament in the system.
 */

export type Palette = {
  /** Daylight — plaster, terracotta, brass. */
  ground: string;
  ground2: string;
  ink: string;
  inkSoft: string;
  inkFaint: string;
  rule: string;
  aqua: string;
  oxblood: string;
  gold: string;
  /** Dusk — used by any surface that commits to dark in both themes. */
  night: string;
  night2: string;
  nightInk: string;
  nightSoft: string;
  nightAqua: string;
  nightOxblood: string;
  /** The arc. Bone, always. */
  bone: string;
};

export type TypeRoles = {
  display: string;
  body: string;
  mono: string;
};

export type Theme = {
  key: string;
  palette: Palette;
  /** Only the dark-mode overrides; everything else is inherited from palette. */
  paletteDark: Partial<Palette>;
  type: TypeRoles;
};

/**
 * Every stack begins with a face this repo ships itself (public/fonts, built by
 * scripts/build-fonts.py and content-hashed). The system names behind it are
 * for the moment a webfont fails, not for normal service.
 */
const TYPE: TypeRoles = {
  display: '"Bodoni Moda", Didot, "Bodoni MT", Georgia, serif',
  body: '"Karla", "Helvetica Neue", Arial, sans-serif',
  mono: '"Space Mono", ui-monospace, Menlo, monospace',
};

export const HOUSE: Theme = {
  key: "house",
  type: TYPE,
  palette: {
    ground: "#EFE3D2",
    ground2: "#E7D7C1",
    ink: "#2A2018",
    inkSoft: "#5E5245",
    inkFaint: "#8E8173",
    rule: "#D4C3AC",
    aqua: "#2F6675",
    oxblood: "#B4522C",
    gold: "#B98B33",
    night: "#16242E",
    night2: "#101B23",
    nightInk: "#F0E4D3",
    nightSoft: "#B0A492",
    nightAqua: "#6FB3C2",
    nightOxblood: "#E08050",
    bone: "#EDEBE3",
  },
  paletteDark: {
    ground: "#101B23",
    ground2: "#16242E",
    ink: "#F0E4D3",
    inkSoft: "#B0A492",
    inkFaint: "#7E7466",
    rule: "#2E3F4B",
    aqua: "#6FB3C2",
    oxblood: "#E08050",
    gold: "#DFAE55",
  },
};

/** camelCase token name -> the CSS custom property it becomes. */
function cssName(key: string): string {
  return `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
}

function declarations(values: Partial<Palette>): string {
  return Object.entries(values)
    .map(([k, v]) => `  ${cssName(k)}: ${v};`)
    .join("\n");
}

/**
 * The theme as a stylesheet.
 *
 * Written once into the document head by the root layout rather than kept as a
 * hand-maintained :root block, so that the TypeScript above is the only place a
 * colour is decided. When a world brings its own tokens, this same function
 * renders them under a scoped selector.
 *
 * Dark handling follows the three-state rule: the full light palette on bare
 * :root, only the overrides under prefers-color-scheme (guarded so an explicit
 * light choice wins), and the same overrides again under [data-theme="dark"].
 */
export function themeCss(theme: Theme = HOUSE, selector = ":root"): string {
  const dark = declarations(theme.paletteDark);
  return `${selector} {
${declarations(theme.palette)}
  --display: ${theme.type.display};
  --body: ${theme.type.body};
  --mono: ${theme.type.mono};
}

@media (prefers-color-scheme: dark) {
  ${selector}:not([data-theme="light"]) {
${dark}
  }
}

${selector}[data-theme="dark"] {
${dark}
}`;
}

/* ─────────────────────────────────────────────────────────────────────
 * THE VOICE HALF
 *
 * Same discipline as the palette above: a voice is DATA, not a paragraph of
 * instructions and not a prompt someone tuned once and pasted. The reason is
 * the same reason the palette is data — it has to be authorable by a curator
 * who does not write code, storable in a row, versionable, and diffable. A
 * voice that lives inside a prompt string is a voice nobody can edit safely.
 *
 * ── WHY THESE FIELDS AND NOT OTHERS ──────────────────────────────────
 *
 * The set was chosen against a working voice rather than invented: the Sylvan
 * Motor Lodge persona in the sibling daily-program app, which has shipped to
 * real people for two summers and was written entirely by hand. Every field
 * below is something that persona actually does, and that a generated line
 * gets wrong when it is not told:
 *
 *   · It names itself the same way every time — "The Management", never "we",
 *     never "the lodge".                                    → speaker, selfReference
 *   · It has a fixed grammatical stance: institutional third person, the
 *     reader addressed impersonally.                        → address, audience
 *   · It reuses a handful of sentence FRAMES — "wishes to note that…",
 *     "regrets X but does not concede liability". The frames are most of what
 *     makes two lines sound like one house.                 → formulae
 *   · Its joke has one mechanism — a concession immediately withdrawn — and an
 *     LLM told only "dry, witty" will not find it.          → humour.mechanism
 *   · It calls things by house names: notices, not announcements.  → lexicon
 *   · It never uses an exclamation point. Not a preference, a rule. → never
 *   · And it BREAKS CHARACTER on purpose, exactly once: the opt-out message
 *     carries no joke, because it is the message people act on. A voice with
 *     no documented exit is a liability.                    → breaksCharacterFor
 *
 * ── EXEMPLARS ARE THE FIELD THAT MATTERS ─────────────────────────────
 *
 * Everything above is description, and description of a voice is weak: "dry,
 * clipped, faintly disreputable" describes half the destinations we will ever
 * write. "The house sleeps six and has slept nine." is one of them. Three real
 * lines steer a model further than three paragraphs of adjectives, so
 * `exemplars` is tagged by the kind of piece it belongs to and the prompt
 * assembler puts the matching kind first.
 *
 * `rejected` is the same instrument pointed the other way, and it is here
 * because docs/copy-brief.md is built entirely out of it: "Each of these was
 * written and rejected. Do not reintroduce them in new clothes." A line that is
 * nearly right and the reason it is wrong locates a voice more precisely than
 * a good line does, because it draws the near edge.
 *
 * ── WHAT IS DELIBERATELY NOT HERE ────────────────────────────────────
 *
 * No temperature, no model name, no prompt scaffolding, no "you are a helpful
 * assistant". Those belong to whatever calls a model, and putting them here
 * would make the curator's data file own an engineering decision. This module
 * makes no network calls and imports nothing.
 * ───────────────────────────────────────────────────────────────────── */

/**
 * The kinds of written piece a destination produces.
 *
 * NOT closed, and not an enum in the database either (see voice_piece_kind in
 * db/004). docs/copy.md is explicit that the pieces are the host's to choose
 * and that a multi-day getaway "could include something each morning" — a
 * vocabulary that is going to grow on taste is a list of rows, not a type that
 * needs a migration. This constant is the presentation order and the set the
 * curator's tool offers; the database is the authority on what exists.
 */
export const PIECE_KINDS = [
  "invitation",
  "menu_item",
  "notice",
  "house_note",
  "place_card",
  "game_rule",
  "bulletin",
  "heading",
  "sign_off",
] as const;

export type PieceKind = (typeof PIECE_KINDS)[number];

/**
 * Grammatical stance. Genuinely closed and structural — it decides the shape of
 * every sentence, and there are only so many people to speak in.
 */
export type AddressMode =
  | "second_person" // "You are expected Friday."
  | "third_person" // "Guests are reminded that…"
  | "collective_first" // "We do not discuss the second night."
  | "impersonal"; // "Breakfast is theoretical."

/**
 * How much ceremony the writing carries. Closed because it is a scale, and a
 * scale with more than five stops is a scale nobody can use consistently.
 */
export type Formality =
  | "ceremonial" // engraved, third person, no contractions
  | "formal" // a good hotel's notice board
  | "cordial" // a well-written note between people who know each other
  | "plain" // says the thing
  | "familiar"; // the way these people actually talk

/**
 * The mechanism, not the temperature. `mode` narrows the family; the mechanism
 * beside it is what makes the joke reproducible.
 */
export type HumourMode =
  | "none"
  | "dry"
  | "deadpan"
  | "arch"
  | "warm"
  | "absurd";

/** What a thing is CALLED here, and what it is called instead of. */
export type LexiconEntry = {
  /** The house's word. */
  term: string;
  /** What it refers to, for a curator who was not in the room. */
  gloss: string;
  /** The obvious words this one displaces. Written into the prompt as bans. */
  insteadOf?: readonly string[];
};

/** A real line, tagged with the piece it belongs to. The load-bearing field. */
export type Exemplar = {
  piece: PieceKind;
  text: string;
  /** Optional, for the curator. Never sent to a writer — the line is the brief. */
  note?: string;
};

/** A line that was nearly right. The near edge of the voice. */
export type RejectedLine = {
  text: string;
  /** One clause. "Names the feeling." "Explains its own joke." */
  why: string;
};

export type Voice = {
  /** Who is speaking, in one noun phrase. "The Management." "The house." */
  speaker: string;
  /**
   * The exact phrases the speaker uses for itself, in preference order. An
   * empty array is a real answer: this voice never refers to itself.
   */
  selfReference: readonly string[];
  /** What it calls the people it is written for. "Houseguests." "Members." */
  audience: string;
  address: { mode: AddressMode; note: string };

  /** The document this is pretending to be. One line, concrete. */
  register: string;
  formality: Formality;
  /** Rhythm as an instruction a writer can follow. */
  cadence: string;
  /**
   * The single most reliable lever on rhythm, and the one thing here that can
   * be checked mechanically. Internal only — see the "never count anything"
   * rule in docs/copy-brief.md, which governs customer-facing copy.
   */
  sentence: { typicalWords: number; maxWords: number };
  /** Marks it uses, and marks it does not. */
  punctuation: string;
  /**
   * Caps, numerals, dates, hours, glyphs. Where a generated line most often
   * breaks character while getting every word right — "8pm" in a house that
   * writes "eight o'clock" is a costume with a zip showing.
   */
  orthography: string;

  humour: { mode: HumourMode; mechanism: string };

  /** What things are called. The most transferable part of any voice. */
  lexicon: readonly LexiconEntry[];
  /** Sentence frames the house reuses. Two lines share a frame and rhyme. */
  formulae: readonly string[];
  /** Words that must never appear. Checked literally, so keep them literal. */
  banned: readonly string[];
  /** How a piece ends. Rotated, not sequenced. */
  signOffs: readonly string[];

  /** Imperative, positive. The rules that create the signature. */
  always: readonly string[];
  /** Imperative, negative. The rules that prevent the failure. */
  never: readonly string[];
  /**
   * When plain English wins. The message a guest has to ACT on — a change of
   * address, a medical note, a way out of a mailing list — is written straight.
   * Sylvan drops the persona for exactly one message and says so in a comment;
   * here it is a field, so the writer is told rather than trusted.
   */
  breaksCharacterFor: readonly string[];

  exemplars: readonly Exemplar[];
  rejected: readonly RejectedLine[];
};

/**
 * A destination: one look, one voice, one object.
 *
 * The database equivalent is a `world` row (look in world.tokens, voice in a
 * versioned world_voice row — db/004). This type is what a curator authors and
 * what both consumers read.
 */
export type Destination = {
  /** Stable slug. Matches world.slug. */
  key: string;
  /** "WESTHAMPTON, 1976" */
  name: string;
  /** "Vintage summer glamour. Very questionable houseguests." */
  tagline: string;
  /**
   * The scene, in the register of docs/copy.md's "rule for writing a
   * destination": a place and a time, then concrete details, no adjective
   * naming the feeling. This is what the writer is standing in.
   */
  premise: string;
  look: Theme;
  voice: Voice;
  /**
   * Which published version of the voice this is. Matches world_voice.version.
   * A destination's voice must not drift under a Revelle that has already been
   * issued in it, so the version travels with the text everywhere.
   */
  voiceVersion: number;
};

/* ── prompt assembly ───────────────────────────────────────────────────
 *
 * Pure: tokens in, text out. No model, no client, no API key, no async. That
 * is what makes the interesting half testable — the assembled prompt for a
 * destination is a string a human can read and a curator can approve, which is
 * the only review step that catches a bad voice before a customer does.
 *
 * The prompt is written in the same plain register as the rest of the house:
 * no markdown emphasis, no italics (rule 1 at the top of this file applies to
 * everything this repo emits), headers in caps because caps survive being
 * concatenated into someone else's template.
 */

function bullet(lines: readonly string[]): string {
  return lines.map((l) => `  - ${l}`).join("\n");
}

function block(title: string, body: string): string {
  return body.trim().length === 0 ? "" : `${title}\n${body}`;
}

function lexiconLines(lexicon: readonly LexiconEntry[]): string {
  return lexicon
    .map((e) => {
      const not =
        e.insteadOf && e.insteadOf.length > 0
          ? ` Not: ${e.insteadOf.join(", ")}.`
          : "";
      return `  - ${e.term} — ${e.gloss}.${not}`;
    })
    .join("\n");
}

/**
 * `labelled` off for the block that matches the piece being written — the
 * heading above it already says what they are, and a column of identical
 * prefixes is noise a model has to read past to reach the line.
 */
function exemplarLines(
  exemplars: readonly Exemplar[],
  labelled: boolean
): string {
  return exemplars
    .map((e) => (labelled ? `  ${e.piece}: ${e.text}` : `  ${e.text}`))
    .join("\n");
}

/**
 * The voice, as the fragment you put in front of a model.
 *
 * `piece` does one thing and it matters: exemplars of the kind being written
 * are hoisted above the rest. A model shown four invitation lines and then a
 * menu writes invitations; shown the same nine lines in authoring order it
 * averages them.
 */
export function voicePrompt(voice: Voice, piece?: PieceKind): string {
  const matching = piece
    ? voice.exemplars.filter((e) => e.piece === piece)
    : [];
  const rest = voice.exemplars.filter((e) => !matching.includes(e));

  return [
    block(
      "WHO IS SPEAKING",
      [
        `  ${voice.speaker}`,
        voice.selfReference.length > 0
          ? `  It calls itself: ${voice.selfReference.join(", ")}.`
          : "  It never refers to itself.",
        `  It is writing for: ${voice.audience}.`,
        `  Person: ${voice.address.mode.replace(/_/g, " ")}. ${voice.address.note}`,
      ].join("\n")
    ),
    block(
      "HOW IT READS",
      [
        `  Register: ${voice.register}`,
        `  Formality: ${voice.formality}.`,
        `  Cadence: ${voice.cadence}`,
        `  Length: about ${voice.sentence.typicalWords} words a sentence, never more than ${voice.sentence.maxWords}.`,
        `  Punctuation: ${voice.punctuation}`,
        `  On the page: ${voice.orthography}`,
        `  Humour: ${voice.humour.mode}. ${voice.humour.mechanism}`,
      ].join("\n")
    ),
    block("WHAT THINGS ARE CALLED HERE", lexiconLines(voice.lexicon)),
    block("SENTENCE SHAPES THIS HOUSE REUSES", bullet(voice.formulae)),
    // Only the outright bans. The words a lexicon entry displaces stay
    // attached to the entry that displaces them — "the music" is not a
    // forbidden phrase in general, it is the wrong name for one thing.
    block(
      "WORDS THAT MUST NOT APPEAR",
      voice.banned.length > 0 ? `  ${voice.banned.join(", ")}` : ""
    ),
    block("HOW A PIECE ENDS", bullet(voice.signOffs)),
    block("ALWAYS", bullet(voice.always)),
    block("NEVER", bullet(voice.never)),
    block(
      "WRITE THIS STRAIGHT, WITH NO VOICE AT ALL",
      bullet(voice.breaksCharacterFor)
    ),
    matching.length > 0
      ? block(
          `LINES FROM THIS HOUSE — ${piece?.replace(/_/g, " ").toUpperCase()}`,
          exemplarLines(matching, false)
        )
      : block("LINES FROM THIS HOUSE", exemplarLines(rest, true)),
    matching.length > 0
      ? block("LINES FROM THIS HOUSE — OTHER PIECES", exemplarLines(rest, true))
      : "",
    block(
      "LINES THAT WERE REJECTED, AND WHY",
      voice.rejected.map((r) => `  ${r.text}\n    Rejected: ${r.why}`).join("\n")
    ),
  ]
    .filter((s) => s.length > 0)
    .join("\n\n");
}

/** What this particular piece has to do. Everything here is about the job. */
export type WriterBrief = {
  piece: PieceKind;
  /** The job, in the curator's words. "Ask six people to a house for Labor Day." */
  ask: string;
  /** Facts the piece must carry: an address, an hour, a date, names. */
  facts?: readonly string[];
  /** A ceiling, when the piece has a physical size. A place card is not a page. */
  maxWords?: number;
  /**
   * WHERE THE WRITER SPENDS ITS ATTENTION — her emphasis, resolved.
   *
   * "What do you want more of" is the only question on the quiz that names a
   * deliverable, and half of what it says is an instruction to whoever writes
   * the paper rather than to whoever picks from the pool: The Moment is the
   * centrepiece, The Prep is short, The Ending has to survive being done again
   * next year, her own words are the material.
   *
   * The lines come from `writerAttention()` in src/lib/selection/emphasis.ts,
   * which owns the mapping. This module renders them; it does not decide them.
   */
  attention?: readonly string[];
  /**
   * HER FREE TEXT, VERBATIM, when the piece is allowed to use it.
   *
   * Passed only where a curator has decided it should be — an inside joke is
   * hers and putting it in every piece would spend it. It is never summarised
   * and never parsed on the way here; the writer is handed her sentence.
   */
  hers?: string | null;
};

/**
 * The whole prompt: a destination plus a job.
 *
 * This is the function the writer calls. It is pure, so the test for "did we
 * break the voice" is a string comparison, and the review step for a new
 * destination is reading its prompt out loud.
 */
export function writerPrompt(
  destination: Destination,
  brief: WriterBrief
): string {
  const { look, voice } = destination;

  return [
    "You are writing one piece of printed matter for a destination in the",
    "Revelle Société library. Write it in the destination's voice. The voice is",
    "not a costume: do not perform it, do not comment on it, do not explain it.",
    "",
    block(
      "THE DESTINATION",
      [
        `  ${destination.name}`,
        `  ${destination.tagline}`,
        `  ${destination.premise}`,
        `  Set in ${look.type.display.split(",")[0].replace(/"/g, "")} and ${look.type.body.split(",")[0].replace(/"/g, "")}, printed on paper.`,
        `  Voice version ${destination.voiceVersion}.`,
      ].join("\n")
    ),
    "",
    voicePrompt(voice, brief.piece),
    "",
    block(
      "THE PIECE",
      [
        `  Kind: ${brief.piece.replace(/_/g, " ")}`,
        `  Ask: ${brief.ask}`,
        brief.facts && brief.facts.length > 0
          ? `  These must appear, exactly:\n${bullet(brief.facts)}`
          : "",
        brief.maxWords ? `  Ceiling: ${brief.maxWords} words.` : "",
      ]
        .filter((s) => s.length > 0)
        .join("\n")
    ),
    "",
    // WHAT SHE IS BUYING. Its own block, after the piece and before the
    // instruction to return it, because it changes how the piece is written
    // rather than what the piece is. Absent entirely when she named nothing —
    // an empty heading would read as an instruction to do nothing in
    // particular, which is not the same as no instruction.
    brief.attention && brief.attention.length > 0
      ? block("WHAT SHE IS BUYING", bullet(brief.attention)) + "\n"
      : "",
    brief.hers && brief.hers.trim().length > 0
      ? block(
          "HER OWN WORDS",
          `  She wrote this, and it is the one part of the application nobody\n` +
            `  should paraphrase. Use it or leave it; do not improve it.\n\n` +
            `  ${brief.hers.trim()}`
        ) + "\n"
      : "",
    "Return the finished piece and nothing else. No preamble, no alternatives,",
    "no explanation of the choices, no offer to revise.",
  ].join("\n");
}
