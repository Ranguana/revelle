-- ── 034 · TAHITI'S GESTURE ───────────────────────────────────────────
--
-- THE CONCH AT DUSK.
--
-- Locked in the bench work and absent from atmosphere-idea-bank-v1.md, which is
-- a v1 TRANSCRIPTION GAP rather than an open question. seed-bank found no
-- GESTURE line for this room and refused to infer one — the right refusal, and
-- the reason the gap was visible at all rather than filled with a guess.
--
-- Every other room's gesture came from the bank document. This one is written
-- here because the document is wrong and a seeder should not be taught to
-- correct its own source.

update world
   set gesture = 'The conch at dusk.',
       gesture_note =
         'From the bench record, not from atmosphere-idea-bank-v1.md, which has '
         'no GESTURE line for this room. The bank document is a v1 with a '
         'transcription gap; if it is ever re-cut, the line belongs in it.'
 where slug = 'tahiti'
   and gesture is null;

do $$
declare v_g text;
begin
  select gesture into v_g from world where slug = 'tahiti';
  if v_g is null then
    raise notice '[034] tahiti has no world row yet — the gesture will need '
      'setting once seed-bank has run';
  else
    raise notice '[034] tahiti gesture: %', v_g;
  end if;
end $$;
