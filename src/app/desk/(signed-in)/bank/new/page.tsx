import Link from "next/link";

import { query } from "@/lib/db";

import styles from "../../../desk.module.css";
import { Empty, Head } from "../../bits";
import BankForm from "../BankForm";

export const dynamic = "force-dynamic";

/**
 * A new bank item, as a DRAFT — the status the form defaults to and the rule
 * the whole library runs on: deciding that something is offered to a customer
 * is a curator's decision and not a script's.
 *
 * There is no ingredient block here. A product link needs a row to hang off,
 * and it appears on the item's own screen the moment it is saved.
 */
export default async function NewBankItemPage() {
  const [destinations, cards] = await Promise.all([
    query<{ id: string; name: string }>(
      `select id, name from world where status <> 'retired' order by name`
    ),
    query<{ id: string; name: string; world_name: string }>(
      `select b.id, b.name, w.name as world_name
         from bank_item b
         join world w on w.id = b.world_id
        where b.kind = 'printed_card'
        order by w.name, b.name`
    ),
  ]);

  return (
    <>
      <Head eyebrow="The bank" title="Add to the bank">
        <Link href="/desk/bank" className={styles.filter}>
          All of the bank
        </Link>
      </Head>

      {destinations.length === 0 ? (
        <Empty>
          No destinations exist yet, and every bank item belongs to exactly one.{" "}
          <Link href="/desk/destinations/new">Write a destination</Link> first.
        </Empty>
      ) : (
        <BankForm
          values={{ status: "draft", phase: "all", venue: "none", ships: true }}
          destinations={destinations}
          cards={cards}
        />
      )}
    </>
  );
}
