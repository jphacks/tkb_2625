import { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { cn } from '../lib/cn';

export function useExpired(endsAt: string) {
  const [expiredAt, setExpiredAt] = useState('');
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function check() {
      const delay = Date.parse(endsAt) - Date.now();
      if (delay <= 0) setExpiredAt(endsAt);
      else timer = setTimeout(check, Math.min(delay, 2147483647));
    }
    check();
    return () => clearTimeout(timer);
  }, [endsAt]);
  return expiredAt === endsAt || Date.now() >= Date.parse(endsAt);
}

/** 終了までの残り時間。startsAt を渡すと、開始前は開始までの時間を表示する */
export default function Countdown({ endsAt, startsAt }: { endsAt: string; startsAt?: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [endsAt, startsAt]);
  const before = startsAt !== undefined && now < Date.parse(startsAt);
  const remaining = Math.max(0, Math.ceil((Date.parse(before ? startsAt : endsAt) - now) / 1000));
  const duration = [Math.floor(remaining / 3600), Math.floor(remaining % 3600 / 60), remaining % 60].map(n => String(n).padStart(2, '0')).join(':');
  return <div className="border-l border-line pl-[35px] max-md:pl-5 max-sm:border-0 max-sm:pl-0"><span className="flex items-center gap-[7px] text-[11px] tracking-[1px] text-[#737d6b] max-sm:text-[10px]"><Clock3 size={14}/>{before ? '開始まで' : remaining ? '残り時間' : '大会終了'}</span><strong className={cn('block text-[34px] leading-[1.45] font-medium tracking-[1.5px] tabular-nums max-md:text-[29px] max-sm:text-[30px] max-sm:leading-[1.5]', !remaining && 'text-[#986c4f]')}>{duration}</strong><span className="text-[10px] text-muted max-sm:text-[8px]">{before ? 'スタートまで、もう少し。' : remaining ? '自分たちのペースで、楽しもう。' : 'おつかれさまでした。'}</span></div>;
}
