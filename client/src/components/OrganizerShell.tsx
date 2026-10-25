import type { ReactNode } from 'react';
import { SiteFooter, SiteHeader, SkipLink } from './SiteChrome';

/** 主催者向け画面 (/admin 配下) の共通ヘッダー・フッター。participant はフッターの参加者画面リンクの行き先 */
export default function OrganizerShell({ children, participant = '/events' }: { children: ReactNode; participant?: string }) {
  return <div className="min-h-screen bg-bg text-fg">
    <SkipLink target="main" />
    <SiteHeader to="/admin"><span className="border-l border-bg/40 pl-3 text-[12px]">主催者</span></SiteHeader>
    {children}
    <SiteFooter to={participant}>参加者画面</SiteFooter>
  </div>;
}
