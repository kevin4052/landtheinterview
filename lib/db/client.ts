import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { auth } from "@clerk/nextjs/server";
import * as schema from "./schema";

export type Db = ReturnType<typeof drizzle<typeof schema>>;

export async function getDb(authToken?: string | null): Promise<Db> {
  if (authToken === undefined) {
    const { getToken } = await auth();
    authToken = await getToken({ template: "jwt-neon_rls" });
  }

  if (!authToken) {
    throw new Error(
      "Missing Clerk JWT for Neon RLS. Verify the Clerk JWT template named 'jwt-neon_rls' exists and the current request is authenticated."
    );
  }

  const databaseUrl = process.env.DATABASE_AUTHENTICATED_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_AUTHENTICATED_URL environment variable.");
  }

  const sql = neon(databaseUrl, { authToken });
  return drizzle(sql, { schema });
}
