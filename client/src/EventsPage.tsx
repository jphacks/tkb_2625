import { useCallback, useState } from 'react';
import { ArrowUpRight, CalendarDays, Compass, Flag, RefreshCw, Search, Users } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLexClient } from './lexClient';
import { r } from './lex';
import { useRemoteQuery } from './useRemoteQuery';
import { eventDate, eventDates, eventFilter, eventImage, eventName, eventOrganizer, eventStatus } from './eventPresentation';
import { formatDate } from './utils';
import ParticipantNav from './ParticipantNav';
import EventStatusTabs, { eventStatusTabId } from './EventStatusTabs';
import type { EventView } from './lexicons/win/tomo-x/rogaining/defs';
import './events.css';

function EventCover({ event }: { event: EventView }) {
  const src = eventImage(event.imageUrl);
  const [failed, setFailed] = useState(false);
  return <div className="event-card-cover">{src && !failed ? <img src={src} alt={`${eventName(event)}のイベント画像`} loading="lazy" onError={() => setFailed(true)} /> : <div className="event-cover-placeholder" aria-hidden="true"><Compass size={65} strokeWidth={0.8}/><span>FIND YOUR NEXT FIELD</span></div>}</div>;
}

function EventCard({ event, now }: { event: EventView; now: number }) {
  const dates = eventDates(event);
  const status = eventStatus(event, now);
  const description = typeof event.record.description === 'string' ? event.record.description.trim() : '';
  const ranking = `/ranking?${new URLSearchParams({ event: event.uri })}`;
  return <article className="event-card">
    <div className="event-card-visual"><EventCover key={event.imageUrl || ''} event={event}/><span className={`event-status ${status.key}`}>{status.label}</span></div>
    <div className="event-card-body"><p className="event-organizer">主催：{eventOrganizer(event)}</p><h2>{eventName(event)}</h2>
      <div className="event-schedule"><CalendarDays size={16}/><div><span>開催日時（日本時間）</span>{dates ? <><time dateTime={new Date(dates.start).toISOString()}>{eventDate(dates.start)}</time><span className="event-until">〜 {eventDate(dates.end)}</span></> : <p>開催日時が設定されていません。</p>}</div></div>
      <p className="event-description">{description || 'イベントの詳細説明はまだありません。'}</p>
      <dl className="event-counts"><div><dt><Users size={13}/>参加チーム</dt><dd>{event.teamCount === undefined ? '—' : event.teamCount.toLocaleString('ja-JP')}<small>組</small></dd></div><div><dt><Users size={13}/>参加者</dt><dd>{event.participantCount === undefined ? '—' : event.participantCount.toLocaleString('ja-JP')}<small>名</small></dd></div><div><dt><Flag size={13}/>CP</dt><dd>{event.checkpointCount === undefined ? '—' : event.checkpointCount.toLocaleString('ja-JP')}<small>件</small></dd></div></dl>
      <Link className="event-card-link" to={ranking} aria-label={`${eventName(event)}のランキングを見る`}>ランキングを見る<ArrowUpRight size={17}/></Link>
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
  return <div className="app-shell events-shell">
    <a className="skip-link" href="#events-main">本文へ移動</a>
    <header className="site-header"><div className="header-inner"><Link className="brand" to="/events" aria-label="ROAM イベント一覧"><Compass size={31} strokeWidth={1.5}/><span>ROAM<span className="brand-sub">ROGAINING FIELD NOTES</span></span></Link><span className="events-header-label">EXPLORE THE EVENTS</span></div></header>
    <ParticipantNav/>
    <main id="events-main" className="main-container">
      <section className="events-intro"><div><span className="eyebrow">YOUR NEXT ADVENTURE</span><h1>次の発見に、<br/>出会うイベントを。</h1><p>街を歩いて、景色を集める。<br/>気になる大会を見つけよう。</p></div><div className="events-intro-art" aria-hidden="true"><Compass size={124} strokeWidth={0.55}/><span>WALK · DISCOVER · CONNECT</span></div></section>
      <div className="events-section-heading"><div><span className="eyebrow">EVENT DIRECTORY</span><h2>イベント一覧</h2></div><button className="button" onClick={events.retry} disabled={events.loading}><RefreshCw size={15}/>更新</button></div>
      <div className="events-controls"><EventStatusTabs value={status} panelId="events-panel" onChange={value => setSearchParams(previous => { const next = new URLSearchParams(previous); if (value === 'all') next.delete('status'); else next.set('status', value); return next; })}/><label className="events-search"><Search size={16}/><span className="sr-only">イベント名・主催者を検索</span><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="イベント名・主催者を検索"/></label></div>
      <div className="events-results-meta"><span>{events.loading ? '読み込み中' : events.error ? '取得できませんでした' : `${visible.length}件のイベント`}</span>{events.updatedAt && <span>更新 {formatDate(events.updatedAt)}</span>}</div>
      <section className="events-results" id="events-panel" role="tabpanel" aria-labelledby={eventStatusTabId(status)} aria-busy={events.loading} tabIndex={0}>
        {events.loading ? <div className="empty" role="status"><CalendarDays size={32}/><p>イベントを読み込んでいます…</p></div> : events.error ? <div className="error-panel" role="alert"><p>イベント一覧を取得できませんでした。{events.error}</p><p>接続先とログイン状態を確認し、再試行してください。</p><button className="button" onClick={events.retry}>再試行する</button></div> : visible.length ? <div className="events-grid">{visible.map(event => <EventCard key={event.uri} event={event} now={now}/>)}</div> : <div className="empty"><CalendarDays size={32}/><h3>{events.data?.length ? '検索に一致するイベントはありません' : '該当するイベントはありません'}</h3><p>{events.data?.length ? 'イベント名や主催者名を変えて検索してください。' : '別の開催状況を選ぶか、時間をおいて更新してください。'}</p>{search && <button className="button" onClick={() => setSearch('')}>検索をクリア</button>}</div>}
      </section>
      <p className="events-footnote">開催状況・参加数は最終更新時点の情報です。日程は日本時間で表示しています。</p>
    </main>
    <footer className="site-footer"><span><Compass size={17}/> ROAM <small>歩いた分だけ、街が好きになる。</small></span></footer>
  </div>;
}
