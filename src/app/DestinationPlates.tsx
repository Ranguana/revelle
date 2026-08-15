"use client";

import { useId, useState } from "react";

import { LIBRARY } from "@/lib/library";

import { POSTERS } from "./plates";
import styles from "./landing.module.css";

/**
 * The library, as a shelf of plates.
 *
 * The only interaction on the page. Picking a plate swaps the panel beneath it,
 * which is the whole argument of the section: the destinations are not moods,
 * they are four specific things that happen in an evening, and you can read
 * them for any one of the seven.
 *
 * Real buttons, not `figure role="button"` — the prototype used the latter and
 * its own notes asked for this. `aria-pressed` rather than a tablist because a
 * tablist owes the reader arrow-key navigation, and a set of toggles that each
 * point at one shared panel is what this actually is.
 *
 * There is no deselect and no empty state: the panel is never blank, so the
 * section reads the same on a first glance as after a click.
 */
export default function DestinationPlates() {
  const [chosen, setChosen] = useState(0);
  const panelId = useId();
  const plate = LIBRARY[chosen];

  return (
    <>
      <ul className={styles.plates}>
        {LIBRARY.map((entry, i) => (
          <li key={entry.slug}>
            <button
              type="button"
              className={`${styles.plate} ${i === chosen ? styles.plateOn : ""}`}
              aria-pressed={i === chosen}
              aria-controls={panelId}
              onClick={() => setChosen(i)}
            >
              {/*
                data-theme pins the light palette inside the frame. A poster is
                a printed object on a permanently dark shelf; it does not invert
                when the reader's system does. The token block that this reads
                is emitted in page.tsx.
              */}
              <span className={styles.plateFrame} data-theme="light">
                <svg
                  viewBox="0 0 300 400"
                  aria-hidden="true"
                  focusable="false"
                  className={styles.plateArt}
                >
                  {POSTERS[entry.slug]}
                </svg>
              </span>
              <span className={styles.plateCaption}>
                <span className={styles.plateWhere}>{entry.caption}</span>
                <span className={styles.plateNo}>{entry.number}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className={styles.panel} id={panelId} aria-live="polite">
        <h3 className={styles.panelTitle}>{plate.name}</h3>
        <p className={styles.panelMeta}>
          Destination {plate.number} · {plate.occasion}
        </p>
        <p className={styles.panelTagline}>{plate.tagline}</p>

        <div className={styles.panelRows}>
          {plate.rows.map((row) => (
            <div className={styles.panelRow} key={row.label}>
              <p className={styles.panelRowLabel}>{row.label}</p>
              <p className={styles.panelRowDetail}>{row.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
