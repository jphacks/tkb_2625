import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { cn } from '../lib/cn';
import { skipLink } from '../lib/ui';

/** 本文へのスキップリンク */
export function SkipLink({ target }: { target: string }) {
  return <a className={skipLink} href={`#${target}`}>本文へ移動</a>;
}

/** ROAM のロゴとサイトヘッダー。children はロゴの右側に並ぶ */
export function SiteHeader({ to, label, children }: { to: string; label: string; children?: ReactNode }) {
  return <header className="border-b border-line">
    <div className="mx-auto flex min-h-[86px] max-w-[1160px] items-center gap-[30px] px-8 max-sm:min-h-[69px] max-sm:gap-3.5 max-sm:px-[18px]">
      <Link to={to} className="flex min-h-11 items-center gap-[11px] [&>svg]:max-sm:w-[27px]" aria-label={label}><Compass size={31} strokeWidth={1.5}/><span className="text-[28px] leading-none font-bold tracking-[4px] max-sm:text-2xl">ROAM<span className="mt-2 block text-[7px] font-medium tracking-[1.65px] max-sm:text-[6px] max-sm:tracking-[1.1px]">ROGAINING FIELD NOTES</span></span></Link>
      {children}
    </div>
  </header>;
}

/** ヘッダー右端のラベル (EXPLORE THE EVENTS など) */
export function HeaderLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('ml-auto text-[10px] tracking-[1.5px] text-muted max-sm:text-[7px] max-sm:tracking-[.9px]', className)}>{children}</span>;
}

/** サイトフッター。children は右側に並ぶ */
export function SiteFooter({ children }: { children?: ReactNode }) {
  return <footer className="mx-auto flex max-w-[1160px] items-center justify-between gap-5 border-t border-line px-8 py-6 text-[8px] tracking-[.7px] text-[#929783] max-sm:flex-col max-sm:items-start max-sm:gap-[15px] max-sm:px-[18px] max-sm:py-5 max-sm:text-[7px]">
    <span className="flex items-center gap-[9px] text-xs tracking-[1px]"><Compass size={17}/> ROAM <small className="ml-2.5 text-[9px] tracking-[.4px] max-sm:text-[8px]">歩いた分だけ、街が好きになる。</small></span>
    {children}
  </footer>;
}
