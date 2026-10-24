import type { ProfileViewBasic } from "./lexicons/types/app/bsky/actor/defs.js";
import { type DidDocument, MemoryCache, IdResolver, getPds } from "@atproto/identity";

const idResolver = new IdResolver({ didCache: new MemoryCache() });

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
	const doc = await resolveDiddoc(did, false);
	const handle = doc?.alsoKnownAs?.find(
		(value): value is string => typeof value === "string" && value.startsWith("at://"),
	)?.slice("at://".length);
	if (!handle) {
		throw new Error(`handle not found for DID: ${did}`);
	}
	return { did, handle };
}

export async function resolveBlobUrl(did: string, cid: string | null): Promise<string | undefined> {
	if (!cid) return undefined;
	const pdsUrl = await resolvePdsUrl(did);
	if (!pdsUrl) return undefined;
	return `${pdsUrl.replace(/\/$/, "")}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(did)}&cid=${encodeURIComponent(cid)}`;
}
