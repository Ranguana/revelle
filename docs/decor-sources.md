# Decor sources — where the physical objects come from

Research pass run 2026-08-18. Produces `data/decor-candidates.json` (80 rows).
**Nothing has been written to any database and no seed script was run.** No
existing source file was modified.

---

## 1. What the schema actually is

The requester's brief assumed a table called `ingredient` with a `slots` column.
Neither exists. The real shape:

### `product` — db/002-taste-cohorts-and-facets.sql, line 533

| column | notes |
| --- | --- |
| `slug` | `citext`, unique, `^[a-z][a-z0-9-]*$` |
| `name` | text, not null |
| `description` | text, not null, defaults to `''` |
| `external_url` | nullable — "Revelle sends her to the source" |
| `image_url` | nullable |
| `price_band` | `price_band` enum, nullable |
| `price_cents` | integer, nullable, `>= 0` |
| `currency` | text, `^[A-Z]{3}$`, defaults `'USD'` |
| `supplier` | nullable text |
| `source_note` | nullable text — lead time, affiliate terms, "sells out every June" |
| `status` | `product_status`, defaults `'draft'` |

`price_band` legal values (`create type price_band`, db/002 line 172) are exactly
five: `under_25`, `from_25_to_75`, `from_75_to_200`, `from_200_to_500`,
`over_500`. There is a comment in the migration insisting this is NOT the same
thing as `budget_band` in db/001 — that one is for the whole event.

Both price columns are nullable on purpose: "a curator adds a thing she saw
before she has looked up the price." Seven rows in the JSON use that.

### Slots are a join, not a column

Slots live in `slot_kind(code)` and reach `product` through the ingredient-pool
pattern. `install_slot_eligibility('product')` (db/009, line 464 and called at
line 672) creates **`product_slot(product_id, slot_code, fit, note)`** where
`fit` is the `occasion_fit` enum defaulting to `'native'`. `scripts/seed-fixtures.mjs`
line 1345 calls `claimSlots("product_slot", "product_id", id, product.slots)`,
so `slot_code` strings are the interface.

Full `slot_kind` list, assembled from every migration that inserts into it
(db/009 line 126, db/010 line 552, db/012 line 323, db/017 line 531, db/022 line 341):

| code | label | section | what it means | pool that fills it |
| --- | --- | --- | --- | --- |
| `arrival_welcome` | The welcome | arrival | What is waiting when she walks in, on day one of something with more than one day. An evening does not have this. | **product** |
| `arrival_drink` | The first drink | arrival | What is in their hand before anyone has said hello properly. | **product** |
| `table_object` | The table | details | The object the table is built around. One thing, not a scheme. | **product** |
| `the_appetizer` | The first course | details | db/022, from the dish pool | dish |
| `the_main` | The main course | details | db/022, removed for a standing party | dish |
| `the_dessert` | The last course | details | db/022 | dish |
| `the_menu` | The menu | details | **retired** — db/022 line 513 deletes every `occasion_slot` row for it | (menu) |
| `the_drinks` | The drinks | details | One drinks programme, cocktails plus mocktail mirrors, chosen whole | drink |
| `day_material` | The day | details | Material for one day of a multi-day thing | game |
| `the_moment` | The moment | moment | The thing they retell. Staged, never announced. | **game** |
| `honouring` | The honouring | moment | How the person is marked. Birthdays/anniversaries/bridal have it, a getaway does not. | **game** |
| `game` | The fun | fun | A game or ritual matched to how these people behave | game |
| `ambient_game` | The undercurrent | fun | Runs under the whole evening, takes no time out of it | game |
| `soundtrack` | The soundtrack | soundtrack | One selection, sequenced | tracklist |
| `finale` | The ending | ending | How the night closes, on purpose | game |
| `edit_item` | The edit | edit | The short opinionated list of things to buy | **product** |
| `favour` | What they take home | edit | `per_guest = true` — counted from the TOP of her guest band | **product** |

**Correction to the brief.** It named `table_object`, `arrival_welcome`,
`the_moment` and `honouring` as the decor-relevant codes. `the_moment` and
`honouring` are **not** product slots. Every `occasion_slot` row for them
(db/009, line 738 onward) sets `pool = 'game'`, and the `honouring` row carries
the note "Required, and required to be a ritual rather than a purchase." Tagging
a charger `honouring` would be a claim the engine never reads.

The product-fillable codes, and the only ones used in the JSON, are
`arrival_welcome`, `arrival_drink`, `table_object`, `edit_item`, `favour`.
`favour` is unused here because it is `per_guest` — a favour needs a per-head
unit price and every rental line in this harvest is priced per piece per event,
which is a different arithmetic.

### Facets

`facet(dimension_code, code, …)`, tagged onto products through `product_facet`
(created by `install_facet_tags('product', 'The edit')`, db/002 line 576).
`scripts/seed-fixtures.mjs` writes them as `"dimension:code": weight`, so the
JSON's `facet_slugs` use the same `dimension:code` form.

**The database is unreachable from this machine by design** (`ipAllowList: []`
in `render.yaml`), so nothing here was validated against a live DB.

**Facet slugs were validated by parsing every `insert into facet (…) values …`
statement in `db/*.sql`.** The 22 distinct slugs emitted resolve as follows:

- 18 of them to **`db/002-taste-cohorts-and-facets.sql`** — all of
  `taste_direction:*`, `affinity:*`, `group_fun:*`, `environment:*`.
- `making:made_by_hand` to **`db/016-what-she-wants-in-this.sql`** (line 171).
- `season:spring` and `season:high_summer` to **`db/012-menus.sql`** (lines 140–146),
  not to db/002 — db/002 creates the `season` *dimension* and deliberately leaves
  it empty; db/012 fills it.
- The `taste_direction` codes cross-check against `TASTE_DIRECTIONS` in
  **`src/lib/quiz.ts`** (line 199 onward); db/002's own comment says its
  `description` values are copied verbatim from that file's `hint`s so that
  `scripts/check-facets.mjs` reports zero drift.

**db/023 and db/026 contributed nothing usable.** db/023 seeds no facets at all.
db/026 seeds the `meal_shape` and `event_timing` dimensions and its own notes say
of both: "Nothing is tagged in this dimension." They are constraints on her
answer, not tags on the catalogue, so no product row may carry them.

### Facets I could NOT find, and therefore did not emit

The whole aesthetic vocabulary a decor catalogue actually runs on has no home in
the seeded facet table. `palette`, `formality` and `mood` exist as *dimensions*
(db/002, positions 80–100) and are described there as "Empty by design" — the
argument being that the first curator who needs one inserts a row rather than
writing a migration. `mood` has since acquired exactly one member,
`mood:cooking_smell`. There is no `material` dimension at all.

So the following are **proposed new facets, not existing ones.** They are the
harvest from editorial (nouns and attributes only, no prose copied) plus the
material words that recur across all three catalogues. Emitting them as if they
existed would have been the failure mode the brief warned about:

- Proposed dimension **`material`** (does not exist): `rattan`, `raffia`,
  `woven_fibre`, `bamboo`, `wicker`, `mouth_blown_glass`, `murano_glass`,
  `crystal`, `majolica`, `terracotta`, `stoneware`, `silver_plate`, `sterling`,
  `brass`, `chrome`, `pewter`, `leather`, `shagreen`, `linen`, `capiz_shell`.
- Proposed additions to the existing-but-empty **`palette`**: `blue_and_white`,
  `tortoiseshell`, `gold_rim`, `smoke`, `emerald`, `cobalt`, `ivory_and_olive`,
  `terracotta_and_ochre`.
- Proposed additions to **`mood`** (which has one member today):
  `candlelight_only`, `nothing_matching`, `one_tall_thing`, `low_and_scattered`.
- Proposed form attributes with no obvious home: `scalloped_edge`, `hand_painted`,
  `monogrammed`, `cordless`, `one_of_a_kind`.

Vocabulary sources for the above: the Over The Moon tablescape and Thanksgiving
planning pieces (nouns extracted: rattan lanterns, basket lanterns, capiz shell
place cards, woven chargers, embroidered napkins, die-cut menus, gold flatware,
antique flatware, ginger jars, candle tapers, selvedge, blue floral dinnerware),
plus material words appearing in Casa de Perrin and Chairish listing titles.
No sentence from any of those pages was copied or paraphrased.

Those pieces also credit vendors by role — Heather Taylor Home for tablecloths,
Of The Flowers and Scarsella's Flowers and KD&J Botanica for florals, Host &
Haven for the reception build, L. Scott Events for planning, Li Ward for menus,
Bloomy for a bougainvillea installation. That is the sourcing-credit behaviour
the brief predicted, and it is the route to more rental houses when this
catalogue needs to grow past three.

---

## 2. The three sources

### Casa de Perrin — casadeperrin.com

**What it is.** A high-end tabletop **rental** house, Los Angeles, industry
accounts, organised exactly as the brief said: era- and design-coherent named
collections (Hudson, Optique, Bella, Cabana Scalloped, Gemma, Rattan Petal), each
with a fixed set of pieces.

**Good for.** Coherence. The unit of the catalogue is a *collection*, which is
the same unit `table_object` wants — "the object the table is built around. One
thing, not a scheme." A Revelle can take a whole collection and the table agrees
with itself for free. The sitemap is a clean flat index: 154 glassware URLs, 98
dinnerware, 82 chargers, 81 in new-collections, 70 linens, 56 flatware, 51 table
lamps, 36 serveware, 21 bowls, 17 coffee/tea, 16 salt cellars. Product pages
carry piece lists, capacities, dimensions and material language.

**Where it fails.**
1. **Prices are inconsistently published.** Glassware is reliably priced ($4.25
   or $4.50 per piece), as are flatware ($2.25), salt cellars ($1.95) and some
   chargers ($12.95). But **linens carry no price at all**, and several
   CDP-exclusive pieces render as `$0.00`, which is the page's way of saying
   "call us" — Cabana Scalloped and the Leather chargers both do this. 7 of my 17
   Casa de Perrin rows therefore have `price_cents: null`.
2. **They are rental rates per piece per event, not purchase prices.** A `$4.25`
   goblet lands in `under_25` and will sit in the same band as a $20 candle it
   has nothing in common with. Any budget arithmetic that mixes rental and retail
   rows is wrong. Flagged in `source_note` on every one of those rows.
3. **It is a Los Angeles rental house.** Delivery is a real-world constraint the
   `product` table has no column for. `source_note` is the only place to say so.
4. No era metadata. "Vintage Clear | Champagne Coupe" is the single listing that
   admits to being old.

**robots.txt.** Squarespace default. `anthropic-ai` and `ClaudeBot` are named,
but they are stacked in the same group as `User-agent: *` with no separate
`Disallow: /` — so they inherit the general rules. `/search`, `/config`,
`/account`, `/api/`, `/static/` and a set of query-string formats are disallowed;
product and category paths are not. **15 pages fetched, all outside the
disallowed set. No refusals.**

### Chairish — chairish.com

**What it is.** A vintage marketplace whose browse URLs are literally
`/collection/<category>/<attribute>` — `/collection/decorative-bowls/murano-glass`,
`/collection/coasters/art-deco`, `/collection/ice-buckets/mid-century-modern`,
`/collection/candle-holders/brass`, `/collection/baskets/wicker`. The brief's
premise is correct: era and provenance are real facets, and that is what turns
"portofino, 1961" into SKUs. The collections sitemap alone is 10,000 URLs.

**Good for.** Dated objects. Listing titles carry years — "1957 Ercole Barovier",
"Murano Glass Three-Section Bowl, 1960s", "Art Deco Chase … Designed by Lurelle
Guild 1933". That is provenance a destination-year can actually match on, and no
other source here has it.

**Where it fails.**
1. **Every row is a single object that will sell.** A `product` row pointing at a
   Chairish listing has a half-life. There is no `stock` column; `status` going
   to something other than `active` is the only lever, and somebody has to notice.
   This is the single biggest reason not to lean on Chairish for required slots.
2. **Collection pages render inconsistently.** Of seven collection pages
   requested, **two returned full product grids** (Murano decorative bowls,
   Art Deco coasters) and a further two returned grids on a later attempt
   (ceramic vessels and vases, cachepots). Three returned the landing copy and
   pagination with no product cards at all: `/collection/ice-buckets/mid-century-modern`
   (twice), `/collection/candle-holders/art-deco`, `/collection/baskets/wicker`,
   `/collection/table-lamps/murano-glass`, `/collection/trays/silver`,
   `/collection/carafes-and-decanters/mid-century-modern`. That is not a block —
   it is edge-cache variance — but it means coverage is luck-of-the-draw rather
   than a query you can rerun.
3. **`/search` is disallowed.** The brief's example of typing "Murano glass 1970s"
   into search is off the table. The `/collection/…/…` and `/keyword/…` paths do
   the same job and are allowed, which is why they were used instead.
4. Prices are negotiable — several listings show a markdown against an original.

**robots.txt.** Same stacked-group pattern; `ClaudeBot` and `anthropic-ai` share
the `*` rules. Disallowed: `/search`, `/saved-search`, `/account/`, `/cart`,
`/folder/`, `/purchase/`, `/product/data`, `/product/grid`, `/product/id/`,
`/product/list`, `/product/*/tear-sheet` and friends. Individual listings at
`/product/<numeric-id>/<slug>` are **not** disallowed. **Eight pages fetched
(seven collection, one product). `/search` was not touched.**

### Over The Moon — overthemoon.com

**What it is.** Both halves at once — a large Shopify storefront **and** the
party/wedding editorial the brief described. 172 product sitemaps and 1,360
collections, including a deep tabletop tree: `tabletop_glassware_champagne-flutes-and-coupes`,
`tabletop_place-settings-linens_candles_hurricanes`, `…_dinner-napkins`,
`…_menus-placecards`, `…_napkin-rings`, `tabletop_dinnerware_plates_chargers`,
`home_bar_ice-buckets`, `home_bar_bar-carts`, `tabletop_tabletop-decor`.
Brands stocked include Ginori 1735, Cabana, Christofle, AERIN, Baccarat, Match,
Juliska, Simon Pearce, Matouk, Estelle Colored Glass, Caskata, Bordallo Pinheiro.

**Good for.** Clean, complete facts. `/collections/<handle>/products.json` is the
store's own public feed and returns exact title, vendor, price, handle and image
URL — no scraping heuristics, no ambiguity, one request per collection instead of
one per product. This is the only source of the three where a row can be built
without judgement calls about what the page meant. It is also the only one whose
prices are **purchase** prices, so `price_band` means what the enum says.

**Where it fails.**
1. **No era.** It is a contemporary retailer. Nothing here is 1961; things here
   *read as* 1961. Era-anchoring for Over The Moon rows is editorial, always.
2. **It is bridal-first.** The catalogue skews to registry and wedding, which
   pulls toward white, crystal, monogram and formality. Nothing in it wants to be
   `catskills 1963` or `westhampton 1976`.
3. Editorial and shop are separate surfaces; the sourcing credits in the editorial
   name vendors the shop does not stock (Heather Taylor Home, Host & Haven), so
   the credits are a lead list, not a buy list.

**robots.txt.** Shopify, with an unusually explicit agent policy: `Allow: /` for
everything public, an `agents.md`, a UCP/MCP endpoint, and a plain-English
instruction that **checkout, payment and order placement must not be automated**.
Nothing here places an order. Disallowed and avoided: `/cart/`, `/checkout`,
`/account`, `/services`, `/sf_*`, `/cart.js`, `/recommendations/products`, and the
`sort_by` / multi-`filter` crawl traps. `/collections/<handle>/products.json` is
not disallowed. **Six collection feeds and two editorial posts fetched, 2s apart.
No refusals.**

### Sites not used

The overflow list (Maison Margaux, Social Studies, 1stDibs, Summerill & Bishop,
Ginori 1735 direct, Christofle direct, La DoubleJ Casa, Cabana Casa, Aerin,
Scully & Scully, Bergdorf Goodman home) was **not touched.** The three primaries
did not leave a target destination visibly short, and Ginori, Cabana, Christofle
and Aerin all appear in the harvest anyway via Over The Moon, with a price and a
buyable URL attached. Pinterest and Instagram were not targeted, per the brief.

---

## 3. Per-destination coverage

80 rows. Counts are rows carrying that destination in `destination_affinity`; a
row can serve more than one.

| destination | year | rows | verdict |
| --- | --- | --- | --- |
| portofino | 1961 | 28 | **Furnishable.** Murano-glass bowls with real 1950s–60s dates, Ginori and Cabana chargers, Italian linen napkins, majolica and Bitossi vases, mouth-blown glassware. The best-served destination by a distance. |
| cote-dazur | 1962 | 28 | **Furnishable.** Same Riviera spine as Portofino plus scalloped linen, lemon motifs, a cordless lamp, mesh food covers for an outdoor table. Portofino and Côte d'Azur are hard to tell apart from this harvest, which is a real problem — see below. |
| nantucket | 1972 | 17 | **Furnishable.** Simon Pearce hurricanes, blue-and-white porcelain, pinstripe and indigo linen, woven and pleated chargers, cabbage ware. |
| new-york | 1938 | 16 | **Furnishable.** Chairish's Art Deco coasters are genuinely 1920s–30s, and Baccarat, Christofle and Georg Jensen carry the rest. The one destination where dated stock and the intended year actually line up. |
| las-vegas | 1960 | 16 | **Furnishable.** Gold-rim and smoke glassware, shagreen and silver-plate ice buckets, vintage coupes. Reads supper-club rather than casino; nothing in these three sources does Vegas-as-Vegas. |
| big-sur | 1971 | 15 | **Thin but workable.** Studio ceramics, indigo linen, terracotta, natural fibres. Missing the wood, the fire and the outdoors entirely — none of these sources sells a slab table or a hearth. |
| havana | 1957 | 13 | **Thin.** Colour and rattan carry it; there is nothing period-Cuban, and the rows are borrowed tropical-maximal rather than sourced. Would need a Latin-American or Caribbean decorative-arts dealer. |
| catskills | 1963 | 10 | **Thin.** Cabbage ware and a candlestick. The Borscht-Belt resort register — Formica, glass ashtrays, novelty barware — is not stocked by a bridal shop or a Los Angeles rental house. Chairish has it (`/collection/ice-buckets/mid-century-modern` runs to 23 pages) but that page would not render. |
| new-orleans | 1956 | 8 | **Thin.** Leather, tortoiseshell, dark glass. Missing silver hollowware, absinthe, the whole Creole formality. Scully & Scully or a New Orleans antiques dealer would fix it. |
| dolomites | 1956 | 8 | **Thin.** Nordic and Alpine-adjacent ceramics only, and half of it is Scandinavian standing in for Alpine, which is not the same thing. Needs an Austrian/South Tyrolean source — loden, horn, pewter, enamel. |
| westhampton-1976 | 1976 | 8 | **Thin.** Coloured glass and a 1970s studio vase. The 1976 register — chrome, lucite, smoked mirror, bamboo — exists on Chairish under exactly those attribute URLs but none of the pages I tried rendered. Recoverable with a rerun. |
| tahiti | 1961 | 7 | **Thinnest.** Rattan, bamboo, a cooler. Everything Polynesian is absent; what is here is generic tropical. Would need a genuine tiki/Oceanic source, and honestly the risk of pastiche makes this one worth authoring by hand rather than sourcing. |

**The five unwritten destinations** — st-moritz 1984, aspen 1994, palm-springs 1965,
rio 1947, amalfi 1953 — carry **no** `destination_affinity` tags in the JSON. Two
rows would be obvious candidates (`otm-caravan-amalfi-ceramic-charger` for amalfi;
`otm-loulou-baker-palm-beach-playing-cards` for palm-springs), and both were left
untagged deliberately: a speculative tag against a world that does not exist in
`world` yet is a foreign key waiting to fail and a claim nobody can check.

**The honest structural problem: the four Riviera-adjacent destinations blur.**
Portofino 1961, Côte d'Azur 1962, and to a lesser extent Amalfi 1953 and Havana
1957, all pull the same taste facets and therefore the same objects. 28 of 80
rows serve both Portofino and Côte d'Azur. If the selection engine is meant to
make those two feel like different places, this catalogue will not do it, and no
amount of extra sourcing from tabletop retailers will — the differentiation has
to come from `world_facet` weights and from `product_world` affinity scores
(db/009's destination-scoping columns), not from finding more chargers.

---

## 4. Sourced versus inferred

**All 80 rows are `confidence: "sourced"`. Zero are `inferred`.** Nothing was
invented to hit a count, and no row was added that lacked a real name, supplier
and URL.

What "sourced" means here, precisely:

| what | how solid |
| --- | --- |
| name, supplier, external_url | Fact. Read off a page or feed retrieved 2026-08-18. |
| price_cents, price_band | Fact **as observed on that date**. Rental rates and retail prices both drift; Chairish sellers take offers; two coaster rows were already showing a markdown. 7 rows have no price because none was published. |
| image_url | Fact, and a **reference only** — see §5. |
| description | Written from the page's own material and dimension words, compressed. No sentence copied. |
| era_tags | **Fact only for Chairish** (dates are in the listing titles). For Casa de Perrin and Over The Moon it is empty or an editorial read of period signal — `cdp-palm-gold-linen` carries `1930s` solely because the page itself calls the pattern deco-era. |
| destination_affinity | **Editorial judgement on every row without exception.** No source says "this is Portofino 1961." |
| facet_slugs | **Editorial judgement**, drawn from a validated vocabulary. The slug is guaranteed to exist; the claim that this object *is* `old_world_riviera` is mine. |
| slot_code | **Editorial judgement**, constrained to the five product-fillable codes. |

Split by source: 17 Casa de Perrin (every URL fetched individually), 23 Chairish,
40 Over The Moon.

One caveat that matters. Of the 23 Chairish rows, **one** —
`chairish-murano-three-section-bowl-1960s` — had its own product page fetched
directly. The other 22 have title, price and URL read off a collection index page
that *was* fetched. Nothing is invented, but the per-listing detail (condition,
seller, dimensions) was not verified for those 22, and any one of them may have
sold since. `source_note` says so on each.

The row count exceeds the brief's 30–60 target. That was not padding: the Over
The Moon feed returns 30 complete records per request, so the marginal cost of a
real row was zero once the request was made. Every row over 60 is as sourced as
every row under it. If a shorter list is wanted, cut by destination, not by
confidence.

---

## 5. Image licensing — flag, not resolved

`product.image_url` **exists in the schema** (db/002, line 543, sitting directly
under `external_url`). That is the whole point of raising this: displaying a
supplier's photograph on a Revelle surface is not a hypothetical, it is a column
somebody is going to populate and a template somebody is going to render.

Every `image_url` in the JSON is a **URL reference to an image hosted on the
supplier's own CDN** — `images.squarespace-cdn.com` for Casa de Perrin,
`chairish-prod.freetls.fastly.net` for Chairish, `cdn.shopify.com` for Over The
Moon. **No image was downloaded, copied, cached or embedded.**

Hotlinking those URLs into a Revelle page is a live question on at least four
fronts, and I am flagging all four rather than answering any:

1. **Copyright.** The photographs belong to the supplier or their photographer.
   Nothing about a public URL grants a display licence.
2. **Trade-mark and passing off.** Rendering Christofle's and Ginori's product
   photography inside a Revelle deliverable implies a relationship that does not
   exist.
3. **Terms of service.** Casa de Perrin has a `/terms-of-service` page that was
   not read as part of this pass. Chairish's and Shopify's terms likewise.
4. **Operational.** Hotlinked CDN URLs rot, and Shopify CDN URLs carry a `?v=`
   cache-buster that changes when the merchant re-uploads.

The realistic resolutions — affiliate or partner programmes that grant image
rights, commissioning photography, or shipping text-only product cards that link
out — are a decision for Jessica, not for this research pass.

---

## 6. Access and refusals — the honest list

| domain | robots.txt checked | outcome |
| --- | --- | --- |
| casadeperrin.com | yes | Permissive for product paths. 15 pages fetched. No refusal. |
| chairish.com | yes | Permissive for `/collection/` and `/product/<id>/<slug>`. **`/search` and `/saved-search` are disallowed and were not touched** — this cost the brief's own "Murano glass 1970s" search example, replaced by the `/collection/<cat>/<attr>` paths. 8 pages fetched. |
| overthemoon.com | yes | Permissive, with an explicit no-automated-checkout instruction that was honoured. 6 collection feeds + 2 editorial posts fetched. No refusal. |
| pinterest.com, instagram.com | not fetched | Excluded by the brief. |
| Maison Margaux, Social Studies, 1stDibs, Summerill & Bishop, Ginori, Christofle, La DoubleJ, Cabana, Aerin, Scully & Scully, Bergdorf | not fetched | Not needed. Kept as the named next step for the thin destinations in §3. |

**No site refused a request. No 403, no CAPTCHA, no login wall.** The only
technical failure was Chairish collection pages returning landing copy without a
product grid on roughly half of attempts, which is cache variance rather than a
block, and is listed page-by-page in §2.

Total requests across all three domains: 29 page fetches plus 4 sitemap/robots
reads. That is sampling to prove the sources are usable, not a crawl.

---

## 7. What to do next, in order

1. **Decide the image question (§5) before anything renders `image_url`.**
2. **Do not import Chairish rows into a required slot.** One-of-a-kind stock
   belongs in `edit_item`, which is optional (`min_count 1, max_count 3, required
   false` in every occasion), never in `table_object`, which is required for four
   of the nine occasions.
3. **Propose the `material` dimension and fill `palette`.** Twenty-odd material
   words are doing real discriminating work in this data and have nowhere to
   live. db/002 explicitly designed for this: "add rows, not migrations."
4. **Separate rental from retail before any budget arithmetic.** Casa de Perrin
   rows are per-piece-per-event; a `price_cents` that means two different things
   in one column is the kind of thing db/002 spends paragraphs refusing to do
   elsewhere.
5. **Rerun the Chairish collection pages that did not render** — mid-century ice
   buckets, art-deco candle holders, wicker baskets, silver trays, Murano lamps.
   That is where catskills, westhampton-1976 and new-orleans get rescued.
6. **For dolomites, tahiti and havana, these three sources are the wrong shop.**
   They need regional dealers, and Tahiti probably needs authoring rather than
   sourcing.
