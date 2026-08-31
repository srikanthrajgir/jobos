-- Source Registry
CREATE TABLE IF NOT EXISTS job_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    source_type TEXT NOT NULL,
    base_url TEXT NOT NULL,
    terms_url TEXT,
    access_method TEXT,
    permission_status TEXT DEFAULT 'manual_review_required',
    allowed_fields TEXT[],
    crawl_interval_minutes INTEGER DEFAULT 1440,
    applications_permitted BOOLEAN DEFAULT false,
    enabled BOOLEAN DEFAULT true,
    last_checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunities
CREATE TABLE IF NOT EXISTS job_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    job_source_id UUID REFERENCES job_sources(id),
    external_job_id TEXT,
    canonical_url TEXT,
    title TEXT NOT NULL,
    department TEXT,
    industry TEXT,
    description_excerpt TEXT,
    responsibilities TEXT[],
    essential_requirements TEXT[],
    preferred_requirements TEXT[],
    skills TEXT[],
    seniority TEXT,
    employment_type TEXT,
    work_arrangement TEXT,
    suburb TEXT,
    state TEXT,
    postcode TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    salary_min NUMERIC,
    salary_max NUMERIC,
    salary_currency TEXT,
    published_at TIMESTAMPTZ,
    closes_at TIMESTAMPTZ,
    first_discovered_at TIMESTAMPTZ DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ DEFAULT NOW(),
    application_url TEXT,
    application_mode TEXT,
    application_email TEXT,
    application_contact_name TEXT,
    contact_source_url TEXT,
    content_hash TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Matches
CREATE TABLE IF NOT EXISTS user_opportunity_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES job_opportunities(id) ON DELETE CASCADE,
    batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    rank INTEGER,
    match_score INTEGER,
    match_category TEXT,
    match_reasons TEXT[],
    potential_gaps TEXT[],
    recommended_approach TEXT,
    status TEXT DEFAULT 'new', -- new, saved, dismissed, applied
    seen_at TIMESTAMPTZ,
    saved_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    dismissal_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, opportunity_id)
);

-- Extend job_applications if needed (already exists, but we add some columns safely)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_applications' AND column_name='submission_method') THEN
        ALTER TABLE job_applications ADD COLUMN submission_method TEXT;
        ALTER TABLE job_applications ADD COLUMN recipient_email TEXT;
        ALTER TABLE job_applications ADD COLUMN subject TEXT;
        ALTER TABLE job_applications ADD COLUMN message_body TEXT;
        ALTER TABLE job_applications ADD COLUMN resume_id UUID;
        ALTER TABLE job_applications ADD COLUMN external_application_id TEXT;
        ALTER TABLE job_applications ADD COLUMN email_delivery_id TEXT;
        ALTER TABLE job_applications ADD COLUMN idempotency_key TEXT;
        ALTER TABLE job_applications ADD COLUMN delivered_at TIMESTAMPTZ;
        ALTER TABLE job_applications ADD COLUMN failed_at TIMESTAMPTZ;
        ALTER TABLE job_applications ADD COLUMN failure_reason TEXT;
    END IF;
END $$;

-- Application Delivery Events
CREATE TABLE IF NOT EXISTS application_delivery_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
    provider TEXT,
    provider_message_id TEXT,
    event_type TEXT,
    event_timestamp TIMESTAMPTZ,
    payload_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE job_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_opportunity_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_delivery_events ENABLE ROW LEVEL SECURITY;

-- Public/Authenticated Read for sources & opportunities
CREATE POLICY "Anyone can read active sources" ON job_sources FOR SELECT USING (enabled = true);
CREATE POLICY "Users can read active opportunities" ON job_opportunities FOR SELECT USING (status = 'active');

-- Strict ownership for matches and events
CREATE POLICY "Users manage their own matches" ON user_opportunity_matches FOR ALL USING (auth.uid() = user_id);
-- Join policy for events based on application ownership
CREATE POLICY "Users view their own application events" ON application_delivery_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM job_applications WHERE id = application_delivery_events.application_id AND user_id = auth.uid())
);

-- Triggers for updated_at
CREATE TRIGGER set_timestamp_job_sources BEFORE UPDATE ON job_sources FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_job_opportunities BEFORE UPDATE ON job_opportunities FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_user_opportunity_matches BEFORE UPDATE ON user_opportunity_matches FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

