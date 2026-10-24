import type { InferSelectModel } from "drizzle-orm";
import { eventsTable } from "../db/schema.js";
import type { EventView } from "../lexicons/types/win/tomo-x/rogaining/defs.js";
import type { ProfileViewBasic } from "../lexicons/types/app/bsky/actor/defs.js";
import { resolveProfileBasic, resolveBlobUrl } from "../resolver.js";

export type EventRow = InferSelectModel<typeof eventsTable>;

export interface EventViewContext {
	profileCache: Map<string, Promise<ProfileViewBasic>>;
	blobUrlCache: Map<string, Promise<string | undefined>>;
}

export function createEventViewContext(): EventViewContext {
	return {
		profileCache: new Map(),
		blobUrlCache: new Map(),
	};
}

export function resolveProfileBasicCached(
	did: string,
	context: EventViewContext = createEventViewContext(),
): Promise<ProfileViewBasic> {
	const cached = context.profileCache.get(did);
	if (cached) return cached;

	const promise = resolveProfileBasic(did).catch((error) => {
		context.profileCache.delete(did);
		throw error;
	});

	context.profileCache.set(did, promise);
	return promise;
}

export function resolveBlobUrlCached(
	did: string,
	cid: string | null,
	context: EventViewContext = createEventViewContext(),
): Promise<string | undefined> {
	if (!cid) return Promise.resolve(undefined);
	const cacheKey = `${did}:${cid}`;
	const cached = context.blobUrlCache.get(cacheKey);
	if (cached) return cached;

	const promise = resolveBlobUrl(did, cid).catch((error) => {
		context.blobUrlCache.delete(cacheKey);
		throw error;
	});

	context.blobUrlCache.set(cacheKey, promise);
	return promise;
}

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
		record: {
			$type: "win.tomo-x.rogaining.event",
			name: row.name,
			description: row.description ?? undefined,
			image:
				row.imageCid && row.imageMimeType && row.imageSize != null
					? {
							$type: "blob",
							ref: { $link: row.imageCid },
							mimeType: row.imageMimeType,
							size: row.imageSize,
						}
					: undefined,
			startsAt: row.startsAt.toISOString(),
			endsAt: row.endsAt.toISOString(),
			approver: row.approverDid,
			createdAt: row.createdAt.toISOString(),
		},
		approver,
		imageUrl,
		indexedAt: row.indexedAt.toISOString(),
	};
}

export async function toEventView(
	row: EventRow,
	context: EventViewContext = createEventViewContext(),
): Promise<EventView> {
	const [author, approver, imageUrl] = await Promise.all([
	 resolveProfileBasicCached(row.authorDid, context),
	 resolveProfileBasicCached(row.approverDid, context),
	 resolveBlobUrlCached(row.authorDid, row.imageCid, context),
	]);

	return buildEventView(row, author, approver, imageUrl);
}

export async function toEventViews(
	rows: EventRow[],
	context: EventViewContext = createEventViewContext(),
): Promise<EventView[]> {
	return Promise.all(rows.map((row) => toEventView(row, context)));
}
