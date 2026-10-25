import { and, desc, eq, inArray, lt, or, type SQL } from "drizzle-orm";
import { db } from "../db/index.js";
import { approveTable, checkpointsTable, rejectTable, submitsTable } from "../db/schema.js";
import type { EventRow, SubmitRow } from "./views.js";

type Review = { uri: string; reason: string | null };

export type SubmissionWithReview = {
  submit: SubmitRow;
  checkpoint: { point: number; latitude: number; longitude: number; isGoal: boolean };
  approval: Review | undefined;
  rejection: Review | undefined;
};

export type SubmissionPage = {
  limit: number;
  cursor?: string;
  checkpoint?: string;
  participant?: string;
};

export class InvalidCursorError extends Error {}

/**
 * 指定した参加者たちのイベントへの提出を新しい順に返す。
 * - チェックポイントはイベント作成者が作ったものだけ有効
 * - approve / reject はイベントの approver か作成者が、提出の今のバージョン (cid) に対して作ったものだけ有効
 * - 有効な審査が複数あれば、作成者のものを approver のものより優先し、同じ人の中では新しいものを優先する
 */
export async function findSubmissions(
  event: EventRow,
  authorDids: string[],
  page?: SubmissionPage,
): Promise<{ submissions: SubmissionWithReview[]; cursor?: string }> {
  if (authorDids.length === 0) return { submissions: [] };

  const conditions: SQL[] = [eq(submitsTable.eventUri, event.uri), inArray(submitsTable.authorDid, authorDids)];
  if (page?.checkpoint !== undefined) {
    conditions.push(eq(submitsTable.checkpointUri, page.checkpoint));
  }
  if (page?.participant !== undefined) {
    conditions.push(eq(submitsTable.authorDid, page.participant));
  }
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
        isGoal: checkpointsTable.isGoal,
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

  const decisions = await findDecisions(event, rows);
  const submissions = rows.map((row) => {
    const decision = decisions.get(row.submit.uri);
    return {
      ...row,
      approval: decision?.kind === "approval" ? decision.review : undefined,
      rejection: decision?.kind === "rejection" ? decision.review : undefined,
    };
  });
  const last = rows.at(-1);
  return { submissions, cursor: hasMore && last ? encodeCursor(last.submit) : undefined };
}

type Decision = { kind: "approval" | "rejection"; review: Review };

/** 提出ごとに、ステータスを決める審査を1つ選ぶ */
async function findDecisions(event: EventRow, rows: { submit: SubmitRow }[]): Promise<Map<string, Decision>> {
  const result = new Map<string, Decision>();
  if (rows.length === 0) return result;
  const cidByUri = new Map(rows.map((row) => [row.submit.uri, row.submit.cid]));
  const [approvals, rejections] = await Promise.all([
    findReviews(approveTable, event, [...cidByUri.keys()]),
    findReviews(rejectTable, event, [...cidByUri.keys()]),
  ]);
  const candidates = [
    ...approvals.map((review) => ({ ...review, kind: "approval" as const })),
    ...rejections.map((review) => ({ ...review, kind: "rejection" as const })),
  ]
    .filter((review) => cidByUri.get(review.submitUri) === review.submitCid)
    // 作成者 > approver、同じ人なら新しい順 (createdAt が同じなら uri で決める)
    .sort(
      (a, b) =>
        Number(b.approverDid === event.authorDid) - Number(a.approverDid === event.authorDid) ||
        b.createdAt.getTime() - a.createdAt.getTime() ||
        (a.uri < b.uri ? 1 : a.uri > b.uri ? -1 : 0),
    );
  for (const { kind, submitUri, uri, reason } of candidates) {
    if (result.has(submitUri)) continue;
    result.set(submitUri, { kind, review: { uri, reason } });
  }
  return result;
}

function findReviews(table: typeof approveTable | typeof rejectTable, event: EventRow, submitUris: string[]) {
  return db
    .select({
      uri: table.uri,
      submitUri: table.submitUri,
      submitCid: table.submitCid,
      approverDid: table.approverDid,
      reason: table.reason,
      createdAt: table.createdAt,
    })
    .from(table)
    .where(and(inArray(table.submitUri, submitUris), inArray(table.approverDid, [event.approverDid, event.authorDid])));
}

const encodeCursor = (submit: SubmitRow) => `${submit.createdAt.getTime()}::${submit.uri}`;

const decodeCursor = (cursor: string): { createdAt: Date; uri: string } => {
  const sep = cursor.indexOf("::");
  const ms = Number(cursor.slice(0, sep));
  if (sep < 0 || !Number.isSafeInteger(ms)) throw new InvalidCursorError("malformed cursor");
  return { createdAt: new Date(ms), uri: cursor.slice(sep + 2) };
};
