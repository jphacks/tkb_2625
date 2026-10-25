import { useState } from 'react';
import { Check, CheckCheck, Flag, MapPin, RotateCcw, X } from 'lucide-react';
import { currentDatetimeString } from '@atproto/lex';
import { useAction } from '../../hooks/useAction';
import { r } from '../../lib/lex';
import { useLexClient } from '../../lib/lexClient';
import { checkpointIsGoal, checkpointName, checkpointNumber, checkpointPoint, checkpointRecord, profileName, STATUSES, submissionCheckpointUri, submissionCreatedAt, submissionStatus, teamName, type CheckpointStatus } from '../../lib/rogaining';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/cn';
import { button, buttonPrimary, empty, errorPanel, eyebrow, iconButton, notice as noticeBar } from '../../lib/ui';
import { PageHeading, Status } from '../../components/Status';
import type { CheckpointView, SubmissionView } from '../../lexicons/win/tomo-x/rogaining/defs';
import { atUriParts, useAdminEventContext } from './adminEventContext';

type Decision = 'approved' | 'rejected';

const errorBox = cn(errorPanel);
const placeholderBox = 'flex aspect-4/3 w-full flex-col items-center justify-center gap-3 border border-dashed border-[#c4cdb5] bg-[#e9ebdf] text-[11px] text-[#8b957c]';
const comparisonPlaceholder = cn(placeholderBox, 'max-sm:max-h-60');
const comparisonImage = 'aspect-4/3 w-full bg-[#e9ebdf] object-contain max-sm:aspect-square max-sm:max-h-60';
const listPlaceholder = cn(placeholderBox, 'aspect-auto h-20 w-[95px] max-sm:size-[62px]');
const listImage = 'h-20 w-[95px] bg-[#e5e8da] object-contain max-sm:size-[62px]';
const listWrap = 'border border-line bg-[#fcfbf6] px-[22px] max-sm:px-3';
const listRow = 'grid grid-cols-[95px_1fr_auto_44px] items-center gap-5 border-b border-line py-[18px] last:border-0 max-sm:grid-cols-[62px_minmax(0,1fr)_auto] max-sm:gap-3';
const listEyebrow = cn(eyebrow, 'max-sm:text-[8px]');
const listTitle = 'my-1.5 text-[15px] font-medium [overflow-wrap:anywhere] max-sm:text-[13px]';
const listText = 'text-[10px] text-muted';
const sectionTitle = 'mt-7 mb-5';
const sectionHeading = 'text-xl font-medium tracking-[1px] max-sm:text-lg';
const sectionCount = 'text-xs font-normal text-muted';
const sectionText = 'mt-[9px] text-[11px] leading-[1.9] text-muted max-sm:text-[10px]';
const summaryText = 'text-xs text-muted max-sm:text-[10px]';
const hint = 'flex items-center gap-[5px] bg-[#e9eddf] px-2 py-1 text-[10px] text-[#59674e]';
const hintWarn = 'bg-[#f0e4d9] text-[#8c4f3b]';
const summaryCount = 'px-1.5 text-lg font-medium max-sm:text-[15px]';

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

  return <section>
    <PageHeading eyebrow="REVIEW DESK" title="写真審査" text="提出写真を確認して、参加者の発見を承認しましょう。" />
    {!isApprover && <p className={errorBox} role="alert">{isAuthor ? 'ログイン中のアカウントはこのイベントの承認者ではありません。提出写真は閲覧できますが、審査できるのはイベントに設定された承認者だけです。' : '審査できるのはイベントに設定された承認者だけです。'}</p>}
    {notice && <div className={noticeBar} role="status">{notice}<button className={iconButton} aria-label="通知を閉じる" onClick={() => setNotice('')}><X size={18}/></button></div>}
    {error && <p role="alert" className={errorBox}>{error}</p>}
    <div className="mb-5 flex items-center gap-[30px] border-b border-line py-[25px] max-sm:gap-5 max-sm:py-[15px]"><div><span className={eyebrow}>ALL TEAMS</span><h2 className="mt-2 text-[21px] font-medium max-sm:text-[17px]">全チームの提出写真</h2></div><span className={summaryText}>審査待ち <b className={summaryCount}>{waiting.length}</b>件</span><span className={summaryText}>審査済み <b className={summaryCount}>{reviewed.length}</b>件</span></div>
    <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1 max-sm:gap-5">{waiting.map(s => {
      const found = target(s);
      return <article key={s.uri} className="border border-line bg-[#fcfbf6] p-[23px] max-sm:p-[17px]">
        <div className="flex justify-between gap-2.5"><h3 className="text-[15px] font-medium max-sm:text-[13px]">{found ? `CP ${checkpointNumber(found.index)} / ${checkpointName(found.cp)}` : '不明なCP'}</h3><span className="text-[13px]">{found ? `${checkpointPoint(found.cp)}pt` : ''}</span></div>
        <p className="mt-2 mb-5 text-[10px] text-muted">{teamOf.get(s.team) ? teamName(teamOf.get(s.team)!) : 'チーム不明'} · {profileName(s.author)} · {formatDate(submissionCreatedAt(s))} 提出</p>
        <ReviewHints submission={s} checkpoint={found?.cp} />
        <div className="grid grid-cols-2 gap-3.5 max-sm:gap-2.5"><figure className="min-w-0"><figcaption className="mb-2 flex justify-between gap-1.5 text-[10px] tracking-[0.3px] text-muted">目標画像</figcaption>{found?.cp.imageUrl ? <img className={comparisonImage} src={found.cp.imageUrl} alt={`${checkpointName(found.cp)}の目標画像`} /> : <div className={comparisonPlaceholder} />}</figure><figure className="min-w-0"><figcaption className="mb-2 flex justify-between gap-1.5 text-[10px] tracking-[0.3px] text-muted">提出画像</figcaption>{s.photoUrl ? <a href={s.photoUrl} target="_blank" rel="noreferrer"><img className={comparisonImage} src={s.photoUrl} alt="提出画像" /></a> : <div className={comparisonPlaceholder} />}</figure></div>
        {found && (found.cp.internalImageUrls?.length ?? 0) > 0 && <details className="mt-3.5 text-[11px] text-muted"><summary className="min-h-8 cursor-pointer">内部用画像（{found.cp.internalImageUrls!.length}枚）</summary><div className="mt-2 grid grid-cols-4 gap-2">{found.cp.internalImageUrls!.map(url => <a key={url} href={url} target="_blank" rel="noreferrer"><img className="aspect-square w-full bg-[#e9ebdf] object-cover" src={url} alt="内部用画像" /></a>)}</div></details>}
        <label className="mt-4 block text-[11px] text-muted">コメント・不承認の理由<textarea className="mt-2 block min-h-[85px] w-full resize-y border border-line bg-paper p-2.5 text-xs text-ink" value={reasons[s.uri] ?? ''} onChange={e => setReasons({ ...reasons, [s.uri]: e.target.value })} placeholder="不承認の場合は理由を入力してください（承認時は任意のコメント）" maxLength={300} aria-invalid={missingReason === s.uri}/></label>
        {missingReason === s.uri && <p className={errorBox} role="alert">不承認にするには理由を入力してください。</p>}
        <div className="mt-3.5 flex justify-end gap-2.5"><button className={button} disabled={busy || !isApprover} onClick={() => void review(s, 'rejected')}><X size={16}/>不承認</button><button className={buttonPrimary} disabled={busy || !isApprover} onClick={() => void review(s, 'approved')}><Check size={16}/>承認する</button></div>
      </article>;
    })}</div>
    {!waiting.length && <div className={empty}><CheckCheck size={32}/><h3>審査待ちの写真はありません</h3><p>新しい写真が提出されると、ここに表示されます。</p></div>}

    <div className={sectionTitle}><h3 className={sectionHeading}>審査済み <small className={sectionCount}>{reviewed.length}件</small></h3><p className={sectionText}>承認・不承認の結果は承認者のPDSに記録されます。取り消すと審査待ちに戻ります。</p></div>
    {reviewed.length ? <div className={listWrap}>{reviewed.map(s => {
      const found = target(s);
      const local = decided[s.uri];
      return <article key={s.uri} className={listRow}>{s.photoUrl ? <img className={listImage} src={s.photoUrl} alt="提出画像" /> : <div className={listPlaceholder} />}<div><span className={listEyebrow}>{found ? `CP ${checkpointNumber(found.index)}` : 'CP'} · {formatDate(submissionCreatedAt(s))}</span><h4 className={listTitle}>{found ? checkpointName(found.cp) : '不明なCP'}</h4><p className={listText}>{teamOf.get(s.team) ? teamName(teamOf.get(s.team)!) : 'チーム不明'} · {profileName(s.author)}</p>{s.reason && <p className={listText}>「{s.reason}」</p>}{local && local !== 'undone' && <p className={listText}>反映待ち</p>}</div><div className="justify-self-end"><Status value={statusOf(s)} /></div>{isApprover && !local && (s.approvalUri ?? s.rejectionUri) ? <button type="button" className={cn(iconButton, 'max-sm:col-start-3 max-sm:row-start-2 max-sm:-mt-3')} disabled={busy} aria-label="審査結果を取り消す" title="審査結果を取り消す" onClick={() => void undo(s)}><RotateCcw size={17}/></button> : <span />}</article>;
    })}</div> : <div className={empty}>審査済みの提出はまだありません。</div>}

    <div className={sectionTitle}><h3 className={sectionHeading}>ゴール記録 <small className={sectionCount}>{goals.length}件</small></h3><p className={sectionText}>ゴールの提出は審査の対象外です。提出の早い順にタイムボーナスが加算されます。</p></div>
    {goals.length ? <div className={listWrap}>{goals.map(s => <article key={s.uri} className={listRow}>{s.photoUrl ? <img className={listImage} src={s.photoUrl} alt="ゴールの提出画像" /> : <div className={listPlaceholder} />}<div><span className={listEyebrow}><Flag size={11}/> GOAL · {formatDate(submissionCreatedAt(s))}</span><h4 className={listTitle}>{teamOf.get(s.team) ? teamName(teamOf.get(s.team)!) : 'チーム不明'}</h4><p className={listText}>{profileName(s.author)}</p></div><span /><span /></article>)}</div> : <div className={empty}>ゴールした提出はまだありません。</div>}
  </section>;
}

/** 審査の参考情報 (CPからの距離・大会期間内か) */
function ReviewHints({ submission, checkpoint }: { submission: SubmissionView; checkpoint?: CheckpointView }) {
  const radius = checkpoint ? checkpointRecord(checkpoint).radiusMeters ?? 30 : undefined;
  const far = submission.distanceMeters !== undefined && radius !== undefined && submission.distanceMeters > radius;
  return <ul className="-mt-2.5 mb-4 flex flex-wrap gap-2">
    {submission.distanceMeters !== undefined && <li className={cn(hint, far && hintWarn)}><MapPin size={13}/>CPから {submission.distanceMeters.toLocaleString()}m{radius !== undefined && `（許容 ${radius}m${far ? '・範囲外' : ''}）`}</li>}
    {submission.withinEventPeriod === false && <li className={cn(hint, hintWarn)}>大会期間外の提出です</li>}
  </ul>;
}
