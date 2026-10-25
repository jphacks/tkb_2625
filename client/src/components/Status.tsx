import { useState, type ReactNode } from 'react';
import { ImageOff } from 'lucide-react';
import { eventImage } from '../lib/eventPresentation';
import { STATUSES, type CheckpointStatus } from '../lib/rogaining';
import { cn } from '../lib/cn';

const statusColors: Record<CheckpointStatus, string> = {
  unsubmitted: 'border-fg/30 text-fg/60',
  pending: 'border-fg text-fg',
  rejected: 'border-fg bg-fg text-bg',
  approved: 'border-accent bg-accent text-bg',
};

export function Status({ value, label }: { value: CheckpointStatus; label?: string }) {
  const status = STATUSES[value];
  return <span className={cn('inline-flex h-5 items-center justify-center gap-1 border px-1.5 text-[11px] font-bold whitespace-nowrap', statusColors[value])}><span aria-hidden="true">{status.symbol}</span>{label ?? status.label}</span>;
}

/** ページ見出し。actions は右側に並ぶ (? ボタンなど) */
export function PageHeading({ title, actions }: { title: string; actions?: ReactNode }) {
  return <div className="mb-3 flex min-h-9 items-center gap-2"><h2 className="text-[15px] font-bold">{title}</h2>{actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}</div>;
}

/** appview の画像 URL を表示する。URL がない・読み込めないときはプレースホルダーにする */
export function Photo({ src, alt, placeholder = '画像なし', loading, className, placeholderClassName }: { src: string | undefined; alt: string; placeholder?: ReactNode; loading?: 'lazy'; className?: string; placeholderClassName?: string }) {
  const url = src?.startsWith('blob:') ? src : eventImage(src);
  const [failed, setFailed] = useState('');
  if (!url || failed === url) return <div className={cn('flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 bg-fg/5 text-[11px] text-fg/60', placeholderClassName)} role="img" aria-label={alt}><ImageOff size={20}/><span>{failed ? '読み込めません' : placeholder}</span></div>;
  return <img className={className} src={url} alt={alt} loading={loading} onError={() => setFailed(url)}/>;
}
