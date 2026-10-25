import { useState, type ReactNode } from 'react';
import { ImagePlus } from 'lucide-react';
import { eventImage } from '../lib/eventPresentation';
import { STATUSES, type CheckpointStatus } from '../lib/rogaining';
import { cn } from '../lib/cn';
import { eyebrow as eyebrowClass } from '../lib/ui';

const statusColors: Record<CheckpointStatus, string> = {
  unsubmitted: 'border-[#62695b] bg-[#62695b]',
  pending: 'border-[#85621d] bg-[#85621d]',
  rejected: 'border-[#a04435] bg-[#a04435]',
  approved: 'border-[#3e643c] bg-[#3e643c]',
};

export function Status({ value, label }: { value: CheckpointStatus; label?: string }) {
  const status = STATUSES[value];
  return <span className={cn('inline-flex items-center justify-center gap-1 border px-[7px] py-1 text-[10px] leading-[1.4] whitespace-nowrap text-white max-sm:gap-[3px] max-sm:px-[5px] max-sm:py-[3px] max-sm:text-[9px]', statusColors[value])}><span aria-hidden="true">{status.symbol}</span> {label ?? status.label}</span>;
}

export function PageHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div className="mt-[5px] mb-7 max-sm:mt-1.5 max-sm:mb-6"><span className={eyebrowClass}>{eyebrow}</span><h2 className="my-3 font-mincho text-[29px] font-medium tracking-[2px] max-sm:text-[25px]">{title}</h2><p className="text-xs leading-[1.8] text-muted max-sm:text-[11px]">{text}</p></div>;
}

/** appview の画像 URL を表示する。URL がない・読み込めないときはプレースホルダーにする */
export function Photo({ src, alt, placeholder = '画像がありません', loading, className, placeholderClassName }: { src: string | undefined; alt: string; placeholder?: ReactNode; loading?: 'lazy'; className?: string; placeholderClassName?: string }) {
  const url = src?.startsWith('blob:') ? src : eventImage(src);
  const [failed, setFailed] = useState('');
  if (!url || failed === url) return <div className={cn('flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 border border-dashed border-[#c4cdb5] bg-[#e9ebdf] text-[11px] text-[#8b957c]', placeholderClassName)} role="img" aria-label={alt}><ImagePlus size={30}/><span>{failed ? '画像を読み込めませんでした' : placeholder}</span></div>;
  return <img className={className} src={url} alt={alt} loading={loading} onError={() => setFailed(url)}/>;
}
