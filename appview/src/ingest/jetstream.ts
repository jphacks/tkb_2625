import { type CommitHandlers, type CursorStore, Jetstream, LexIndexer, type PutEvent } from "@bsky/jetstream";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { jetstreamCursorTable } from "../db/schema.js";
import * as r from "../client-lexicons/win/tomo-x/rogaining.js";
import {
	deleteRecord,
	logInvalid,
	putApprove,
	putCheckpoint,
	putEvent,
	putReject,
	putSubmit,
	putTeam,
	type RecordPut,
} from "./indexer.js";

const JETSTREAM_URL = process.env.JETSTREAM_URL ?? "https://jetstream.us-east.bsky.network";
const RESTART_DELAY_MS = 10_000;

const cursorStore: CursorStore = {
	async load() {
		return db.select().from(jetstreamCursorTable).where(eq(jetstreamCursorTable.id, 1)).get()?.cursor;
	},
	async save(cursor) {
		db.insert(jetstreamCursorTable)
			.values({ id: 1, cursor })
			.onConflictDoUpdate({ target: jetstreamCursorTable.id, set: { cursor } })
			.run();
	},
};

// put は create と update の両方で呼ばれる
function handlers<T>(put: (put: RecordPut<T>) => Promise<void>): CommitHandlers<T> {
	return {
		put: (e: PutEvent<T>) => catchAndLog(e.uri, () => put({ uri: e.uri, did: e.did, cid: e.cid, record: e.record })),
		del: (e) => catchAndLog(e.uri, async () => deleteRecord(e.collection, e.uri)),
	};
}

// 1件の失敗で購読全体を止めない
async function catchAndLog(uri: string, fn: () => Promise<void>): Promise<void> {
	try {
		await fn();
	} catch (err) {
		console.error(`failed to index ${uri}:`, err);
	}
}

const indexer = new LexIndexer()
	.commit(r.event, handlers(putEvent))
	.commit(r.checkpoint, handlers(putCheckpoint))
	.commit(r.team, handlers(putTeam))
	.commit(r.submit, handlers(putSubmit))
	.commit(r.approve, handlers(putApprove))
	.commit(r.reject, handlers(putReject))
	.onValidationError((e) => logInvalid(e.uri, e.error));

export async function startJetstream(): Promise<never> {
	const jetstream = new Jetstream(JETSTREAM_URL);
	for (;;) {
		try {
			// 再接続はライブラリ側で行われるので、ここに来るのは致命的なエラーのときだけ
			await jetstream.runner(indexer).live({
				cursor: cursorStore,
				onError: (err) => console.error("jetstream error:", err),
				onInfo: (info) => console.info("jetstream info:", info.name, info.message ?? ""),
			});
		} catch (err) {
			console.error("jetstream stopped:", err);
		}
		await new Promise((resolve) => setTimeout(resolve, RESTART_DELAY_MS));
	}
}
