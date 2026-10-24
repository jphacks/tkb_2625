import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// TODO: 仮のテーブル。lexicons に合わせて置き換える
/*export const example = sqliteTable("example", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});*/

export const eventsTable = sqliteTable("events", {
  uri: text("uri").primaryKey({ autoIncrement: true }),
  cid: text("cid").notNull(),
  did: text("did").notNull(),
  rkey: text("rkey").notNull(),

  //以下を lexicons に合わせて置き換える
  //name: text("name").notNull(),
  
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
