-- Revelle Société — THE ELEVEN TONES THE DATABASE NEVER LEARNED
--
-- Applied by scripts/migrate.mjs after 050, inside one transaction together
-- with its schema_migrations ledger row.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE HOLE THIS CLOSES
--
-- `seed:destinations` failed the deploy of 2d89c89 with:
--
--     acapulco-1959 is tagged with tones that are not in the vocabulary:
--     toasts_everything, bigger_every_telling. Has db/007 been applied?
--
-- It had. What had not happened is that ELEVEN tones were authored in
-- src/lib/voice.ts — labelled, weighted, drawn, and claimed by rooms — and
-- never added to the facet vocabulary the database keeps. Nine were promoted
-- on 2026-08-29 with the last five rooms; two (toasts_everything,
-- bigger_every_telling) had been promoted on 2026-08-27 and were already
-- claimed by wired rooms, so this was live before tonight and simply never
-- ran: the seeder that would have caught it had never been on the service.
-- See render.yaml.
--
-- ── WHY A TONE IS THREE INSERTS AND NOT ONE ──────────────────────────
--
-- The pattern is db/016's, which added `good_natured` the same way, and its
-- reasoning is the rule: a facet row alone makes a tone a destination can be
-- tagged with and a host can never tap — "she can tap it, it is stored, and
-- it means nothing to the rest of the system", inverted. So each tone gets
--
--   facet              it exists
--   quiz_option_facet  a host can tap it
--   voice_tone_facet   it RESOLVES to the voice axes, and therefore scores
--
-- ── THE TWO THAT ARE DELIBERATELY NOT HERE ───────────────────────────
--
-- `never_impressed` and `always_next_sunday` are marked draft in voice.ts:
-- undrawn, and claimed by no registered room. A tone in the vocabulary is a
-- tile a host is shown, so admitting one nothing can match would put a tile
-- on the quiz that scores against nothing — rule 15, the instrument that
-- grades without pruning. They arrive when a room claims them and the art is
-- cut, not before.
--
-- WEIGHTS ARE COPIED VERBATIM FROM src/lib/voice.ts, where they were
-- authored. Nothing here is invented. Same rule db/016 states.

insert into facet (dimension_code, code, label, description, provenance) values
  ('voice_tone', 'bigger_every_telling', 'The story gets worse each time and everybody allows it', '', 'quiz'),
  ('voice_tone', 'closes_the_bar', 'The night has never once beaten them', '', 'quiz'),
  ('voice_tone', 'eat_before_you_speak', 'Eat first. Whatever it is will keep', '', 'quiz'),
  ('voice_tone', 'feeds_you_first', 'A plate reaches you before anybody asks your name', '', 'quiz'),
  ('voice_tone', 'finishes_your_sentences', 'Everybody talks over everybody, and it is affection', '', 'quiz'),
  ('voice_tone', 'fluent_in_everyone', 'They know everybody''s story before you finish it', '', 'quiz'),
  ('voice_tone', 'marvels_out_loud', 'Says a thing is beautiful, out loud, and means it', '', 'quiz'),
  ('voice_tone', 'shows_you_things', 'Takes your elbow and turns you toward something', '', 'quiz'),
  ('voice_tone', 'the_same_stories', 'The same stories, told again, corrected the same way', '', 'quiz'),
  ('voice_tone', 'toasts_everything', 'Any excuse at all, and the glass goes up', '', 'quiz'),
  ('voice_tone', 'up_early_anyway', 'However late it went, they are up and out in the morning', '', 'quiz')
on conflict (dimension_code, code) do nothing;

insert into quiz_option_facet (quiz_field, option_code, facet_id, answer_polarity)
select 'voice_tones', f.code, f.id, 'positive'
  from facet f
 where f.dimension_code = 'voice_tone'
   and f.code in ('bigger_every_telling', 'closes_the_bar', 'eat_before_you_speak', 'feeds_you_first', 'finishes_your_sentences', 'fluent_in_everyone', 'marvels_out_loud', 'shows_you_things', 'the_same_stories', 'toasts_everything', 'up_early_anyway')
on conflict do nothing;

insert into voice_tone_facet (tone_facet_id, voice_facet_id, weight)
select t.id, v.id, m.weight
  from (values
         ('bigger_every_telling', 'irreverence', 0.8),
         ('bigger_every_telling', 'humour_warm', 0.4),
         ('bigger_every_telling', 'theatricality', 0.35),
         ('bigger_every_telling', 'earnestness', -0.6),
         ('closes_the_bar', 'volume', 0.7),
         ('closes_the_bar', 'cadence_unhurried', -0.7),
         ('closes_the_bar', 'irreverence', 0.3),
         ('eat_before_you_speak', 'cadence_unhurried', 0.9),
         ('eat_before_you_speak', 'earnestness', 0.6),
         ('eat_before_you_speak', 'warmth', 0.5),
         ('eat_before_you_speak', 'irreverence', -0.4),
         ('eat_before_you_speak', 'volume', -0.2),
         ('feeds_you_first', 'warmth', 0.9),
         ('feeds_you_first', 'earnestness', 0.7),
         ('feeds_you_first', 'cadence_unhurried', 0.5),
         ('feeds_you_first', 'formality_plain', 0.3),
         ('feeds_you_first', 'irreverence', -0.5),
         ('finishes_your_sentences', 'cadence_clipped', 0.8),
         ('finishes_your_sentences', 'volume', 0.7),
         ('finishes_your_sentences', 'warmth', 0.6),
         ('fluent_in_everyone', 'knowingness', 0.9),
         ('fluent_in_everyone', 'warmth', 0.3),
         ('fluent_in_everyone', 'formality_formal', 0.3),
         ('marvels_out_loud', 'earnestness', 1),
         ('marvels_out_loud', 'warmth', 0.8),
         ('marvels_out_loud', 'theatricality', 0.3),
         ('marvels_out_loud', 'knowingness', -0.7),
         ('shows_you_things', 'knowingness', -0.9),
         ('shows_you_things', 'warmth', 0.7),
         ('shows_you_things', 'earnestness', 0.6),
         ('shows_you_things', 'address_second_person', 0.5),
         ('shows_you_things', 'theatricality', 0.3),
         ('the_same_stories', 'cadence_unhurried', 0.8),
         ('the_same_stories', 'warmth', 0.6),
         ('the_same_stories', 'earnestness', 0.4),
         ('the_same_stories', 'knowingness', 0.35),
         ('the_same_stories', 'theatricality', -0.4),
         ('toasts_everything', 'earnestness', 0.9),
         ('toasts_everything', 'warmth', 0.8),
         ('toasts_everything', 'theatricality', 0.35),
         ('toasts_everything', 'irreverence', -0.3),
         ('up_early_anyway', 'precision', 0.8),
         ('up_early_anyway', 'earnestness', 0.7),
         ('up_early_anyway', 'cadence_unhurried', -0.4)
       ) as m(tone, facet, weight)
  join facet t on t.dimension_code = 'voice_tone' and t.code = m.tone
  join facet v on v.dimension_code = 'voice'      and v.code = m.facet
on conflict do nothing;

-- ── THE ASSERTION, BECAUSE BOTH JOINS ABOVE FAIL SILENTLY ────────────
--
-- voice_tone_facet is populated through an INNER JOIN against the `voice`
-- dimension. A weight naming an axis that does not exist inserts NOTHING and
-- raises NOTHING — the row is simply absent, and the tone then resolves to
-- less than it was authored to mean. That is the exact class of defect this
-- migration exists to repair, so it does not get to happen here unnoticed.
do $$
declare
  n_tones   integer;
  n_weights integer;
begin
  select count(*) into n_tones
    from facet
   where dimension_code = 'voice_tone'
     and code in ('bigger_every_telling', 'closes_the_bar', 'eat_before_you_speak', 'feeds_you_first', 'finishes_your_sentences', 'fluent_in_everyone', 'marvels_out_loud', 'shows_you_things', 'the_same_stories', 'toasts_everything', 'up_early_anyway');

  select count(*) into n_weights
    from voice_tone_facet vtf
    join facet t on t.id = vtf.tone_facet_id
   where t.dimension_code = 'voice_tone'
     and t.code in ('bigger_every_telling', 'closes_the_bar', 'eat_before_you_speak', 'feeds_you_first', 'finishes_your_sentences', 'fluent_in_everyone', 'marvels_out_loud', 'shows_you_things', 'the_same_stories', 'toasts_everything', 'up_early_anyway');

  if n_tones <> 11 then
    raise exception 'expected 11 tones, found %', n_tones;
  end if;
  if n_weights <> 44 then
    raise exception 'expected 44 tone->voice weights, found % — a weight names an axis that does not exist in the voice dimension', n_weights;
  end if;
end $$;
