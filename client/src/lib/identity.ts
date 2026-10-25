import { l, type Client, type DidString } from '@atproto/lex';

// com.atproto.identity.resolveHandle は生成済みの lexicon に含まれないので、必要な部分だけ定義する
const resolveHandle = l.query(
  'com.atproto.identity.resolveHandle',
  l.params({ handle: l.string({ format: 'handle' }) }),
  l.jsonPayload({ did: l.string({ format: 'did' }) }),
);

const DID = /^did:[a-z0-9]+:[A-Za-z0-9._:%-]+$/;
const HANDLE = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

/** 改行・カンマ・空白で区切られたハンドル / DID の入力を分割する */
export const splitIdentifiers = (text: string) => [...new Set(text.split(/[\s,、]+/).map(s => s.trim().replace(/^@/, '')).filter(Boolean))];

/** ハンドルまたは DID を DID にする。ハンドルはログイン中ユーザーの PDS で解決する */
export async function resolveDid(client: Client, identifier: string): Promise<DidString> {
  if (DID.test(identifier)) return identifier as DidString;
  if (!HANDLE.test(identifier)) throw new Error(`「${identifier}」はハンドルまたはDIDの形式ではありません。`);
  try {
    // service: null で appview へのプロキシを外し、PDS に直接問い合わせる
    const { body } = await client.xrpc(resolveHandle, { params: { handle: identifier as l.HandleString }, service: null });
    return body.did;
  } catch { throw new Error(`ハンドル「@${identifier}」を解決できませんでした。`); }
}

export const resolveDids = (client: Client, identifiers: string[]) => Promise.all(identifiers.map(id => resolveDid(client, id)));
