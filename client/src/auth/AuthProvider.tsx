import type { OAuthSession } from '@atproto/oauth-client-browser';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LexClientProvider } from '../lib/lexClient';
import { errorMessage } from '../lib/utils';
import { empty } from '../lib/ui';
import { initOAuth, oauthClient, onSessionDeleted } from './oauth';

type AuthContextValue = {
  session: OAuthSession | null;
  /** 認可サーバーへリダイレクトする。ログイン後は returnTo に戻る */
  signIn: (handle: string, returnTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

/** /login に渡す location.state */
export type LoginLocationState = { from?: string; error?: string } | null;

const AuthContext = createContext<AuthContextValue | null>(null);

// OAuth の state はそのまま遷移先に使うので、同一オリジンのパスだけ許す
const safeReturnTo = (path: string | null | undefined) => path?.startsWith('/') && !path.startsWith('//') ? path : '/';

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<OAuthSession | null>(null);

  useEffect(() => {
    let active = true;
    initOAuth().then(({ session, state }) => {
      if (!active) return;
      setSession(session ?? null);
      // state が返ってくるのはコールバックを処理したときだけ
      if (state !== undefined) navigate(safeReturnTo(state), { replace: true });
    }, (error: unknown) => {
      if (!active) return;
      navigate('/login', { replace: true, state: { error: `ログインできませんでした: ${errorMessage(error)}` } satisfies LoginLocationState });
    }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
    // 初回だけ実行する (navigate はロケーションが変わるたびに変わるので依存に入れない)
  }, []);

  // リフレッシュ失敗や別タブでのログアウト
  useEffect(() => onSessionDeleted(sub => setSession(current => current?.sub === sub ? null : current)), []);

  const signIn = useCallback(async (handle: string, returnTo?: string) => {
    await oauthClient.signInRedirect(handle, { state: safeReturnTo(returnTo) });
  }, []);
  const signOut = useCallback(async () => {
    try { await session?.signOut(); }
    finally { setSession(null); }
  }, [session]);
  const value = useMemo(() => ({ session, signIn, signOut }), [session, signIn, signOut]);

  if (!ready) return <main className={empty} role="status">ログイン状態を確認しています…</main>;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used within AuthProvider');
  return auth;
}

/** 未ログインなら /login へ飛ばし、ログイン済みならセッションの Client を配る */
export function RequireAuth() {
  const { session } = useAuth();
  const location = useLocation();
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash } satisfies LoginLocationState} />;
  return <LexClientProvider session={session}><Outlet /></LexClientProvider>;
}
