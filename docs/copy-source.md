# Copy source sheet

**Extracted, not written.** Every line below already exists in
`src/lib/destinations.ts`, THE ALLOCATION, or `docs/destination-contrasts.md`.
Nothing here is new prose. It is pulled together so that member-facing copy can
be *quoted from the catalogue* rather than invented beside it — the same
discipline the voice layer applies to a deliverable, applied to the marketing.

Regenerate with `node scripts/copy-source.mjs` if the catalogue moves.

---

## 1. The thesis — what the product argues

These are load-bearing and each is enforced somewhere in code. They are the
strongest candidates for a line that has to carry the whole idea.

> Venue never touches the destination — that's the thesis of the product. The destination is where she's transported to; the venue is where she physically is; the engine's whole job is mapping one onto the other. Havana in a Brooklyn apartment isn't a compromise, it's the pitch.

*selection/venue.ts · enforced in three places*

> If she chooses from a shortlist, the profile learns her self-image — what she would like to be seen wanting. If the curator chooses and she reacts, it learns her taste. Those diverge, and the second is the product.

*selection-spec.md · superseded by pick-first, kept for the reasoning*

> Not a bigger weight — a TIER. A weight averages. Averaging two axes produces the destination that is middling on both, which is the compromise that is nobody's.

*selection/tone.ts*

> Deciding what the house may offer remains ours. Deciding what one member gets is now hers.

*desk/page.tsx*

> Facets describe the evening. Properties of her people belong to the tiles.

*destination-contrasts.md*

> A room that cannot be said without borrowing another room's words means the list is wrong.

*voice.ts, the coined tones*

> Rows are arithmetic. Thrown-ness is voice.

*destination-contrasts.md*

> A premise must read as a party somebody is throwing, not a scene that occurs.

*new-destination.md, step 0d*

> The conflict exists only because your catalog lacks that destination.

*selection/destination.ts*

> Every sentence in this file is for the house.

*selection/engine.ts*

---

## 2. The rooms — taglines

Twelve authored. Each is already a headline.

| destination | tagline |
|---|---|
| **WESTHAMPTON, 1976** | Vintage summer glamour. Very questionable houseguests. |
| **HAVANA, 1957** | The table is pushed back for the dancing. Supper again at three. |
| **LAS VEGAS, 1960** | Everyone dressed up. Nobody in a nightclub queue. |
| **NEW YORK, 1938** | A rooftop, briefly. A long table, mostly. |
| **NANTUCKET, 1972** | Newspaper on the table. Butter in a saucepan. |
| **NEW ORLEANS, 1956** | Dinner at nine. Nobody's leaving at eleven. |
| **CATSKILLS, 1963** | Everyone swims before breakfast. The tent is decorative. |
| **CÔTE D'AZUR, 1962** | Lunch that never ended. Nobody changed for dinner. |
| **PORTOFINO, 1961** | The harbour to yourselves. Everything shut but the good place. |
| **DOLOMITES, 1956** | The first gondola at eight. Lunch halfway down. |
| **BIG SUR, 1971** | Fog until noon. Nobody has a signal. |
| **TAHITI, 1961** | Torches lit before anyone is hungry. The tide comes to the table. |

## 3. The rooms — the register line

Where the voice says what kind of note it is. The most transferable prose in the
catalogue, because each one is a whole scene in a sentence.

**WESTHAMPTON, 1976**
> A card left on the hall table by someone who has already gone to bed.

**HAVANA, 1957**
> A note written standing up in the kitchen at the hour it describes, with the coffee going and the music still on in the next room.

**LAS VEGAS, 1960**
> A card left on the bar of a suite by somebody who has already booked the table and pressed the jacket.

**NEW YORK, 1938**
> A card set at each place, engraved rather than written, on the kind of stock that stands up by itself.

**NANTUCKET, 1972**
> A note on the back of an envelope, left under the sugar bowl by somebody who has gone down to the beach.

**NEW ORLEANS, 1956**
> A note shouted from the kitchen and written down by somebody else, while two other conversations are going on.

**CATSKILLS, 1963**
> A notice pinned by the door of the office, typed on the machine that has always been on that table.

**CÔTE D'AZUR, 1962**
> A note left under a glass on the terrace, by somebody who has already told this story once today and improved it.

**PORTOFINO, 1961**
> A note left on the kitchen table for whoever gets up second, written with a coat already on.

**DOLOMITES, 1956**
> A card pinned in the hall above the boots, retyped whenever the times change.

**BIG SUR, 1971**
> A note left on the kitchen counter of a rented cabin, in pencil, by somebody who has gone down to the creek.

**TAHITI, 1961**
> A note left face up on the table under a stone, written before anybody else was awake.

---

## 4. The refusals — what the house will not write

From each destination's `rejected` list: a line the voice refuses, and why. This
is the sharpest critical prose in the repo and the best source for copy that has
to say what Revelle is NOT — because it does it by demonstration.

**WESTHAMPTON, 1976**

- ~~"Vintage summer glamour awaits."~~
  — Names the feeling. The tagline may say it once, on the cover; nothing inside the destination may say it at all.
- ~~"A weekend of sun, sea and very bad behaviour."~~
  — The three-item list with the joke in the third slot — the shape every generated line reaches for. It also announces the behaviour instead of arranging it.

**HAVANA, 1957**

- ~~"Havana, 1957. The casino, the linen suits, the last good year."~~
  — Somebody else's country as a playground, photographed at its least free. Kitsch, and the exact failure the period rule exists to stop. The destination is NAMED for the year and this line is still forbidden — a date the voice is written in is not a nostalgia the voice sells, and the four words this opens with being the name on the plate is what makes it easy to write by accident.
- ~~"Sultry nights, strong rum, and a rhythm you can feel."~~
  — Three feelings named in a row and a place sold as a temperature. Brochure.

**LAS VEGAS, 1960**

- ~~"What happens in Vegas stays in Vegas."~~
  — A borrowed joke, and one this library has already refused once on Dune Road. The room states the hour and lets the rest happen.
- ~~"Ring-a-ding-ding. Dinner is at midnight."~~
  — The impression. The room is 1960 and is not doing an impression of 1960.

**NEW YORK, 1938**

- ~~"Ring in the new year with us."~~
  — Join us, in a bow tie. The apartment states the hour; it does not recruit.
- ~~"A night of old New York glamour."~~
  — Names the feeling and borrows a New York that has been sold already. This is one apartment on one night.

**NANTUCKET, 1972**

- ~~"An authentic New England clambake experience."~~
  — Three words the house bans in one line. A clambake is a dinner, not an experience, and calling it authentic is the surest sign it is not.
- ~~"Ahoy, and welcome aboard."~~
  — The costume. Nobody who lives on an island talks like a gift shop.

**NEW ORLEANS, 1956**

- ~~"Laissez les bons temps rouler."~~
  — A phrase put on the page to prove where we are. The house does not perform a language it lives in.
- ~~"The Big Easy at its most decadent."~~
  — A tourist board wrote this. It names the feeling and sells somebody's city back to them.

**CATSKILLS, 1963**

- ~~"Summer camp, but for grown-ups."~~
  — The first line anybody writes, and it turns the premise into a gag. A gag cannot be lived in for a week. The plate already does the harder thing: her name is on the bunk list too.
- ~~"Remember the smell of the lake? So do we."~~
  — Nostalgia, and a question. It sells the reader her own childhood and leaves out everybody who did not have that one.

**CÔTE D'AZUR, 1962**

- ~~"The French Riviera at its most glamorous."~~
  — Names the feeling and sells the coast. Two of the terrace's banned words in eight, and it describes a view instead of an arrangement.
- ~~"Bonjour, and bring your appetite."~~
  — A word set on the page to sound French, and an instruction. The house does not perform the language it lives in.

**PORTOFINO, 1961**

- ~~"Portofino's best-kept secret."~~
  — Sells the town and flatters the reader. Half of it is shut, which is a fact rather than a secret.
- ~~"Ciao, and welcome to the good life."~~
  — A word set down to sound Italian, and then the feeling named outright.

**DOLOMITES, 1956**

- ~~"Conquer the mountain before lunch."~~
  — A dare, and a mountain written as an opponent. Nobody in this hall is measured against anything.
- ~~"Apres-ski from two o'clock onwards."~~
  — Makes the day about the drinking, and borrows a word to do it. The mug has the same build with or without.

**BIG SUR, 1971**

- ~~"Disconnect to reconnect."~~
  — Turns a fact about a road into a wellness programme, and puts the reader in it as a patient.
- ~~"Big Sur will change you."~~
  — A promise about somebody's interior, from a cabin that mostly wants the cars parked facing out.

**TAHITI, 1961**

- ~~"Aloha, and welcome to paradise."~~
  — A Hawaiian word on a Polynesian island four thousand miles away, and then the feeling named outright. Two costumes in five words.
- ~~"Island time. Nobody is watching the clock."~~
  — A joke about lateness at the expense of the place. There is no clock on the page at all, which is the honest version of the same fact.

