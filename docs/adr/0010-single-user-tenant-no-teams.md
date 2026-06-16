# A Tenant is one User — no teams, orgs, or seats

A Tenant maps 1:1 to a Clerk User (`tenants.clerk_user_id`), created automatically on `user.created`. There is no concept of an account with multiple members, shared profiles, seats, or roles. "Multi-tenant" here means per-user row-level isolation enforced by Postgres RLS — not team workspaces.

This is a deliberate boundary, not a missing feature. Resume tailoring is an inherently individual activity, and the entire data model rests on the 1:1 assumption: every RLS predicate resolves `auth.user_id()` to a single owning Tenant, and billing assumes one payer per Tenant. Adding teams would invalidate the Tenant↔User cardinality, every `crudPolicy` predicate, and the per-tenant billing model — a planned migration, never a backfill.

Recorded so a future contributor does not "add teams" without realizing it is a foundational rewrite. The CONTEXT.md glossary reinforces this by listing *account, organization, workspace* as terms to avoid for Tenant.
