import { checkpoints, createInitialState } from './data.js';

// UIから保存処理を分離。API導入時はこの境界を置き換える。
const KEY = 'roam-demo-v1';
export const repository = {
  load() {
    try {
      const saved = localStorage.getItem(KEY);
      if (!saved) return { state: createInitialState(), warning: '' };
      const data = JSON.parse(saved);
      if (data.version !== 1 || !Array.isArray(data.submissions) || !Number.isFinite(Date.parse(data.endsAt)) || data.submissions.some(s => !s || !s.id || !checkpoints.some(cp => cp.id === s.checkpointId) || !['pending', 'approved', 'rejected'].includes(s.status) || typeof s.image !== 'string' || typeof s.reason !== 'string' || !Number.isFinite(Date.parse(s.submittedAt)))) throw new Error();
      return { state: data, warning: '' };
    } catch {
      return { state: createInitialState(), warning: '保存データを読み込めませんでした。デモの初期状態で表示しています。' };
    }
  },
  save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch { throw new Error('端末に保存できませんでした。保存容量やブラウザ設定を確認してください。変更は反映されていません。'); }
    return state;
  },
};

export async function prepareImage(file) {
  if (!file) throw new Error('画像を選択してください。');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('JPEG・PNG・WebPの画像を選択してください。');
  if (file.size > 8 * 1024 * 1024) throw new Error('8MB以下の画像を選択してください。');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.72);
  } catch { throw new Error('画像を読み込めませんでした。別の画像を選択してください。'); }
  finally { URL.revokeObjectURL(url); }
}
