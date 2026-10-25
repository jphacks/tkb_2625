import { CalendarDays, LayoutGrid, Map, Trophy, Users } from 'lucide-react';
import { NavLink, useSearchParams } from 'react-router-dom';
import './participant-nav.css';

export default function ParticipantNav() {
  const [query] = useSearchParams();
  const event = query.get('event');
  const ranking = event ? `/ranking?${new URLSearchParams({ event })}` : '/ranking';
  const tabs = [
    { to: '/events', label: 'イベント', en: 'EVENTS', icon: CalendarDays },
    { to: '/cards', label: 'カード', en: 'CHECKPOINTS', icon: LayoutGrid },
    { to: '/team', label: 'チーム', en: 'OUR TEAM', icon: Users },
    { to: '/map', label: 'マップ', en: 'EXPLORE', icon: Map },
    { to: ranking, label: 'ランキング', en: 'RANKING', icon: Trophy },
  ];
  return <nav className="tab-nav participant-nav" aria-label="メインナビゲーション"><div className="tab-inner">{tabs.map(({ to, label, en, icon: Icon }) => <NavLink key={label} to={to}><Icon size={18}/><span>{label}<small>{en}</small></span></NavLink>)}</div></nav>;
}
