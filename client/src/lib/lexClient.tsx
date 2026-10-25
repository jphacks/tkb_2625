import { Client } from '@atproto/lex';
import type { OAuthSession } from '@atproto/oauth-client-browser';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { APPVIEW_SERVICE } from '../auth/clientMetadata';

const LexClientContext = createContext<Client | null>(null);

/**
 * OAuth セッションから lex の Client を作って配る。
 * xrpc は PDS 経由で appview にプロキシされ (atproto-proxy)、create / uploadBlob などのレコード操作は PDS に直接届く。
 */
export function LexClientProvider({ session, children }: { session: OAuthSession; children: ReactNode }) {
  const client = useMemo(() => new Client(session, { service: APPVIEW_SERVICE }), [session]);
  return <LexClientContext.Provider value={client}>{children}</LexClientContext.Provider>;
}

/**
 * LexClientProvider の中で lex の Client を取得する。
 * lexicon の定義は `./lex` の `r` などを渡すと、params / body / レスポンスが型補完される。
 *
 * @example query を叩く
 * ```tsx
 * import { r } from './lex';
 *
 * const client = useLexClient();
 * const { body } = await client.xrpc(r.getEvent, {
 *   params: { event: 'at://did:plc:xxx/win.tomo-x.rogaining.event/xxx' },
 * });
 * body.event; // EventView
 * body.teams; // TeamView[]
 * ```
 *
 * @example レコードを作成する
 * ```tsx
 * import { currentDatetimeString, toDatetimeString } from '@atproto/lex';
 * import { r } from './lex';
 *
 * const client = useLexClient();
 * const { uri, cid } = await client.create(r.event, {
 *   name: '代々木ロゲイニング',
 *   approver: client.assertDid,
 *   startsAt: currentDatetimeString(),
 *   endsAt: toDatetimeString(Date.now() + 3 * 60 * 60 * 1000),
 *   createdAt: currentDatetimeString(),
 * });
 * ```
 *
 * datetime 系のフィールドは DatetimeString 型なので、`new Date().toISOString()` ではなく
 * `currentDatetimeString()` / `toDatetimeString()` を使う。
 */
export function useLexClient(): Client {
  const client = useContext(LexClientContext);
  if (!client) throw new Error('useLexClient must be used within LexClientProvider');
  return client;
}
