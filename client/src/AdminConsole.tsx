import { errorMessage, formatDate } from './utils';
import { useAction } from './useAction';
import Photo from './Photo';
import { useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { ArrowUpRight, Flag, MapPin, Plus, Search, ShieldCheck, Trash2, Trophy, Users } from 'lucide-react';
import { prepareImage } from './images';
import AdminMap from './AdminMap';
import type { Execute, Snapshot } from './types';
import './admin.css';

type Props = { state: Snapshot; execute: Execute; pending: boolean; notify: (message: string) => void };
export default function AdminConsole(props: Props & { review: ReactNode }) {
  const { state } = props;
  const links = [
    { to: '/admin/ranking', label: 'ランキング', icon: Trophy },
    { to: '/admin/teams', label: 'チーム管理', icon: Users },
    { to: '/admin/checkpoints', label: 'CP管理', icon: Flag },
    { to: '/admin/map', label: 'チーム位置', icon: MapPin },
    { to: '/admin/review', label: '写真審査', icon: ShieldCheck },
    { to: '/admin/events/new', label: 'イベント作成', icon: Plus },
  ];
  return <div className="admin-console">
    <div className="admin-heading"><div><span className="eyebrow">ROAM / EVENT OPERATIONS</span><h2>大会管理</h2><p>チームの一歩も、新しい発見も。大会のいまを、ここから。</p></div></div>
    <div className="user-team-switch"><label>参加者モックの表示チーム<select value={state.selectedTeamId || ''} disabled={props.pending || !state.teams.length} onChange={e => { void props.execute('selectTeam', { id: e.target.value }).catch(reason => props.notify(errorMessage(reason))); }}>{!state.teams.length && <option value="">チームなし</option>}{state.teams.map(t => <option key={t.id} value={t.id}>{t.number} / {t.name}</option>)}</select></label><span>{state.teams.length ? `参加者画面の表示対象：${state.team.members.length}名 / ${state.points}pt` : 'チーム管理でチームを作成してください。'}</span></div>
    <p className="admin-demo-note"><ShieldCheck size={17} /> フロントエンドのモックです。変更は同じタブの参加者画面にも反映され、ブラウザに保存されます。チーム位置はサンプルです。</p>
    <div className="admin-metrics">
      <div><Users size={19}/><span>参加チーム<strong>{state.teams.length}<small>組</small></strong></span></div>
      <div><Users size={19}/><span>参加者<strong>{state.participants.length}<small>名</small></strong></span></div>
      <div><Flag size={19}/><span>チェックポイント<strong>{state.checkpoints.length}<small>件</small></strong></span></div>
      <div><ShieldCheck size={19}/><span>審査待ち<strong>{state.allSubmissions.filter(s => s.status === 'pending').length}<small>件</small></strong></span></div>
    </div>
    <nav className="admin-tabs" aria-label="管理者メニュー">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to}><Icon size={17}/>{label}</NavLink>)}</nav>
    <Routes>
      <Route index element={<Navigate to="ranking" replace />} />
      <Route path="ranking" element={<Ranking state={state} />} />
      <Route path="teams" element={<TeamManagement {...props} />} />
      <Route path="checkpoints" element={<CheckpointManagement {...props} />} />
      <Route path="map" element={<TeamMap state={state} />} />
      <Route path="review" element={props.review} />
      <Route path="*" element={<div className="empty"><p>管理画面が見つかりません。</p><Link to="/admin/ranking" className="button">ランキングへ</Link></div>} />
    </Routes>
  </div>;
}

function SectionTitle({ title, text }: { title: string; text: string }) {
  return <div className="admin-section-title"><h3>{title}</h3><p>{text}</p></div>;
}

function Ranking({ state }: { state: Snapshot }) {
  const [query, setQuery] = useState('');
  const teams = state.teams.filter(t => `${t.name} ${t.number} ${t.members.join(' ')}`.includes(query.trim()));
  return <section>
    <SectionTitle title="チームランキング" text="写真の承認に合わせて得点を反映します。同じ得点のチームは同順位です。" />
    <label className="admin-search"><Search size={17}/><span className="sr-only">チーム・メンバーを検索</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="チーム名・番号・メンバーで検索" /></label>
    <div className="admin-table-wrap"><table className="admin-table ranking-table"><caption className="sr-only">チーム別の順位と獲得ポイント</caption><thead><tr><th scope="col">順位</th><th scope="col">チーム</th><th scope="col">メンバー</th><th scope="col">獲得ポイント</th></tr></thead><tbody>
      {teams.map(t => <tr key={t.id}><td><span className={`rank-number ${t.rank === 1 ? 'first' : ''}`}>{t.rank === 1 && <Trophy size={15}/>} {t.rank}</span></td><th scope="row"><small>TEAM {t.number}</small>{t.name}</th><td>{t.members.length ? t.members.join(' / ') : <span className="muted">メンバー未登録</span>}</td><td className="admin-points">{t.points}<small>pt</small></td></tr>)}
    </tbody></table>{!teams.length && <div className="empty">{state.teams.length ? '検索に一致するチームはありません。' : 'チーム管理から最初のチームを作成してください。'}</div>}</div>
    <p className="admin-footnote">得点は承認済みCPの配点をチームごとに一度だけ加算します。検索しても順位は全チームでの順位です。</p>
  </section>;
}

function TeamManagement(props: Props) {
  const { state, pending } = props;
  const { run, error } = useAction(props);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [query, setQuery] = useState('');
  async function create(e: FormEvent) {
    e.preventDefault();
    if (await run(['addTeam', { name, number }], 'チームを追加しました。')) { setName(''); setNumber(''); }
  }
  return <section>
    <SectionTitle title="チームと参加者" text="参加者の所属を変更すると、参加者画面のメンバー一覧にも反映されます。得点はチームに紐づきます。" />
    {error && <p className="error-panel" role="alert">{error}</p>}
    <form className="admin-form admin-inline-form" onSubmit={create}><label>チーム番号<input type="number" min="1" max="9999" required value={number} onChange={e => setNumber(e.target.value)} placeholder="例：17" /></label><label>チーム名<input required maxLength={60} value={name} onChange={e => setName(e.target.value)} placeholder="新しいチームの名前" /></label><button className="button primary" disabled={pending}><Plus size={17}/>チームを追加</button></form>
    <div className="admin-team-grid">{state.teams.map(t => <article key={t.id} className="admin-team-card"><div className="admin-card-top"><span className="eyebrow">TEAM {t.number}</span><button type="button" className="icon-button danger" disabled={pending} aria-label={`${t.name}を削除`} onClick={() => { if (window.confirm(`${t.name}を削除しますか？ メンバーは未所属に戻り、このチームの提出履歴と得点も削除されます。`)) void run(['deleteTeam', { id: t.id }], 'チームを削除し、メンバーを未所属に戻しました。'); }}><Trash2 size={17}/></button></div><h4>{t.name}</h4><strong className="admin-card-score">{t.points}<small>pt</small></strong><ul>{t.members.map((member, i) => <li key={`${i}-${member}`}><span className="avatar">{member[0]}</span>{member}</li>)}</ul>{!t.members.length && <p className="muted">メンバー未登録</p>}<span className="admin-card-footer">{t.members.length}名 · ランキング {t.rank}位</span></article>)}</div>
    {!state.teams.length && <div className="empty">チームがありません。上のフォームから作成できます。</div>}
    <div className="admin-section-title"><h3>参加者リスト <small>{state.participants.length}名</small></h3><p>各参加者は1チームに所属できます。「未所属」を選ぶとチームから外れます。</p></div>
    <label className="admin-search"><Search size={17}/><span className="sr-only">参加者を検索</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="参加者名で検索" /></label>
    <div className="admin-participants">{state.participants.filter(p => p.name.includes(query.trim())).map(p => <div key={p.id}><span className="avatar">{p.name[0]}</span><span>{p.name}</span><label><span className="sr-only">{p.name}の所属チーム</span><select disabled={pending} value={p.teamId || ''} onChange={e => void run(['assignParticipant', { participantId: p.id, teamId: e.target.value || null }], `${p.name}の所属を変更しました。`)}><option value="">未所属</option>{state.teams.map(t => <option key={t.id} value={t.id}>{t.number} / {t.name}</option>)}</select></label></div>)}{!state.participants.some(p => p.name.includes(query.trim())) && <p className="empty">該当する参加者はいません。</p>}</div>
  </section>;
}

const emptyDraft = { id: '', name: '', points: '', area: '', description: '', lat: '', lng: '' };
function CheckpointManagement(props: Props) {
  const { state, pending } = props;
  const { run, error } = useAction(props);
  const [draft, setDraft] = useState(emptyDraft);
  const [image, setImage] = useState('');
  const [imageError, setImageError] = useState('');
  const [imageBusy, setImageBusy] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [focus, setFocus] = useState<[number, number] | null>(null);
  const busy = pending || imageBusy;
  function field(key: keyof typeof draft, value: string) { setDraft(previous => ({ ...previous, [key]: value })); }
  async function upload(file: File) {
    setImageError(''); setImageBusy(true); setImage('');
    try { setImage(await prepareImage(file)); } catch (e) { setImageError(errorMessage(e)); }
    finally { setImageBusy(false); }
  }
  async function create(e: FormEvent) {
    e.preventDefault();
    if (draft.lat.trim() === '' || draft.lng.trim() === '') { setImageError('緯度・経度を入力するか、地図で位置を指定してください。'); return; }
    if (await run(['addCheckpoint', { ...draft, points: Number(draft.points), lat: Number(draft.lat), lng: Number(draft.lng), image }], 'CPを追加しました。参加者のカード・地図にも反映しました。')) {
      setDraft(emptyDraft); setImage(''); setSelected(null); setImageError(''); setFormKey(k => k + 1);
    }
  }
  return <section>
    <SectionTitle title="チェックポイント管理" text="登録したCPは参加者のカード・地図と共通です。位置は緯度・経度の入力、または地図クリックで指定できます。" />
    {(error || imageError) && <p className="error-panel" role="alert">{error || imageError}</p>}
    <div className="admin-cp-layout">
      <form className="admin-form admin-cp-form" onSubmit={create}>
        <h4>新しいCPを登録</h4><div className="admin-form-pair"><label>CP番号<input type="number" min="1" max="9999" required value={draft.id} onChange={e => field('id', e.target.value)} /></label><label>配点（pt）<input type="number" min="0" max="100000" step="1" required value={draft.points} onChange={e => field('points', e.target.value)} /></label></div>
        <label>CP名<input required maxLength={60} value={draft.name} onChange={e => field('name', e.target.value)} /></label>
        <label>エリア名（任意）<input maxLength={60} value={draft.area} onChange={e => field('area', e.target.value)} /></label>
        <label>撮影案内（任意）<textarea maxLength={500} value={draft.description} onChange={e => field('description', e.target.value)} /></label>
        <label>見本写真 <small>JPEG / PNG / WebP · 8MBまで</small><input key={formKey} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file); e.target.value = ''; }} /></label>
        {image && <Photo className="admin-upload-preview" src={image} alt="登録するCPの見本写真" />}
        {imageBusy && <p role="status">見本写真を処理しています…</p>}
        <div className="admin-form-pair"><label>緯度<input type="number" min="-90" max="90" step="any" required value={draft.lat} onChange={e => { field('lat', e.target.value); setSelected(null); }} /></label><label>経度<input type="number" min="-180" max="180" step="any" required value={draft.lng} onChange={e => { field('lng', e.target.value); setSelected(null); }} /></label></div>
        <button className="button primary" disabled={busy}><Plus size={17}/>CPを登録する</button>
      </form>
      <div className="admin-picker"><div className="admin-picker-label"><MapPin size={16}/>地図をクリックしてCPの位置を選択</div><AdminMap checkpoints={state.checkpoints} selected={selected} focus={focus} onPick={(lat, lng) => { setDraft(previous => ({ ...previous, lat: lat.toFixed(6), lng: lng.toFixed(6) })); setSelected([lat, lng]); }} /><p className="admin-footnote" aria-live="polite">{selected ? `選択位置：${selected[0].toFixed(6)}, ${selected[1].toFixed(6)}` : '既存CPは番号付きで表示しています。地図が取得できない場合も座標を入力できます。'}</p></div>
    </div>
    <SectionTitle title={`登録済みCP / ${state.checkpoints.length}件`} text="削除すると、そのCPの提出履歴と各チームの獲得ポイントも削除されます。" />
    <div className="admin-cp-list">{state.checkpoints.map(cp => <article key={cp.id}><Photo src={cp.image} alt={`${cp.name}の見本写真`} /><div><span className="eyebrow">CP {cp.id}</span><h4>{cp.name}</h4><p>{cp.area || 'エリア未設定'}</p><button type="button" className="admin-coordinate" onClick={() => { setFocus([cp.lat, cp.lng]); }}><MapPin size={13}/>{cp.lat.toFixed(5)}, {cp.lng.toFixed(5)}</button></div><strong>{cp.points}<small>pt</small></strong><button type="button" className="icon-button danger" disabled={busy} aria-label={`${cp.name}を削除`} onClick={() => { if (window.confirm(`CP ${cp.id}「${cp.name}」を削除しますか？ 全チームのこのCPの提出履歴と獲得ポイントも削除されます。`)) void run(['deleteCheckpoint', { id: cp.id }], 'CPと関連する提出履歴を削除し、得点を更新しました。'); }}><Trash2 size={18}/></button></article>)}</div>
    {!state.checkpoints.length && <div className="empty">CPがありません。上のフォームから登録してください。</div>}
  </section>;
}

function TeamMap({ state }: { state: Snapshot }) {
  const [focus, setFocus] = useState<[number, number] | null>(null);
  const [filter, setFilter] = useState('all');
  const teams = useMemo(() => filter === 'all' ? state.teams : state.teams.filter(t => t.id === filter), [filter, state.teams]);
  return <section>
    <SectionTitle title="チームの位置マップ" text="各チームのサンプル位置とCPを表示します。実測GPSの共有や自動追跡は行いません。" />
    <div className="admin-map-controls"><label>表示チーム<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">全チーム</option>{state.teams.map(t => <option key={t.id} value={t.id}>{t.number} / {t.name}</option>)}</select></label><div className="admin-legend"><span><i className="team-key"/>チーム（モック）</span><span><i className="cp-key"/>CP</span></div></div>
    <div className="admin-location-layout"><AdminMap checkpoints={state.checkpoints} teams={teams} focus={focus} /><aside className="admin-location-list"><h4>チームの最終位置</h4>{teams.map(t => <article key={t.id}><span className="eyebrow">TEAM {t.number}</span><h5>{t.name}</h5><p>{t.points}pt · {t.members.length}名</p>{t.position ? <><span className="mock-badge">モック位置</span><p>最終更新 {formatDate(t.position.updatedAt)}</p><p>{t.position.lat.toFixed(5)}, {t.position.lng.toFixed(5)}</p><button className="button" onClick={() => setFocus([t.position!.lat, t.position!.lng])}>地図で確認<ArrowUpRight size={14}/></button></> : <p className="admin-no-position">位置未取得</p>}</article>)}{!teams.length && <p className="empty">チームがありません。</p>}</aside></div>
  </section>;
}
