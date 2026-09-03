-- Make the ingestion upsert possible at all.
--
-- job_opportunities_source_external_unique was a PARTIAL unique index
-- (WHERE job_source_id IS NOT NULL AND external_job_id IS NOT NULL). Postgres
-- will not infer a partial index from `ON CONFLICT (job_source_id,
-- external_job_id)`, so the cron's
--
--   .upsert(jobs, { onConflict: "job_source_id,external_job_id" })
--
-- failed with 42P10: "there is no unique or exclusion constraint matching the
-- ON CONFLICT specification" on every run. Nothing could ever be ingested.
--
-- The predicate was redundant: both columns are nullable, and a plain unique
-- index already treats NULLs as distinct, so rows missing either value are
-- never duplicates either way. Dropping the predicate keeps the same guarantee
-- and makes the index usable for conflict inference.
DROP INDEX IF EXISTS job_opportunities_source_external_unique;

CREATE UNIQUE INDEX IF NOT EXISTS job_opportunities_source_external_unique
  ON job_opportunities(job_source_id, external_job_id);
