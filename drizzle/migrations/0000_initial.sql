-- Drop old Prisma-managed tables if they exist
DROP TABLE IF EXISTS "SkillCategory" CASCADE;
DROP TABLE IF EXISTS "WorkExperience" CASCADE;
DROP TABLE IF EXISTS "Education" CASCADE;
DROP TABLE IF EXISTS "UserProfile" CASCADE;
DROP TABLE IF EXISTS "TailoredResume" CASCADE;

-- Create plan enum
DO $$ BEGIN
  CREATE TYPE plan AS ENUM ('free', 'mid', 'pro');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- tenants: one row per Clerk user, the RLS boundary
CREATE TABLE IF NOT EXISTS tenants (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id         TEXT NOT NULL UNIQUE,
  plan                  plan NOT NULL DEFAULT 'free',
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  lifetime_ops_used     INTEGER NOT NULL DEFAULT 0,
  monthly_ops_used      INTEGER NOT NULL DEFAULT 0,
  current_period_end    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tenants_clerk_user_id ON tenants (clerk_user_id);

-- user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- work_experience
CREATE TABLE IF NOT EXISTS work_experience (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
  company    TEXT NOT NULL,
  title      TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date   TIMESTAMPTZ,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  location   TEXT,
  bullets    TEXT[] NOT NULL DEFAULT '{}'
);

-- education
CREATE TABLE IF NOT EXISTS education (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  profile_id     UUID NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
  school         TEXT NOT NULL,
  degree         TEXT NOT NULL,
  field_of_study TEXT NOT NULL,
  start_date     TIMESTAMPTZ NOT NULL,
  end_date       TIMESTAMPTZ,
  is_current     BOOLEAN NOT NULL DEFAULT FALSE
);

-- skill_categories
CREATE TABLE IF NOT EXISTS skill_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  skills     TEXT[] NOT NULL DEFAULT '{}'
);

-- tailored_resumes
CREATE TABLE IF NOT EXISTS tailored_resumes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  resume_text    TEXT NOT NULL,
  job_text       TEXT NOT NULL,
  output_text    TEXT NOT NULL,
  input_filename TEXT,
  input_format   TEXT,
  output_format  TEXT,
  title          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on every table
-- Requires Neon Auth configured with Clerk as JWT provider (auth.user_id() function)
ALTER TABLE tenants         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE education       ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tailored_resumes ENABLE ROW LEVEL SECURITY;

-- RLS policies: each table is visible only to the tenant that owns it.
-- The admin/owner role (used for migrations and webhooks) bypasses RLS automatically.

CREATE POLICY tenants_isolation ON tenants
  FOR ALL
  USING (clerk_user_id = auth.user_id());

CREATE POLICY user_profiles_isolation ON user_profiles
  FOR ALL
  USING (tenant_id = (SELECT id FROM tenants WHERE clerk_user_id = auth.user_id()));

CREATE POLICY work_experience_isolation ON work_experience
  FOR ALL
  USING (tenant_id = (SELECT id FROM tenants WHERE clerk_user_id = auth.user_id()));

CREATE POLICY education_isolation ON education
  FOR ALL
  USING (tenant_id = (SELECT id FROM tenants WHERE clerk_user_id = auth.user_id()));

CREATE POLICY skill_categories_isolation ON skill_categories
  FOR ALL
  USING (tenant_id = (SELECT id FROM tenants WHERE clerk_user_id = auth.user_id()));

CREATE POLICY tailored_resumes_isolation ON tailored_resumes
  FOR ALL
  USING (tenant_id = (SELECT id FROM tenants WHERE clerk_user_id = auth.user_id()));
