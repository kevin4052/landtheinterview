-- Neon Data API's protected "authenticated" role is NOLOGIN in this project.
-- The serverless SQL driver needs a login-capable database role in the
-- connection string, so the app uses app_authenticated and applies the same
-- grants and RLS policies to it.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_authenticated') THEN
    CREATE ROLE "app_authenticated" LOGIN;
  END IF;
END $$;
--> statement-breakpoint
GRANT USAGE ON SCHEMA "public" TO "app_authenticated";--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "public" TO "app_authenticated";--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "public" TO "app_authenticated";--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA "public" GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "app_authenticated";--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA "public" GRANT USAGE, SELECT ON SEQUENCES TO "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-select" ON "education" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-insert" ON "education" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-update" ON "education" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-delete" ON "education" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-select" ON "skill_categories" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-insert" ON "skill_categories" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-update" ON "skill_categories" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-delete" ON "skill_categories" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-select" ON "tailored_resumes" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-insert" ON "tailored_resumes" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-update" ON "tailored_resumes" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-delete" ON "tailored_resumes" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-select" ON "tenants" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-insert" ON "tenants" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-update" ON "tenants" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-delete" ON "tenants" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-select" ON "user_profiles" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-insert" ON "user_profiles" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-update" ON "user_profiles" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-delete" ON "user_profiles" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-select" ON "work_experience" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-insert" ON "work_experience" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-update" ON "work_experience" TO "authenticated", "app_authenticated";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-delete" ON "work_experience" TO "authenticated", "app_authenticated";
