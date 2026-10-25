import type { EventView } from './lexicons/win/tomo-x/rogaining/defs';

export type EventFilter = 'all' | 'upcoming' | 'ongoing' | 'ended';
export function eventFilter(value: string | null): EventFilter {
  return value === 'upcoming' || value === 'ongoing' || value === 'ended' ? value : 'all';
}
export function eventName(event: EventView) {
  return typeof event.record.name === 'string' && event.record.name.trim() ? event.record.name : '名前のないイベント';
}
export function eventOrganizer(event: EventView) {
  return event.author.displayName?.trim() || `@${event.author.handle}`;
}
export function eventDates(event: EventView) {
  const start = typeof event.record.startsAt === 'string' ? Date.parse(event.record.startsAt) : NaN;
  const end = typeof event.record.endsAt === 'string' ? Date.parse(event.record.endsAt) : NaN;
  return Number.isFinite(start) && Number.isFinite(end) && end >= start ? { start, end } : null;
}
export function eventStatus(event: EventView, now: number) {
  const dates = eventDates(event);
  if (!dates) return { key: 'unknown', label: '日程未確認' };
  if (now < dates.start) return { key: 'upcoming', label: '開催予定' };
  if (now >= dates.end) return { key: 'ended', label: '終了' };
  return { key: 'ongoing', label: '開催中' };
}
const formatter = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
export const eventDate = (value: number) => formatter.format(new Date(value));

export function eventImage(value: string | undefined): string | null {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null; }
  catch { return null; }
}
