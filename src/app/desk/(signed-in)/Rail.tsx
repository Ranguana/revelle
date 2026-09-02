"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "../desk.module.css";

/**
 * The rail. A client component for one reason: `aria-current` needs to know
 * which page is open, and that is the pathname.
 *
 * The marks beside "To-do" and "Thread" are MARKS, not counts. db/013 and
 * docs/copy-brief.md agree on why: a number is something two people start
 * working to.
 */

const SECTIONS: readonly { href: string; label: string; exact?: boolean }[][] = [
  [
    { href: "/desk", label: "The inbox", exact: true },
    { href: "/desk/members", label: "Members" },
  ],
  [
    { href: "/desk/destinations", label: "Destinations" },
    // MENUS ARE NOT IN THE RAIL. Founder ruling, 2026-08-27, said more than
    // once before it was acted on: the pool is retired (db/045) and a tab for
    // a pool nothing can deliver is a standing invitation to misread the desk.
    // The route still exists at /desk/menus so the 39 retired evenings stay
    // readable to anyone who goes looking — retirement preserved the
    // sequencing judgement and this does not undo that. It is simply not a
    // place the desk sends anybody.
    { href: "/desk/dishes", label: "Dishes" },
    { href: "/desk/drinks", label: "Drinks" },
    { href: "/desk/games", label: "Games" },
    { href: "/desk/bank", label: "Atmosphere" },
    // BESIDE ATMOSPHERE, NOT BESIDE THE THREE GESTURES BELOW. The image bank
    // is where atmosphere comes FROM: two curators drop reference pictures,
    // each is read for the object in it, and an approved placement becomes a
    // draft in the row above. Publish, Stocked and Reconcile are what happens
    // to a row once it exists; this is where one starts.
    { href: "/desk/images", label: "Image bank" },
    { href: "/desk/products", label: "Products" },
    // LAST IN THE LIBRARY GROUP, not in "What it does", because publishing is
    // not an instrument for reading the engine — it is the gesture that decides
    // what the seven lists above it are allowed to be. It belongs under them, at
    // the end, where the work ends.
    //
    // TWO GESTURES, SIDE BY SIDE, and the pairing is the point. Publish is
    // consent and now governs one class of thing: destinations, plus whatever a
    // person drafted or a seeder held back on a question. Stocked is the veto,
    // for the pools that stock themselves (db/036, CLAUDE.md rule 13). Reading
    // the two labels next to each other is reading the rule.
    { href: "/desk/publish", label: "Publish" },
    { href: "/desk/stocked", label: "Stocked" },
    // THE THIRD GESTURE, beside the other two and last because it is the
    // narrowest. Publish is consent, Stocked is the veto, and this settles the
    // one question neither can reach: where the database's copy and
    // src/lib/destinations.ts have parted, which side a member reads. It is in
    // the rail rather than folded into Destinations because it is a pass —
    // something you sit down and finish — and a pass with no door is a screen
    // nobody finds twice.
    { href: "/desk/reconcile", label: "Reconcile" },
  ],
  // The three screens that show what the library DOES rather than what is in
  // it. Their own group, above the messages, because they are the working
  // surface of a curator tuning the engine rather than a list to maintain.
  [
    { href: "/desk/bench", label: "Test bench" },
    // The second bench, beside the first, because they are the same gesture
    // pointed at the two halves of a destination: one runs the engine that
    // CHOOSES a room, the other runs the writer that SPEAKS in it. The writer
    // had no surface at all until this one — it was reachable only from a
    // member's own portal, which is a strange place to keep the only way to
    // hear how a house sounds.
    { href: "/desk/writing", label: "Writing bench" },
    { href: "/desk/matrix", label: "Connections" },
    { href: "/desk/coverage", label: "Coverage" },
  ],
  [
    { href: "/desk/todo", label: "To-do" },
    { href: "/desk/thread", label: "Thread" },
  ],
];

const HEADS = ["", "The library", "What it does", "Between us"];

export default function Rail({
  openTodos,
  unreadGeneral,
}: {
  openTodos: number;
  unreadGeneral: boolean;
}) {
  const pathname = usePathname();

  const current = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  // A fragment: the rail's own box, padding and stickiness belong to the
  // layout, which also owns the footer under this.
  return (
    <>
      <Link href="/desk" className={styles.railMark}>
        Revelle
        <br />
        the desk
      </Link>

      {SECTIONS.map((group, index) => (
        <nav key={index} className={styles.railGroup}>
          {HEADS[index] ? <p className={styles.railHead}>{HEADS[index]}</p> : null}
          {group.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.railLink}
              aria-current={current(item.href, item.exact) ? "page" : undefined}
            >
              <span>{item.label}</span>
              {item.href === "/desk/todo" && openTodos > 0 ? (
                <span aria-label="there is work waiting">·</span>
              ) : null}
              {item.href === "/desk/thread" && unreadGeneral ? (
                <span aria-label="unread">·</span>
              ) : null}
            </Link>
          ))}
        </nav>
      ))}
    </>
  );
}
