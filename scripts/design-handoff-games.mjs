#!/usr/bin/env node
/**
 * THE GAMES, FOR DESIGN — a folder CC Design can be handed.
 *
 * `npm run design:games` → ~/Camp/design_handoff_revelle_games/
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHY THIS IS A GENERATOR AND NOT TWENTY-SEVEN HAND-WRITTEN FILES
 *
 * CLAUDE.md rule 21: every fact two surfaces must agree on has exactly one
 * owner. A design folder describing what is printed for each game and a
 * catalogue saying what is printed for each game MUST agree — a designer
 * setting a ballot that no longer exists has been sent to do work nobody
 * wants. Hand-written, the folder is correct on the day it is written and
 * wrong the first time a game changes, WITHOUT BEING BROKEN, which is the
 * dangerous half.
 *
 * So `src/lib/games.ts` is the owner and every page here is derived from it.
 * Re-run the script and hand over the folder again; nothing is edited in
 * place. The one file that is NOT generated is README.md — it carries an
 * argument rather than a fact, and it is written by a person.
 *
 * THE PALETTES ARE READ LIVE, for the same reason. The copy in
 * ~/Camp/design_handoff_revelle_portal/data was generated from an older
 * registry and no longer matches it — sixteen distinct grounds there against
 * eighteen in the file today. A stale palette in a design folder is the
 * failure CLAUDE.md rule 20 names: a report generated from something other
 * than reality is the most convincing failure this system produces.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE TWO KINDS, AND WHY THEIR PAGES ARE SHAPED DIFFERENTLY
 *
 * A `provided` game gets a rules page and a printed piece. A `recommended`
 * game gets a name, a link, and the host's own part. That difference is
 * LEGAL and not stylistic — db/010 grants the house exactly two rights over
 * somebody else's game — so the generator branches on `sourcing` rather than
 * rendering an empty "printed piece" heading and hoping nobody fills it in.
 */

import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { register } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/*
 * `src/lib/desk/labels.ts` is the one owner of what `provided`, `on_hand` and
 * `plays_too` are CALLED, and this folder must agree with the desk about that
 * (rule 21). It reaches its dependencies through the `@/` alias, which the
 * bundler resolves and Node does not — so this registers the resolver that
 * already exists for exactly this problem rather than writing a second one or
 * copying three label maps into this file, which is rule 19's hand-written
 * list waiting to go stale.
 */
register("../src/lib/desk/alias.test.hooks.mjs", import.meta.url);

const { ALL_GAMES } = await import("../src/lib/games.ts");
const { DESTINATIONS } = await import("../src/lib/destinations.ts");
const { SUPPLY_SOURCES, HOST_ROLES, GAME_SHAPES } = await import(
  "../src/lib/desk/labels.ts"
);

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const OUT =
  process.argv[2] ??
  join(process.env.HOME ?? "", "Camp", "design_handoff_revelle_games");

const label = (list, code) => list.find((x) => x.code === code)?.label ?? code;

/* ── the occasion vocabulary, parsed out of db/009 rather than restated ──
 *
 * Rule 19 in its smallest form: a hand-written list of occasions in this file
 * is correct until somebody inserts a tenth, and then it is wrong quietly.
 * games.test.ts reads db/ the same way and for the same reason.
 */
const OCCASION_LABELS = (() => {
  const sql = readFileSync(
    join(REPO, "db", "009-occasion-gates-destination-fills.sql"),
    "utf8"
  );
  const block = /insert into occasion_shape \(occasion, days, label, note\) values([\s\S]*?);\n/.exec(sql);
  if (!block) throw new Error("db/009: could not find the occasion_shape insert");
  const rows = [...block[1].matchAll(/\(\s*'([a-z_]+)',\s*(\d+),\s*'([^']+)'/g)];
  if (rows.length !== 9) throw new Error(`db/009: parsed ${rows.length} occasions, expected 9`);
  return new Map(rows.map((m) => [m[1], { label: m[3], days: Number(m[2]) }]));
})();

const OCCASIONS = [...OCCASION_LABELS.keys()];
const ROOMS = Object.keys(DESTINATIONS);

/* ── eligibility, said once ────────────────────────────────────────────
 *
 * The same reading src/lib/selection/occasion.ts uses and CLAUDE.md rule 23
 * spells out: a `native` row is a WHITELIST — these and no others — and a
 * `forbidden` row is a veto. An affinity is a weight and says nothing about
 * eligibility, so it is not consulted here.
 */
const playsAt = (game, occasion) => {
  if (game.occasions.some((o) => o.occasion === occasion && o.fit === "forbidden")) return false;
  const native = game.occasions.filter((o) => o.fit === "native");
  return native.length === 0 || native.some((o) => o.occasion === occasion);
};
const playsIn = (game, room) => {
  const scope = game.worlds.find((w) => w.world === room);
  if (scope?.forbidden) return false;
  const native = game.worlds.filter((w) => w.native);
  return native.length === 0 || native.some((w) => w.world === room);
};

const roomName = (key) => DESTINATIONS[key]?.name ?? key;

/* ── the pages ─────────────────────────────────────────────────────── */

const paletteLine = (game) => {
  const native = game.worlds.filter((w) => w.native).map((w) => w.world);
  if (native.length === 0) {
    return (
      "This one is playable in every room, so it has no palette of its own — " +
      "it takes whichever room the member's occasion is set in. Design it " +
      "against at least two: a pale ground and a dark one. " +
      "`data/destination-palettes.css` has all eighteen."
    );
  }
  const key = native[0];
  const p = DESTINATIONS[key]?.look?.palette;
  if (!p) return `\`[data-destination="${key}"]\` — see \`data/destination-palettes.css\`.`;
  return (
    `\`[data-destination="${key}"]\` — ground \`${p.ground}\`, ink \`${p.ink}\`, ` +
    `rule \`${p.rule}\`, and three accents: \`${p.aqua}\`, \`${p.oxblood}\`, ` +
    `\`${p.gold}\`. The night face is \`${p.night}\` under \`${p.nightInk}\`. ` +
    `Full sixteen tokens in \`data/destination-palettes.css\`.`
  );
};

const suppliesTable = (game) => {
  if (game.supplies.length === 0) return "_Nothing. This game needs no object at all._\n";
  const rows = game.supplies.map((s) => {
    const count = s.perGuest
      ? "one a head"
      : s.quantity
        ? `${s.quantity}`
        : "as needed";
    const lead = s.leadTimeDays ? `${s.leadTimeDays} days` : "—";
    return `| ${s.item} | ${SUPPLY_SOURCES[s.source] ?? s.source} | ${count} | ${lead} | ${s.detail ?? ""} |`;
  });
  return (
    "| what | where it comes from | how many | order by | note |\n" +
    "|---|---|---|---|---|\n" +
    rows.join("\n") +
    "\n"
  );
};

const occasionLine = (game) => {
  const yes = OCCASIONS.filter((o) => playsAt(game, o));
  const no = OCCASIONS.filter((o) => !playsAt(game, o));
  if (no.length === 0) return "Every occasion the house has.";
  const why = game.occasions
    .filter((o) => o.fit === "forbidden" && o.note)
    .map((o) => `  - not at **${OCCASION_LABELS.get(o.occasion)?.label ?? o.occasion}** — ${o.note}`)
    .join("\n");
  // Lower-cased: db/009 writes them as headings ("The birthday") and here they
  // are items in a sentence.
  const lower = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  return (
    `${yes.map((o) => lower(OCCASION_LABELS.get(o).label)).join(", ")}.\n\n` +
    (why ? `${why}\n` : "")
  );
};

const roomsLine = (game) => {
  const native = game.worlds.filter((w) => w.native).map((w) => w.world);
  if (native.length > 0) {
    return (
      `**${native.map(roomName).join(", ")}** — and nowhere else. This one was ` +
      `written in that room's own voice, and a native claim is a whitelist: it ` +
      `never appears anywhere but there.`
    );
  }
  const banned = game.worlds.filter((w) => w.forbidden).map((w) => w.world);
  const n = ROOMS.filter((r) => playsIn(game, r)).length;
  return (
    `Any of the eighteen rooms — it appears in ${n} of them` +
    (banned.length ? `, and is refused at ${banned.map(roomName).join(", ")}` : "") +
    `. So this page has to work in every palette the house has, which is the ` +
    `hardest constraint in this folder.`
  );
};

const providedPage = (game) => {
  const [piece] = game.printedMatter;
  return `# ${game.name}

_${label(GAME_SHAPES, game.shape)} · a house game · \`${game.slug}\`_

|  |  |
|---|---|
| **What it costs the evening** | ${game.durationMinutes ? `${game.durationMinutes}–${game.durationMaxMinutes} minutes, as a block` : "nothing — it runs underneath the whole evening"} |
| **How many people** | ${game.minGuests ?? "any"}${game.maxGuests ? ` to ${game.maxGuests}` : " and up"} |
| **The host** | ${label(HOST_ROLES, game.runbook.hostRole)} |
| **Rooms** | ${roomsLine(game)} |

## The card

The one or two lines a member reads before she opens anything. It is a teaser
and it is allowed to be.

> ${game.description.replace(/\n/g, "\n> ")}

## What the game is

This is the page she reads while CHOOSING, and it has to be complete enough
that she could run the game from it.

${game.howItWorks.replace(/\n\n/g, "\n\n")}

## How anyone wins

${game.scoring ?? "_Nobody wins this one, and nothing is scored. That is a design decision and not a gap — the page should not invent a winner._"}
${game.currencyLabel ? `\nThe currency is called **${game.currencyLabel}**, and that word is printed on the material and said out loud.\n` : ""}
## THE PRINTED PIECE

**One artwork per game.** Where a game needs several things in the room at
once, they are on ONE PERFORATED SHEET and the host separates it. This is a
founder ruling and it is enforced by a test: a provided game with two pieces
fails the build, and so does one with none.

|  |  |
|---|---|
| code | \`${piece.piece}\` |
| what it is called | ${piece.label} |
| how many | ${piece.perGuest ? "one a head" : piece.quantity ? `${piece.quantity}` : "one set"} |
| kind of writing on it | \`${piece.voicePiece ?? "—"}\` |

${piece.description ?? ""}

**Palette.** ${paletteLine(game)}

## Materials — what ships and what she supplies

${game.materials ?? ""}

${suppliesTable(game)}
${
  game.requirements.length
    ? `## What the room has to have

${game.requirements.map((r) => `- \`${r.requirement}\`${r.note ? ` — ${r.note}` : ""}`).join("\n")}

`
    : ""
}${
    game.caveat
      ? `## The thing that can go wrong and is not ours to fix

${game.caveat}
`
      : ""
  }## Occasions

${occasionLine(game)}
${
  game.dependencies.length
    ? `
## It leans on another game

${game.dependencies.map((d) => `- **${d.strength === "required" ? "Needs" : "Better after"}** \`${d.requires}\`${d.note ? ` — ${d.note}` : ""}`).join("\n")}

Where several \`Needs\` rows share a group, ANY ONE of them satisfies it.
See item 8 in \`docs/games-need-a-human.md\`: under the current one-game-per-
occasion rule these cannot be satisfied at all, and that is unresolved.
`
    : ""
}
---

_Generated from \`src/lib/games.ts\`. Do not edit this file — edits come back
as a diff against that module, which is the only owner of what a game says._
`;
};

const recommendedPage = (game) => `# ${game.name}

_${label(GAME_SHAPES, game.shape)} · **NOT A HOUSE GAME** · \`${game.slug}\`_

> ## READ THIS BEFORE DESIGNING ANYTHING
>
> This is somebody else's product. The house has exactly two rights over it:
> **name it**, and **point a host at it**. It may not reproduce the rules,
> paraphrase them, reconstruct them, or print a single card.
>
> **So this page has no printed piece and never will.** That absence is a
> positive claim the database enforces in both directions — a trigger refuses
> printed matter for a recommended game, and a test asserts the count is zero.
> It is not an authoring gap waiting to be filled, and a design that leaves a
> space for "the rules card" has misread the page.
>
> What this page carries: the name, the link, and what the host does AROUND it.

|  |  |
|---|---|
| **What it costs the evening** | ${game.durationMinutes}–${game.durationMaxMinutes} minutes |
| **How many people** | ${game.minGuests} to ${game.maxGuests} |
| **The host** | ${label(HOST_ROLES, game.runbook.hostRole)} |
| **Rooms** | ${roomsLine(game)} |

## The card

> ${game.description.replace(/\n/g, "\n> ")}

## THE LINK — the load-bearing element of this page

**${game.externalName} — ${game.externalUrl}**

A name is not finding it. There are several products called some version of
this across the two app stores, so a page that names it and does not link it
hands a host a search box at nine o'clock on the night. This link is the
whole of what the house provides, and it should be the most findable thing
on the page — tappable on a phone, in a room where the lights are down.

It is a browser link and deliberately not a store listing: a store listing is
one platform, and a party is not one platform.

## What the host does

${game.howItWorks}

## Materials

${game.materials ?? ""}

## The thing that can go wrong and is not ours to fix

${game.caveat ?? ""}

## Occasions

${occasionLine(game)}

## Palette

${paletteLine(game)}

---

_Generated from \`src/lib/games.ts\`. Do not edit this file — edits come back
as a diff against that module, which is the only owner of what a game says._
`;

/* ── the palette CSS, read live ────────────────────────────────────── */

const CSS_NAMES = {
  ground: "--ground",
  ground2: "--ground2",
  bone: "--bone",
  ink: "--ink",
  inkSoft: "--ink-soft",
  inkFaint: "--ink-faint",
  rule: "--rule",
  aqua: "--aqua",
  oxblood: "--oxblood",
  gold: "--gold",
  night: "--night",
  night2: "--night2",
  nightInk: "--night-ink",
  nightSoft: "--night-soft",
  nightAqua: "--night-aqua",
  nightOxblood: "--night-oxblood",
};

const paletteCss = () => {
  const out = [
    "/* Every destination's palette, as CSS custom properties.",
    " * GENERATED LIVE from src/lib/destinations.ts by",
    " * scripts/design-handoff-games.mjs. Do not hand-edit: the registry is",
    " * the only truth (CLAUDE.md rule 19), and a hand-edit here is a lie that",
    " * looks like a fact.",
    ` * ${ROOMS.length} rooms, ${Object.keys(CSS_NAMES).length} day tokens each, plus a dark face.`,
    " */",
    "",
  ];
  for (const key of ROOMS) {
    const d = DESTINATIONS[key];
    out.push(`/* ${d.name.toUpperCase()} — ${d.tagline} */`);
    out.push(`[data-destination="${key}"] {`);
    for (const [k, css] of Object.entries(CSS_NAMES)) {
      if (d.look.palette[k]) out.push(`  ${css}: ${d.look.palette[k]};`);
    }
    out.push("}");
    if (d.look.paletteDark) {
      out.push(`[data-destination="${key}"][data-face="dark"] {`);
      for (const [k, css] of Object.entries(CSS_NAMES)) {
        if (d.look.paletteDark[k]) out.push(`  ${css}: ${d.look.paletteDark[k]};`);
      }
      out.push("}");
    }
    out.push("");
  }
  return out.join("\n");
};

/* ── the measured facts the README quotes ──────────────────────────── */

const measure = () => {
  const day = new Set(ROOMS.map((r) => DESTINATIONS[r].look.palette.ground));
  const dark = new Map();
  for (const r of ROOMS) {
    const g = DESTINATIONS[r].look.paletteDark?.ground;
    if (!g) continue;
    if (!dark.has(g)) dark.set(g, []);
    dark.get(g).push(r);
  }
  const shared = [...dark.entries()].filter(([, l]) => l.length > 1);
  const provided = ALL_GAMES.filter((g) => g.sourcing === "provided").length;
  const thin = [];
  for (const room of ROOMS) {
    for (const occ of OCCASIONS) {
      const n = ALL_GAMES.filter((g) => playsIn(g, room) && playsAt(g, occ)).length;
      if (n < 3) thin.push(`${room} / ${occ} = ${n}`);
    }
  }
  const count = (fn) => ALL_GAMES.filter(fn).length;
  return {
    rooms: ROOMS.length,
    games: ALL_GAMES.length,
    provided,
    recommended: ALL_GAMES.length - provided,
    // The numbers README.md quotes. They are written here rather than typed
    // into the brief so that a run either confirms the brief or contradicts
    // it visibly — CLAUDE.md rule 31: where a number is read from is a fact to
    // establish first, and it belongs beside the number.
    scheduled: count((g) => g.shape === "scheduled"),
    ambient: count((g) => g.shape === "ambient"),
    finale: count((g) => g.shape === "finale"),
    nativeToOneRoom: count((g) => g.worlds.some((w) => w.native)),
    nobodyWins: ALL_GAMES.filter((g) => !g.scoring).map((g) => g.slug),
    needNoSupplies: ALL_GAMES.filter((g) => g.supplies.length === 0).map((g) => g.slug),
    mostSupplies: Math.max(...ALL_GAMES.map((g) => g.supplies.length)),
    distinctDayGrounds: day.size,
    distinctDarkGrounds: dark.size,
    sharedDarkGrounds: shared.map(([hex, l]) => `${hex}: ${l.join(" + ")}`),
    pairs: ROOMS.length * OCCASIONS.length,
    thin,
  };
};

/* ── write ─────────────────────────────────────────────────────────── */

const write = (rel, body) => {
  const path = join(OUT, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
};

const copy = (from, to) => write(to, readFileSync(join(REPO, from), "utf8"));

rmSync(join(OUT, "games"), { recursive: true, force: true });

const index = [];
ALL_GAMES.forEach((game, i) => {
  const n = String(i + 1).padStart(2, "0");
  const file = `games/${n}-${game.slug}.md`;
  write(file, game.sourcing === "provided" ? providedPage(game) : recommendedPage(game));
  index.push({ n, file, game });
});

write("data/destination-palettes.css", paletteCss());
write(
  "data/games.json",
  JSON.stringify(
    ALL_GAMES.map((g) => ({
      slug: g.slug,
      name: g.name,
      shape: g.shape,
      sourcing: g.sourcing,
      durationMinutes: g.durationMinutes ?? null,
      durationMaxMinutes: g.durationMaxMinutes ?? null,
      minGuests: g.minGuests ?? null,
      maxGuests: g.maxGuests ?? null,
      description: g.description,
      howItWorks: g.howItWorks,
      materials: g.materials ?? null,
      scoring: g.scoring ?? null,
      currencyLabel: g.currencyLabel ?? null,
      externalName: g.externalName ?? null,
      externalUrl: g.externalUrl ?? null,
      caveat: g.caveat ?? null,
      printedMatter: g.printedMatter,
      supplies: g.supplies,
      requirements: g.requirements,
      rooms: g.worlds.filter((w) => w.native).map((w) => w.world),
      refusedRooms: g.worlds.filter((w) => w.forbidden).map((w) => w.world),
      occasions: OCCASIONS.filter((o) => playsAt(g, o)),
    })),
    null,
    2
  ) + "\n"
);
write(
  "data/rooms.json",
  JSON.stringify(
    ROOMS.map((key) => ({
      key,
      name: DESTINATIONS[key].name,
      tagline: DESTINATIONS[key].tagline,
      palette: DESTINATIONS[key].look.palette,
      paletteDark: DESTINATIONS[key].look.paletteDark,
      type: DESTINATIONS[key].look.type,
      games: ALL_GAMES.filter((g) => playsIn(g, key)).map((g) => g.slug),
    })),
    null,
    2
  ) + "\n"
);
write("data/measured.json", JSON.stringify(measure(), null, 2) + "\n");

copy("src/app/portal/occasions/[id]/games/[slug]/page.tsx", "source/game-page.tsx");
copy("src/app/portal/occasions/[id]/games/[slug]/game.module.css", "source/game.module.css");
copy("src/lib/games.ts", "source/games.ts");
copy("docs/copy-brief.md", "source/copy-brief.md");
copy("docs/games-need-a-human.md", "source/games-need-a-human.md");

write(
  "games/INDEX.md",
  "# The twenty-seven, in the order the catalogue holds them\n\n" +
    "| | game | kind | block | people | rooms |\n|---|---|---|---|---|---|\n" +
    index
      .map(({ n, file, game }) => {
        const rooms = game.worlds.filter((w) => w.native).map((w) => roomName(w.world));
        return (
          `| ${n} | [${game.name}](${file.replace("games/", "")}) | ` +
          `${game.sourcing === "provided" ? label(GAME_SHAPES, game.shape).toLowerCase() : "**recommended — no printed piece**"} | ` +
          `${game.durationMinutes ? `${game.durationMinutes}–${game.durationMaxMinutes}m` : "ambient"} | ` +
          `${game.minGuests ?? "any"}${game.maxGuests ? `–${game.maxGuests}` : "+"} | ` +
          `${rooms.length ? rooms.join(", ") : "every room"} |`
        );
      })
      .join("\n") +
    "\n"
);

const m = measure();
console.log(`design handoff → ${OUT}`);
console.log(`  ${m.games} games (${m.provided} provided, ${m.recommended} recommended)`);
console.log(`  ${m.rooms} rooms, ${m.distinctDayGrounds} distinct day grounds, ${m.distinctDarkGrounds} distinct dark grounds`);
for (const s of m.sharedDarkGrounds) console.log(`  SHARED DARK GROUND — ${s}`);
console.log(`  ${m.pairs - m.thin.length} of ${m.pairs} room x occasion pairs offer three or more games`);
for (const t of m.thin) console.log(`  BELOW THREE — ${t}`);
