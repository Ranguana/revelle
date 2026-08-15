# What it takes to reach a purchase

Draft. The end-to-end path a member walks, and what exists at each step.

Legend: **✅ built** · **◐ partial** · **○ nothing**

---

## The path

```
landing → apply → submitted → curator assembles → preview → purchase → hers
```

---

## 1. Landing → apply ◐

✅ The page exists and is deployed.
○ The CTA points at `/quiz` — the banned word sits in the address bar. Rename
  the route to `/apply`.
○ The hero has no line saying what Revelle *is*. A cold visitor sees a place, a
  year, and a joke about houseguests.

## 2. The application ◐

✅ Eight steps, append-only storage, draft resume, submission dedupe.
◐ Guest count and per-person budget — in flight.
○ **Voice questions — the gap.** See below.
○ Image-based options. The renderer already branches on an optional image
  field; there are no images.
○ Rate limiting. `POST /api/quiz` is unauthenticated and unrated: a script can
  fill the curation queue and burn the mail quota. **This blocks launch.**

## 3. Submitted ◐

✅ Writes customer, response, empty taste profile; sends a confirmation.
◐ Resend is wired but **has never actually been called.** One real send closes
  it.
○ No record of what was sent to whom. First support question you'll get is
  "did she get the email," and there's currently no answer but logs.

## 4. The curator assembles ○ — the largest missing piece

○ **A curator tool.** Nothing exists. She needs to see the application, see the
  proposed candidates, choose, edit, and approve.
○ **The selection layer.** Specced in `selection-spec.md`, unbuilt.
○ **The catalogue.** One real destination (WESTHAMPTON, 1976). Six others are
  marketing copy with no voice, no facets, no ingredients. **The system cannot
  choose between things that don't exist** — this is the true bottleneck, and
  it's authoring work, not engineering.
○ Games, products, playlists, printed-matter templates: no pool at all.

## 5. Preview ○

○ The page where she sees her destination before paying. This is the moment the
  whole funnel turns on, and it is also your best measurement instrument —
  buying is a strong positive, asking for a change is a precise negative.
○ Capture *why* she says no. Without it, a walk-away teaches nothing.

## 6. Purchase ○

○ Payment. Nothing built. Stripe Checkout is the least work.
○ **Pricing must be changeable without a deploy** — the brief is explicit that
  pricing is still being tested. Config or database, never a constant.
○ Two products: annual dues, and a single commission.
○ Seven days free — needs a trial state, and a decision about what a trial
  member can actually receive.
○ Receipts, failed payments, dunning, cancellation.

## 7. Hers ○

○ The portal. See `portal-spec.md`. Auth ports from the sibling project;
  everything else is new.

---

## The voice questions — what's missing from the application

A destination is a **look** and a **voice**. The application currently gathers
only look signals: occasion, setting, taste directions, how the group has fun,
what would ruin it, budget, guests. Nothing asks **how her people talk**, so
nothing can match the register of the writing to them.

That matters because the voice is what reaches her guests. WESTHAMPTON, 1976
speaks as the house — dry, clipped, never explains a joke. That is exactly right
for some groups and completely wrong for others. A warm, effusive, in-on-it
group handed a deadpan invitation will read it as cold.

**What to ask.** These are voice dimensions, not taste dimensions — they should
resolve to facets on the *voice* axis and be matched against a destination's
voice tokens (`register`, `formality`, `cadence`, `humour`, `address`):

- **How this group talks to each other.** Dry and deadpan · warm and effusive ·
  loud and teasing · precise and understated.
- **How the invitation should land.** Formal enough to frame · plain and direct
  · funny · so understated it barely explains itself.
- **Whether a joke belongs on the menu.** Some groups delight in it; some find
  it try-hard. This single answer decides more about the writing than any
  palette choice.
- **What they are like about being organised.** Some want the plan; some resent
  it. This governs whether the house instructs or merely arranges.

**Ask them the same way as everything else** — taps, images where possible,
never a form. And per `copy-brief.md`: never the word "quiz," never count
anything, no italics.

**One mechanical consequence.** The facet vocabulary needs a **voice dimension**
alongside the existing ones, and destinations need voice facets so matching is
the same set operation. `facet_dimension` is already data rather than an enum,
so this is inserts, not a migration of the schema's shape.

---

## Blocking, in order

1. **The catalogue.** One real destination is not a library. Nothing downstream
   can be tested against a pool of one, and no amount of engineering
   substitutes for authoring. This is the critical path.
2. **The curator tool.** Without it there is no way to turn an application into
   a Revelle, and no way to gather the corrections the taste profile needs.
3. **Payment.** No revenue without it, and the trial state has to be decided
   before it is wired.
4. **Rate limiting on the application.** Small, but it is a launch blocker.
5. **Voice questions.** Cheap to add now; expensive later, because every member
   who applies before them has an incomplete record.

---

## Decisions still open

- What a seven-day trial member actually receives. A full Revelle costs real
  curation time; a preview may be the right trial.
- Whether the invitation arrives already written, or she requests it.
- Who sends the correspondence — her, or the société.
- Pricing.
