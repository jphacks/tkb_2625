import { checkpoints, createInitialState } from './data';
import type { DemoState, Submission } from './types';

// UIから保存処理を分離。API導入時はこの境界を置き換える。
const KEY = 'roam-demo-v1';
export const repository = {
  load(): { state: DemoState; warning: string } {
    try {
      const saved = localStorage.getItem(KEY);
      if (!saved) return { state: createInitialState(), warning: '' };
      const data = JSON.parse(saved);
      if (data.version !== 1 || !Array.isArray(data.submissions) || !Number.isFinite(Date.parse(data.endsAt)) || data.submissions.some((s: Partial<Submission> | null) => !s || !s.id || !checkpoints.some(cp => cp.id === s.checkpointId) || typeof s.status !== 'string' || !['pending', 'approved', 'rejected'].includes(s.status) || typeof s.image !== 'string' || typeof s.reason !== 'string' || typeof s.submittedAt !== 'string' || !Number.isFinite(Date.parse(s.submittedAt)))) throw new Error();
      return { state: data, warning: '' };
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
