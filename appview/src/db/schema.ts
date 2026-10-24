import { sqliteTable, text, integer, check } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const eventsTable = sqliteTable("events", {
  uri: text("uri").primaryKey(),
  cid: text("cid").notNull(),
  did: text("did").notNull(),
  rkey: text("rkey").notNull(),

  name: text("name").notNull(),
  description: text("description"),
  imageCid: text("image_cid"),
  startsAt: integer("starts_at", { mode: "timestamp" }).notNull(),
  endsAt: integer("ends_at", { mode: "timestamp" }).notNull(),
  approverDid: text("approver_did").notNull(),
  
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => [
  check("events_time_order", sql`${table.endsAt} > ${table.startsAt}`),
]);
