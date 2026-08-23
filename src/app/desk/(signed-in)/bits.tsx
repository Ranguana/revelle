import styles from "../desk.module.css";

/**
 * The small repeated pieces of the desk. Server components, no state.
 *
 * They exist so that "a labelled fact" and "a row of tags" look identical on
 * every screen — the tool is dense, and density only reads if the same thing
 * is always the same shape.
 */

export function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.fact}>
      <span className={styles.factLabel}>{label}</span>
      <span className={styles.factValue}>{children}</span>
    </div>
  );
}

export function Chips({
  items,
  tone,
}: {
  items: readonly string[];
  /** 'no' marks the answers that are vetoes — what would ruin it. */
  tone?: "no";
}) {
  if (items.length === 0) return <span className={styles.factValue}>—</span>;
  return (
    <ul className={styles.chips}>
      {items.map((item) => (
        <li
          key={item}
          className={`${styles.chip} ${tone === "no" ? styles.chipNo : ""}`}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * WHAT A ROW'S COLOUR MEANS, DECIDED IN ONE PLACE.
 *
 * Every status this tool has, sorted into three families. The families are the
 * ones the status mark has always drawn; naming them is what lets the ROW be
 * drawn the same colour as the mark it carries, on every list, without seven
 * screens each deciding for themselves.
 *
 *   open    it exists and is not offered to anybody yet, or it has just
 *           arrived and nobody has touched it. Somebody's turn.
 *   live    it is in play right now — offered, or being worked.
 *   closed  it is finished with. Kept for the record, and it recedes.
 *
 * A code that is not in this map gets NO family, no tint and no bar, and its
 * mark falls back to the plain border. That is deliberate: a status added in a
 * migration and not added here should look unclassified rather than quietly
 * borrow a meaning nobody chose for it.
 *
 * The three groupings are argued in the row-colour block at the top of
 * desk.module.css. The one that looks surprising is `new` sitting with `draft`
 * — an application nobody has opened and a dish nobody has offered are the
 * same shape of fact: the house has it and the house has not acted on it.
 */
export type StatusFamily = "open" | "live" | "closed";

const STATUS_FAMILY: Readonly<Record<string, StatusFamily>> = {
  // quiz_status, db/001
  new: "open",
  in_progress: "live",
  delivered: "closed",
  archived: "closed",
  // product_status, db/002 — shared by product, game, menu, drink, dish
  draft: "open",
  active: "live",
  discontinued: "closed",
  // world_status, db/001
  published: "live",
  retired: "closed",
};

export function statusFamily(
  code: string | null | undefined
): StatusFamily | null {
  if (!code) return null;
  return STATUS_FAMILY[code] ?? null;
}

/** The row tint and edge bar, by family. */
const FAMILY_MARK: Readonly<Record<StatusFamily, string>> = {
  open: styles.markOpen,
  live: styles.markLive,
  closed: styles.markClosed,
};

/** The status mark's own colour, by the SAME family, so the two cannot drift. */
const FAMILY_STATUS: Readonly<Record<StatusFamily, string>> = {
  open: styles.statusNew,
  live: styles.statusProgress,
  closed: styles.statusDone,
};

const FAMILY_GLOSS: Readonly<Record<StatusFamily, string>> = {
  open: "in hand, offered to nobody yet",
  live: "in play right now",
  closed: "finished with, kept for the record",
};

export function Status({ code, label }: { code: string; label?: string }) {
  const family = statusFamily(code);
  return (
    <span
      className={`${styles.status} ${family ? FAMILY_STATUS[family] : ""}`}
    >
      {label ?? code}
    </span>
  );
}

/**
 * The class list for a CARD row (`<li>`), tinted by its status.
 *
 * A function rather than a component because the three card lists each pass
 * their own extra classes and their own children layout, and wrapping them
 * would mean inventing a second card idiom to hold the first one.
 */
export function rowClass(status: string | null | undefined): string {
  const family = statusFamily(status);
  return family ? `${styles.row} ${FAMILY_MARK[family]}` : styles.row;
}

/**
 * A TABLE row, tinted by its status. Drop-in for `<tr>`.
 *
 * `status` may be absent — a table of things that have no status (a game's
 * steps, a menu's dishes) renders an ordinary row and says nothing.
 */
export function TableRow({
  status,
  children,
}: {
  status?: string | null;
  children: React.ReactNode;
}) {
  const family = statusFamily(status);
  return (
    <tr className={family ? `${styles.tableRow} ${FAMILY_MARK[family]}` : ""}>
      {children}
    </tr>
  );
}

/**
 * What the colour means, on the screen that uses it.
 *
 * Takes the status map the screen is already using to label its marks, so the
 * legend names THIS pool's statuses ("Draft, Active, Discontinued") rather
 * than a generic three words that match nothing on the page. A colour without
 * this is decoration.
 */
export function StatusLegend({
  statuses,
}: {
  statuses: Readonly<Record<string, string>>;
}) {
  const families = (["open", "live", "closed"] as const)
    .map((family) => ({
      family,
      labels: Object.entries(statuses)
        .filter(([code]) => statusFamily(code) === family)
        .map(([, label]) => label),
    }))
    .filter((group) => group.labels.length > 0);

  if (families.length === 0) return null;

  return (
    <ul className={styles.legend}>
      <li className={styles.legendLead}>Row colour is the row&rsquo;s status</li>
      {families.map((group) => (
        <li key={group.family}>
          <span
            className={`${styles.legendSwatch} ${FAMILY_MARK[group.family]}`}
            aria-hidden="true"
          />
          <span>
            {group.labels.join(", ")} — {FAMILY_GLOSS[group.family]}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Head({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={styles.head}>
      <div>
        {eyebrow ? <p className={styles.sub}>{eyebrow}</p> : null}
        <h1 className={styles.title}>{title}</h1>
      </div>
      {children ? <div className={styles.buttonRow}>{children}</div> : null}
    </header>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className={styles.empty}>{children}</p>;
}

/**
 * A marked seam. Used where a concurrent piece of work will plug in, so that
 * "nothing here yet" is a statement rather than something that looks broken.
 */
export function Seam({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.seam}>
      <strong>{title}</strong>
      {children}
    </div>
  );
}
