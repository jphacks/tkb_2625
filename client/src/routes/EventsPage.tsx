import { useCallback, useState } from 'react';
import { ArrowUpRight, CalendarDays, Compass, Flag, RefreshCw, Search, Users } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLexClient } from '../lib/lexClient';
import { adminEventPath, eventPath } from '../lib/eventUri';
import { r } from '../lib/lex';
import { useRemoteQuery } from '../hooks/useRemoteQuery';
import { eventDate, eventDates, eventFilter, eventImage, eventName, eventOrganizer, eventStatus } from '../lib/eventPresentation';
import { formatDate } from '../lib/utils';
import { cn } from '../lib/cn';
import { button, empty, errorPanel, eyebrow, mainContainer } from '../lib/ui';
import { HeaderLabel, SiteFooter, SiteHeader, SkipLink } from '../components/SiteChrome';
import ParticipantNav from '../components/ParticipantNav';
import EventStatusTabs, { eventStatusTabId } from '../components/EventStatusTabs';
import type { EventView } from '../lexicons/win/tomo-x/rogaining/defs';

const statusBadge: Record<string, string> = {
  ongoing: 'border-[#465e3c] bg-[#465e3c] text-white',
  upcoming: 'border-[#dccbad] bg-[#eee4cf] text-[#826b46]',
  ended: 'border-[#d4dac9] bg-[#e4e5df] text-[#6a7165]',
};
const cardLink = 'flex min-h-11 items-center justify-between gap-3 border-t border-line pt-[13px] text-[11px] text-olive not-first:border-dashed hover:underline';

function EventCover({ event }: { event: EventView }) {
  const src = eventImage(event.imageUrl);
  const [failed, setFailed] = useState(false);
  return <div className="aspect-[16/10] overflow-hidden bg-[#e2e7d5] max-sm:aspect-[16/8]">{src && !failed ? <img className="size-full object-cover" src={src} alt={`${eventName(event)}のイベント画像`} loading="lazy" onError={() => setFailed(true)} /> : <div className="flex h-full flex-col items-center justify-center gap-[15px] bg-linear-[150deg,#eaedde,#d5dfc6] text-[#859776]" aria-hidden="true"><Compass size={65} strokeWidth={0.8}/><span className="text-[8px] tracking-[2px]">FIND YOUR NEXT FIELD</span></div>}</div>;
}

function EventCard({ event, now, did }: { event: EventView; now: number; did: string | undefined }) {
  const dates = eventDates(event);
  const status = eventStatus(event, now);
  const description = typeof event.record.description === 'string' ? event.record.description.trim() : '';
  const ranking = `/ranking?${new URLSearchParams({ event: event.uri })}`;
  const organizer = did !== undefined && (event.author.did === did || event.record.approver === did);
  return <article className="flex min-w-0 flex-col border border-line bg-[#fcfbf6]">
    <div className="relative"><EventCover key={event.imageUrl || ''} event={event}/><span className={cn('absolute top-[13px] left-[13px] border border-[#d4dac9] bg-[#f1f0e4] px-2.5 py-[5px] text-[10px] tracking-[.5px] text-[#6c765f]', statusBadge[status.key])}>{status.label}</span></div>
    <div className="flex flex-1 flex-col p-5"><p className="text-[10px] leading-[1.8] text-muted [overflow-wrap:anywhere]">主催：{eventOrganizer(event)}</p><h2 className="mt-2.5 mb-[18px] text-[19px] leading-[1.6] font-medium tracking-[.5px] [overflow-wrap:anywhere] max-sm:text-xl">{eventName(event)}</h2>
      <div className="flex items-start gap-[9px] text-[11px] leading-[1.8] text-[#647157]"><CalendarDays className="mt-0.5" size={16}/><div><span className="mb-1 block text-[9px] text-muted">開催日時（日本時間）</span>{dates ? <><time className="block" dateTime={new Date(dates.start).toISOString()}>{eventDate(dates.start)}</time><span className="block">〜 {eventDate(dates.end)}</span></> : <p>開催日時が設定されていません。</p>}</div></div>
      <p className="mt-4 mb-5 line-clamp-3 text-[11px] leading-[1.9] whitespace-pre-line text-[#707b65] [overflow-wrap:anywhere] max-sm:text-xs">{description || 'イベントの詳細説明はまだありません。'}</p>
      <dl className="mt-auto mb-5 grid grid-cols-3 gap-2 border-t border-line pt-4 max-sm:gap-[15px]"><div><dt className="flex items-center gap-1 text-[9px] whitespace-nowrap text-muted max-sm:text-[10px]"><Users size={13}/>参加チーム</dt><dd className="mt-[7px] text-[22px] text-olive max-sm:text-2xl">{event.teamCount === undefined ? '—' : event.teamCount.toLocaleString('ja-JP')}<small className="ml-1 text-[10px]">組</small></dd></div><div><dt className="flex items-center gap-1 text-[9px] whitespace-nowrap text-muted max-sm:text-[10px]"><Users size={13}/>参加者</dt><dd className="mt-[7px] text-[22px] text-olive max-sm:text-2xl">{event.participantCount === undefined ? '—' : event.participantCount.toLocaleString('ja-JP')}<small className="ml-1 text-[10px]">名</small></dd></div><div><dt className="flex items-center gap-1 text-[9px] whitespace-nowrap text-muted max-sm:text-[10px]"><Flag size={13}/>CP</dt><dd className="mt-[7px] text-[22px] text-olive max-sm:text-2xl">{event.checkpointCount === undefined ? '—' : event.checkpointCount.toLocaleString('ja-JP')}<small className="ml-1 text-[10px]">件</small></dd></div></dl>
      <div className="flex flex-col"><Link className={cardLink} to={eventPath(event.uri)} aria-label={`${eventName(event)}の大会ページを開く`}>大会ページを開く<ArrowUpRight size={17}/></Link><Link className={cardLink} to={ranking} aria-label={`${eventName(event)}のランキングを見る`}>ランキングを見る<ArrowUpRight size={17}/></Link>{organizer && <Link className={cardLink} to={adminEventPath(event.uri)} aria-label={`${eventName(event)}を管理する`}>管理画面を開く<ArrowUpRight size={17}/></Link>}</div>
    </div>
  </article>;
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
    <SiteHeader to="/events" label="ROAM イベント一覧"><HeaderLabel className="max-sm:tracking-[.5px]">EXPLORE THE EVENTS</HeaderLabel></SiteHeader>
    <ParticipantNav/>
    <main id="events-main" className={mainContainer}>
      <section className="relative mt-2 mb-[34px] flex items-center justify-between gap-[30px] overflow-hidden border border-[#d9dfce] bg-[#e8ecde] px-10 py-[34px] max-sm:mt-[5px] max-sm:mb-[25px] max-sm:gap-[5px] max-sm:px-5 max-sm:py-6"><div className="max-sm:relative max-sm:z-1"><span className={cn(eyebrow, 'max-sm:text-[7px] max-sm:tracking-[1px]')}>YOUR NEXT ADVENTURE</span><h1 className="my-[17px] font-mincho text-[34px] leading-[1.6] font-medium tracking-[3px] max-sm:my-3 max-sm:text-[26px] max-sm:tracking-[2px]">次の発見に、<br/>出会うイベントを。</h1><p className="text-xs leading-loose text-[#69765d] max-sm:text-[10px]">街を歩いて、景色を集める。<br/>気になる大会を見つけよう。</p></div><div className="flex -rotate-8 flex-col items-center gap-5 px-10 py-2.5 text-[#8e9e79] max-[62.5rem]:px-2.5 max-sm:absolute max-sm:-right-5 max-sm:bottom-[25px] max-sm:p-0 max-sm:opacity-30" aria-hidden="true"><Compass size={124} strokeWidth={0.55}/><span className="text-[8px] tracking-[2px] max-sm:hidden">WALK · DISCOVER · CONNECT</span></div></section>
      <div className="my-6 flex items-center justify-between gap-5"><div><span className={cn(eyebrow, 'max-sm:text-[8px]')}>EVENT DIRECTORY</span><h2 className="mt-2.5 text-2xl font-medium tracking-[1px] max-sm:text-xl">イベント一覧</h2></div><button className={cn(button, 'max-sm:text-[11px]')} onClick={events.retry} disabled={events.loading}><RefreshCw size={15}/>更新</button></div>
      <div className="flex items-center justify-between gap-5 border-b border-line pb-[18px] max-sm:flex-col max-sm:items-stretch max-sm:gap-3"><EventStatusTabs value={status} panelId="events-panel" onChange={value => setSearchParams(previous => { const next = new URLSearchParams(previous); if (value === 'all') next.delete('status'); else next.set('status', value); return next; })}/><label className="flex min-w-0 max-w-[330px] flex-1 items-center gap-2 border border-line bg-[#fcfbf6] px-3 max-sm:max-w-none"><Search size={16}/><span className="sr-only">イベント名・主催者を検索</span><input className="min-h-11 w-full min-w-0 border-0 bg-transparent text-[11px] text-ink" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="イベント名・主催者を検索"/></label></div>
      <div className="my-4 flex justify-between gap-[15px] text-[10px] text-muted max-sm:text-[9px]"><span>{events.loading ? '読み込み中' : events.error ? '取得できませんでした' : `${visible.length}件のイベント`}</span>{events.updatedAt && <span>更新 {formatDate(events.updatedAt)}</span>}</div>
      <section id="events-panel" role="tabpanel" aria-labelledby={eventStatusTabId(status)} aria-busy={events.loading} tabIndex={0}>
        {events.loading ? <div className={empty} role="status"><CalendarDays size={32}/><p>イベントを読み込んでいます…</p></div> : events.error ? <div className={errorPanel} role="alert"><p>イベント一覧を取得できませんでした。{events.error}</p><p className="mt-2">接続先とログイン状態を確認し、再試行してください。</p><button className={cn(button, 'mt-[13px]')} onClick={events.retry}>再試行する</button></div> : visible.length ? <div className="grid grid-cols-3 gap-[22px] max-[62.5rem]:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-5">{visible.map(event => <EventCard key={event.uri} event={event} now={now} did={client.did}/>)}</div> : <div className={empty}><CalendarDays size={32}/><h3>{events.data?.length ? '検索に一致するイベントはありません' : '該当するイベントはありません'}</h3><p>{events.data?.length ? 'イベント名や主催者名を変えて検索してください。' : '別の開催状況を選ぶか、時間をおいて更新してください。'}</p>{search && <button className={button} onClick={() => setSearch('')}>検索をクリア</button>}</div>}
      </section>
      <p className="mt-[22px] text-[10px] leading-[1.9] text-muted max-sm:text-[9px]">開催状況・参加数は最終更新時点の情報です。日程は日本時間で表示しています。</p>
    </main>
    <SiteFooter/>
  </div>;
}
