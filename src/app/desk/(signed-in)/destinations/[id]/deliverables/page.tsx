import Link from "next/link";
import { notFound } from "next/navigation";

import { query, queryOne } from "@/lib/db";
import { OCCASIONS, SECTION_KINDS, optionLabel, sectionLabel } from "@/lib/desk/labels";

import styles from "../../../../desk.module.css";
import { Empty, Head, Seam } from "../../../bits";
import {
  deleteSection,
  moveSection,
  saveSection,
  scopeIngredient,
  setOccasionVetoes,
  unscopeIngredient,
} from "./actions";

/**
 * The deliverables screen.
 *
 * Two lists and a veto. See the header of actions.ts for what each one is and
 * why they are not the same thing.
 */

export const dynamic = "force-dynamic";

type Section = {
  id: string;
  kind: string;
  heading: string | null;
  body: string;
  position: number;
};

type Scoped = {
  pool: string;
  entity_id: string;
  name: string;
  forbidden: boolean;
  affinity: string;
  note: string | null;
};

type Choice = { pool: string; id: string; name: string };

export default async function DeliverablesPage({
  params,
}: PageProps<"/desk/destinations/[id]/deliverables">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const world = await queryOne<{ name: string }>(
    `select name from world where id = $1`,
    [id]
  );
  if (!world) notFound();

  const [sections, scoped, choices, vetoes] = await Promise.all([
    query<Section>(
      `select id, kind::text as kind, heading, body, position
         from world_section where world_id = $1 order by position`,
      [id]
    ),
    // The union view `ingredient_world` (db/009) gives every pool's scoping in
    // one relation, so adding a fifth pool needs no change here. The names come
    // from each pool's own table.
    query<Scoped>(
      `select 'product' as pool, pw.product_id as entity_id, p.name,
              pw.forbidden, pw.affinity::text as affinity, pw.note
         from product_world pw join product p on p.id = pw.product_id
        where pw.world_id = $1
       union all
       select 'game', gw.game_id, g.name, gw.forbidden, gw.affinity::text, gw.note
         from game_world gw join game g on g.id = gw.game_id
        where gw.world_id = $1
       union all
       select 'menu', mw.menu_id, m.name, mw.forbidden, mw.affinity::text, mw.note
         from menu_world mw join menu m on m.id = mw.menu_id
        where mw.world_id = $1
       union all
       select 'tracklist', tw.tracklist_id, t.name, tw.forbidden,
              tw.affinity::text, tw.note
         from tracklist_world tw join tracklist t on t.id = tw.tracklist_id
        where tw.world_id = $1
       order by 1, 3`,
      [id]
    ),
    query<Choice>(
      `select 'product' as pool, id, name from product where status = 'active'
       union all select 'game', id, name from game where status = 'active'
       union all select 'menu', id, name from menu where status = 'active'
       union all select 'tracklist', id, name from tracklist where status = 'active'
       order by 1, 3
       limit 800`
    ),
    query<{ occasion: string }>(
      `select occasion::text as occasion from world_occasion
        where world_id = $1 and fit = 'forbidden'`,
      [id]
    ),
  ]);

  const vetoed = new Set(vetoes.map((row) => row.occasion));

  return (
    <>
      <Head eyebrow={world.name} title="Deliverables">
        <Link href={`/desk/destinations/${id}`} className={styles.filter}>
          Back to the destination
        </Link>
      </Head>

      <section className={styles.panel}>
        <h2 className={styles.panelHead}>
          <span>The pieces</span>
          <span>world_section</span>
        </h2>
        <p className={styles.hint}>
          The destination&apos;s default content blocks. A Revelle clones these
          and is then edited for her — so changing one here never reaches a
          Revelle that has already been built.
        </p>

        {sections.length === 0 ? (
          <Empty>No pieces yet.</Empty>
        ) : (
          <ul className={styles.todos}>
            {sections.map((section, index) => (
              <li key={section.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid var(--rule)" }}>
                <form action={saveSection} className={styles.form}>
                  <input type="hidden" name="world_id" value={id} />
                  <input type="hidden" name="section_id" value={section.id} />
                  <div className={styles.grid3}>
                    <div className={styles.field}>
                      <label className={styles.label}>Block</label>
                      <select
                        name="kind"
                        defaultValue={section.kind}
                        className={styles.select}
                      >
                        {SECTION_KINDS.map((kind) => (
                          <option key={kind.code} value={kind.code}>
                            {kind.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Heading</label>
                      <input
                        name="heading"
                        defaultValue={section.heading ?? ""}
                        placeholder={sectionLabel(section.kind)}
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Order</label>
                      <div className={styles.buttonRow}>
                        <button
                          className={styles.filter}
                          formAction={moveSection}
                          name="direction"
                          value="up"
                          disabled={index === 0}
                        >
                          ↑
                        </button>
                        <button
                          className={styles.filter}
                          formAction={moveSection}
                          name="direction"
                          value="down"
                          disabled={index === sections.length - 1}
                        >
                          ↓
                        </button>
                        <button className={styles.buttonDanger} formAction={deleteSection}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                  <textarea
                    name="body"
                    rows={3}
                    defaultValue={section.body}
                    className={styles.textarea}
                  />
                  <div className={styles.buttonRow}>
                    <button className={styles.buttonQuiet}>Save this piece</button>
                  </div>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={saveSection} className={styles.form} style={{ marginTop: "0.75rem" }}>
          <input type="hidden" name="world_id" value={id} />
          <div className={styles.grid3}>
            <div className={styles.field}>
              <label className={styles.label}>Block</label>
              <select name="kind" className={styles.select} defaultValue="arrival">
                {SECTION_KINDS.map((kind) => (
                  <option key={kind.code} value={kind.code}>
                    {kind.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Heading</label>
              <input name="heading" className={styles.input} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>&nbsp;</label>
              <button className={styles.button}>Add a piece</button>
            </div>
          </div>
          <textarea name="body" rows={2} className={styles.textarea} />
        </form>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelHead}>
          <span>The ingredients, under this destination</span>
          <span>forbidden, or re-weighted</span>
        </h2>
        <p className={styles.hint}>
          Nothing needs a row here. No row means neutral — the ingredient is
          neither pulled toward this destination nor away from it, which is the
          right default and why this list starts empty. Forbidden is structural:
          a high enough score can never sneak a forbidden thing through.
        </p>

        {scoped.length === 0 ? (
          <Empty>Nothing scoped. Everything active is eligible and neutral.</Empty>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Pool</th>
                <th>Thing</th>
                <th>Forbidden</th>
                <th>Affinity</th>
                <th>Why</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {scoped.map((row) => (
                <tr key={`${row.pool}-${row.entity_id}`}>
                  <td>{row.pool}</td>
                  <td>{row.name}</td>
                  <td>
                    <form action={scopeIngredient} className={styles.buttonRow}>
                      <input type="hidden" name="world_id" value={id} />
                      <input type="hidden" name="pool" value={row.pool} />
                      <input type="hidden" name="entity_id" value={row.entity_id} />
                      <input
                        type="checkbox"
                        name="forbidden"
                        defaultChecked={row.forbidden}
                      />
                      <input
                        type="number"
                        name="affinity"
                        step="0.05"
                        min={-1}
                        max={1}
                        defaultValue={Number(row.affinity)}
                        className={styles.input}
                        style={{ width: "5rem" }}
                      />
                      <input
                        name="note"
                        defaultValue={row.note ?? ""}
                        className={styles.input}
                      />
                      <button className={styles.filter}>Save</button>
                    </form>
                  </td>
                  <td colSpan={3}>
                    <form action={unscopeIngredient}>
                      <input type="hidden" name="world_id" value={id} />
                      <input type="hidden" name="pool" value={row.pool} />
                      <input type="hidden" name="entity_id" value={row.entity_id} />
                      <button className={styles.filter}>Stop having an opinion</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <form action={scopeIngredient} className={styles.form} style={{ marginTop: "0.75rem" }}>
          <input type="hidden" name="world_id" value={id} />
          <div className={styles.grid3}>
            <div className={styles.field}>
              <label className={styles.label}>Pool</label>
              <select name="pool" className={styles.select}>
                <option value="product">Products</option>
                <option value="game">Games</option>
                <option value="menu">Menus</option>
                <option value="tracklist">Soundtracks</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Thing</label>
              <select name="entity_id" className={styles.select}>
                {choices.map((choice) => (
                  <option key={`${choice.pool}-${choice.id}`} value={choice.id}>
                    {choice.pool} · {choice.name}
                  </option>
                ))}
              </select>
              <span className={styles.hint}>
                Pick the pool that matches the thing — they are stored in
                separate tables and a mismatch simply will not save.
              </span>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Affinity</label>
              <input
                name="affinity"
                type="number"
                step="0.05"
                min={-1}
                max={1}
                defaultValue={0}
                className={styles.input}
              />
              <label className={styles.facetItem}>
                <input type="checkbox" name="forbidden" />
                <span>Forbidden here</span>
              </label>
            </div>
          </div>
          <input name="note" placeholder="Why" className={styles.input} />
          <div className={styles.buttonRow}>
            <button className={styles.button}>Scope it</button>
          </div>
        </form>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelHead}>
          <span>Occasions this destination refuses</span>
          <span>the rare veto</span>
        </h2>
        <form action={setOccasionVetoes} className={styles.form}>
          <input type="hidden" name="world_id" value={id} />
          <ul className={styles.facetList}>
            {OCCASIONS.map((code) => (
              <li key={code}>
                <label className={styles.facetItem}>
                  <input
                    type="checkbox"
                    name="forbidden"
                    value={code}
                    defaultChecked={vetoed.has(code)}
                  />
                  <span>{optionLabel("occasion", code)}</span>
                </label>
              </li>
            ))}
          </ul>
          <p className={styles.hint}>
            The default is that a destination carries every occasion in a
            different shape — that is what makes the catalogue compound. Tick
            one only when the destination genuinely cannot survive it.
          </p>
          <div className={styles.buttonRow}>
            <button className={styles.button}>Save the vetoes</button>
          </div>
        </form>
      </section>

      <Seam title="The occasion decides which slots exist">
        Which pieces a Revelle actually has is the OCCASION&apos;s decision
        (occasion_slot, db/009), not this screen&apos;s: a dinner party has no
        arrival day, and a birthday has a beat where the person is marked. This
        page says what this destination brings and what it refuses; the engine
        puts those into the slots her occasion opens.
      </Seam>
    </>
  );
}
