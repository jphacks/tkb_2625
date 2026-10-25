import { useEffect, useState } from 'react';

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
  return <div className="flex flex-col"><span className="text-[11px] font-bold text-fg/60">{before ? '開始まで' : remaining ? '残り' : '終了'}</span><strong className="text-[22px] leading-tight font-bold tabular-nums max-sm:text-[18px]">{duration}</strong></div>;
}
