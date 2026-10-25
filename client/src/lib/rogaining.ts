import type { ProfileViewBasic } from '../lexicons/app/bsky/actor/defs';
import type { CheckpointView, EventView, SubmissionView, TeamView } from '../lexicons/win/tomo-x/rogaining/defs';
import type * as Checkpoint from '../lexicons/win/tomo-x/rogaining/checkpoint';
import type * as Event from '../lexicons/win/tomo-x/rogaining/event';
import type * as Submit from '../lexicons/win/tomo-x/rogaining/submit';
import type * as Team from '../lexicons/win/tomo-x/rogaining/team';

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type CheckpointStatus = SubmissionStatus | 'unsubmitted';

/** 提出状況の表示名・記号・並び順 (rank が大きいほど進んでいる) */
export const STATUSES: Record<CheckpointStatus, { label: string; symbol: string; rank: number }> = {
  unsubmitted: { label: '未提出', symbol: '○', rank: 0 },
  pending: { label: '審査中', symbol: '◷', rank: 1 },
  rejected: { label: '不可', symbol: '!', rank: 2 },
  approved: { label: '可', symbol: '✓', rank: 3 },
};

// View の record は LexMap なので、各 lexicon の型として読む (appview で検証済み)
export const eventRecord = (view: EventView) => view.record as unknown as Event.Main;
export const checkpointRecord = (view: CheckpointView) => view.record as unknown as Checkpoint.Main;
export const teamRecord = (view: TeamView) => view.record as unknown as Team.Main;
export const submitRecord = (view: SubmissionView) => view.record as unknown as Submit.Main;

/** 未知の status は審査中として扱う */
export function submissionStatus(view: SubmissionView): CheckpointStatus {
  return view.status === 'approved' ? 'approved' : view.status === 'rejected' ? 'rejected' : 'pending';
}

export const checkpointName = (view: CheckpointView) => checkpointRecord(view).name || '名称未設定';
export const checkpointPoint = (view: CheckpointView) => checkpointRecord(view).point ?? 0;
/** 一覧の並び (作成順) に沿った 2 桁の番号 */
export const checkpointNumber = (index: number) => String(index + 1).padStart(2, '0');
export const checkpointIsGoal = (view: CheckpointView) => checkpointRecord(view).isGoal === true;
export const teamName = (view: TeamView) => teamRecord(view).name || '名称未設定のチーム';
/** appview が有効と判定したメンバー (先に作られたチームに所属済みの DID は除かれる) */
export const teamMemberDids = (view: TeamView): string[] => view.members.map(m => m.did);
export const findTeamOf = (teams: readonly TeamView[], did: string | undefined) => did ? teams.find(team => team.members.some(m => m.did === did)) : undefined;
export const profileName = (profile: Pick<ProfileViewBasic, 'did' | 'handle' | 'displayName'>) => profile.displayName?.trim() || (profile.handle && profile.handle !== 'handle.invalid' ? `@${profile.handle}` : profile.did);

function parseLocation(location: { latitude?: string; longitude?: string } | undefined): { lat: number; lng: number } | null {
  if (!location) return null;
  const lat = Number(location.latitude), lng = Number(location.longitude);
  return location.latitude && location.longitude && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}
export const checkpointLocation = (view: CheckpointView) => parseLocation(checkpointRecord(view).location);
export const submissionLocation = (view: SubmissionView) => parseLocation(submitRecord(view).location);
export const submissionCheckpointUri = (view: SubmissionView) => submitRecord(view).checkpoint?.uri;
export const submissionCreatedAt = (view: SubmissionView) => submitRecord(view).createdAt || view.indexedAt;

/** 座標を lexicon の location (文字列の10進度) にする */
export const toLocation = (lat: number, lng: number) => ({ latitude: lat.toFixed(6), longitude: lng.toFixed(6) });

/** チェックポイントごとの最新の提出 (createdAt が最も新しいもの) */
export function latestSubmissionByCheckpoint(submissions: readonly SubmissionView[]) {
  const latest = new Map<string, SubmissionView>();
  for (const submission of submissions) {
    const uri = submissionCheckpointUri(submission);
    if (!uri) continue;
    const current = latest.get(uri);
    if (!current || Date.parse(submissionCreatedAt(submission)) > Date.parse(submissionCreatedAt(current))) latest.set(uri, submission);
  }
  return latest;
}

/** 最新の提出から各チェックポイントの状態を求める */
export const checkpointStatus = (latest: Map<string, SubmissionView>, checkpoint: CheckpointView): CheckpointStatus => {
  const submission = latest.get(checkpoint.uri);
  return submission ? submissionStatus(submission) : 'unsubmitted';
};

/** 承認済みのチェックポイント (ゴール以外、重複なし) の得点合計。ゴールのタイムボーナスは含まない */
export function approvedPoints(checkpoints: readonly CheckpointView[], submissions: readonly SubmissionView[]) {
  const approved = new Set(submissions.filter(s => s.status === 'approved').map(submissionCheckpointUri));
  const counted = checkpoints.filter(cp => approved.has(cp.uri) && !checkpointIsGoal(cp));
  return { points: counted.reduce((sum, cp) => sum + checkpointPoint(cp), 0), count: counted.length };
}

/** チェックポイント群を囲む範囲 ([[south, west], [north, east]])。座標がなければ null */
export function checkpointBounds(checkpoints: readonly CheckpointView[]): [[number, number], [number, number]] | null {
  const points = checkpoints.map(checkpointLocation).filter(p => p !== null);
  if (!points.length) return null;
  const lats = points.map(p => p.lat), lngs = points.map(p => p.lng);
  return [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]];
}
