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

const STATUS_CLASS: Readonly<Record<string, string>> = {
  new: styles.statusNew,
  in_progress: styles.statusProgress,
  delivered: styles.statusDone,
  archived: styles.statusDone,
  draft: styles.statusNew,
  active: styles.statusProgress,
  published: styles.statusProgress,
  discontinued: styles.statusDone,
  retired: styles.statusDone,
};

export function Status({ code, label }: { code: string; label?: string }) {
  return (
    <span className={`${styles.status} ${STATUS_CLASS[code] ?? ""}`}>
      {label ?? code}
    </span>
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
