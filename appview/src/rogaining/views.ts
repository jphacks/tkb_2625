import type { InferSelectModel } from "drizzle-orm";
import { eventsTable, checkpointsTable, submitsTable } from "../db/schema.js";
import type { 
  EventView, 
  CheckpointView, 
  SubmissionView 
} from "../lexicons/types/win/tomo-x/rogaining/defs.js";import type { ProfileViewBasic } from "../lexicons/types/app/bsky/actor/defs.js";
import { resolveProfileBasic, resolveBlobUrl } from "../resolver.js";

export type EventRow = InferSelectModel<typeof eventsTable>;
export type CheckpointRow = InferSelectModel<typeof checkpointsTable>;
export type SubmissionRow = InferSelectModel<typeof submitsTable>;

function authorDidFromUri(uri: string): string | null {
	const match = /^at:\/\/([^/]+)\//.exec(uri);
	return match ? match[1] : null;
}

export interface CheckpointViewOptions {
	includeInternalImages?: boolean;
}

export function buildEventView(
	row: EventRow,
	author: ProfileViewBasic,
	approver: ProfileViewBasic | undefined,
	imageUrl: string | undefined,
): EventView {
	return {
		$type: "win.tomo-x.rogaining.defs#eventView",
		cid: row.cid,
		uri: row.uri,
		author,
		record: row.record as { [key: string]: unknown },
		approver,
		imageUrl,
		indexedAt: row.indexedAt.toISOString(),
	};
}

export async function toEventView(row: EventRow): Promise<EventView> {
	const [author, approver] = await Promise.all([
		resolveProfileBasic(row.authorDid),
		resolveProfileBasic(row.approverDid).catch(() => undefined),
	]);

	const imageUrl = await resolveBlobUrl(row.authorDid, row.imageCid).catch(() => undefined);

	return buildEventView(row, author, approver, imageUrl);
}

export async function toEventViews(rows: EventRow[]): Promise<EventView[]> {
	const results = await Promise.allSettled(rows.map((row) => toEventView(row)));
	const views: EventView[] = [];
	for (const result of results) {
		if (result.status === "fulfilled") {
			views.push(result.value);
		} else {
			console.warn("[views] failed to build EventView:", result.reason);
		}
	}
	return views;
}

export function buildCheckpointView(
	row: CheckpointRow,
	imageUrl: string | undefined,
	internalImageUrls: string[] | undefined,
): CheckpointView {
	return {
		$type: "win.tomo-x.rogaining.defs#checkpointView",
		cid: row.cid,
		uri: row.uri,
		record: row.record as { [key: string]: unknown },
		indexedAt: row.indexedAt.toISOString(),
		imageUrl,
		internalImageUrls,
	};
}

export async function toCheckpointView(
	row: CheckpointRow,
	options: CheckpointViewOptions = {},
): Promise<CheckpointView> {
	const authorDid = authorDidFromUri(row.uri);

	const [imageUrl, internalResults] = await Promise.all([
		authorDid
			? resolveBlobUrl(authorDid, row.imageCid).catch(() => undefined)
			: Promise.resolve(undefined),
		options.includeInternalImages && authorDid && row.internalImageCids
			? Promise.all(
					row.internalImageCids.map((cid) =>
						resolveBlobUrl(authorDid, cid).catch(() => undefined),
					),
				)
			: Promise.resolve(undefined),
	]);

	const filteredInternal =
		internalResults?.filter((url): url is string => Boolean(url)) ?? [];
	const internalImageUrls =
		filteredInternal.length > 0 ? filteredInternal : undefined;

	return buildCheckpointView(row, imageUrl, internalImageUrls);
}

export async function toCheckpointViews(
	rows: CheckpointRow[],
	optionsFor: (row: CheckpointRow) => CheckpointViewOptions = () => ({}),
): Promise<CheckpointView[]> {
	const results = await Promise.allSettled(
		rows.map((row) => toCheckpointView(row, optionsFor(row))),
	);
	const views: CheckpointView[] = [];
	for (const result of results) {
		if (result.status === "fulfilled") {
			views.push(result.value);
		} else {
			console.warn("[views] failed to build CheckpointView:", result.reason);
		}
	}
	return views;
}

export interface SubmissionViewOptions {
	status?: "pending" | "approved";
	approvalUri?: string;
}

export function buildSubmissionView(
	row: SubmissionRow,
	author: ProfileViewBasic,
	photoUrl: string | undefined,
	options: SubmissionViewOptions = {},
): SubmissionView {
	return {
		$type: "win.tomo-x.rogaining.defs#submissionView",
		cid: row.cid,
		uri: row.uri,
		author,
		record: row.record as { [key: string]: unknown },
		status: options.status ?? "pending",
		photoUrl,
		indexedAt: row.indexedAt.toISOString(),
		approvalUri: options.approvalUri,
	};
}

export async function toSubmissionView(
	row: SubmissionRow,
	options: SubmissionViewOptions = {},
): Promise<SubmissionView> {
	const [author, photoUrl] = await Promise.all([
		resolveProfileBasic(row.authorDid),
		resolveBlobUrl(row.authorDid, row.photoCid).catch(() => undefined),
	]);

	return buildSubmissionView(row, author, photoUrl, options);
}

export async function toSubmissionViews(
	rows: SubmissionRow[],
	optionsFor: (row: SubmissionRow) => SubmissionViewOptions = () => ({}),
): Promise<SubmissionView[]> {
	const results = await Promise.allSettled(
		rows.map((row) => toSubmissionView(row, optionsFor(row))),
	);
	const views: SubmissionView[] = [];
	for (const result of results) {
		if (result.status === "fulfilled") {
			views.push(result.value);
		} else {
			console.warn("[views] failed to build SubmissionView:", result.reason);
		}
	}
	return views;
}
