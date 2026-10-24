import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "drizzle-kit";

const dbPath = resolve(
  process.env.DB_FILE_NAME ?? resolve(dirname(fileURLToPath(import.meta.url)), "data/appview.db"),
);
mkdirSync(dirname(dbPath), { recursive: true });

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: dbPath,
  },
});
