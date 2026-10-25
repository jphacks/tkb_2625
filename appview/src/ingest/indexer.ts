import { getBlobCidString, isLegacyBlobRef, jsonToLex, lexToJson } from "@atproto/lex";
import { AtUri } from "@atproto/syntax";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
	approveTable,
	checkpointsTable,
	eventsTable,
	rejectTable,
	submitsTable,
	teamMembersTable,
	teamsTable,
} from "../db/schema.js";
import * as r from "../client-lexicons/win/tomo-x/rogaining.js";
import { fetchRecord } from "../resolver.js";

export type RecordPut<T> = { uri: string; did: string; cid: string; record: T };

export async function putEvent({ uri, did, cid, record }: RecordPut<r.event.Main>): Promise<void> {
	const startsAt = parseDate(record.startsAt);
	const endsAt = parseDate(record.endsAt);
	if (!startsAt || !endsAt) return logInvalid(uri, "invalid startsAt/endsAt");

	const values = {
		cid,
		authorDid: did,
		record: toJson(record),
		name: record.name,
		description: record.description ?? null,
		imageCid: getBlobCidString(record.image) ?? null,
		startsAt,
		endsAt,
		approverDid: record.approver,
		createdAt: parseDate(record.createdAt) ?? new Date(),
		indexedAt: new Date(),
	};
	await db
		.insert(eventsTable)
		.values({ uri, ...values })
		.onConflictDoUpdate({ target: eventsTable.uri, set: values });
}

export async function putCheckpoint({ uri, did, cid, record }: RecordPut<r.checkpoint.Main>): Promise<void> {
	const location = parseLocation(record.location);
	if (!location) return logInvalid(uri, "invalid location");
	await ensureIndexed(record.event.uri, r.event.$nsid);

	const values = {
		cid,
		authorDid: did,
		eventUri: record.event.uri,
		eventCid: record.event.cid,
		record: toJson(record),
		name: record.name,
		point: record.point,
		latitude: location.latitude,
		longitude: location.longitude,
		radiusMeters: record.radiusMeters ?? 30,
		description: record.description ?? null,
		imageCid: getBlobCidString(record.image) ?? null,
		internalImageCids: (record.internalImages ?? []).map((blob) => getBlobCidString(blob)),
		createdAt: parseDate(record.createdAt) ?? new Date(),
		updatedAt: new Date(),
	};
	await db
		.insert(checkpointsTable)
		.values({ uri, ...values })
		.onConflictDoUpdate({ target: checkpointsTable.uri, set: values });
}

export async function putTeam({ uri, did, cid, record }: RecordPut<r.team.Main>): Promise<void> {
	await ensureIndexed(record.event.uri, r.event.$nsid);

	const members = [...new Set(record.members)];
	const values = {
		cid,
		authorDid: did,
		eventUri: record.event.uri,
		eventCid: record.event.cid,
		record: toJson(record),
		name: record.name,
		members,
		createdAt: parseDate(record.createdAt) ?? new Date(),
		indexedAt: new Date(),
	};
	db.transaction((tx) => {
		tx.insert(teamsTable)
			.values({ uri, ...values })
			.onConflictDoUpdate({ target: teamsTable.uri, set: values })
			.run();
		tx.delete(teamMembersTable).where(eq(teamMembersTable.teamUri, uri)).run();
		tx.insert(teamMembersTable)
			.values(members.map((memberDid) => ({ teamUri: uri, eventUri: record.event.uri, memberDid })))
			.run();
	});
}

export async function putSubmit({ uri, did, cid, record }: RecordPut<r.submit.Main>): Promise<void> {
	const location = parseLocation(record.location);
	if (!location) return logInvalid(uri, "invalid location");
	const [hasEvent, hasCheckpoint] = await Promise.all([
		ensureIndexed(record.event.uri, r.event.$nsid),
		ensureIndexed(record.checkpoint.uri, r.checkpoint.$nsid),
	]);
	// 外部キー制約があるので参照先が取れないものは保存できない
	if (!hasEvent || !hasCheckpoint) return logInvalid(uri, "referenced event or checkpoint not found");

	const values = {
		cid,
		authorDid: did,
		eventUri: record.event.uri,
		eventCid: record.event.cid,
		checkpointUri: record.checkpoint.uri,
		checkpointCid: record.checkpoint.cid,
		record: toJson(record),
		photoCid: getBlobCidString(record.photo),
		photoMimeType: record.photo.mimeType,
		photoSize: isLegacyBlobRef(record.photo) ? 0 : record.photo.size,
		latitude: location.latitude,
		longitude: location.longitude,
		createdAt: parseDate(record.createdAt) ?? new Date(),
		indexedAt: new Date(),
	};
	await db
		.insert(submitsTable)
		.values({ uri, ...values })
		.onConflictDoUpdate({ target: submitsTable.uri, set: values });
}

// 承認者として正当かどうかはクエリ時に event.approver と突き合わせる
export async function putApprove({ uri, did, record }: RecordPut<r.approve.Main>): Promise<void> {
	await ensureIndexed(record.submit.uri, r.submit.$nsid);
	const values = {
		submitUri: record.submit.uri,
		submitCid: record.submit.cid,
		approverDid: did,
		reason: record.reason ?? null,
		createdAt: parseDate(record.createdAt) ?? new Date(),
	};
	await db
		.insert(approveTable)
		.values({ uri, ...values })
		.onConflictDoUpdate({ target: approveTable.uri, set: values });
}

export async function putReject({ uri, did, record }: RecordPut<r.reject.Main>): Promise<void> {
	await ensureIndexed(record.submit.uri, r.submit.$nsid);
	const values = {
		submitUri: record.submit.uri,
		submitCid: record.submit.cid,
		approverDid: did,
		reason: record.reason ?? null,
		createdAt: parseDate(record.createdAt) ?? new Date(),
	};
	await db
		.insert(rejectTable)
		.values({ uri, ...values })
		.onConflictDoUpdate({ target: rejectTable.uri, set: values });
}

export function deleteRecord(collection: string, uri: string): void {
	// submits は events / checkpoints を外部キー参照しているので先に消す
	db.transaction((tx) => {
		switch (collection) {
			case r.event.$nsid:
				tx.delete(submitsTable).where(eq(submitsTable.eventUri, uri)).run();
				tx.delete(eventsTable).where(eq(eventsTable.uri, uri)).run();
				break;
			case r.checkpoint.$nsid:
				tx.delete(submitsTable).where(eq(submitsTable.checkpointUri, uri)).run();
				tx.delete(checkpointsTable).where(eq(checkpointsTable.uri, uri)).run();
				break;
			case r.team.$nsid:
				// team_members は外部キーの cascade で消える
				tx.delete(teamsTable).where(eq(teamsTable.uri, uri)).run();
				break;
			case r.submit.$nsid:
				tx.delete(submitsTable).where(eq(submitsTable.uri, uri)).run();
				break;
			case r.approve.$nsid:
				tx.delete(approveTable).where(eq(approveTable.uri, uri)).run();
				break;
			case r.reject.$nsid:
				tx.delete(rejectTable).where(eq(rejectTable.uri, uri)).run();
				break;
		}
	});
}

export async function indexRecord(collection: string, put: RecordPut<unknown>): Promise<void> {
	switch (collection) {
		case r.event.$nsid:
			await indexFetched(put, r.event.main, putEvent);
			break;
		case r.checkpoint.$nsid:
			await indexFetched(put, r.checkpoint.main, putCheckpoint);
			break;
		case r.team.$nsid:
			await indexFetched(put, r.team.main, putTeam);
			break;
		case r.submit.$nsid:
			await indexFetched(put, r.submit.main, putSubmit);
			break;
		case r.approve.$nsid:
			await indexFetched(put, r.approve.main, putApprove);
			break;
		case r.reject.$nsid:
			await indexFetched(put, r.reject.main, putReject);
			break;
		default:
			throw new Error(`unsupported collection: ${collection}`);
	}
}

// PDSから取ってきて索引できる参照先
const fetchable = {
	[r.event.$nsid]: { table: eventsTable, index: (put: RecordPut<unknown>) => indexFetched(put, r.event.main, putEvent) },
	[r.checkpoint.$nsid]: {
		table: checkpointsTable,
		index: (put: RecordPut<unknown>) => indexFetched(put, r.checkpoint.main, putCheckpoint),
	},
	[r.submit.$nsid]: { table: submitsTable, index: (put: RecordPut<unknown>) => indexFetched(put, r.submit.main, putSubmit) },
};

async function indexFetched<T>(
	put: RecordPut<unknown>,
	schema: { safeParse(input: unknown): { success: true; value: T } | { success: false; reason: unknown } },
	index: (put: RecordPut<T>) => Promise<void>,
): Promise<void> {
	const res = schema.safeParse(jsonToLex(put.record as Parameters<typeof jsonToLex>[0]));
	if (!res.success) return logInvalid(put.uri, res.reason);
	await index({ ...put, record: res.value });
}

const inflight = new Map<string, Promise<boolean>>();

/**
 * 参照先のレコードがまだDBに無ければPDSから取ってきて索引する。
 * Jetstreamの購読開始前に作られたレコードや、別リポジトリとの到着順の前後に対応するため。
 */
async function ensureIndexed(uri: string, collection: keyof typeof fetchable): Promise<boolean> {
	let parsed: AtUri;
	try {
		parsed = new AtUri(uri);
	} catch {
		return false;
	}
	if (!parsed.host.startsWith("did:") || parsed.collection !== collection) return false;
	const { table, index } = fetchable[collection];
	const exists = () => db.select({ uri: table.uri }).from(table).where(eq(table.uri, uri)).get() !== undefined;
	if (exists()) return true;

	const running = inflight.get(uri);
	if (running) return running;
	const promise = (async () => {
		try {
			const fetched = await fetchRecord(parsed.host, parsed.collection, parsed.rkey);
			if (!fetched) return false;
			await index({ uri, did: parsed.host, cid: fetched.cid, record: fetched.value });
			return exists();
		} catch (err) {
			console.warn(`failed to fetch ${uri}:`, err);
			return false;
		} finally {
			inflight.delete(uri);
		}
	})();
	inflight.set(uri, promise);
	return promise;
}

// DBには wire 形式 (blob は {$link}) の JSON で保存する
const toJson = (record: object) => lexToJson(record as Parameters<typeof lexToJson>[0]);

const parseDate = (value: string): Date | null => {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
};

const parseLocation = (location: { latitude: string; longitude: string }) => {
	const latitude = Number(location.latitude);
	const longitude = Number(location.longitude);
	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
	if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
	return { latitude, longitude };
};

export const logInvalid = (uri: string, reason: unknown): void => {
	console.warn(`skip invalid record ${uri}:`, reason instanceof Error ? reason.message : reason);
};
