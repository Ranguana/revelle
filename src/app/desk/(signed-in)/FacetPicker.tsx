import type { FacetGroup } from "@/lib/desk/facets";

import styles from "../desk.module.css";

/**
 * Tick the terms that describe this thing.
 *
 * The vocabulary is the SHARED one (db/002): the same rows a destination and a
 * host's answers resolve to, which is what makes matching a join rather than a
 * judgement rendered in code. There is no free-text tag box on purpose — a
 * private term would describe a product in words nothing else in the system
 * speaks.
 *
 * ── THE WEIGHT IS NOT HERE, AND THAT IS DELIBERATE ──────────────────
 *
 * A tag has a signed weight (-1..1) and a curator may tune it. This picker
 * only says WHETHER a thing is tagged; `setTags` leaves an existing weight
 * exactly as it found it, so saving a price never quietly resets a hand-tuned
 * 0.35 to 1.000. Tags that already carry a weight other than 1 are marked, so
 * the tuning is at least visible from here.
 *
 * No directive: it is a pure props component and compiles into whichever
 * boundary imports it.
 */
export default function FacetPicker({
  groups,
  selected,
  weights,
}: {
  groups: readonly FacetGroup[];
  selected: ReadonlySet<string>;
  /** facet id -> weight, for the ones that are not plain 1. */
  weights?: ReadonlyMap<string, string>;
}) {
  return (
    <div className={styles.facetBlock}>
      {groups.map((group) => (
        <div key={group.code}>
          <p className={styles.facetDimension}>{group.label}</p>
          <ul className={styles.facetList}>
            {group.facets.map((facet) => {
              const weight = weights?.get(facet.id);
              const tuned = weight !== undefined && Number(weight) !== 1;
              return (
                <li key={facet.id}>
                  <label
                    className={`${styles.facetItem} ${tuned ? styles.facetWeighted : ""}`}
                    title={facet.description}
                  >
                    <input
                      type="checkbox"
                      name="facet"
                      value={facet.id}
                      defaultChecked={selected.has(facet.id)}
                    />
                    <span>
                      {facet.label}
                      {tuned ? ` (${Number(weight)})` : ""}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
