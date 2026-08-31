-- Production hardening and schema reconciliation.
-- This migration intentionally preserves the legacy `applications` table while
-- making `job_applications` the canonical pipeline used by the authenticated app.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT NOT NULL DEFAULT 'resume_required',
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS journey_decision TEXT;

ALTER TABLE resumes
  ADD COLUMN IF NOT EXISTS original_filename TEXT,
  ADD COLUMN IF NOT EXISTS extracted_text TEXT;

ALTER TABLE job_opportunities
  ADD COLUMN IF NOT EXISTS company_name TEXT;

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS submission_method TEXT,
  ADD COLUMN IF NOT EXISTS recipient_email TEXT,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS message_body TEXT,
  ADD COLUMN IF NOT EXISTS resume_id UUID,
  ADD COLUMN IF NOT EXISTS external_application_id TEXT,
  ADD COLUMN IF NOT EXISTS email_delivery_id TEXT,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS delivery_status TEXT NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE user_tasks
  ADD COLUMN IF NOT EXISTS application_id UUID;

ALTER TABLE job_sources
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS last_ingested_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_applications_opportunity_fk') THEN
    ALTER TABLE job_applications
      ADD CONSTRAINT job_applications_opportunity_fk
      FOREIGN KEY (opportunity_id) REFERENCES job_opportunities(id) ON DELETE SET NULL NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_applications_resume_fk') THEN
    ALTER TABLE job_applications
      ADD CONSTRAINT job_applications_resume_fk
      FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_tasks_application_fk') THEN
    ALTER TABLE user_tasks
      ADD CONSTRAINT user_tasks_application_fk
      FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_applications_status_check') THEN
    ALTER TABLE job_applications
      ADD CONSTRAINT job_applications_status_check
      CHECK (status IN ('saved', 'draft', 'applied', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_applications_delivery_check') THEN
    ALTER TABLE job_applications
      ADD CONSTRAINT job_applications_delivery_check
      CHECK (delivery_status IN ('not_required', 'pending', 'delivered', 'failed')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_opportunity_matches_status_check') THEN
    ALTER TABLE user_opportunity_matches
      ADD CONSTRAINT user_opportunity_matches_status_check
      CHECK (status IN ('new', 'saved', 'dismissed', 'applied')) NOT VALID;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS job_opportunities_source_external_unique
  ON job_opportunities(job_source_id, external_job_id)
  WHERE job_source_id IS NOT NULL AND external_job_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS job_applications_idempotency_unique
  ON job_applications(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_tasks_application_unique
  ON user_tasks(user_id, application_id)
  WHERE application_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS job_applications_user_status_idx ON job_applications(user_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS user_tasks_user_due_idx ON user_tasks(user_id, status, due_date);
CREATE INDEX IF NOT EXISTS matches_user_batch_idx ON user_opportunity_matches(user_id, batch_date, rank);
CREATE INDEX IF NOT EXISTS opportunities_active_idx ON job_opportunities(status, last_verified_at DESC);
WITH ranked_primary_resumes AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC NULLS LAST, created_at DESC, id) AS row_number
  FROM resumes
  WHERE is_primary = true
)
UPDATE resumes
SET is_primary = false
FROM ranked_primary_resumes
WHERE resumes.id = ranked_primary_resumes.id
  AND ranked_primary_resumes.row_number > 1;
CREATE UNIQUE INDEX IF NOT EXISTS resumes_primary_idx ON resumes(user_id) WHERE is_primary = true;

CREATE POLICY "Users can create their own application events" ON application_delivery_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM job_applications
      WHERE id = application_delivery_events.application_id
        AND user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS ai_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'succeeded', 'failed')),
  input_chars INTEGER NOT NULL DEFAULT 0,
  output_chars INTEGER,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE ai_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own AI runs" ON ai_runs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own AI runs" ON ai_runs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own AI runs" ON ai_runs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS ai_runs_user_window_idx ON ai_runs(user_id, feature, created_at DESC);

CREATE TABLE IF NOT EXISTS application_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES job_opportunities(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('cover_letter', 'resume_variant')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own application documents" ON application_documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS application_documents_user_idx ON application_documents(user_id, updated_at DESC);

DROP TRIGGER IF EXISTS set_timestamp_application_documents ON application_documents;
CREATE TRIGGER set_timestamp_application_documents
  BEFORE UPDATE ON application_documents
  FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Existing authenticated users may have been created before onboarding columns
-- were introduced. Keep their explicit completed state and initialise the rest.
UPDATE profiles SET onboarding_status = 'resume_required' WHERE onboarding_status IS NULL;
