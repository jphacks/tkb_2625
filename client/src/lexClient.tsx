import { Client } from '@atproto/lex';
import { createContext, useContext, useState, type ReactNode } from 'react';

// TODO: atproto-oauth のセッションから Client を作って provider に渡す
const LexClientContext = createContext<Client | null>(null);

export function LexClientProvider({ client, children }: { client?: Client; children: ReactNode }) {
  const [fallback] = useState(() => new Client(location.origin));
  return <LexClientContext.Provider value={client ?? fallback}>{children}</LexClientContext.Provider>;
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
 * @example レコードを作成する（ログイン済みの Client が必要）
 * ```tsx
 * import { currentDatetimeString, toDatetimeString } from '@atproto/lex';
 * import { r } from './lex';
 *
 * const client = useLexClient();
 * const { uri, cid } = await client.create(r.event, {
 *   name: '代々木ロゲイニング',
 *   approver: client.assertDid, // 未ログインなら throw
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
