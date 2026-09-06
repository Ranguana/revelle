# PROPOSED — TOKYO, 1964

**Status: an agent's proposal, unsigned. Nothing here is the founder's voice and
nothing here is live.** Written 2026-09-06 by a subagent under
`docs/new-destination.md`. `world` and `world_voice` are governed classes
(CLAUDE.md rule 13), so this document is the thing to read and sign, or refuse.

The only change made outside this file is the matrix row, which step 0a requires
and rule 7 makes the only quotable source of a distance. It is registered in
`founderPending`, so `npm run check:matrix` prints, on every run, that the row
is an agent's and not hers. **Declining this room is deleting the row and that
one entry.** Nothing else in the repository holds it.

Everything below is written as blocks ready to paste, with the file each belongs
in named. None of it has been pasted.

---

## 0. THE ADMISSION TEST

### 0a. The row

| facet | level |
|---|---|
| `arrival` | `assigned` |
| `schedule` | `posted` |
| `volume` | `overlapping` |
| `dress` | `plain` |
| `food` | `bought` |
| `ending` | `clean_stop` |
| `starts` | `evening` |
| `size` | `few` |
| `spectacle` | `nothing` |

No blanks. Two cells will be argued with and the arguments are here rather than
buried:

**`arrival = assigned`** was Catskills alone — a fingerprint level, one tap
naming one room, which the audit has been flagging as a defect worth fixing.
This room is a second claimant and it is not a claim made to retire the flag.
A role really is handed over at the door: you are given a glass, and told whose
glass is yours to keep filled. That is the room's manner stated at the moment a
person walks in, and `absorbed` would be the wrong word for it. **After this row
the audit's LEVEL USE section stops printing `FINGERPRINT arrival.assigned`.**
Only `food.arrived` (Tahiti) remains.

**`food = bought`** is provenance, not identity — the `fedBy` note is explicit
that this column and the making axis "come apart at both ends". This is a TABLE
room whose table mostly came from the shop on the way home. Declaring it
`cooked` to sound more serious would be the retro-tag this catalogue exists to
escape, and it would cost the room the thing that makes it useful (see 6).

### 0b. Distance 3 against every existing row

From `npm run check:matrix`, which is the only place a distance may be quoted
from (rule 7). The full run reports **19 destinations · 171 pairs · gate 3**,
**FAILING (below the gate, undeclared): 0**, and **ZERO MARGIN (exactly 3): 29**
— the same twenty-nine pairs as before this row existed, none of them involving
it. Mean distance moved 4.93 → 4.95.

`npm run check:matrix -- --room tokyo-1964`:

```
tokyo-1964 AGAINST EVERY OTHER ROW (gate 3)
   4  amalfi-1953
   4  aspen-1994
   4  st-moritz-1984
   5  big-sur
   5  catskills
   5  dolomites
   5  havana
   5  las-vegas
   5  nantucket
   5  new-orleans
   5  new-york
   5  palm-springs-1965
   5  portofino
   5  westhampton-1976
   6  acapulco-1959
   6  cote-dazur
   6  oaxaca-1954
   6  tahiti

   nearest 4 (amalfi-1953, aspen-1994, st-moritz-1984) · mean 5.06
```

**Nearest 4, mean 5.06, no pair at the gate.** The room has a full unit of
margin against every row in the catalogue, which means no single cell flip
anywhere — including the six cells `founderPending` still holds — can push it
below the gate.

`--room <slug>` was added to `scripts/audit-matrix.mjs` in the same commit, for
the reason given there: at nineteen rooms the audit prints 171 pairs and at two
hundred it would print 19,900, and "what is my room's nearest neighbour" has to
stay answerable by the one instrument allowed to answer it.

### 0b-bis. No twin claimed

None needed. The twin rule is for a pair genuinely separated by voice rather
than shape, and this room is separated by shape from everything.

### 0c. Placed deliberately, in open space

The row was chosen before a word was written, which is what 0c asks for. It was
chosen on a specific and measurable hole:

**Of the nine facets, exactly two are FED** — `ending` (by `how_it_ends`) and
`starts` (by `meal_time`). The other seven state `field: null` in the matrix's
own `fedBy` block. So the structural ranker sorts nineteen rooms through a
3 × 3 grid of nine cells, and this is how the eighteen sat in it:

| ending / starts | count | rooms |
|---|---|---|
| `until_morning` / `evening` | 7 | westhampton, new-orleans, havana, las-vegas, tahiti, st-moritz, acapulco |
| `dissolves` / `evening` | 3 | new-york, nantucket, amalfi |
| `dissolves` / `afternoon` | 3 | portofino, cote-dazur, oaxaca |
| `clean_stop` / `afternoon` | 3 | big-sur, palm-springs, aspen |
| `clean_stop` / `morning` | 1 | dolomites |
| `dissolves` / `morning` | 1 | catskills |
| **`clean_stop` / `evening`** | **0** | **— nothing** |
| `until_morning` / `morning` | 0 | — |
| `until_morning` / `afternoon` | 0 | — |

**A host who says her evening starts at dinner and ends cleanly is asking for a
cell no room occupies.** Of the three empty cells it is the only one describing
a party a person would actually throw — an evening that begins in the evening
and finishes at a stated hour is the most ordinary shape a dinner has, and the
catalogue does not offer it once. The other two empty cells are a party that
starts in the morning and runs until dawn, which is not a party, and one that
starts in the afternoon and does the same, which is Oaxaca's shape stretched.

The doc's own line here — "the facet space holds about 131 rooms at minimum
distance 3" — is stale and is corrected in the scaling note that accompanies
this proposal. It was computed before `spectacle` and before `schedule` split to
four levels. The real number is between 286 and 338 by greedy packing.

### 0d. Thrown-ness

She audits this one; the claim is made rather than assumed.

The premise below has a person in it doing five things: she writes a card that
gives two hours, she lays the table before anyone comes, she buys most of it on
the way home, she hands the first arrival a glass and says whose it is, and at
half past ten she sends the last bowl round. Nothing in it happens by itself,
nothing is weather, and the room is not a place behaving as itself — it is a
Thursday somebody organised around the fact that everybody has to be up.

The failure mode to check it against: this room could have been written as
"neon, noodles, a city that never sleeps," which is a postcard and is also the
opposite claim. It is in `rejected`.

### 0e. What the deliverable presupposes

**Nothing.** No water, no snow, no outdoors, no fire, no equipment. The most
bookable size is six people at one table on a weeknight, and every line of the
premise is honourable in a one-room apartment in August.

Two things were deliberately kept OUT of the writing for rule 25.1, and they are
recorded so nobody puts them back:

- **The last train.** It is the true reason a Tokyo evening ends at a stated
  hour and it was the first thing this room wanted to say. It is a fact about a
  city, not about a host, and a backyard cannot honour it. The end is stated as
  an hour and a bowl instead, and both travel.
- **A low table and floor seating.** Furniture the host may not own. The
  premise says the table is covered, not what height it is.

### 0f. It did not fail

Recorded because the brief asked for the block if it came: it did not. The room
clears 0b at 4 with no twin, clears 0d on the argument above, and presupposes
nothing at 0e.

---

## 1. THE WRITING

### The name

`TOKYO, 1964` · slug `tokyo-1964` · heading `Tokyo`

The year is a period, not a pitch. It fixes a register — everybody working,
everybody commuting, a table put together from a shopping street on the way home
— and the room is forbidden from selling it. The Olympics, the new train and the
country-in-a-hurry are all in `never`, for the same reason Havana is named 1957
and may not write "the last good year."

### Tagline

> **Supper at seven, and rice with tea over it at ten. Nobody fills their own
> glass.**

A time and two concrete details, no adjective naming the feeling. Both details
are honourable anywhere.

### Premise

> A card that gives the hour twice: when it starts, and when it is over.
> Everybody comes straight from work and nobody has been home. The table is
> already covered when the first person sits — eight or nine small dishes, most
> of them bought on the way, and the beer cold enough to matter. Nobody fills
> their own glass; the person beside you does yours, and you do theirs. At half
> past ten the rice goes round with hot tea poured over it, and that is the
> evening saying it is finished. Everybody leaves at once.

Against rule 25's three:

1. **Most bookable size.** Six people, one table, a Thursday. Every line holds.
2. **No proper noun a guest would not say at the table.** There is none in the
   premise. The dish names in section 4 carry their own names and then say what
   they are, under the 2026-08-28 amendment: `oden`, `ochazuke`, `tamagoyaki`
   are what those things are called and there is no other name for them.
3. **No labour the host does not have.** Nothing is carried to anybody. The
   table is covered before people arrive, things are within reach or passed, and
   the glass rule means the host is sitting down. `Dinner is served at seven` is
   in `rejected` for exactly this.

### The signature gesture (rule 27, THE ONE)

**The last bowl.** At half past ten, rice with a salted plum and hot tea poured
over it, sent round. It is not announced. It is not a course and it is not a
joke — it is how the evening says it is over, and it is why this room can hold
`clean_stop` without the ending reading as a rule imposed on people.

It passes the Palm Springs test: it is not a utility wearing the costume of a
ritual. Something is made, and handed round, and it means a thing.

### The twenty (rule 27, the pool) — a start, not the set

`bank_kind = 'host_act'`, drafts, to be written against the bank documents:

- The first person through the door is given a glass and told whose glass is theirs.
- Somebody is sent back out for the ninth dish.
- The pan comes to the table with what was cooked in it, and nobody plates anything.
- The rice bowls are counted before anybody sits, out loud, and one too many is put out.
- Whoever finishes their beer first is not asked; a glass appears full.
- The pickles come out of the crock at the table, not from a dish.
- Somebody takes the wooden tray back in the morning and it is agreed who.
- The last record is chosen by whoever has to be up earliest.
- Coats go on the same hook in the order people came.
- Nobody's glass is allowed to be empty while a sentence is going on.

### The voice — ready to paste into `src/lib/destinations.ts`

```ts
const TOKYO_1964_LOOK: Theme = {
  key: "tokyo-1964",
  type: {
    display: '"Bodoni Moda", Didot, "Bodoni MT", Georgia, serif',
    body: '"Karla", "Helvetica Neue", Arial, sans-serif',
    mono: '"Space Mono", ui-monospace, Menlo, monospace',
  },
  palette: {
    ground: "#1B2A4A",
    ground2: "#16233E",
    bone: "#3D4A6B",
    ink: "#F2E9D6",
    inkSoft: "#B3A98F",
    inkFaint: "#857D6A",
    rule: "#566384",
    aqua: "#64C0A8",
    oxblood: "#E2795C",
    gold: "#DDAE4C",
    night: "#101B31",
    night2: "#0A1222",
    nightInk: "#D9DEE6",
    nightSoft: "#939AA6",
    nightAqua: "#9DDCCD",
    nightOxblood: "#EFA48A",
  },
  paletteDark: {
    ground: "#0C1220",
    ground2: "#121A2C",
    ink: "#F1E8D6",
    inkSoft: "#ADA491",
    inkFaint: "#7B7466",
    rule: "#27314A",
    aqua: "#6FB8A8",
    oxblood: "#E0825C",
    gold: "#DCA945",
  },
};

export const TOKYO_1964: Destination = {
  key: "tokyo-1964",
  name: "TOKYO, 1964",
  tagline:
    "Supper at seven, and rice with tea over it at ten. Nobody fills their " +
    "own glass.",
  premise:
    "A card that gives the hour twice: when it starts, and when it is over. " +
    "Everybody comes straight from work and nobody has been home. The table " +
    "is already covered when the first person sits — eight or nine small " +
    "dishes, most of them bought on the way, and the beer cold enough to " +
    "matter. Nobody fills their own glass; the person beside you does yours, " +
    "and you do theirs. At half past ten the rice goes round with hot tea " +
    "poured over it, and that is the evening saying it is finished. " +
    "Everybody leaves at once.",
  look: TOKYO_1964_LOOK,
  voiceVersion: 1,
  voice: {
    speaker: "The house, on a weeknight, with the table already laid.",
    selfReference: ["we", "the house", "this table"],
    audience:
      "the six or seven coming straight from work, all of whom are up at six",
    address: {
      mode: "collective_first",
      note:
        "Arrangements are said as we: we eat at seven, we finish at half " +
        "past ten. The we is the household and never a management. Second " +
        "person is spent on the two things a guest acts on — the hour, and " +
        "whose glass is theirs — and never on enthusiasm.",
    },

    register:
      "A card written in the afternoon, in pencil, while the table is being " +
      "laid and there is still one thing to go back out for.",
    formality: "plain",
    cadence:
      "A fact, then the hour it happens at. Short. The line ends on a noun " +
      "or a time, and never on a flourish.",
    sentence: { typicalWords: 9, maxWords: 18 },
    punctuation:
      "Periods and commas. A colon only when a real list is coming. No " +
      "exclamation points, no ellipses, no parentheses, no dash held open " +
      "for effect, no quotation marks around a word being nudged, and no " +
      "semicolons. This is a card, not a paragraph.",
    orthography:
      "Hours in words: seven o'clock, half past ten, the last one. Days by " +
      "name. Headings in full caps, and nothing else is capitalised for " +
      "emphasis. Food gets its own name and then what it is, in that order — " +
      "oden, and what is in the pot tonight. Nothing on the page is spelled " +
      "to sound like anywhere.",

    humour: {
      mode: "deadpan",
      mechanism:
        "Say the strict thing as though it were ordinary: the hour, the " +
        "second hour, the rule about the glass. The joke is that all three " +
        "are kept, and the line does not admit it is a joke. Nobody is the " +
        "target. Never a punchline, never a second sentence explaining the " +
        "first.",
    },

    lexicon: [
      {
        term: "the hour",
        gloss:
          "both of them. The card gives when it starts and when it is over, and the second one is the promise",
        insteadOf: ["the timing", "the schedule", "start time"],
      },
      {
        term: "the last bowl",
        gloss:
          "rice, a salted plum, hot tea poured over, sent round at half past ten. Not a course and not a joke — how the evening ends",
        insteadOf: ["last orders", "the nightcap", "dessert", "one for the road"],
      },
      {
        term: "your neighbour's glass",
        gloss:
          "the one you are responsible for. Yours is somebody else's problem, and it is never empty",
        insteadOf: ["a round", "top-ups", "the bar", "help yourself"],
      },
      {
        term: "the small dishes",
        gloss:
          "the whole shape of the table. Eight or nine, none of them the main one, all of them out before anybody sits",
        insteadOf: ["appetisers", "sharing plates", "grazing", "a spread"],
      },
      {
        term: "on the way home",
        gloss:
          "where most of tonight came from. Said plainly, because it is not an apology",
        insteadOf: ["catering", "provisions", "shop-bought", "store-bought"],
      },
      {
        term: "still in what they wore",
        gloss: "the dress code. Nobody has been home and nobody is going to",
        insteadOf: ["smart casual", "come as you are", "no dress code"],
      },
      {
        term: "up at six",
        gloss:
          "why it ends. Stated as a fact about tomorrow, never as an apology for tonight",
        insteadOf: ["a school night", "an early start", "we'll keep it short"],
      },
      {
        term: "the card",
        gloss: "the invitation. It gives two hours and almost nothing else",
        insteadOf: ["the invite", "save the date", "details to follow"],
      },
    ],

    formulae: [
      "{Day}. Seven o'clock. Over at {hour}.",
      "The table is laid by {hour}. Come in and sit down.",
      "{Dish}, and what is in it tonight.",
      "Nobody fills their own glass.",
      "The last bowl at {hour}.",
      "We are all up at six.",
      "Most of it came from the shop. {The one thing that did not}.",
      "{Plain fact about the table}. It is always like that.",
    ],

    banned: [
      "zen",
      "serene",
      "harmony",
      "minimalist",
      "ancient",
      "ritual",
      "exotic",
      "oriental",
      "neon",
      "blossom",
      "geisha",
      "samurai",
      "east meets west",
      "izakaya",
      "authentic",
      "curated",
      "elevated",
      "experience",
      "vibe",
      "iconic",
      "unforgettable",
      "magical",
      "memories",
      "guys",
      "hosted by",
      "join us",
    ],

    signOffs: [
      "Seven o'clock.",
      "Over at half past ten.",
      "The table is laid.",
      "We are all up at six.",
    ],

    always: [
      "Give both hours. The second one is the promise, and it is the offer.",
      "Name a real thing: a dish, a glass, an hour, the shop it came from.",
      "State the rule about the glass once, and never explain it.",
      "Assume everybody is coming from work and nobody has been home.",
      "Let the food have its own name, and then say what it is.",
      "Write as though the table is already laid and one thing is still missing.",
      "Say that most of it was bought, and say it without apologising.",
      "Hand everyone the same glass. Somebody else is filling it either way.",
    ],

    never: [
      "Never an exclamation point.",
      "Never name the feeling — no serene, no magic, no unforgettable, no memories.",
      "Never put an accent on the page. No phonetic spelling, no borrowed exclamation, no word set down to sound foreign. A real name is a fact; a spelling that performs an accent is a costume.",
      "Never write the country as a set. No blossom, no temple, no lantern doing symbolism, no ceremony borrowed to make an ordinary evening solemn. This is somebody's weeknight.",
      "Never sell the year. Nineteen sixty-four is the register the writing is in, not the thing being offered — no games, no new train, no country in a hurry.",
      "Never apologise for the hour it ends. It ends because everybody is up at six, and that is the offer rather than the limit.",
      "Never describe somebody carrying something to somebody else. Things are within reach, or they are passed.",
      "Never write a line that separates the people drinking from the people who are not. Every glass is filled by somebody else and nobody's is counted.",
      "Never explain the last bowl.",
      "Never call this a small plates concept, a tasting menu, or anything a restaurant would print.",
      "Never use italics.",
    ],

    breaksCharacterFor: [
      "Anything a guest must act on to arrive or to be safe: the street, the door, the stairs, what is in the food. Fact first, fewest words, no joke.",
      "Anything about money.",
      "Any message that lets someone go — a decline, a cancellation, a way off a list. Written straight and made easy.",
    ],

    exemplars: [
      {
        piece: "invitation",
        text: "Thursday. Seven o'clock. Over at half past ten.",
        note: "The whole room in eight words. The second hour is the part being offered.",
      },
      {
        piece: "invitation",
        text: "Come straight from work. Nobody has been home either.",
      },
      {
        piece: "invitation",
        text: "The table is laid by seven. Come in and sit down.",
      },
      {
        piece: "invitation",
        text: "Nobody fills their own glass. That is the only rule and it is not explained.",
      },
      { piece: "invitation", text: "We are all up at six. So is the hour it ends." },
      {
        piece: "menu_item",
        text: "Oden — daikon, egg, fishcake, in the pot since five and getting better.",
      },
      {
        piece: "menu_item",
        text: "Hiyayakko: cold tofu, ginger and spring onion, the soy poured at the table.",
      },
      {
        piece: "menu_item",
        text: "Korokke from the butcher, still warm in the paper it came in.",
      },
      {
        piece: "menu_item",
        text: "Tamagoyaki — the rolled egg, cut across, sweet if it turned out that way.",
      },
      {
        piece: "menu_item",
        text: "Beer in small glasses. The same glass, cold barley tea, for whoever would rather.",
      },
      {
        piece: "menu_item",
        text: "Karaage, fried late, brought out in the pan it was fried in.",
      },
      {
        piece: "menu_item",
        text: "Ochazuke at half past ten. Rice, a salted plum, hot tea poured over.",
      },
      {
        piece: "notice",
        text: "Most of this came from the shop on the way home. The egg did not.",
      },
      {
        piece: "notice",
        text: "Shoes by the door, in the order you came. It is how they get found again.",
      },
      {
        piece: "notice",
        text: "There is one bowl more than there are people. There always is.",
      },
      {
        piece: "notice",
        text: "The stairs are unlit after the second landing. Take somebody with you.",
      },
      {
        piece: "house_note",
        text: "The pan comes to the table. Nothing is plated and nothing is carried out.",
      },
      {
        piece: "house_note",
        text: "Somebody takes the wooden tray back in the morning. It gets agreed before anybody leaves.",
      },
      { piece: "place_card", text: "Aiko — next to whoever came furthest." },
      { piece: "place_card", text: "Ken — beside the one who forgets to eat." },
      {
        piece: "game_rule",
        text: "Everybody says the hour they have to be up. The earliest picks the last record. The latest does the bowls.",
      },
      {
        piece: "bulletin",
        text: "Thursday. The pot went on at five. Somebody has gone back out for the ninth dish.",
      },
      { piece: "heading", text: "SEVEN O'CLOCK, AND WHAT IS ALREADY OUT" },
      { piece: "heading", text: "WHAT CAME FROM THE SHOP" },
      { piece: "heading", text: "THE LAST BOWL" },
      { piece: "sign_off", text: "Over at half past ten." },
      { piece: "sign_off", text: "We are all up at six." },
    ],

    rejected: [
      {
        text: "Tokyo, 1964. Neon, noodles, and a city that never sleeps.",
        why: "Three postcards in a row and two of them are the wrong decade. This room ends at half past ten ON PURPOSE; a city that never sleeps is the opposite claim sold as atmosphere. Easy to write by accident because the name on the plate is a city everybody has already been told about.",
      },
      {
        text: "Kanpai! Let the evening begin.",
        why: "A word put on the page to sound foreign, with an exclamation point behind it. The house does not perform the language it is speaking. Same refusal as Havana's `Vamos`.",
      },
      {
        text: "An ancient ritual of hospitality, reimagined for your table.",
        why: "Brochure, and untrue. Filling your neighbour's glass is a manner, not a rite, and calling it ancient turns somebody's ordinary Thursday into a museum. `Reimagined` also credits us rather than her — rule 10.",
      },
      {
        text: "A serene, minimalist table where every detail is intentional.",
        why: "Names the feeling twice and then compliments itself. The table is covered in nine dishes and most of them came from the shop; there is nothing minimal about it and the room would rather say so.",
      },
      {
        text: "Cherry blossom, paper lanterns, and a shamisen somewhere.",
        why: "The tourist kit, assembled. None of it is on this table, one of it is a two-week season, and the third is a musician the host does not have.",
      },
      {
        text: "Dinner is served at seven.",
        why: "Somebody is serving. Nobody is — the table is covered before anyone arrives and the host is sitting at it. Rule 25.3, in five words, which is how quietly it gets in.",
      },
      {
        text: "Come and lose track of time.",
        why: "The hours are printed, and the second one is the whole offer. This line sells its exact opposite.",
      },
      {
        text: "The year the city rebuilt itself, and the world came to look.",
        why: "Sells the date. Nineteen sixty-four is the register this is written in, not a thing being offered, and a room that leans on a year is a room that has not found its own evening.",
      },
    ],
  },
};
```

---

## 2. THE TONES

Eight of the vocabulary, for `DESTINATION_TONES` in `src/lib/voice.ts`. Every
tag points at a line above.

```ts
export const TOKYO_1964_TONES: readonly ToneWeight[] = [
  { code: "exact_word", weight: 1 },
  { code: "up_early_anyway", weight: 0.9 },
  { code: "deadpan", weight: 0.9 },
  { code: "feeds_you_first", weight: 0.8 },
  { code: "asks_properly", weight: 0.6 },
  { code: "understated", weight: 0.6 },
  { code: "explains_nothing", weight: 0.5 },
  { code: "all_at_once", weight: 0.4 },
];
```

| tone | the line it points at |
|---|---|
| `exact_word` | Hours in words. Seven o'clock, half past ten. The room is an hour kept. |
| `up_early_anyway` | "We are all up at six." The reason it ends, and the whole ending facet. |
| `deadpan` | "Say the strict thing as though it were ordinary." |
| `feeds_you_first` | "The table is already covered when the first person sits." |
| `asks_properly` | "Nobody's glass is allowed to be empty while a sentence is going on." |
| `understated` | The kindness is never named. It is a full glass. |
| `explains_nothing` | "State the rule about the glass once, and never explain it." Never explain the last bowl. |
| `all_at_once` | `volume = overlapping`. Six people at a covered table. |

**Measured against the whole library.** Driven by a scratch script that calls the
committed `voiceAffinity`, `destinationVoiceProfile` and `toneHandOverlap` from
`src/lib/voice.ts` — the same arithmetic `check:voices` runs, but the room is not
in `destinations.ts` yet, so this is a build-time estimate and is labelled as one
(rule 31: where a number is read from belongs in the label). **Re-run
`npm run check:voices` the moment the room lands; do not carry these forward.**

- **Highest tone affinity 0.684, against Havana**, on a monitor-tier ceiling of
  0.92 and a structural distance of 5. Second is Dolomites at 0.525, third
  Portofino at 0.513. The field's own maximum today is 0.853, so this room does
  not become the closest pair.
- **Highest tone-hand overlap 0.500**, against a guard of 0.8. No hand is worn.
- **Stated triple: `plain / collective_first / deadpan` — unused.** Eighteen of
  the 120 available triples are taken; this is the nineteenth. It shares two
  legs with Havana (`plain`, `collective_first`) and parts on the third, which
  is the intended contrast: the same household voice, warm there and flat here.

**On thinness.** Four of the eight are near-singletons the catalogue was not
using — `up_early_anyway` (Aspen alone), `understated` and `explains_nothing`
(Westhampton alone), `feeds_you_first` (two rooms). This room is a second
claimant for three of them, which is the spread section 2 of the protocol asks
for rather than another dry-and-unhurried hand.

**One option, flagged rather than taken.** `always_next_sunday` is a DRAFT tone
claimed by no room, and a standing weeknight supper is arguably the room it was
waiting for. Adding it at 0.4 moves the maximum affinity 0.684 → 0.758, still
well inside the ceiling, and would require clearing the tone's draft flag in
`voice.ts` — a change to the vocabulary, which is hers. **Not taken.** The
seven-tone hand is complete without it and a room proposal should not arrive
carrying a vocabulary edit.

---

## 3. THE PLATE

### `src/lib/library.ts`

`No. 04` is free. (Taken: 02, 03, 05, 06, 08, 09, 12, 14, 15, 17, 19 and the
rest of the shelf.)

```ts
{
  slug: "tokyo-1964",
  name: "TOKYO, 1964",
  caption: "Tokyo",
  number: "No. 04",
  occasion: "The long dinner",
  tagline: "Supper at seven, and rice with tea over it at ten.",
  rows: [
    {
      label: "The Arrival",
      text: "Shoes by the door in the order people came. A glass in your hand before your coat is off, and it is not yours to fill.",
    },
    {
      label: "The Moment",
      text: "Eight small dishes out before anybody sat, and the ninth arriving because somebody went back out for it.",
    },
    {
      label: "The Table",
      text: "Covered edge to edge, nothing in the middle. Everything within reach of somebody, and passed.",
    },
    {
      label: "The Ending",
      text: "The last bowl at half past ten. Rice, a salted plum, hot tea poured over. Nothing is announced.",
    },
  ],
}
```

### `src/app/plates.tsx`

Tokens only, no literal hex, per the rule that a poster naming a colour cannot
be repainted.

```tsx
export function TokyoPlate() {
  return (
    <svg viewBox="0 0 300 400" role="img" aria-label="Tokyo, 1964">
      <rect width="300" height="400" fill="var(--night)" />
      {/* the light over the table */}
      <circle cx="150" cy="96" r="42" fill="var(--gold)" opacity="0.92" />
      <circle cx="150" cy="96" r="42" fill="none" stroke="var(--gold-lit)" strokeWidth="1" />
      {/* the split curtain */}
      <rect x="40" y="150" width="105" height="54" fill="var(--oxblood)" />
      <rect x="155" y="150" width="105" height="54" fill="var(--oxblood)" />
      {/* the table, covered */}
      <rect x="34" y="246" width="232" height="8" fill="var(--bone)" />
      <rect x="52" y="254" width="10" height="58" fill="var(--bone)" />
      <rect x="238" y="254" width="10" height="58" fill="var(--bone)" />
      {/* nine small dishes */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <circle
          key={i}
          cx={54 + i * 27}
          cy={232}
          r="9"
          fill="var(--bone)"
          opacity="0.85"
        />
      ))}
      <circle cx={270} cy={232} r="9" fill="var(--aqua)" />
      {/* the last bowl */}
      <path d="M126 340 h48 a24 24 0 0 1 -48 0 z" fill="var(--bone)" />
      <path
        d="M144 322 c0 -8 6 -8 6 -16 M156 322 c0 -8 -6 -8 -6 -16"
        stroke="var(--gold-lit)"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}
```

The ninth dish is `--aqua` and the other eight are `--bone`: it is the one
somebody went back out for.

### The palette clears both floors

Driven by the exact arithmetic in `src/lib/palette.test.ts` — `apart()` is the
mean per-channel absolute difference, floor 8 on `ground`, and WCAG contrast
against the room's own ground.

| check | value | floor | |
|---|---|---|---|
| nearest existing ground (`tahiti` `#124A4A`) | **13.7** | 8 | ok |
| `ink` on `ground` | **11.78:1** | 7 | ok |
| `inkSoft` on `ground` | **6.09:1** | 4.5 | ok |
| `inkFaint` on `ground` | **3.48:1** | 3 | ok |
| `aqua` on `ground` | **6.53:1** | 3 | ok |
| `oxblood` on `ground` | **4.82:1** | 3 | ok |
| `gold` on `ground` | **6.93:1** | 3 | ok |

`#1B2A4A` is a deep indigo — the dye, the curtain, the workwear — and the
catalogue has nothing near it. The nearest is Tahiti's dark teal at 13.7, then
New York's grey at 14.2. Seven grounds are dark; this is the eighth, and it is
the first blue one.

`paletteDark` is `#0C1220` / `#121A2C`, checked against every existing dark
block for an exact repeat. **Note in passing: nothing tests `paletteDark`, and
Havana and Acapulco currently ship the identical dark ground and ground2.** That
is a separate finding, filed here because this was the pass that found it.

---

## 4. THE CONTENT

### `docs/menus.md` — deliberately not written, and the protocol is stale here

Step 4 of `docs/new-destination.md` lists `docs/menus.md` first. **The menu pool
was retired by `db/045`.** Anything written into that file now seeds at
`discontinued` and reaches nobody. Writing a Tokyo menu section would have
produced content that looks delivered and is not — rule 16's shape exactly. The
protocol's step 4 table should lose the row; that is a one-line change and it is
hers to make, so it is reported rather than done.

The composed table draws from `docs/dishes.md` instead, which is written below in
full.

### `docs/dishes.md` — `## Tokyo`

55 dishes: 20 appetizers, 20 mains, 15 desserts. Format is
`name · B/H/M` with a season only where it binds, matching the existing sections.

```markdown
## Tokyo

### Appetizers

- Hiyayakko — cold tofu, ginger and spring onion, the soy poured at the table · B (summer)
- Edamame, boiled in the pod and salted while hot · B (summer)
- Nukazuke — daikon and cucumber out of the bran crock · B
- Kamaboko, sliced pink and white, with a dab of mustard · B
- Chikuwa split and filled with cucumber · B (summer)
- Korokke from the butcher, still warm in the paper · B
- Menchi katsu, bought on the way home · B
- Cucumber salted overnight and pressed under a plate · H (summer)
- Sunomono — wakame and cucumber in rice vinegar · H (summer)
- Shiozake — salted salmon under the grill until the skin goes · H
- Atsuage grilled, with grated ginger heaped on it · H (winter)
- Tofu simmered in stock with a knot of kombu · H (winter)
- Tamagoyaki — the rolled egg, cut across, sweet if it turned out that way · M
- Kinpira gobo — burdock and carrot in soy and sesame · M
- Hijiki simmered with carrot and fried tofu · M
- Ohitashi — spinach under a drift of bonito flakes · M
- Karaage — chicken in ginger and soy, fried late and brought out in the pan · M
- Gyoza folded at the table and fried in one pan · M
- Yakitori, thigh and spring onion, salt not sauce · M
- Potato salad with cucumber, carrot and ham · M

### Mains

- Sushi from the shop, on the wooden tray that goes back in the morning · B
- Chirashi from the shop, in the lacquer box · B
- Ramen brought back from the corner in the pot it was made in · B
- Onigiri made in a stack and wrapped one at a time · H
- Zaru soba, cold, with the dipping cup and the pot of broth after · H (summer)
- Somen in a bowl of ice water · H (summer)
- Whole horse mackerel grilled with salt · H (summer)
- Ochazuke — rice, a salted plum, hot tea poured over · H
- Oden — daikon, egg, fishcake and konnyaku, in the pot since five · M (winter)
- Yosenabe — whatever the fishmonger had, in the pot on the ring · M (winter)
- Sukiyaki, the pan on the ring, everyone reaching · M (winter)
- Nikujaga — beef and potatoes in soy and sugar, better the next day · M
- Buri no teriyaki — yellowtail glazed in the pan · M (winter)
- Saba no misoni — mackerel simmered in miso and ginger · M (fall)
- Tonkatsu, sliced, under a mountain of shredded cabbage · M
- Curry rice, thick and sweet, made the day before · M
- Chawanmushi — savoury custard with shrimp and gingko · M
- Katsudon, made in the small pan one at a time · M
- Yakisoba on the hotplate, with everyone standing up · M
- Chahan out of yesterday's rice · M

### Desserts

- Mikan in a bowl, peeled with a thumb · B (winter)
- Yokan, sliced thin, with green tea · B
- Dorayaki from the shop, two each · B
- Daifuku — bean paste in pounded rice · B (spring)
- Taiyaki, still warm, in paper · B (winter)
- Castella, cut in slabs · B
- Strawberry shortcake out of the bakery box, string still on · B (spring)
- Melon, the good one, in wedges · B (summer)
- Senbei with the last tea · B
- Anmitsu — agar cubes, sweet beans, black syrup poured over · H (summer)
- Kakigori shaved at the table while people watch · H (summer)
- Warabimochi, dusted, cold out of the fridge · H (summer)
- Amazake warmed and poured into small cups · H (winter)
- Purin — caramel custard, turned out of the glass · M
- Coffee jelly with cream poured over it · M (summer)
```

### `docs/drinks.md` — programme 26

The next unused programme number is 26. Every drink carries its mocktail mirror
— same glass, same components, arriving at the same time — which this room
enforces socially as well as schematically: nobody fills their own glass, so a
person not drinking is filled by their neighbour exactly like everyone else and
is never visibly not drinking.

```markdown
### 26 · Supper on a work night

**26.1 · Beer, poured for you by whoever is beside you, in small glasses**
- Mirror: Cold barley tea, in the same small glass, poured the same way
- For: Dinner, Standing drinks
- Season: Year-round
- Mixing: Bought and poured

**26.2 · A highball — whisky, soda, and more ice than looks sensible**
- Mirror: Soda over the same ice with a squeeze of lemon
- For: Dinner, Standing drinks
- Season: Year-round
- Mixing: Half made

**26.3 · Sake warmed in the flask, in the small cups**
- Mirror: Amazake warmed in a second flask, in the same small cups
- For: Dinner
- Season: Winter
- Mixing: Half made

**26.4 · Cold sake poured until the glass overflows into the box**
- Mirror: Cold barley tea poured the same way into the same box
- For: Dinner
- Season: Summer
- Mixing: Bought and poured

**26.5 · Shochu with hot water, in the cup you hold with both hands**
- Mirror: Hot water with a salted plum crushed into it, in the same cup
- For: Dinner, Late supper
- Season: Winter
- Mixing: Half made

**26.6 · Chuhai — shochu, lemon and soda, made in a jug**
- Mirror: Lemon and soda from the second jug, over the same ice
- For: Standing drinks, Dinner
- Season: Summer
- Mixing: Actually mixed

**26.7 · Umeshu over ice, with one of the plums in the glass**
- Mirror: The syrup and a plum from the same jar, topped up with soda
- For: Dinner, Late supper
- Season: Year-round
- Mixing: Bought and poured

**26.8 · Green tea, poured last, when the bowls have gone round**
- Mirror: Green tea, poured last, when the bowls have gone round
- For: Late supper
- Season: Year-round
- Mixing: Half made
```

26.8 mirrors itself, which is the existing convention for a drink with no
alcohol in it.

### The game — proposed here, NOT written to `src/lib/games.ts`

Another agent holds that file. One `game_rule` exemplar means one native game,
and this is it:

> **THE HOUR YOU HAVE TO KEEP.** Going round the table, everybody says the hour
> they have to be up tomorrow. The earliest one picks the last record. The
> latest one does the bowls.

Slot: a finale beat. It needs nothing bought, works from four people up, and it
is the room's ending stated as a game rather than as a rule — which is why it is
the right one and not a generic going-round.

### The food identity — `src/lib/food-identity.ts`

```ts
{
  room: "Tokyo",
  identity: "table",
  from: "The table is already covered when the first person sits",
}
```

A **table** room, floor 20. The premise sentence is verbatim. 55 dishes against
a floor of 20.

---

## 5. THE HEADING

`scripts/catalogue-vocabulary.mjs`, in `DESTINATIONS`:

```js
  Tokyo: "tokyo-1964",
```

And in `ROOM_HEADINGS`, wherever the full names are mapped:

```js
  "TOKYO, 1964": "Tokyo",
```

**This is the step that fails the deploy if it is missed.** The seeders throw on
an unknown heading rather than skipping it, which is correct and which is also
why the two lines above have to land in the same commit as the content, never
after it.

---

## 6. COVERAGE

The protocol names "how much making" as the axis that gets missed, and it is
right: measured across the whole of `docs/dishes.md`, **27 of the 162
course × making cells in the catalogue are empty**, and 26 of the 27 are in the
six rooms that have no wired voice. Palm Springs has no main at any rung, St.
Moritz has no half-made appetizer and no main below `M`, Amalfi has five holes.

This room has none.

| | bought | half made | actually made |
|---|---|---|---|
| **appetizers** | 7 | 5 | 8 |
| **mains** | 3 | 5 | 12 |
| **desserts** | 9 | 4 | 2 |

**A host who said she wants everything to arrive finished can eat three courses
here** — korokke and kamaboko and cold tofu, then sushi from the shop on the
tray, then mikan and castella and a bakery shortcake. That is the coverage claim
that matters, and it is the reason `food = bought` was the honest cell in 0a
rather than a compromise.

**Season.** Winter (oden, yosenabe, sukiyaki, warmed sake, amazake, mikan,
taiyaki), summer (somen, cold soba, grilled mackerel, cold tofu, kakigori,
melon, cold sake), spring (daifuku, strawberry shortcake), autumn (mackerel in
miso). Thirty-two of the fifty-five carry no season at all, so the room is
year-round and not merely seasonally reachable.

**Occasion.** Dinner throughout. Standing drinks: the twenty appetizers ARE a
standing table, and two of the drinks are written for it. Lunch: soba, somen,
katsudon, yakisoba, chahan, curry rice, onigiri, tonkatsu. Late supper: ochazuke,
ramen, chahan, onigiri, senbei, the last tea. **Brunch is the thin one** —
tamagoyaki, shiozake, onigiri and castella would carry it and it has not been
written as a programme. Said out loud rather than papered over: this is an
evening room and it reaches four occasions of five.

---

## 7. SEEDING — deliberately not done

Nothing was seeded and nothing was activated. `world` and `world_voice` are
governed classes and a seeder that signs one fails
`src/lib/governed.test.ts` by design. The sequence in step 7 runs after she
signs, not before, and `activate:catalogue` is a separate gesture on purpose.

---

## WHAT THIS STILL NEEDS FROM HER

In the order it blocks on:

1. **The row.** Two cells will be argued with — `arrival = assigned` and
   `food = bought` — and both arguments are in 0a. Everything else waits on this.
2. **The premise and the tagline**, which are mine and are the two things rule 3
   makes hers. If she rewrites the premise, the `from` line in the food-identity
   claim has to be re-copied verbatim from whatever she writes.
3. **The deliverables sheet** in her own voice, if this room is to have one — the
   table, what to wear, what there is, what's playing — filed into
   `docs/deliverables-sheets.md` in the session it is written, per the rule that
   file establishes. This proposal does NOT contain one and must not be read as
   containing one.
4. **The signature gesture.** The last bowl is mine. Rule 27 says a weak
   signature is refused rather than kept for tidiness, and she is the one who
   threw out Palm Springs' lights-at-dusk.
5. **Nineteen more host acts.** Ten are drafted above; the rule wants twenty.
6. **The draft tone question**, if she wants `always_next_sunday` landed here.

And five mechanical follow-ons the room will trip when it lands, all of which
are hand-edited numbers rather than logic:

- `src/lib/food-identity.test.ts` holds `18` rooms and a `12 / 4 / 2` identity
  split. A nineteenth table room makes it `13 / 4 / 2` over 19.
- `src/lib/drinks-seed.test.ts` holds nine corpus counts (drinks, programmes,
  rooms, mirrors). Programme 26 moves all of them.
- `src/lib/games.test.ts` holds a game count. One native game moves it.
- `src/lib/selection/structure.test.ts` held the `7 / 7 / 4` ending split; it is
  already `7 / 7 / 5` with the old numbers preserved beside it, because the row
  landing turned the suite red and the brief required it green.
- `docs/new-destination.md` step 0c's "about 131 rooms" is stale by roughly
  2.3×; the corrected arithmetic is in the scaling note.

## WHAT I DID NOT WRITE

`src/lib/games.ts`, `docs/games-*.md`, `src/app/page.tsx`, `src/app/pricing/`,
`src/app/apply/` — held by other agents. The bank documents. The atmosphere and
decor entries. The take-home bank. Any migration. Any seed run.
