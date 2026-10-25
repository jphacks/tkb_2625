import { AtUri } from "@atproto/syntax";
import { resolvePdsUrl } from "../resolver.js";
import { runMigrations } from "../db/migrate.js";
import * as r from "../client-lexicons/win/tomo-x/rogaining.js";
import { indexRecord } from "./indexer.js";

const collections = [
	r.event.$nsid,
	r.checkpoint.$nsid,
	r.team.$nsid,
	r.submit.$nsid,
	r.approve.$nsid,
	r.reject.$nsid,
];
const pageSize = 100;

type ListedRecord = { uri: string; cid: string; value: unknown };

async function listRecords(
	pdsUrl: string,
	repo: string,
	collection: string,
	cursor?: string,
): Promise<{ records: ListedRecord[]; cursor?: string }> {
	const url = new URL("/xrpc/com.atproto.repo.listRecords", pdsUrl);
	url.searchParams.set("repo", repo);
	url.searchParams.set("collection", collection);
	url.searchParams.set("limit", String(pageSize));
	if (cursor) url.searchParams.set("cursor", cursor);

	const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
	if (!response.ok) {
		throw new Error(`listRecords failed for ${repo}/${collection} (status ${response.status})`);
	}

	const data: unknown = await response.json();
	if (typeof data !== "object" || data === null || !("records" in data) || !Array.isArray(data.records)) {
		throw new Error(`invalid listRecords response for ${repo}/${collection}`);
	}
	const records: ListedRecord[] = data.records.map((record: unknown) => {
		if (
			typeof record !== "object" ||
			record === null ||
			!("uri" in record) ||
			typeof record.uri !== "string" ||
			!("cid" in record) ||
			typeof record.cid !== "string" ||
			!("value" in record)
		) {
			throw new Error(`invalid record in listRecords response for ${repo}/${collection}`);
		}
		let uri: AtUri;
		try {
			uri = new AtUri(record.uri);
		} catch {
			throw new Error(`invalid record URI in listRecords response for ${repo}/${collection}`);
		}
		if (uri.host !== repo || uri.collection !== collection) {
			throw new Error(`unexpected record URI ${record.uri} in listRecords response for ${repo}/${collection}`);
		}
		return { uri: record.uri, cid: record.cid, value: record.value };
	});
	if ("cursor" in data && data.cursor !== undefined && typeof data.cursor !== "string") {
		throw new Error(`invalid cursor in listRecords response for ${repo}/${collection}`);
	}

	return {
		records,
		cursor: "cursor" in data ? (data.cursor as string | undefined) : undefined,
	};
}

async function backfillRepo(repo: string): Promise<void> {
	const pdsUrl = await resolvePdsUrl(repo);
	if (!pdsUrl) throw new Error(`could not resolve PDS for ${repo}`);

	let total = 0;
	let failed = 0;
	for (const collection of collections) {
		let cursor: string | undefined;
		const seenCursors = new Set<string>();
		let count = 0;

		do {
			const page = await listRecords(pdsUrl, repo, collection, cursor);
			if (page.cursor && seenCursors.has(page.cursor)) {
				throw new Error(`listRecords returned a repeated cursor for ${repo}/${collection}`);
			}
			for (const record of page.records) {
				try {
					await indexRecord(collection, {
						uri: record.uri,
						did: repo,
						cid: record.cid,
						record: record.value,
					});
				} catch (error) {
					failed++;
					console.error(`Failed to index ${record.uri}:`, error);
				}
				count++;
			}

			cursor = page.cursor;
			if (cursor) seenCursors.add(cursor);
		} while (cursor);

		total += count;
		console.info(`Processed ${count} ${collection} records for ${repo}`);
	}
	console.info(`Backfill complete for ${repo}: processed ${total} records, ${failed} failed`);
	if (failed > 0) throw new Error(`failed to index ${failed} records for ${repo}`);
}

async function main(): Promise<void> {
	const repos = [...new Set(process.argv.slice(2))];
	if (repos.length === 0) {
		throw new Error("Usage: pnpm ingest:backfill <repo-did> [repo-did ...]");
	}

	runMigrations();
	for (const repo of repos) await backfillRepo(repo);
}

main().catch((error: unknown) => {
	console.error("Backfill failed:", error);
	process.exitCode = 1;
});
