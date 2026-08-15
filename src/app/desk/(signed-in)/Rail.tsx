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
  [{ href: "/desk", label: "The inbox", exact: true }],
  [
    { href: "/desk/destinations", label: "Destinations" },
    { href: "/desk/menus", label: "Menus" },
    { href: "/desk/products", label: "Products" },
  ],
  [
    { href: "/desk/todo", label: "To-do" },
    { href: "/desk/thread", label: "Thread" },
  ],
];

const HEADS = ["", "The library", "Between us"];

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
