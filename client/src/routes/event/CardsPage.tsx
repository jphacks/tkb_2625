import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownUp, ArrowRight, ArrowUpRight, Camera, Check, CheckCheck, Flag, ImagePlus, Leaf, MapPin, RefreshCw, X } from 'lucide-react';
import { currentDatetimeString, type LexMap, type UriString } from '@atproto/lex';
import { useEventContext } from './EventLayout';
import { Photo, Status } from '../../components/Status';
import { useDialog } from '../../hooks/useDialog';
import { useAction } from '../../hooks/useAction';
import { eventPath } from '../../lib/eventUri';
import { prepareImageBlob } from '../../lib/images';
import { useLexClient } from '../../lib/lexClient';
import { r } from '../../lib/lex';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/cn';
import { button, buttonPrimary, empty, errorPanel, errorText, eyebrow, iconButton, infoPanel, liveDot, successPanel, textButton } from '../../lib/ui';
import { checkpointBounds, checkpointIsGoal, checkpointName, checkpointNumber, checkpointPoint, checkpointRecord, STATUSES, toLocation, type CheckpointStatus } from '../../lib/rogaining';
import type { CheckpointView, SubmissionView } from '../../lexicons/win/tomo-x/rogaining/defs';

type Sort = 'number' | 'points-desc' | 'points-asc' | 'name' | 'status';
type Numbered = { cp: CheckpointView; number: string; status: CheckpointStatus };

const dms = (value: number, positive: string, negative: string) => {
  const abs = Math.abs(value), degrees = Math.floor(abs), minutes = Math.floor((abs - degrees) * 60);
  return `${degrees}°${String(minutes).padStart(2, '0')}′ ${value >= 0 ? positive : negative}`;
};
const radius = (cp: CheckpointView) => checkpointRecord(cp).radiusMeters ?? 30;
const area = (cp: CheckpointView) => checkpointIsGoal(cp) ? 'ゴール' : `半径 ${radius(cp)}m 以内で撮影`;

const filterButton = (active: boolean) => cn('min-h-[38px] border border-transparent px-3.5 py-[7px] text-[11px] whitespace-nowrap max-sm:min-h-11 max-sm:px-2 max-sm:text-[10px] max-xs:px-1.5 max-xs:text-[9px]', active ? 'bg-olive text-[#f7f6ee]' : 'text-muted hover:border-line hover:bg-[#eeeee5]');
const filterCount = 'ml-[9px] text-[10px] opacity-70 max-sm:ml-[5px] max-sm:text-[9px]';
const comparisonImage = 'w-full aspect-[4/3] object-contain bg-[#e9ebdf] max-sm:max-h-60';
const comparisonPlaceholder = 'max-sm:max-h-60';
const cardImage = 'size-full object-cover transition-[scale] duration-350 group-hover:scale-[1.035]';
const cardPlaceholder = 'h-full aspect-auto border-0';
const placeholder = 'flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 border border-dashed border-[#c4cdb5] bg-[#e9ebdf] text-[11px] text-[#8b957c] max-sm:max-h-60';
const uploadButton = 'max-sm:flex-1 max-sm:px-2 max-sm:text-[11px]';
const footerButton = 'max-sm:px-3 max-sm:text-[11px]';

export default function CardsPage() {
  const { uri, checkpoints, statusOf, submissionsState } = useEventContext();
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
  const bounds = checkpointBounds(checkpoints);
  const center = bounds && [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2];
  const selectedNumber = numbered.find(c => c.cp.uri === selected?.uri)?.number ?? '';
  return <>
    <section className="relative h-[270px] overflow-hidden border border-[#e0e3d4] bg-[#e8eadc] xl:h-[280px] max-sm:h-[232px]" aria-label="大会の案内"><div className="relative z-[1] px-[37px] py-[30px] xl:pt-8 max-sm:px-5 max-sm:py-[23px]"><span className={cn(eyebrow, 'flex items-center gap-[7px] text-[8px] text-[#788265] max-sm:text-[6px] max-sm:tracking-[1.2px]')}><span className={liveDot}/> YOUR NEXT DISCOVERY</span><h2 className="mt-[15px] mb-3 font-mincho text-[29px] leading-[1.55] font-medium tracking-[4px] max-sm:mt-[13px] max-sm:mb-2.5 max-sm:text-[25px] max-sm:leading-[1.5] max-sm:tracking-[2px] max-xs:text-[23px]">道草の先に、<br/>小さな発見を。</h2><p className="text-[10px] leading-[1.9] tracking-[.4px] text-[#747e66] max-sm:max-w-[190px] max-sm:text-[9px] max-sm:leading-[1.8]">気になる場所を選んで、歩いて、撮って。<br/>街に散らばるチェックポイントを集めよう。</p><Link to={eventPath(uri, 'map')} className="mt-0.5 inline-flex min-h-11 items-center gap-[18px] border-b border-[#a2ac90] text-[11px] max-sm:gap-3 max-sm:text-[10px]">マップで場所を探す <ArrowUpRight size={17}/></Link></div><Landscape/>{center && <span className="absolute right-5 bottom-4 text-right text-[7px] leading-[1.8] tracking-[1.3px] text-[#697859] max-sm:right-[9px] max-sm:bottom-[9px] max-sm:text-[5px] max-sm:tracking-[.5px]">{dms(center[0], 'N', 'S')} &nbsp; {dms(center[1], 'E', 'W')}<br/>CHECKPOINT FIELD</span>}</section>
    <div className="mt-[35px] mb-[23px] flex items-end justify-between max-sm:mt-[27px] max-sm:mb-[17px]"><div><span className={cn(eyebrow, 'text-[8px] max-sm:text-[7px] max-sm:tracking-[1.2px]')}>COLLECT YOUR MOMENTS</span><h2 className="mt-2 flex items-center gap-3.5 text-xl font-medium tracking-[1.7px] max-sm:gap-2.5 max-sm:text-[17px] max-sm:tracking-[.8px]">チェックポイント <span className="text-[13px] font-normal tracking-[1px] text-[#a2a78e]">{checkpoints.length.toString().padStart(2, '0')}</span></h2></div><span className="flex items-center gap-[7px] pb-[3px] text-[10px] text-muted max-md:hidden"><Camera size={15}/> 写真を撮って、ポイントを集めよう</span></div>
    <div className="flex justify-between gap-2.5 border-b border-line pb-4 max-sm:flex-wrap max-sm:gap-[5px] max-sm:pb-[7px]"><div className="flex flex-wrap gap-[5px] max-sm:w-full max-sm:justify-between max-sm:gap-0.5" role="group" aria-label="提出状況で絞り込み"><button className={filterButton(filter === 'all')} onClick={() => setFilter('all')}>すべて <span className={filterCount}>{checkpoints.length}</span></button>{(Object.keys(STATUSES) as CheckpointStatus[]).map(key => <button key={key} className={filterButton(filter === key)} onClick={() => setFilter(key)}>{STATUSES[key].label}<span className={filterCount}>{counts[key]}</span></button>)}</div><label className="flex items-center gap-[7px] text-[10px] text-[#727b67] max-sm:ml-auto"><ArrowDownUp size={15}/><span className="sr-only">並び順</span><select className="min-h-11 max-w-[180px] bg-transparent px-2 max-sm:min-h-[37px] max-sm:max-w-[190px] max-sm:text-[11px]" value={sort} onChange={e => setSort(e.target.value as Sort)}><option value="number">番号順</option><option value="points-desc">配点の高い順</option><option value="points-asc">配点の低い順</option><option value="name">名前順（昇順）</option><option value="status">状態順：未提出→審査中→不可→可</option></select></label></div>
    <div className="mt-4 mb-3.5 flex justify-between text-[9px] tracking-[.3px] text-[#7e8577] max-sm:my-3 max-sm:text-[8px]"><span>{visible.length} 件のチェックポイント{submissionsState.updatedAt && ` · 更新 ${formatDate(submissionsState.updatedAt)}`}</span><button className={textButton} onClick={submissionsState.refresh} disabled={submissionsState.loading}><RefreshCw size={12}/> 審査状況を更新</button></div>
    {visible.length ? <div className="grid grid-cols-3 gap-6 max-md:gap-4 max-sm:gap-[9px] max-xs:grid-cols-2">{visible.map(({ cp, number, status }) => <button key={cp.uri} className="group overflow-hidden border border-line bg-[#fcfbf6] p-0 text-left transition-[border-color,translate] duration-[180ms] hover:-translate-y-[3px] hover:border-[#9eaa8c]" onClick={() => setSelected(cp)} aria-label={`${checkpointName(cp)} ${checkpointPoint(cp)}ポイント ${STATUSES[status].label} 詳細を開く`}><div className="relative aspect-[1.77] overflow-hidden max-sm:aspect-[1.13] max-xs:aspect-[1.35]"><Photo src={cp.imageUrl} alt={`${checkpointName(cp)}の目標画像`} loading="lazy" className={cardImage} placeholderClassName={cardPlaceholder}/><span className="absolute top-3 left-3 bg-[#f8f7efdb] px-[7px] py-[5px] text-[9px] tracking-[1px] max-sm:top-1.5 max-sm:left-1.5 max-sm:px-1 max-sm:py-[3px] max-sm:text-[7px] max-sm:tracking-[.5px]">{checkpointIsGoal(cp) ? 'GOAL' : `CP ${number}`}</span>{status === 'approved' && <span className="absolute right-3 bottom-3 grid size-7 place-items-center bg-olive text-white max-sm:right-1.5 max-sm:bottom-1.5 max-sm:size-[22px]"><Check size={18} className="max-sm:w-3.5"/></span>}</div><div className="px-[18px] pt-4 pb-[13px] max-md:p-[13px] max-sm:px-[7px] max-sm:pt-2.5 max-sm:pb-[9px]"><span className="mb-[7px] flex items-center gap-1 text-[9px] text-muted max-sm:mb-1.5 max-sm:gap-0.5 max-sm:text-[7px] max-sm:tracking-[-.3px] max-xs:text-[8px]"><MapPin size={11} className="max-sm:w-2"/>{area(cp)}</span><h3 className="mb-3.5 text-[15px] font-medium tracking-[.7px] max-md:text-sm max-sm:mb-1.5 max-sm:min-h-7 max-sm:text-[10px] max-sm:leading-[1.5] max-sm:tracking-normal max-xs:min-h-0 max-xs:text-xs">{checkpointName(cp)}</h3><div className="flex items-center justify-between gap-1 border-t border-[#e9eadf] pt-[9px] max-sm:flex-col max-sm:items-start max-sm:gap-[7px] max-sm:pt-[7px] max-xs:flex-row max-xs:items-center"><strong className="text-[23px] leading-[1.2] font-medium tracking-[.4px] max-sm:text-[19px]">{checkpointPoint(cp)}<small className="ml-1 text-[10px] font-normal text-muted max-sm:text-[9px]">pt</small></strong><Status value={status}/></div></div></button>)}</div> : <div className={empty}><Flag/><h3>{checkpoints.length ? 'この条件のチェックポイントはありません' : 'チェックポイントはまだ公開されていません'}</h3>{checkpoints.length > 0 && <button className={button} onClick={() => setFilter('all')}>すべて表示する</button>}</div>}
    <div className="mt-[30px] flex items-center gap-3.5 border-y border-line px-[3px] py-[19px] text-[#7b866d] max-sm:mt-[23px] max-sm:items-start max-sm:gap-2.5 max-sm:px-0.5 max-sm:py-4"><Leaf size={20} className="max-sm:mt-[3px] max-sm:w-[17px]"/><p className="flex flex-col gap-1.5 text-[10px] leading-[1.7] max-sm:gap-1 max-sm:text-[9px]"><strong className="text-[11px] font-medium text-[#626f54] max-sm:text-[10px]">寄り道も、大切なルート。</strong><span>周りの景色や交通に気を配りながら、街歩きを楽しみましょう。</span></p><span className={cn(eyebrow, 'ml-auto text-[8px] whitespace-nowrap max-sm:hidden')}>LEAVE ONLY FOOTPRINTS</span></div>
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
  return <dialog onClose={onClose} ref={dialog} className="m-auto max-h-[calc(100dvh-40px)] w-[min(780px,calc(100%-32px))] border border-line bg-paper p-0 text-ink shadow-[0_20px_100px_#29342026] backdrop:bg-[#2631218f] backdrop:backdrop-blur-[3px] max-sm:max-h-[calc(100dvh-24px)] max-sm:w-[calc(100%-24px)]" aria-labelledby="photo-title" onCancel={e => { e.preventDefault(); if (!busy) close(); }} onClick={e => { if (e.target === dialog.current && !busy) close(); }}><div className="px-[30px] py-[22px] max-sm:px-[18px] max-sm:pt-[13px] max-sm:pb-5"><div className="flex items-center justify-between"><span className={eyebrow}>{goal ? 'GOAL' : `CHECKPOINT ${number}`}</span><button className={iconButton} aria-label="詳細を閉じる" onClick={close} disabled={busy}><X/></button></div><div className="mt-1.5 mb-3.5 flex items-center justify-between gap-5"><h2 id="photo-title" className="text-2xl font-medium tracking-[1px] max-sm:text-xl">{checkpointName(cp)}</h2><strong className="text-[30px] font-medium max-sm:text-[25px]">{checkpointPoint(cp)}<small className="ml-[5px] text-[13px] font-normal">pt</small></strong></div><div className="flex items-center gap-3.5"><Status value={status} label={goal && status === 'approved' ? 'ゴール済み' : undefined}/><span className="flex items-center gap-[5px] text-[11px] text-muted"><MapPin size={14}/>{area(cp)}</span></div>{description && <p className="my-[18px] text-xs leading-[1.9] text-[#6f7967] max-sm:my-[15px] max-sm:text-[11px]">{description}</p>}<div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1 max-sm:gap-4"><figure className="min-w-0"><figcaption className="mb-2 flex justify-between gap-1.5 text-[10px] tracking-[.3px] text-muted">01 / 目標画像</figcaption><Photo src={cp.imageUrl} alt={`${checkpointName(cp)}の撮影目標`} className={comparisonImage} placeholderClassName={comparisonPlaceholder}/></figure><figure className="min-w-0"><figcaption className="mb-2 flex justify-between gap-1.5 text-[10px] tracking-[.3px] text-muted">02 / {photo ? '提出前のプレビュー' : '提出画像'}{!photo && latest && <span className="text-[9px]">{formatDate(latest.indexedAt)}</span>}</figcaption>{shown ? <Photo src={shown} alt={photo ? '選択した写真のプレビュー' : '最後に提出した画像'} className={comparisonImage} placeholderClassName={comparisonPlaceholder}/> : <div className={placeholder}><ImagePlus size={30}/><span>まだ画像がありません</span></div>}</figure></div>
    {status === 'rejected' && <div className={errorPanel}><strong>もう一度撮影をお願いします</strong>{latest?.reason && <p>{latest.reason}</p>}</div>}
    {status === 'pending' && <div className={infoPanel}>写真を提出しました。審査結果をお待ちください。</div>}
    {status === 'approved' && <div className={successPanel}><CheckCheck size={18}/> {goal ? 'ゴールを記録しました。おつかれさまでした。' : `承認済み · ${checkpointPoint(cp)}ポイントを獲得しました。`}</div>}
    {!started && <div className={infoPanel}>大会の開始前のため、写真はまだ提出できません。</div>}
    {ended && <div className={infoPanel}>大会が終了したため、写真の提出はできません。</div>}
    {!team && <div className={infoPanel}>この大会のチームに登録されていないため、写真を提出できません。主催者にチームへの登録を依頼してください。</div>}
    {canSubmit && <><p className="mt-[18px] mb-2.5 text-[10px] leading-[1.7] text-muted">JPEG / PNG / WebP · 8MBまで。送信時に画像を縮小し、現在地と一緒に提出します。</p><div className="flex flex-wrap gap-2.5"><button className={cn(button, uploadButton)} disabled={busy} onClick={() => input.current?.click()}><ImagePlus size={17}/>{photo ? '画像を差し替える' : '画像を選択'}</button><label className={cn(button, uploadButton, busy && 'cursor-not-allowed opacity-50')}><Camera size={17}/>カメラで撮影<input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={busy} onChange={e => { if (e.target.files?.[0]) void select(e.target.files[0]); e.target.value = ''; }}/></label><input ref={input} type="file" disabled={busy} hidden accept="image/jpeg,image/png,image/webp" onChange={e => { if (e.target.files?.[0]) void select(e.target.files[0]); e.target.value = ''; }}/></div></>}
    {preparing && <p role="status">画像を処理しています…</p>}{pending && <p role="status">位置情報を取得して提出しています…</p>}{(prepareError || error) && <p className={errorText} role="alert">{prepareError || error}</p>}<div className="mt-[22px] flex justify-between gap-2.5 border-t border-line pt-[18px]"><button className={cn(button, footerButton)} onClick={close} disabled={busy}>閉じる</button>{canSubmit && <button className={cn(buttonPrimary, footerButton)} onClick={submit} disabled={busy || !photo}>{status === 'rejected' ? '写真を再提出する' : '写真を提出する'}<ArrowRight size={17}/></button>}</div></div></dialog>;
}

function Landscape() {
  return <svg className="absolute right-0 bottom-0 h-full w-[64%] object-cover xl:w-[66%] max-sm:-right-[100px] max-sm:h-[85%] max-sm:w-[82%] max-sm:opacity-80 max-xs:-right-[120px]" viewBox="0 0 600 300" fill="none" aria-hidden="true"><path d="M0 240c100-100 134-45 212-95s128-6 184-62 130-6 204-40v257H0" fill="#d4d9bf"/><path d="M0 266c132-102 208-17 291-69s166-55 309-23v126H0" fill="#bbc7a4"/><path d="M100 300c26-56 112-44 166-65s34-47 84-71" stroke="#eee6d0" strokeWidth="30"/><path d="M395 250V128m-4 79-30-40m36 18 28-38" stroke="#6f7f5d" strokeWidth="8"/><path d="m396 36-63 137h126z" fill="#81946a"/><path d="M492 269V112" stroke="#667855" strokeWidth="8"/><path d="m492 59-49 138h98z" fill="#a0ae83"/><path d="M545 282V187" stroke="#70815c" strokeWidth="7"/><path d="m545 122-45 118h90z" fill="#7c9165"/><path d="M192 216V105m-4 67-29-34" stroke="#7f8a68" strokeWidth="7"/><circle cx="194" cy="100" r="45" fill="#adb990"/><circle cx="164" cy="126" r="31" fill="#adb990"/><path d="M291 163v-57" stroke="#6a7756" strokeWidth="4"/><path d="m293 105 37 10-37 15" fill="#ac7855"/><circle cx="365" cy="63" r="22" fill="#ece3c6"/><path d="m57 141 19-9 19 9m16-29 14-7 14 7" stroke="#96a17d" strokeWidth="2"/><path d="M64 279h57m300 5h68" stroke="#8e9d77" strokeWidth="2"/></svg>;
}
