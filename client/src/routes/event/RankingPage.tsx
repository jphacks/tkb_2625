import RankingBoard from '../../components/RankingBoard';
import { useEventContext } from './EventLayout';

export default function RankingPage() {
  return <RankingBoard uri={useEventContext().uri}/>;
}
