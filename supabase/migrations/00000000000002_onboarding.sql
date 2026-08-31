-- Add profiles table if it doesn't exist (assuming minimal auth before)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    timezone TEXT,
    onboarding_status TEXT DEFAULT 'resume_required',
    onboarding_completed_at TIMESTAMPTZ,
    journey_decision TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resumes Table
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    storage_path TEXT,
    mime_type TEXT,
    size_bytes INTEGER,
    source TEXT DEFAULT 'uploaded',
    processing_status TEXT DEFAULT 'uploaded',
    parsed_data JSONB,
    is_primary BOOLEAN DEFAULT false,
    processing_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Career Preferences Table
CREATE TABLE IF NOT EXISTS career_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    career_stage TEXT,
    primary_target_role TEXT,
    related_target_roles TEXT[],
    preferred_suburb TEXT,
    preferred_state TEXT,
    preferred_postcode TEXT,
    search_radius_km INTEGER,
    remote_preference TEXT,
    employment_types TEXT[],
    industry_preferences TEXT[],
    additional_answers JSONB,
    confirmed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Tasks Table
CREATE TABLE IF NOT EXISTS user_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Applications Table
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opportunity_id UUID,
    company_id UUID,
    role_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    status TEXT DEFAULT 'applied',
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    next_follow_up_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage their own resumes" ON resumes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own career preferences" ON career_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own tasks" ON user_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own applications" ON job_applications FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER set_timestamp_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_resumes BEFORE UPDATE ON resumes FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_career_preferences BEFORE UPDATE ON career_preferences FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_user_tasks BEFORE UPDATE ON user_tasks FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_job_applications BEFORE UPDATE ON job_applications FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
-- Add Storage Bucket for Resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false) ON CONFLICT DO NOTHING;

CREATE POLICY "Users can upload their own resume" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own resume" ON storage.objects FOR UPDATE USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own resume" ON storage.objects FOR SELECT USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own resume" ON storage.objects FOR DELETE USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
