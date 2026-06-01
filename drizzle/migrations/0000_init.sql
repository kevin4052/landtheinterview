CREATE TYPE "public"."plan" AS ENUM('free', 'mid', 'pro');--> statement-breakpoint
CREATE TABLE "education" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"school" text NOT NULL,
	"degree" text NOT NULL,
	"field_of_study" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"is_current" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "education" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "skill_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"name" text NOT NULL,
	"skills" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "skill_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tailored_resumes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"resume_text" text NOT NULL,
	"job_text" text NOT NULL,
	"output_text" text NOT NULL,
	"input_filename" text,
	"input_format" text,
	"output_format" text,
	"title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tailored_resumes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"lifetime_ops_used" integer DEFAULT 0 NOT NULL,
	"monthly_ops_used" integer DEFAULT 0 NOT NULL,
	"current_period_end" timestamp with time zone,
	CONSTRAINT "tenants_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "work_experience" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"company" text NOT NULL,
	"title" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"is_current" boolean DEFAULT false NOT NULL,
	"location" text,
	"bullets" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_experience" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "education" ADD CONSTRAINT "education_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "education" ADD CONSTRAINT "education_profile_id_user_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_categories" ADD CONSTRAINT "skill_categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_categories" ADD CONSTRAINT "skill_categories_profile_id_user_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tailored_resumes" ADD CONSTRAINT "tailored_resumes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_experience" ADD CONSTRAINT "work_experience_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_experience" ADD CONSTRAINT "work_experience_profile_id_user_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "education" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select "education"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "education" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select "education"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "education" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select "education"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id()))) WITH CHECK ((select "education"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "education" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select "education"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "skill_categories" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select "skill_categories"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "skill_categories" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select "skill_categories"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "skill_categories" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select "skill_categories"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id()))) WITH CHECK ((select "skill_categories"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "skill_categories" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select "skill_categories"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "tailored_resumes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select "tailored_resumes"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "tailored_resumes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select "tailored_resumes"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "tailored_resumes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select "tailored_resumes"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id()))) WITH CHECK ((select "tailored_resumes"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "tailored_resumes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select "tailored_resumes"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "tenants" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = "tenants"."clerk_user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "tenants" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "tenants"."clerk_user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "tenants" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "tenants"."clerk_user_id")) WITH CHECK ((select auth.user_id() = "tenants"."clerk_user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "tenants" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = "tenants"."clerk_user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "user_profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select "user_profiles"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "user_profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select "user_profiles"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "user_profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select "user_profiles"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id()))) WITH CHECK ((select "user_profiles"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "user_profiles" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select "user_profiles"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "work_experience" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select "work_experience"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "work_experience" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select "work_experience"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "work_experience" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select "work_experience"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id()))) WITH CHECK ((select "work_experience"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "work_experience" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select "work_experience"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
-- Neon's `authenticated` role (the JWT-validated role the proxy SET ROLEs into)
-- needs table privileges before the RLS policies above can grant row access.
-- drizzle-kit manages policies but not GRANTs, so they're hand-appended here.
-- ALTER DEFAULT PRIVILEGES makes future tables in this schema inherit the grant.
GRANT USAGE ON SCHEMA "public" TO "authenticated";--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "public" TO "authenticated";--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA "public" GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "authenticated";