-- A single approved job source, so the ingestion pipeline can be proven end to
-- end before committing to a real source list.
--
-- Stripe's Greenhouse board was chosen because it is public, unauthenticated,
-- served by the exact endpoint assertAllowedSourceUrl() permits, and carries
-- genuine Sydney roles — which is what lets the Employer Map show a real pin.
--
-- `applications_permitted` stays false: postings ingest with
-- application_mode 'url', so applicants are sent to the employer's own site
-- rather than JobOS emailing on their behalf.
--
-- To remove this source and everything it ingested:
--   DELETE FROM job_opportunities WHERE job_source_id IN
--     (SELECT id FROM job_sources WHERE base_url =
--      'https://boards-api.greenhouse.io/v1/boards/stripe/jobs');
--   DELETE FROM job_sources WHERE base_url =
--     'https://boards-api.greenhouse.io/v1/boards/stripe/jobs';
INSERT INTO job_sources (
  name,
  source_type,
  base_url,
  access_method,
  permission_status,
  crawl_interval_minutes,
  applications_permitted,
  enabled
)
SELECT
  'Stripe',
  'greenhouse',
  'https://boards-api.greenhouse.io/v1/boards/stripe/jobs',
  'public_job_board_api',
  'approved',
  360,
  false,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM job_sources
  WHERE base_url = 'https://boards-api.greenhouse.io/v1/boards/stripe/jobs'
);
