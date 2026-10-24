import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDemoService } from '../src/service.js';
import { checkpointStatus, createInitialState } from '../src/data.js';

const now = Date.parse('2026-10-24T10:00:00+09:00');
function memoryStorage() {
  let saved = createInitialState(now);
  return {
    fail: false,
    async load() { return { state: saved, warning: '' }; },
    async save(next) { if (this.fail) throw new Error('保存失敗'); saved = next; },
  };
}
test('async service returns server-shaped snapshots and serializes duplicate submissions', async () => {
  const service = createDemoService(memoryStorage(), () => now);
  const initial = await service.load();
  assert.equal(initial.state.points, 80);
  assert.equal(initial.state.checkpoints.length, 9);
  assert.equal(initial.state.team.name, '道草クラブ');
  const results = await Promise.allSettled([
    service.submitPhoto({ checkpointId: '03', image: 'photo' }),
    service.submitPhoto({ checkpointId: '03', image: 'duplicate' }),
  ]);
  assert.equal(results[0].status, 'fulfilled');
  assert.equal(results[1].status, 'rejected');
  const submitted = results[0].value.submissions.at(-1);
  const reviewed = await service.reviewSubmission({ id: submitted.id, decision: 'approved' });
  assert.equal(reviewed.points, 120);
  await assert.rejects(service.reviewSubmission({ id: submitted.id, decision: 'approved' }), /審査済み/);
});
test('failed async persistence leaves the last confirmed snapshot intact and allows retry', async () => {
  const storage = memoryStorage();
  const service = createDemoService(storage, () => now);
  await service.load();
  storage.fail = true;
  await assert.rejects(service.submitPhoto({ checkpointId: '03', image: 'photo' }), /保存失敗/);
  assert.equal(checkpointStatus((await service.load()).state, '03'), 'unsubmitted');
  storage.fail = false;
  assert.equal(checkpointStatus(await service.submitPhoto({ checkpointId: '03', image: 'photo' }), '03'), 'pending');
});
test('demo end and reset use the same service boundary', async () => {
  const service = createDemoService(memoryStorage(), () => now);
  await service.endDemo();
  await assert.rejects(service.submitPhoto({ checkpointId: '03', image: 'photo' }), /大会が終了/);
  const reset = await service.resetDemo();
  assert.equal(reset.points, 80);
  assert.equal(Date.parse(reset.endsAt), now + 3 * 60 * 60 * 1000);
});
