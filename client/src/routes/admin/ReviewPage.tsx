import { useState } from 'react';
import { Check, CheckCheck, Flag, MapPin, RotateCcw, X } from 'lucide-react';
import { currentDatetimeString } from '@atproto/lex';
import { useAction } from '../../hooks/useAction';
import { r } from '../../lib/lex';
import { useLexClient } from '../../lib/lexClient';
import { checkpointIsGoal, checkpointName, checkpointNumber, checkpointPoint, checkpointRecord, profileName, submissionCheckpointUri, submissionCreatedAt, submissionStatus, teamName, type CheckpointStatus } from '../../lib/rogaining';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/cn';
import { button, buttonPrimary, empty, errorPanel, iconButton, notice as noticeBar, table, textarea } from '../../lib/ui';
import { Status } from '../../components/Status';
import { HelpButton } from '../../components/SiteChrome';
import type { CheckpointView, SubmissionView } from '../../lexicons/win/tomo-x/rogaining/defs';
import { atUriParts, useAdminEventContext } from './adminEventContext';

type Decision = 'approved' | 'rejected';

const errorBox = cn(errorPanel);
const placeholderBox = 'flex aspect-4/3 w-full items-center justify-center border border-dashed border-fg/30 bg-fg/5 text-[11px] text-fg/60';
const comparisonImage = 'aspect-4/3 w-full bg-fg/5 object-contain';
const thumb = 'h-12 w-16 bg-fg/5 object-contain';
const thumbPlaceholder = 'h-12 w-16 border border-dashed border-fg/30 bg-fg/5';
const figcaption = 'mb-1 text-[11px] font-bold text-fg/60';
const hint = 'flex items-center gap-1 bg-accent/10 px-2 py-1 text-[11px]';
const hintWarn = 'bg-fg font-bold text-bg';
const sectionHeading = 'mt-5 mb-2 flex min-h-9 items-center gap-2 border-b border-fg pb-1 text-[13px] font-bold';
const count = 'text-[11px] font-normal text-fg/60';

export default function ReviewPage() {
  const { checkpoints, submissions, teams, isApprover, isAuthor, me, refresh } = useAdminEventContext();
  const client = useLexClient();
  const { run, error, pending: busy } = useAction();
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [missingReason, setMissingReason] = useState('');
  // appview に反映されるまでの間、審査済みの提出を審査待ちから外しておく
  const [decided, setDecided] = useState<Record<string, Decision | 'undone'>>({});

  const checkpointOf = new Map(checkpoints.map((cp, i) => [cp.uri, { cp, index: i }]));
  const teamOf = new Map(teams.map(team => [team.uri, team]));
  const target = (s: SubmissionView) => checkpointOf.get(submissionCheckpointUri(s) ?? '');
  const isGoal = (s: SubmissionView) => { const found = target(s); return found ? checkpointIsGoal(found.cp) : false; };
  const statusOf = (s: SubmissionView): CheckpointStatus => { const local = decided[s.uri]; return local === 'undone' ? 'pending' : local ?? submissionStatus(s); };
  const sorted = [...submissions].sort((a, b) => Date.parse(submissionCreatedAt(a)) - Date.parse(submissionCreatedAt(b)));
  const reviewable = sorted.filter(s => !isGoal(s));
  const waiting = reviewable.filter(s => statusOf(s) === 'pending');
  const reviewed = reviewable.filter(s => statusOf(s) !== 'pending').reverse();
  const goals = sorted.filter(isGoal).reverse();

  async function review(s: SubmissionView, decision: Decision) {
    const reason = (reasons[s.uri] ?? '').trim();
    setMissingReason(decision === 'rejected' && !reason ? s.uri : '');
    if (decision === 'rejected' && !reason) return;
    const ok = await run(async () => {
      const record = { submit: { uri: s.uri, cid: s.cid }, ...(reason ? { reason } : {}), createdAt: currentDatetimeString() };
      if (decision === 'approved') await client.create(r.approve, record);
      else await client.create(r.reject, record);
    });
    if (!ok) return;
    setDecided(previous => ({ ...previous, [s.uri]: decision }));
    setNotice(decision === 'approved' ? '承認しました。ランキングへの反映まで数秒かかることがあります。' : '不承認にしました。参加者は再提出できます。');
    refresh('submissions');
  }
  async function undo(s: SubmissionView) {
    const reviewUri = s.approvalUri ?? s.rejectionUri;
    if (!reviewUri) return;
    const { repo, rkey } = atUriParts(reviewUri);
    if (repo !== me) { window.alert('他のアカウントが作成した審査結果は取り消せません。'); return; }
    if (!window.confirm('この審査結果を取り消して、審査待ちに戻しますか？')) return;
    const ok = await run(async () => {
      if (s.approvalUri) await client.delete(r.approve, { rkey });
      else await client.delete(r.reject, { rkey });
    });
    if (!ok) return;
    setDecided(previous => ({ ...previous, [s.uri]: 'undone' }));
    setNotice('審査結果を取り消しました。');
    refresh('submissions');
  }

  const teamLabel = (s: SubmissionView) => teamOf.get(s.team) ? teamName(teamOf.get(s.team)!) : 'チーム不明';

  return <section>
    <div className="mb-2 flex min-h-9 items-center gap-4 text-[13px]">
      <span>審査待ち <b className="text-[15px]">{waiting.length}</b></span>
      <span className="text-fg/60">審査済み <b className="text-[15px] text-fg">{reviewed.length}</b></span>
      <HelpButton title="写真審査" className="ml-auto">
        <p>提出写真を目標画像と見比べて、承認または不承認にします。審査できるのはイベントの承認者だけです。</p>
        <ul><li>審査結果は承認者のPDSに記録されます。取り消すと審査待ちに戻ります。</li><li>不承認にするには理由が必要です。参加者は再提出できます。</li><li>ゴールの提出は審査の対象外です。提出の早い順にタイムボーナスが加算されます。</li></ul>
      </HelpButton>
    </div>
    {!isApprover && <p className={errorBox} role="alert">{isAuthor ? 'ログイン中のアカウントはこのイベントの承認者ではありません。提出写真は閲覧できますが、審査できるのは承認者だけです。' : '審査できるのはイベントの承認者だけです。'}</p>}
    {notice && <div className={noticeBar} role="status">{notice}<button className={iconButton} aria-label="通知を閉じる" onClick={() => setNotice('')}><X size={16}/></button></div>}
    {error && <p role="alert" className={errorBox}>{error}</p>}
    <div className="grid gap-3">{waiting.map(s => {
      const found = target(s);
      return <article key={s.uri} className="grid gap-3 border border-fg/10 p-3 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid min-w-0 grid-cols-2 gap-2">
          <figure className="min-w-0"><figcaption className={figcaption}>目標画像</figcaption>{found?.cp.imageUrl ? <img className={comparisonImage} src={found.cp.imageUrl} alt={`${checkpointName(found.cp)}の目標画像`} /> : <div className={placeholderBox} />}</figure>
          <figure className="min-w-0"><figcaption className={figcaption}>提出画像</figcaption>{s.photoUrl ? <a href={s.photoUrl} target="_blank" rel="noreferrer"><img className={comparisonImage} src={s.photoUrl} alt="提出画像" /></a> : <div className={placeholderBox} />}</figure>
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <div><div className="flex justify-between gap-2 text-[14px] font-bold"><h3 className="[overflow-wrap:anywhere]">{found ? `CP ${checkpointNumber(found.index)} ${checkpointName(found.cp)}` : '不明なCP'}</h3><span className="whitespace-nowrap">{found ? `${checkpointPoint(found.cp)}pt` : ''}</span></div>
            <p className="text-[11px] text-fg/60">{teamLabel(s)} · {profileName(s.author)} · {formatDate(submissionCreatedAt(s))}</p></div>
          <ReviewHints submission={s} checkpoint={found?.cp} />
          {found && (found.cp.internalImageUrls?.length ?? 0) > 0 && <details className="text-[11px]"><summary className="flex h-7 cursor-pointer items-center text-fg/60">内部用画像（{found.cp.internalImageUrls!.length}枚）</summary><div className="mt-1 grid grid-cols-4 gap-1">{found.cp.internalImageUrls!.map(url => <a key={url} href={url} target="_blank" rel="noreferrer"><img className="aspect-square w-full bg-fg/5 object-cover" src={url} alt="内部用画像" /></a>)}</div></details>}
          <label className="block text-[11px] font-bold text-fg/60">コメント・不承認の理由<textarea className={cn(textarea, 'mt-1 block min-h-16 resize-y font-normal')} value={reasons[s.uri] ?? ''} onChange={e => setReasons({ ...reasons, [s.uri]: e.target.value })} placeholder="不承認の場合は必須" maxLength={300} aria-invalid={missingReason === s.uri}/></label>
          {missingReason === s.uri && <p className="text-[12px] font-bold" role="alert">不承認にするには理由を入力してください。</p>}
          <div className="grid grid-cols-2 gap-2"><button className={button} disabled={busy || !isApprover} onClick={() => void review(s, 'rejected')}><X size={16}/>不承認</button><button className={buttonPrimary} disabled={busy || !isApprover} onClick={() => void review(s, 'approved')}><Check size={16}/>承認</button></div>
        </div>
      </article>;
    })}</div>
    {!waiting.length && <div className={cn(empty, 'py-6')}><CheckCheck size={20}/><p>審査待ちの写真はありません</p></div>}

    <h3 className={sectionHeading}>審査済み <small className={count}>{reviewed.length}件</small></h3>
    {reviewed.length ? <div className="overflow-x-auto"><table className={table}>
      <thead><tr><th><span className="sr-only">写真</span></th><th>CP</th><th>チーム / 提出者</th><th>提出日時</th><th>結果</th><th>理由</th><th><span className="sr-only">操作</span></th></tr></thead>
      <tbody>{reviewed.map(s => {
        const found = target(s);
        const local = decided[s.uri];
        return <tr key={s.uri}>
          <td>{s.photoUrl ? <img className={thumb} src={s.photoUrl} alt="提出画像" /> : <div className={thumbPlaceholder} />}</td>
          <td className="[overflow-wrap:anywhere]">{found ? `${checkpointNumber(found.index)} ${checkpointName(found.cp)}` : '不明なCP'}</td>
          <td>{teamLabel(s)}<span className="block text-[11px] text-fg/60">{profileName(s.author)}</span></td>
          <td className="whitespace-nowrap">{formatDate(submissionCreatedAt(s))}</td>
          <td><Status value={statusOf(s)} />{local && local !== 'undone' && <span className="ml-1 text-[11px] text-fg/60">反映待ち</span>}</td>
          <td className="max-w-[240px] [overflow-wrap:anywhere]">{s.reason}</td>
          <td className="text-right">{isApprover && !local && (s.approvalUri ?? s.rejectionUri) && <button type="button" className={iconButton} disabled={busy} aria-label="審査結果を取り消す" title="審査結果を取り消す" onClick={() => void undo(s)}><RotateCcw size={16}/></button>}</td>
        </tr>;
      })}</tbody>
    </table></div> : <p className="py-3 text-fg/60">審査済みの提出はまだありません。</p>}

    <h3 className={sectionHeading}>ゴール記録 <small className={count}>{goals.length}件</small></h3>
    {goals.length ? <div className="overflow-x-auto"><table className={table}>
      <thead><tr><th><span className="sr-only">写真</span></th><th>チーム</th><th>提出者</th><th>提出日時</th></tr></thead>
      <tbody>{goals.map(s => <tr key={s.uri}>
        <td>{s.photoUrl ? <img className={thumb} src={s.photoUrl} alt="ゴールの提出画像" /> : <div className={thumbPlaceholder} />}</td>
        <td><span className="inline-flex items-center gap-1"><Flag size={12}/>{teamLabel(s)}</span></td>
        <td>{profileName(s.author)}</td>
        <td className="whitespace-nowrap">{formatDate(submissionCreatedAt(s))}</td>
      </tr>)}</tbody>
    </table></div> : <p className="py-3 text-fg/60">ゴールした提出はまだありません。</p>}
  </section>;
}

/** 審査の参考情報 (CPからの距離・大会期間内か) */
function ReviewHints({ submission, checkpoint }: { submission: SubmissionView; checkpoint?: CheckpointView }) {
  const radius = checkpoint ? checkpointRecord(checkpoint).radiusMeters ?? 30 : undefined;
  const far = submission.distanceMeters !== undefined && radius !== undefined && submission.distanceMeters > radius;
  return <ul className="flex flex-wrap gap-1">
    {submission.distanceMeters !== undefined && <li className={cn(hint, far && hintWarn)}><MapPin size={12}/>CPから {submission.distanceMeters.toLocaleString()}m{radius !== undefined && `（許容 ${radius}m${far ? '・範囲外' : ''}）`}</li>}
    {submission.withinEventPeriod === false && <li className={cn(hint, hintWarn)}>大会期間外の提出です</li>}
  </ul>;
}
