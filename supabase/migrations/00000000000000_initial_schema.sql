-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: profiles
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    career_stage TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: user_roles
CREATE TABLE user_roles (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('job_seeker', 'super_admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: companies
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    website TEXT,
    industry TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: jobs
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    location TEXT,
    employment_type TEXT,
    source_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: applications
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    custom_company_name TEXT,
    custom_job_title TEXT,
    stage TEXT NOT NULL DEFAULT 'Discovered',
    applied_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own role" ON user_roles FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Only admins can insert companies" ON companies FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Only admins can insert jobs" ON jobs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own applications" ON applications 
  FOR ALL USING (auth.uid() = user_id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'job_seeker');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

