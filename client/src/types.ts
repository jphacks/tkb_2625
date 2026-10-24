export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type CheckpointStatus = SubmissionStatus | 'unsubmitted';
export interface Checkpoint {
  id: string;
  name: string;
  area: string;
  points: number;
  kind: string;
  lat: number;
  lng: number;
  description: string;
  image: string;
}
export interface Submission {
  id: string;
  checkpointId: string;
  status: SubmissionStatus;
  reason: string;
  image: string;
  submittedAt: string;
}
export interface DemoState {
  version: number;
  endsAt: string;
  submissions: Submission[];
}
export interface Snapshot extends DemoState {
  team: { name: string; number: string; members: string[] };
  checkpoints: Checkpoint[];
  points: number;
}
export interface DemoRepository {
  load(): { state: DemoState; warning: string } | Promise<{ state: DemoState; warning: string }>;
  save(state: DemoState): unknown;
}
export interface CommandPayloads {
  submitPhoto: { checkpointId: string; image: string };
  reviewSubmission: { id: string; decision: SubmissionStatus; reason?: string };
  endDemo: undefined;
  resetDemo: undefined;
}
export type CommandArguments = {
  [K in keyof CommandPayloads]: CommandPayloads[K] extends undefined
    ? [method: K]
    : [method: K, payload: CommandPayloads[K]]
}[keyof CommandPayloads];
export type Execute = (...args: CommandArguments) => Promise<Snapshot>;
