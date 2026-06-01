ALTER POLICY "crud-authenticated-policy-select" ON "education" RENAME TO "crud-authenticated_backend-policy-select";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-insert" ON "education" RENAME TO "crud-authenticated_backend-policy-insert";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-update" ON "education" RENAME TO "crud-authenticated_backend-policy-update";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-delete" ON "education" RENAME TO "crud-authenticated_backend-policy-delete";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-select" ON "skill_categories" RENAME TO "crud-authenticated_backend-policy-select";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-insert" ON "skill_categories" RENAME TO "crud-authenticated_backend-policy-insert";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-update" ON "skill_categories" RENAME TO "crud-authenticated_backend-policy-update";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-delete" ON "skill_categories" RENAME TO "crud-authenticated_backend-policy-delete";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-select" ON "tailored_resumes" RENAME TO "crud-authenticated_backend-policy-select";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-insert" ON "tailored_resumes" RENAME TO "crud-authenticated_backend-policy-insert";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-update" ON "tailored_resumes" RENAME TO "crud-authenticated_backend-policy-update";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-delete" ON "tailored_resumes" RENAME TO "crud-authenticated_backend-policy-delete";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-select" ON "tenants" RENAME TO "crud-authenticated_backend-policy-select";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-insert" ON "tenants" RENAME TO "crud-authenticated_backend-policy-insert";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-update" ON "tenants" RENAME TO "crud-authenticated_backend-policy-update";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-delete" ON "tenants" RENAME TO "crud-authenticated_backend-policy-delete";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-select" ON "user_profiles" RENAME TO "crud-authenticated_backend-policy-select";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-insert" ON "user_profiles" RENAME TO "crud-authenticated_backend-policy-insert";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-update" ON "user_profiles" RENAME TO "crud-authenticated_backend-policy-update";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-delete" ON "user_profiles" RENAME TO "crud-authenticated_backend-policy-delete";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-select" ON "work_experience" RENAME TO "crud-authenticated_backend-policy-select";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-insert" ON "work_experience" RENAME TO "crud-authenticated_backend-policy-insert";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-update" ON "work_experience" RENAME TO "crud-authenticated_backend-policy-update";--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-delete" ON "work_experience" RENAME TO "crud-authenticated_backend-policy-delete";--> statement-breakpoint
-- The renames above only changed policy *names*; their target role was still
-- `authenticated`. The app connects directly AS `authenticated_backend` (no SET
-- ROLE — see handoff_neon_authenticated_login.md), so every policy must apply to
-- that role or RLS default-denies. Repoint each policy and re-grant privileges.
ALTER POLICY "crud-authenticated_backend-policy-select" ON "education" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-insert" ON "education" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-update" ON "education" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-delete" ON "education" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-select" ON "skill_categories" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-insert" ON "skill_categories" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-update" ON "skill_categories" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-delete" ON "skill_categories" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-select" ON "tailored_resumes" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-insert" ON "tailored_resumes" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-update" ON "tailored_resumes" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-delete" ON "tailored_resumes" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-select" ON "tenants" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-insert" ON "tenants" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-update" ON "tenants" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-delete" ON "tenants" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-select" ON "user_profiles" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-insert" ON "user_profiles" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-update" ON "user_profiles" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-delete" ON "user_profiles" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-select" ON "work_experience" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-insert" ON "work_experience" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-update" ON "work_experience" TO "authenticated_backend";--> statement-breakpoint
ALTER POLICY "crud-authenticated_backend-policy-delete" ON "work_experience" TO "authenticated_backend";--> statement-breakpoint
GRANT USAGE ON SCHEMA "public" TO "authenticated_backend";--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "public" TO "authenticated_backend";--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA "public" GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "authenticated_backend";