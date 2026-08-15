/**
 * A seeded random number generator, and the dither built on it.
 *
 * ── WHY THE ENGINE OWNS ITS RANDOMNESS ────────────────────────────────
 *
 * Two reasons, and the second is the important one.
 *
 * The obvious one: a test of a sampling algorithm that cannot fix the sample is
 * a test of nothing. Every stage that rolls a die takes an Rng, so a test can
 * hand it a known seed and assert on an exact shortlist.
 *
 * The one that matters: the seed is RECORDED on the result. When a curator asks
 * six months from now why this customer was shown these three destinations, the
 * answer is the seed plus the catalogue as it stood — and that is reproducible.
 * Math.random() would make the single most consequential decision in the system
 * unauditable, which is a strange thing to accept in a house that keeps an
 * append-only record of everything else.
 */

export type Rng = {
  /** Uniform in [0, 1). */
  next(): number;
  /** Standard normal, mean 0, standard deviation 1. */
  normal(): number;
  readonly seed: number;
};

/**
 * mulberry32. Thirty-two bits of state, a handful of arithmetic operations,
 * and statistical quality far beyond anything this engine asks of it — the
 * dither perturbs a ranking of at most a few dozen items.
 *
 * Deliberately not crypto.randomInt: this must be reproducible from the seed,
 * which is the whole point.
 */
export function rng(seed: number): Rng {
  let state = seed >>> 0;
  let spare: number | null = null;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    seed,
    next,
    // Marsaglia polar. Generates two normals at a time; the second is kept
    // rather than thrown away, which halves the calls and costs one variable.
    normal(): number {
      if (spare !== null) {
        const value = spare;
        spare = null;
        return value;
      }
      let u = 0;
      let v = 0;
      let s = 0;
      do {
        u = next() * 2 - 1;
        v = next() * 2 - 1;
        s = u * u + v * v;
      } while (s === 0 || s >= 1);
      const factor = Math.sqrt((-2 * Math.log(s)) / s);
      spare = v * factor;
      return u * factor;
    },
  };
}

/** A seed with no reproducibility promise, for a real run. */
export function arbitrarySeed(): number {
  return (Math.floor(Math.random() * 0xffffffff) ^ Date.now()) >>> 0;
}

export type Dithered<T> = {
  item: T;
  score: number;
  /** Where it came in on merit. 1-based. */
  rank: number;
  /** log(rank) + N(0, log ε). Lower sorts first. */
  key: number;
  /** Where it came in after the dither. 1-based. */
  ditheredRank: number;
};

/**
 * THE DITHER — docs/selection-spec.md, stage 2.
 *
 *     key = log(rank) + N(0, log ε)
 *
 * Re-sorted by that key. Because the noise is added to the LOG of the rank, it
 * leaves the top few roughly in place and pulls deeper candidates up: ε = 2
 * moves a rank-10 item to somewhere around 5 to 20. Adding noise to the SCORE
 * instead would behave completely differently depending on how tightly the
 * scores happen to be bunched, which is a property of the catalogue rather than
 * a decision anybody made.
 *
 * ε = 1 is exactly no dithering — log(1) = 0, so the noise term vanishes and
 * the ranking is returned untouched. That is a useful thing to be able to ask
 * for and it falls out of the formula rather than needing a flag.
 *
 * Ties on score are broken by input order before ranking, so the function is a
 * deterministic function of its inputs and its seed.
 */
export function dither<T>(
  items: readonly T[],
  scoreOf: (item: T) => number,
  epsilon: number,
  random: Rng
): Dithered<T>[] {
  const sigma = Math.log(Math.max(epsilon, 1));

  const ranked = items
    .map((item, index) => ({ item, score: scoreOf(item), index }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  return ranked
    .map((entry) => ({
      item: entry.item,
      score: entry.score,
      rank: entry.rank,
      key: Math.log(entry.rank) + (sigma > 0 ? random.normal() * sigma : 0),
    }))
    .sort((a, b) => a.key - b.key)
    .map((entry, i) => ({ ...entry, ditheredRank: i + 1 }));
}
