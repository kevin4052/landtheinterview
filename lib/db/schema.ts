import {
  pgTable,
  pgEnum,
  pgRole,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { crudPolicy, authenticatedRole, authUid } from "drizzle-orm/neon";
import { relations, sql } from "drizzle-orm";

export const planEnum = pgEnum("plan", ["free", "mid", "pro"]);

// Neon's "authenticated" role is NOLOGIN, so the serverless driver connects as
// the login-capable app_authenticated role (created in migration 0002). It
// already exists in the database; .existing() keeps drizzle-kit from emitting
// CREATE/DROP for it while still including it in generated policy role lists.
const appAuthenticatedRole = pgRole("app_authenticated").existing();
const rlsRoles = [authenticatedRole, appAuthenticatedRole];

// Row belongs to the calling user when its tenant_id resolves to the tenant
// owned by the JWT's Clerk user. Used as the RLS predicate on every child table.
const belongsToTenant = (tenantId: AnyPgColumn) =>
  sql`(select ${tenantId} = (select ${tenants.id} from ${tenants} where ${tenants.clerkUserId} = auth.user_id()))`;

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  plan: planEnum("plan").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  lifetimeOpsUsed: integer("lifetime_ops_used").notNull().default(0),
  monthlyOpsUsed: integer("monthly_ops_used").notNull().default(0),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
}, (t) => [
  crudPolicy({
    role: rlsRoles,
    read: authUid(t.clerkUserId),
    modify: authUid(t.clerkUserId),
  }),
]);

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [
  crudPolicy({
    role: rlsRoles,
    read: belongsToTenant(t.tenantId),
    modify: belongsToTenant(t.tenantId),
  }),
]);

export const workExperience = pgTable("work_experience", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => userProfiles.id, { onDelete: "cascade" }),
  company: text("company").notNull(),
  title: text("title").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }),
  isCurrent: boolean("is_current").notNull().default(false),
  location: text("location"),
  bullets: text("bullets").array().notNull().default([]),
}, (t) => [
  crudPolicy({
    role: rlsRoles,
    read: belongsToTenant(t.tenantId),
    modify: belongsToTenant(t.tenantId),
  }),
]);

export const education = pgTable("education", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => userProfiles.id, { onDelete: "cascade" }),
  school: text("school").notNull(),
  degree: text("degree").notNull(),
  fieldOfStudy: text("field_of_study").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }),
  isCurrent: boolean("is_current").notNull().default(false),
}, (t) => [
  crudPolicy({
    role: rlsRoles,
    read: belongsToTenant(t.tenantId),
    modify: belongsToTenant(t.tenantId),
  }),
]);

export const skillCategories = pgTable("skill_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => userProfiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  skills: text("skills").array().notNull().default([]),
}, (t) => [
  crudPolicy({
    role: rlsRoles,
    read: belongsToTenant(t.tenantId),
    modify: belongsToTenant(t.tenantId),
  }),
]);

export const tailoredResumes = pgTable("tailored_resumes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  resumeText: text("resume_text").notNull(),
  jobText: text("job_text").notNull(),
  outputText: text("output_text").notNull(),
  inputFilename: text("input_filename"),
  inputFormat: text("input_format"),
  outputFormat: text("output_format"),
  title: text("title"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [
  crudPolicy({
    role: rlsRoles,
    read: belongsToTenant(t.tenantId),
    modify: belongsToTenant(t.tenantId),
  }),
]);

export const tenantsRelations = relations(tenants, ({ one }) => ({
  profile: one(userProfiles, {
    fields: [tenants.id],
    references: [userProfiles.tenantId],
  }),
}));

export const userProfilesRelations = relations(
  userProfiles,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [userProfiles.tenantId],
      references: [tenants.id],
    }),
    workExperience: many(workExperience),
    education: many(education),
    skillCategories: many(skillCategories),
  })
);

export const workExperienceRelations = relations(workExperience, ({ one }) => ({
  profile: one(userProfiles, {
    fields: [workExperience.profileId],
    references: [userProfiles.id],
  }),
}));

export const educationRelations = relations(education, ({ one }) => ({
  profile: one(userProfiles, {
    fields: [education.profileId],
    references: [userProfiles.id],
  }),
}));

export const skillCategoriesRelations = relations(
  skillCategories,
  ({ one }) => ({
    profile: one(userProfiles, {
      fields: [skillCategories.profileId],
      references: [userProfiles.id],
    }),
  })
);

export const tailoredResumesRelations = relations(
  tailoredResumes,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [tailoredResumes.tenantId],
      references: [tenants.id],
    }),
  })
);
