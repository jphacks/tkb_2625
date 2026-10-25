import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SkipLink } from './SiteChrome';

/** 主催者向け画面 (/admin 配下) の共通ヘッダー・フッター */
export default function OrganizerShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-paper text-ink">
    <SkipLink target="main" />
    <header className="flex h-[78px] items-center justify-between border-b border-line bg-[#faf9f3] px-[max(22px,calc((100%-1050px)/2))] max-sm:h-[68px] max-sm:px-[18px]"><Link to="/admin" className="flex flex-col gap-1"><strong className="text-[23px] tracking-[2px] max-sm:text-[19px]">AtRogaining</strong><small className="text-[7px] font-normal tracking-[1.6px] text-muted">ORGANIZER CONSOLE</small></Link><span className="text-[10px] tracking-[1.2px] text-muted max-sm:text-[7px]">EVENT MANAGEMENT</span></header>
    {children}
    <footer className="border-t border-line px-[max(22px,calc((100%-1050px)/2))] py-5 text-[11px] text-[#59674e] max-sm:p-[18px]">AtRogaining <span className="float-right text-[9px] tracking-[1px] text-muted">ORGANIZER TOOLS</span></footer>
  </div>;
}
