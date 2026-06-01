# RLS context via Neon RLS JWT, not application-level SET LOCAL

RLS policies use `auth.user_id()` exposed by Neon RLS (Neon Authorize) from the Clerk JWT passed per-request, rather than a `SET LOCAL app.current_tenant_id = ?` call that the application must issue before every query.

The application-level SET LOCAL approach requires wrapping every Drizzle query in a transaction that first sets the session variable. This is easy to forget on new query sites and impossible to enforce at the type level — a missing SET silently returns unfiltered rows. Neon RLS moves the enforcement into the DB itself: if no valid JWT is present, RLS policies reject the query. The tenant lookup (`SELECT id FROM tenants WHERE clerk_user_id = auth.user_id()`) is inlined into each policy and covered by an index on `tenants.clerk_user_id`.

## Considered Options

- **SET LOCAL per transaction** — works, but application-enforced; a single omission is a data leak
- **Neon RLS (JWT-native)** — chosen; DB-enforced, zero per-query boilerplate

## Consequences

Neon validates the JWT at the proxy and binds each JWKS provider to specific Postgres roles, following the PostgREST three-role model (`authenticator` / `authenticated` / `anonymous`). Two operational requirements follow:

- `DATABASE_AUTHENTICATED_URL` must connect as the **`authenticator`** role (`LOGIN`, no privileges). The proxy `SET ROLE`s into `authenticated` — which every `crudPolicy` targets `TO "authenticated"` — only after validating the JWT. Connecting as a role outside the JWKS binding fails with `jwk not found`; connecting as `authenticated` directly fails with `role "authenticated" is not permitted to log in`.
- The Clerk JWT is minted from a template named `neon_rls` using Clerk's default RS256 signing keys; a custom signing key would change the `kid` and break JWKS resolution.

Full provider/role setup is documented in the README under *Clerk + Neon RLS setup*.
