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
