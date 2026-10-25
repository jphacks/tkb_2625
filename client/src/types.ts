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
  teamId: string;
  checkpointId: string;
  status: SubmissionStatus;
  reason: string;
  image: string;
  submittedAt: string;
  location: { lat: number; lon: number };
}
export interface DemoState {
  version: number;
  endsAt: string;
  submissions: Submission[];
  teams: Team[];
  participants: Participant[];
  checkpoints: Checkpoint[];
  selectedTeamId: string | null;
}
export interface Team {
  id: string;
  number: string;
  name: string;
  position: { lat: number; lng: number; updatedAt: string } | null;
  demoRoute: [number, number][];
}
export interface Participant { id: string; name: string; teamId: string | null }
export interface TeamView extends Team { members: string[]; points: number; rank: number }
export interface Snapshot extends DemoState {
  team: TeamView;
  teams: TeamView[];
  allSubmissions: Submission[];
  points: number;
}
export interface DemoRepository {
  load(): { state: DemoState; warning: string } | Promise<{ state: DemoState; warning: string }>;
  save(state: DemoState): void | DemoState | Promise<void | DemoState>;
}
export interface CommandPayloads {
  submitPhoto: { checkpointId: string; image: string; location: { lat: number; lon: number }; createdAt: string };
  reviewSubmission: { id: string; decision: SubmissionStatus; reason?: string };
  endDemo: undefined;
  resetDemo: undefined;
  addTeam: { name: string; number: string };
  deleteTeam: { id: string };
  assignParticipant: { participantId: string; teamId: string | null };
  addCheckpoint: Omit<Checkpoint, 'kind'>;
  deleteCheckpoint: { id: string };
  selectTeam: { id: string };
}
export type CommandArguments = {
  [K in keyof CommandPayloads]: CommandPayloads[K] extends undefined
    ? [method: K]
    : [method: K, payload: CommandPayloads[K]]
}[keyof CommandPayloads];
export type Execute = (...args: CommandArguments) => Promise<Snapshot>;
