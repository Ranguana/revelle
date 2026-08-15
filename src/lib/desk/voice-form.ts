/**
 * A VOICE, AS A FORM — and back again.
 *
 * The `Voice` type (src/lib/tokens.ts) is a document with about twenty fields,
 * six of which are lists of hand-written lines and three of which are lists of
 * small records. A curator must be able to author one without writing SQL or
 * TypeScript, which is the whole point of the destination screens.
 *
 * ── WHY LINE-PER-ENTRY TEXTAREAS AND NOT A ROW EDITOR ───────────────
 *
 * Because the content is writing, and writing is typed into a box. A repeatable
 * row widget with an "add" button turns nine exemplar lines into nine round
 * trips and a lot of clicking, and it is exactly the interaction a person
 * abandons halfway. A textarea holding one line per entry can be pasted into
 * from a document, reordered by moving a line, and read as a block — which is
 * how a voice is actually judged. The three structured lists use a single
 * separator (` | `) and say so above the box.
 *
 * ── WHY THE PARSER IS LENIENT AND THE DATABASE IS NOT ───────────────
 *
 * db/004 puts the shape gate at PUBLISH, not at save, and gives the reason: a
 * validator that fires on every keystroke of a draft is a validator that gets
 * worked around. This module mirrors that exactly. It never rejects; it takes
 * what is there and leaves the rest empty. `validate_voice()` in the database
 * is the only authority on whether a voice is publishable, and its errors —
 * which name the missing field and carry a hint — are shown verbatim. There is
 * deliberately NO second copy of those rules here.
 *
 * Framework-free.
 */

import {
  PIECE_KINDS,
  type AddressMode,
  type Exemplar,
  type Formality,
  type HumourMode,
  type LexiconEntry,
  type PieceKind,
  type RejectedLine,
  type Voice,
} from "@/lib/tokens";

export const ADDRESS_MODES: readonly AddressMode[] = [
  "second_person",
  "third_person",
  "collective_first",
  "impersonal",
];

export const FORMALITIES: readonly Formality[] = [
  "ceremonial",
  "formal",
  "cordial",
  "plain",
  "familiar",
];

export const HUMOUR_MODES: readonly HumourMode[] = [
  "none",
  "dry",
  "deadpan",
  "arch",
  "warm",
  "absurd",
];

/** The separator for the three structured lists. One character, unambiguous. */
export const SEP = "|";

function lines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function parts(line: string): string[] {
  return line.split(SEP).map((part) => part.trim());
}

function text(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function whole(form: FormData, key: string, fallback: number): number {
  const value = Number(text(form, key));
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

/**
 * The form as a voice document.
 *
 * Returns a plain object rather than a validated `Voice`, because a draft is
 * allowed to be half of one. The cast at the end is honest about that: the
 * shape is right, the contents are the curator's problem until she publishes.
 */
export function voiceFromForm(form: FormData): Voice {
  const lexicon: LexiconEntry[] = lines(text(form, "lexicon")).map((line) => {
    const [term = "", gloss = "", instead = ""] = parts(line);
    const insteadOf = instead
      .split(",")
      .map((word) => word.trim())
      .filter((word) => word.length > 0);
    return insteadOf.length > 0
      ? { term, gloss, insteadOf }
      : { term, gloss };
  });

  const exemplars: Exemplar[] = lines(text(form, "exemplars")).map((line) => {
    const [piece = "", body = "", note = ""] = parts(line);
    const entry: Exemplar = {
      piece: piece as PieceKind,
      text: body,
    };
    return note.length > 0 ? { ...entry, note } : entry;
  });

  const rejected: RejectedLine[] = lines(text(form, "rejected")).map((line) => {
    const [body = "", why = ""] = parts(line);
    return { text: body, why };
  });

  return {
    speaker: text(form, "speaker"),
    selfReference: lines(text(form, "selfReference")),
    audience: text(form, "audience"),
    address: {
      mode: text(form, "addressMode") as AddressMode,
      note: text(form, "addressNote"),
    },
    register: text(form, "register"),
    formality: text(form, "formality") as Formality,
    cadence: text(form, "cadence"),
    sentence: {
      typicalWords: whole(form, "typicalWords", 10),
      maxWords: whole(form, "maxWords", 20),
    },
    punctuation: text(form, "punctuation"),
    orthography: text(form, "orthography"),
    humour: {
      mode: text(form, "humourMode") as HumourMode,
      mechanism: text(form, "humourMechanism"),
    },
    lexicon,
    formulae: lines(text(form, "formulae")),
    banned: lines(text(form, "banned")),
    signOffs: lines(text(form, "signOffs")),
    always: lines(text(form, "always")),
    never: lines(text(form, "never")),
    breaksCharacterFor: lines(text(form, "breaksCharacterFor")),
    exemplars,
    rejected,
  };
}

/**
 * A stored voice as the strings the form's boxes hold.
 *
 * Defensive throughout: this reads a jsonb column that a draft may have left
 * half written, and a missing array must render as an empty box rather than
 * throw on the page that exists to fix it.
 */
export type VoiceFormValues = {
  speaker: string;
  selfReference: string;
  audience: string;
  addressMode: string;
  addressNote: string;
  register: string;
  formality: string;
  cadence: string;
  typicalWords: string;
  maxWords: string;
  punctuation: string;
  orthography: string;
  humourMode: string;
  humourMechanism: string;
  lexicon: string;
  formulae: string;
  banned: string;
  signOffs: string;
  always: string;
  never: string;
  breaksCharacterFor: string;
  exemplars: string;
  rejected: string;
};

type Loose = Record<string, unknown>;

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function objects(value: unknown): Loose[] {
  return Array.isArray(value)
    ? value.filter((v): v is Loose => typeof v === "object" && v !== null)
    : [];
}

export function voiceToForm(voice: unknown): VoiceFormValues {
  const v = (typeof voice === "object" && voice !== null ? voice : {}) as Loose;
  const address = (v.address ?? {}) as Loose;
  const humour = (v.humour ?? {}) as Loose;
  const sentence = (v.sentence ?? {}) as Loose;

  return {
    speaker: str(v.speaker),
    selfReference: list(v.selfReference).join("\n"),
    audience: str(v.audience),
    addressMode: str(address.mode),
    addressNote: str(address.note),
    register: str(v.register),
    formality: str(v.formality),
    cadence: str(v.cadence),
    typicalWords: String(sentence.typicalWords ?? ""),
    maxWords: String(sentence.maxWords ?? ""),
    punctuation: str(v.punctuation),
    orthography: str(v.orthography),
    humourMode: str(humour.mode),
    humourMechanism: str(humour.mechanism),
    lexicon: objects(v.lexicon)
      .map((entry) =>
        [
          str(entry.term),
          str(entry.gloss),
          list(entry.insteadOf).join(", "),
        ]
          // A trailing empty column is noise; drop it, and the parser puts it
          // back as an absent key rather than an empty array.
          .filter((part, index, all) => index < 2 || part.length > 0 || all.length < 3)
          .join(` ${SEP} `)
      )
      .join("\n"),
    formulae: list(v.formulae).join("\n"),
    banned: list(v.banned).join("\n"),
    signOffs: list(v.signOffs).join("\n"),
    always: list(v.always).join("\n"),
    never: list(v.never).join("\n"),
    breaksCharacterFor: list(v.breaksCharacterFor).join("\n"),
    exemplars: objects(v.exemplars)
      .map((entry) =>
        [str(entry.piece), str(entry.text), str(entry.note)]
          .filter((part, index) => index < 2 || part.length > 0)
          .join(` ${SEP} `)
      )
      .join("\n"),
    rejected: objects(v.rejected)
      .map((entry) => [str(entry.text), str(entry.why)].join(` ${SEP} `))
      .join("\n"),
  };
}

export const EMPTY_VOICE_FORM: VoiceFormValues = voiceToForm({});

/** For the hint under the exemplars box. The database is the authority. */
export const PIECE_KIND_CODES: readonly string[] = PIECE_KINDS;
