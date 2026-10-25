import { createInitialState, reviewSubmission, submitPhoto, toSnapshot } from './data';
import { addTeam, deleteTeam, assignParticipant, addCheckpoint, deleteCheckpoint, selectTeam } from './adminData';
import { repository } from './repository';
import type { CommandPayloads, DemoRepository, DemoState, Execute } from './types';

type Transform = (state: DemoState) => DemoState;
type Handlers = { [K in keyof CommandPayloads]: (payload: CommandPayloads[K]) => Transform };

export function createDemoService(storage: DemoRepository = repository, clock = () => Date.now()) {
  let committed: DemoState | undefined;
  let warning = '';
  let queue = Promise.resolve();
  const handlers: Handlers = {
    submitPhoto: ({ checkpointId, image }) => state => submitPhoto(state, checkpointId, image, clock()),
    reviewSubmission: ({ id, decision, reason = '' }) => state => reviewSubmission(state, id, decision, reason),
    endDemo: () => state => ({ ...state, endsAt: new Date(clock() - 1000).toISOString() }),
    resetDemo: () => () => createInitialState(clock()),
    addTeam: payload => state => addTeam(state, payload),
    deleteTeam: ({ id }) => state => deleteTeam(state, id),
    assignParticipant: payload => state => assignParticipant(state, payload),
    addCheckpoint: payload => state => addCheckpoint(state, payload),
    deleteCheckpoint: ({ id }) => state => deleteCheckpoint(state, id),
    selectTeam: ({ id }) => state => selectTeam(state, id),
  };
  function dispatch<K extends keyof CommandPayloads>(method: K, payload: CommandPayloads[K]) {
    return handlers[method](payload);
  }
  function serialize<T>(operation: () => Promise<T>): Promise<T> {
    const result = queue.then(operation);
    queue = result.then(() => {}, () => {});
    return result;
  }
  async function initialize(): Promise<DemoState> {
    if (!committed) {
      const loaded = await storage.load();
      committed = loaded.state;
      warning = loaded.warning;
    }
    return committed;
  }
  const execute: Execute = (...args) => serialize(async () => {
    const current = await initialize();
    const next = dispatch(args[0], args[1])(current);
    // 保存失敗時には確定状態を進めない。保存先で画像を参照に変換した結果を受け取る。
    const saved = await storage.save(next);
    committed = saved || next;
    return toSnapshot(committed);
  });
  return {
    load: () => serialize(async () => ({ state: toSnapshot(await initialize()), warning })),
    execute,
  };
}
