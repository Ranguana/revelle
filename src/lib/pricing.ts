/**
 * What membership costs, and the founding offer.
 *
 * ── WHY THIS IS CONFIGURATION AND NOT A CONSTANT ─────────────────────
 *
 * Pricing is still being tested, and a price that needs a deploy to change is
 * a price nobody tests. Every figure below comes from the environment, so a
 * number changes on Render and takes effect on the next request — no commit,
 * no build, no waiting.
 *
 * ── WHY THERE ARE NO DEFAULTS ────────────────────────────────────────
 *
 * A missing price renders as unstated rather than as a guess. Inventing a
 * plausible default is the one failure mode that costs real money: a wrong
 * number on a live page is a number somebody may hold us to, and it would look
 * exactly like a decided one. Unset means the page says what IS decided and
 * stays quiet about the rest.
 *
 * Framework-free. No React, no "server-only" — a script may want it too.
 */

/** Cents, parsed from a whole-dollar env var. Null when unset or unparseable. */
function dollars(name: string): number | null {
  const raw = process.env[name];
  if (!raw) return null;
  const value = Number(raw.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

function count(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw.trim());
  if (!Number.isInteger(value) || value < 0) return fallback;
  return value;
}

export type Pricing = {
  /** Annual dues, in cents. Null until decided. */
  duesCents: number | null;
  /**
   * One Revelle, bought without joining, in cents. Null until decided.
   *
   * READ BY NOTHING SINCE 2026-09-05. The founder removed the single Revelle
   * from the pricing page, so membership is the only door and this figure has
   * no surface. The field and `PRICE_SINGLE_COMMISSION` are both left in place
   * — an unread variable costs nothing and clearing it is a separate decision
   * — but rule 15 says an instrument that feeds nothing does not get to sit
   * here looking wired, so it says here what it is. If the offer returns, the
   * page is src/app/pricing/page.tsx and the block it lost is quoted in it.
   */
  commissionCents: number | null;
  /**
   * How many founding memberships exist. The offer is a standing, not a
   * countdown: this number is printed as a fact and never as a remaining
   * tally, because a tally is the scarcity mechanic the copy brief bans.
   */
  foundingMembers: number;
  /** Days of the trial. Zero means no trial is offered. */
  trialDays: number;
};

export function pricing(): Pricing {
  return {
    duesCents: dollars("PRICE_ANNUAL_DUES"),
    commissionCents: dollars("PRICE_SINGLE_COMMISSION"),
    foundingMembers: count("FOUNDING_MEMBERS", 20),
    trialDays: count("TRIAL_DAYS", 7),
  };
}

/** $1,200 — no trailing zeros on a whole number, because a price is not a receipt. */
export function formatPrice(cents: number): string {
  const whole = cents % 100 === 0;
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  })}`;
}

/**
 * Twenty, not 20. The page is set in a serif and a number in digits reads as a
 * quantity on offer; a number in words reads as a fact about the société.
 */
const WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
];

export function spellCount(n: number): string {
  return WORDS[n] ?? String(n);
}
