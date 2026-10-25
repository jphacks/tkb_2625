import { LayoutGrid, Map, Trophy, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { eventPath } from '../lib/eventUri';
import { cn } from '../lib/cn';

const tabLink = 'flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 border-b-2 border-transparent px-3 text-[13px] text-fg/60 hover:text-fg max-sm:gap-1 max-sm:px-1 max-sm:text-[12px] sm:flex-none';

/** 大会画面のタブ。どのタブもその大会の中で完結させる */
export default function ParticipantNav({ uri }: { uri: string }) {
  const tabs = [
    { to: eventPath(uri, 'cards'), label: 'カード', icon: LayoutGrid },
    { to: eventPath(uri, 'team'), label: 'チーム', icon: Users },
    { to: eventPath(uri, 'map'), label: 'マップ', icon: Map },
    { to: eventPath(uri, 'ranking'), label: 'ランキング', icon: Trophy },
  ];
  return <nav className="border-b border-fg/10" aria-label="大会メニュー"><div className="mx-auto flex max-w-[1200px] px-4 max-sm:px-0">{tabs.map(({ to, label, icon: Icon }) => <NavLink key={label} to={to} className={({ isActive }) => cn(tabLink, isActive && 'border-accent font-bold text-accent hover:text-accent')}><Icon size={15}/>{label}</NavLink>)}</div></nav>;
}
