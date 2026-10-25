import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { errorMessage } from '../lib/utils';
import { empty } from '../lib/ui';
import { readAtPassportCallback } from './atpassport';
import { useAuth, type LoginLocationState } from './AuthProvider';

/** @passport から戻ってきたら、受け取ったハンドルでそのまま OAuth を始める */
export default function AtPassportCallback() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  // state は一度しか検証できないので、StrictMode の二重実行でも一回だけ処理する
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let returnTo: string | undefined;
    (async () => {
      const callback = readAtPassportCallback(location.href);
      returnTo = callback.returnTo;
      await signIn(callback.handle, returnTo);
    })().catch((error: unknown) => {
      navigate('/login', { replace: true, state: { from: returnTo, error: `@passport でログインできませんでした: ${errorMessage(error)}` } satisfies LoginLocationState });
    });
  }, [navigate, signIn]);

  return <main className={empty} role="status">ログイン画面へ移動しています…</main>;
}
