export const STATUSES = {
  unsubmitted: { label: '未提出', symbol: '○', rank: 0 },
  pending: { label: '審査中', symbol: '◷', rank: 1 },
  rejected: { label: '不可', symbol: '!', rank: 2 },
  approved: { label: '可', symbol: '✓', rank: 3 },
};

// オフラインでも表示できる、デモ専用のチェックポイントイラスト。
export function landmarkArt(kind, tone = '#b5bea5') {
  const shapes = {
    gate: '<path d="M71 85h178v17H71zM90 110h140v10H90zM105 100v110h15V100m80 0v110h15V100" fill="#9b624c"/><path d="m65 82 190 0-15 9H80z" fill="#4b5549"/>',
    clock: '<path d="M125 215V102l35-35 35 35v113" fill="#c9b28e"/><path d="m118 103 42-45 42 45" fill="#5f6d59"/><circle cx="160" cy="122" r="22" fill="#f2eee2"/><path d="M160 108v15l10 6" fill="none" stroke="#535f4e" stroke-width="4"/><path d="M150 215v-42h20v42" fill="#6b755f"/>',
    bridge: '<path d="M30 190q130-128 260 0v27q-130-110-260 0" fill="#a89175"/><path d="M30 179q130-128 260 0" fill="none" stroke="#596b57" stroke-width="9"/><path d="M55 166v24m30-44v24m30-38v24m30-30v22m30-22v22m30-16v24m30-10v24m30-4v24" stroke="#596b57" stroke-width="5"/>',
    cafe: '<path d="M72 129h176v85H72z" fill="#d4b99a"/><path d="m60 132 18-30h164l18 30" fill="#69755d"/><path d="M83 146h65v45H83zM179 146h49v68h-49z" fill="#7f9083"/><path d="M115 146v45m-32-23h65" stroke="#ebe4d3" stroke-width="4"/><path d="M133 80h48v19h-48z" fill="#e7dfc8"/><path d="M147 84h15v10h-15z" fill="#887763"/>',
    tree: '<path d="M152 107h17v110h-17z" fill="#8e7e60"/><path d="m162 171-35-39m35 21 31-38" stroke="#8e7e60" stroke-width="9"/><circle cx="125" cy="106" r="38" fill="#6d805d"/><circle cx="191" cy="104" r="40" fill="#839365"/><circle cx="157" cy="77" r="46" fill="#89966d"/>',
    pavilion: '<path d="M92 130h136v79H92z" fill="#b9ac90"/><path d="M110 140v70m100-70v70" stroke="#726f58" stroke-width="9"/><path d="m61 132 99-65 99 65z" fill="#64725e"/><path d="M147 210v-49h26v49" fill="#6e7962"/>',
    water: '<path d="M145 125h30v87h-30z" fill="#b5b19a"/><path d="M91 135q69 49 138 0z" fill="#9d9e86"/><path d="M110 215h100v11H110z" fill="#9d9e86"/><path d="M160 80q-58 5-54 54m54-54q58 5 54 54m-54-54v50" fill="none" stroke="#b7ccca" stroke-width="5"/><circle cx="160" cy="78" r="8" fill="#afbca3"/>',
    museum: '<path d="M61 130h198v85H61z" fill="#cbbd9f"/><path d="m53 129 107-53 107 53z" fill="#65725e"/><path d="M82 143v60m37-60v60m81-60v60m37-60v60" stroke="#eee7d7" stroke-width="13"/><path d="M145 214v-69h30v69" fill="#7c8b77"/>',
    post: '<path d="M131 115h59v74h-59z" fill="#ab6d53"/><path d="M128 110q33-28 65 0z" fill="#965e4c"/><path d="M155 189h12v27h-12z" fill="#77745c"/><path d="M142 132h37v6h-37z" fill="#f0e5ce"/><path d="M148 154h25v18h-25z" fill="#e1d3b7"/>',
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 320 240"><rect width="320" height="240" fill="#e3e4d7"/><circle cx="259" cy="51" r="23" fill="#eee9d2"/><path d="M0 140q55-43 108-5t110-5 102 8v102H0" fill="${tone}"/><path d="M0 189q80-27 152 0t168-7v58H0" fill="#cbd0b7"/><path d="M0 221q130-19 320 0v19H0" fill="#b7bda3"/><path d="m0 239 143-38h38l139 39" fill="#e0d9c3"/>${shapes[kind] || shapes.tree}<path d="M35 190v-32m-14 17h28M282 192v-37m-15 16h30" stroke="#82916e" stroke-width="6"/><path d="M0 239h320" stroke="#a3ae91" stroke-width="2"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const checkpoints = [
  { id: '01', name: '代々木の鳥居', area: '北参道エリア', points: 50, kind: 'gate', lat: 35.6763, lng: 139.7022, description: '大きな鳥居の全体が入るように、正面から撮影してください。通行の妨げにならない場所から撮影しましょう。' },
  { id: '02', name: '公園の時計台', area: '中央広場エリア', points: 30, kind: 'clock', lat: 35.6732, lng: 139.6961, description: '時計の文字盤と塔の全体が分かる写真を撮影してください。' },
  { id: '03', name: '緑の歩道橋', area: '西門エリア', points: 40, kind: 'bridge', lat: 35.6713, lng: 139.6919, description: '歩道橋のアーチを目印に、橋全体が分かる位置から撮影してください。' },
  { id: '04', name: '森の喫茶室', area: '南参道エリア', points: 60, kind: 'cafe', lat: 35.6686, lng: 139.6983, description: '入口と看板が一緒に写るように撮影してください。店内への立ち入りは不要です。' },
  { id: '05', name: '広場の大樹', area: '中央広場エリア', points: 20, kind: 'tree', lat: 35.6718, lng: 139.6965, description: '広場にある大きな木を、幹と枝ぶりが分かるように撮影してください。' },
  { id: '06', name: '木陰の東屋', area: '西門エリア', points: 40, kind: 'pavilion', lat: 35.6745, lng: 139.6903, description: '屋根と柱が写るように東屋の全体を撮影してください。' },
  { id: '07', name: '水辺の噴水', area: '中央広場エリア', points: 30, kind: 'water', lat: 35.6703, lng: 139.6945, description: '噴水の形が分かる写真を撮影してください。水辺では足元に注意しましょう。' },
  { id: '08', name: '小さな資料館', area: '北参道エリア', points: 70, kind: 'museum', lat: 35.6781, lng: 139.6957, description: '正面入口と建物の屋根を一緒に撮影してください。入館する必要はありません。' },
  { id: '09', name: '赤い郵便ポスト', area: '南参道エリア', points: 20, kind: 'post', lat: 35.6669, lng: 139.7004, description: '丸い屋根の郵便ポストを正面から撮影してください。' },
].map(cp => ({ ...cp, image: landmarkArt(cp.kind) }));

export const team = { name: '道草クラブ', number: '014', members: ['青木 はる', '佐藤 ひなた', '鈴木 そら'] };
export const demoRoute = [[35.6763,139.7022],[35.6752,139.7001],[35.6737,139.6982],[35.6732,139.6961],[35.6723,139.6957],[35.6718,139.6965]];

export function createInitialState(now = Date.now()) {
  const entry = (id, checkpointId, status, minutes, reason = '') => ({ id, checkpointId, status, reason, image: checkpoints.find(c => c.id === checkpointId).image, submittedAt: new Date(now - minutes * 60000).toISOString() });
  return {
    version: 1,
    endsAt: new Date(now + 3 * 60 * 60000).toISOString(),
    submissions: [entry('sample-1', '01', 'approved', 45), entry('sample-2', '02', 'approved', 30), entry('sample-3', '05', 'rejected', 22, '木の全体が写っていません。少し離れた位置から撮影してください。'), entry('sample-4', '05', 'pending', 15), entry('sample-5', '04', 'rejected', 10, '入口の看板が確認できません。看板を含めて再撮影してください。'), entry('sample-6', '07', 'pending', 5)],
  };
}

export function latestSubmission(state, checkpointId) {
  return state.submissions.filter(s => s.checkpointId === checkpointId).at(-1);
}
export function checkpointStatus(state, id) { return latestSubmission(state, id)?.status || 'unsubmitted'; }
export function selectCheckpoints(state, filter = 'all', sort = 'number') {
  return (state.checkpoints || checkpoints).filter(c => filter === 'all' || checkpointStatus(state, c.id) === filter).sort((a, b) => sort === 'points-desc' ? b.points - a.points : sort === 'points-asc' ? a.points - b.points : sort === 'name' ? a.name.localeCompare(b.name, 'ja') : sort === 'status' ? STATUSES[checkpointStatus(state, a.id)].rank - STATUSES[checkpointStatus(state, b.id)].rank : a.id.localeCompare(b.id));
}
export function totalPoints(state) {
  const approved = new Set(state.submissions.filter(s => s.status === 'approved').map(s => s.checkpointId));
  return checkpoints.filter(c => approved.has(c.id)).reduce((sum, c) => sum + c.points, 0);
}

export function submitPhoto(state, checkpointId, image, now = Date.now(), id = crypto.randomUUID()) {
  if (now >= Date.parse(state.endsAt)) throw new Error('大会が終了したため、提出できません。');
  if (!checkpoints.some(c => c.id === checkpointId)) throw new Error('チェックポイントが見つかりません。');
  if (['pending', 'approved'].includes(checkpointStatus(state, checkpointId))) throw new Error('このチェックポイントは提出済みです。');
  if (!image) throw new Error('画像を選択してください。');
  return { ...state, submissions: [...state.submissions, { id, checkpointId, image, status: 'pending', reason: '', submittedAt: new Date(now).toISOString() }] };
}

export function reviewSubmission(state, id, decision, reason = '') {
  const submission = state.submissions.find(s => s.id === id);
  if (!submission || submission.status !== 'pending') throw new Error('審査済み、または存在しない提出です。');
  if (!['approved', 'rejected'].includes(decision)) throw new Error('無効な審査結果です。');
  if (decision === 'rejected' && !reason.trim()) throw new Error('不承認の理由を入力してください。');
  return { ...state, submissions: state.submissions.map(s => s.id === id ? { ...s, status: decision, reason: reason.trim() } : s) };
}
