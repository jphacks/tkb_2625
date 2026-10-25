import ParticipantNav from '../components/ParticipantNav';
import { eventName } from '../lib/eventPresentation';
import { useCallback, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Flag, RefreshCw, Trophy, Users } from 'lucide-react';
import { eventPath } from '../lib/eventUri';
import { useLexClient } from '../lib/lexClient';
import { r } from '../lib/lex';
import { useRemoteQuery } from '../hooks/useRemoteQuery';
import { formatDate } from '../lib/utils';
import type { RankingEntry } from '../lexicons/win/tomo-x/rogaining/defs';
import { cn } from '../lib/cn';
import { button, empty, errorPanel, eyebrow, mainContainer } from '../lib/ui';
import { HeaderLabel, SiteFooter, SiteHeader, SkipLink } from '../components/SiteChrome';

const hint = 'my-[15px] text-[11px] leading-[1.9] text-muted max-sm:text-[10px]';
const wrapAnywhere = '[overflow-wrap:anywhere]';
const cell = 'border-b border-line p-5 leading-[1.8] max-sm:px-2 max-sm:py-3.5';
const headCell = 'text-left text-[10px] font-medium whitespace-nowrap text-[#69785a] max-sm:text-[9px]';
const unit = 'ml-1 text-[11px] font-normal max-sm:text-[9px]';

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
    <SiteHeader to="/events" label="ROAM イベント一覧"><HeaderLabel>EVENT LEADERBOARD</HeaderLabel></SiteHeader>
    <ParticipantNav/>
    <main id="ranking-main" className={mainContainer}>
      <div className="mt-2.5 mb-[30px] flex items-center justify-between gap-5 max-sm:mb-6"><div><span className={eyebrow}>EVERY DISCOVERY COUNTS</span><h1 className="my-3 font-mincho text-[30px] font-medium tracking-[3px] max-sm:text-[25px]">ランキング</h1><p className="text-xs text-muted max-sm:text-[10px]">仲間と集めた発見を、チームの記録に。</p></div><Trophy size={36} strokeWidth={1.2} className="text-[#8b957c]"/></div>
      <section className="mb-[30px] flex flex-wrap items-center gap-x-5 gap-y-3 border border-line bg-[#edefe3] p-5 max-sm:flex-col max-sm:items-stretch max-sm:gap-[9px] max-sm:p-[15px]" aria-label="表示する大会">
        <label htmlFor="ranking-event" className="text-xs max-sm:text-[11px]">大会を選択</label><select id="ranking-event" className="min-h-11 min-w-0 flex-1 border border-[#cdd3be] bg-[#faf9f3] px-3 py-2.5 text-xs text-ink" value={eventUri} onChange={e => chooseEvent(e.target.value)} disabled={events.loading && !eventUri}>
          <option value="">{events.loading ? '大会を読み込んでいます…' : '大会を選んでください'}</option>
          {eventUri && !selected && <option value={eventUri}>URLで指定された大会</option>}
          {events.data?.map(event => <option key={event.uri} value={event.uri}>{eventName(event)}</option>)}
        </select>
        {events.error && <div className="w-full text-[11px] leading-[1.9] text-[#8c624e]"><p role="alert">大会一覧を取得できませんでした。{events.error}</p><button className={cn(button, 'mt-2.5')} onClick={events.retry}>大会一覧を再試行</button></div>}
        {events.data?.length === 0 && <p className={hint}>公開されている大会はありません。</p>}
      </section>
      {parsed.error ? <p className={errorPanel} role="alert">{parsed.error}</p> : !eventUri ? <div className={empty}><Flag size={32}/><h2 className="text-2xl font-bold">大会を選んで順位を確認</h2><p>選択した大会のチーム・獲得ポイント・達成CP数を表示します。</p></div> : <section aria-label="大会の順位表" aria-busy={ranking.loading}>
        <div className="mt-[25px] mb-5 flex items-center justify-between gap-5"><div><h2 className={cn('text-xl font-medium max-sm:text-[17px]', wrapAnywhere)}>{selected ? eventName(selected) : 'チーム順位表'}</h2>{ranking.updatedAt && <p className="mt-2 text-[10px] text-muted">更新 {formatDate(ranking.updatedAt)}</p>}</div><div className="flex shrink-0 flex-wrap justify-end gap-2"><Link className={cn(button, 'max-sm:p-2.5 max-sm:text-[11px]')} to={eventPath(eventUri, 'cards')}>大会ページへ<ArrowUpRight size={15}/></Link><button className={cn(button, 'max-sm:p-2.5 max-sm:text-[11px]')} disabled={ranking.loading} onClick={ranking.retry}><RefreshCw size={15}/>更新</button></div></div>
        {ranking.loading ? <div className={empty} role="status"><Trophy size={30}/><p>ランキングを読み込んでいます…</p></div> : ranking.error ? <div className={errorPanel} role="alert"><p>ランキングを取得できませんでした。{ranking.error}</p><p className="mt-2">ログイン状態と接続先を確認してください。</p><button className={cn(button, 'mt-3')} onClick={ranking.retry}>再試行する</button></div> : ranking.data && <>
          {mine ? <div className="mb-6 border border-l-4 border-[#a7b894] border-l-olive bg-[#e7eddc] px-[25px] py-[22px] max-sm:p-[18px]"><span className={eyebrow}>YOUR TEAM</span><h3 className={cn('mt-2.5 text-xl font-medium max-sm:text-lg', wrapAnywhere)}>{teamName(mine)}</h3><div className="mt-4 flex flex-wrap items-center gap-x-[30px] gap-y-4 max-sm:gap-x-5 max-sm:gap-y-3"><strong className="text-[30px] font-medium text-olive max-sm:text-[26px]">{mine.rank}<small className="ml-1.5 text-xs font-normal">位</small></strong><strong className="text-[30px] font-medium text-olive max-sm:text-[26px]">{mine.totalPoints.toLocaleString('ja-JP')}<small className="ml-1.5 text-xs font-normal">pt</small></strong><span className="text-xs">達成CP {mine.approvedCount}件</span><button className={cn(button, 'ml-auto max-sm:ml-0 max-sm:w-full')} onClick={() => { myRow.current?.scrollIntoView({ behavior: 'auto', block: 'center' }); myRow.current?.focus({ preventScroll: true }); }}>自分の行へ</button></div></div> : <p className={hint}>{client.did ? 'この大会の順位表に、あなたが所属するチームは見つかりませんでした。' : '現在は未ログインです。ログインすると、自分のチームの行を強調表示します。'}</p>}
          {ranking.data.length ? <div className="overflow-x-auto border border-line bg-[#fcfbf6]"><table className="w-full border-collapse text-left"><caption className="border-b border-line px-5 py-4 text-left text-[11px] text-muted max-sm:px-3 max-sm:py-[13px] max-sm:text-[10px]">{selected ? eventName(selected) : '大会'}のチーム順位表 · {ranking.data.length}チーム</caption><thead className="bg-[#eaecdf]"><tr><th scope="col" className={cn(cell, headCell)}>順位</th><th scope="col" className={cn(cell, headCell)}>チーム / メンバー</th><th scope="col" className={cn(cell, headCell)}>達成CP</th><th scope="col" className={cn(cell, headCell, 'text-right')}>ポイント</th></tr></thead><tbody className="[&>tr:last-child>*]:border-b-0">{ranking.data.map(entry => {
            const own = entry.team.uri === mine?.team.uri;
            return <tr key={entry.team.uri} ref={own ? myRow : undefined} className={own ? 'bg-[#e7eedc] shadow-[inset_4px_0_var(--color-olive)] focus:outline-2 focus:-outline-offset-2 focus:outline-[#8d653f]' : ''} aria-current={own ? 'true' : undefined} tabIndex={own ? -1 : undefined}>
              <td className={cn(cell, 'w-[90px] whitespace-nowrap text-olive max-sm:w-[42px]')}>{entry.rank === 1 && <Trophy size={16} className="mr-1.5 inline-block align-middle text-[#947044] max-sm:hidden"/>}<strong className="text-[26px] font-medium max-sm:text-xl">{entry.rank}</strong><span className="sr-only">位</span></td>
              <th scope="row" className={cn(cell, 'text-left font-normal')}><div className={cn('flex flex-wrap items-center gap-2.5 text-base max-sm:gap-1.5 max-sm:text-xs', wrapAnywhere)}>{teamName(entry)}{own && <span className="inline-block bg-olive px-2 py-0.5 text-[10px] font-normal whitespace-nowrap text-white max-sm:px-[5px] max-sm:text-[8px]">あなたのチーム</span>}</div><ul className="mt-2 flex list-none flex-wrap gap-x-3.5 gap-y-[5px] p-0 text-[11px] text-[#6a765e] max-sm:gap-x-2 max-sm:gap-y-[3px] max-sm:text-[9px]">{entry.team.members.map(member => <li key={member.did} className={wrapAnywhere}><span>{member.displayName || `@${member.handle}`}</span>{member.did === client.did && <small className="ml-[5px] bg-[#d2ddc3] px-[5px] py-px text-[9px] font-normal text-olive max-sm:text-[8px]">あなた</small>}</li>)}</ul>{!entry.team.members.length && <span className={hint}>メンバー情報なし</span>}</th>
              <td className={cn(cell, 'w-[100px] whitespace-nowrap text-[19px] max-sm:w-[54px] max-sm:text-[15px]')}>{entry.approvedCount}<small className={unit}>件</small></td><td className={cn(cell, 'w-[140px] whitespace-nowrap text-right text-[27px] text-olive max-sm:w-[65px] max-sm:text-[21px]')}>{entry.totalPoints.toLocaleString('ja-JP')}<small className={unit}>pt</small></td>
            </tr>;
          })}</tbody></table></div> : <div className={empty}><Users size={30}/><h3>参加チームはまだありません</h3><p>参加チームが登録されると、ここに順位が表示されます。</p></div>}
          <p className={hint}>順位・獲得ポイントは大会の集計結果です。承認されたCPの得点がチームごとに一度だけ加算されます。</p>
        </>}
      </section>}
    </main>
    <SiteFooter/>
  </div>;
}
