import type { InferSelectModel } from "drizzle-orm";
import { eventsTable } from "../db/schema.js";
import type { EventView } from "../lexicons/types/win/tomo-x/rogaining/defs.js";
import type { ProfileViewBasic } from "../lexicons/types/app/bsky/actor/defs.js";
import { resolveDiddoc, resolvePdsUrl } from "../resolver.js";

export type EventRow = InferSelectModel<typeof eventsTable>;

export interface EventViewContext {
	profileCache: Map<string, ProfileViewBasic>;
	blobUrlCache: Map<string, string | undefined>;
}

export function createEventViewContext(): EventViewContext {
	return {
		profileCache: new Map(),
		blobUrlCache: new Map(),
	};
}

export async function resolveProfileBasic(
	did: string,
	context: EventViewContext = createEventViewContext(),
): Promise<ProfileViewBasic> {
	const cached = context.profileCache.get(did);
	if (cached) return cached;

	let result: ProfileViewBasic;
	try {
		const doc = await resolveDiddoc(did, false);
		const handle =
			doc?.alsoKnownAs?.find(
				(value): value is string => typeof value === "string" && value.startsWith("at://"),
			)?.slice("at://".length);
		if (!handle) {
			console.warn(`[views] handle not found for ${did}; falling back to DID`);
		}
		result = { $type: "app.bsky.actor.defs#profileViewBasic", did, handle: handle ?? did };
	} catch (error) {
		console.warn(`[views] failed to resolve profile for ${did}:`, error);
		result = { $type: "app.bsky.actor.defs#profileViewBasic", did, handle: did };
	}

	context.profileCache.set(did, result);
	return result;
}

async function resolveBlobUrl(
	did: string,
	cid: string | null,
	context: EventViewContext,
): Promise<string | undefined> {
	if (!cid) return undefined;
	const cacheKey = `${did}:${cid}`;
	const cached = context.blobUrlCache.get(cacheKey);
	if (cached !== undefined || context.blobUrlCache.has(cacheKey)) return cached;

	let result: string | undefined;
	try {
		const pdsUrl = await resolvePdsUrl(did);
		if (!pdsUrl) {
			console.warn(`[views] PDS not found for ${did}; imageUrl omitted`);
			result = undefined;
		} else {
			result = `${pdsUrl.replace(/\/$/, "")}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(did)}&cid=${encodeURIComponent(cid)}`;
		}
	} catch (error) {
		console.warn(`[views] failed to resolve blob URL for ${did}/${cid}:`, error);
		result = undefined;
	}

	context.blobUrlCache.set(cacheKey, result);
	return result;
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
			startsAt: row.startsAt.toISOString(),
			endsAt: row.endsAt.toISOString(),
			approver: row.approverDid,
			createdAt: row.createdAt.toISOString(),
		},
		approver,
		imageUrl,
		indexedAt: row.createdAt.toISOString(),
	};
}

export async function toEventViews(
	rows: EventRow[],
	context: EventViewContext = createEventViewContext(),
): Promise<EventView[]> {
	return Promise.all(rows.map((row) => toEventView(row, context)));
}

export async function toEventView(
	row: EventRow,
	context: EventViewContext = createEventViewContext(),
): Promise<EventView> {
	const [author, approver, imageUrl] = await Promise.all([
	 resolveProfileBasic(row.authorDid, context),
	 resolveProfileBasic(row.approverDid, context),
	 resolveBlobUrl(row.authorDid, row.imageCid, context),
	]);

	return buildEventView(row, author, approver, imageUrl);
}
