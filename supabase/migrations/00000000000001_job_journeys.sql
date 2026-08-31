-- Job Journeys Table
CREATE TABLE job_journeys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT,
    status TEXT DEFAULT 'active',
    primary_outcome TEXT,
    current_milestone_id UUID,
    generated_by_ai BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

-- Job Milestones Table
CREATE TABLE job_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journey_id UUID NOT NULL REFERENCES job_journeys(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stage_key TEXT NOT NULL, -- find, grow, advance, thrive, lead
    position INTEGER NOT NULL,
    title TEXT NOT NULL,
    target_role TEXT,
    description TEXT,
    target_date DATE,
    status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed, paused
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    salary_target_min NUMERIC,
    salary_target_max NUMERIC,
    salary_currency TEXT DEFAULT 'AUD',
    notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alter journeys to reference current milestone safely
ALTER TABLE job_journeys ADD CONSTRAINT fk_current_milestone FOREIGN KEY (current_milestone_id) REFERENCES job_milestones(id) ON DELETE SET NULL;

-- Job Milestone Skills
CREATE TABLE job_milestone_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    milestone_id UUID NOT NULL REFERENCES job_milestones(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Milestone Actions
CREATE TABLE job_milestone_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    milestone_id UUID NOT NULL REFERENCES job_milestones(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    action_type TEXT NOT NULL,
    linked_entity_type TEXT,
    linked_entity_id UUID,
    status TEXT DEFAULT 'pending',
    priority INTEGER DEFAULT 1,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE job_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_milestone_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_milestone_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own journeys" ON job_journeys FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own milestones" ON job_milestones FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own milestone skills" ON job_milestone_skills FOR ALL USING (
    EXISTS (SELECT 1 FROM job_milestones m WHERE m.id = milestone_id AND m.user_id = auth.uid())
);
CREATE POLICY "Users can manage their own milestone actions" ON job_milestone_actions FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_job_journeys
BEFORE UPDATE ON job_journeys
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_job_milestones
BEFORE UPDATE ON job_milestones
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
