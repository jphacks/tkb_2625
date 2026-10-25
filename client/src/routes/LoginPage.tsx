import { useRef, useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { AtPassportIcon, AtPassportUI } from '@atpassport/client/ui';
import { useAuth, type LoginLocationState } from '../auth/AuthProvider';
import { chooseHandleWithAtPassport } from '../auth/atpassport';
import { errorMessage } from '../lib/utils';
import { cn } from '../lib/cn';
import { button, buttonPrimary, input } from '../lib/ui';
import { HelpButton, SiteHeader, SkipLink } from '../components/SiteChrome';

export default function LoginPage() {
  const { session, signIn } = useAuth();
  const locationState = useLocation().state as LoginLocationState;
  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(locationState?.error ?? '');
  const handleInput = useRef<HTMLInputElement>(null);

  if (session) return <Navigate to={locationState?.from ?? '/'} replace />;

  async function start(chooseHandle: () => Promise<string | null>) {
    setBusy(true); setMessage('');
    try {
      const chosen = await chooseHandle();
      // null はユーザーが選択をやめたか、@passport へリダイレクト中
      if (!chosen) { setBusy(false); return; }
      await signIn(chosen, locationState?.from);
      // 成功すると認可サーバーへ遷移するので busy のままにしておく
    } catch (error) {
      setMessage(`ログインを開始できませんでした: ${errorMessage(error)}`); setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void start(async () => handle.trim());
  }

  return <div className="flex min-h-dvh flex-col">
    <SkipLink target="login-main"/>
    <SiteHeader to="/login"/>

    <main id="login-main" className="mx-auto w-full max-w-[360px] px-4 py-8 max-sm:py-6">
      <section className="border border-fg/25 p-4" aria-labelledby="login-title">
        <div className="mb-3 flex items-center justify-between"><h1 id="login-title" className="text-[15px] font-bold">ログイン</h1><HelpButton title="ログイン"><p>{AtPassportUI.ja.description}</p><p>ハンドルは AT Protocol のアカウント（Bluesky など）のものを入力します。</p></HelpButton></div>
        <button type="button" className={cn(buttonPrimary, 'w-full')} disabled={busy} onClick={() => void start(() => chooseHandleWithAtPassport(handleInput.current ?? undefined, locationState?.from))}><AtPassportIcon size={18} aria-hidden="true"/>{busy ? '移動しています…' : AtPassportUI.ja.title}</button>
        <div className="my-3 flex items-center gap-3 text-[12px] text-fg/60 before:flex-1 before:border-t before:border-fg/10 before:content-[''] after:flex-1 after:border-t after:border-fg/10 after:content-['']"><span>または</span></div>
        <form onSubmit={submit}>
          <label htmlFor="handle" className="sr-only">ハンドル</label>
          <div className="flex gap-2">
            {/* name / id="handle" は @passport 拡張機能の入力アシストが拾う目印 */}
            <input className={cn(input, 'min-w-0 flex-1')} ref={handleInput} id="handle" name="handle" required autoComplete="username" autoCapitalize="none" spellCheck={false} value={handle} onChange={e => setHandle(e.target.value)} placeholder="you.bsky.social"/>
            <button className={button} disabled={busy}><LogIn size={16}/><span>ログイン</span></button>
          </div>
        </form>
        <p className="mt-3 min-h-[1.5em] text-[13px] font-bold" role="status">{message || ' '}</p>
      </section>
    </main>
  </div>;
}
