import { isCreate, Jetstream } from "@bsky/jetstream"
import { DidResolver, MemoryCache, getPds } from "@atproto/did-resolver"
import * as r from "./lexicons/win/tomo-x/rogaining"
import { BlobRef, Client, Schema, isLegacyBlobRef, jsonToLex } from "@atproto/lex"
import { TTLCache } from "@isaacs/ttlcache"
import { execa } from "execa"
import PQueue from "p-queue"
import { AtUri, currentDatetimeString, isValidDid } from "@atproto/syntax"
import { PasswordSession } from "@atproto/lex-password-session"

const jetstream = new Jetstream("https://jetstream.us-east.bsky.network")

const collections = [r.submit]

process.loadEnvFile()
const { DID, PASSWORD } = process.env
if (DID == null || PASSWORD == null || !isValidDid(DID)) {
	throw new Error("DID and PASSWORD must be set in environment variables")
}
const session = await PasswordSession.login({
	identifier: DID,
	password: PASSWORD,
	service: process.env.HOST ?? "https://bsky.social",
})
const approverClient = new Client(session)

const queue = new PQueue({ concurrency: 3 })

// 判定CLI: 引数 [query, ...refs] を受け取り、到達なら exit 0 を返す
const JUDGE_CMD = process.env.JUDGE_CMD?.split(" ") ?? ["python3", "judgman/judge_cli.py"]

for await (const event of jetstream.live({ collections })) {
	if (!isCreate(event, r.submit)) continue
	// キューに積むだけにして、イベント受信をブロックしない
	void queue.add(async () => {
		try {
			const { record } = event.commit
			const eventRecord = await getRecord(record.event.uri, r.event.main)
			if (eventRecord.data.approver !== DID) return

			const checkpoint = await getRecord(record.checkpoint.uri, r.checkpoint.main)
			if (checkpoint.data.isGoal) return

			const imageUrls = await Promise.all([
				getBlobUrl(event.did, record.photo),
				...(await Promise.all(
					(checkpoint.data.internalImages ?? []).map((blobRef) =>
						getBlobUrl(checkpoint.did, blobRef),
					),
				)),
			])
			// 判定NGは非ゼロ終了なので、例外にせず終了コードで判断する
			const result = await execa(JUDGE_CMD[0], [...JUDGE_CMD.slice(1), ...imageUrls], { reject: false })
			if (result.exitCode === 0) {
				await approverClient.create(r.approve, {
					submit: {
						uri: `at://${event.did}/${event.commit.collection}/${event.commit.rkey}`,
						cid: event.commit.cid,
					},
					createdAt: currentDatetimeString(),
				})
			}
		} catch (err) {
			// 1件の失敗で他の処理を止めない
			console.error(`Failed to process submit from ${event.did}:`, err)
		}
	})
}

const resolver = new DidResolver({ timeout: 60 * 1000 }, new MemoryCache())
async function resolvePdsUrl(did: string): Promise<string> {
	const doc = await resolver.resolveDid(did)
	if (doc == null) {
		throw new Error(`Failed to resolve DID: ${did}`)
	}
	const pds = getPds(doc)
	if (pds == null) {
		throw new Error(`No PDS found for DID: ${did}`)
	}
	return pds
}

const recordCache = new TTLCache<string, { did: string; data: any }>({ ttl: 60 * 1000 })
type ExtractRecordType<T> = T extends Schema<infer V> ? V : unknown
async function getRecord<L extends Schema<any>>(
	uri: string,
	lexicon: L,
): Promise<{ data: ExtractRecordType<L>; did: string }> {
	const cached = recordCache.get(uri)
	if (cached != null) {
		return cached
	}
	const { did, collection, rkey } = new AtUri(uri)
	const pdsUrl = await resolvePdsUrl(did)
	const url = new URL("/xrpc/com.atproto.repo.getRecord", pdsUrl)
	url.search = new URLSearchParams({ repo: did, collection, rkey }).toString()
	const res = await fetch(url)
	if (!res.ok) {
		throw new Error(`Failed to fetch record ${uri}: ${res.status}`)
	}
	// レスポンスは { uri, cid, value } なので value を検証する
	const { value } = (await res.json()) as { value: any }
	// validate() は不正なら例外を投げ、正しければ値を返す
	const data = lexicon.validate(jsonToLex(value))
	const result = { data, did }
	recordCache.set(uri, result)
	return result
}

async function getBlobUrl(did: string, blobRef: BlobRef): Promise<string> {
	const pdsUrl = await resolvePdsUrl(did)
	const cid = isLegacyBlobRef(blobRef) ? blobRef.cid : blobRef.ref.toString()
	const url = new URL("/xrpc/com.atproto.sync.getBlob", pdsUrl)
	url.search = new URLSearchParams({ did, cid }).toString()
	return url.toString()
}
