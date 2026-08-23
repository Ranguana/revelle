import { writeFileSync } from "node:fs";
import { DESTINATIONS } from "../src/lib/destinations.ts";
const L=[];
L.push("# Copy source sheet");
L.push("");
L.push("**Extracted, not written.** Every line below already exists in");
L.push("`src/lib/destinations.ts`, THE ALLOCATION, or `docs/destination-contrasts.md`.");
L.push("Nothing here is new prose. It is pulled together so that member-facing copy can");
L.push("be *quoted from the catalogue* rather than invented beside it — the same");
L.push("discipline the voice layer applies to a deliverable, applied to the marketing.");
L.push("");
L.push("Regenerate with `node scripts/copy-source.mjs` if the catalogue moves.");
L.push("");
L.push("---");
L.push("");
L.push("## 1. The thesis — what the product argues");
L.push("");
L.push("These are load-bearing and each is enforced somewhere in code. They are the");
L.push("strongest candidates for a line that has to carry the whole idea.");
L.push("");
// NO-QUOTE entries are house-only. They state the MECHANISM, and quoting a
// mechanism to the person it is being run on is either a spoiler or an insult —
// "the profile learns her self-image" is true, useful, and unsayable to her.
// Marked rather than removed: they are the argument the sellable lines rest on.
for (const [q,src,noQuote] of [
["Venue never touches the destination — that's the thesis of the product. The destination is where she's transported to; the venue is where she physically is; the engine's whole job is mapping one onto the other. Havana in a Brooklyn apartment isn't a compromise, it's the pitch.","selection/venue.ts · enforced in three places"],
["If she chooses from a shortlist, the profile learns her self-image — what she would like to be seen wanting. If the curator chooses and she reacts, it learns her taste. Those diverge, and the second is the product.","selection-spec.md · superseded by pick-first, kept for the reasoning", true],
["Not a bigger weight — a TIER. A weight averages. Averaging two axes produces the destination that is middling on both, which is the compromise that is nobody's.","selection/tone.ts", true],
["Deciding what the house may offer remains ours. Deciding what one member gets is now hers.","desk/page.tsx", true],
["Facets describe the evening. Properties of her people belong to the tiles.","destination-contrasts.md", true],
["A room that cannot be said without borrowing another room's words means the list is wrong.","voice.ts, the coined tones", true],
["Rows are arithmetic. Thrown-ness is voice.","destination-contrasts.md", true],
["A premise must read as a party somebody is throwing, not a scene that occurs.","new-destination.md, step 0d", true],
["The conflict exists only because your catalog lacks that destination.","selection/destination.ts", true],
["Every sentence in this file is for the house.","selection/engine.ts", true],
]) { L.push(`> ${q}`); L.push("");
   L.push(noQuote ? `*${src}* — **NO QUOTE. House only.**` : `*${src}* — quotable.`);
   L.push(""); }

L.push("---");
L.push("");
L.push("## 2. The rooms — taglines");
L.push("");
L.push("Twelve authored. Each is already a headline.");
L.push("");
L.push("| destination | tagline |");
L.push("|---|---|");
for (const d of Object.values(DESTINATIONS)) L.push(`| **${d.name}** | ${d.tagline} |`);
L.push("");
L.push("## 3. The rooms — the register line");
L.push("");
L.push("Where the voice says what kind of note it is. The most transferable prose in the");
L.push("catalogue, because each one is a whole scene in a sentence.");
L.push("");
for (const d of Object.values(DESTINATIONS)) { L.push(`**${d.name}**`); L.push(`> ${d.voice.register}`); L.push(""); }

L.push("---");
L.push("");
L.push("## 3a. The rule that governs every refusal");
L.push("");
L.push("Promoted out of Havana's list because it is not Havana's. It is the");
L.push("catalogue-wide test for whether a period is a REGISTER or a PITCH, and every");
L.push("dated room is subject to it:");
L.push("");
const hav=(DESTINATIONS["havana"].voice.rejected||[]).find(r=>/last good year/i.test(r.text));
if(hav){ L.push(`> ~~"${hav.text}"~~`); L.push(""); L.push(`> ${hav.why}`); L.push(""); }
L.push("The general form: **a date the voice is written IN is not a nostalgia the voice");
L.push("SELLS.** Twelve rooms carry a year. Any line that sells the year rather than");
L.push("writing from inside it fails this, whichever room it is for.");
L.push("");
L.push("---");
L.push("");
L.push("## 4. The refusals — what the house will not write");
L.push("");
L.push("From each destination's `rejected` list: a line the voice refuses, and why. This");
L.push("is the sharpest critical prose in the repo and the best source for copy that has");
L.push("to say what Revelle is NOT — because it does it by demonstration.");
L.push("");
for (const d of Object.values(DESTINATIONS)) {
  const r=(d.voice.rejected||[]).slice(0,2);
  if(!r.length) continue;
  L.push(`**${d.name}**`); L.push("");
  for (const x of r) { L.push(`- ~~"${x.text}"~~`); L.push(`  — ${x.why}`); }
  L.push("");
}
L.push("---");
L.push("");
L.push("## 5. What this sheet cannot give you yet");
L.push("");
L.push("**SIX ROOMS HAVE NO REPLY CONVENTION.** Every other destination carries one in");
L.push("its lexicon — `regrets only`, `the door is open`, `come up`, `come when you");
L.push("come`, `come at nine`, `kindly reply` — and they are the best short copy in the");
L.push("catalogue, because each states a whole social contract in three words. These six");
L.push("have none, so there is nothing to pull:");
L.push("");
for (const [k,d] of Object.entries(DESTINATIONS))
  if(!(d.voice.lexicon||[]).some(l=>/reply convention/i.test(l.gloss))) L.push(`- ${d.name}`);
L.push("");
L.push("That is a gap in those voice documents rather than in this sheet, and it is the");
L.push("same gap that made `audience` fail as a facet.");
L.push("");
L.push("**WESTHAMPTON IS PROVISIONAL.** Its matrix row was re-founded to Eothen/Capote —");
L.push("the house where the famous come to be off-duty — and its VOICE has not been");
L.push("rewritten. Everything quoted above under WESTHAMPTON, 1976 is the superseded");
L.push("Locust Valley register: dry, quiet, a card left on the hall table. **Do not use");
L.push("it for copy.** The mismatch is recorded under `awaitingVoice` in");
L.push("`data/destination-matrix.json`.");
L.push("");
writeFileSync(new URL("../docs/copy-source.md", import.meta.url), L.join("\n")+"\n");
console.log("wrote docs/copy-source.md");
