import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CircleHelp, LogOut, X } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useDialog } from '../hooks/useDialog';
import { cn } from '../lib/cn';
import { iconButton, skipLink } from '../lib/ui';

export const APP_NAME = 'AtRogaining';

/** 本文へのスキップリンク */
export function SkipLink({ target }: { target: string }) {
  return <a className={skipLink} href={`#${target}`}>本文へ移動</a>;
}

/** サイトヘッダー。children はロゴの右側に並ぶ。ログイン中は右端にログアウトを出す */
export function SiteHeader({ to, children }: { to: string; children?: ReactNode }) {
  const { session, signOut } = useAuth();
  return <header className="bg-accent text-bg">
    <div className="mx-auto flex h-11 max-w-[1200px] items-center gap-3 px-4 max-sm:px-3">
      <Link to={to} className="shrink-0 text-[15px] font-bold">{APP_NAME}</Link>
      <div className="flex min-w-0 flex-1 items-center gap-3">{children}</div>
      {session && <button type="button" className={cn(iconButton, 'hover:not-disabled:bg-bg/15')} title="ログアウト" aria-label="ログアウト" onClick={() => void signOut()}><LogOut size={16}/></button>}
    </div>
  </header>;
}

/** 必要なときだけ開く説明。画面には ? ボタンだけを置く */
export function HelpButton({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className={cn(iconButton, 'size-7 text-fg/60', className)} aria-label={`${title}のヘルプ`} title="ヘルプ" onClick={() => setOpen(true)}><CircleHelp size={16}/></button>
    {open && <HelpDialog title={title} close={() => setOpen(false)}>{children}</HelpDialog>}
  </>;
}

function HelpDialog({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  const { dialog, onClose } = useDialog(title, close);
  return <dialog ref={dialog} onClose={onClose} className="m-auto w-[min(480px,calc(100%-24px))] border border-fg bg-bg p-0 text-fg" aria-labelledby="help-title" onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }}>
    <div className="flex h-10 items-center justify-between border-b border-fg/10 pl-4"><h2 id="help-title" className="text-[14px] font-bold">{title}</h2><button type="button" className={iconButton} aria-label="閉じる" onClick={() => dialog.current?.close()}><X size={16}/></button></div>
    <div className="space-y-2 p-4 text-[13px] leading-relaxed [&_li]:ml-4 [&_li]:list-disc">{children}</div>
  </dialog>;
}
