import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { auth } from "@clerk/nextjs/server";
import * as schema from "./schema";

export type Db = ReturnType<typeof drizzle<typeof schema>>;

export async function getDb(): Promise<Db> {
  const { getToken } = await auth();
  const authToken = await getToken();
  const sql = neon(process.env.DATABASE_AUTHENTICATED_URL!, {
    authToken: authToken ?? undefined,
  });
  return drizzle(sql, { schema });
}
