import type { ReactNode } from "react";

/**
 * The tone marks — one engraved drawing per tone in src/lib/voice.ts.
 *
 * Same construction as the occasion icons in src/app/plates.tsx: a 64-unit
 * viewBox, 1.25 strokes, no fills except a dot, and nothing that names a colour
 * — every stroke reads a token, so a mark cannot drift from the house palette.
 * They sit on the light ground and follow the reader's colour scheme like the
 * text around them.
 *
 * ── WHY THESE ARE MARKS AND NOT PICTURES ─────────────────────────────
 *
 * A tone is not a noun. Nobody can draw "wry" so that it reads as wry rather
 * than smug, and a tile that has to be decoded is worse than no tile at all. So
 * these are not illustrations of the tones, they are illustrations of TALK: a
 * spoken line is a rule, a person is a dot, a silence is a gap, loudness is an
 * arc leaving the mark, ceremony is a serif. Fifty marks built from six parts
 * read as one engraved set rather than fifty pieces of clip art, and the mark
 * carries the FEELING — fast, quiet, ornate, closed — while the label beside it
 * carries the meaning. Neither ships without the other.
 *
 * Where a tone had an honest object behind it — a glass raised, a bow tie, a
 * candle burnt low — it gets the object. Where it did not, it gets a restrained
 * abstract mark rather than a bad literal one.
 *
 * Keyed by tone code. A missing key draws nothing and the tile still works,
 * which is the correct failure: a tone with no mark is a plainer tile, not a
 * broken one.
 */
export const TONE_MARKS: Record<string, ReactNode> = {
  /* ── when something is funny ──────────────────────────────────────── */

  // A line with no modulation in it at all, and the outrageous thing sitting
  // above it, unremarked.
  deadpan: (
    <>
      <path
        d="M32 14 V32 M22 23 H42 M25 16 L39 30 M39 16 L25 30"
        stroke="var(--aqua)"
        strokeWidth="1.25"
      />
      <path d="M10 42 H54" stroke="var(--oxblood)" strokeWidth="1.25" />
      <path d="M10 48 H54" stroke="var(--gold)" strokeWidth="1" opacity="0.4" />
    </>
  ),

  // The announced line, full width. The good one is the short mutter beneath
  // it, aimed sideways.
  dry_aside: (
    <>
      <path d="M10 24 H46" stroke="var(--gold)" strokeWidth="1" opacity="0.8" />
      <path
        d="M28 40 H48 C51 40 52 42 51 44"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <circle cx="24" cy="40" r="1.8" fill="var(--aqua)" />
    </>
  ),

  // Two who are close, and the small jab that only works because they are.
  teasing: (
    <>
      <path
        d="M14 22 C22 12 42 12 50 22"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1.25"
      />
      <circle cx="18" cy="36" r="3.5" fill="none" stroke="var(--oxblood)" strokeWidth="1.25" />
      <circle cx="46" cy="36" r="3.5" fill="none" stroke="var(--oxblood)" strokeWidth="1.25" />
      <path
        d="M24 36 H38 M34 32 L38 36 L34 40"
        fill="none"
        stroke="var(--aqua)"
        strokeWidth="1.25"
      />
      <path d="M12 48 H52" stroke="var(--oxblood)" strokeWidth="1" opacity="0.4" />
    </>
  ),

  // A line that leaves the group and comes back into it. Nothing gets out.
  in_jokes: (
    <>
      <path
        d="M32 14 L50 46 L14 46 Z"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <g fill="var(--aqua)">
        <circle cx="32" cy="14" r="3" />
        <circle cx="50" cy="46" r="3" />
        <circle cx="14" cy="46" r="3" />
      </g>
      <path
        d="M32 30 V38 M28 34 H36 M29 31 L35 37 M35 31 L29 37"
        stroke="var(--gold)"
        strokeWidth="1"
      />
    </>
  ),

  // A straight premise that keeps going long after it should have stopped.
  absurd: (
    <>
      <path d="M8 44 H26" stroke="var(--oxblood)" strokeWidth="1.25" />
      <path
        d="M26 44 C40 44 46 38 46 30 C46 23 39 20 34 24 C29 28 33 35 40 34 C48 33 52 26 50 18"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <circle cx="50" cy="16" r="2" fill="var(--gold)" />
    </>
  ),

  // The remark that curves back and lands on the one who made it.
  self_deprecating: (
    <>
      <path
        d="M18 42 C18 22 46 22 46 34"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path
        d="M42 30 L46 35 L50 30"
        fill="none"
        stroke="var(--aqua)"
        strokeWidth="1.25"
      />
      <circle cx="18" cy="44" r="2.5" fill="var(--gold)" />
      <path d="M12 50 H24" stroke="var(--oxblood)" strokeWidth="1" opacity="0.7" />
    </>
  ),

  // The engraver's version of a swear. Nothing is off limits, including this.
  nothing_sacred: (
    <>
      <path
        d="M14 24 V36 M9 30 H19 M10.5 26 L17.5 34 M17.5 26 L10.5 34"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path
        d="M26 36 L32 24 L38 36"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1.25"
      />
      <path
        d="M44 24 C52 24 52 36 44 36 C48 32 48 28 44 24 Z"
        fill="none"
        stroke="var(--aqua)"
        strokeWidth="1.25"
      />
      <path d="M12 46 H52" stroke="var(--oxblood)" strokeWidth="1" opacity="0.55" />
    </>
  ),

  /* ── how loud a room they are ─────────────────────────────────────── */

  // Four lines of talk, none of them waiting for another.
  all_at_once: (
    <>
      <path d="M8 20 H40" stroke="var(--oxblood)" strokeWidth="1.25" />
      <path d="M20 30 H56" stroke="var(--gold)" strokeWidth="1.25" />
      <path d="M6 40 H34" stroke="var(--aqua)" strokeWidth="1.25" />
      <path d="M24 50 H52" stroke="var(--oxblood)" strokeWidth="1.25" />
    </>
  ),

  // One line begins before the other has finished, and they interlock.
  interrupts: (
    <>
      <path d="M8 26 H38" stroke="var(--oxblood)" strokeWidth="1.25" />
      <path d="M26 38 H56" stroke="var(--gold)" strokeWidth="1.25" />
      <path d="M32 22 V42" stroke="var(--aqua)" strokeWidth="1" opacity="0.9" />
      <circle cx="38" cy="26" r="1.8" fill="var(--oxblood)" />
      <circle cx="26" cy="38" r="1.8" fill="var(--gold)" />
    </>
  ),

  // One line, and everyone at the table turned toward it.
  one_conversation: (
    <>
      <path d="M18 32 H46" stroke="var(--oxblood)" strokeWidth="1.25" />
      <g fill="var(--aqua)">
        <circle cx="20" cy="16" r="2" />
        <circle cx="32" cy="13" r="2" />
        <circle cx="44" cy="16" r="2" />
        <circle cx="20" cy="48" r="2" />
        <circle cx="32" cy="51" r="2" />
        <circle cx="44" cy="48" r="2" />
      </g>
      <circle cx="32" cy="32" r="2.5" fill="var(--gold)" />
    </>
  ),

  // The whole width of the room, taken in one go.
  across_the_room: (
    <>
      <circle cx="10" cy="42" r="2.5" fill="var(--oxblood)" />
      <circle cx="54" cy="42" r="2.5" fill="var(--oxblood)" />
      <path
        d="M10 42 C18 16 46 16 54 42"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1.25"
      />
      <path d="M28 46 H36" stroke="var(--aqua)" strokeWidth="1.25" />
    </>
  ),

  // Small marks, kept under a cupped hand.
  low_voices: (
    <>
      <path
        d="M14 34 C14 22 50 22 50 34"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1.25"
      />
      <path
        d="M22 42 H32 M36 42 H42 M22 48 H28"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <circle cx="46" cy="48" r="1.6" fill="var(--aqua)" />
    </>
  ),

  // The laugh arrives before the end of the line.
  laughs_first: (
    <>
      <path
        d="M16 34 C20 46 44 46 48 34"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <g stroke="var(--gold)" strokeWidth="1">
        <path d="M32 20 V12 M20 24 L15 18 M44 24 L49 18" />
      </g>
      <path d="M22 52 H42" stroke="var(--aqua)" strokeWidth="1" opacity="0.75" />
    </>
  ),

  /* ── how much ceremony they can take ──────────────────────────────── */

  // Two glasses, and the moment they meet.
  toasts: (
    <>
      <path
        d="M12 16 H26 L21 30 V44 M15 44 H27"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path
        d="M52 16 H38 L43 30 V44 M49 44 H37"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path d="M30 20 L34 24 M34 20 L30 24" stroke="var(--gold)" strokeWidth="1.25" />
      <path d="M28 34 H36" stroke="var(--aqua)" strokeWidth="1" opacity="0.8" />
    </>
  ),

  // Someone stands. The table stays where it is.
  rises_to_greet: (
    <>
      <path d="M8 46 H56" stroke="var(--oxblood)" strokeWidth="1.25" />
      <path d="M20 46 V34" stroke="var(--oxblood)" strokeWidth="1.25" />
      <circle cx="20" cy="30" r="3" fill="none" stroke="var(--oxblood)" strokeWidth="1.25" />
      <path d="M42 46 V38" stroke="var(--gold)" strokeWidth="1.25" />
      <circle cx="42" cy="34" r="3" fill="none" stroke="var(--gold)" strokeWidth="1.25" />
      <path
        d="M26 24 C30 18 36 18 40 24"
        fill="none"
        stroke="var(--aqua)"
        strokeWidth="1"
      />
    </>
  ),

  // A table, and a decision already made about who sits where.
  seating_plan: (
    <>
      <rect
        x="16"
        y="22"
        width="32"
        height="20"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <g fill="var(--aqua)">
        <circle cx="22" cy="16" r="2" />
        <circle cx="42" cy="16" r="2" />
        <circle cx="22" cy="48" r="2" />
        <circle cx="42" cy="48" r="2" />
        <circle cx="10" cy="32" r="2" />
      </g>
      <circle cx="54" cy="32" r="2.5" fill="var(--gold)" />
      <path d="M22 30 H42 M22 35 H36" stroke="var(--oxblood)" strokeWidth="1" opacity="0.6" />
    </>
  ),

  // A glass raised, and nobody standing behind it.
  no_speeches: (
    <>
      <path
        d="M22 16 H42 L37 30 V44 M30 44 H44"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
        opacity="0.6"
      />
      <path d="M12 52 L52 14" stroke="var(--aqua)" strokeWidth="1.25" />
      <path d="M10 20 H22" stroke="var(--gold)" strokeWidth="1" opacity="0.7" />
    </>
  ),

  // Dressed, without being asked to be.
  dressed_up: (
    <>
      <path
        d="M28 26 L12 18 V38 L28 30 Z"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path
        d="M36 26 L52 18 V38 L36 30 Z"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <rect
        x="28"
        y="24"
        width="8"
        height="8"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1.25"
      />
      <path d="M20 48 H44" stroke="var(--aqua)" strokeWidth="1" opacity="0.75" />
    </>
  ),

  // A card with a first name on it and nothing else.
  first_names: (
    <>
      <path
        d="M12 20 H52 V44 H12 Z"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path d="M20 32 H36" stroke="var(--gold)" strokeWidth="1.25" />
      <circle cx="42" cy="32" r="1.8" fill="var(--aqua)" />
    </>
  ),

  /* ── how they say the kind thing ──────────────────────────────────── */

  // Said out loud, and let go of.
  says_it_out_loud: (
    <>
      <circle cx="20" cy="32" r="3" fill="var(--gold)" />
      <path
        d="M30 20 C38 26 38 38 30 44"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path
        d="M40 14 C52 24 52 40 40 50"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
        opacity="0.75"
      />
      <path d="M8 32 H14" stroke="var(--aqua)" strokeWidth="1.25" />
    </>
  ),

  // A tag with a name on it that only works inside this group.
  nicknames: (
    <>
      <path
        d="M22 14 H50 V38 H22 L12 26 Z"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <circle cx="22" cy="26" r="2" fill="var(--aqua)" />
      <path d="M30 26 H44" stroke="var(--gold)" strokeWidth="1.25" />
      <path
        d="M26 44 C34 50 42 50 50 44"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1"
        opacity="0.6"
      />
    </>
  ),

  // The question, and then the long quiet while the answer takes its time.
  asks_properly: (
    <>
      <path
        d="M22 24 C22 16 34 14 38 20 C42 26 32 28 32 34"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <circle cx="32" cy="40" r="2" fill="var(--oxblood)" />
      <path d="M12 50 H52" stroke="var(--aqua)" strokeWidth="1.25" />
      <path d="M12 54 H36" stroke="var(--gold)" strokeWidth="1" opacity="0.7" />
    </>
  ),

  // Warm, and entirely contained.
  warm_not_loud: (
    <>
      <circle
        cx="32"
        cy="32"
        r="20"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <circle cx="32" cy="32" r="6" fill="var(--gold)" opacity="0.85" />
      <path d="M24 46 H40" stroke="var(--aqua)" strokeWidth="1" opacity="0.7" />
    </>
  ),

  // One line, no joke wrapped around it.
  compliments_plainly: (
    <>
      <path d="M10 32 H44" stroke="var(--oxblood)" strokeWidth="1.25" />
      <circle cx="50" cy="32" r="3" fill="var(--gold)" />
      <path d="M10 42 H26" stroke="var(--aqua)" strokeWidth="1" opacity="0.7" />
    </>
  ),

  // Not embarrassed about it either.
  sentimental: (
    <>
      <path
        d="M32 14 C40 26 44 32 44 38 C44 45 38 50 32 50 C26 50 20 45 20 38 C20 32 24 26 32 14 Z"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path
        d="M27 38 C27 42 29 44 32 45"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1"
      />
      <path d="M12 22 H20 M44 22 H52" stroke="var(--aqua)" strokeWidth="1" opacity="0.7" />
    </>
  ),

  /* ── how exact they are ───────────────────────────────────────────── */

  // Brackets closed around one word.
  exact_word: (
    <>
      <path
        d="M20 18 H14 V46 H20"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path
        d="M44 18 H50 V46 H44"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path d="M26 32 H38" stroke="var(--gold)" strokeWidth="1.25" />
      <circle cx="32" cy="24" r="1.6" fill="var(--aqua)" />
    </>
  ),

  // The argument, and the thing that ends it.
  will_look_it_up: (
    <>
      <rect
        x="20"
        y="12"
        width="24"
        height="40"
        rx="2"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path d="M26 22 H38 M26 28 H34" stroke="var(--gold)" strokeWidth="1" />
      <circle
        cx="32"
        cy="40"
        r="5"
        fill="none"
        stroke="var(--aqua)"
        strokeWidth="1.25"
      />
      <path d="M36 44 L40 48" stroke="var(--aqua)" strokeWidth="1.25" />
    </>
  ),

  // The proofreader's caret, which is a correction that does not raise its voice.
  corrects_gently: (
    <>
      <path d="M10 28 H54" stroke="var(--oxblood)" strokeWidth="1.25" />
      <path
        d="M26 40 L32 30 L38 40"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1.25"
      />
      <path d="M28 48 H36" stroke="var(--aqua)" strokeWidth="1" opacity="0.8" />
    </>
  ),

  // The whole line is meant. Only this much of it is said.
  understated: (
    <>
      <path d="M10 26 H54" stroke="var(--oxblood)" strokeWidth="1" opacity="0.35" />
      <path d="M10 38 H24" stroke="var(--oxblood)" strokeWidth="1.25" />
      <circle cx="30" cy="38" r="1.4" fill="var(--gold)" />
      <circle cx="36" cy="38" r="1.4" fill="var(--gold)" opacity="0.6" />
      <circle cx="42" cy="38" r="1.4" fill="var(--aqua)" opacity="0.45" />
    </>
  ),

  // An hour with a wide margin around it.
  roughly_eight: (
    <>
      <circle
        cx="32"
        cy="32"
        r="18"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path
        d="M32 32 L32 20"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path
        d="M20 40 A16 16 0 0 0 40 47"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="2.5"
        opacity="0.55"
      />
      <path d="M32 32 L22 40" stroke="var(--aqua)" strokeWidth="1.25" />
    </>
  ),

  // From here to there, eventually.
  long_way_round: (
    <>
      <path
        d="M10 44 C18 44 16 22 26 22 C36 22 32 46 42 46 C50 46 50 30 54 24"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <circle cx="10" cy="44" r="2.5" fill="var(--aqua)" />
      <circle cx="54" cy="22" r="2.5" fill="var(--gold)" />
    </>
  ),

  /* ── how fast the evening moves ───────────────────────────────────── */

  // Marks with room around them.
  unhurried: (
    <>
      <path d="M8 32 H56" stroke="var(--oxblood)" strokeWidth="1" opacity="0.4" />
      <circle cx="14" cy="32" r="2.5" fill="var(--oxblood)" />
      <circle cx="32" cy="32" r="2.5" fill="var(--gold)" />
      <circle cx="50" cy="32" r="2.5" fill="var(--aqua)" />
    </>
  ),

  // Marks with none.
  talks_fast: (
    <>
      <g stroke="var(--oxblood)" strokeWidth="1.25">
        <path d="M12 22 V42 M17 22 V42 M22 22 V42 M27 22 V42 M32 22 V42 M37 22 V42" />
      </g>
      <path d="M42 32 H54 M50 28 L54 32 L50 36" fill="none" stroke="var(--aqua)" strokeWidth="1.25" />
      <path d="M12 48 H37" stroke="var(--gold)" strokeWidth="1" opacity="0.7" />
    </>
  ),

  // The hour, and the distance already travelled past it.
  arrives_late: (
    <>
      <circle
        cx="32"
        cy="32"
        r="18"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path d="M32 32 V18 M32 32 L44 38" stroke="var(--oxblood)" strokeWidth="1.25" />
      <g fill="var(--gold)">
        <circle cx="32" cy="8" r="1.5" />
        <circle cx="42" cy="10" r="1.5" opacity="0.7" />
        <circle cx="50" cy="16" r="1.5" opacity="0.45" />
      </g>
      <path d="M14 52 H50" stroke="var(--aqua)" strokeWidth="1" opacity="0.6" />
    </>
  ),

  // Burnt low, and nobody has moved.
  lingers: (
    <>
      <path d="M8 50 H56" stroke="var(--oxblood)" strokeWidth="1.25" />
      <rect
        x="27"
        y="34"
        width="10"
        height="16"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path
        d="M32 30 C36 26 36 22 32 18 C28 22 28 26 32 30 Z"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1.25"
      />
      <path d="M12 44 H22 M42 44 H52" stroke="var(--aqua)" strokeWidth="1" opacity="0.7" />
    </>
  ),

  // One unbroken line, back and forth, with nowhere for a silence to land.
  no_dead_air: (
    <>
      <path
        d="M10 18 H54 C58 18 58 26 54 26 H10 C6 26 6 34 10 34 H54 C58 34 58 42 54 42 H10"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <circle cx="10" cy="42" r="2" fill="var(--gold)" />
    </>
  ),

  // Two marks, and a gap nobody needs to fill.
  comfortable_silence: (
    <>
      <path d="M8 32 H18" stroke="var(--oxblood)" strokeWidth="1.25" />
      <path d="M46 32 H56" stroke="var(--oxblood)" strokeWidth="1.25" />
      <path d="M22 32 H42" stroke="var(--gold)" strokeWidth="1" opacity="0.35" />
      <circle cx="24" cy="44" r="2" fill="var(--aqua)" opacity="0.8" />
      <circle cx="40" cy="44" r="2" fill="var(--aqua)" opacity="0.8" />
    </>
  ),

  /* ── what they assume you already know ────────────────────────────── */

  // Two turned toward each other, and the thing between them.
  leans_in: (
    <>
      <path d="M14 50 L26 26" stroke="var(--oxblood)" strokeWidth="1.25" />
      <circle cx="27" cy="22" r="3.5" fill="none" stroke="var(--oxblood)" strokeWidth="1.25" />
      <path d="M50 50 L38 26" stroke="var(--oxblood)" strokeWidth="1.25" />
      <circle cx="37" cy="22" r="3.5" fill="none" stroke="var(--oxblood)" strokeWidth="1.25" />
      <circle cx="32" cy="16" r="2" fill="var(--gold)" />
      <path d="M10 54 H54" stroke="var(--aqua)" strokeWidth="1" opacity="0.6" />
    </>
  ),

  // The brackets are there. There is nothing inside them for you.
  explains_nothing: (
    <>
      <path
        d="M22 14 H12 V50 H22"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path
        d="M42 14 H52 V50 H42"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <circle cx="32" cy="32" r="1.8" fill="var(--aqua)" />
      <path d="M28 44 H36" stroke="var(--gold)" strokeWidth="1" opacity="0.5" />
    </>
  ),

  // Straight past the preliminaries.
  straight_to_gossip: (
    <>
      <g stroke="var(--gold)" strokeWidth="1" opacity="0.45">
        <path d="M8 20 H24 M8 44 H24" />
      </g>
      <path d="M8 32 H44 M38 27 L44 32 L38 37" fill="none" stroke="var(--oxblood)" strokeWidth="1.25" />
      <circle
        cx="52"
        cy="32"
        r="5"
        fill="none"
        stroke="var(--aqua)"
        strokeWidth="1.25"
      />
    </>
  ),

  // What is said, and what is meant, crossing on the way.
  means_the_other_thing: (
    <>
      <path d="M12 20 L52 44" stroke="var(--oxblood)" strokeWidth="1.25" />
      <path d="M12 44 L52 20" stroke="var(--gold)" strokeWidth="1.25" />
      <circle cx="12" cy="20" r="2" fill="var(--oxblood)" />
      <circle cx="52" cy="20" r="2" fill="var(--gold)" />
      <circle cx="32" cy="32" r="2.5" fill="none" stroke="var(--aqua)" strokeWidth="1.25" />
    </>
  ),

  // A closed table.
  between_us: (
    <>
      <circle
        cx="32"
        cy="32"
        r="21"
        fill="none"
        stroke="var(--aqua)"
        strokeWidth="1.25"
        strokeDasharray="3 3"
      />
      <g fill="var(--oxblood)">
        <circle cx="24" cy="28" r="2.5" />
        <circle cx="40" cy="28" r="2.5" />
        <circle cx="32" cy="42" r="2.5" />
      </g>
      <path d="M24 34 H40" stroke="var(--gold)" strokeWidth="1.25" />
    </>
  ),

  // The whole thing, written out, in order.
  spells_it_out: (
    <>
      <path
        d="M12 16 H52 M12 26 H52 M12 36 H52 M12 46 H40"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <circle cx="48" cy="46" r="2" fill="var(--gold)" />
    </>
  ),

  /* ── how much they perform ────────────────────────────────────────── */

  // A door, and someone using it properly.
  makes_an_entrance: (
    <>
      <path
        d="M20 52 V26 C20 18 44 18 44 26 V52"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <g stroke="var(--gold)" strokeWidth="1" opacity="0.8">
        <path d="M32 14 V6 M18 18 L12 12 M46 18 L52 12" />
      </g>
      <path d="M8 52 H56" stroke="var(--aqua)" strokeWidth="1.25" />
    </>
  ),

  // And again, slightly bigger.
  does_the_voice: (
    <>
      <path
        d="M22 16 C32 24 32 40 22 48"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path
        d="M34 12 C46 22 46 42 34 52"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1.25"
      />
      <circle cx="14" cy="32" r="2.5" fill="var(--aqua)" />
    </>
  ),

  // One voice, and the room let it have the floor.
  one_tells_it: (
    <>
      <path
        d="M22 12 C36 20 36 44 22 52"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <g fill="var(--aqua)">
        <circle cx="46" cy="18" r="2" />
        <circle cx="50" cy="32" r="2" />
        <circle cx="46" cy="46" r="2" />
      </g>
      <circle cx="16" cy="32" r="3" fill="var(--gold)" />
    </>
  ),

  // Filled to the edge.
  nothing_by_halves: (
    <>
      <circle
        cx="32"
        cy="32"
        r="19"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path
        d="M32 13 A19 19 0 1 1 31.9 13"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="3.5"
        opacity="0.5"
      />
      <circle cx="32" cy="32" r="4" fill="var(--aqua)" />
    </>
  ),

  // The curtain stays where it is.
  never_performs: (
    <>
      <path
        d="M14 26 C14 14 50 14 50 26"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path d="M10 26 H54" stroke="var(--aqua)" strokeWidth="1.25" />
      <path d="M32 40 V50" stroke="var(--oxblood)" strokeWidth="1.25" />
      <circle cx="32" cy="36" r="3.5" fill="none" stroke="var(--oxblood)" strokeWidth="1.25" />
      <path d="M18 54 H46" stroke="var(--gold)" strokeWidth="1" opacity="0.5" />
    </>
  ),

  // The engraver's swear, said fondly.
  swears_fondly: (
    <>
      <path
        d="M16 22 V32 M11 27 H21 M12.5 23.5 L19.5 30.5 M19.5 23.5 L12.5 30.5"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path d="M28 22 L36 32 M36 22 L28 32" stroke="var(--oxblood)" strokeWidth="1.25" />
      <path
        d="M44 22 C52 22 52 32 44 32 C48 29 48 25 44 22 Z"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path
        d="M16 42 C24 50 40 50 48 42"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1.25"
      />
      <circle cx="32" cy="52" r="1.8" fill="var(--aqua)" />
    </>
  ),

  // A rule with serifs on it, at an hour when nobody would blame you.
  impeccably_polite: (
    <>
      <path d="M12 32 H52" stroke="var(--oxblood)" strokeWidth="1.25" />
      <path d="M12 26 V38 M52 26 V38" stroke="var(--oxblood)" strokeWidth="1.25" />
      <circle
        cx="32"
        cy="18"
        r="7"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1.25"
      />
      <path d="M32 18 V13 M32 18 L36 20" stroke="var(--gold)" strokeWidth="1" />
      <path d="M22 44 H42" stroke="var(--aqua)" strokeWidth="1" opacity="0.75" />
    </>
  ),
};
