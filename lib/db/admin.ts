import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _adminDb: NeonHttpDatabase<typeof schema> | undefined;

export function getAdminDb(): NeonHttpDatabase<typeof schema> {
  if (!_adminDb) {
    const sql = neon(process.env.DATABASE_URL!);
    _adminDb = drizzle(sql, { schema });
  }
  return _adminDb;
}
