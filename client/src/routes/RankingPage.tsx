import ParticipantNav from '../components/ParticipantNav';
import { eventName } from '../lib/eventPresentation';
import { useCallback, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { eventPath } from '../lib/eventUri';
import { useLexClient } from '../lib/lexClient';
import { r } from '../lib/lex';
import { useRemoteQuery } from '../hooks/useRemoteQuery';
import { formatDate } from '../lib/utils';
import type { RankingEntry } from '../lexicons/win/tomo-x/rogaining/defs';
import { cn } from '../lib/cn';
import { button, empty, errorPanel, iconButton, mainContainer, table } from '../lib/ui';
import { SiteHeader, SkipLink } from '../components/SiteChrome';

const hint = 'my-2 text-[13px] text-fg/60';
const wrapAnywhere = '[overflow-wrap:anywhere]';

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
  return <div>
    <SkipLink target="ranking-main"/>
    <SiteHeader to="/events"/>
    <ParticipantNav/>
    <main id="ranking-main" className={mainContainer}>
      <section className="mb-2 flex flex-wrap items-center gap-2" aria-label="表示する大会">
        <label htmlFor="ranking-event" className="sr-only">大会を選択</label><select id="ranking-event" className="h-9 min-w-0 flex-1 border border-fg/25 bg-bg px-2 text-[13px] text-fg" value={eventUri} onChange={e => chooseEvent(e.target.value)} disabled={events.loading && !eventUri}>
          <option value="">{events.loading ? '大会を読み込んでいます…' : '大会を選んでください'}</option>
          {eventUri && !selected && <option value={eventUri}>URLで指定された大会</option>}
          {events.data?.map(event => <option key={event.uri} value={event.uri}>{eventName(event)}</option>)}
        </select>
        {eventUri && <><Link className={cn(button, 'max-sm:flex-1')} to={eventPath(eventUri, 'cards')}>大会ページ</Link><button className={iconButton} disabled={ranking.loading} onClick={ranking.retry} aria-label="更新" title={ranking.updatedAt ? `更新 ${formatDate(ranking.updatedAt)}` : '更新'}><RefreshCw size={16}/></button></>}
        {events.error && <div className="flex w-full items-center gap-2 text-[13px] font-bold"><p role="alert">大会一覧を取得できませんでした。{events.error}</p><button className={button} onClick={events.retry}>再試行</button></div>}
        {events.data?.length === 0 && <p className={hint}>公開されている大会はありません。</p>}
      </section>
      {parsed.error ? <p className={errorPanel} role="alert">{parsed.error}</p> : !eventUri ? <div className={empty}><p>大会を選んで順位を確認してください。</p></div> : <section aria-label="大会の順位表" aria-busy={ranking.loading}>
        {ranking.loading ? <div className={empty} role="status"><p>ランキングを読み込んでいます…</p></div> : ranking.error ? <div className={errorPanel} role="alert"><p>ランキングを取得できませんでした。{ranking.error}</p><button className={cn(button, 'mt-2')} onClick={ranking.retry}>再試行</button></div> : ranking.data && <>
          {mine ? <div className="my-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-l-4 border-accent bg-accent/10 px-3 py-1.5 text-[13px]"><span className="text-fg/60">あなたのチーム</span><strong className={wrapAnywhere}>{teamName(mine)}</strong><strong className="text-accent">{mine.rank}位</strong><strong>{mine.totalPoints.toLocaleString('ja-JP')}pt</strong><span>達成CP {mine.approvedCount}件</span><button className={cn(button, 'ml-auto')} onClick={() => { myRow.current?.scrollIntoView({ behavior: 'auto', block: 'center' }); myRow.current?.focus({ preventScroll: true }); }}>自分の行へ</button></div> : <p className={hint}>{client.did ? '所属するチームはこの大会の順位表にありません。' : '未ログインです。ログインすると自分のチームを強調表示します。'}</p>}
          {ranking.data.length ? <div className="overflow-x-auto"><table className={table}><caption className="sr-only">{selected ? eventName(selected) : '大会'}のチーム順位表 · {ranking.data.length}チーム</caption><thead><tr><th scope="col" className="w-12">順位</th><th scope="col">チーム / メンバー</th><th scope="col" className="text-right">達成CP</th><th scope="col" className="text-right">ポイント</th></tr></thead><tbody>{ranking.data.map(entry => {
            const own = entry.team.uri === mine?.team.uri;
            return <tr key={entry.team.uri} ref={own ? myRow : undefined} className={own ? 'bg-accent/10 font-bold focus:outline-2 focus:-outline-offset-2 focus:outline-accent' : ''} aria-current={own ? 'true' : undefined} tabIndex={own ? -1 : undefined}>
              <td className="whitespace-nowrap tabular-nums"><strong className="font-bold">{entry.rank}</strong><span className="sr-only">位</span></td>
              <th scope="row" className="!text-[13px] ![font-weight:inherit] !text-fg"><div className={cn('flex flex-wrap items-center gap-2', wrapAnywhere)}>{teamName(entry)}{own && <span className="inline-block bg-accent px-1.5 text-[11px] font-bold whitespace-nowrap text-bg">あなたのチーム</span>}</div>{entry.team.members.length ? <ul className="flex list-none flex-wrap gap-x-3 p-0 text-[12px] font-normal text-fg/60">{entry.team.members.map(member => <li key={member.did} className={wrapAnywhere}>{member.displayName || `@${member.handle}`}{member.did === client.did && <b className="ml-1 text-accent">あなた</b>}</li>)}</ul> : <span className="text-[12px] font-normal text-fg/60">メンバー情報なし</span>}</th>
              <td className="text-right whitespace-nowrap tabular-nums">{entry.approvedCount}<small className="ml-0.5 text-[11px] font-normal">件</small></td><td className="text-right whitespace-nowrap tabular-nums">{entry.totalPoints.toLocaleString('ja-JP')}<small className="ml-0.5 text-[11px] font-normal">pt</small></td>
            </tr>;
          })}</tbody></table></div> : <div className={empty}><p>参加チームはまだありません。</p></div>}
        </>}
      </section>}
    </main>
  </div>;
}
