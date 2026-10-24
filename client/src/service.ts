import { checkpoints, createInitialState, reviewSubmission, submitPhoto, team, totalPoints } from './data';
import { repository } from './repository';
import type { CommandPayloads, DemoRepository, DemoState, Snapshot } from './types';

/**
 * UIが利用する非同期のアプリケーション境界。
 * load() -> { state: Snapshot, warning: string }
 * submitPhoto({ checkpointId, image }) / reviewSubmission({ id, decision, reason }) -> Snapshot
 * endDemo() / resetDemo() -> Snapshot（デモ専用。本番アダプターには公開しない）
 * Snapshot = 保存状態 + { team, checkpoints, points }
 * 将来のAPIアダプターはこの形に応答を変換し、拒否・通信失敗時はrejectする。
 */
export function createDemoService(storage: DemoRepository = repository, clock = () => Date.now()) {
  let committed: DemoState | undefined;
  let warning = '';
  let queue = Promise.resolve();
  const snapshot = (state: DemoState): Snapshot => ({ ...state, team, checkpoints, points: totalPoints(state) });
  // 同時操作も直前に確定した状態から処理。失敗した保存を画面へ反映しない。
  const serialize = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = queue.then(operation);
    queue = result.then(() => {}, () => {});
    return result;
  };
  const initialize = async (): Promise<DemoState> => {
    if (committed) return committed;
    const loaded = await storage.load();
    await storage.save(loaded.state);
    committed = loaded.state;
    warning = loaded.warning;
    return committed;
  };
  const command = (transform: (state: DemoState) => DemoState) => serialize(async () => {
    const current = await initialize();
    const next = transform(current);
    await storage.save(next);
    committed = next;
    return snapshot(committed);
  });
  return {
    load: () => serialize(async () => { const current = await initialize(); return { state: snapshot(current), warning }; }),
    submitPhoto: ({ checkpointId, image }: CommandPayloads['submitPhoto']) => command(state => submitPhoto(state, checkpointId, image, clock())),
    reviewSubmission: ({ id, decision, reason = '' }: CommandPayloads['reviewSubmission']) => command(state => reviewSubmission(state, id, decision, reason)),
    endDemo: () => command(state => ({ ...state, endsAt: new Date(clock() - 1000).toISOString() })),
    resetDemo: () => command(() => createInitialState(clock())),
  };
}
