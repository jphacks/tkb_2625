import { useRef, useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ArrowRight, Compass, Leaf, LogIn, Sprout } from 'lucide-react';
import { AtPassportIcon, AtPassportUI } from '@atpassport/client/ui';
import { useAuth, type LoginLocationState } from '../auth/AuthProvider';
import { chooseHandleWithAtPassport } from '../auth/atpassport';
import { errorMessage } from '../lib/utils';
import { cn } from '../lib/cn';
import { button, buttonPrimary, eyebrow, liveDot } from '../lib/ui';
import { HeaderLabel, SiteFooter, SiteHeader, SkipLink } from '../components/SiteChrome';

const help = 'mt-[13px] text-[10px] leading-[1.8] text-muted';

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
    <SiteHeader to="/login" label="ROAM">
      <HeaderLabel className="flex items-center gap-[9px] text-ink max-sm:gap-1.5 max-xs:hidden"><span className={liveDot}/> YOYOGI ROGAINING <span className="border-l border-line pl-4 text-muted max-md:hidden">2026 / AUTUMN</span></HeaderLabel>
    </SiteHeader>

    <main id="login-main" className="m-auto grid w-[min(100%,1040px)] flex-1 grid-cols-[minmax(0,1fr)_minmax(0,400px)] items-center gap-[70px] px-8 py-16 max-[50rem]:grid-cols-[minmax(0,1fr)_minmax(0,360px)] max-[50rem]:gap-8 max-[50rem]:px-6 max-[50rem]:py-[45px] max-sm:max-w-[460px] max-sm:grid-cols-1 max-sm:gap-7 max-sm:px-5 max-sm:pt-[34px] max-sm:pb-10">
      <section className="min-w-0 pt-2 max-sm:p-0" aria-labelledby="login-welcome">
        <span className={cn(eyebrow, 'max-sm:text-[8px]')}>YOUR NEXT DISCOVERY</span>
        <h1 id="login-welcome" className="mt-[22px] mb-[18px] font-mincho text-[38px] leading-[1.65] font-medium tracking-[3px] max-[50rem]:text-[30px] max-[50rem]:tracking-[2px] max-sm:mt-3.5 max-sm:mb-3 max-sm:text-[28px] max-sm:leading-normal">いつもの街に、<br/>新しい発見を。</h1>
        <p className="text-[13px] leading-[2.1] tracking-[.5px] text-[#697660] max-[50rem]:text-[11px]">歩いて、見つけて、仲間とつながる。<br/>今日の寄り道を、特別な思い出に。</p>
        <div className="relative mt-[26px] overflow-hidden bg-[#eeeee3] max-sm:hidden" aria-hidden="true">
          <svg className="block h-auto w-full" viewBox="0 0 480 190" fill="none"><circle cx="365" cy="44" r="24" fill="#e9dfc5"/><path d="M0 120Q85 60 170 115T350 100T480 110V190H0Z" fill="#d2d9bf"/><path d="M0 160Q130 90 240 145T480 140V190H0Z" fill="#b7c5a3"/><path d="M120 190Q155 155 226 152T300 106" stroke="#eee6d0" strokeWidth="18"/><path d="M370 150V70" stroke="#71825f" strokeWidth="5"/><path d="M370 32L338 112H402Z" fill="#81946a"/><path d="M412 162V112" stroke="#71825f" strokeWidth="4"/><path d="M412 77L387 139H437Z" fill="#93a27b"/><path d="M275 108V58" stroke="#71825f" strokeWidth="3"/><path d="M276 58L304 66L276 78Z" fill="#ac7855"/></svg>
          <span className="absolute bottom-3 left-[15px] text-[7px] tracking-[1.3px] text-[#596b49]">YOYOGI FIELD / TOKYO</span>
        </div>
        <div className="mt-[18px] flex items-center gap-2 text-[10px] tracking-[.7px] text-[#748165] max-sm:hidden"><Leaf size={16}/><span>歩いた分だけ、街が好きになる。</span></div>
      </section>

      <section className="min-w-0 border border-line bg-[#fcfbf6] p-8 text-center max-[50rem]:p-[26px] max-sm:p-[23px]" aria-labelledby="login-title">
        <span className={cn(eyebrow, 'text-left text-[9px] tracking-[1.7px]')}>01 / SIGN IN</span>
        <div className="mx-auto mt-[30px] mb-[22px] grid size-[74px] place-items-center bg-[#e6ebda] text-olive max-sm:my-5 max-sm:size-[60px] max-sm:[&_svg]:w-[30px]" aria-hidden="true"><Sprout size={36} strokeWidth={1.3}/></div>
        <h2 id="login-title" className="mb-4 font-mincho text-[28px] font-medium tracking-[3px] max-sm:text-[25px]">ログイン</h2>
        <p className="text-xs leading-[1.9] text-[#697660] max-sm:text-[11px]">あなたのアカウントで、<br/>今日の冒険をはじめましょう。</p>
        <button type="button" className={cn(buttonPrimary, 'mt-[30px] min-h-14 w-full gap-2.5 px-3 py-4 max-sm:mt-6')} disabled={busy} aria-describedby="login-passport-help" onClick={() => void start(() => chooseHandleWithAtPassport(handleInput.current ?? undefined, locationState?.from))}><AtPassportIcon size={20} aria-hidden="true"/><span className="flex-1 text-left tracking-[.2px]">{busy ? '移動しています…' : AtPassportUI.ja.title}</span><ArrowRight size={18}/></button>
        <p id="login-passport-help" className={help}>{AtPassportUI.ja.description}</p>
        <div className="mt-6 flex items-center gap-3 text-[10px] tracking-[.5px] text-muted before:flex-1 before:border-t before:border-line before:content-[''] after:flex-1 after:border-t after:border-line after:content-['']"><span>またはハンドルを入力</span></div>
        <form className="mt-3.5 text-left" onSubmit={submit}>
          <label htmlFor="handle" className="sr-only">ハンドル</label>
          <div className="flex gap-2">
            {/* name / id="handle" は @passport 拡張機能の入力アシストが拾う目印 */}
            <input className="min-h-11 min-w-0 flex-1 border border-[#cdd3be] bg-[#faf9f3] px-3 py-[9px] text-xs text-ink" ref={handleInput} id="handle" name="handle" required autoComplete="username" autoCapitalize="none" spellCheck={false} value={handle} onChange={e => setHandle(e.target.value)} placeholder="you.bsky.social" aria-describedby="login-help"/>
            <button className={cn(button, 'whitespace-nowrap')} disabled={busy}><LogIn size={16}/><span>ログイン</span></button>
          </div>
          <p id="login-help" className={cn(help, 'mt-2')}>AT Protocolのアカウント（Blueskyなど）のハンドル</p>
        </form>
        <p className="mt-[15px] min-h-[22px] text-[11px] leading-[1.8] text-[#687554]" role="status">{message || '\u00a0'}</p>
        <div className="mt-[18px] flex items-center justify-center gap-2 border-t border-line pt-[21px] text-[9px] tracking-[.6px] text-[#7a846f] max-sm:text-[8px]"><Compass size={15}/><span>一歩先に、まだ知らない景色。</span></div>
      </section>
    </main>

    <SiteFooter/>
  </div>;
}
