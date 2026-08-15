#!/usr/bin/env node
/**
 * Print the writer prompt a destination produces.
 *
 *   npm run prompt                                  # the default: an invitation
 *   npm run prompt -- westhampton-1976 menu_item
 *   npm run prompt -- westhampton-1976 notice "Ask them not to move the umbrella."
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS
 *
 * A voice is only reviewable if somebody can read what the model will be
 * told. src/lib/tokens.ts keeps the assembly pure — tokens in, text out — so
 * the review step for a new destination is this command and a pair of eyes,
 * before a single line reaches a customer.
 *
 * It makes no network call and needs no database. It runs the same code the
 * writer will run, which is the only reason its output is worth trusting.
 */
import { DESTINATIONS } from "../src/lib/destinations.ts";
import { PIECE_KINDS, writerPrompt } from "../src/lib/tokens.ts";

/** One honest default per piece, so the command is useful with no arguments. */
const DEFAULT_ASKS = {
  invitation:
    "Ask six people to a rented house for Labor Day weekend. They already know each other.",
  menu_item: "Name one dish on the dinner card.",
  notice: "One line for the hall table about the record player.",
  house_note: "A note left in a guest's room before she arrives.",
  place_card: "One place card. A name and where she is seated.",
  game_rule: "The rule for a game played after dinner, in one or two lines.",
  bulletin: "The line at the top of Saturday morning's sheet.",
  heading: "A heading for the drinks section of the menu.",
  sign_off: "The line that closes the invitation.",
};

const [slug = "westhampton-1976", piece = "invitation", ask] = process.argv.slice(2);

const destination = DESTINATIONS[slug];
if (!destination) {
  console.error(
    `[prompt] no destination "${slug}". Known: ${Object.keys(DESTINATIONS).join(", ")}`
  );
  process.exit(1);
}

if (!PIECE_KINDS.includes(piece)) {
  console.error(`[prompt] no piece "${piece}". Known: ${PIECE_KINDS.join(", ")}`);
  process.exit(1);
}

process.stdout.write(
  writerPrompt(destination, {
    piece,
    ask: ask ?? DEFAULT_ASKS[piece],
    facts:
      piece === "invitation"
        ? [
            "Friday the third through Monday the sixth of September",
            "Dune Road, Westhampton",
            "Drinks at seven",
          ]
        : undefined,
    maxWords: piece === "invitation" ? 40 : piece === "place_card" ? 12 : undefined,
  }) + "\n"
);
