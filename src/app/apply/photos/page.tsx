import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { currentApplicant } from "@/lib/auth";
import { MAX_PHOTOS, PHOTO_ROLES, ROLE_SAID } from "@/lib/photo-extract";
import { myApplication, myPictures, type MemberPicture } from "@/lib/photos-member";

import styles from "../quiz.module.css";
import {
  removePictureAction,
  setPictureRoleAction,
  strikeLineAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Your pictures",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * HER PICTURES, AND WHAT THEY SAY BACK.
 *
 * Founder, 2026-09-05: "A member is saying: this light, this table, this era,
 * not that one."
 *
 * So this screen has one job on each side. She adds up to seven pictures and
 * says what each one is. Then she reads, in ordinary words, what the house
 * took from them — warm, sparse, late sun — and says "not that" to anything
 * that is not her night.
 *
 * ── SHE SEES WORDS. SHE NEVER SEES A FACET ──────────────────────────
 *
 * Founder: "Member side sees words, not facets: warm, sparse, late sun, not
 * costumes. Strike is enough." No column names, no levels, no confidence, no
 * model, and no destination — a room name here would turn her pictures into a
 * vote she did not know she was casting.
 *
 * ── AND THERE IS NO "YES" ───────────────────────────────────────────
 *
 * Only "not that". A line she leaves alone is a line she did not remove, and
 * reading that as agreement is the retro-tagging move this whole feature
 * exists to refuse. Her no is final: nobody at the house can put back
 * something she has taken off a picture.
 *
 * ── COPY ────────────────────────────────────────────────────────────
 *
 * docs/copy-brief.md, and CLAUDE.md rule 10: the party is hers. Nothing on
 * this page has the house as the subject of the good verb. She is showing;
 * the house is looking.
 */

export const dynamic = "force-dynamic";

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ said?: string }>;
}) {
  const applicant = await currentApplicant();
  if (!applicant || !applicant.confirmed) redirect("/apply");

  const application = await myApplication(applicant.customerId);
  const said = (await searchParams).said;

  if (!application) {
    return (
      <div className={styles.done}>
        <div className={styles.doneInner}>
          <p className={styles.doneEyebrow}>Revelle Société</p>
          <h1 className={styles.doneTitle}>Your pictures</h1>
          <p className={styles.doneBody}>
            There is nothing to attach these to yet. Answer the questions first
            and they will have a night to belong to.
          </p>
          <Link className="cta" href="/apply">
            The questions
          </Link>
        </div>
      </div>
    );
  }

  const pictures = await myPictures(applicant.customerId, application.id);
  const room = MAX_PHOTOS - pictures.length;

  return (
    <div className={styles.done}>
      <div className={styles.doneInner}>
        <p className={styles.doneEyebrow}>Revelle Société</p>
        <h1 className={styles.doneTitle}>Your pictures</h1>
        <p className={styles.doneBody}>
          A room you already have, a night you have in mind, a thing you would
          like to end up with. Up to {MAX_PHOTOS}. They stay between you and the
          house — nothing here is published, shared or sent anywhere.
        </p>

        {said ? <p className={styles.noteBad}>{said}</p> : null}

        {room > 0 ? (
          <form
            className={styles.gateForm}
            action="/apply/photos/upload"
            method="post"
            encType="multipart/form-data"
          >
            <p className={styles.label}>What are you showing?</p>
            {/*
              NOTHING IS PRE-SELECTED, AND THAT IS THE RULE RATHER THAN A
              STYLE CHOICE.

              This carried `defaultChecked={index === 1}` until 2026-09-08,
              which pre-selected `evening_she_wants` — and
              src/lib/photo-extract.ts forbids exactly that, in these words:
              "defaulting to a role is inventing the member's meaning, and the
              role it would default to is the one that feeds the matrix."
              The file argued the case and this form did the opposite of it.

              A photograph whose role nobody has stated is a photograph whose
              role nobody has stated. `setPictureRoleAction` resolves a missing
              value to null, `mayPrune(null)` is false, and null is a legal and
              meaningful state in db/064 — so leaving every radio unchecked
              costs nothing and stops the house answering a question on her
              behalf. It is deliberately NOT `required` either: forcing a
              choice invents a meaning just as surely, only more loudly.
            */}
            <div className={styles.options}>
              {PHOTO_ROLES.map((role) => (
                <label key={role} className={styles.option}>
                  <input type="radio" name="role" value={role} />
                  {ROLE_SAID[role]}
                </label>
              ))}
            </div>
            <input type="file" name="file" accept="image/*" multiple required />
            <button className="cta" type="submit">
              Add {room === 1 ? "the last one" : `up to ${room}`}
            </button>
          </form>
        ) : (
          <p className={styles.fine}>
            That is {MAX_PHOTOS}, which is all it takes. Take one back if you
            want to swap it.
          </p>
        )}

        {pictures.length === 0 ? null : (
          <div className={styles.tiles}>
            {pictures.map((picture) => (
              <Picture key={picture.id} picture={picture} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Picture({ picture }: { picture: MemberPicture }) {
  return (
    <section className={styles.tile}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.thumb}
        src={`/apply/photos/${picture.id}/view`}
        alt={picture.filename || `Picture ${picture.ordinal}`}
        loading="lazy"
      />

      <p className={styles.tileLabel}>
        {picture.role ? ROLE_SAID[picture.role] : "Not yet said"}
      </p>

      <div className={styles.options}>
        {PHOTO_ROLES.filter((role) => role !== picture.role).map((role) => (
          <form key={role} action={setPictureRoleAction}>
            <input type="hidden" name="photo" value={picture.id} />
            <input type="hidden" name="role" value={role} />
            <button className={styles.optionNo} type="submit">
              {ROLE_SAID[role]}
            </button>
          </form>
        ))}
      </div>

      {!picture.read ? (
        <p className={styles.fine}>Nobody has looked at this one yet.</p>
      ) : (
        <>
          {picture.words.length > 0 ? (
            <p className={styles.hint}>{picture.words.join(", ")}</p>
          ) : null}

          {picture.lines.length === 0 ? (
            <p className={styles.fine}>
              Nothing was taken from this one about the evening itself, which is
              an ordinary answer.
            </p>
          ) : (
            <ul className={styles.options}>
              {picture.lines.map((line) => (
                <li
                  key={line.claimId}
                  className={line.struck ? styles.optionNo : styles.option}
                >
                  {line.said}
                  {line.struck ? (
                    <span className={styles.fine}> — you said no to this</span>
                  ) : (
                    <form action={strikeLineAction}>
                      <input type="hidden" name="claim" value={line.claimId} />
                      <button className={styles.optionNo} type="submit">
                        Not that
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <form action={removePictureAction}>
        <input type="hidden" name="photo" value={picture.id} />
        <button className={styles.optionNo} type="submit">
          Take this one back
        </button>
      </form>
    </section>
  );
}
