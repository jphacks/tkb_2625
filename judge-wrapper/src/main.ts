import { isCreate, Jetstream, websocketTransport } from "@bsky/jetstream"
import { DidResolver, MemoryCache, getPds } from "@atproto/did-resolver"
import * as r from "./lexicons/win/tomo-x/rogaining.js"
import { type AtUriString, type BlobRef, Client, type Schema, isLegacyBlobRef, jsonToLex } from "@atproto/lex"
import { TTLCache } from "@isaacs/ttlcache"
import { execa } from "execa"
import PQueue from "p-queue"
import { AtUri, currentDatetimeString, isValidDid } from "@atproto/syntax"
import { PasswordSession } from "@atproto/lex-password-session"
import { existsSync } from "node:fs"

// 末尾の for await は終わらないので、そこで使う定数・関数はすべてこれより前に宣言しておく
// (後ろに置くと TDZ で "Cannot access ... before initialization" になる)

const JETSTREAM_URL = process.env.JETSTREAM_URL ?? "https://jetstream.us-east.bsky.network"

// 判定CLI: 末尾に [query, ...refs] を付けて呼ぶ。exit 0: 到達, 1: 不到達, それ以外: 判定不能
// judgman/main.py は先頭引数でモデルを選ぶ (0: SNN, 1: SIFT)
const JUDGE_CMD = process.env.JUDGE_CMD?.split(" ") ?? ["python3", "../judgman/main.py", "1"]

// 端末の時計ずれをどこまで許すか
const CLOCK_SKEW_MS = 5 * 60 * 1000
const DEFAULT_RADIUS_METERS = 30

const log = (...args: unknown[]) => console.log(new Date().toISOString(), ...args)
const warn = (...args: unknown[]) => console.warn(new Date().toISOString(), ...args)
const logError = (...args: unknown[]) => console.error(new Date().toISOString(), ...args)

// 妥当なら undefined、そうでなければ reject の理由 (チームに表示される) を返す
function validateSubmit(
	submit: r.submit.Main,
	event: r.event.Main,
	checkpoint: r.checkpoint.Main,
): string | undefined {
	if (checkpoint.event.uri !== submit.event.uri) {
		return "この大会のチェックポイントではありません"
	}

	const submittedAt = Date.parse(submit.createdAt)
	if (submittedAt < Date.parse(event.startsAt) || Date.parse(event.endsAt) < submittedAt) {
		return "大会期間外の提出です"
	}
	if (submittedAt > Date.now() + CLOCK_SKEW_MS) {
		return "提出時刻が未来になっています"
	}

	const from = parseLocation(submit.location)
	const to = parseLocation(checkpoint.location)
	if (from == null || to == null) {
		return "位置情報が不正です"
	}
	const distance = distanceMeters(from, to)
	const radius = checkpoint.radiusMeters ?? DEFAULT_RADIUS_METERS
	if (distance > radius) {
		return `チェックポイントから ${Math.round(distance)}m 離れています（許容 ${radius}m）`
	}
	return undefined
}

type LatLng = { latitude: number; longitude: number }

function parseLocation(location: r.defs.Location): LatLng | undefined {
	const latitude = Number(location.latitude)
	const longitude = Number(location.longitude)
	if (!Number.isFinite(latitude) || Math.abs(latitude) > 90) return undefined
	if (!Number.isFinite(longitude) || Math.abs(longitude) > 180) return undefined
	return { latitude, longitude }
}

// haversine
function distanceMeters(a: LatLng, b: LatLng): number {
	const R = 6_371_000
	const rad = (deg: number) => (deg * Math.PI) / 180
	const dLat = rad(b.latitude - a.latitude)
	const dLng = rad(b.longitude - a.longitude)
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2
	return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
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
		throw new Error(`Failed to fetch record ${uri}: ${res.status} ${await res.text().catch(() => "")}`)
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

// systemd では EnvironmentFile で渡すので .env が無くてもよい
if (existsSync(".env")) process.loadEnvFile()
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
log(`logged in as ${DID}; judge: ${JUDGE_CMD.join(" ")}; jetstream: ${JETSTREAM_URL}`)

type SubmitRef = r.approve.Main["submit"]

async function createVerdict(submit: SubmitRef, reason?: string) {
	const createdAt = currentDatetimeString()
	const { uri } = reason == null
		? await approverClient.create(r.approve, { submit, createdAt })
		: await approverClient.create(r.reject, { submit, reason, createdAt })
	log(`${submit.uri}: ${reason == null ? "approved" : `rejected (${reason})`} -> ${uri}`)
}

async function processSubmit(did: string, rkey: string, cid: SubmitRef["cid"], record: r.submit.Main) {
	const submit: SubmitRef = { uri: `at://${did}/${r.submit.$type}/${rkey}` as AtUriString, cid }
	const eventRecord = await getRecord(record.event.uri, r.event.main)
	if (eventRecord.data.approver !== DID) return
	log(`${submit.uri}: received (checkpoint ${record.checkpoint.uri})`)

	const checkpoint = await getRecord(record.checkpoint.uri, r.checkpoint.main)
	if (checkpoint.data.isGoal) {
		log(`${submit.uri}: skipped (goal)`)
		return
	}

	// 時間や距離が妥当でなければ画像判定せずに reject する
	const invalidReason = validateSubmit(record, eventRecord.data, checkpoint.data)
	if (invalidReason != null) {
		await createVerdict(submit, invalidReason)
		return
	}

	const imageUrls = await Promise.all([
		getBlobUrl(did, record.photo),
		...(checkpoint.data.internalImages ?? []).map((blobRef) => getBlobUrl(checkpoint.did, blobRef)),
	])
	const startedAt = Date.now()
	// 判定NGは非ゼロ終了なので、例外にせず終了コードで判断する。出力は並行実行で混ざらないようまとめて出す
	const result = await execa(JUDGE_CMD[0], [...JUDGE_CMD.slice(1), ...imageUrls], { reject: false, all: true })
	const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1)
	if (result.all) log(`${submit.uri}: judge output:\n${result.all}`)
	log(`${submit.uri}: judge exited with ${result.exitCode ?? result.signal ?? "?"} in ${elapsed}s`)
	if (result.exitCode === 0) {
		await createVerdict(submit)
	} else if (result.exitCode === 1) {
		await createVerdict(submit, "写真がチェックポイントと一致しませんでした")
	} else {
		// 判定不能は審査待ちのまま残す (主催者が手動で審査する)
		warn(`${submit.uri}: judge failed, left pending${result.failed && result.exitCode == null ? `: ${result.shortMessage}` : ""}`)
	}
}

const jetstream = new Jetstream(JETSTREAM_URL)
const queue = new PQueue({ concurrency: 3 })

for await (const event of jetstream.live({
	collections: [r.submit],
	onError: (err) => warn("jetstream: skipped an event:", err),
	liveTransport: websocketTransport({
		onReconnect: (err, { attempt }) => warn(`jetstream: reconnecting (attempt ${attempt})`, err),
	}),
})) {
	if (!isCreate(event, r.submit)) continue
	const { did, commit } = event
	// キューに積むだけにして、イベント受信をブロックしない
	void queue.add(async () => {
		try {
			await processSubmit(did, commit.rkey, commit.cid, commit.record)
		} catch (err) {
			// 1件の失敗で他の処理を止めない
			logError(`Failed to process submit at://${did}/${commit.collection}/${commit.rkey}:`, err)
		}
	})
}
