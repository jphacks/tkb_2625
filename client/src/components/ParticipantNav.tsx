import { CalendarDays, LayoutGrid, Map, Trophy, Users } from 'lucide-react';
import { NavLink, useParams, useSearchParams } from 'react-router-dom';
import { eventPath } from '../lib/eventUri';
import { r } from '../lib/lex';
import { cn } from '../lib/cn';

const tabLink = 'flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 border-b-2 border-transparent px-3 text-[13px] text-fg/60 hover:text-fg max-sm:gap-1 max-sm:px-1 max-sm:text-[12px] sm:flex-none';

/** イベントのページ (`/events/:did/:rkey/*`) ではそのイベントの、ランキングでは `?event=` のイベントのタブを出す */
export default function ParticipantNav() {
  const { did, rkey } = useParams();
  const [query] = useSearchParams();
  const event = did && rkey ? `at://${did}/${r.event.$type}/${rkey}` : query.get('event')?.startsWith('at://') ? query.get('event') : null;
  const tabs = [
    { to: '/events', label: 'イベント', icon: CalendarDays, end: true },
    ...event ? [
      { to: eventPath(event, 'cards'), label: 'カード', icon: LayoutGrid },
      { to: eventPath(event, 'team'), label: 'チーム', icon: Users },
      { to: eventPath(event, 'map'), label: 'マップ', icon: Map },
    ] : [],
    { to: event ? `/ranking?${new URLSearchParams({ event })}` : '/ranking', label: 'ランキング', icon: Trophy },
  ];
  return <nav className="border-b border-fg/10" aria-label="メインナビゲーション"><div className="mx-auto flex max-w-[1200px] px-4 max-sm:px-0">{tabs.map(({ to, label, icon: Icon, end }) => <NavLink key={label} to={to} end={end} className={({ isActive }) => cn(tabLink, isActive && 'border-accent font-bold text-accent hover:text-accent')}><Icon size={15}/>{label}</NavLink>)}</div></nav>;
}
