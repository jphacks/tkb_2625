import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { MapPin, Plus, Trash2, X } from 'lucide-react';
import { currentDatetimeString } from '@atproto/lex';
import AdminMap from '../../components/AdminMap';
import { useAction } from '../../hooks/useAction';
import { prepareImageBlob } from '../../lib/images';
import { r } from '../../lib/lex';
import { useLexClient } from '../../lib/lexClient';
import { checkpointIsGoal, checkpointLocation, checkpointName, checkpointNumber, checkpointPoint, checkpointRecord, submissionCheckpointUri, toLocation } from '../../lib/rogaining';
import { errorMessage } from '../../lib/utils';
import { cn } from '../../lib/cn';
import { buttonPrimary, empty, errorPanel, eyebrow, iconButton, notice as noticeBar } from '../../lib/ui';
import { atUriParts, useAdminEventContext } from './adminEventContext';

const emptyDraft = { name: '', point: '', description: '', lat: '', lng: '', radius: '30', isGoal: false };
const MAX_INTERNAL_IMAGES = 10;

const sectionTitle = 'mt-7 mb-5';
const sectionH3 = 'text-xl font-medium tracking-[1px] max-sm:text-lg';
const sectionNote = 'mt-[9px] text-[11px] leading-[1.9] text-muted max-sm:text-[10px]';
const form = 'border border-line bg-[#efefe5] p-6 max-sm:p-[18px]';
const fieldLabel = 'flex min-w-0 flex-col gap-2 text-[11px] leading-[1.6]';
const input = 'min-h-11 w-full border border-[#cdd3be] bg-[#faf9f3] px-3 py-2.5 text-xs text-ink';
const fileInput = 'p-2 text-[10px] file:mr-2 file:min-h-[30px] file:cursor-pointer file:border file:border-[#cdd3be] file:bg-[#e4e9d8] file:text-olive';
const hint = 'text-[9px] font-normal text-muted';
const pair = 'grid grid-cols-2 gap-3';

/** 画像を縮小・JPEG 化して、lexicon の上限 (2MB) に収める */
async function imageBlob(file: File) {
  const blob = await prepareImageBlob(file);
  if (blob.size > 2_000_000) throw new Error('画像を2MB以下に縮小できませんでした。別の画像を選択してください。');
  return blob;
}

export default function CheckpointsPage() {
  const { event, checkpoints, submissions, isAuthor, me, refresh } = useAdminEventContext();
  const client = useLexClient();
  const { run, error, pending } = useAction();
  const [draft, setDraft] = useState(emptyDraft);
  const [image, setImage] = useState<File | null>(null);
  const preview = useMemo(() => image ? URL.createObjectURL(image) : '', [image]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const [internalImages, setInternalImages] = useState<File[]>([]);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [formKey, setFormKey] = useState(0);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [focus, setFocus] = useState<[number, number] | null>(null);
  // appview に反映されるまでの間、削除した CP を一覧から外しておく
  const [deleted, setDeleted] = useState<string[]>([]);
  const visible = checkpoints.filter(cp => !deleted.includes(cp.uri));
  function field<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) { setDraft(previous => ({ ...previous, [key]: value })); }

  async function create(e: FormEvent) {
    e.preventDefault();
    setFormError(''); setNotice('');
    const lat = Number(draft.lat), lng = Number(draft.lng), point = Number(draft.point), radius = Number(draft.radius);
    if (draft.lat.trim() === '' || draft.lng.trim() === '' || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) { setFormError('緯度・経度を入力するか、地図で位置を指定してください。'); return; }
    if (!Number.isSafeInteger(point) || point < 0) { setFormError('配点は0以上の整数で入力してください。'); return; }
    if (!Number.isSafeInteger(radius) || radius < 1) { setFormError('判定半径は1以上の整数（メートル）で入力してください。'); return; }
    if (!image) { setFormError('見本写真を選択してください。'); return; }
    const ok = await run(async () => {
      const [imageRef, ...internalRefs] = await Promise.all([image, ...internalImages].map(async file => {
        try { return (await client.uploadBlob(await imageBlob(file))).body.blob; }
        catch (reason) { throw new Error(`${file.name}: ${errorMessage(reason, '画像をアップロードできませんでした。')}`); }
      }));
      const description = draft.description.trim();
      const record = r.checkpoint.$parse({
        $type: r.checkpoint.$type, event: { uri: event.uri, cid: event.cid }, name: draft.name.trim(), point, location: toLocation(lat, lng),
        radiusMeters: radius, isGoal: draft.isGoal, ...(description ? { description } : {}), image: imageRef, internalImages: internalRefs, createdAt: currentDatetimeString(),
      });
      await client.create(r.checkpoint, record);
    });
    if (!ok) return;
    setNotice(`「${draft.name.trim()}」を登録しました。一覧への反映まで数秒かかることがあります。`);
    setDraft(emptyDraft); setImage(null); setInternalImages([]); setSelected(null); setFormKey(k => k + 1);
    refresh('checkpoints', 'event');
  }

  async function remove(uri: string, label: string) {
    const { repo, rkey } = atUriParts(uri);
    if (repo !== me) { window.alert('このCPはログイン中のアカウントのPDSにないため削除できません。'); return; }
    const count = submissions.filter(s => submissionCheckpointUri(s) === uri).length;
    if (!window.confirm(`${label}を削除しますか？${count ? ` このCPへの提出 ${count}件は無効になり、得点からも外れます。` : ''}`)) return;
    if (!await run(() => client.delete(r.checkpoint, { rkey }))) return;
    setDeleted(previous => [...previous, uri]);
    setNotice(`${label}を削除しました。`);
    refresh('checkpoints', 'submissions', 'event');
  }

  return <section>
    <div className={sectionTitle}><h3 className={sectionH3}>チェックポイント管理</h3><p className={sectionNote}>登録したCPは参加者のカード・地図に表示されます。位置は緯度・経度の入力、または地図クリックで指定できます。</p></div>
    {!isAuthor && <p className={errorPanel} role="alert">CPを登録・削除できるのはイベントの作成者（{event.author.handle ? `@${event.author.handle}` : event.author.did}）だけです。他のアカウントが作成したCPは無効になります。</p>}
    {notice && <div className={noticeBar} role="status">{notice}<button className={iconButton} aria-label="通知を閉じる" onClick={() => setNotice('')}><X size={18}/></button></div>}
    {(error || formError) && <p className={errorPanel} role="alert">{error || formError}</p>}
    <div className="grid grid-cols-[340px_minmax(0,1fr)] items-start gap-6 max-[62.5rem]:grid-cols-[300px_minmax(0,1fr)] max-[62.5rem]:gap-[18px] max-sm:grid-cols-1">
      <form className={cn(form, 'flex flex-col gap-[18px]')} onSubmit={create}>
        <h4 className="text-base font-medium">新しいCPを登録</h4>
        <fieldset className="m-0 flex min-w-0 flex-col gap-[18px] border-0 p-0" disabled={!isAuthor || pending}>
          <label className={fieldLabel}>CP名<input className={input} required maxLength={100} value={draft.name} onChange={e => field('name', e.target.value)} /></label>
          <div className={pair}><label className={fieldLabel}>配点（pt）<input className={input} type="number" min="0" step="1" required value={draft.point} onChange={e => field('point', e.target.value)} /></label><label className={fieldLabel}>判定半径（m）<input className={input} type="number" min="1" step="1" required value={draft.radius} onChange={e => field('radius', e.target.value)} /></label></div>
          <label className={fieldLabel}>説明・撮影案内（任意）<textarea className={cn(input, 'min-h-20 resize-y')} maxLength={1000} value={draft.description} onChange={e => field('description', e.target.value)} /></label>
          <label className={cn(fieldLabel, 'flex-row flex-wrap items-center')}><input className="min-h-auto w-auto" type="checkbox" checked={draft.isGoal} onChange={e => field('isGoal', e.target.checked)} />ゴールとして登録する<small className={cn(hint, 'basis-full')}>ゴールの提出は審査されず、到着順にタイムボーナスが付きます。</small></label>
          <label className={fieldLabel}>見本写真 <small className={hint}>必須 · JPEG / PNG / WebP · 8MBまで（自動で縮小します）</small><input className={cn(input, fileInput)} key={`image-${formKey}`} type="file" accept="image/jpeg,image/png,image/webp" required onChange={e => setImage(e.target.files?.[0] ?? null)} /></label>
          {preview && <img className="max-h-[180px] w-full bg-[#e0e4d4] object-contain" src={preview} alt="登録するCPの見本写真" />}
          <label className={fieldLabel}>内部用画像（任意） <small className={hint}>参加者には表示されません · 最大{MAX_INTERNAL_IMAGES}枚</small><input className={cn(input, fileInput)} key={`internal-${formKey}`} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e => { const files = [...e.target.files ?? []]; if (files.length > MAX_INTERNAL_IMAGES) { setFormError(`内部用画像は${MAX_INTERNAL_IMAGES}枚までです。`); e.target.value = ''; setInternalImages([]); return; } setInternalImages(files); }} /></label>
          {internalImages.length > 0 && <small className={hint}>{internalImages.length}枚を選択中</small>}
          <div className={pair}><label className={fieldLabel}>緯度<input className={input} type="number" min="-90" max="90" step="any" required value={draft.lat} onChange={e => { field('lat', e.target.value); setSelected(null); }} /></label><label className={fieldLabel}>経度<input className={input} type="number" min="-180" max="180" step="any" required value={draft.lng} onChange={e => { field('lng', e.target.value); setSelected(null); }} /></label></div>
          <button className={buttonPrimary}><Plus size={17}/>{pending ? '登録中…' : 'CPを登録する'}</button>
        </fieldset>
      </form>
      <div className="min-w-0"><div className="flex items-center gap-2 border border-line bg-[#edefe2] p-[15px] text-[11px]"><MapPin size={16}/>地図をクリックしてCPの位置を選択</div><AdminMap checkpoints={visible} selected={selected} focus={focus} onPick={isAuthor ? (lat, lng) => { setDraft(previous => ({ ...previous, lat: lat.toFixed(6), lng: lng.toFixed(6) })); setSelected([lat, lng]); } : undefined} /><p className="my-[15px] text-[10px] leading-[1.9] text-muted" aria-live="polite">{selected ? `選択位置：${selected[0].toFixed(6)}, ${selected[1].toFixed(6)}` : '既存CPは番号付きで表示しています。地図が取得できない場合も座標を入力できます。'}</p></div>
    </div>
    <div className={sectionTitle}><h3 className={sectionH3}>登録済みCP <small className="text-xs font-normal text-muted">{visible.length}件</small></h3><p className={sectionNote}>削除すると、そのCPへの提出は無効になり、各チームの得点からも外れます。</p></div>
    <div className="border border-line bg-[#fcfbf6] px-[22px] max-sm:px-3">{visible.map(cp => {
      const index = checkpoints.indexOf(cp);
      const location = checkpointLocation(cp);
      const record = checkpointRecord(cp);
      const label = checkpointIsGoal(cp) ? `ゴール「${checkpointName(cp)}」` : `CP ${checkpointNumber(index)}「${checkpointName(cp)}」`;
      return <article key={cp.uri} className="grid grid-cols-[95px_1fr_auto_44px] items-center gap-5 border-b border-line py-[18px] last:border-0 max-sm:grid-cols-[62px_minmax(0,1fr)_auto] max-sm:gap-3">
        {cp.imageUrl ? <img className="h-20 w-[95px] bg-[#e5e8da] object-contain max-sm:size-[62px]" src={cp.imageUrl} alt={`${checkpointName(cp)}の見本写真`} /> : <div className="h-20 w-[95px] border border-dashed border-[#c4cdb5] bg-[#e9ebdf] max-sm:size-[62px]" />}
        <div><span className={cn(eyebrow, 'max-sm:text-[8px]')}>{checkpointIsGoal(cp) ? 'GOAL' : `CP ${checkpointNumber(index)}`} · 半径 {record.radiusMeters ?? 30}m{cp.internalImageUrls?.length ? ` · 内部用画像 ${cp.internalImageUrls.length}枚` : ''}</span><h4 className="my-1.5 text-[15px] font-medium [overflow-wrap:anywhere] max-sm:text-[13px]">{checkpointName(cp)}</h4>{record.description && <p className="text-[10px] text-muted">{record.description}</p>}
          {location ? <button type="button" className="flex min-h-11 items-center gap-[5px] text-[10px] text-[#677c55] underline max-sm:text-left max-sm:text-[9px] max-sm:[overflow-wrap:anywhere]" onClick={() => setFocus([location.lat, location.lng])}><MapPin size={13}/>{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</button> : <p className="text-[10px] text-muted">位置が不正です</p>}</div>
        <strong className="text-[26px] font-medium whitespace-nowrap max-sm:text-[23px]">{checkpointPoint(cp)}<small className="ml-1 text-[11px] font-normal">pt</small></strong>
        <button type="button" className={cn(iconButton, 'text-[#9b614b] hover:not-disabled:bg-[#efe0d5] max-sm:col-start-3 max-sm:row-start-2 max-sm:-mt-3')} disabled={pending || !isAuthor} aria-label={`${label}を削除`} onClick={() => void remove(cp.uri, label)}><Trash2 size={18}/></button>
      </article>;
    })}</div>
    {!visible.length && <div className={empty}>CPがありません。上のフォームから登録してください。</div>}
  </section>;
}
