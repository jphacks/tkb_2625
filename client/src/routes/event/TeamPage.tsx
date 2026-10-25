import { Link } from 'react-router-dom';
import { RefreshCw, Trophy, Users } from 'lucide-react';
import { useEventContext } from './EventLayout';
import { Photo, Status } from '../../components/Status';
import { useRanking } from '../../hooks/useRogainingQuery';
import { cn } from '../../lib/cn';
import { useLexClient } from '../../lib/lexClient';
import { button, empty, errorText, eyebrow, iconButton, textButton } from '../../lib/ui';
import { formatDate } from '../../lib/utils';
import { checkpointIsGoal, checkpointName, checkpointNumber, checkpointPoint, profileName, submissionCheckpointUri, submissionCreatedAt, submissionStatus, teamName } from '../../lib/rogaining';

const stat = 'flex flex-col px-2 py-1.5';
const statBorder = `${stat} border-l border-fg/10`;
const statValue = 'text-[18px] leading-tight font-bold tabular-nums';
const statUnit = 'ml-0.5 text-[11px] font-normal text-fg/60';
const statLabel = 'flex items-center gap-1 text-[11px] text-fg/60';
const avatar = 'grid size-6 shrink-0 place-items-center bg-fg/10 text-[11px] font-bold';
const tag = 'shrink-0 bg-fg px-1 text-[11px] leading-[18px] font-bold text-bg tabular-nums';

export default function TeamPage() {
  const { uri, team, checkpoints, submissions, points, approvedCount, submissionsState } = useEventContext();
  const client = useLexClient();
  const ranking = useRanking(uri);
  if (!team) return <div className={empty}><Users size={20}/><h3>チームに所属していません</h3><p>主催者がチームを登録すると表示されます。</p><Link className={button} to={`/ranking?${new URLSearchParams({ event: uri })}`}>ランキングを見る</Link></div>;
  const mine = ranking.data?.find(entry => entry.team.uri === team.uri);
  const scored = checkpoints.filter(cp => !checkpointIsGoal(cp)).length;
  const checkpointOf = (submissionUri: string | undefined) => { const index = checkpoints.findIndex(cp => cp.uri === submissionUri); return index < 0 ? undefined : { cp: checkpoints[index], number: checkpointNumber(index) }; };
  // 同じチェックポイントの承認は一度だけ得点になる (最初に承認された提出に表示する)
  const counted = new Set<string>();
  const earned = new Set([...submissions].reverse().filter(s => { const cp = submissionCheckpointUri(s); if (s.status !== 'approved' || !cp || counted.has(cp)) return false; counted.add(cp); return true; }).map(s => s.uri));
  return <div className="grid grid-cols-[300px_minmax(0,1fr)] items-start gap-3 max-md:grid-cols-[240px_minmax(0,1fr)] max-sm:grid-cols-1">
    <section className="border border-fg/25">
      <h2 className="flex h-9 items-center border-b border-fg/10 px-3 text-[15px] font-bold">{teamName(team)}</h2>
      <div className="grid grid-cols-3 border-b border-fg/10">
        <div className={stat}><strong className={statValue}>{mine?.totalPoints ?? points}<small className={statUnit}>pt</small></strong><span className={statLabel}>獲得{mine && mine.totalPoints !== points ? '(ボーナス込)' : ''}</span></div>
        <div className={statBorder}><strong className={statValue}>{approvedCount}<small className={statUnit}>/ {scored}</small></strong><span className={statLabel}>達成CP</span></div>
        <div className={statBorder}><strong className={statValue}>{ranking.loading ? '…' : mine ? mine.rank : '—'}<small className={statUnit}>{ranking.data && `/ ${ranking.data.length}`}</small></strong><span className={statLabel}><Trophy size={12}/>順位</span></div>
      </div>
      {ranking.error && <p className={cn(errorText, 'mt-0 px-3 py-1.5')} role="alert">順位を取得できません。{ranking.error} <button className={textButton} onClick={ranking.retry}>再試行</button></p>}
      <h3 className={cn(eyebrow, 'px-3 pt-2 pb-1')}>メンバー {team.members.length}</h3>
      <ul className="px-3 pb-1">{team.members.map(member => <li key={member.did} className="flex h-9 items-center gap-2 border-b border-fg/10 text-[13px] last:border-0">{member.avatar ? <img className={cn(avatar, 'object-cover')} src={member.avatar} alt=""/> : <span className={avatar}>{profileName(member).replace(/^@/, '')[0]}</span>}<span className="min-w-0 truncate">{profileName(member)}{member.displayName && <small className="text-[11px] text-fg/60"> @{member.handle}</small>}</span>{member.did === client.did && <small className="ml-auto shrink-0 text-[11px] font-bold text-accent">あなた</small>}</li>)}</ul>
    </section>
    <section className="min-w-0 border border-fg/25">
      <div className="flex h-9 items-center gap-2 border-b border-fg/10 pl-3"><h2 className="text-[15px] font-bold">提出履歴</h2><span className="text-[11px] text-fg/60">{submissions.length}件{submissionsState.updatedAt && ` · ${formatDate(submissionsState.updatedAt)} 更新`}</span><button className={cn(iconButton, 'ml-auto')} onClick={() => { submissionsState.refresh(); ranking.retry(); }} disabled={submissionsState.loading} aria-label="更新" title="更新"><RefreshCw size={16} className={cn(submissionsState.loading && 'animate-spin')}/></button></div>
      {submissions.map(s => { const found = checkpointOf(submissionCheckpointUri(s)); const name = found ? checkpointName(found.cp) : '削除されたチェックポイント'; const goal = found && checkpointIsGoal(found.cp); const status = goal ? 'approved' : submissionStatus(s); return <article className="flex items-center gap-2 border-b border-fg/10 px-2 py-1.5 last:border-0" key={s.uri}>
        <Photo src={s.photoUrl} alt={`${name}の提出画像`} placeholder={null} className="size-12 shrink-0 object-cover" placeholderClassName="aspect-auto size-12 w-12 shrink-0 overflow-hidden text-[10px]"/>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5"><span className={tag}>{goal ? 'GOAL' : found ? found.number : '—'}</span><h3 className="truncate text-[13px] font-bold">{name}</h3></div>
          <div className="mt-0.5 truncate text-[11px] text-fg/60">{formatDate(submissionCreatedAt(s))} · {profileName(s.author)}</div>
          {s.reason && <p className="mt-0.5 text-[12px]">{s.reason}</p>}
        </div>
        <Status value={status} label={goal ? 'ゴール' : undefined}/>
        <strong className={cn('w-11 shrink-0 text-right text-[14px] font-bold tabular-nums', earned.has(s.uri) ? 'text-accent' : 'text-fg/30')}>{earned.has(s.uri) && found ? `+${checkpointPoint(found.cp)}` : '—'}</strong>
      </article>; })}
      {!submissions.length && <p className="px-3 py-6 text-center text-[13px] text-fg/60">提出はまだありません。</p>}
    </section>
  </div>;
}
