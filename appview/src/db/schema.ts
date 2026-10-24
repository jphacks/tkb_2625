import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// TODO: 仮のテーブル。lexicons に合わせて置き換える
export const approveTable = sqliteTable("approve", {
  uri: text("uri").primaryKey(),
  submitUri: text("submit_uri").notNull(),
  submitCid: text("submit_cid").notNull(),
  approverDid: text("approver_did").notNull(),
  createdAt: integer("created_at",)
    .notNull()
});
