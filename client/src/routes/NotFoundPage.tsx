import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buttonPrimary, empty } from '../lib/ui';

export default function NotFoundPage() {
  return <main className={empty}><Compass/><h2>道に迷いましたか？</h2><Link to="/events" className={buttonPrimary}>イベント一覧へ戻る</Link></main>;
}
