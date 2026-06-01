# RLS context via Neon RLS JWT, not application-level SET LOCAL

RLS policies use `auth.user_id()` exposed by Neon RLS (Neon Authorize) from the Clerk JWT passed per-request, rather than a `SET LOCAL app.current_tenant_id = ?` call that the application must issue before every query.

The application-level SET LOCAL approach requires wrapping every Drizzle query in a transaction that first sets the session variable. This is easy to forget on new query sites and impossible to enforce at the type level — a missing SET silently returns unfiltered rows. Neon RLS moves the enforcement into the DB itself: if no valid JWT is present, RLS policies reject the query. The tenant lookup (`SELECT id FROM tenants WHERE clerk_user_id = auth.user_id()`) is inlined into each policy and covered by an index on `tenants.clerk_user_id`.

## Considered Options

- **SET LOCAL per transaction** — works, but application-enforced; a single omission is a data leak
- **Neon RLS (JWT-native)** — chosen; DB-enforced, zero per-query boilerplate

## Consequences

Neon validates the JWT at its proxy against the bound JWKS provider, then opens the Postgres session **directly as the role named in the connection string** — there is no `SET ROLE`. `current_user` is whatever role you connect as and stays that way for the whole session. (This is *not* the PostgREST `authenticator` → `SET ROLE authenticated` model; an earlier revision of this ADR asserted that model and was wrong — see `memory/handoff_neon_authenticated_login.md` for the empirical disproof, where `current_user` stayed `authenticator`.)

The operational requirements that follow:

- `DATABASE_AUTHENTICATED_URL` connects as **`authenticated_backend`** — a dedicated **passwordless `LOGIN` role** (`rolcanlogin = true`, `rolbypassrls = false`, no password). The JWKS binding makes the validated Clerk JWT the credential, so Neon's proxy refuses to open the session without a valid JWT, and the session is subject to RLS. A `NOLOGIN` role fails at session startup with `28000 … is not permitted to log in` (`routine: InitializeSessionUserId`); a role outside the JWKS binding fails with `jwk not found`.
- Because there is no role switch, **every policy must target `authenticated_backend` and that role must hold the table grants.** `crudPolicy` in `lib/db/schema.ts` is configured with `pgRole('authenticated_backend')`, and the `GRANT … TO "authenticated_backend"` statements are hand-appended to the migration (drizzle-kit emits policies but not grants). A policy or grant left on any other role silently default-denies — reads return zero rows, writes raise `42501 new row violates row-level security policy`.
- The Clerk JWT is minted from a template named `neon_rls` using Clerk's default RS256 signing keys; a custom signing key would change the `kid` and break JWKS resolution. The JWT `sub` is the Clerk user id and is what `auth.user_id()` returns.
- The owner connection (`DATABASE_URL` / `neondb_owner`, used by `lib/db/admin.ts`) bypasses RLS and is used only for tenant provisioning (`ensureTenant`) and admin-scoped reads.

Full provider/role setup is documented in the README under *Clerk + Neon RLS setup*.
