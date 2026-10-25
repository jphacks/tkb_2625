import { createInitialState } from './data';
import { openDatabase, readRecord } from './database';
import { commitMemoryImages, imageReferences, releaseImages, separateImages } from './imageStore';
import { createId, normalizeNumber } from './utils';
import type { DemoState, Submission } from './types';

const memoryWarning = 'このブラウザではデータを保存できないため、一時的なデモとして動作します。再読み込みすると変更は失われます。';
const validDate = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const validCoordinate = (lat: number, lng: number) => Number.isFinite(lat) && Math.abs(lat) <= 90 && Number.isFinite(lng) && Math.abs(lng) <= 180;

export function validateState(value: unknown): DemoState {
  const data = value as DemoState;
  if (!data || data.version !== 2 || !validDate(data.endsAt) || !Array.isArray(data.teams) || !Array.isArray(data.participants) || !Array.isArray(data.checkpoints) || !Array.isArray(data.submissions)) throw new Error('Invalid state');
  for (const items of [data.teams, data.participants, data.checkpoints, data.submissions]) {
    if (items.some(x => !x || typeof x !== 'object' || typeof x.id !== 'string' || !x.id) || new Set(items.map(x => x.id)).size !== items.length) throw new Error('Invalid IDs');
  }
  const hasTeam = (id: string | null) => id === null || data.teams.some(t => t.id === id);
  if (!hasTeam(data.selectedTeamId)) throw new Error('Invalid selected team');
  if (data.teams.some(t => typeof t.name !== 'string' || !/^\d{1,4}$/.test(t.number) || !Array.isArray(t.demoRoute) || t.demoRoute.some(p => !Array.isArray(p) || p.length !== 2 || !validCoordinate(p[0], p[1])) || (t.position !== null && (!t.position || !validCoordinate(t.position.lat, t.position.lng) || !validDate(t.position.updatedAt))))) throw new Error('Invalid teams');
  if (new Set(data.teams.map(t => Number(t.number))).size !== data.teams.length) throw new Error('Duplicate team numbers');
  if (data.participants.some(p => typeof p.name !== 'string' || !hasTeam(p.teamId))) throw new Error('Invalid participants');
  if (data.checkpoints.some(cp => !/^\d{1,4}$/.test(cp.id) || Number(cp.id) < 1 || typeof cp.name !== 'string' || typeof cp.area !== 'string' || typeof cp.description !== 'string' || typeof cp.image !== 'string' || !Number.isSafeInteger(cp.points) || cp.points < 0 || !validCoordinate(cp.lat, cp.lng))) throw new Error('Invalid checkpoints');
  if (new Set(data.checkpoints.map(cp => Number(cp.id))).size !== data.checkpoints.length) throw new Error('Duplicate CP numbers');
  if (data.submissions.some(s => typeof s.teamId !== 'string' || !hasTeam(s.teamId) || !data.checkpoints.some(cp => cp.id === s.checkpointId) || !['pending', 'approved', 'rejected'].includes(s.status) || typeof s.image !== 'string' || typeof s.reason !== 'string' || !validDate(s.submittedAt))) throw new Error('Invalid submissions');
  return data;
}

// v2の経路フィールド追加とCP番号正規化。既存の参照も一緒に置き換える。
export function upgradeState(state: DemoState): DemoState {
  const samples = createInitialState();
  return validateState({ ...state,
    teams: state.teams.map(t => ({ ...t, demoRoute: t.demoRoute ?? samples.teams.find(sample => sample.id === t.id)?.demoRoute ?? [] })),
    checkpoints: state.checkpoints.map(cp => ({ ...cp, id: normalizeNumber(cp.id) })),
    submissions: state.submissions.map(s => ({ ...s, checkpointId: normalizeNumber(s.checkpointId), reason: s.status === 'approved' ? '' : s.reason })),
  });
}

export function migrateV1(previous: { version: number; endsAt: string; submissions: Submission[] }): DemoState {
  if (previous.version !== 1 || !Array.isArray(previous.submissions)) throw new Error('Invalid legacy state');
  const state = createInitialState();
  const imported = previous.submissions.map(s => ({ ...s, teamId: 'team-014' }));
  const ids = new Set(imported.map(s => s.id));
  // v1に存在しなかったチームのサンプルは残す。ID衝突時だけサンプル側を変更する。
  const otherTeams = state.submissions.filter(s => s.teamId !== 'team-014').map(s => ({ ...s, id: ids.has(s.id) ? createId() : s.id }));
  return upgradeState({ ...state, endsAt: previous.endsAt, submissions: [...imported, ...otherTeams] });
}

async function persist(db: IDBDatabase, input: DemoState): Promise<DemoState> {
  const { state, added } = separateImages(validateState(input));
  const active = imageReferences(state);
  await new Promise<void>((resolve, reject) => {
    // 画像・メタデータ・不要画像の削除は同じトランザクションで確定する。
    const tx = db.transaction(['state', 'images'], 'readwrite');
    const images = tx.objectStore('images');
    for (const [id, blob] of added) images.put(blob, id);
    for (const id of active) {
      const check = images.get(id);
      check.onsuccess = () => { if (!(check.result instanceof Blob)) tx.abort(); };
    }
    tx.objectStore('state').put(state, 'current');
    const keys = images.getAllKeys();
    keys.onsuccess = () => { for (const key of keys.result) if (!active.has(String(key))) images.delete(key); };
    tx.oncomplete = () => resolve();
    tx.onabort = tx.onerror = () => reject(tx.error || new Error('IndexedDB write failed'));
  });
  releaseImages(active);
  return state;
}

export function createRepository() {
  let state: DemoState | undefined;
  let warning = '';
  let db: IDBDatabase | undefined;
  let loading: Promise<{ state: DemoState; warning: string }> | undefined;
  function memoryState(input: DemoState) {
    const prepared = separateImages(input);
    commitMemoryImages(prepared.added, imageReferences(prepared.state));
    return prepared.state;
  }
  async function initialize() {
    let initial = createInitialState();
    try {
      db = await openDatabase();
      const current = await readRecord<DemoState>(db, 'state', 'current');
      if (current !== undefined) {
        initial = upgradeState(current);
        // 欠損した画像参照を成功扱いにして旧データへ上書きしない。
        for (const id of imageReferences(initial)) {
          if (!(await readRecord<Blob>(db, 'images', id) instanceof Blob)) throw new Error('Missing image');
        }
        state = initial;
        return { state, warning };
      }
    } catch {
      db = undefined; initial = createInitialState(); warning = memoryWarning;
    }
    // localStorageは旧形式の読込専用。利用拒否でもIndexedDBの動作を妨げない。
    try {
      const saved = localStorage.getItem('roam-demo-v2');
      const legacy = saved ? null : localStorage.getItem('roam-demo-v1');
      if (saved || legacy) {
        initial = saved ? upgradeState(JSON.parse(saved)) : migrateV1(JSON.parse(legacy!));
        // 旧形式には画像本体が必要。壊れたbase64や外部参照は移行しない。
        if (imageReferences(initial).size) throw new Error('Invalid legacy image reference');
        separateImages(initial);
        warning = [warning, '既存の写真・審査結果・終了時刻を引き継ぎました。'].filter(Boolean).join(' ');
      }
    } catch {
      initial = createInitialState();
      warning = [warning, '旧保存データを読み込めませんでした。初期データで表示しています。'].filter(Boolean).join(' ');
    }
    try { state = db ? await persist(db, initial) : memoryState(initial); }
    catch { db = undefined; state = memoryState(initial); warning = memoryWarning; }
    return { state, warning };
  }
  return {
    async load() {
      if (state) return { state, warning };
      return loading ??= initialize();
    },
    async save(next: DemoState): Promise<DemoState> {
      if (!state) await (loading ??= initialize());
      try {
        const saved = db ? await persist(db, next) : memoryState(validateState(next));
        state = saved;
        return saved;
      } catch {
        throw new Error('端末に保存できませんでした。保存容量やブラウザ設定を確認してください。変更は反映されていません。');
      }
    },
  };
}

export const repository = createRepository();
