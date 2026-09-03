-- Suburb-level geocode cache.
--
-- Opportunities are geocoded by locality, not per job: thousands of postings
-- share a few hundred suburbs, so caching on "suburb, state" turns a per-row
-- API cost into a per-locality one. Rows are keyed by the normalised value
-- produced by locationKey() in src/lib/geocode.ts — keep the two in step.
--
-- `status` records misses as well as hits, so an unresolvable location is asked
-- for once rather than retried on every ingestion run.
CREATE TABLE IF NOT EXISTS geocode_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query TEXT NOT NULL UNIQUE,
  latitude DECIMAL,
  longitude DECIMAL,
  status TEXT NOT NULL DEFAULT 'resolved' CHECK (status IN ('resolved', 'not_found')),
  provider TEXT NOT NULL DEFAULT 'seed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT geocode_cache_resolved_has_coords CHECK (
    status <> 'resolved' OR (latitude IS NOT NULL AND longitude IS NOT NULL)
  )
);

-- Only the ingestion job (service role) touches this. RLS on with no policies
-- means no anon or authenticated access at all, which is what we want: it is
-- infrastructure, not user data.
ALTER TABLE geocode_cache ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_timestamp_geocode_cache ON geocode_cache;
CREATE TRIGGER set_timestamp_geocode_cache
  BEFORE UPDATE ON geocode_cache
  FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Pre-warm the capitals and their state-qualified forms. These are stable
-- public coordinates, and seeding them means the map shows pins for the most
-- common Australian locations before any Geocoding API key is configured.
-- Both shapes are stored because locationKey() omits the state when a posting's
-- location string does not name one ("Sydney, Australia" yields just "sydney").
INSERT INTO geocode_cache (query, latitude, longitude, status, provider) VALUES
  ('sydney',            -33.8688, 151.2093, 'resolved', 'seed'),
  ('sydney, nsw',       -33.8688, 151.2093, 'resolved', 'seed'),
  ('melbourne',         -37.8136, 144.9631, 'resolved', 'seed'),
  ('melbourne, vic',    -37.8136, 144.9631, 'resolved', 'seed'),
  ('brisbane',          -27.4698, 153.0251, 'resolved', 'seed'),
  ('brisbane, qld',     -27.4698, 153.0251, 'resolved', 'seed'),
  ('perth',             -31.9523, 115.8613, 'resolved', 'seed'),
  ('perth, wa',         -31.9523, 115.8613, 'resolved', 'seed'),
  ('adelaide',          -34.9285, 138.6007, 'resolved', 'seed'),
  ('adelaide, sa',      -34.9285, 138.6007, 'resolved', 'seed'),
  ('canberra',          -35.2809, 149.1300, 'resolved', 'seed'),
  ('canberra, act',     -35.2809, 149.1300, 'resolved', 'seed'),
  ('hobart',            -42.8821, 147.3272, 'resolved', 'seed'),
  ('hobart, tas',       -42.8821, 147.3272, 'resolved', 'seed'),
  ('darwin',            -12.4634, 130.8456, 'resolved', 'seed'),
  ('darwin, nt',        -12.4634, 130.8456, 'resolved', 'seed'),
  ('newcastle',         -32.9283, 151.7817, 'resolved', 'seed'),
  ('newcastle, nsw',    -32.9283, 151.7817, 'resolved', 'seed'),
  ('wollongong',        -34.4278, 150.8931, 'resolved', 'seed'),
  ('wollongong, nsw',   -34.4278, 150.8931, 'resolved', 'seed'),
  ('gold coast',        -28.0167, 153.4000, 'resolved', 'seed'),
  ('gold coast, qld',   -28.0167, 153.4000, 'resolved', 'seed'),
  ('parramatta',        -33.8150, 151.0000, 'resolved', 'seed'),
  ('parramatta, nsw',   -33.8150, 151.0000, 'resolved', 'seed')
ON CONFLICT (query) DO NOTHING;
