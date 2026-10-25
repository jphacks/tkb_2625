import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { ArrowRight, Camera, CheckCheck, Flag, ImagePlus, MapPin, RefreshCw, X } from 'lucide-react';
import { currentDatetimeString, type LexMap, type UriString } from '@atproto/lex';
import { useEventContext } from './EventLayout';
import { Photo, Status } from '../../components/Status';
import { HelpButton } from '../../components/SiteChrome';
import { useDialog } from '../../hooks/useDialog';
import { useAction } from '../../hooks/useAction';
import { prepareImageBlob } from '../../lib/images';
import { useLexClient } from '../../lib/lexClient';
import { r } from '../../lib/lex';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/cn';
import { button, buttonPrimary, empty, errorPanel, errorText, iconButton, infoPanel, successPanel } from '../../lib/ui';
import { checkpointIsGoal, checkpointName, checkpointNumber, checkpointPoint, checkpointRecord, STATUSES, toLocation, type CheckpointStatus } from '../../lib/rogaining';
import type { CheckpointView, SubmissionView } from '../../lexicons/win/tomo-x/rogaining/defs';

type Sort = 'number' | 'points-desc' | 'points-asc' | 'name' | 'status';
type Numbered = { cp: CheckpointView; number: string; status: CheckpointStatus };

const radius = (cp: CheckpointView) => checkpointRecord(cp).radiusMeters ?? 30;
const area = (cp: CheckpointView) => checkpointIsGoal(cp) ? 'ゴール' : `半径 ${radius(cp)}m 以内で撮影`;

const filterButton = (active: boolean) => cn('inline-flex h-9 items-center justify-center gap-1 border px-2.5 text-[12px] whitespace-nowrap max-sm:flex-1 max-sm:px-1', active ? 'border-accent bg-accent font-bold text-bg' : 'border-fg/10 text-fg/60 hover:bg-fg/5');
const filterCount = 'text-[11px] tabular-nums opacity-70';
const comparisonImage = 'aspect-[4/3] w-full bg-fg/5 object-contain';
const placeholder = 'flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 border border-dashed border-fg/30 bg-fg/5 text-[11px] text-fg/60';
const caption = 'mb-1 flex justify-between gap-1 text-[11px] text-fg/60';
const bigButton = 'h-11 text-[14px]';

export default function CardsPage() {
  const { checkpoints, statusOf, submissionsState } = useEventContext();
  const [filter, setFilter] = useState<CheckpointStatus | 'all'>('all');
  const [sort, setSort] = useState<Sort>('number');
  const [selected, setSelected] = useState<CheckpointView | null>(null);
  const numbered: Numbered[] = checkpoints.map((cp, i) => ({ cp, number: checkpointNumber(i), status: statusOf(cp) }));
  const counts = Object.fromEntries(Object.keys(STATUSES).map(status => [status, numbered.filter(c => c.status === status).length]));
  const compare: Record<Sort, (a: Numbered, b: Numbered) => number> = {
    number: (a, b) => a.number.localeCompare(b.number),
    'points-desc': (a, b) => checkpointPoint(b.cp) - checkpointPoint(a.cp),
    'points-asc': (a, b) => checkpointPoint(a.cp) - checkpointPoint(b.cp),
    name: (a, b) => checkpointName(a.cp).localeCompare(checkpointName(b.cp), 'ja'),
    status: (a, b) => STATUSES[a.status].rank - STATUSES[b.status].rank,
  };
  const visible = numbered.filter(c => filter === 'all' || c.status === filter).sort((a, b) => compare[sort](a, b) || a.number.localeCompare(b.number));
  const selectedNumber = numbered.find(c => c.cp.uri === selected?.uri)?.number ?? '';
  return <>
    <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
      <div className="flex gap-1 max-sm:w-full" role="group" aria-label="提出状況で絞り込み">
        <button className={filterButton(filter === 'all')} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>すべて<span className={filterCount}>{checkpoints.length}</span></button>
        {(Object.keys(STATUSES) as CheckpointStatus[]).map(key => <button key={key} className={filterButton(filter === key)} aria-pressed={filter === key} onClick={() => setFilter(key)}>{STATUSES[key].label}<span className={filterCount}>{counts[key]}</span></button>)}
      </div>
      <div className="ml-auto flex items-center gap-1 max-sm:ml-0 max-sm:w-full">
        <span className="text-[11px] text-fg/60 max-sm:flex-1">{visible.length}件{submissionsState.updatedAt && ` · ${formatDate(submissionsState.updatedAt)} 更新`}</span>
        <label><span className="sr-only">並び順</span><select className="h-9 border border-fg/25 bg-bg px-1 text-[12px]" value={sort} onChange={e => setSort(e.target.value as Sort)}><option value="number">番号順</option><option value="points-desc">配点の高い順</option><option value="points-asc">配点の低い順</option><option value="name">名前順</option><option value="status">状態順</option></select></label>
        <button className={iconButton} onClick={submissionsState.refresh} disabled={submissionsState.loading} aria-label="審査状況を更新" title="審査状況を更新"><RefreshCw size={16} className={cn(submissionsState.loading && 'animate-spin')}/></button>
      </div>
    </div>
    {visible.length ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{visible.map(({ cp, number, status }) => <button key={cp.uri} className="flex min-w-0 flex-col border border-fg/10 bg-bg p-0 text-left hover:border-fg/40" onClick={() => setSelected(cp)} aria-label={`${checkpointName(cp)} ${checkpointPoint(cp)}ポイント ${STATUSES[status].label} 詳細を開く`}>
      <div className="relative aspect-[3/2] overflow-hidden"><Photo src={cp.imageUrl} alt={`${checkpointName(cp)}の目標画像`} loading="lazy" className="size-full object-cover" placeholderClassName="h-full aspect-auto"/><span className="absolute top-0 left-0 bg-fg px-1 text-[11px] leading-[18px] font-bold text-bg tabular-nums">{checkpointIsGoal(cp) ? 'GOAL' : number}</span></div>
      <div className="flex min-w-0 flex-col gap-1 px-1.5 py-1">
        <h3 className="truncate text-[13px] font-bold">{checkpointName(cp)}</h3>
        <div className="flex items-center justify-between gap-1"><strong className="text-[14px] font-bold tabular-nums">{checkpointPoint(cp)}<small className="ml-0.5 text-[11px] font-normal text-fg/60">pt</small></strong><Status value={status}/></div>
      </div>
    </button>)}</div> : <div className={empty}><Flag size={20}/><h3>{checkpoints.length ? '該当するチェックポイントはありません' : 'チェックポイントは未公開です'}</h3>{checkpoints.length > 0 && <button className={button} onClick={() => setFilter('all')}>すべて表示</button>}</div>}
    {selected && <PhotoModal key={selected.uri} cp={selected} number={selectedNumber} close={() => setSelected(null)}/>}
  </>;
}

function currentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('この端末では位置情報を利用できません。'));
    navigator.geolocation.getCurrentPosition(resolve, () => reject(new Error('位置情報を取得できませんでした。位置情報を許可して再度お試しください。')), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  });
}

function PhotoModal({ cp, number, close }: { cp: CheckpointView; number: string; close: () => void }) {
  const { event, team, latest: latestByCheckpoint, statusOf, canSubmit: submittable, started, ended, addSubmission, notify } = useEventContext();
  const client = useLexClient();
  const { dialog, onClose } = useDialog(cp.uri, close);
  const mounted = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const latest = latestByCheckpoint.get(cp.uri);
  const status = statusOf(cp);
  const goal = checkpointIsGoal(cp);
  const description = checkpointRecord(cp).description?.trim();
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [prepareError, setPrepareError] = useState('');
  const { run, error, pending } = useAction();
  const busy = preparing || pending;
  const canSubmit = submittable && ['unsubmitted', 'rejected'].includes(status);
  const submitted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  // 提出しなかったプレビューは破棄する (提出したものは反映待ちの表示に使う)
  useEffect(() => () => { if (photo && !submitted.current) URL.revokeObjectURL(photo.url); }, [photo]);
  async function select(file: File) {
    setPrepareError(''); setPreparing(true); setPhoto(null);
    try { const blob = await prepareImageBlob(file); if (mounted.current) setPhoto({ blob, url: URL.createObjectURL(blob) }); } catch (e) { if (mounted.current) setPrepareError(e instanceof Error ? e.message : '画像を処理できませんでした。'); }
    finally { if (mounted.current) setPreparing(false); }
  }
  async function submit() {
    if (!photo || !team) return;
    await run(async () => {
      const position = await currentPosition();
      const location = toLocation(position.coords.latitude, position.coords.longitude);
      const { body } = await client.uploadBlob(photo.blob);
      const record = r.submit.$parse({ $type: r.submit.$type, event: { uri: event.uri, cid: event.cid }, checkpoint: { uri: cp.uri, cid: cp.cid }, photo: body.blob, location, createdAt: currentDatetimeString() });
      const created = await client.create(r.submit, record);
      submitted.current = true;
      const author = team.members.find(m => m.did === client.did) ?? { did: client.assertDid, handle: 'handle.invalid' };
      const view: SubmissionView = { $type: 'win.tomo-x.rogaining.defs#submissionView', uri: created.uri, cid: created.cid, author, team: team.uri, record: record as unknown as LexMap, status: 'pending', photoUrl: photo.url as UriString, indexedAt: record.createdAt };
      addSubmission(view);
      notify(`${checkpointName(cp)}の写真を提出しました。\n位置: ${location.latitude}, ${location.longitude}`);
      if (mounted.current) close();
    });
  }
  const shown = photo?.url ?? latest?.photoUrl;
  const onFile = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) void select(e.target.files[0]); e.target.value = ''; };
  return <dialog onClose={onClose} ref={dialog} className="m-auto max-h-[calc(100dvh-24px)] w-[min(720px,calc(100%-24px))] border border-fg bg-bg p-0 text-fg backdrop:bg-fg/50" aria-labelledby="photo-title" onCancel={e => { e.preventDefault(); if (!busy) close(); }} onClick={e => { if (e.target === dialog.current && !busy) close(); }}>
    <div className="sticky top-0 z-[1] flex h-10 items-center gap-2 border-b border-fg/10 bg-bg pl-3">
      <span className="shrink-0 bg-fg px-1 text-[11px] leading-[18px] font-bold text-bg tabular-nums">{goal ? 'GOAL' : number}</span>
      <h2 id="photo-title" className="min-w-0 flex-1 truncate text-[14px] font-bold">{checkpointName(cp)}</h2>
      <strong className="shrink-0 text-[15px] font-bold tabular-nums">{checkpointPoint(cp)}<small className="ml-0.5 text-[11px] font-normal text-fg/60">pt</small></strong>
      {canSubmit && <HelpButton title="写真の提出"><p>JPEG / PNG / WebP、8MB まで。</p><p>送信時に画像を縮小し、現在地と一緒に提出します。位置情報の利用を許可してください。</p></HelpButton>}
      <button className={iconButton} aria-label="詳細を閉じる" onClick={close} disabled={busy}><X size={18}/></button>
    </div>
    <div className="p-3">
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1"><Status value={status} label={goal && status === 'approved' ? 'ゴール済み' : undefined}/><span className="flex items-center gap-1 text-[12px] text-fg/60"><MapPin size={13}/>{area(cp)}</span></div>
      {description && <p className="mb-2 text-[13px] leading-relaxed">{description}</p>}
      <div className="grid grid-cols-2 gap-2">
        <figure className="min-w-0"><figcaption className={caption}>目標</figcaption><Photo src={cp.imageUrl} alt={`${checkpointName(cp)}の撮影目標`} className={comparisonImage}/></figure>
        <figure className="min-w-0"><figcaption className={caption}><span>{photo ? 'プレビュー' : '提出画像'}</span>{!photo && latest && <span className="truncate">{formatDate(latest.indexedAt)}</span>}</figcaption>{shown ? <Photo src={shown} alt={photo ? '選択した写真のプレビュー' : '最後に提出した画像'} className={comparisonImage}/> : <div className={placeholder}><ImagePlus size={20}/><span>未提出</span></div>}</figure>
      </div>
      {status === 'rejected' && <div className={errorPanel}><strong>再撮影してください</strong>{latest?.reason && <p>{latest.reason}</p>}</div>}
      {status === 'pending' && <div className={infoPanel}>審査待ちです。</div>}
      {status === 'approved' && <div className={successPanel}><CheckCheck size={16}/> {goal ? 'ゴールを記録しました。' : `承認済み · +${checkpointPoint(cp)}pt`}</div>}
      {!started && <div className={infoPanel}>開始前のため提出できません。</div>}
      {ended && <div className={infoPanel}>終了したため提出できません。</div>}
      {!team && <div className={infoPanel}>チーム未所属のため提出できません。主催者に登録を依頼してください。</div>}
      {preparing && <p className="mt-2 text-[13px]" role="status">画像を処理中…</p>}
      {pending && <p className="mt-2 text-[13px]" role="status">位置情報を取得して提出中…</p>}
      {(prepareError || error) && <p className={errorText} role="alert">{prepareError || error}</p>}
    </div>
    {canSubmit && <div className="sticky bottom-0 grid grid-cols-2 gap-2 border-t border-fg/10 bg-bg p-3">
      <label className={cn(photo ? button : buttonPrimary, bigButton, busy ? 'cursor-not-allowed opacity-40' : 'cursor-pointer')}><Camera size={18}/>{photo ? '撮り直す' : 'カメラで撮影'}<input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={busy} onChange={onFile}/></label>
      <button className={cn(button, bigButton)} disabled={busy} onClick={() => input.current?.click()}><ImagePlus size={18}/>{photo ? '画像を差し替え' : '画像を選択'}</button>
      <input ref={input} type="file" disabled={busy} hidden accept="image/jpeg,image/png,image/webp" onChange={onFile}/>
      {photo && <button className={cn(buttonPrimary, bigButton, 'col-span-2')} onClick={submit} disabled={busy}>{status === 'rejected' ? '再提出する' : '提出する'}<ArrowRight size={18}/></button>}
    </div>}
  </dialog>;
}
