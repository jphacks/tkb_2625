import { sqliteTable, text, integer, real, index, check } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const eventsTable = sqliteTable("events", {
  uri: text("uri").primaryKey(),
  cid: text("cid").notNull(),
  did: text("authorDid").notNull(),

  name: text("name").notNull(),
  description: text("description"),
  imageCid: text("image_cid"),
  startsAt: integer("starts_at", { mode: "timestamp" }).notNull(),
  endsAt: integer("ends_at", { mode: "timestamp" }).notNull(),
  approverDid: text("approver_did").notNull(),
  
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const checkpointsTable = sqliteTable(
  "checkpoints",
  {
    uri: text("uri").notNull().primaryKey(),
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
