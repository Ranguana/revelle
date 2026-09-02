"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import styles from "../../desk.module.css";

/**
 * THE DROPPABLE AREA.
 *
 * Founder, 2026-09-02: "the image bank should be a droppable area on a tab on
 * the desk so Tara and I can drop images".
 *
 * ── DRAG AND A PICKER, BOTH, ALWAYS ─────────────────────────────────
 *
 * Some people never drag anything, and a drop zone with no button is a screen
 * they cannot use at all. So the zone is also a `<label>` over a real
 * `<input type="file" multiple>`: clicking anywhere opens the picker, the
 * input keeps its place in the tab order (it is moved off-screen, not
 * `display: none`), and a keyboard reaches it without knowing about the drag.
 *
 * ── ONE REQUEST PER FILE, A FEW AT A TIME ───────────────────────────
 *
 * A twenty-file drop as one post is one long wait with no sign of life, and
 * one bad file in it takes the other nineteen down. So each file is its own
 * request, three in flight at once, and each result is drawn as it lands: the
 * good ones are in the bank while the bad one is being explained, and the
 * refusal names the file it is about.
 *
 * Three, not twenty: twenty parallel uploads of phone photographs is a browser
 * with its connection pool full and a server decoding twenty images at once.
 *
 * ── NOTHING DISAPPEARS ON ITS OWN ───────────────────────────────────
 *
 * Every line stays until the page is left. A refusal that fades is a refusal
 * nobody read, and this is the one place in the flow where the reason a
 * picture is not in the bank exists only on screen.
 *
 * `router.refresh()` is called once, after the whole drop settles, rather than
 * per file — the list below is a server component and re-rendering it twenty
 * times while twenty uploads are in flight is the only way this screen could
 * be made to feel slow.
 */

type Line = {
  key: string;
  filename: string;
  state: "sending" | "stored" | "duplicate" | "refused";
  said: string;
};

/** In flight at once. See ONE REQUEST PER FILE above. */
const LANES = 3;

export default function DropZone({ accept }: { accept: string }) {
  const router = useRouter();
  const [over, setOver] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(0);
  const counter = useRef(0);

  const send = useCallback(
    async (file: File, key: string) => {
      const body = new FormData();
      body.append("file", file);
      try {
        const response = await fetch("/desk/images/upload", {
          method: "POST",
          body,
        });
        const outcome = (await response.json()) as {
          state?: string;
          refusal?: string;
        };
        setLines((was) =>
          was.map((line) =>
            line.key !== key
              ? line
              : outcome.state === "stored"
                ? { ...line, state: "stored", said: "in the bank" }
                : outcome.state === "duplicate"
                  ? {
                      ...line,
                      state: "duplicate",
                      said: "already here — same picture",
                    }
                  : {
                      ...line,
                      state: "refused",
                      said: outcome.refusal ?? "refused",
                    }
          )
        );
      } catch (err) {
        // A network failure is not a refusal by the house and must not read
        // like one. Say what actually happened.
        setLines((was) =>
          was.map((line) =>
            line.key !== key
              ? line
              : {
                  ...line,
                  state: "refused",
                  said: `did not reach the desk (${
                    err instanceof Error ? err.message : "connection lost"
                  })`,
                }
          )
        );
      }
    },
    []
  );

  const take = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const chosen = Array.from(files);

      const keyed = chosen.map((file) => {
        counter.current += 1;
        return { file, key: `f${counter.current}` };
      });

      setLines((was) => [
        ...was,
        ...keyed.map(({ file, key }) => ({
          key,
          filename: file.name || "(no name)",
          state: "sending" as const,
          said: "sending…",
        })),
      ]);
      setBusy((n) => n + keyed.length);

      // A fixed number of lanes pulling from one queue, so a hundred files is
      // still three requests at a time rather than a hundred.
      let next = 0;
      const lane = async () => {
        for (;;) {
          const index = next;
          next += 1;
          if (index >= keyed.length) return;
          await send(keyed[index].file, keyed[index].key);
          setBusy((n) => n - 1);
        }
      };
      await Promise.all(Array.from({ length: LANES }, lane));

      router.refresh();
    },
    [router, send]
  );

  return (
    <div
      className={`${styles.drop} ${over ? styles.dropOver : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        void take(event.dataTransfer.files);
      }}
    >
      <label>
        <p className={styles.dropLead}>Drop reference pictures here</p>
        <p className={styles.dropHint}>
          Or click anywhere in this box to choose them. As many at a time as you
          like. They stay on the desk — these are other people&rsquo;s
          photographs, held as reference, and nothing here ever reaches a
          member.
        </p>
        <input
          type="file"
          className={styles.dropPick}
          accept={accept}
          multiple
          onChange={(event) => {
            void take(event.currentTarget.files);
            // So the same file can be chosen twice running, which is what
            // happens when the first attempt was refused and fixed.
            event.currentTarget.value = "";
          }}
        />
      </label>

      {lines.length > 0 ? (
        <ul className={styles.dropList}>
          {lines.map((line) => (
            <li
              key={line.key}
              className={
                line.state === "refused"
                  ? styles.dropBad
                  : line.state === "sending"
                    ? undefined
                    : styles.dropDone
              }
            >
              <span>{line.filename}</span>
              <span>{line.said}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {busy > 0 ? (
        <p className={styles.dropHint} aria-live="polite">
          {busy} still going up. The list below fills in when they land.
        </p>
      ) : null}
    </div>
  );
}
