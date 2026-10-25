import { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';

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

export default function Countdown({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [endsAt]);
  const remaining = Math.max(0, Math.ceil((Date.parse(endsAt) - now) / 1000));
  const duration = [Math.floor(remaining / 3600), Math.floor(remaining % 3600 / 60), remaining % 60].map(n => String(n).padStart(2, '0')).join(':');
  return <div className={`metric timer ${remaining ? '' : 'ended'}`}><span className="metric-label"><Clock3 size={14}/>{remaining ? '残り時間' : '大会終了'}</span><strong>{duration}</strong><span className="metric-foot">{remaining ? '自分たちのペースで、楽しもう。' : 'おつかれさまでした。'}</span></div>;
}
