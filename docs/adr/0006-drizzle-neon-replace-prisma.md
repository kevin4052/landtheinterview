# Replace Prisma + PostgreSQL with Drizzle + Neon

We are introducing multi-tenancy with row-level security, which requires RLS policies and a JWT-native auth integration. Neon provides native Clerk JWT support (Neon Auth) that eliminates per-query boilerplate. Drizzle replaces Prisma because it compiles to plain SQL, works seamlessly with Neon's serverless HTTP driver, and has no generated client layer that would interfere with session-variable-based RLS.

Prisma's generated client abstracts the connection in a way that makes injecting per-request session state (SET LOCAL) awkward and easy to omit. Drizzle's query builder operates at the SQL level, giving us direct control over the connection context Neon Auth requires.

## Status

supersedes the implicit Prisma + PostgreSQL choice established in the original schema
