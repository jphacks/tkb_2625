import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./index.js";

// src/db と dist/db のどちらから実行しても appview/drizzle を指す
const migrationsFolder = fileURLToPath(new URL("../../drizzle", import.meta.url));

export function runMigrations(): void {
  migrate(db, { migrationsFolder });
}
