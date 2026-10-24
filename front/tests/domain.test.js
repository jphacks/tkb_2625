import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkpoints, checkpointStatus, createInitialState, latestSubmission, reviewSubmission, selectCheckpoints, STATUSES, submitPhoto, totalPoints } from '../src/data.js';

const now = Date.parse('2026-10-24T10:00:00+09:00');
test('initial demo covers all states and retains rejected attempt before resubmission', () => {
  const state = createInitialState(now);
  assert.equal(totalPoints(state), 80);
  assert.deepEqual(new Set(checkpoints.map(c => checkpointStatus(state, c.id))), new Set(['approved', 'pending', 'rejected', 'unsubmitted']));
  assert.equal(state.submissions.filter(s => s.checkpointId === '05').length, 2);
  assert.equal(checkpointStatus(state, '05'), 'pending');
});
test('submit → reject → resubmit → approve retains history and awards exactly once', () => {
  let state = submitPhoto(createInitialState(now), '03', 'photo-1', now, 'attempt-1');
  assert.equal(checkpointStatus(state, '03'), 'pending');
  assert.throws(() => submitPhoto(state, '03', 'duplicate', now), /提出済み/);
  assert.throws(() => reviewSubmission(state, 'attempt-1', 'rejected', '  '), /理由/);
  state = reviewSubmission(state, 'attempt-1', 'rejected', '橋の全体を撮影してください');
  state = submitPhoto(state, '03', 'photo-2', now + 1000, 'attempt-2');
  state = reviewSubmission(state, 'attempt-2', 'approved');
  assert.equal(totalPoints(state), 120);
  assert.equal(state.submissions.filter(s => s.checkpointId === '03').length, 2);
  assert.equal(latestSubmission(state, '03').image, 'photo-2');
  assert.throws(() => reviewSubmission(state, 'attempt-2', 'approved'), /審査済み/);
  assert.throws(() => submitPhoto(state, '03', 'duplicate', now + 2000), /提出済み/);
  assert.equal(totalPoints(state), 120);
});
test('expiry boundary, missing images and invalid checkpoints are rejected', () => {
  const state = createInitialState(now);
  assert.throws(() => submitPhoto(state, '03', 'photo', Date.parse(state.endsAt)), /大会が終了/);
  assert.throws(() => submitPhoto(state, '03', '', now), /画像を選択/);
  assert.throws(() => submitPhoto(state, 'invalid', 'photo', now), /見つかりません/);
  assert.throws(() => reviewSubmission(state, 'missing', 'approved'), /存在しない/);
});
test('point total deduplicates approved checkpoints defensively', () => {
  const state = createInitialState(now);
  state.submissions.push({ ...state.submissions[0], id: 'duplicate-import' });
  assert.equal(totalPoints(state), 80);
});
test('filters and all sort orders preserve the source and order ties predictably', () => {
  const state = createInitialState(now);
  assert.deepEqual(selectCheckpoints(state, 'approved').map(c => c.id), ['01', '02']);
  assert.deepEqual(selectCheckpoints(state, 'rejected').map(c => c.id), ['04']);
  for (const sort of ['points-desc', 'points-asc', 'name', 'status']) {
    const selected = selectCheckpoints(state, 'all', sort);
    for (let i = 1; i < selected.length; i++) {
      const [a, b] = [selected[i - 1], selected[i]];
      if (sort === 'points-desc') assert.ok(a.points >= b.points);
      if (sort === 'points-asc') assert.ok(a.points <= b.points);
      if (sort === 'name') assert.ok(a.name.localeCompare(b.name, 'ja') <= 0);
      if (sort === 'status') assert.ok(STATUSES[checkpointStatus(state, a.id)].rank <= STATUSES[checkpointStatus(state, b.id)].rank);
    }
  }
  assert.equal(checkpoints[0].id, '01');
});
