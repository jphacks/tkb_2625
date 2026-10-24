import { check, index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const checkpointsTable = sqliteTable(
  "checkpoints",
  {
    uri: text("uri").notNull().unique().primaryKey(),
    cid: text("cid").notNull(),
    eventUri: text("event_uri").notNull(),
    eventCid: text("event_cid").notNull(),
    name: text("name").notNull(),
    point: integer("point").notNull(),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    radiusMeters: integer("radius_meters").notNull().default(30),
    description: text("description"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    index("checkpoints_event_uri_idx").on(table.eventUri),
  ],
);
