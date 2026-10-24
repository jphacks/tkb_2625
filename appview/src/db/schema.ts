import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const eventsTable = sqliteTable("events", {
  uri: text("uri").primaryKey({ autoIncrement: true }),
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
});
