# RLS context via Neon Auth JWT, not application-level SET LOCAL

RLS policies use `auth.user_id()` exposed by Neon Auth from the Clerk JWT passed per-request, rather than a `SET LOCAL app.current_tenant_id = ?` call that the application must issue before every query.

The application-level SET LOCAL approach requires wrapping every Drizzle query in a transaction that first sets the session variable. This is easy to forget on new query sites and impossible to enforce at the type level — a missing SET silently returns unfiltered rows. Neon Auth moves the enforcement into the DB itself: if no valid JWT is present, RLS policies reject the query. The tenant lookup (`SELECT id FROM tenants WHERE clerk_user_id = auth.user_id()`) is inlined into each policy and covered by an index on `tenants.clerk_user_id`.

## Considered Options

- **SET LOCAL per transaction** — works, but application-enforced; a single omission is a data leak
- **Neon Auth (JWT-native)** — chosen; DB-enforced, zero per-query boilerplate
