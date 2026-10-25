import { useOutletContext } from 'react-router-dom';
import type { AtUriString, DidString } from '@atproto/lex';
import type { CheckpointView, EventView, SubmissionView, TeamView } from '../../lexicons/win/tomo-x/rogaining/defs';

export type AdminEventResource = 'event' | 'checkpoints' | 'submissions';

/** AdminEventLayout が子ルートに渡すデータ */
export type AdminEventContext = {
  uri: AtUriString;
  event: EventView;
  teams: TeamView[];
  checkpoints: CheckpointView[];
  submissions: SubmissionView[];
  /** ログイン中の DID */
  me: DidString;
  /** イベントの作成者か (CP・チームを作成できるのは作成者だけ) */
  isAuthor: boolean;
  /** すぐに再取得する */
  retry: (...targets: AdminEventResource[]) => void;
  /** レコード作成後用。appview の反映待ちを考慮して、すぐと数秒後に再取得する */
  refresh: (...targets: AdminEventResource[]) => void;
};

export const useAdminEventContext = () => useOutletContext<AdminEventContext>();

/** at://{repo}/{collection}/{rkey} を分解する */
export function atUriParts(uri: string) {
  const [, , repo = '', collection = '', rkey = ''] = uri.split('/');
  return { repo, collection, rkey };
}
