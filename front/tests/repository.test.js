import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { repository } from '../src/repository.js';
import { prepareImage } from '../src/images.js';
import { createInitialState } from '../src/data.js';

afterEach(() => { delete globalThis.localStorage; });
test('photo and event end time survive a storage round trip', () => {
  let value;
  globalThis.localStorage = { getItem: () => value, setItem: (_key, next) => { value = next; } };
  const state = createInitialState();
  repository.save(state);
  assert.deepEqual(repository.load(), { state, warning: '' });
});
test('corrupt or unknown checkpoint data falls back with a visible warning', () => {
  const state = createInitialState();
  state.submissions[0].checkpointId = 'unknown';
  globalThis.localStorage = { getItem: () => JSON.stringify(state) };
  assert.ok(repository.load().warning);
  globalThis.localStorage = { getItem: () => '{invalid' };
  assert.ok(repository.load().warning);
});
test('quota failure is reported instead of pretending to save', () => {
  globalThis.localStorage = { setItem: () => { throw new Error('quota'); } };
  assert.throws(() => repository.save(createInitialState()), /変更は反映されていません/);
});
test('invalid uploads are rejected before decoding', async () => {
  await assert.rejects(prepareImage(null), /画像を選択/);
  await assert.rejects(prepareImage({ type: 'image/svg+xml', size: 100 }), /JPEG/);
  await assert.rejects(prepareImage({ type: 'image/jpeg', size: 8 * 1024 * 1024 + 1 }), /8MB以下/);
});
