import { sqliteTable, text, integer, real, index, check } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

export const eventsTable = sqliteTable("events", {
  uri: text("uri").primaryKey(),
  cid: text("cid").notNull(),
  authorDid: text("author_did").notNull(),

  name: text("name").notNull(),
  description: text("description"),
  imageCid: text("image_cid"),
  startsAt: integer("starts_at", { mode: "timestamp" }).notNull(),
  endsAt: integer("ends_at", { mode: "timestamp" }).notNull(),
  
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const approveTable = sqliteTable("approve", {
  uri: text("uri").primaryKey(),
  submitUri: text("submit_uri").notNull(),
  submitCid: text("submit_cid").notNull(),
  approverDid: text("approver_did").notNull(),
  createdAt: integer("created_at",{ mode: "timestamp" })
    .notNull()
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


export const submitsTable = sqliteTable(
  "submits",
  {
    uri: text("uri").primaryKey(),
    cid: text("cid").notNull(),
    authorDid: text("author_did").notNull(),
    eventUri: text("event_uri").notNull().references(() => eventsTable.uri),
    eventCid: text("event_cid").notNull(),
    checkpointUri: text("checkpoint_uri").notNull().references(() => checkpointsTable.uri),
    checkpointCid: text("checkpoint_cid").notNull(),
    photoCid: text("photo_cid").notNull(),
    photoMimeType: text("photo_mime_type").notNull(),
    photoSize: integer("photo_size").notNull(),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    indexedAt: integer("indexed_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    index("submits_event_uri_idx").on(table.eventUri),
    index("submits_checkpoint_uri_idx").on(table.checkpointUri),
    index("submits_author_did_idx").on(table.authorDid),
  ],
);

export const submitsRelations = relations(submitsTable, ({ one }) => ({
  event: one(eventsTable, {
    fields: [submitsTable.eventUri],
    references: [eventsTable.uri],
  }),
  checkpoint: one(checkpointsTable, {
    fields: [submitsTable.checkpointUri],
    references: [checkpointsTable.uri],
  }),
}));
