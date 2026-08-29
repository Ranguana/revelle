/**
 * WHAT EACH ROOM SERVES, AND HOW MUCH OF IT TWO ROOMS SHARE.
 *
 * The founder's ruling, 2026-08-27, verbatim:
 *
 *   "The breach verdict then reads both numbers: tone-close + deliverables-
 *    close = genuine confusion risk, block or re-author; tone-close +
 *    deliverables-disjoint = neighbours in register, distinct in experience —
 *    record and admit."
 *
 * This module is the second number. `voiceAffinity` stays exactly what it is —
 * a measure of TEMPERAMENT, which it does well — and this measures EXPERIENCE.
 * Two numbers that each mean something rather than one blend that means
 * neither.
 *
 * ── WHY THIS IS NOT A CUISINE FACET ──────────────────────────────────
 *
 * CLAUDE.md's unratified section refuses one by name: "A facet that memorises
 * the answer key is not a facet. Cuisine separated every pair perfectly by
 * reaching one room per level. A zero-failure audit is a warning when one
 * column is nearly a unique ID."
 *
 * The distinction is not a shade of the same thing. A CUISINE FACET is a new
 * COLUMN IN THE MATRIX — a hand-assigned label, one per room, that would grade
 * every applicant and would have to be answerable by a host who has never seen
 * the catalogue. It fails on both counts: nobody can be asked "is your evening
 * Mexican", and the column would be a unique ID wearing a level list.
 *
 * This is a DERIVED PAIRWISE FRACTION over rows that already exist for their
 * own reasons. It labels nothing, it adds no column, it asks the host nothing,
 * and it cannot be a unique ID because it is not a property of a room at all —
 * it is a property of a PAIR, and it changes when either room's pool changes.
 * It also cannot memorise the answer key, because nobody assigned it: if two
 * rooms genuinely serve the same food, this says so, and that is information
 * rather than a label somebody chose to make the audit pass.
 *
 * ── WHAT IT READS, AND THE ONE AXIS IT DOES NOT ──────────────────────
 *
 * DISHES, from docs/dishes.md. The document's own instruction is the reason
 * this works: "Dishes repeat across destinations on purpose — dedupe to one
 * row with multiple destination tags at import." A dish written under two
 * headings IS a shared claim, stated by the author.
 *
 * DRINKS, from docs/drinks.md, at the level of the individual drink rather
 * than the programme — two rooms both pouring Manhattans share a Manhattan
 * whether or not the programmes around it match.
 *
 * BANK ITEMS ARE DELIBERATELY NOT READ, and this is a refusal rather than an
 * omission. docs/atmosphere-idea-bank-v1.md is prose — semicolon-separated
 * clauses under `GOODS:`, with take-home claims, second claims, routing rules
 * and founder-pending markers folded into the sentences. scripts/seed-bank.mjs
 * parses it in roughly 2400 lines and is the ONE authority on what that file
 * says. A second, simpler parser here would produce a second count, and
 * CLAUDE.md rule 24 is explicit about what that count would be worth: reading
 * the code tells you what it was meant to match, only counting tells you what
 * it did, and a parser written against prose it does not fully model matches
 * less than its author thinks. The right way to add this axis is a `--json`
 * emit on seed-bank so the existing parse is reused. That is written up in the
 * handover rather than guessed at here.
 *
 * THE CONSEQUENCE IS LOAD-BEARING AND IS REPORTED, NOT HIDDEN. When this was
 * written, dishes and drinks between them covered the TWELVE WIRED ROOMS AND
 * NO OTHERS, the bank was the only authored document carrying all eighteen,
 * and every pair involving a proposed room was therefore `unknown`. THAT IS NO
 * LONGER TRUE: docs/dishes.md now carries all eighteen, the six newest rooms
 * hold between seven and thirty-six claims, and the reporter prints the pool
 * size for every room rather than a coverage caveat. Drinks are still twelve
 * rooms only, which is why the six newest rooms are dish-only pools and why
 * their counts are smaller than a wired room's by construction as well as by
 * identity.
 *
 * ── ABSENCE IS NOT DISJOINTNESS ──────────────────────────────────────
 *
 * The trap this codebase keeps hitting, in its newest costume. A pair reads
 * "shares nothing" when the two rooms genuinely serve different food AND when
 * neither room has had its food written yet, and those two readings are
 * indistinguishable from the number alone. Admitting a room on the second one
 * would be rule 22's defect exactly: a gate that prunes zero rows while
 * looking like it works.
 *
 * So the value is `null` — not 0 — below an evidence floor, and every consumer
 * has to handle `null` explicitly rather than letting it fall through a
 * comparison as a small number. `deliverablesVerdict` refuses to admit a pair
 * on an unknown, which is the whole reason the floor exists.
 *
 * AND THE FLOOR IS PER DECLARED FOOD IDENTITY, NOT UNIFORM — see
 * `EVIDENCE_FLOORS` below and `src/lib/food-identity.ts`. The trap has a
 * second half that a single number walks straight into: a room can be under a
 * uniform floor because its food was never written, OR because it is a room
 * that serves almost none, and those two are as indistinguishable from a count
 * as absence and distinctness are from a fraction. The room's own declaration
 * is what separates them.
 */
import { readFileSync } from "node:fs";
import { DESTINATIONS as HEADING_TO_SLUG } from "./catalogue-vocabulary.mjs";
import { foodIdentityOf } from "../src/lib/food-identity.ts";

const read = (name) =>
  readFileSync(new URL(`../docs/${name}`, import.meta.url), "utf8");

/**
 * A claim name, flattened for comparison.
 *
 * Deliberately blunt: case, punctuation and a trailing parenthetical go, so
 * "Oysters on the half shell" and "Oysters on the half shell " are one thing.
 * It does NOT stem or synonymise — "shrimp cocktail" and "jumbo shrimp
 * cocktail" stay two claims, because guessing they are one is the
 * single-substitution failure CLAUDE.md's unratified section already records
 * (a word-overlap sweep "flagged 113 pairs and was useless").
 */
function normaliseClaim(text) {
  return text
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9' ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * docs/dishes.md -> { slug: Set<dish> }.
 *
 * `## Room` opens a section, `### Course` names the course, and every `- line`
 * under it is a dish followed by a level and sometimes a season. The KEY IS
 * (course, name), matching scripts/seed-dishes.mjs's own rule — "Papaya with
 * lime" is a dessert at Tahiti and an appetizer at Havana, and one key would
 * make those two rooms share a claim neither of them makes.
 */
export function dishClaims() {
  const out = new Map();
  let slug = null;
  let course = null;
  for (const raw of read("dishes.md").split("\n")) {
    const h2 = raw.match(/^##\s+(.+?)\s*$/);
    if (h2 && !raw.startsWith("###")) {
      slug = HEADING_TO_SLUG[h2[1]] ?? null;
      course = null;
      if (slug && !out.has(slug)) out.set(slug, new Set());
      continue;
    }
    const h3 = raw.match(/^###\s+(.+?)\s*$/);
    if (h3) {
      course = normaliseClaim(h3[1]);
      continue;
    }
    if (!slug || !course) continue;
    const item = raw.match(/^-\s+(.+?)\s*$/);
    if (!item) continue;
    // "Name · LEVEL (season)" — the level and everything after it is metadata.
    const name = normaliseClaim(item[1].split("·")[0]);
    if (name) out.get(slug).add(`${course}::${name}`);
  }
  return out;
}

/**
 * docs/drinks.md -> { slug: Set<drink> }.
 *
 * Each `**n.**` block is a PROGRAMME and its five bullets are, in order,
 * cocktails · mocktail mirrors · what it is for · season · how much mixing.
 * Only the first two carry drinks, and they are comma-separated lists. The
 * mirrors are included because a mirror is a drink the house pours — the
 * document's own "the mirror is the whole point" section says so — and a room
 * is no less committed to it for its being alcohol-free.
 *
 * Commas inside a parenthetical are not separators. "Harvey Wallbangers
 * (vodka, orange juice, vanilla-liqueur float)" is ONE drink, and splitting it
 * naively would invent three, two of which would then match other rooms'
 * ingredients and inflate every overlap it touched.
 */
export function drinkClaims() {
  const out = new Map();
  let slug = null;
  let bullet = 0;
  for (const raw of read("drinks.md").split("\n")) {
    const h2 = raw.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      slug = HEADING_TO_SLUG[h2[1]] ?? null;
      bullet = 0;
      if (slug && !out.has(slug)) out.set(slug, new Set());
      continue;
    }
    if (/^\*\*\d+\.\*\*/.test(raw)) {
      bullet = 0;
      continue;
    }
    if (!slug) continue;
    const item = raw.match(/^-\s+(.+?)\s*$/);
    if (!item) continue;
    bullet++;
    if (bullet > 2) continue; // 3,4,5 are purpose, season, mixing — not drinks.
    for (const part of splitTopLevel(item[1])) {
      const name = normaliseClaim(part);
      if (name) out.get(slug).add(name);
    }
  }
  return out;
}

/** Split on commas that are not inside parentheses. */
function splitTopLevel(text) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const ch of text) {
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else current += ch;
  }
  parts.push(current);
  return parts;
}

/**
 * THE EVIDENCE FLOORS, PER DECLARED FOOD IDENTITY.
 *
 * ── WHAT WAS HERE BEFORE, AND WHAT BEAT IT (rule 14) ─────────────────
 *
 * Until 2026-08-29 this was a single number, `EVIDENCE_FLOOR = 12`, and its
 * argument is preserved because half of it is still load-bearing:
 *
 *   "A room needs enough claims for a shared one to mean something. At five
 *    claims a single coincidence is worth 0.20 of the fraction, which is
 *    larger than the gap between any two verdicts this measure would ever
 *    produce — so below that the number is noise wearing three decimal places.
 *    Twelve is one full drink programme plus a course, and it is comfortably
 *    under the smallest real pool in either document, so it excludes nothing
 *    that has actually been written."
 *
 * The estimator half of that stands. The last clause is what failed: twelve
 * was NOT under the smallest real pool. Palm Springs authored eleven claims
 * and St. Moritz seven, and neither is short — both rooms REFUSE a seated meal
 * in the founder's own deliverables sheets ("nothing requires a fork";
 * "things that eat standing"). A uniform floor called both of them incomplete
 * and put a number in front of an author, which is CLAUDE.md rule 30's exact
 * failure: AUTHORING TO HIT A METRIC IS THE FAILURE THE METRIC WAS BUILT TO
 * DETECT. Reaching twelve at either room could only have been done by taking
 * plates the wired rooms already hold.
 *
 * Founder ruling, 2026-08-29: FLOORS ARE PER FOOD-IDENTITY, and the identity
 * is a CLAIM the room makes rather than something this file infers from the
 * row count. `src/lib/food-identity.ts` is the declaring half and carries the
 * argument for why an inferred identity would be a gate that cannot fire.
 *
 * ── TABLE, 20 ────────────────────────────────────────────────────────
 *
 * Her number. A room whose spine is the meal owes a meal: three courses that
 * can be composed more than one way across a season, which is roughly seven
 * apiece. It is also the only floor with real headroom over the estimator's
 * needs, and that is correct — a table room has the most to be wrong about.
 *
 * ── EXPRESSION, 12 ───────────────────────────────────────────────────
 *
 * Her number, and it is the old uniform floor kept where it was always right:
 * one full drink programme plus a course. A room that feeds people well while
 * the evening happens around the food needs enough to compose a night from,
 * and not a menu.
 *
 * ── INCIDENTAL, 6 — the number this file had to pick ─────────────────
 *
 * She gave a band, "something like 6–8", and the choice inside it is argued
 * from the OTHER constant in this module rather than from the catalogue.
 *
 * At a floor of F, one coincidental shared claim is worth 1/F of the overlap
 * fraction. `DELIVERABLES_CLOSE` is 0.2, so a single accident alone tips a
 * pair to "close" at F = 5 (0.200) and cannot at F = 6 (0.167). SIX IS THE
 * SMALLEST FLOOR AT WHICH ONE COINCIDENCE CANNOT BY ITSELF PRODUCE A BREACH,
 * which is the strongest guarantee available down here — two coincidences
 * would need F >= 11, and requiring eleven of a room that authored seven is
 * the uniform floor coming back through the window.
 *
 * WHY NOT 7 OR 8, SAID PLAINLY BECAUSE IT IS THE PART THAT COULD BE FITTED TO
 * THE DATA. St. Moritz stands at seven claims. A floor of 8 makes it short by
 * one row and sends somebody to write one dish for arithmetic; a floor of 7
 * puts it exactly on the line, one recount from unmeasurable. Both of those
 * are numbers chosen by looking at the catalogue, which is what the
 * `DELIVERABLES_CLOSE` block below refuses to do two hundred lines from here.
 * Six is chosen without looking at it, and the fact that it leaves both
 * incidental rooms clear is a consequence rather than the reason.
 *
 * THE COST IS CARRIED AND REPORTED, NOT FIXED BY AUTHORING. An incidental room
 * is a genuinely noisier estimate than a table room: one shared claim moves it
 * 0.167 where it moves Côte d'Azur 0.007. The founder's ruling is that the
 * room's identity wins and the floor bends — so the noise is a property of the
 * measure at these rooms, and `check:voices` prints the pool size beside every
 * verdict for that reason.
 *
 * The floor is still applied to BOTH rooms of a pair, each against its own
 * identity's number. A pair is only as measurable as its thinner side, and
 * "thin" now means thin FOR WHAT THIS ROOM CLAIMS TO BE.
 */
export const EVIDENCE_FLOORS = Object.freeze({
  table: 20,
  expression: 12,
  incidental: 6,
});

/**
 * The floor this room owes, or an exception.
 *
 * NO DEFAULT, AND ESPECIALLY NOT THE OLD TWELVE. `foodIdentityOf` throws for a
 * room that has not declared, and this deliberately does not catch it: no
 * identity means no floor means no verdict. Falling back to twelve would
 * reinstate the exact defect the declaration exists to remove, because twelve
 * is the number at which an under-authored table room looks healthy.
 */
export function evidenceFloor(slug) {
  const identity = foodIdentityOf(slug);
  const floor = EVIDENCE_FLOORS[identity];
  if (floor === undefined)
    throw new Error(
      `Food identity "${identity}" (declared for "${slug}") has no evidence ` +
        `floor. EVIDENCE_FLOORS and the FoodIdentity union have drifted apart.`
    );
  return floor;
}

/**
 * One room's standing against its OWN declared identity.
 *
 * The reporting shape, and the reason the report can say the sentence that
 * matters: a table room at fourteen is SHORT where an incidental room at seven
 * is COMPLETE, and no single number can tell you that.
 */
export function roomEvidence(slug, claims) {
  const identity = foodIdentityOf(slug);
  const floor = EVIDENCE_FLOORS[identity];
  const size = claims.get(slug)?.size ?? 0;
  return { slug, identity, floor, size, short: size < floor };
}

/**
 * HOW MUCH OF THE SMALLER ROOM THE LARGER ONE ALSO SERVES, 0..1.
 *
 * ── THE DENOMINATOR, ARGUED ──────────────────────────────────────────
 *
 * Three candidates and each fails somewhere:
 *
 *   UNION (Jaccard). Punishes size asymmetry brutally and for no reason that
 *   means anything here. Amalfi carries 80 authored refusals against
 *   Acapulco's 29 in the neighbouring measure, and the same spread will exist
 *   in the pools: a small room that serves nothing but what a large room also
 *   serves — a genuine subset, the strongest possible confusion — would score
 *   LOW on Jaccard precisely because the large room has a long tail. It gets
 *   the flagship case backwards.
 *
 *   LARGER ROOM. Guarantees every pair involving a big pool reads as distinct,
 *   which is the same failure pointing the other way.
 *
 *   SMALLER ROOM (overlap coefficient, chosen). Answers the question the
 *   ruling actually asks — IS THIS ROOM'S EXPERIENCE ALREADY AVAILABLE
 *   SOMEWHERE ELSE. A room whose whole table is a subset of another room's
 *   scores 1.0, which is correct and is exactly the confusion the founder is
 *   guarding against. Its known weakness is that it flatters small pools, and
 *   that weakness is precisely what the EVIDENCE_FLOORS exist to bound: the
 *   estimator is unstable below a certain size, so below that size it declines
 *   to answer rather than answering badly.
 *
 * Returns null when either room is under ITS OWN identity's floor. NULL IS NOT
 * ZERO and a caller that treats it as a small number has reintroduced the bug.
 *
 * ── WHY IT TAKES SLUGS AND THE POOL, NOT TWO SETS ────────────────────
 *
 * It used to take the two claim sets and compare both against one constant.
 * Two sets cannot answer "is this room short", because shortness is now a
 * question about WHICH ROOM this is — so the function has to be able to look
 * the identity up, and the only way to guarantee no caller pairs a room with
 * the wrong floor is to stop letting callers supply floors at all. Rule 21's
 * consumer clause: one owner, reached through one door.
 */
export function overlapFraction(aKey, bKey, claims) {
  const a = claims.get(aKey);
  const b = claims.get(bKey);
  if (!a || !b) return null;
  if (a.size < evidenceFloor(aKey)) return null;
  if (b.size < evidenceFloor(bKey)) return null;
  let shared = 0;
  for (const claim of a) if (b.has(claim)) shared++;
  return shared / Math.min(a.size, b.size);
}

/**
 * Both pools at once, per room.
 *
 * Dishes and drinks are kept in ONE set rather than averaged as two fractions.
 * Averaging would give a room's three drink programmes the same weight as its
 * fifty dishes, which says that what two rooms pour matters seventeen times
 * more per item than what they serve. Nobody has ruled that and it is not
 * obviously true, so the honest default is to count claims.
 */
export function deliverableClaims() {
  const dishes = dishClaims();
  const drinks = drinkClaims();
  const out = new Map();
  for (const [slug, set] of dishes)
    out.set(slug, new Set([...set].map((d) => `dish::${d}`)));
  for (const [slug, set] of drinks) {
    if (!out.has(slug)) out.set(slug, new Set());
    for (const d of set) out.get(slug).add(`drink::${d}`);
  }
  return out;
}

/**
 * HOW CLOSE IS CLOSE — AND THIS NUMBER IS NOT YET EVIDENCED. FOUNDER-PENDING.
 *
 * Stated plainly because the alternative is a threshold that looks calibrated
 * and is not (CLAUDE.md rule 20: a report generated from something other than
 * reality is the most convincing failure this system produces).
 *
 * MEASURED, 2026-08-27, over the 66 pairs that have pools at all:
 * min 0.000 · median 0.000 · mean 0.014 · MAX 0.112 (las-vegas / new-york).
 *
 * So 0.2 sits ABOVE the observed maximum, and on today's catalogue this gate
 * therefore classifies EVERY measurable pair as deliverables-disjoint. Under
 * rule 15 that makes it an instrument that does not prune, and under rule 22's
 * second guard — "a detector for a gate that prunes zero rows across the whole
 * catalogue" — it is exactly the shape that must be reported rather than
 * shipped quietly. The reporter prints the observed maximum next to this
 * constant for that reason.
 *
 * IT IS DELIBERATELY NOT TUNED DOWN TO FIT. Choosing 0.05 because that is
 * where the twelve wired rooms happen to sit would be fitting a constant to
 * the only rooms that are NOT being adjudicated, and then applying it to six
 * rooms whose pools do not exist. That is the retro-tagging failure with a
 * decimal point in it.
 *
 * WHAT WOULD EVIDENCE IT: pools for the six proposed rooms, at which point the
 * founder's own two validation cases become computable and the number can be
 * set where it separates them — Amalfi/Portofino should read HIGH (same coast,
 * shared plate) and Oaxaca/Havana LOW (mole at a family table against rum in a
 * nightclub). Both are uncomputable today and neither has been used to set
 * this.
 *
 * The one validation that IS available and does pass: las-vegas / new-york at
 * 0.112 is the highest pair in the field, and CLAUDE.md rule 6 predicts
 * precisely that — "Chicken parmesan is Italian-AMERICAN repertoire: New York
 * and Vegas, never Portofino." The measure finds the shared plate the doctrine
 * says is there, and finds it between the two rooms named. Portofino/New York
 * is 0.007.
 */
export const DELIVERABLES_CLOSE = 0.2;

/**
 * THE TWO-NUMBER VERDICT.
 *
 * tone-close + deliverables-close  -> confusion risk. Block or re-author.
 * tone-close + deliverables-apart  -> neighbours in register, distinct in
 *                                     experience. ADMIT, and record that it
 *                                     was admitted on the second number.
 * tone-close + deliverables-unknown-> NOT admitted. Absence is not
 *                                     disjointness, and a room let through on
 *                                     an empty pool is the founding defect
 *                                     with a new costume.
 */
export function deliverablesVerdict(toneBreaches, overlap) {
  if (!toneBreaches) return { verdict: "ok", why: "within its voice ceiling" };
  if (overlap === null)
    return {
      verdict: "BREACH",
      why:
        "tone-close, and the deliverables number is UNKNOWN — one of these rooms " +
        "holds fewer authored dishes and drinks than ITS OWN DECLARED FOOD " +
        "IDENTITY owes. Not admitted: an unwritten pool reads identical to a " +
        "distinct one",
    };
  if (overlap >= DELIVERABLES_CLOSE)
    return {
      verdict: "BREACH",
      why: `tone-close AND deliverables-close (${overlap.toFixed(
        3
      )}) — genuine confusion risk. Block or re-author`,
    };
  return {
    verdict: "admitted",
    why: `tone-close but deliverables-disjoint (${overlap.toFixed(
      3
    )}) — neighbours in register, distinct in experience`,
  };
}
