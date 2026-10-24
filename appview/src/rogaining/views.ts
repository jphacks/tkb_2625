import type { InferSelectModel } from "drizzle-orm";
import { eventsTable } from "../db/schema.js";
import type { EventView } from "../lexicons/types/win/tomo-x/rogaining/defs.js";
import type { ProfileViewBasic } from "../lexicons/types/app/bsky/actor/defs.js";
import { resolveProfileBasic, resolveBlobUrl } from "../resolver.js";

export type EventRow = InferSelectModel<typeof eventsTable>;

export function buildEventView(
	row: EventRow,
	author: ProfileViewBasic,
	approver: ProfileViewBasic,
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
	const [author, approver, imageUrl] = await Promise.all([
	 resolveProfileBasic(row.authorDid),
	 resolveProfileBasic(row.approverDid),
	 resolveBlobUrl(row.authorDid, row.imageCid),
	]);

	return buildEventView(row, author, approver, imageUrl);
}

export async function toEventViews(rows: EventRow[]): Promise<EventView[]> {
	return Promise.all(rows.map((row) => toEventView(row)));
}
