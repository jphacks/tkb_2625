import ParticipantNav from './ParticipantNav';
import Photo from './Photo';
import Countdown, { useExpired } from './Countdown';
import { errorMessage, formatDate } from './utils';
import { useAction } from './useAction';
import { useDialog } from './useDialog';
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ArrowDownUp, ArrowRight, ArrowUpRight, Camera, Check, CheckCheck, Clock3, Compass, Flag, ImagePlus, Leaf, MapPin, RotateCcw, ShieldCheck, Sprout, X } from 'lucide-react';
import { checkpointStatus, latestSubmission, selectCheckpoints, STATUSES } from './data';
import { prepareImage } from './images';
import { useRogaining } from './useRogaining';
import MapPage from './MapPage';
import AdminConsole from './AdminConsole';
import type { Checkpoint, CheckpointStatus, Execute, Snapshot, SubmissionStatus } from './types';

type PageProps = { state: Snapshot; execute: Execute; notify: (message: string) => void };

function Status({ value }: { value: CheckpointStatus }) { const status = STATUSES[value]; return <span className={`status ${value}`}><span aria-hidden="true">{status.symbol}</span> {status.label}</span>; }

export default function App() {
  const { state, notice, setNotice, loading, error, pending, execute, retry } = useRogaining();
  const isAdmin = useLocation().pathname.startsWith('/admin');
  const ended = useExpired(state?.endsAt || '1970-01-01T00:00:00.000Z');
  if (loading) return <main className="empty" role="status"><Compass size={32}/><p>大会データを読み込んでいます…</p></main>;
  if (error || !state) return <main className="empty"><h1>大会データを取得できませんでした</h1><p role="alert">{error}</p><button className="button primary" onClick={retry}>再試行する</button></main>;
  const { checkpoints, team } = state;
  const points = state.points;
  const approved = checkpoints.filter(c => checkpointStatus(state, c.id, state.selectedTeamId) === 'approved').length;

  return <div className="app-shell">
    <a className="skip-link" href="#main">本文へ移動</a>
    <header className="site-header">
      <div className="header-inner">
        <Link to={isAdmin ? '/admin' : '/cards'} className="brand" aria-label={isAdmin ? 'ROAM 管理者ホーム' : 'ROAM ホーム'}><Compass size={31} strokeWidth={1.5}/><span>ROAM<span className="brand-sub">ROGAINING FIELD NOTES</span></span></Link>
        <div className="event-name"><span className="live-dot"/> YOYOGI ROGAINING <span className="edition">2026 / AUTUMN</span></div>
        <span className="demo-tag">DEMO</span>
      </div>
    </header>

    {!isAdmin && <div className="dashboard-top">
      <div className="team-identity"><span className="eyebrow">TEAM {team.number}</span><h1>{team.name}<Sprout size={22}/></h1><span className="muted">いつもの街に、まだ知らない発見を。</span></div>
      <Countdown endsAt={state.endsAt} />
      <div className="metric score"><span className="metric-label"><Flag size={14}/> 獲得ポイント</span><strong>{points}<small>pt</small></strong><span className="metric-foot">{approved} / {checkpoints.length} チェックポイント達成</span></div>
    </div>}

    {!isAdmin && <ParticipantNav/>}

    <main id="main" className="main-container">
      {notice && <div className="notice" role="status">{notice}<button aria-label="通知を閉じる" onClick={() => setNotice('')}><X size={18}/></button></div>}
      <Routes>
        <Route path="/" element={<Navigate to="/cards" replace/>}/>
        <Route path="/cards" element={<Cards key={state.selectedTeamId} state={state} execute={execute} ended={ended} notify={setNotice}/>}/>
        <Route path="/team" element={<Team state={state}/>}/>
        <Route path="/map" element={<MapPage key={state.selectedTeamId} state={state}/>}/>
        <Route path="/admin/*" element={<AdminConsole state={state} execute={execute} pending={pending} notify={setNotice} review={<PhotoReview state={state} execute={execute} pending={pending} notify={setNotice}/>}/>}/>
        <Route path="*" element={<div className="empty"><Compass/><h2>道に迷いましたか？</h2><Link to="/cards" className="button primary">カード画面へ戻る</Link></div>}/>
      </Routes>
    </main>
    <footer className="site-footer"><span><Compass size={17}/> ROAM <small>歩いた分だけ、街が好きになる。</small></span><span>YOYOGI, TOKYO <span className="footer-dot">·</span> デモ大会 / 位置・画像はサンプル</span></footer>
  </div>;
}

function Cards({ state, execute, ended, notify }: PageProps & { ended: boolean }) {
  const { checkpoints } = state;
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('number');
  const [selected, setSelected] = useState<Checkpoint | null>(null);
  const counts = Object.fromEntries(Object.keys(STATUSES).map(status => [status, checkpoints.filter(c => checkpointStatus(state, c.id, state.selectedTeamId) === status).length]));
  const visible = selectCheckpoints(state, state.selectedTeamId, filter, sort);
  return <>
    <section className="field-banner" aria-label="大会の案内"><div className="banner-copy"><span className="eyebrow"><span className="live-dot"/> YOUR NEXT DISCOVERY</span><h2>道草の先に、<br/>小さな発見を。</h2><p>気になる場所を選んで、歩いて、撮って。<br className="desktop-break"/>街に散らばるチェックポイントを集めよう。</p><Link to="/map">マップで場所を探す <ArrowUpRight size={17}/></Link></div><Landscape/><span className="banner-coordinate">35°40′ N &nbsp; 139°41′ E<br/>YOYOGI FIELD / TOKYO</span></section>
    <div className="section-heading"><div><span className="eyebrow">COLLECT YOUR MOMENTS</span><h2>チェックポイント <span>{checkpoints.length.toString().padStart(2, '0')}</span></h2></div><span className="section-note"><Camera size={15}/> 写真を撮って、ポイントを集めよう</span></div>
    <div className="toolbar"><div className="filters" role="group" aria-label="提出状況で絞り込み"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>すべて <span>{checkpoints.length}</span></button>{Object.entries(STATUSES).map(([key, s]) => <button key={key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{s.label}<span>{counts[key]}</span></button>)}</div><label className="sort-label"><ArrowDownUp size={15}/><span className="sr-only">並び順</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="number">番号順</option><option value="points-desc">配点の高い順</option><option value="points-asc">配点の低い順</option><option value="name">名前順（昇順）</option><option value="status">状態順：未提出→審査中→不可→可</option></select></label></div>
    <div className="results-meta"><span>{visible.length} 件のチェックポイント</span><span>カードをタップして詳細・写真提出 <ArrowDownUp size={12}/></span></div>
    {visible.length ? <div className="checkpoint-grid">{visible.map(cp => <button key={cp.id} className="checkpoint-card" onClick={() => setSelected(cp)} aria-label={`${cp.name} ${cp.points}ポイント ${STATUSES[checkpointStatus(state, cp.id, state.selectedTeamId)].label} 詳細を開く`}><div className="card-image"><Photo src={cp.image} alt={`${cp.name}の目標イラスト`} loading="lazy"/><span className="checkpoint-number">CP {cp.id}</span>{checkpointStatus(state, cp.id, state.selectedTeamId) === 'approved' && <span className="completed-mark"><Check size={18}/></span>}</div><div className="card-body"><span className="card-area"><MapPin size={11}/>{cp.area}</span><h3>{cp.name}</h3><div className="card-bottom"><strong>{cp.points}<small>pt</small></strong><Status value={checkpointStatus(state, cp.id, state.selectedTeamId)}/></div></div></button>)}</div> : <div className="empty"><Flag/><h3>この条件のチェックポイントはありません</h3><button className="button" onClick={() => setFilter('all')}>すべて表示する</button></div>}
    <div className="field-note"><Leaf size={20}/><p><strong>寄り道も、大切なルート。</strong><span>周りの景色や交通に気を配りながら、街歩きを楽しみましょう。</span></p><span className="eyebrow">LEAVE ONLY FOOTPRINTS</span></div>
    {selected && <PhotoModal key={selected.id} cp={selected} state={state} execute={execute} ended={ended} close={() => setSelected(null)} notify={notify}/>}
  </>;
}

function PhotoModal({ cp, state, execute, ended, close, notify }: PageProps & { cp: Checkpoint; ended: boolean; close: () => void }) {
  const { dialog, onClose } = useDialog(cp.id, close);
  const mounted = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const latest = latestSubmission(state, cp.id, state.selectedTeamId);
  const status = checkpointStatus(state, cp.id, state.selectedTeamId);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const canSubmit = !ended && Boolean(state.selectedTeamId) && ['unsubmitted', 'rejected'].includes(status);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  async function select(file: File) {
    setError(''); setBusy(true); setPreview('');
    try { const image = await prepareImage(file); if (mounted.current) setPreview(image); } catch (e) { if (mounted.current) setError(errorMessage(e)); }
    finally { if (mounted.current) setBusy(false); }
  }
  async function submit() {
    setError(''); setBusy(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('この端末では位置情報を利用できません。'));
        navigator.geolocation.getCurrentPosition(resolve, () => reject(new Error('位置情報を取得できませんでした。位置情報を許可して再度お試しください。')), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
      });
      const location = { lat: position.coords.latitude, lon: position.coords.longitude };
      const createdAt = new Date().toISOString();
      await execute('submitPhoto', { checkpointId: cp.id, image: preview, location, createdAt });
      notify(`${cp.name}の提出レコードを作成しました。\ncreatedAt: ${createdAt}\n位置: ${location.lat.toFixed(6)}, ${location.lon.toFixed(6)}`);
      if (mounted.current) close();
    } catch (e) { if (mounted.current) setError(errorMessage(e)); }
    finally { if (mounted.current) setBusy(false); }
  }
  return <dialog onClose={onClose} ref={dialog} className="photo-dialog" aria-labelledby="photo-title" onCancel={e => { e.preventDefault(); if (!busy) close(); }} onClick={e => { if (e.target === dialog.current && !busy) close(); }}><div className="dialog-content"><div className="dialog-header"><span className="eyebrow">CHECKPOINT {cp.id}</span><button className="icon-button" aria-label="詳細を閉じる" onClick={close} disabled={busy}><X/></button></div><div className="dialog-title"><h2 id="photo-title">{cp.name}</h2><strong>{cp.points}<small>pt</small></strong></div><div className="detail-meta"><Status value={status}/><span><MapPin size={14}/>{cp.area}</span></div><p className="detail-description">{cp.description}</p><div className="photo-comparison"><figure><figcaption>01 / 目標画像 <span>デモイラスト</span></figcaption><Photo src={cp.image} alt={`${cp.name}の撮影目標`}/></figure><figure><figcaption>02 / {preview ? '提出前のプレビュー' : '提出画像'}</figcaption>{preview || latest?.image ? <Photo src={preview || latest?.image} alt={preview ? '選択した写真のプレビュー' : '最後に提出した画像'}/> : <div className="photo-placeholder"><ImagePlus size={30}/><span>まだ画像がありません</span></div>}</figure></div>
    {status === 'rejected' && <div className="error-panel"><strong>もう一度撮影をお願いします</strong><p>{latest?.reason}</p></div>}
    {status === 'pending' && <div className="info-panel">写真を提出しました。審査結果をお待ちください。</div>}
    {status === 'approved' && <div className="success-panel"><CheckCheck size={18}/> 承認済み · {cp.points}ポイントを獲得しました。</div>}
    {ended && <div className="info-panel">大会が終了したため、写真の提出はできません。</div>}
    {!state.selectedTeamId && <div className="info-panel">管理画面でチームを作成すると写真を提出できます。</div>}
    {canSubmit && <><p className="upload-note">JPEG / PNG / WebP · 8MBまで。保存時に画像を縮小します。</p><div className="upload-actions"><button className="button" disabled={busy} onClick={() => input.current?.click()}><ImagePlus size={17}/>{preview ? '画像を差し替える' : '画像を選択'}</button><label className={`button ${busy ? 'disabled' : ''}`}><Camera size={17}/>カメラで撮影<input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={busy} onChange={e => { if (e.target.files?.[0]) select(e.target.files[0]); e.target.value = ''; }}/></label><input ref={input} type="file" disabled={busy} hidden accept="image/jpeg,image/png,image/webp" onChange={e => { if (e.target.files?.[0]) select(e.target.files[0]); e.target.value = ''; }}/></div></>}
    {busy && <p role="status">画像を処理・提出しています…</p>}{error && <p className="error-text" role="alert">{error}</p>}<div className="dialog-footer"><button className="button" onClick={close} disabled={busy}>閉じる</button>{canSubmit && <button className="button primary" onClick={submit} disabled={busy}>{status === 'rejected' ? '写真を再提出する' : '写真を提出する'}<ArrowRight size={17}/></button>}</div></div></dialog>;
}

function Team({ state }: { state: Snapshot }) {
  const { checkpoints, team } = state;
  const approved = checkpoints.filter(c => checkpointStatus(state, c.id, state.selectedTeamId) === 'approved').length;
  return <><PageHeading eyebrow="GOOD WALKS, BETTER TOGETHER" title="私たちのチーム" text="発見の記録を、仲間と一緒に。"/><div className="team-layout"><section className="team-panel"><div className="team-emblem"><Sprout size={43} strokeWidth={1}/></div><span className="eyebrow">TEAM {team.number}</span><h2>{team.name}</h2><p className="muted">今日も、いい道草を。</p><div className="team-stats"><div><strong>{state.points}<small>pt</small></strong><span>獲得ポイント</span></div><div><strong>{approved}<small>/ {checkpoints.length}</small></strong><span>チェックポイント達成</span></div></div><h3 className="eyebrow">MEMBERS / {team.members.length}</h3><ul className="member-list">{team.members.map((name, i) => <li key={name}><span className="avatar">{name[0]}</span><span>{name}</span>{i === 0 && <small>リーダー</small>}</li>)}</ul></section><section className="history-panel"><h2><Clock3 size={20}/>提出履歴 <span className="muted">{state.submissions.length}件</span></h2><p className="muted history-intro">再提出前の記録も、ここに残ります。</p>{[...state.submissions].reverse().map(s => { const cp = checkpoints.find(c => c.id === s.checkpointId); if (!cp) return null; return <article className="history-entry" key={s.id}><Photo src={s.image} alt={`${cp.name}の提出画像`}/><div><span className="eyebrow">CP {cp.id} · {formatDate(s.submittedAt)}</span><h3>{cp.name}</h3><Status value={s.status}/>{s.reason && <p className="history-reason">{s.reason}</p>}</div><strong className={s.status === 'approved' ? 'earned' : 'muted'}>{s.status === 'approved' ? `+${cp.points}` : '—'}<small>pt</small></strong></article>; })}{!state.submissions.length && <div className="empty">写真を提出すると、ここに履歴が残ります。</div>}</section></div></>;
}

function PhotoReview({ state, execute, pending: busy, notify }: PageProps & { pending: boolean }) {
  const { checkpoints } = state;
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const { error, run } = useAction({ execute, notify });
  const pending = state.allSubmissions.filter(s => s.status === 'pending');
  async function review(id: string, decision: SubmissionStatus) {
    await run(['reviewSubmission', { id, decision, reason: reasons[id] || '' }], decision === 'approved' ? '承認し、ポイントを反映しました。' : '不承認にしました。参加者は再提出できます。');
  }
  async function demoAction(method: 'endDemo' | 'resetDemo', message: string) { await run([method], message); }
  return <><PageHeading eyebrow="REVIEW DESK" title="写真審査" text="提出写真を確認して、参加者の発見を承認しましょう。"/><div className="info-panel"><ShieldCheck size={20}/><span>この画面は同じブラウザ内のデモ用です。認証・権限制御や他の端末との同期はありません。</span></div><div className="admin-summary"><div><span className="eyebrow">ALL TEAMS</span><h2>全チームの提出写真</h2></div><strong>{state.teams.reduce((sum, t) => sum + t.points, 0)}<small>pt</small></strong><span>審査待ち <b>{pending.length}</b>件</span></div>{error && <p role="alert" className="error-panel">{error}</p>}<div className="review-grid">{pending.map(s => { const cp = checkpoints.find(c => c.id === s.checkpointId); if (!cp) return null; return <article key={s.id} className="review-card"><div className="review-card-heading"><h3>CP {cp.id} / {cp.name}</h3><span>{cp.points}pt</span></div><p className="muted">{state.teams.find(t => t.id === s.teamId)?.name} · {formatDate(s.submittedAt)} 提出</p><div className="photo-comparison"><figure><figcaption>目標画像</figcaption><Photo src={cp.image} alt={`${cp.name}の目標画像`}/></figure><figure><figcaption>提出画像</figcaption><Photo src={s.image} alt={`${cp.name}の提出画像`}/></figure></div><label className="reason-label">不承認の理由<textarea value={reasons[s.id] || ''} onChange={e => setReasons({ ...reasons, [s.id]: e.target.value })} placeholder="不承認の場合は理由を入力してください" maxLength={500}/></label><div className="review-actions"><button className="button" disabled={busy} onClick={() => review(s.id, 'rejected')}><X size={16}/>不承認</button><button className="button primary" disabled={busy} onClick={() => review(s.id, 'approved')}><Check size={16}/>承認する</button></div></article>; })}</div>{!pending.length && <div className="empty"><CheckCheck size={32}/><h3>審査待ちの写真はありません</h3><p>新しい写真が提出されると、ここに表示されます。</p></div>}<section className="demo-controls"><div><h3>レビュー用のデモ操作</h3><p>初期化すると、提出した写真や審査結果もリセットされます。</p></div><div><button className="button" disabled={busy} onClick={() => demoAction('endDemo', '大会を終了しました。カード画面で提出制限を確認できます。')}><Clock3 size={16}/>大会を終了する</button><button className="button" disabled={busy} onClick={() => { if (window.confirm('提出写真・履歴・審査結果を初期状態に戻し、大会を3時間で再開しますか？')) demoAction('resetDemo', 'デモを初期化しました。'); }}><RotateCcw size={16}/>デモを初期化</button></div></section></>;
}

export function PageHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) { return <div className="page-heading"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{text}</p></div>; }

function Landscape() {
  return <svg className="landscape" viewBox="0 0 600 300" fill="none" aria-hidden="true"><path d="M0 240c100-100 134-45 212-95s128-6 184-62 130-6 204-40v257H0" fill="#d4d9bf"/><path d="M0 266c132-102 208-17 291-69s166-55 309-23v126H0" fill="#bbc7a4"/><path d="M100 300c26-56 112-44 166-65s34-47 84-71" stroke="#eee6d0" strokeWidth="30"/><path d="M395 250V128m-4 79-30-40m36 18 28-38" stroke="#6f7f5d" strokeWidth="8"/><path d="m396 36-63 137h126z" fill="#81946a"/><path d="M492 269V112" stroke="#667855" strokeWidth="8"/><path d="m492 59-49 138h98z" fill="#a0ae83"/><path d="M545 282V187" stroke="#70815c" strokeWidth="7"/><path d="m545 122-45 118h90z" fill="#7c9165"/><path d="M192 216V105m-4 67-29-34" stroke="#7f8a68" strokeWidth="7"/><circle cx="194" cy="100" r="45" fill="#adb990"/><circle cx="164" cy="126" r="31" fill="#adb990"/><path d="M291 163v-57" stroke="#6a7756" strokeWidth="4"/><path d="m293 105 37 10-37 15" fill="#ac7855"/><circle cx="365" cy="63" r="22" fill="#ece3c6"/><path d="m57 141 19-9 19 9m16-29 14-7 14 7" stroke="#96a17d" strokeWidth="2"/><path d="M64 279h57m300 5h68" stroke="#8e9d77" strokeWidth="2"/></svg>;
}
