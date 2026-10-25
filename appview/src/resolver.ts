import type { ProfileViewBasic } from "./lexicons/types/app/bsky/actor/defs.js";
import { type DidDocument, MemoryCache, IdResolver, getPds } from "@atproto/identity";

const idResolver = new IdResolver({ didCache: new MemoryCache() });

const profileCache = new Map<string, Promise<ProfileViewBasic>>();
const blobUrlCache = new Map<string, Promise<string | undefined>>();

export async function resolvePdsUrl(did: string): Promise<string | null> {
	const doc = await idResolver.did.resolve(did);
	if (doc == null) {
		return null;
	}
	return getPds(doc) || null;
}

export async function resolveDiddoc(did: string, forceRefresh: boolean): Promise<DidDocument | null> {
	return idResolver.did.resolve(did, forceRefresh);
}

export async function resolveProfileBasic(did: string): Promise<ProfileViewBasic> {
	const cached = profileCache.get(did);
	if (cached) return cached;

	const promise = (async () => {
		const url = new URL("https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile");
		url.searchParams.set("actor", did);
		const res = await fetch(url);
		if (!res.ok) {
			throw new Error(`profile not found for DID: ${did} (status ${res.status})`);
		}
		const data = (await res.json()) as { handle?: string; displayName?: string; avatar?: string };
		if (!data.handle) {
			throw new Error(`handle not found for DID: ${did}`);
		}
		return { did, handle: data.handle, displayName: data.displayName, avatar: data.avatar };
	})();

	profileCache.set(did, promise);
	promise.catch(() => profileCache.delete(did));
	return promise;
}

export async function resolveBlobUrl(did: string, cid: string | null): Promise<string | undefined> {
	if (!cid) return undefined;
	const cacheKey = `${did}:${cid}`;
	const cached = blobUrlCache.get(cacheKey);
	if (cached) return cached;

	const promise = (async () => {
		const pdsUrl = await resolvePdsUrl(did);
		if (!pdsUrl) return undefined;
		const url = new URL("/xrpc/com.atproto.sync.getBlob", pdsUrl);
		url.searchParams.set("did", did);
		url.searchParams.set("cid", cid);
		return url.toString();
	})();

	blobUrlCache.set(cacheKey, promise);
	promise.catch(() => blobUrlCache.delete(cacheKey));
	return promise;
}

// プロフィールが取れなくてもレスポンス全体を失敗させない
export async function resolveProfileBasicOrFallback(did: string): Promise<ProfileViewBasic> {
	return resolveProfileBasic(did).catch((err) => {
		console.warn(err);
		return { did, handle: "handle.invalid" };
	});
}

// DID が解決できない場合は URL なしとして扱う
export async function resolveBlobUrlOrUndefined(did: string, cid: string | null): Promise<string | undefined> {
	return resolveBlobUrl(did, cid).catch((err) => {
		console.warn(`failed to resolve blob url for ${did}:`, err);
		return undefined;
	});
}

export type FetchedRecord = { uri: string; cid: string; value: unknown };

export async function fetchRecord(did: string, collection: string, rkey: string): Promise<FetchedRecord | null> {
	const pdsUrl = await resolvePdsUrl(did);
	if (!pdsUrl) return null;
	const url = new URL("/xrpc/com.atproto.repo.getRecord", pdsUrl);
	url.search = new URLSearchParams({ repo: did, collection, rkey }).toString();
	const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
	if (!res.ok) return null;
	const data = (await res.json()) as Partial<FetchedRecord>;
	if (typeof data.uri !== "string" || typeof data.cid !== "string" || data.value == null) return null;
	return { uri: data.uri, cid: data.cid, value: data.value };
}
