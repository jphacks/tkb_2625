import { and, eq, inArray, type InferSelectModel } from "drizzle-orm";
import { db } from "../db/index.js";
import { checkpointsTable, eventsTable, type submitsTable, teamsTable } from "../db/schema.js";
import type {
	CheckpointView,
	EventView,
	SubmissionView,
	TeamView,
} from "../lexicons/types/win/tomo-x/rogaining/defs.js";
import type { ProfileViewBasic } from "../lexicons/types/app/bsky/actor/defs.js";
import { resolveProfileBasicOrFallback, resolveBlobUrlOrUndefined } from "../resolver.js";
import type { SubmissionWithReview } from "./submissions.js";

export type EventRow = InferSelectModel<typeof eventsTable>;
export type CheckpointRow = InferSelectModel<typeof checkpointsTable>;
export type TeamRow = InferSelectModel<typeof teamsTable>;
export type SubmitRow = InferSelectModel<typeof submitsTable>;

export type EventCounts = { teamCount: number; checkpointCount: number; participantCount: number };

export function buildEventView(
	row: EventRow,
	author: ProfileViewBasic,
	approver: ProfileViewBasic,
	imageUrl: string | undefined,
	counts?: EventCounts,
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
		...counts,
	};
}

export async function toEventView(row: EventRow, counts?: EventCounts): Promise<EventView> {
	const [author, approver, imageUrl] = await Promise.all([
	 resolveProfileBasicOrFallback(row.authorDid),
	 resolveProfileBasicOrFallback(row.approverDid),
	 resolveBlobUrlOrUndefined(row.authorDid, row.imageCid),
	]);

	return buildEventView(row, author, approver, imageUrl, counts);
}

export async function toEventViews(rows: EventRow[]): Promise<EventView[]> {
	const counts = await getEventCounts(rows);
	return Promise.all(rows.map((row) => toEventView(row, counts.get(row.uri))));
}

export async function findEvent(uri: string): Promise<EventRow | undefined> {
	const [row] = await db.select().from(eventsTable).where(eq(eventsTable.uri, uri)).limit(1);
	return row;
}

/** イベントの作成者が作ったチェックポイントだけを有効とみなす */
export async function findValidCheckpoints(event: EventRow): Promise<CheckpointRow[]> {
	return db
		.select()
		.from(checkpointsTable)
		.where(and(eq(checkpointsTable.eventUri, event.uri), eq(checkpointsTable.authorDid, event.authorDid)))
		.orderBy(checkpointsTable.createdAt, checkpointsTable.uri);
}

export type EventTeams = {
	/** 有効なチーム (作成順) */
	teams: TeamRow[];
	/** 参加者の DID → 所属チーム */
	teamOf: Map<string, TeamRow>;
	/** チームの URI → 実効メンバー (先に作られたチームに所属している人を除く) */
	membersOf: Map<string, string[]>;
};

/**
 * イベントの作成者が作ったチームだけを有効とみなす。
 * 1人が複数のチームに入っている場合は、最初に作られたチームの所属とする。
 */
export async function loadEventTeams(event: EventRow): Promise<EventTeams> {
	const teams = await db
		.select()
		.from(teamsTable)
		.where(and(eq(teamsTable.eventUri, event.uri), eq(teamsTable.authorDid, event.authorDid)))
		.orderBy(teamsTable.createdAt, teamsTable.uri);
	return groupTeams(teams);
}

function groupTeams(teams: TeamRow[]): EventTeams {
	const teamOf = new Map<string, TeamRow>();
	const membersOf = new Map<string, string[]>();
	for (const team of teams) {
		const members = team.members.filter((did) => !teamOf.has(did));
		for (const did of members) teamOf.set(did, team);
		membersOf.set(team.uri, members);
	}
	return { teams, teamOf, membersOf };
}

async function getEventCounts(rows: EventRow[]): Promise<Map<string, EventCounts>> {
	const result = new Map<string, EventCounts>();
	if (rows.length === 0) return result;
	const authorByEvent = new Map(rows.map((row) => [row.uri, row.authorDid]));
	const eventUris = [...authorByEvent.keys()];

	const [checkpoints, teams] = await Promise.all([
		db
			.select({ eventUri: checkpointsTable.eventUri, authorDid: checkpointsTable.authorDid })
			.from(checkpointsTable)
			.where(inArray(checkpointsTable.eventUri, eventUris)),
		db
			.select()
			.from(teamsTable)
			.where(inArray(teamsTable.eventUri, eventUris))
			.orderBy(teamsTable.createdAt, teamsTable.uri),
	]);

	for (const uri of eventUris) {
		const validTeams = teams.filter((team) => team.eventUri === uri && team.authorDid === authorByEvent.get(uri));
		result.set(uri, {
			teamCount: validTeams.length,
			checkpointCount: 0,
			participantCount: groupTeams(validTeams).teamOf.size,
		});
	}
	for (const cp of checkpoints) {
		if (authorByEvent.get(cp.eventUri) !== cp.authorDid) continue;
		result.get(cp.eventUri)!.checkpointCount++;
	}
	return result;
}

export async function toCheckpointView(row: CheckpointRow, includeInternal: boolean): Promise<CheckpointView> {
	const [imageUrl, internalImageUrls] = await Promise.all([
		resolveBlobUrlOrUndefined(row.authorDid, row.imageCid),
		includeInternal
			? Promise.all((row.internalImageCids ?? []).map((cid) => resolveBlobUrlOrUndefined(row.authorDid, cid)))
			: undefined,
	]);
	return {
		$type: "win.tomo-x.rogaining.defs#checkpointView",
		cid: row.cid,
		uri: row.uri,
		record: row.record as { [key: string]: unknown },
		indexedAt: row.updatedAt.toISOString(),
		imageUrl,
		internalImageUrls: internalImageUrls?.filter((url) => url !== undefined),
	};
}

export async function toTeamView(row: TeamRow, members: string[]): Promise<TeamView> {
	return {
		$type: "win.tomo-x.rogaining.defs#teamView",
		cid: row.cid,
		uri: row.uri,
		record: row.record as { [key: string]: unknown },
		members: await Promise.all(members.map((did) => resolveProfileBasicOrFallback(did))),
		indexedAt: row.indexedAt.toISOString(),
	};
}

export async function toSubmissionView(
	{ submit, checkpoint, approval, rejection }: SubmissionWithReview,
	event: EventRow,
	teamUri: string,
): Promise<SubmissionView> {
	const [author, photoUrl] = await Promise.all([
		resolveProfileBasicOrFallback(submit.authorDid),
		resolveBlobUrlOrUndefined(submit.authorDid, submit.photoCid),
	]);
	// findSubmissions がどちらか一方だけを決めている
	const decision = approval ?? rejection;
	return {
		$type: "win.tomo-x.rogaining.defs#submissionView",
		cid: submit.cid,
		uri: submit.uri,
		author,
		team: teamUri,
		record: submit.record as { [key: string]: unknown },
		status: approval ? "approved" : rejection ? "rejected" : "pending",
		photoUrl,
		indexedAt: submit.indexedAt.toISOString(),
		approvalUri: approval?.uri,
		rejectionUri: approval ? undefined : rejection?.uri,
		reason: decision?.reason ?? undefined,
		distanceMeters: Math.round(distanceMeters(submit, checkpoint)),
		withinEventPeriod: event.startsAt <= submit.createdAt && submit.createdAt <= event.endsAt,
	};
}

type LatLng = { latitude: number; longitude: number };

// haversine
function distanceMeters(a: LatLng, b: LatLng): number {
	const R = 6_371_000;
	const rad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = rad(b.latitude - a.latitude);
	const dLng = rad(b.longitude - a.longitude);
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
