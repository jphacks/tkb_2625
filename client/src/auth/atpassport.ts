import { AtPassport } from '@atpassport/client/core';

/** @passport のリダイレクト方式で戻ってくるパス。認証より上位でルーティングする */
export const ATPASSPORT_CALLBACK_PATH = '/login/atpassport';

const STATE_KEY = 'atpassport:atpstate';

const passport = new AtPassport({ callbackUrl: `${location.origin}${ATPASSPORT_CALLBACK_PATH}`, lang: 'ja', fedcm: true });

/**
 * @passport でハンドルを選ばせる。
 * FedCM 対応ブラウザ (Chrome / Chromium 141+) ではブラウザのアカウント選択 UI を出してハンドルを返し、
 * 非対応なら @passport へリダイレクトする (戻り先は ATPASSPORT_CALLBACK_PATH)。
 * 返るハンドルは入力候補でしかないので、必ずこのハンドルで OAuth を始めること。
 */
export async function chooseHandleWithAtPassport(targetInput: HTMLInputElement | undefined, returnTo: string | undefined): Promise<string | null> {
  const result = await passport.requestHandleAssist({
    targetInput,
    fallback: () => {
      const { url, atpstate } = passport.generateAuthUrl(returnTo ? { returnTo } : undefined);
      sessionStorage.setItem(STATE_KEY, atpstate);
      location.assign(url);
      return null;
    },
  });
  return result?.username ?? null;
}

/** リダイレクト方式のコールバック URL からハンドルと戻り先を取り出す */
export function readAtPassportCallback(url: string): { handle: string; returnTo?: string } {
  const expectedState = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  // parseCallback は expectedState が空だと state を検証しないので、ここで弾く
  if (!expectedState) throw new Error('@passport の連携を開始した記録がありません。もう一度お試しください。');
  const { handle, customParams } = passport.parseCallback(url, expectedState);
  if (!handle) throw new Error('@passport からハンドルを受け取れませんでした。');
  return { handle, returnTo: customParams.returnTo };
}
