CREATE TABLE "personal_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"bullets" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "personal_projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "personal_projects" ADD CONSTRAINT "personal_projects_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_projects" ADD CONSTRAINT "personal_projects_profile_id_user_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "crud-authenticated_backend-policy-select" ON "personal_projects" AS PERMISSIVE FOR SELECT TO "authenticated_backend" USING ((select "personal_projects"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
CREATE POLICY "crud-authenticated_backend-policy-insert" ON "personal_projects" AS PERMISSIVE FOR INSERT TO "authenticated_backend" WITH CHECK ((select "personal_projects"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
CREATE POLICY "crud-authenticated_backend-policy-update" ON "personal_projects" AS PERMISSIVE FOR UPDATE TO "authenticated_backend" USING ((select "personal_projects"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id()))) WITH CHECK ((select "personal_projects"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));--> statement-breakpoint
CREATE POLICY "crud-authenticated_backend-policy-delete" ON "personal_projects" AS PERMISSIVE FOR DELETE TO "authenticated_backend" USING ((select "personal_projects"."tenant_id" = (select "tenants"."id" from "tenants" where "tenants"."clerk_user_id" = auth.user_id())));