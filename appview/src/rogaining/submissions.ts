import { and, desc, eq, inArray, lt, or, type SQL } from "drizzle-orm";
import { db } from "../db/index.js";
import { approveTable, checkpointsTable, rejectTable, submitsTable } from "../db/schema.js";
import type { EventRow, SubmitRow } from "./views.js";

type Review = { uri: string; reason: string | null };

export type SubmissionWithReview = {
  submit: SubmitRow;
  checkpoint: { point: number; latitude: number; longitude: number };
  approval: Review | undefined;
  rejection: Review | undefined;
};

export type SubmissionPage = { limit: number; cursor?: string };

export class InvalidCursorError extends Error {}

/**
 * 指定した参加者たちのイベントへの提出を新しい順に返す。
 * - チェックポイントはイベント作成者が作ったものだけ有効
 * - approve / reject はイベントの approver が、提出の今のバージョン (cid) に対して作ったものだけ有効
 */
export async function findSubmissions(
  event: EventRow,
  authorDids: string[],
  page?: SubmissionPage,
): Promise<{ submissions: SubmissionWithReview[]; cursor?: string }> {
  if (authorDids.length === 0) return { submissions: [] };

  const conditions: SQL[] = [eq(submitsTable.eventUri, event.uri), inArray(submitsTable.authorDid, authorDids)];
  if (page?.cursor !== undefined) {
    const { createdAt, uri } = decodeCursor(page.cursor);
    conditions.push(
      or(
        lt(submitsTable.createdAt, createdAt),
        and(eq(submitsTable.createdAt, createdAt), lt(submitsTable.uri, uri)),
      )!,
    );
  }

  const query = db
    .select({
      submit: submitsTable,
      checkpoint: {
        point: checkpointsTable.point,
        latitude: checkpointsTable.latitude,
        longitude: checkpointsTable.longitude,
      },
    })
    .from(submitsTable)
    .innerJoin(
      checkpointsTable,
      and(
        eq(checkpointsTable.uri, submitsTable.checkpointUri),
        eq(checkpointsTable.eventUri, submitsTable.eventUri),
        eq(checkpointsTable.authorDid, event.authorDid),
      ),
    )
    .where(and(...conditions))
    .orderBy(desc(submitsTable.createdAt), desc(submitsTable.uri));
  // 次のページがあるか知るために1件多く取る
  const rows = page ? await query.limit(page.limit + 1) : await query;
  const hasMore = page !== undefined && rows.length > page.limit;
  if (hasMore) rows.pop();

  const [approvals, rejections] = await Promise.all([
    findReviews(approveTable, event, rows),
    findReviews(rejectTable, event, rows),
  ]);
  const submissions = rows.map((row) => ({
    ...row,
    approval: approvals.get(row.submit.uri),
    rejection: rejections.get(row.submit.uri),
  }));
  const last = rows.at(-1);
  return { submissions, cursor: hasMore && last ? encodeCursor(last.submit) : undefined };
}

async function findReviews(
  table: typeof approveTable | typeof rejectTable,
  event: EventRow,
  rows: { submit: SubmitRow }[],
): Promise<Map<string, Review>> {
  const result = new Map<string, Review>();
  if (rows.length === 0) return result;
  const cidByUri = new Map(rows.map((row) => [row.submit.uri, row.submit.cid]));
  const reviews = await db
    .select({ uri: table.uri, submitUri: table.submitUri, submitCid: table.submitCid, reason: table.reason })
    .from(table)
    .where(and(inArray(table.submitUri, [...cidByUri.keys()]), eq(table.approverDid, event.approverDid)))
    .orderBy(table.createdAt, table.uri);
  for (const review of reviews) {
    if (cidByUri.get(review.submitUri) !== review.submitCid || result.has(review.submitUri)) continue;
    result.set(review.submitUri, { uri: review.uri, reason: review.reason });
  }
  return result;
}

const encodeCursor = (submit: SubmitRow) => `${submit.createdAt.getTime()}::${submit.uri}`;

const decodeCursor = (cursor: string): { createdAt: Date; uri: string } => {
  const sep = cursor.indexOf("::");
  const ms = Number(cursor.slice(0, sep));
  if (sep < 0 || !Number.isSafeInteger(ms)) throw new InvalidCursorError("malformed cursor");
  return { createdAt: new Date(ms), uri: cursor.slice(sep + 2) };
};
