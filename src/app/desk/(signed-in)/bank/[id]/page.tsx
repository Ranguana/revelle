import Link from "next/link";
import { notFound } from "next/navigation";

import { query, queryOne } from "@/lib/db";
import { POOL_STATUS, money } from "@/lib/desk/labels";
import { BANK_PER_PAGE, bankSequence } from "@/lib/desk/lists";
import {
  requirementVocabulary,
  requirementsFor,
} from "@/lib/desk/requirements";
import { readReview, reviewPass } from "@/lib/desk/review";

import styles from "../../../desk.module.css";
import Thread from "../../Thread";
import { Chips, Empty, Head, Review, Seam, Status } from "../../bits";
import BankForm, { type BankValues } from "../BankForm";
import {
  attachIngredient,
  clearBankRequirement,
  declareBankRequirement,
  detachIngredient,
} from "../actions";

export const dynamic = "force-dynamic";

type Item = BankValues & {
  id: string;
  name: string;
  status: string;
  world_name: string;
  gesture: string | null;
  gesture_note: string | null;
  /**
   * db/033's `world.venue_requirement` — what this DESTINATION's deliverable
   * presupposes, joined for its words. Read-only here and never scored.
   */
  world_requirement: string | null;
  world_requirement_label: string | null;
  world_requirement_demand: string | null;
};

export default async function BankItemPage({
  params,
  searchParams,
}: PageProps<"/desk/bank/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const search = await searchParams;
  const saved = search.saved === "1";
  // The pass she is in, if any: this pool's filters and her place in them.
  const carried = readReview(search);

  const item = await queryOne<Item>(
    // THE HOME ROOM, AFTER db/043. `bank_item.world_id` is gone; the item
    // claims destinations through bank_item_world and may claim several.
    // `home_id` is the first of them and is what the form edits, because the
    // form has one select — and the gesture and the venue requirement shown
    // beside it are facts about THAT room. Where a second claim exists, the
    // list screen shows it and this screen's destination select says so; a
    // multi-home editor is a screen somebody argues for, not a silent
    // widening of this one.
    `select b.id, b.slug::text as slug, b.home_id as world_id,
            b.kind::text as kind,
            b.name, b.description, b.phase::text as phase,
            b.min_lead_days, b.ships,
            b.technique_card_id, b.weight::text as weight,
            b.status::text as status, b.source_citation,
            array_to_string(b.world_names, ' · ') as world_name,
            w.gesture, w.gesture_note,
            w.venue_requirement as world_requirement,
            k.label as world_requirement_label,
            k.demand as world_requirement_demand
       from bank_item_card b
       left join world w on w.id = b.home_id
       left join structural_requirement k on k.code = w.venue_requirement
      where b.id = $1`,
    [id]
  );
  if (!item) notFound();

  const [
    destinations,
    cards,
    ingredients,
    products,
    requirements,
    vocabulary,
  ] = await Promise.all([
    // `slug` as well as the name: the name fills the form's select, the slug is
    // what the bank's destination filter matches on, and a pass has to resolve
    // that filter exactly as the list screen did. src/lib/desk/lists.ts.
    query<{ id: string; name: string; slug: string }>(
      `select id, name, slug::text as slug from world
        where status <> 'retired' order by name`
    ),
    // ONLY PRINTED CARDS ARE OFFERED, because only a printed card may be one —
    // db/031 enforces it from a trigger and refuses anything else by name. The
    // picker matching the rule means a curator never provokes the refusal; the
    // refusal is still shown verbatim if she does, from actions.ts.
    query<{ id: string; name: string; world_name: string }>(
      `select b.id, b.name,
              array_to_string(b.world_names, ' · ') as world_name
         from bank_item_card b
        where b.kind = 'printed_card' and b.id <> $1
        order by b.home_name, b.name`,
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
    requirementsFor("bank_item", id),
    requirementVocabulary(),
  ]);

  // What is left to declare. The vocabulary arrives in db/020's `position`
  // order and stays in it, which is what puts `outdoor_access` directly under
  // `requires_outdoors` in the select — the lesser grade under the greater,
  // rather than four rows away under an alphabetical sort.
  const declared = new Set(requirements.map((row) => row.code));
  const undeclared = vocabulary.filter((kind) => !declared.has(kind.code));

  // Asked only when a review is running, and asked LIVE: the sequence is
  // recounted here rather than carried, so a line published off a drafts-only
  // pass reports that it has left the list instead of pretending it has not.
  const sequence = carried
    ? await bankSequence(carried.search, {
        destinations: destinations.map((row) => row.slug),
        requirements: vocabulary.map((entry) => entry.code),
      })
    : [];
  const pass = carried
    ? reviewPass({
        path: "/desk/bank",
        ids: sequence,
        id,
        carried,
        perPage: BANK_PER_PAGE,
      })
    : null;

  return (
    <>
      <Head eyebrow="The bank" title={item.name}>
        <Status code={item.status} label={POOL_STATUS[item.status]} />
        <Link href="/desk/bank" className={styles.filter}>
          All of the bank
        </Link>
      </Head>

      {pass ? <Review pass={pass} noun="lines" /> : null}

      {saved ? <p className={styles.ok}>Saved.</p> : null}

      <div className={styles.panels}>
        <div>
          <BankForm
            values={item}
            carried={carried}
            destinations={destinations}
            cards={cards}
          />
        </div>
        <div>
          {/*
            WHAT IT NEEDS OF THE ROOM — `ingredient_requirement`, db/020 and
            db/033, and the panel that replaces the venue select db/033 took
            off the form beside it.

            It is built as the ingredient panel below it is built, deliberately
            and not for want of an idea: a table of what is declared with a
            clear button per row, then a select, a note and a button to declare
            one more. Same reasons, and neither is layout — a nested <form> is
            not legal HTML, and a save that owns a relationship it cannot fully
            see will eventually destroy one.

            ── THE TWO GRADES ARE NEVER ONE CONTROL ──

            The distinction the dropped `bank_venue` was built to protect
            survives the move intact. A requirement some room REFUSES is drawn
            with the veto mark the rest of the desk gives a thing that rules an
            evening out; a requirement no room refuses is plain text. That is
            not a list kept here — it is `venue_affordance`, the same table
            venueEligibility() prunes with, so the mark means exactly "this can
            delete a deliverable" and cannot drift from what actually does.

            `outdoor_access` comes out plain by that test rather than by being
            named: db/033 adds the code and no affordance rows, so no room
            declines it. It is a GRADE and not a sibling — anything satisfying
            `requires_outdoors` satisfies it — and the position ordering keeps
            the two adjacent wherever the vocabulary prints.
          */}
          <section className={styles.panel}>
            <h2 className={styles.panelHead}>What it needs of the room</h2>

            {requirements.length === 0 ? (
              <Empty>
                Nothing declared, and that is a complete answer rather than an
                empty one: no requirement means it works anywhere. db/020 calls
                that the safe default and the founder&rsquo;s instruction where
                it is a judgement call — a wrong tag deletes this line silently
                and forever, a missing one costs a curator a second look.
              </Empty>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>It needs</th>
                    <th>Which reads</th>
                    <th>Note</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {requirements.map((row) => (
                    <tr key={row.code}>
                      <td>
                        {row.vetoes ? (
                          <Chips items={[row.label]} tone="no" />
                        ) : (
                          row.label
                        )}
                      </td>
                      <td>
                        {/*
                          db/020 shaped `demand` to complete "it …" in a
                          rejection sentence, so this column is the sentence a
                          host would be given if the room could not do it.
                        */}
                        it {row.demand}
                        {row.vetoes ? null : (
                          <div className={styles.when}>
                            no room in the library refuses this, so it prunes
                            nothing on its own
                          </div>
                        )}
                      </td>
                      <td>{row.note || "—"}</td>
                      <td>
                        <form action={clearBankRequirement}>
                          <input type="hidden" name="id" value={item.id} />
                          <input
                            type="hidden"
                            name="requirement"
                            value={row.code}
                          />
                          <button className={styles.filter}>Clear it</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {undeclared.length === 0 ? (
              <p className={styles.hint}>
                It already carries every requirement there is, which is almost
                certainly more than one line can mean. Clear the ones that are
                not true of it.
              </p>
            ) : (
              <form action={declareBankRequirement} className={styles.buttonRow}>
                <input type="hidden" name="id" value={item.id} />
                <select
                  name="requirement"
                  aria-label="What it needs of the room"
                  className={styles.select}
                  defaultValue=""
                >
                  <option value="">Pick what the room must do</option>
                  {undeclared.map((kind) => (
                    <option key={kind.code} value={kind.code}>
                      {/*
                        The mark is the truth about consequence, not a
                        decoration: a requirement some room refuses can delete
                        this line from a package, and one nothing refuses
                        cannot. Said in words here because a select cannot
                        carry a chip.
                      */}
                      {kind.label}
                      {kind.vetoes ? "" : " — no room refuses this one"}
                    </option>
                  ))}
                </select>
                <input
                  name="note"
                  placeholder="Why this one"
                  aria-label="Why this one"
                  className={styles.input}
                />
                <button className={styles.button}>Declare it</button>
              </form>
            )}

            <p className={styles.hint}>
              <strong>
                &ldquo;Needs a door to somewhere&rdquo; is a grade of
                &ldquo;Needs outdoors&rdquo;, not a sibling of it.
              </strong>{" "}
              A terrace, a stoop, a balcony, a yard — and anything that
              satisfies the harder one satisfies this. Declare the harder one
              only when the line genuinely cannot happen inside: it is the one
              a room can refuse, and a host with no outside then never sees the
              line at all.
            </p>
            <p className={styles.hint}>
              These are the same words a menu, a drink, a dish, a game and a
              product use. db/033 unified the vocabulary rather than bridging
              two of them, so what a bank item asks of a room is legible to the
              filter that already reads every other pool.
            </p>
          </section>

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

      {/*
        WHAT THE DESTINATION PRESUPPOSES — db/033's `world.venue_requirement`.

        Here because a bank item in a room that presupposes outdoors INHERITS a
        constraint it never declared, and a curator reading this line has no
        other way to know. Tahiti and Palm Springs carried `requires_outdoors`
        in a markdown heading for months, which is not data and cannot be read
        by anything; it is a column now, and this is where it reaches the person
        deciding whether the line is worth writing.

        READ-ONLY, and it will not become editable from this screen. It belongs
        to the destination — and db/033 is emphatic that it is read at the
        reveal and SURFACED, never scored: venue must never touch which
        destination a party is in. Standing rule 2, enforced in vector.ts,
        db/020 and selection.test.ts.
      */}
      {item.world_requirement ? (
        <Seam title={`${item.world_name} already presupposes a room`}>
          Its deliverable{" "}
          <strong>
            {item.world_requirement_demand
              ? `${item.world_requirement_demand}`
              : item.world_requirement}
          </strong>
          {item.world_requirement_label
            ? ` — “${item.world_requirement_label}”`
            : ""}
          . This line inherits that whether or not it declares anything of its
          own, so a host whose room cannot do it was never going to receive this
          room at all. Declaring the same requirement here is not wrong and is
          usually redundant; declaring it is only worth doing if the line needs
          it and the rest of the room does not. It is read at the reveal and
          surfaced, never scored — venue never touches which destination she
          gets — and it is edited on the destination record.
        </Seam>
      ) : null}

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
