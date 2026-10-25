import { useCallback, useMemo, useRef } from 'react';
import { Link, NavLink, useSearchParams } from 'react-router-dom';
import { Compass, Flag, LayoutGrid, Map, RefreshCw, Trophy, Users } from 'lucide-react';
import { useLexClient } from './lexClient';
import { r } from './lex';
import { useRemoteQuery } from './useRemoteQuery';
import { formatDate } from './utils';
import type { EventView, RankingEntry } from './lexicons/win/tomo-x/rogaining/defs';
import './ranking.css';

function eventName(event: EventView) {
  return typeof event.record.name === 'string' && event.record.name.trim() ? event.record.name : '名前のない大会';
}
export function teamName(entry: RankingEntry) {
  return typeof entry.team.record.name === 'string' && entry.team.record.name.trim() ? entry.team.record.name : '名前のないチーム';
}
export function myRanking(entries: RankingEntry[], did: string | undefined) {
  return did ? entries.find(entry => entry.team.members.some(member => member.did === did)) : undefined;
}

export default function RankingPage() {
  const client = useLexClient();
  const [search, setSearch] = useSearchParams();
  const eventUri = search.get('event') || '';
  const parsed = useMemo(() => {
    if (!eventUri) return { params: null, error: '' };
    try { return { params: r.getRanking.$params.parse({ event: eventUri }), error: '' }; }
    catch { return { params: null, error: '大会のURLが正しくありません。大会を選び直してください。' }; }
  }, [eventUri]);
  const loadEvents = useCallback(async (signal: AbortSignal) => (await client.xrpc(r.listEvents.main, { params: {}, signal })).body.events, [client]);
  const events = useRemoteQuery(loadEvents);
  const loadRanking = useMemo(() => parsed.params ? async (signal: AbortSignal) => (await client.xrpc(r.getRanking.main, { params: parsed.params!, signal })).body.ranking : null, [client, parsed.params]);
  const ranking = useRemoteQuery(loadRanking);
  const mine = ranking.data ? myRanking(ranking.data, client.did) : undefined;
  const myRow = useRef<HTMLTableRowElement>(null);
  const selected = events.data?.find(event => event.uri === eventUri);
  const chooseEvent = (uri: string) => {
    setSearch(previous => { const next = new URLSearchParams(previous); if (uri) next.set('event', uri); else next.delete('event'); return next; });
  };
  return <div className="app-shell ranking-shell">
    <a className="skip-link" href="#ranking-main">本文へ移動</a>
    <header className="site-header"><div className="header-inner"><Link to="/cards" className="brand" aria-label="ROAM ホーム"><Compass size={31} strokeWidth={1.5}/><span>ROAM<span className="brand-sub">ROGAINING FIELD NOTES</span></span></Link><span className="ranking-header-label">EVENT LEADERBOARD</span></div></header>
    <nav className="tab-nav" aria-label="メインナビゲーション"><div className="tab-inner">
      <NavLink to="/cards"><LayoutGrid size={18}/><span>カード<small>CHECKPOINTS</small></span></NavLink>
      <NavLink to="/team"><Users size={18}/><span>チーム<small>OUR TEAM</small></span></NavLink>
      <NavLink to="/map"><Map size={18}/><span>マップ<small>EXPLORE</small></span></NavLink>
      <NavLink to={{ pathname: '/ranking', search: search.toString() ? `?${search}` : '' }}><Trophy size={18}/><span>ランキング<small>RANKING</small></span></NavLink>
    </div></nav>
    <main id="ranking-main" className="main-container">
      <div className="ranking-heading"><div><span className="eyebrow">EVERY DISCOVERY COUNTS</span><h1>ランキング</h1><p>仲間と集めた発見を、チームの記録に。</p></div><Trophy size={36} strokeWidth={1.2}/></div>
      <section className="ranking-event" aria-label="表示する大会">
        <label htmlFor="ranking-event">大会を選択</label><select id="ranking-event" value={eventUri} onChange={e => chooseEvent(e.target.value)} disabled={events.loading && !eventUri}>
          <option value="">{events.loading ? '大会を読み込んでいます…' : '大会を選んでください'}</option>
          {eventUri && !selected && <option value={eventUri}>URLで指定された大会</option>}
          {events.data?.map(event => <option key={event.uri} value={event.uri}>{eventName(event)}</option>)}
        </select>
        {events.error && <div className="ranking-inline-error"><p role="alert">大会一覧を取得できませんでした。{events.error}</p><button className="button" onClick={events.retry}>大会一覧を再試行</button></div>}
        {events.data?.length === 0 && <p className="ranking-hint">公開されている大会はありません。</p>}
      </section>
      {parsed.error ? <p className="error-panel" role="alert">{parsed.error}</p> : !eventUri ? <div className="empty"><Flag size={32}/><h2>大会を選んで順位を確認</h2><p>選択した大会のチーム・獲得ポイント・達成CP数を表示します。</p></div> : <section aria-label="大会の順位表" aria-busy={ranking.loading}>
        <div className="ranking-toolbar"><div><h2>{selected ? eventName(selected) : 'チーム順位表'}</h2>{ranking.updatedAt && <p>更新 {formatDate(ranking.updatedAt)}</p>}</div><button className="button" disabled={ranking.loading} onClick={ranking.retry}><RefreshCw size={15}/>更新</button></div>
        {ranking.loading ? <div className="empty" role="status"><Trophy size={30}/><p>ランキングを読み込んでいます…</p></div> : ranking.error ? <div className="error-panel" role="alert"><p>ランキングを取得できませんでした。{ranking.error}</p><p>ログイン状態と接続先を確認してください。</p><button className="button" onClick={ranking.retry}>再試行する</button></div> : ranking.data && <>
          {mine ? <div className="ranking-own-summary"><span className="eyebrow">YOUR TEAM</span><h3>{teamName(mine)}</h3><div><strong>{mine.rank}<small>位</small></strong><strong>{mine.totalPoints.toLocaleString('ja-JP')}<small>pt</small></strong><span>達成CP {mine.approvedCount}件</span><button className="button" onClick={() => { myRow.current?.scrollIntoView({ behavior: 'auto', block: 'center' }); myRow.current?.focus({ preventScroll: true }); }}>自分の行へ</button></div></div> : <p className="ranking-hint">{client.did ? 'この大会の順位表に、あなたが所属するチームは見つかりませんでした。' : '現在は未ログインです。ログインすると、自分のチームの行を強調表示します。'}</p>}
          {ranking.data.length ? <div className="ranking-table-wrap"><table className="ranking-table"><caption>{selected ? eventName(selected) : '大会'}のチーム順位表 · {ranking.data.length}チーム</caption><thead><tr><th scope="col">順位</th><th scope="col">チーム / メンバー</th><th scope="col">達成CP</th><th scope="col">ポイント</th></tr></thead><tbody>{ranking.data.map(entry => {
            const own = entry.team.uri === mine?.team.uri;
            return <tr key={entry.team.uri} ref={own ? myRow : undefined} className={own ? 'ranking-is-me' : ''} aria-current={own ? 'true' : undefined} tabIndex={own ? -1 : undefined}>
              <td className="ranking-position">{entry.rank === 1 && <Trophy size={16}/>}<strong>{entry.rank}</strong><span className="sr-only">位</span></td>
              <th scope="row"><div className="ranking-team-name">{teamName(entry)}{own && <span className="ranking-me-badge">あなたのチーム</span>}</div><ul className="ranking-members">{entry.team.members.map(member => <li key={member.did}><span>{member.displayName || `@${member.handle}`}</span>{member.did === client.did && <small>あなた</small>}</li>)}</ul>{!entry.team.members.length && <span className="ranking-hint">メンバー情報なし</span>}</th>
              <td className="ranking-approved">{entry.approvedCount}<small>件</small></td><td className="ranking-score">{entry.totalPoints.toLocaleString('ja-JP')}<small>pt</small></td>
            </tr>;
          })}</tbody></table></div> : <div className="empty"><Users size={30}/><h3>参加チームはまだありません</h3><p>参加チームが登録されると、ここに順位が表示されます。</p></div>}
          <p className="ranking-hint">順位・獲得ポイントは大会の集計結果です。承認されたCPの得点がチームごとに一度だけ加算されます。</p>
        </>}
      </section>}
    </main>
    <footer className="site-footer"><span><Compass size={17}/> ROAM <small>歩いた分だけ、街が好きになる。</small></span></footer>
  </div>;
}
