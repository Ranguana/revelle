# The member portal

Draft spec. Not committed.

What a member sees after she is accepted. Four areas.

---

## 1. Membership

Who she is to the société.

- **Account** — name, email, how to reach her. Passwordless; she never has a
  password to forget.
- **Dues** — status, renewal date, payment method, receipts.
- **Her application** — what she told us when she joined, readable. It is part
  of her record, not a form she filled in once and lost.
- **What the société knows about her** — her taste as the house understands it.
  What she leans toward, what she would never do twice, which destinations she
  has been given. **She can correct it.** Being known is what dues buy, and a
  correction is the most valuable signal the system can collect — a curator
  override and a member correction are the same mechanism.

---

## 2. Occasions

Her events. Two states, and the distinction matters more than a filter.

**Upcoming** — the live one. Date, guest count, where it is, and how far along
it is: applied → destination assigned → in preview → hers → delivered. She
should always know what the société is doing and what it needs from her.

**Past** — her archive. Every destination she has been given, with everything
that came with it. This is a large part of what membership *is*: a société
keeps records, and so does she. It should feel like a shelf, not a list of
closed tickets.

---

## 3. Inside an occasion

The centrepiece. She opens this on the day, on a phone, in a kitchen, with
people arriving. Everything below is one destination's worth of material.

- **The destination** — its name, its tagline, the look. What she is throwing.
- **What arrived** — the deliverables, each openable: the arrival, the moment,
  the ending, the fun, the soundtrack, the table, the edit, the prep.
- **The printed matter** — invitations, menus, place cards, game materials.
  Rendered in the destination's own palette and typeface, downloadable as
  print-ready PDFs. These should read as objects she is collecting.
- **The guest list** — who is coming. Needed for correspondence, for counting
  place cards, and for anything that scales with headcount.
- **The prep** — a short list. Not a project plan.

---

## 4. Correspondence — the writing

**This is the feature that has no equivalent anywhere else, and it needs the
most design.**

Everything the host sends her guests is written in the destination's voice. Not
a template with her details merged in — actually written, in the register of
that destination. WESTHAMPTON, 1976 speaks as *the house*: dry, short
declaratives, never explains a joke, signs off *The house, Dune Road*.

### How it works

**She picks a piece.** Invitation · a note before · an update · what to bring ·
a change of plan · the menu · place cards · a thank-you after. The kinds are
already defined in the voice system (`PIECE_KINDS` in `src/lib/tokens.ts`).

**She says what it must contain — facts, not prose.** Friday, seven o'clock,
Dune Road, bring a swimsuit. A few fields, or a sentence in her own words. She
is never asked to write in the voice herself.

**The société writes it.** The destination's voice tokens plus her facts
produce the piece. The prompt assembly already exists
(`writerPrompt` in `src/lib/tokens.ts`) and hoists exemplars matching the piece
kind, so an invitation is written against invitation lines rather than an
average of everything.

**She reads it and can change it.** Two affordances, and both matter:

- *Say it differently* — regenerate. Cheap, and her rejection is signal.
- *Edit directly* — she owns the words. If she edits, we keep both versions:
  what the house wrote and what she sent. **The difference between those two is
  the highest-quality voice training data in the system** — it is a correction
  with a known intent, and it should be recorded as such.

**Then it goes out, or it prints.**

- **Send** — email to her guest list. The pipeline exists and is proven.
- **Print** — rendered as a designed object in the destination's typeface,
  not an email in a serif.
- **Copy** — for a text message or a group chat, which is how most of this
  actually travels.

### What this needs that doesn't exist yet

- A **guest list** per occasion — names, emails, and who has replied.
- A **correspondence record** — every piece, its kind, what the house wrote,
  what she sent, when, to whom.
- **Regenerate and edit** recorded as distinct signals, not overwrites.
- A **sending** surface, with the obvious guardrails: preview before send, no
  accidental send-to-all, and a way to send to one person.

### The rule that keeps it from embarrassing her

The voice has a documented exit. `breaksCharacterFor` in the voice tokens names
what the house never jokes about: anything a guest must act on to arrive or be
safe, anything about money, and any message that gives someone a way out. A
change of address, a medical note, a cancellation — those go out plain. The
system already carries this rule per destination; the portal must honour it and
never offer to "make it sound more like the house" on those pieces.

---

## What already exists

| | |
|---|---|
| Passwordless sign-in | Working in the sibling project — port |
| Voice tokens + writer prompt | Built. `tokens.ts`, `destinations.ts` |
| Print rendering from tokens | Working in the sibling project — port |
| Email sending | Wired (Resend), unproven |
| Taste profile with provenance and supersession | Built, `db/002` |

## What is new

Guest lists · correspondence records · the compose-review-send flow · dues and
payment · the archive.

---

## Two open questions

1. **Does she compose, or does it arrive written?** The spec above has her
   requesting pieces. The alternative is that the invitation simply arrives with
   the destination, already written, and correspondence is only for the
   unforeseen. That is less work for her and more magic, but gives up the signal
   that editing produces.
2. **Who sends — her or the société?** Sending from Revelle is tidier and
   trackable. Sending from her own address is how a host actually invites
   people, and a message from a société about someone else's party is strange.
   A middle path: we compose and print, she sends.
