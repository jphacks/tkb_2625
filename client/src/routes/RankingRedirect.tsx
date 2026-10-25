import { Navigate, useSearchParams } from 'react-router-dom';
import { eventPath } from '../lib/eventUri';
import { r } from '../lib/lex';

/** 旧 URL `/ranking?event=<at-uri>` を大会画面のランキングタブへ転送する */
export default function RankingRedirect() {
  const event = useSearchParams()[0].get('event');
  const valid = event?.match(/^at:\/\/[^/]+\/([^/]+)\/[^/]+$/)?.[1] === r.event.$type;
  return <Navigate to={valid ? eventPath(event!, 'ranking') : '/events'} replace />;
}
