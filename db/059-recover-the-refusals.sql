-- Revelle Société — RECOVER THE REFUSALS THE DELETE BUTTON THREW AWAY
--
-- Applied by scripts/migrate.mjs after 058, inside one transaction together
-- with its schema_migrations ledger row.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHAT HAPPENED
--
-- The founder reviewed hundreds of held take-home proposals at /desk/bank and
-- pressed No on the ones she did not want. The button that was live DELETED
-- the row and recorded nothing a seeder could read. seed-bank creates a row
-- whenever its slug is absent, from a document that still describes it — so
-- every one of those refusals was due to be undone by the next deploy, and an
-- afternoon of her judgement with it.
--
-- db/057 fixed the button. This recovers the afternoon.
--
-- ── WHY IT IS RECOVERABLE ────────────────────────────────────────────
--
-- The old action wrote the ledger BEFORE it deleted:
--
--     action:  'bank_item.deleted'
--     detail:  { "name": "<name>" }
--
-- The row is gone and the DECISION is not. That is the argument for recording
-- an action beside a mutation rather than trusting the mutation to be its own
-- record, and the payoff arrived four days after the discipline did.
--
-- ── HOW THE SLUG COMES BACK, AND WHERE IT CANNOT ─────────────────────
--
-- refused_row keys on slug; the ledger kept only the name. The mapping below
-- comes from `node scripts/seed-bank.mjs --dry-run`, which prints the slug the
-- seeder ITSELF derives — not a reimplementation of `slugify` here, which
-- would be a second owner of the rule and would drift (rule 21).
--
-- TWO NAMES ARE AMBIGUOUS AND ARE DELIBERATELY ABSENT: 'the song sheet', 'the swizzle stick'.
-- Each exists in two rooms, so a join on name cannot tell which one she
-- refused, and refusing the wrong room's object silently is worse than
-- refusing neither. They are named in the notice below so she can settle them
-- with two clicks rather than wonder.
--
-- A first version of this file claimed 179 pairs and no ambiguity at all. The
-- extraction behind it had used `sed` with `\t` in the replacement, which BSD
-- sed writes as a literal 't' — so the mapping was empty, the duplicate check
-- ran over nothing, and it reported a clean result with confidence. Rule 24:
-- count what it matched.

create temporary table recovered_map (slug citext, name text) on commit drop;

insert into recovered_map (slug, name) values
    ('1959', 'GAMES: none — the band, the window, and the dancing are the shelf.'),
    ('1961', 'GAMES: none, on purpose.'),
    ('ARTIFACT', 'one guest gets it — 8'),
    ('FOUNDER-PENDING', 'Aspen: shot-ski ships or glances. (docs/atmosphere-idea-bank-v1.md, FOUNDER-PENDING LEDGER 8.)'),
    ('GUEST', 'scales with the dinner — 11'),
    ('KIT', 'tombolone board, wooden tokens in cloth bag, printed cartelle, Smorfia translation sheet, sack of dried beans as markers, FIVE wrapped prizes in ascending tiers". A board, tokens, cards, markers and prizes. The room''s gesture is somebody CALLING it.'),
    ('NULL', 'the founder has not decided'),
    ('acapulco-1959-the-coaster-she-wrote-on', 'the coaster she wrote on'),
    ('acapulco-1959-the-last-song-card', 'the last-song card'),
    ('acapulco-1959-the-loud-cork-as-punctuation', 'the loud cork as punctuation'),
    ('acapulco-1959-the-request-slip', 'the request slip'),
    ('acapulco-1959-the-wire-cage-kept', 'the wire cage, kept'),
    ('act"', 'no row carries it [Nantucket — KILLED, in the document]'),
    ('amalfi-1953-arrivals-applauded', 'arrivals applauded'),
    ('amalfi-1953-the-closer-s-card', 'the closer''s card'),
    ('amalfi-1953-the-painted-tile', 'the painted tile'),
    ('amalfi-1953-the-rosolio', 'the rosolio'),
    ('amalfi-1953-the-santino', 'the santino'),
    ('amalfi-1953-the-smorfia-slip', 'the Smorfia slip'),
    ('amalfi-1953-the-ticket-up', 'the ticket up'),
    ('aspen-1994-shot-ski', 'shot-ski'),
    ('aspen-1994-the-ballot', 'the ballot'),
    ('aspen-1994-the-bottle-cap', 'the bottle cap'),
    ('aspen-1994-the-carabiner', 'the carabiner'),
    ('aspen-1994-the-doubles', 'the doubles'),
    ('aspen-1994-the-dub', 'the dub'),
    ('aspen-1994-the-film-canister', 'the film canister'),
    ('aspen-1994-the-koozie', 'the koozie'),
    ('aspen-1994-the-lift-ticket', 'the lift ticket'),
    ('aspen-1994-the-photocopied-playlist', 'the photocopied playlist'),
    ('aspen-1994-the-shot-glass', 'the shot glass'),
    ('aspen-1994-the-socks', 'the socks'),
    ('aspen-1994-the-sticker', 'the sticker'),
    ('aspen-1994-the-tape-flag', 'the tape flag'),
    ('aspen-1994-the-trail-map', 'the trail map'),
    ('aspen-1994-the-trophy', 'the trophy'),
    ('aspen-1994-the-zinc', 'the zinc'),
    ('big-sur-a-redwood-cone', 'a redwood cone'),
    ('big-sur-bay-leaves-a-handful', 'bay leaves, a handful'),
    ('big-sur-reading-aloud', 'reading aloud'),
    ('big-sur-the-abalone-shell', 'the abalone shell'),
    ('big-sur-the-bandana', 'the bandana'),
    ('big-sur-the-creek-stone', 'the creek stone'),
    ('big-sur-the-hand-thrown-cup', 'the hand-thrown cup'),
    ('big-sur-the-map-with-the-pull-off-marked', 'the map with the pull-off marked'),
    ('big-sur-the-poured-candle', 'the poured candle'),
    ('big-sur-what-was-played-in-order', 'what was played, in order'),
    ('brief"', 'no row carries it [catalogue-wide, NEW CONTENT CLASSES]'),
    ('catskills-the-boondoggle-keychain', 'the boondoggle keychain'),
    ('catskills-the-enamel-mug', 'the enamel mug'),
    ('catskills-the-final-standings', 'the final standings'),
    ('catskills-the-last-day-sheet', 'the last-day sheet'),
    ('catskills-the-luggage-decal', 'the luggage decal'),
    ('catskills-the-manila-trunk-tag', 'the manila trunk tag'),
    ('catskills-the-patch', 'the patch'),
    ('catskills-the-pencil', 'the pencil'),
    ('catskills-the-pennant', 'the pennant'),
    ('catskills-the-postcard-mailed-monday', 'the postcard, mailed Monday'),
    ('catskills-the-ribbon', 'the ribbon'),
    ('catskills-the-rock-place-setting', 'the rock place setting'),
    ('catskills-the-soap-on-a-rope', 'the soap-on-a-rope'),
    ('catskills-the-swim-check-tag', 'the swim-check tag'),
    ('catskills-the-team-bandana', 'the team bandana'),
    ('catskills-the-whistle', 'the whistle'),
    ('catskills-the-wooden-nickel', 'the wooden nickel'),
    ('cote-dazur-the-come-up-card', 'the come-up card'),
    ('cote-dazur-the-cork-with-the-hour-on-it', 'the cork with the hour on it'),
    ('cote-dazur-the-crock', 'the crock'),
    ('cote-dazur-the-labels-off-the-bottles', 'the labels off the bottles'),
    ('cote-dazur-the-loose-dried-aromatic', 'the loose dried aromatic'),
    ('cote-dazur-the-louche-card', 'the louche card'),
    ('cote-dazur-the-marc-small', 'the marc, small'),
    ('cote-dazur-the-melon-seeds', 'the melon seeds'),
    ('cote-dazur-the-mismatched-teaspoon', 'the mismatched teaspoon'),
    ('cote-dazur-the-savon-de-marseille', 'the savon de Marseille'),
    ('cote-dazur-the-short-glass', 'the short glass'),
    ('docs/atmosphere-idea-bank-v1.md', 'ASPEN, 1994, GAMES:'),
    ('dolomites-the-felt-square-under-the-glass', 'the felt square under the glass'),
    ('dolomites-the-forty-days-in-an-envelope', 'the forty days, in an envelope'),
    ('dolomites-the-genepi-in-a-small-bottle-dated', 'the genepì, in a small bottle, dated'),
    ('dolomites-the-peg-with-your-name-on-it', 'the peg with your name on it'),
    ('havana-the-second-supper-wrapped-for-the-walk', 'the second supper, wrapped, for the walk'),
    ('havana-the-small-glass-kept', 'the small glass, kept'),
    ('havana-the-song-somebody-named-for-you', 'the song somebody named for you'),
    ('las-vegas-tableside-caesar-or-flaming-dessert', 'tableside Caesar OR flaming dessert'),
    ('las-vegas-the-chip-you-did-not-spend', 'the chip you did not spend'),
    ('las-vegas-the-iou-for-the-late-supper', 'the IOU for the late supper'),
    ('las-vegas-the-number-off-the-door', 'the number off the door'),
    ('las-vegas-the-photograph-somebody-else-took', 'the photograph somebody else took'),
    ('las-vegas-the-stake-signed', 'the stake, signed'),
    ('nantucket-the-bands', 'the bands'),
    ('nantucket-the-beach-plum-jelly', 'the beach plum jelly'),
    ('nantucket-the-chowder-card', 'the chowder card'),
    ('nantucket-the-ferry-stub', 'the ferry stub'),
    ('nantucket-the-jar-with-a-stem-in-it', 'the jar with a stem in it'),
    ('nantucket-the-knife-you-learned-on', 'the knife you learned on'),
    ('nantucket-the-pick', 'the pick'),
    ('nantucket-the-right-way', 'the right way'),
    ('nantucket-the-rose-hip', 'the rose hip'),
    ('nantucket-the-shell-out-of-the-bucket', 'the shell out of the bucket'),
    ('nantucket-the-week-s-tide-chart', 'the week''s tide chart'),
    ('new-orleans-the-bitters-in-a-bottle-small-enough-to-pocket', 'the bitters, in a bottle small enough to pocket'),
    ('new-orleans-the-card-that-came-up-for-you', 'the card that came up for you'),
    ('new-orleans-the-roux-written-out', 'the roux, written out'),
    ('new-orleans-the-saint-s-card-out-of-a-wallet', 'the saint''s card out of a wallet'),
    ('new-orleans-the-token-for-the-ride-nobody-takes', 'the token for the ride nobody takes'),
    ('new-orleans-your-story-in-somebody-else-s-hand', 'your story in somebody else''s hand'),
    ('new-york-the-buttonhole', 'the buttonhole'),
    ('new-york-the-card-for-the-thing-you-watched-somebody-do', 'the card for the thing you watched somebody do'),
    ('new-york-the-cloakroom-check', 'the cloakroom check'),
    ('new-york-the-cork-dated', 'the cork, dated'),
    ('new-york-the-message-taken-for-you-at-the-door', 'the message taken for you at the door'),
    ('new-york-the-paper-hat', 'the paper hat'),
    ('new-york-the-plan-of-the-table', 'the plan of the table'),
    ('new-york-the-twist-of-sugared-almonds', 'the twist of sugared almonds'),
    ('no', 'pasta board, flour scoop for the lesson.'),
    ('noes', 'the finished leis, and whether a technique card should'),
    ('oaxaca-1954-papel-picado', 'papel picado'),
    ('oaxaca-1954-the-chocolate-tablet', 'the chocolate tablet'),
    ('oaxaca-1954-the-conquian-tally', 'the Conquian tally'),
    ('oaxaca-1954-the-jar-sent-home', 'the jar sent home'),
    ('oaxaca-1954-the-jicara', 'the jícara'),
    ('oaxaca-1954-the-piloncillo-and-canela', 'the piloncillo and canela'),
    ('oaxaca-1954-the-recipe-in-the-house-s-hand', 'the recipe in the house''s hand'),
    ('oaxaca-1954-the-servilleta', 'the servilleta'),
    ('oaxaca-1954-the-string-of-chiles', 'the string of chiles'),
    ('oaxaca-1954-the-twist-of-worm-salt', 'the twist of worm salt'),
    ('palm-springs-1965-the-cocoa-butter-tin', 'the cocoa butter tin'),
    ('palm-springs-1965-the-crate-label', 'the crate label'),
    ('palm-springs-1965-the-cutting', 'the cutting'),
    ('palm-springs-1965-the-drink-flag', 'the drink flag'),
    ('palm-springs-1965-the-lucite-tag', 'the Lucite tag'),
    ('palm-springs-1965-the-pool-rules-card', 'the pool-rules card'),
    ('palm-springs-1965-the-sack-of-dates', 'the sack of dates'),
    ('palm-springs-1965-the-signed-napkin', 'the signed napkin'),
    ('palm-springs-1965-the-sunglasses', 'the sunglasses'),
    ('palm-springs-1965-the-towel-tag', 'the towel tag'),
    ('portofino-breakfast-in-wax-paper', 'breakfast, in wax paper'),
    ('portofino-the-bar-token', 'the bar token'),
    ('portofino-the-between-us-card', 'the between-us card'),
    ('portofino-the-boat-count-card', 'the boat count card'),
    ('portofino-the-mortar-pesto-in-a-jar', 'the mortar pesto, in a jar'),
    ('portofino-the-off-season-timetable', 'the off-season timetable'),
    ('portofino-the-olive-wood-spoon', 'the olive-wood spoon'),
    ('portofino-the-order-leaf', 'the order leaf'),
    ('portofino-the-phrases', 'the phrases'),
    ('portofino-the-room-s-key-tag', 'the room''s key tag'),
    ('portofino-the-stoneware-beaker', 'the stoneware beaker'),
    ('portofino-the-tin-from-the-good-place', 'the tin from the good place'),
    ('portofino-the-trofie-you-rolled', 'the trofie you rolled'),
    ('portofino-the-whole-schedule', 'the whole schedule'),
    ('scoresheet"', 'no row carries it [Nantucket — the ASCII-hyphen spelling of the same kill]'),
    ('sheet"', 'no row carries it [Côte d''Azur — take-home sheet]'),
    ('shot-ski', 'FOUNDER CALL: ships or owned-if-present (vintage ski with mounted glasses; hangs on the wall between parties)'),
    ('st-moritz-1984-the-backgammon-column', 'the backgammon column'),
    ('st-moritz-1984-the-black-and-white-matchbox', 'the black-and-white matchbox'),
    ('st-moritz-1984-the-caviar-tin', 'the caviar tin'),
    ('st-moritz-1984-the-champagne-swizzle', 'the champagne swizzle'),
    ('st-moritz-1984-the-dance-card', 'the dance card'),
    ('st-moritz-1984-the-doubling-cube', 'the doubling cube'),
    ('st-moritz-1984-the-grand-marnier-miniature', 'the Grand Marnier miniature'),
    ('st-moritz-1984-the-mother-of-pearl-spoon', 'the mother-of-pearl spoon'),
    ('st-moritz-1984-the-pocket-torch', 'the pocket torch'),
    ('st-moritz-1984-the-seating-plan', 'the seating plan'),
    ('st-moritz-1984-the-timetable-card', 'the timetable card'),
    ('st-moritz-1984-the-wire-cage', 'the wire cage'),
    ('tahiti-the-black-sand', 'the black sand'),
    ('tahiti-the-cord', 'the cord'),
    ('tahiti-the-pearl-shell-disc', 'the pearl-shell disc'),
    ('tahiti-the-pearl-shell-lure', 'the pearl-shell lure'),
    ('tahiti-the-plaited-square', 'the plaited square'),
    ('tahiti-the-shells-you-strung', 'the shells you strung'),
    ('tahiti-the-sky-for-that-night', 'the sky for that night'),
    ('tahiti-the-small-monoi', 'the small monoï'),
    ('tahiti-the-tamanu-nut', 'the tamanu nut'),
    ('tahiti-the-vanilla-bean', 'the vanilla bean'),
    ('tahiti-what-came-in-written-down', 'what came in, written down'),
    ('tuberose', 'one stem at each place (Acapulco''s white flower; NY keeps gardenia/calla in chrome)'),
    ('westhampton-1976-the-cloth-off-the-line', 'the cloth off the line'),
    ('westhampton-1976-the-day-s-bulletin', 'the day''s bulletin'),
    ('westhampton-1976-the-forty-five-picked-for-you', 'the forty-five picked for you'),
    ('westhampton-1976-the-glasses-that-do-not-match', 'the glasses that do not match'),
    ('westhampton-1976-the-napkins-nobody-folded', 'the napkins nobody folded'),
    ('westhampton-1976-the-one-platter', 'the one platter'),
    ('westhampton-1976-the-pampas-plume', 'the pampas plume'),
    ('westhampton-1976-the-paperback-nobody-asks-about', 'the paperback nobody asks about'),
    ('westhampton-1976-the-polaroid-you-are-in', 'the Polaroid you are in'),
    ('westhampton-1976-the-rule-about-the-record-player-on-a-card', 'the rule about the record player, on a card'),
    ('westhampton-1976-the-score-sealed', 'the score, sealed'),
    ('westhampton-1976-the-sunglasses-out-of-the-bowl', 'the sunglasses out of the bowl'),
    ('westhampton-1976-the-tag-off-the-car-keys', 'the tag off the car keys');

do $$
declare n_actions integer; n_recovered integer; n_unmatched integer;
begin
  select count(*) into n_actions
    from staff_action where action = 'bank_item.deleted';

  insert into refused_row (entity_table, slug, refused_by, name_at_refusal, reason)
  select 'bank_item', m.slug, coalesce(s.email, 'unknown'), m.name,
         'Recovered by db/059 — refused at the desk before the No button kept '
         'a record. The ledger kept the decision; this restores it.'
    from staff_action a
    join recovered_map m on m.name = a.detail ->> 'name'
    left join staff s on s.id = a.staff_id
   where a.action = 'bank_item.deleted'
  on conflict (entity_table, slug) do nothing;

  get diagnostics n_recovered = row_count;

  select count(*) into n_unmatched
    from staff_action a
    left join recovered_map m on m.name = a.detail ->> 'name'
   where a.action = 'bank_item.deleted' and m.slug is null;

  raise notice '[059] % deletions in the ledger, % refusals restored, % not matched',
    n_actions, n_recovered, n_unmatched;

  -- NOT an exception. An unmatched name is either one of the two ambiguous
  -- ones or an item the document no longer carries; neither needs protecting
  -- and neither should stop a deploy. Said out loud so the number is read
  -- rather than inferred from silence (rule 23).
  if n_unmatched > 0 then
    raise notice '[059] unmatched are the two ambiguous names ('the song sheet', 'the swizzle stick') or items the document has since lost';
  end if;
end $$;
