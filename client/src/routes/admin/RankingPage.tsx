import RankingBoard from '../../components/RankingBoard';
import { useAdminEventContext } from './adminEventContext';

export default function RankingPage() {
  return <RankingBoard uri={useAdminEventContext().uri}/>;
}
