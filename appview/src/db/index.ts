import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultDbPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../data/appview.db");
const url = process.env.DB_FILE_NAME ?? defaultDbPath;
mkdirSync(dirname(url), { recursive: true });

const sqlite = new Database(url);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
