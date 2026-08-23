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
    { href: "/desk/menus", label: "Menus" },
    { href: "/desk/dishes", label: "Dishes" },
    { href: "/desk/drinks", label: "Drinks" },
    { href: "/desk/games", label: "Games" },
    { href: "/desk/bank", label: "Atmosphere" },
    { href: "/desk/products", label: "Products" },
    // LAST IN THE LIBRARY GROUP, not in "What it does", because publishing is
    // not an instrument for reading the engine — it is the gesture that decides
    // what the seven lists above it are allowed to be. It belongs under them, at
    // the end, where the work ends.
    { href: "/desk/publish", label: "Publish" },
  ],
  // The three screens that show what the library DOES rather than what is in
  // it. Their own group, above the messages, because they are the working
  // surface of a curator tuning the engine rather than a list to maintain.
  [
    { href: "/desk/bench", label: "Test bench" },
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
