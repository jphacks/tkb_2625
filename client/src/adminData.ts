import type { CommandPayloads, DemoState } from './types';
import { createId, normalizeNumber } from './utils';

export function addTeam(state: DemoState, draft: CommandPayloads['addTeam']): DemoState {
  const name = draft.name.trim();
  const number = draft.number.trim();
  if (!name || name.length > 60) throw new Error('チーム名を60文字以内で入力してください。');
  if (!/^\d{1,4}$/.test(number) || Number(number) < 1) throw new Error('チーム番号は1〜9999で入力してください。');
  if (state.teams.some(t => Number(t.number) === Number(number))) throw new Error('このチーム番号は使用されています。');
  const id = createId();
  return { ...state, selectedTeamId: state.selectedTeamId || id, teams: [...state.teams, { id, name, number: normalizeNumber(number, 3), position: null, demoRoute: [] }] };
}

export function deleteTeam(state: DemoState, id: string): DemoState {
  if (!state.teams.some(t => t.id === id)) throw new Error('チームが見つかりません。');
  const teams = state.teams.filter(t => t.id !== id);
  return {
    ...state, teams,
    selectedTeamId: state.selectedTeamId === id ? teams[0]?.id || null : state.selectedTeamId,
    participants: state.participants.map(p => p.teamId === id ? { ...p, teamId: null } : p),
    submissions: state.submissions.filter(s => s.teamId !== id),
  };
}

export function assignParticipant(state: DemoState, { participantId, teamId }: CommandPayloads['assignParticipant']): DemoState {
  if (!state.participants.some(p => p.id === participantId)) throw new Error('参加者が見つかりません。');
  if (teamId !== null && !state.teams.some(t => t.id === teamId)) throw new Error('チームが見つかりません。');
  return { ...state, participants: state.participants.map(p => p.id === participantId ? { ...p, teamId } : p) };
}

export function addCheckpoint(state: DemoState, draft: CommandPayloads['addCheckpoint']): DemoState {
  if (!/^\d{1,4}$/.test(draft.id) || Number(draft.id) < 1) throw new Error('CP番号は1〜9999で入力してください。');
  if (state.checkpoints.some(cp => Number(cp.id) === Number(draft.id))) throw new Error('このCP番号は使用されています。');
  if (!draft.name.trim() || draft.name.trim().length > 60) throw new Error('CP名を60文字以内で入力してください。');
  if (!Number.isSafeInteger(draft.points) || draft.points < 0 || draft.points > 100000) throw new Error('配点は0〜100000の整数で入力してください。');
  if (!Number.isFinite(draft.lat) || Math.abs(draft.lat) > 90 || !Number.isFinite(draft.lng) || Math.abs(draft.lng) > 180) throw new Error('有効な緯度・経度を入力してください。');
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(draft.image)) throw new Error('見本写真を選択してください。');
  const checkpoint = { ...draft, id: normalizeNumber(draft.id), name: draft.name.trim(), area: draft.area.trim(), description: draft.description.trim(), kind: 'photo' };
  return { ...state, checkpoints: [...state.checkpoints, checkpoint] };
}

export function deleteCheckpoint(state: DemoState, id: string): DemoState {
  if (!state.checkpoints.some(cp => cp.id === id)) throw new Error('CPが見つかりません。');
  return { ...state, checkpoints: state.checkpoints.filter(cp => cp.id !== id), submissions: state.submissions.filter(s => s.checkpointId !== id) };
}

export function selectTeam(state: DemoState, id: string): DemoState {
  if (!state.teams.some(t => t.id === id)) throw new Error('チームが見つかりません。');
  return { ...state, selectedTeamId: id };
}
