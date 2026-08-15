import Link from "next/link";
import { notFound } from "next/navigation";

import { query, queryOne } from "@/lib/db";
import { stamp } from "@/lib/desk/labels";
import { voiceToForm } from "@/lib/desk/voice-form";
import { voicePrompt, type Voice } from "@/lib/tokens";

import styles from "../../../../desk.module.css";
import Thread from "../../../Thread";
import { Head, Status } from "../../../bits";
import { discardVoiceDraft, startVoiceDraft } from "../../actions";
import VoiceForm from "./VoiceForm";

/**
 * THE VOICE OF A DESTINATION, AND ITS VERSIONS.
 *
 * ── THE SHAPE OF THIS SCREEN IS THE RULE ────────────────────────────
 *
 * There is no way to edit a published voice, because there is no such
 * operation. What is on the page is:
 *
 *   the version in force   read only, with how many Revelles carry it
 *   a draft, if there is one   fully editable, never issued
 *   "start version N+1 from this"   copies the text into a new draft
 *   every earlier version  read only, forever
 *
 * db/004 enforces all of this with a trigger — a published row is frozen and
 * the database raises if anything tries. This screen exists so nobody ever
 * meets that error: the only button available is the correct one.
 *
 * ── THE PROMPT IS ON THE PAGE ───────────────────────────────────────
 *
 * `voicePrompt` is pure (tokens in, text out), which db/004 calls out as the
 * point: "the thing a curator approves is a string she can read". Reading the
 * assembled prompt out loud is the review step that catches a bad voice before
 * a customer does, so it is rendered here rather than left to a script.
 */

export const dynamic = "force-dynamic";

type VoiceRow = {
  id: string;
  version: number;
  status: string;
  voice: unknown;
  note: string;
  authored_by: string;
  published_at: string | null;
  superseded_at: string | null;
  issued: number;
};

export default async function VoicePage({
  params,
}: PageProps<"/desk/destinations/[id]/voice">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const world = await queryOne<{ id: string; name: string; slug: string }>(
    `select id, name, slug::text as slug from world where id = $1`,
    [id]
  );
  if (!world) notFound();

  const voices = await query<VoiceRow>(
    `select v.id, v.version, v.status::text as status, v.voice, v.note,
            v.authored_by, v.published_at, v.superseded_at,
            (select count(*) from revelle r where r.voice_id = v.id) as issued
       from world_voice v
      where v.world_id = $1
      order by v.version desc`,
    [id]
  );

  const draft = voices.find((voice) => voice.status === "draft") ?? null;
  const published = voices.find((voice) => voice.status === "published") ?? null;
  const older = voices.filter((voice) => voice.status === "superseded");

  // Pure, so it is safe to render for a half-written draft: a missing field
  // simply produces a shorter prompt.
  const preview = (draft ?? published)?.voice as Voice | undefined;

  return (
    <>
      <Head eyebrow={world.name} title="The voice">
        <Link href={`/desk/destinations/${id}`} className={styles.filter}>
          Back to the destination
        </Link>
      </Head>

      <div className={styles.panels}>
        <div>
          {published ? (
            <section className={styles.panel}>
              <h2 className={styles.panelHead}>
                <span>In force — version {published.version}</span>
                <Status code="published" label="published" />
              </h2>
              <p className={styles.hint}>
                Published {stamp(published.published_at)} by{" "}
                {published.authored_by}. {published.issued} Revelle
                {published.issued === 1 ? " was" : "s were"} issued in it.
                {published.note ? ` ${published.note}` : ""}
              </p>
              <p className={styles.hint}>
                This version cannot be edited. It is the promise about how those
                Revelles read, and the database refuses to change it.
              </p>
              {!draft ? (
                <form action={startVoiceDraft}>
                  <input type="hidden" name="world_id" value={id} />
                  <button className={styles.button}>
                    Start version {published.version + 1} from this
                  </button>
                </form>
              ) : null}
            </section>
          ) : (
            <section className={styles.panel}>
              <h2 className={styles.panelHead}>
                <span>No voice in force</span>
              </h2>
              <p className={styles.hint}>
                Legal, and it means look only: a Revelle delivered now records
                that it was issued with no voice, which is a true statement
                rather than a hole to be backfilled later.
              </p>
              {!draft ? (
                <form action={startVoiceDraft}>
                  <input type="hidden" name="world_id" value={id} />
                  <button className={styles.button}>Write the first voice</button>
                </form>
              ) : null}
            </section>
          )}

          {draft ? (
            <>
              <section className={styles.panel}>
                <h2 className={styles.panelHead}>
                  <span>Draft — version {draft.version}</span>
                  <form action={discardVoiceDraft}>
                    <input type="hidden" name="world_id" value={id} />
                    <input type="hidden" name="voice_id" value={draft.id} />
                    <button className={styles.buttonDanger}>
                      Discard this draft
                    </button>
                  </form>
                </h2>
                <p className={styles.hint}>
                  A draft is workspace. It is never issued, it may be incomplete,
                  and nothing checks its shape until you publish.
                </p>
              </section>
              <VoiceForm
                worldId={id}
                voiceId={draft.id}
                version={draft.version}
                values={voiceToForm(draft.voice)}
                note={draft.note}
              />
            </>
          ) : null}

          {older.length > 0 ? (
            <section className={styles.panel}>
              <h2 className={styles.panelHead}>
                <span>Superseded</span>
              </h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>v</th>
                    <th>In force</th>
                    <th>Until</th>
                    <th>Issued to</th>
                    <th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {older.map((voice) => (
                    <tr key={voice.id}>
                      <td className={styles.numeric}>{voice.version}</td>
                      <td className={styles.numeric}>
                        {stamp(voice.published_at)}
                      </td>
                      <td className={styles.numeric}>
                        {stamp(voice.superseded_at)}
                      </td>
                      <td className={styles.numeric}>{voice.issued}</td>
                      <td>{voice.authored_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className={styles.hint}>
                Kept forever. A Revelle issued under one of these can be
                reprinted, years later, in the exact words it was sent in.
              </p>
            </section>
          ) : null}
        </div>

        <div>
          <section className={styles.panel}>
            <h2 className={styles.panelHead}>
              <span>What a writer will be given</span>
              <span>{draft ? "from the draft" : "from what is in force"}</span>
            </h2>
            <pre className={styles.pre}>
              {preview
                ? voicePrompt(preview)
                : "Nothing yet. This is assembled from the voice above and is the thing to read out loud before publishing."}
            </pre>
          </section>

          <Thread
            subject={{ table: "world", id }}
            back={`/desk/destinations/${id}/voice`}
            title="Notes on this destination"
          />
        </div>
      </div>
    </>
  );
}
