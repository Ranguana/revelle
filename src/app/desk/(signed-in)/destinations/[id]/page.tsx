import Link from "next/link";
import { notFound } from "next/navigation";

import { query, queryOne } from "@/lib/db";
import { destinationDrift } from "@/lib/desk/drift";
import { groupFacets, tagsFor, taggingVocabulary } from "@/lib/desk/facets";
import { WORLD_STATUS, stamp } from "@/lib/desk/labels";
import { destinationSequence } from "@/lib/desk/lists";
import {
  RETIREMENT_COLUMNS,
  RETIREMENT_JOIN,
  retirementRecord,
  type RetirementRow,
} from "@/lib/desk/retirement";
import { passHref, readReview, reviewPass } from "@/lib/desk/review";

import styles from "../../../desk.module.css";
import Thread from "../../Thread";
import { Fact, Head, Review, ReviewFields, Status } from "../../bits";
import DestinationForm, { type DestinationValues } from "../DestinationForm";
import Drift from "../Drift";
import { RetireForm, RetirementPanel } from "../Retirement";
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
  // A REVIEW IN PROGRESS, or not. What is carried is the view she started
  // from — the working set, or the working set plus the retired ones — and her
  // place in it. See src/lib/desk/review.ts.
  const carried = readReview(search);

  const world = await queryOne<
    DestinationValues &
      RetirementRow & { name: string; published_at: string | null }
  >(
    `select w.id, w.slug::text as slug, w.name, w.tagline, w.description,
            w.tokens, w.cover_image_url, w.notes,
            array(select unnest(w.fits_occasions))::text[] as fits_occasions,
            w.status::text as status, w.published_at,
            ${RETIREMENT_COLUMNS}
       from world w
       ${RETIREMENT_JOIN}
      where w.id = $1`,
    [id]
  );
  if (!world) notFound();

  const [groups, tags, voices, counts, inForce, sequence, absorbed, candidates] =
    await Promise.all([
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
    // Only asked for when a review is running. Ids alone, in the library's own
    // order, recounted on every view rather than carried — which is what lets
    // the strip say "no longer in this list" instead of quietly lying.
    carried
      ? destinationSequence(carried.search)
      : Promise.resolve<string[]>([]),
    // THE REVERSE QUESTION: what was folded into THIS room. db/028 moved Cap
    // Ferrat's menus, drinks and dishes onto Côte d'Azur and nothing on Côte
    // d'Azur's page said where they came from — a curator reading its table
    // could not tell an inherited claim from an authored one. The partial index
    // db/042 creates is what makes this one cheap query rather than a scan.
    query<{ id: string; name: string; note: string | null }>(
      `select id::text as id, name, retirement_note as note
         from world where superseded_by = $1 order by name`,
      [id]
    ),
    // What a retirement may point at: every room that is not this one. Not
    // filtered to published — a fold into a draft room is legal and sometimes
    // right, and db/042 deliberately permits a successor that is itself
    // retired, because a chain is real history.
    query<{ id: string; name: string }>(
      `select id::text as id, name from world where id <> $1 order by name`,
      [id]
    ),
  ]);

  // Null for a room that has never been retired, which is almost all of them.
  const retirement = retirementRecord(world);

  const pass = carried
    ? reviewPass({ path: "/desk/destinations", ids: sequence, id, carried })
    : null;

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
        {/*
          The voice screen keeps the pass, so "read every room's voice" is one
          sequence rather than a walk back through the library each time.
        */}
        <Link
          href={
            carried
              ? passHref(
                  `/desk/destinations/${id}/voice`,
                  carried.search,
                  pass?.position ?? carried.at ?? 1
                )
              : `/desk/destinations/${id}/voice`
          }
          className={styles.button}
        >
          The voice
        </Link>
        <Link
          href={`/desk/destinations/${id}/deliverables`}
          className={styles.button}
        >
          Deliverables
        </Link>
        {/*
          A retired room is not a draft, and offering it the same "Publish"
          button is how a room that was folded into another gets served to
          somebody by one wrong click. It comes back as a DRAFT, where its
          voice and its look can be looked at first — and db/019 would refuse
          the direct jump anyway, since a published room needs a voice.
        */}
        <form action={setDestinationStatus}>
          <input type="hidden" name="id" value={id} />
          {/* db/019 can refuse this, and the refusal redirects. It must land
              back inside the review it was refused from. */}
          <ReviewFields carried={carried} />
          <input
            type="hidden"
            name="status"
            value={
              world.status === "published" || world.status === "retired"
                ? "draft"
                : "published"
            }
          />
          <button className={styles.filter}>
            {world.status === "published"
              ? "Unpublish"
              : world.status === "retired"
                ? "Bring back as a draft"
                : "Publish"}
          </button>
        </form>
      </Head>

      {pass ? <Review pass={pass} noun="destinations" /> : null}

      {/* THE LINK SAYS WHICH OF THE TWO JOBS IS ACTUALLY OUTSTANDING.
          It read "Write the voice" in both cases, and the refusal it follows
          ends with the same words, so a room whose voice was already written,
          seeded and waiting in draft read as a room with no voice at all —
          for hours, more than once, to the person who had written it. The
          refusal is right that the room cannot be published; it is the
          instruction after it that was wrong half the time. A draft waiting
          is one click, and the click is nowhere near a blank page. */}
      {refused ? (
        <p className={styles.error}>
          {refused}{" "}
          <Link href={`/desk/destinations/${id}/voice`} className={styles.link}>
            {voices.some((voice) => voice.status === "draft")
              ? "Publish the draft that is waiting"
              : "Write the voice"}
          </Link>
          .
        </p>
      ) : null}

      {saved ? <p className={styles.ok}>Saved.</p> : null}

      <div className={styles.panels}>
        <div>
          <DestinationForm
            values={world}
            carried={carried}
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

          {/*
            WHY IT WAS RETIRED, AND WHAT IT WAS FOLDED INTO — db/042, and
            CLAUDE.md rule 17. Renders nothing at all for a room that has never
            been retired and had nothing folded into it, which is almost every
            room; it is not an empty panel waiting to be filled.
          */}
          <RetirementPanel record={retirement} absorbed={absorbed} />

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

          {/*
            NO RETIRE CONTROL ON A ROOM THAT IS ALREADY RETIRED. The Head
            already offers "Bring back as a draft", which is the correction for
            this act, and rule 18 says the two live next to each other rather
            than one replacing the other under the cursor.
          */}
          {world.status === "retired" ? null : (
            <RetireForm id={id} carried={carried} candidates={candidates} />
          )}

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
