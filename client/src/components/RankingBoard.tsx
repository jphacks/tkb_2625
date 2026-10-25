import { useRef } from 'react';
import type { AtUriString } from '@atproto/lex';
import { RefreshCw } from 'lucide-react';
import { useRanking } from '../hooks/useRogainingQuery';
import { useLexClient } from '../lib/lexClient';
import { formatDate } from '../lib/utils';
import { cn } from '../lib/cn';
import { button, empty, errorPanel, iconButton, table } from '../lib/ui';
import type { RankingEntry } from '../lexicons/win/tomo-x/rogaining/defs';

const wrapAnywhere = '[overflow-wrap:anywhere]';

function teamName(entry: RankingEntry) {
  return typeof entry.team.record.name === 'string' && entry.team.record.name.trim() ? entry.team.record.name : '名前のないチーム';
}

/** イベントのチーム順位表。参加者画面と管理画面のランキングタブで使う */
export default function RankingBoard({ uri }: { uri: AtUriString }) {
  const client = useLexClient();
  const ranking = useRanking(uri);
  const mine = client.did ? ranking.data?.find(entry => entry.team.members.some(member => member.did === client.did)) : undefined;
  const myRow = useRef<HTMLTableRowElement>(null);
  return <section aria-label="チーム順位表" aria-busy={ranking.loading}>
    <div className="mb-2 flex min-h-9 flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
      {mine && <>
        <strong className={wrapAnywhere}>{teamName(mine)}</strong><strong className="text-accent">{mine.rank}位</strong><strong>{mine.totalPoints.toLocaleString('ja-JP')}pt</strong>
        <button className={cn(button, 'h-7')} onClick={() => { myRow.current?.scrollIntoView({ behavior: 'auto', block: 'center' }); myRow.current?.focus({ preventScroll: true }); }}>自分の行へ</button>
      </>}
      <button className={cn(iconButton, 'ml-auto')} disabled={ranking.loading} onClick={ranking.retry} aria-label="更新" title={ranking.updatedAt ? `更新 ${formatDate(ranking.updatedAt)}` : '更新'}><RefreshCw size={16}/></button>
    </div>
    {ranking.loading && !ranking.data ? <div className={empty} role="status"><p>読み込み中…</p></div>
      : ranking.error ? <div className={errorPanel} role="alert"><p>ランキングを取得できませんでした。{ranking.error}</p><button className={cn(button, 'mt-2')} onClick={ranking.retry}>再試行</button></div>
      : ranking.data?.length ? <div className="overflow-x-auto"><table className={table}><caption className="sr-only">チーム順位表 · {ranking.data.length}チーム</caption><thead><tr><th scope="col" className="w-12">順位</th><th scope="col">チーム / メンバー</th><th scope="col" className="text-right">達成CP</th><th scope="col" className="text-right">ポイント</th></tr></thead><tbody>{ranking.data.map(entry => {
        const own = entry.team.uri === mine?.team.uri;
        return <tr key={entry.team.uri} ref={own ? myRow : undefined} className={own ? 'bg-accent/10 font-bold focus:outline-2 focus:-outline-offset-2 focus:outline-accent' : ''} aria-current={own ? 'true' : undefined} tabIndex={own ? -1 : undefined}>
          <td className="whitespace-nowrap tabular-nums"><strong className="font-bold">{entry.rank}</strong><span className="sr-only">位</span></td>
          <th scope="row" className="!text-[13px] ![font-weight:inherit] !text-fg"><div className={wrapAnywhere}>{teamName(entry)}</div>{entry.team.members.length ? <ul className="flex list-none flex-wrap gap-x-3 p-0 text-[12px] font-normal text-fg/60">{entry.team.members.map(member => <li key={member.did} className={wrapAnywhere}>{member.displayName || `@${member.handle}`}{member.did === client.did && <b className="ml-1 text-accent">あなた</b>}</li>)}</ul> : <span className="text-[12px] font-normal text-fg/60">メンバー情報なし</span>}</th>
          <td className="text-right whitespace-nowrap tabular-nums">{entry.approvedCount}<small className="ml-0.5 text-[11px] font-normal">件</small></td><td className="text-right whitespace-nowrap tabular-nums">{entry.totalPoints.toLocaleString('ja-JP')}<small className="ml-0.5 text-[11px] font-normal">pt</small></td>
        </tr>;
      })}</tbody></table></div>
      : ranking.data && <div className={empty}><p>参加チームはまだありません。</p></div>}
  </section>;
}
