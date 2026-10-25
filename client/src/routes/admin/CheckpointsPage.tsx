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
import { buttonPrimary, empty, errorPanel, fieldLabel, iconButton, input, notice as noticeBar, table, textarea } from '../../lib/ui';
import { HelpButton } from '../../components/SiteChrome';
import { atUriParts, useAdminEventContext } from './adminEventContext';

const emptyDraft = { name: '', point: '', description: '', lat: '', lng: '', radius: '30', isGoal: false };
const MAX_INTERNAL_IMAGES = 10;

const fileInput = 'h-auto p-1 text-[11px] file:mr-2 file:h-7 file:cursor-pointer file:border file:border-fg/25 file:bg-bg file:px-2';
const hint = 'text-[11px] font-normal text-fg/60';
const pair = 'grid grid-cols-2 gap-2';
const fieldCls = cn(fieldLabel, 'mb-0');
const sectionHeading = 'mt-5 mb-2 flex min-h-9 items-center gap-2 border-b border-fg pb-1 text-[13px] font-bold';

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
    setNotice(`「${draft.name.trim()}」を登録しました。`);
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
    {!isAuthor && <p className={errorPanel} role="alert">閲覧のみ（CPの編集は作成者 {event.author.handle ? `@${event.author.handle}` : event.author.did} のみ）</p>}
    {notice && <div className={noticeBar} role="status">{notice}<button className={iconButton} aria-label="通知を閉じる" onClick={() => setNotice('')}><X size={16}/></button></div>}
    {(error || formError) && <p className={errorPanel} role="alert">{error || formError}</p>}
    <div className="grid grid-cols-[300px_minmax(0,1fr)] items-start gap-3 max-md:grid-cols-1">
      <form className="flex flex-col gap-2 border border-fg/10 p-3" onSubmit={create}>
        <div className="flex min-h-7 items-center gap-2"><h3 className="text-[13px] font-bold">CPを登録</h3>
          <HelpButton title="CPの登録" className="ml-auto">
            <ul><li>位置は緯度・経度の入力、または地図クリックで指定できます。</li><li>登録したCPは参加者のカードと地図に表示されます。</li><li>ゴールの提出は審査されず、到着順にタイムボーナスが付きます。</li><li>見本写真は JPEG / PNG / WebP、8MBまで。自動で縮小します。</li><li>内部用画像は参加者には表示されません。最大{MAX_INTERNAL_IMAGES}枚まで。</li><li>CPを削除すると、そのCPへの提出は無効になり、各チームの得点からも外れます。</li></ul>
          </HelpButton></div>
        <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0" disabled={!isAuthor || pending}>
          <label className={fieldCls}>CP名<input className={input} required maxLength={100} value={draft.name} onChange={e => field('name', e.target.value)} /></label>
          <div className={pair}><label className={fieldCls}>配点（pt）<input className={input} type="number" min="0" step="1" required value={draft.point} onChange={e => field('point', e.target.value)} /></label><label className={fieldCls}>判定半径（m）<input className={input} type="number" min="1" step="1" required value={draft.radius} onChange={e => field('radius', e.target.value)} /></label></div>
          <div className={pair}><label className={fieldCls}>緯度<input className={input} type="number" min="-90" max="90" step="any" required value={draft.lat} onChange={e => { field('lat', e.target.value); setSelected(null); }} /></label><label className={fieldCls}>経度<input className={input} type="number" min="-180" max="180" step="any" required value={draft.lng} onChange={e => { field('lng', e.target.value); setSelected(null); }} /></label></div>
          <label className={fieldCls}>説明・撮影案内（任意）<textarea className={cn(textarea, 'min-h-14 resize-y font-normal')} maxLength={1000} value={draft.description} onChange={e => field('description', e.target.value)} /></label>
          <label className="flex h-7 items-center gap-2 text-[13px]"><input type="checkbox" checked={draft.isGoal} onChange={e => field('isGoal', e.target.checked)} />ゴールとして登録</label>
          <label className={fieldCls}>見本写真（必須）<input className={cn(input, fileInput)} key={`image-${formKey}`} type="file" accept="image/jpeg,image/png,image/webp" required onChange={e => setImage(e.target.files?.[0] ?? null)} /></label>
          {preview && <img className="max-h-32 w-full bg-fg/5 object-contain" src={preview} alt="登録するCPの見本写真" />}
          <label className={fieldCls}>内部用画像（任意）<input className={cn(input, fileInput)} key={`internal-${formKey}`} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e => { const files = [...e.target.files ?? []]; if (files.length > MAX_INTERNAL_IMAGES) { setFormError(`内部用画像は${MAX_INTERNAL_IMAGES}枚までです。`); e.target.value = ''; setInternalImages([]); return; } setInternalImages(files); }} /></label>
          {internalImages.length > 0 && <small className={hint}>{internalImages.length}枚を選択中</small>}
          <button className={buttonPrimary}><Plus size={16}/>{pending ? '登録中…' : '登録'}</button>
        </fieldset>
      </form>
      <div className="min-w-0"><AdminMap checkpoints={visible} selected={selected} focus={focus} onPick={isAuthor ? (lat, lng) => { setDraft(previous => ({ ...previous, lat: lat.toFixed(6), lng: lng.toFixed(6) })); setSelected([lat, lng]); } : undefined} /><p className="mt-1 min-h-4 text-[11px] text-fg/60" aria-live="polite">{selected ? `選択位置：${selected[0].toFixed(6)}, ${selected[1].toFixed(6)}` : ''}</p></div>
    </div>
    <h3 className={sectionHeading}>登録済みCP <small className="text-[11px] font-normal text-fg/60">{visible.length}件</small></h3>
    {visible.length > 0 && <div className="overflow-x-auto"><table className={table}>
      <thead><tr><th><span className="sr-only">見本写真</span></th><th>CP</th><th>名前</th><th>配点</th><th>半径</th><th>位置</th><th><span className="sr-only">操作</span></th></tr></thead>
      <tbody>{visible.map(cp => {
        const index = checkpoints.indexOf(cp);
        const location = checkpointLocation(cp);
        const record = checkpointRecord(cp);
        const label = checkpointIsGoal(cp) ? `ゴール「${checkpointName(cp)}」` : `CP ${checkpointNumber(index)}「${checkpointName(cp)}」`;
        return <tr key={cp.uri}>
          <td>{cp.imageUrl ? <img className="h-12 w-16 bg-fg/5 object-contain" src={cp.imageUrl} alt={`${checkpointName(cp)}の見本写真`} /> : <div className="h-12 w-16 border border-dashed border-fg/30 bg-fg/5" />}</td>
          <td className="whitespace-nowrap font-bold">{checkpointIsGoal(cp) ? 'GOAL' : checkpointNumber(index)}</td>
          <td className="[overflow-wrap:anywhere]">{checkpointName(cp)}{cp.internalImageUrls?.length ? <span className="ml-1 text-[11px] text-fg/60">内部用画像 {cp.internalImageUrls.length}枚</span> : null}{record.description && <span className="block text-[11px] text-fg/60">{record.description}</span>}</td>
          <td className="text-right whitespace-nowrap">{checkpointPoint(cp)}pt</td>
          <td className="whitespace-nowrap">{record.radiusMeters ?? 30}m</td>
          <td className="whitespace-nowrap">{location ? <button type="button" className="inline-flex h-9 items-center gap-1 text-[12px] text-accent hover:underline" onClick={() => setFocus([location.lat, location.lng])}><MapPin size={12}/>{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</button> : <span className="text-fg/60">位置が不正です</span>}</td>
          <td className="text-right"><button type="button" className={iconButton} disabled={pending || !isAuthor} aria-label={`${label}を削除`} title="削除" onClick={() => void remove(cp.uri, label)}><Trash2 size={16}/></button></td>
        </tr>;
      })}</tbody>
    </table></div>}
    {!visible.length && <div className={cn(empty, 'py-6')}>CPがありません。</div>}
  </section>;
}
