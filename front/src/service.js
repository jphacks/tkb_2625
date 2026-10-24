import { checkpoints, createInitialState, reviewSubmission, submitPhoto, team, totalPoints } from './data.js';
import { repository } from './repository.js';

/**
 * UIが利用する非同期のアプリケーション境界。
 * load() -> { state: Snapshot, warning: string }
 * submitPhoto({ checkpointId, image }) / reviewSubmission({ id, decision, reason }) -> Snapshot
 * endDemo() / resetDemo() -> Snapshot（デモ専用。本番アダプターには公開しない）
 * Snapshot = 保存状態 + { team, checkpoints, points }
 * 将来のAPIアダプターはこの形に応答を変換し、拒否・通信失敗時はrejectする。
 */
export function createDemoService(storage = repository, clock = () => Date.now()) {
  let committed;
  let warning = '';
  let queue = Promise.resolve();
  const snapshot = state => ({ ...state, team, checkpoints, points: totalPoints(state) });
  // 同時操作も直前に確定した状態から処理。失敗した保存を画面へ反映しない。
  const serialize = operation => {
    const result = queue.then(operation);
    queue = result.catch(() => {});
    return result;
  };
  const initialize = async () => {
    if (committed) return;
    const loaded = await storage.load();
    await storage.save(loaded.state);
    committed = loaded.state;
    warning = loaded.warning;
  };
  const command = transform => serialize(async () => {
    await initialize();
    const next = transform(committed);
    await storage.save(next);
    committed = next;
    return snapshot(committed);
  });
  return {
    load: () => serialize(async () => { await initialize(); return { state: snapshot(committed), warning }; }),
    submitPhoto: ({ checkpointId, image }) => command(state => submitPhoto(state, checkpointId, image, clock())),
    reviewSubmission: ({ id, decision, reason = '' }) => command(state => reviewSubmission(state, id, decision, reason)),
    endDemo: () => command(state => ({ ...state, endsAt: new Date(clock() - 1000).toISOString() })),
    resetDemo: () => command(() => createInitialState(clock())),
  };
}
