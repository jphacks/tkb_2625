import { CalendarDays, LayoutGrid, Map, Trophy, Users } from 'lucide-react';
import { NavLink, useParams, useSearchParams } from 'react-router-dom';
import { eventPath } from '../lib/eventUri';
import { r } from '../lib/lex';
import { cn } from '../lib/cn';

const tabLink = 'relative flex min-h-[70px] min-w-0 flex-1 items-center justify-center gap-[11px] px-[38px] py-[18px] text-muted max-sm:min-h-[67px] max-sm:flex-col max-sm:gap-[5px] max-sm:px-0.5 max-sm:py-[9px] max-sm:[&>svg]:w-[17px]';

/** イベントのページ (`/events/:did/:rkey/*`) ではそのイベントの、ランキングでは `?event=` のイベントのタブを出す */
export default function ParticipantNav() {
  const { did, rkey } = useParams();
  const [query] = useSearchParams();
  const event = did && rkey ? `at://${did}/${r.event.$type}/${rkey}` : query.get('event')?.startsWith('at://') ? query.get('event') : null;
  const tabs = [
    { to: '/events', label: 'イベント', en: 'EVENTS', icon: CalendarDays, end: true },
    ...event ? [
      { to: eventPath(event, 'cards'), label: 'カード', en: 'CHECKPOINTS', icon: LayoutGrid },
      { to: eventPath(event, 'team'), label: 'チーム', en: 'OUR TEAM', icon: Users },
      { to: eventPath(event, 'map'), label: 'マップ', en: 'EXPLORE', icon: Map },
    ] : [],
    { to: event ? `/ranking?${new URLSearchParams({ event })}` : '/ranking', label: 'ランキング', en: 'RANKING', icon: Trophy },
  ];
  return <nav className="border-y border-line bg-[#f0f0e7]" aria-label="メインナビゲーション"><div className="mx-auto flex max-w-[1096px] items-stretch">{tabs.map(({ to, label, en, icon: Icon, end }) => <NavLink key={label} to={to} end={end} className={({ isActive }) => cn(tabLink, isActive && 'bg-[#e8ecdf] text-olive after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:bg-olive after:content-[""]')}><Icon size={18}/><span className="text-[13px] font-medium tracking-[1px] max-sm:text-center max-sm:text-[10px] max-sm:tracking-[0]">{label}<small className="mt-[3px] block text-[7px] font-normal tracking-[1px] max-sm:text-[5px] max-sm:tracking-[.3px]">{en}</small></span></NavLink>)}</div></nav>;
}
