-- ============================================================================
-- Friend2Friend — seed data (badge catalog + starter interests)
-- Safe to re-run: all inserts are idempotent via ON CONFLICT.
-- Apply after 0001_init.sql.
-- ============================================================================

-- ── Badge catalog (from the prototype's data.jsx) ────────────────────────────
insert into public.badges (id, name, sub, glyph) values
  ('pioneer',   'Pioneer',          'Joined in the first month',    'flag'),
  ('connector', 'Connector',        'Made 25 connections',          'link'),
  ('explorer',  'Explorer',         'Matched across 5 interests',   'compass'),
  ('streak',    'On a Streak',      '7 days active',                'flame'),
  ('social',    'Social Butterfly', 'Start 10 chats',               'chat'),
  ('climber',   'Summit',           'Reach top 10 in an interest',  'mountain')
on conflict (id) do update
  set name = excluded.name, sub = excluded.sub, glyph = excluded.glyph;

-- ── Starter interest catalog (popular + niche) ───────────────────────────────
-- created_by is NULL = system-provided (not user-created).
insert into public.interests (name) values
  -- popular
  ('Skiing'), ('Hiking'), ('Crocheting'), ('Video Games'), ('Swimming'),
  ('Rock Climbing'), ('Photography'), ('Cooking'), ('Reading'), ('Pickleball'),
  ('Running'), ('Cycling'), ('Painting'), ('Surfing'), ('Yoga'),
  ('Coffee'), ('Board Games'), ('Concerts'),
  -- niche
  ('Origami'), ('Birdwatching'), ('Pottery'), ('Fermented Foods'), ('Tailoring'),
  ('Bouldering'), ('Astrophotography'), ('Calligraphy'), ('Mycology'), ('Disc Golf'),
  ('Beekeeping'), ('Linocut Printing'), ('Urban Foraging'), ('Latte Art'), ('Kendama'),
  ('Tide Pooling'), ('Cold Plunging'), ('Vinyl Collecting'), ('Bonsai'), ('Geocaching')
on conflict (name_norm) do nothing;
