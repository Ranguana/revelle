import Link from "next/link";

import { listOccasions } from "@/lib/portal/occasions";
import { longDate } from "@/lib/portal/sections";

import { Inert, PreviewBanner, openPreview } from "../../Preview";
import portal from "@/app/portal/portal.module.css";
import frame from "../../preview.module.css";

/**
 * HER SHELF, READ FROM THE DESK. The mirror of src/app/portal/page.tsx.
 *
 * ── HOW MUCH OF THE PORTAL IS ACTUALLY REUSED ────────────────────────
 *
 * Everything that decides what she sees, and the stylesheet that draws it:
 *
 *   · `listOccasions(customerId)` — the portal's own read, unchanged. It takes
 *     a customer id as an argument rather than reading a session, which is why
 *     a preview is possible at all without pretending to be her, and which is
 *     why the rule that a DRAFT Revelle never reaches her holds here for free.
 *   · `longDate` — the portal's own date.
 *   · `portal.module.css` — the portal's own stylesheet, imported. Not copied.
 *     A change to how her shelf looks changes this screen with it.
 *
 * What is NOT reused is the JSX, and that is a real cost rather than a choice:
 * src/app/portal/page.tsx is a route component whose first line is
 * `requireMember()`, so it cannot be rendered for somebody else without
 * inventing a session for her — which is the one thing this feature must not
 * do. The markup below is therefore a second copy, and it is kept structurally
 * identical, element for element and class for class, so that a diff against
 * the portal file reads as a diff. IF YOU CHANGE THE SHELF, CHANGE BOTH. The
 * honest fix is to lift the shelf into a component both routes render, and it
 * belongs in src/app/portal/ where the portal can own it.
 *
 * ── THE ONE ELEMENT THAT IS DELIBERATELY DIFFERENT ───────────────────
 *
 * The portal's root is `<main>`; here it is a `<div>` with the same class,
 * because this renders inside the desk's own `<main>` and a document does not
 * have two. The class is what the stylesheet reads, so nothing is lost.
 */

export const dynamic = "force-dynamic";

export default async function MemberPortalPreview({
  params,
}: PageProps<"/desk/members/[id]/portal">) {
  const { id } = await params;
  const { staff, member } = await openPreview(id, { at: "shelf" });

  const { upcoming, past } = await listOccasions(member.id);

  return (
    <div className={frame.frame}>
      <PreviewBanner member={member} staff={staff} back="/desk/members" />

      <Inert>
        <div className={portal.page}>
          <div className={portal.inner}>
            <p className={portal.eyebrow}>Revelle Société</p>
            {/*
              The portal's own fallback for a member nobody has named. db/001
              does not ask for a name, so this is the ordinary case rather than
              an edge one, and it must read as a heading and not as a gap.
            */}
            <h1 className={portal.title}>{member.name ?? "Your membership"}</h1>
            <div className={portal.rule} />

            {upcoming.length > 0 ? (
              <Shelf
                head="Next"
                memberId={member.id}
                occasions={upcoming}
              />
            ) : null}

            {past.length > 0 ? (
              <Shelf head="Before" memberId={member.id} occasions={past} />
            ) : null}

            {/*
              A member with no Revelle at all sees her name, her address and
              the way out, and so does this. The portal has no empty state on
              purpose — an empty state promising a section that does not exist
              is the failure that page was written to avoid — and inventing one
              here would make the preview a worse likeness, not a better one.
            */}
            <div className={portal.out}>
              <p className={portal.line}>
                Signed in as{" "}
                <span className={portal.address}>{member.email}</span>
              </p>
              {/*
                HER SIGN-OUT, SWITCHED OFF.

                The portal wraps this button in a `<form action={signOutAction}>`.
                Here there is no form at all — a `type="button"` outside a form
                has nothing to submit — and it is `disabled` on top of that,
                inside a disabled fieldset on top of THAT. Shown rather than
                removed because it is on her screen, and a preview that quietly
                drops the controls stops being a preview of anything.
              */}
              <button className={portal.button} type="button" disabled>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </Inert>
    </div>
  );
}

/**
 * One shelf. The portal writes this out twice; here it is a function for the
 * same reason it is two blocks there — the markup is identical and the words
 * above it are not.
 */
function Shelf({
  head,
  memberId,
  occasions,
}: {
  head: string;
  memberId: string;
  occasions: readonly {
    id: string;
    destination: string;
    tagline: string;
    eventDate: string | null;
  }[];
}) {
  return (
    <section className={portal.shelf}>
      <h2 className={portal.shelfHead}>{head}</h2>
      <ul className={portal.list}>
        {occasions.map((occasion) => (
          <li key={occasion.id}>
            {/*
              THE ONE LINK THAT SURVIVES, AND IT DOES NOT LEAVE THE DESK.

              It points at the preview of that occasion, never at /portal —
              a link into the real portal from here would be a link staff
              cannot follow (they are not members) and, worse, would look
              like one they could.
            */}
            <Link
              className={portal.entry}
              href={`/desk/members/${memberId}/portal/occasions/${occasion.id}`}
            >
              <span className={portal.when}>
                {longDate(occasion.eventDate)}
              </span>
              <span className={portal.destination}>{occasion.destination}</span>
              <span className={portal.tagline}>{occasion.tagline}</span>
              <span className={portal.open} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
