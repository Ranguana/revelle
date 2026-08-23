import Link from "next/link";
import { notFound } from "next/navigation";

import { query, queryOne } from "@/lib/db";
import { POOL_STATUS, money } from "@/lib/desk/labels";

import styles from "../../../desk.module.css";
import Thread from "../../Thread";
import { Empty, Head, Seam, Status } from "../../bits";
import BankForm, { type BankValues } from "../BankForm";
import { attachIngredient, detachIngredient } from "../actions";

export const dynamic = "force-dynamic";

type Item = BankValues & {
  id: string;
  name: string;
  status: string;
  world_name: string;
  gesture: string | null;
  gesture_note: string | null;
};

export default async function BankItemPage({
  params,
  searchParams,
}: PageProps<"/desk/bank/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const saved = (await searchParams).saved === "1";

  const item = await queryOne<Item>(
    `select b.id, b.slug::text as slug, b.world_id, b.kind::text as kind,
            b.name, b.description, b.phase::text as phase,
            b.venue::text as venue, b.min_lead_days, b.ships,
            b.technique_card_id, b.weight::text as weight,
            b.status::text as status, b.source_citation,
            w.name as world_name, w.gesture, w.gesture_note
       from bank_item b
       join world w on w.id = b.world_id
      where b.id = $1`,
    [id]
  );
  if (!item) notFound();

  const [destinations, cards, ingredients, products] = await Promise.all([
    query<{ id: string; name: string }>(
      `select id, name from world where status <> 'retired' order by name`
    ),
    // ONLY PRINTED CARDS ARE OFFERED, because only a printed card may be one —
    // db/031 enforces it from a trigger and refuses anything else by name. The
    // picker matching the rule means a curator never provokes the refusal; the
    // refusal is still shown verbatim if she does, from actions.ts.
    query<{ id: string; name: string; world_name: string }>(
      `select b.id, b.name, w.name as world_name
         from bank_item b
         join world w on w.id = b.world_id
        where b.kind = 'printed_card' and b.id <> $1
        order by w.name, b.name`,
      [id]
    ),
    query<{
      product_id: string;
      name: string;
      price_cents: number | null;
      status: string;
      note: string;
    }>(
      `select i.product_id, p.name, p.price_cents, p.status::text as status,
              i.note
         from bank_item_ingredient i
         join product p on p.id = i.product_id
        where i.bank_item_id = $1
        order by p.name`,
      [id]
    ),
    // The offerable pool, minus what is already attached. Capped, and the cap
    // is stated below rather than silently cutting the list.
    query<{ id: string; name: string }>(
      `select p.id, p.name
         from product p
        where p.status = 'active'
          and not exists (select 1 from bank_item_ingredient i
                           where i.bank_item_id = $1 and i.product_id = p.id)
        order by p.name
        limit 500`,
      [id]
    ),
  ]);

  return (
    <>
      <Head eyebrow="The bank" title={item.name}>
        <Status code={item.status} label={POOL_STATUS[item.status]} />
        <Link href="/desk/bank" className={styles.filter}>
          All of the bank
        </Link>
      </Head>

      {saved ? <p className={styles.ok}>Saved.</p> : null}

      <div className={styles.panels}>
        <div>
          <BankForm values={item} destinations={destinations} cards={cards} />
        </div>
        <div>
          {/*
            SHOPPABLE ATMOSPHERE — db/031's `bank_item_ingredient`, and its own
            panel rather than a field inside the form above. Two reasons, and
            neither is layout: a nested <form> is not legal HTML, and the dish
            form's long comment records what happens when a save owns a
            relationship it cannot fully see. Attaching and detaching are their
            own gestures and cannot be undone by saving an unrelated field.
          */}
          <section className={styles.panel}>
            <h2 className={styles.panelHead}>What she buys for it</h2>

            {ingredients.length === 0 ? (
              <Empty>
                Nothing attached. Most of the bank buys nothing — a good, an act
                or a card only points at products when there is something to
                actually put in a basket.
              </Empty>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Note</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((row) => (
                    <tr key={row.product_id}>
                      <td>
                        <Link
                          href={`/desk/products/${row.product_id}`}
                          className={styles.link}
                        >
                          {row.name}
                        </Link>
                        {row.status !== "active" ? (
                          <div className={styles.when}>
                            {POOL_STATUS[row.status]} — the engine cannot see it
                          </div>
                        ) : null}
                      </td>
                      <td className={styles.numeric}>{money(row.price_cents)}</td>
                      <td>{row.note || "—"}</td>
                      <td>
                        <form action={detachIngredient}>
                          <input type="hidden" name="id" value={item.id} />
                          <input
                            type="hidden"
                            name="product_id"
                            value={row.product_id}
                          />
                          <button className={styles.filter}>Detach</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {products.length === 0 ? (
              <p className={styles.hint}>
                No offered products left to attach.{" "}
                <Link href="/desk/products" className={styles.link}>
                  The edit
                </Link>{" "}
                is where one is added and offered.
              </p>
            ) : (
              <form action={attachIngredient} className={styles.buttonRow}>
                <input type="hidden" name="id" value={item.id} />
                <select
                  name="product_id"
                  aria-label="Product"
                  className={styles.select}
                  defaultValue=""
                >
                  <option value="">Pick a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <input
                  name="note"
                  placeholder="Why this one"
                  aria-label="Why this one"
                  className={styles.input}
                />
                <button className={styles.button}>Attach</button>
              </form>
            )}

            <p className={styles.hint}>
              Only offered products are listed, because a draft one cannot reach
              a member anyway. At most 500 are shown.
            </p>
          </section>

          <Thread
            subject={{ table: "bank_item", id }}
            back={`/desk/bank/${id}`}
            title="Notes on this line"
          />
        </div>
      </div>

      <Seam title={`The gesture at ${item.world_name} is not a bank row`}>
        {item.gesture ? (
          <>
            <strong>{item.gesture}</strong>
            {item.gesture_note ? ` — ${item.gesture_note}` : ""}. Read-only
            here: a gesture is the one thing that ALWAYS happens in this room,
            so it is invariant rather than something selection chooses among. It
            lives on the destination record and is edited there.
          </>
        ) : (
          <>
            Nothing written yet. A gesture is the one thing that always happens
            in this room. Because it is invariant it is not bank content — an
            invariant in a pool of variables eventually gets left out of a
            package — so it lives on the destination record and is never edited
            from this screen.
          </>
        )}
      </Seam>
    </>
  );
}
