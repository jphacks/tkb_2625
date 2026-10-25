import { BrowserOAuthClient, buildAtprotoLoopbackClientMetadata, type OAuthSession } from '@atproto/oauth-client-browser';
import { CALLBACK_PATH, clientMetadata, OAUTH_SCOPE } from './clientMetadata';

const sessionDeletedListeners = new Set<(sub: string) => void>();

// 127.0.0.1 / localhost で動かしているときは loopback client (client metadata のホスティング不要) を使う。
// loopback client の redirect_uri は IP でないといけないので、dev server は 127.0.0.1 で開く (vite.config.ts)
const isLoopback = ['127.0.0.1', '[::1]', 'localhost'].includes(location.hostname);

export const oauthClient = new BrowserOAuthClient({
  clientMetadata: isLoopback
    ? buildAtprotoLoopbackClientMetadata({ scope: OAUTH_SCOPE, redirect_uris: [`http://127.0.0.1:${location.port}${CALLBACK_PATH}`] })
    : clientMetadata(location.origin),
  handleResolver: 'https://bsky.social',
  onSessionDeleted: sub => sessionDeletedListeners.forEach(listener => listener(sub)),
});

export type InitResult = { session?: OAuthSession; state?: string | null };

let initPromise: Promise<InitResult> | undefined;

/**
 * セッションの復元、またはコールバック URL なら認可コードの交換を行う。
 * コールバックは一度しか処理できないので、StrictMode で二度呼ばれても同じ Promise を返す
 */
export function initOAuth(): Promise<InitResult> {
  return initPromise ??= oauthClient.init().then(result => result ?? {});
}

export function onSessionDeleted(listener: (sub: string) => void) {
  sessionDeletedListeners.add(listener);
  return () => { sessionDeletedListeners.delete(listener); };
}
