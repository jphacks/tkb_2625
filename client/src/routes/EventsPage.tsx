import { useCallback, useState } from 'react';
import { ImageOff, RefreshCw, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLexClient } from '../lib/lexClient';
import { adminEventPath, eventPath } from '../lib/eventUri';
import { r } from '../lib/lex';
import { useRemoteQuery } from '../hooks/useRemoteQuery';
import { eventDate, eventDates, eventFilter, eventImage, eventName, eventOrganizer, eventStatus } from '../lib/eventPresentation';
import { formatDate } from '../lib/utils';
import { cn } from '../lib/cn';
import { button, empty, errorPanel, iconButton, input, mainContainer, textButton } from '../lib/ui';
import { SiteHeader, SkipLink } from '../components/SiteChrome';
import ParticipantNav from '../components/ParticipantNav';
import EventStatusTabs, { eventStatusTabId } from '../components/EventStatusTabs';
import type { EventView } from '../lexicons/win/tomo-x/rogaining/defs';

const statusBadge: Record<string, string> = {
  ongoing: 'border-accent bg-accent text-bg',
  upcoming: 'border-fg text-fg',
  ended: 'border-fg/30 text-fg/60',
};
const count = (value: number | undefined) => value === undefined ? '—' : value.toLocaleString('ja-JP');

function EventCover({ event }: { event: EventView }) {
  const src = eventImage(event.imageUrl);
  const [failed, setFailed] = useState(false);
  return <div className="h-12 w-[72px] shrink-0 overflow-hidden bg-fg/5 max-sm:h-10 max-sm:w-14">{src && !failed ? <img className="size-full object-cover" src={src} alt={`${eventName(event)}のイベント画像`} loading="lazy" onError={() => setFailed(true)} /> : <div className="grid size-full place-items-center text-fg/30" aria-hidden="true"><ImageOff size={18}/></div>}</div>;
}

function EventRow({ event, now, did }: { event: EventView; now: number; did: string | undefined }) {
  const dates = eventDates(event);
  const status = eventStatus(event, now);
  const ranking = `/ranking?${new URLSearchParams({ event: event.uri })}`;
  const organizer = did !== undefined && event.author.did === did;
  return <li className="flex items-center gap-3 border-b border-fg/10 py-2 max-sm:flex-wrap max-sm:gap-y-1">
    <EventCover key={event.imageUrl || ''} event={event}/>
    <div className="min-w-0 flex-1 max-sm:basis-[calc(100%-4.5rem)]">
      <div className="flex items-center gap-2"><span className={cn('inline-flex h-5 shrink-0 items-center border px-1.5 text-[11px] font-bold whitespace-nowrap', statusBadge[status.key])}>{status.label}</span><h2 className="min-w-0 truncate text-[14px] font-bold">{eventName(event)}</h2></div>
      <p className="mt-0.5 truncate text-[12px] text-fg/60">{eventOrganizer(event)}{dates ? <> · <time dateTime={new Date(dates.start).toISOString()}>{eventDate(dates.start)}</time> 〜 {eventDate(dates.end)}</> : ' · 日時未設定'}</p>
    </div>
    <dl className="flex shrink-0 gap-3 text-[12px] text-fg/60 max-sm:order-3 max-sm:ml-[4.5rem] max-sm:flex-1"><div className="flex gap-1"><dt>チーム</dt><dd className="font-bold text-fg">{count(event.teamCount)}</dd></div><div className="flex gap-1"><dt>参加者</dt><dd className="font-bold text-fg">{count(event.participantCount)}</dd></div><div className="flex gap-1"><dt>CP</dt><dd className="font-bold text-fg">{count(event.checkpointCount)}</dd></div></dl>
    <div className="flex shrink-0 items-center gap-3 max-sm:order-4"><Link className={cn(textButton, 'h-9 font-bold')} to={eventPath(event.uri)} aria-label={`${eventName(event)}の大会ページを開く`}>開く</Link><Link className={cn(textButton, 'h-9')} to={ranking} aria-label={`${eventName(event)}のランキングを見る`}>ランキング</Link>{organizer && <Link className={cn(textButton, 'h-9')} to={adminEventPath(event.uri)} aria-label={`${eventName(event)}を管理する`}>管理</Link>}</div>
  </li>;
}

export default function EventsPage() {
  const client = useLexClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = eventFilter(searchParams.get('status'));
  const [search, setSearch] = useState('');
  const load = useCallback(async (signal: AbortSignal) => (await client.xrpc(r.listEvents.main, { params: status === 'all' ? {} : { status }, signal })).body.events, [client, status]);
  const events = useRemoteQuery(load);
  const visible = events.data?.filter(event => `${eventName(event)} ${eventOrganizer(event)}`.toLocaleLowerCase('ja-JP').includes(search.trim().toLocaleLowerCase('ja-JP'))) || [];
  const now = events.updatedAt ? Date.parse(events.updatedAt) : Date.now();
  return <div>
    <SkipLink target="events-main"/>
    <SiteHeader to="/events"/>
    <ParticipantNav/>
    <main id="events-main" className={mainContainer}>
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <EventStatusTabs value={status} panelId="events-panel" onChange={value => setSearchParams(previous => { const next = new URLSearchParams(previous); if (value === 'all') next.delete('status'); else next.set('status', value); return next; })}/>
        <label className="relative min-w-[160px] max-w-[320px] flex-1 max-sm:max-w-none"><Search size={14} className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-fg/60"/><span className="sr-only">イベント名・主催者を検索</span><input className={cn(input, 'pl-7')} type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="イベント名・主催者を検索"/></label>
        <span className="ml-auto text-[12px] text-fg/60" title={events.updatedAt ? `更新 ${formatDate(events.updatedAt)}` : undefined}>{events.loading ? '読み込み中' : events.error ? '取得失敗' : `${visible.length}件`}</span>
        <button className={iconButton} onClick={events.retry} disabled={events.loading} aria-label="更新" title="更新"><RefreshCw size={16}/></button>
      </div>
      <section id="events-panel" role="tabpanel" aria-labelledby={eventStatusTabId(status)} aria-busy={events.loading} tabIndex={0}>
        {events.loading ? <div className={empty} role="status"><p>イベントを読み込んでいます…</p></div> : events.error ? <div className={errorPanel} role="alert"><p>イベント一覧を取得できませんでした。{events.error}</p><button className={cn(button, 'mt-2')} onClick={events.retry}>再試行</button></div> : visible.length ? <ul className="border-t border-fg/10">{visible.map(event => <EventRow key={event.uri} event={event} now={now} did={client.did}/>)}</ul> : <div className={empty}><h3>{events.data?.length ? '検索に一致するイベントはありません' : '該当するイベントはありません'}</h3>{search && <button className={button} onClick={() => setSearch('')}>検索をクリア</button>}</div>}
      </section>
    </main>
  </div>;
}
