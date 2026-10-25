import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader, SkipLink } from './SiteChrome';

/** 主催者向け画面 (/admin 配下) の共通ヘッダー */
export default function OrganizerShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-bg text-fg">
    <SkipLink target="main" />
    <SiteHeader to="/admin"><span className="border-l border-bg/40 pl-3 text-[12px]">主催者</span><Link to="/events" className="ml-auto text-[12px] hover:underline">参加者画面</Link></SiteHeader>
    {children}
  </div>;
}
