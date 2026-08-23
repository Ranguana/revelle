import Link from "next/link";
import { notFound } from "next/navigation";

import { query, queryOne } from "@/lib/db";
import { destinationDrift } from "@/lib/desk/drift";
import { groupFacets, tagsFor, taggingVocabulary } from "@/lib/desk/facets";
import { WORLD_STATUS, stamp } from "@/lib/desk/labels";

import styles from "../../../desk.module.css";
import Thread from "../../Thread";
import { Fact, Head, Status } from "../../bits";
import DestinationForm, { type DestinationValues } from "../DestinationForm";
import Drift from "../Drift";
import { setDestinationStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function DestinationPage({
  params,
  searchParams,
}: PageProps<"/desk/destinations/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const search = await searchParams;
  const saved = search.saved === "1";
  // The database's own words when it refused a status change — db/019's voice
  // guard, today. Shown verbatim rather than translated; see actions.ts.
  const refused = typeof search.refused === "string" ? search.refused : null;

  const world = await queryOne<
    DestinationValues & { status: string; name: string; published_at: string | null }
  >(
    `select id, slug::text as slug, name, tagline, description, tokens,
            cover_image_url, notes,
            array(select unnest(fits_occasions))::text[] as fits_occasions,
            status::text as status, published_at
       from world where id = $1`,
    [id]
  );
  if (!world) notFound();

  const [groups, tags, voices, counts, inForce] = await Promise.all([
    taggingVocabulary("world").then(groupFacets),
    tagsFor("world", id),
    query<{
      id: string;
      version: number;
      status: string;
      authored_by: string;
      note: string;
      published_at: string | null;
      issued: number;
    }>(
      `select v.id, v.version, v.status::text as status, v.authored_by, v.note,
              v.published_at,
              (select count(*)::int from revelle r where r.voice_id = v.id) as issued
         from world_voice v
        where v.world_id = $1
        order by v.version desc`,
      [id]
    ),
    queryOne<{ revelles: number; menus: number; sections: number }>(
      `select (select count(*)::int from revelle where world_id = $1) as revelles,
              (select count(*)::int from menu_world where world_id = $1) as menus,
              (select count(*)::int from world_section where world_id = $1) as sections`,
      [id]
    ),
    // The voice in force, fetched on its own rather than added to the version
    // list above: this is the only version there is anything to compare the
    // file against (db/004 freezes a published row, so an earlier version is
    // history and not a candidate), and pulling the document for every version
    // to use one of them would be paying for the whole shelf to read one page.
    queryOne<{ voice: unknown }>(
      `select voice from world_voice
        where world_id = $1 and status = 'published'`,
      [id]
    ),
  ]);

  // Both halves of the tag comparison come off `tags`, which is already
  // fetched — the file authors tone tags and nothing else, so everything in
  // another dimension is counted rather than compared. See src/lib/desk/drift.ts.
  const drift = destinationDrift({
    slug: world.slug ?? "",
    name: world.name,
    tagline: world.tagline,
    description: world.description,
    voice: inForce ? inForce.voice : null,
    tones: tags
      .filter((tag) => tag.dimension_code === "voice_tone")
      .map((tag) => ({ code: tag.code, weight: tag.weight })),
    unauthoredTags: tags.filter((tag) => tag.dimension_code !== "voice_tone")
      .length,
  });

  return (
    <>
      <Head eyebrow="Destination" title={world.name ?? ""}>
        <Status code={world.status} label={WORLD_STATUS[world.status]} />
        <Link href={`/desk/destinations/${id}/voice`} className={styles.button}>
          The voice
        </Link>
        <Link
          href={`/desk/destinations/${id}/deliverables`}
          className={styles.button}
        >
          Deliverables
        </Link>
        <form action={setDestinationStatus}>
          <input type="hidden" name="id" value={id} />
          <input
            type="hidden"
            name="status"
            value={world.status === "published" ? "draft" : "published"}
          />
          <button className={styles.filter}>
            {world.status === "published" ? "Unpublish" : "Publish"}
          </button>
        </form>
      </Head>

      {refused ? (
        <p className={styles.error}>
          {refused}{" "}
          <Link href={`/desk/destinations/${id}/voice`} className={styles.link}>
            Write the voice
          </Link>
          .
        </p>
      ) : null}

      {saved ? <p className={styles.ok}>Saved.</p> : null}

      <div className={styles.panels}>
        <div>
          <DestinationForm
            values={world}
            groups={groups}
            selected={tags.map((tag) => tag.facet_id)}
            weights={tags.map((tag) => [tag.facet_id, tag.weight] as const)}
          />
        </div>

        <div>
          <section className={styles.panel}>
            <h2 className={styles.panelHead}>
              <span>Where it stands</span>
            </h2>
            <div className={styles.facts}>
              <Fact label="Revelles issued">{counts?.revelles ?? 0}</Fact>
              <Fact label="Menus attached">{counts?.menus ?? 0}</Fact>
              <Fact label="Sections">{counts?.sections ?? 0}</Fact>
              <Fact label="Published">{stamp(world.published_at)}</Fact>
            </div>
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelHead}>
              <span>Every version of the voice</span>
              <Link href={`/desk/destinations/${id}/voice`} className={styles.link}>
                open
              </Link>
            </h2>
            {voices.length === 0 ? (
              <p className={styles.hint}>
                No voice yet. That is legal and means look only — a Revelle
                delivered now records that it was issued without one.
              </p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>v</th>
                    <th>State</th>
                    <th>Issued to</th>
                    <th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {voices.map((voice) => (
                    <tr key={voice.id}>
                      <td className={styles.numeric}>{voice.version}</td>
                      <td>
                        <Status code={voice.status} label={voice.status} />
                      </td>
                      <td className={styles.numeric}>{voice.issued}</td>
                      <td>
                        {voice.authored_by}
                        {voice.note ? (
                          <div className={styles.when}>{voice.note}</div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <Thread
            subject={{ table: "world", id }}
            back={`/desk/destinations/${id}`}
            title="Notes on this destination"
          />
        </div>
      </div>

      {/*
        Full width, below the form, rather than in the right-hand column: a
        prose difference is two paragraphs side by side and a 1fr column cannot
        hold one honestly. The link from the library list lands on #file.
      */}
      <Drift report={drift} name={world.name ?? ""} />
    </>
  );
}
