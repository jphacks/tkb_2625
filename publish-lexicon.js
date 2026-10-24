// Publishes every lexicon under mylexicons/ to the account's repo as
// com.atproto.lexicon.schema records (rkey = NSID).
//
// Usage: node --env-file=.env publish-lexicon.ts
// .env: ATPROTO_DID=did:plc:xxxx / ATPROTO_PASSWORD=app-password
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const LEXICON_DIR = "mylexicons";
const COLLECTION = "com.atproto.lexicon.schema";

function loadEnv(){
	let did=process.env.ATPROTO_DID
	let password=process.env.ATPROTO_PASSWORD
	if (!did || !password) {
		process.loadEnvFile()
		did = did||process.env.ATPROTO_DID;
		password = password||process.env.ATPROTO_PASSWORD;
		if(!did || !password) {
			throw new Error("ATPROTO_DID and ATPROTO_PASSWORD must be set in .env");
		}
	}
	return { did, password };
}

const { did, password } = loadEnv();

async function resolvePds(did){
	const url = did.startsWith("did:web:")
		? `https://${did.slice("did:web:".length)}/.well-known/did.json`
		: `https://plc.directory/${did}`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`failed to resolve ${did}: ${res.status}`);
	const doc = (await res.json())
	const pds = doc.service?.find((s) => s.id === "#atproto_pds");
	if (!pds) throw new Error(`no PDS found in DID document of ${did}`);
	return pds.serviceEndpoint;
}

async function xrpc(
	pds,
	nsid,
	body,
	token,
){
	const res = await fetch(`${pds}/xrpc/${nsid}`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			...(token ? { authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify(body),
	});
	if (!res.ok) throw new Error(`${nsid} failed: ${res.status} ${await res.text()}`);
	return (await res.json()) ;
}

async function* walk(dir){
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) yield* walk(path);
		else if (entry.name.endsWith(".json")) yield path;
	}
}

const pds = await resolvePds(did);
const session = await xrpc(pds, "com.atproto.server.createSession", {
	identifier: did,
	password,
});

for await (const path of walk(LEXICON_DIR)) {
	const lexicon = JSON.parse(await readFile(path, "utf8")) ;
	await xrpc(
		pds,
		"com.atproto.repo.putRecord",
		{
			repo: did,
			collection: COLLECTION,
			rkey: lexicon.id,
			record: { $type: COLLECTION, ...lexicon },
		},
		session.accessJwt,
	);
	console.log(`published ${lexicon.id}`);
}
