import { createInitialState } from './data';
import type { DemoState, Submission } from './types';

const KEY = 'roam-demo-v2';
const dateIsValid = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const unique = (items: { id: string }[]) => items.every(x => typeof x.id === 'string' && x.id.length > 0) && new Set(items.map(x => x.id)).size === items.length;

function validate(data: DemoState): DemoState {
  if (!data || data.version !== 2 || !dateIsValid(data.endsAt) || !Array.isArray(data.teams) || !Array.isArray(data.participants) || !Array.isArray(data.checkpoints) || !Array.isArray(data.submissions)) throw new Error('Invalid state');
  if (![data.teams, data.participants, data.checkpoints, data.submissions].every(items => items.every(x => x && typeof x === 'object') && unique(items))) throw new Error('Invalid IDs');
  const hasTeam = (id: string | null) => id === null || data.teams.some(t => t.id === id);
  if (!hasTeam(data.selectedTeamId)) throw new Error('Invalid selected team');
  if (data.teams.some(t => typeof t.name !== 'string' || typeof t.number !== 'string' || (t.position !== null && (!Number.isFinite(t.position.lat) || Math.abs(t.position.lat) > 90 || !Number.isFinite(t.position.lng) || Math.abs(t.position.lng) > 180 || !dateIsValid(t.position.updatedAt))))) throw new Error('Invalid teams');
  if (data.participants.some(p => typeof p.name !== 'string' || !hasTeam(p.teamId))) throw new Error('Invalid participants');
  if (data.checkpoints.some(cp => !/^\d{1,4}$/.test(cp.id) || typeof cp.name !== 'string' || typeof cp.area !== 'string' || typeof cp.description !== 'string' || typeof cp.image !== 'string' || !Number.isSafeInteger(cp.points) || cp.points < 0 || !Number.isFinite(cp.lat) || Math.abs(cp.lat) > 90 || !Number.isFinite(cp.lng) || Math.abs(cp.lng) > 180)) throw new Error('Invalid checkpoints');
  if (data.submissions.some(s => typeof s.teamId !== 'string' || !hasTeam(s.teamId) || !data.checkpoints.some(cp => cp.id === s.checkpointId) || !['pending', 'approved', 'rejected'].includes(s.status) || typeof s.image !== 'string' || typeof s.reason !== 'string' || !dateIsValid(s.submittedAt))) throw new Error('Invalid submissions');
  return data;
}

export const repository = {
  load(): { state: DemoState; warning: string } {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) return { state: validate(JSON.parse(saved)), warning: '' };
      const legacy = localStorage.getItem('roam-demo-v1');
      if (legacy) {
        const previous = JSON.parse(legacy);
        if (previous.version !== 1 || !Array.isArray(previous.submissions)) throw new Error('Invalid legacy state');
        const state = createInitialState();
        state.endsAt = previous.endsAt;
        state.submissions = previous.submissions.map((s: Submission) => ({ ...s, teamId: 'team-014' }));
        return { state: validate(state), warning: '既存の写真・審査結果・終了時刻を管理者モックへ引き継ぎました。' };
      }
      return { state: createInitialState(), warning: '' };
    } catch {
      return { state: createInitialState(), warning: '保存データを読み込めませんでした。デモの初期状態で表示しています。' };
    }
  },
  save(state: DemoState) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch { throw new Error('端末に保存できませんでした。保存容量やブラウザ設定を確認してください。変更は反映されていません。'); }
    return state;
  },
};
