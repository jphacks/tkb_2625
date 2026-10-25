import { Link } from 'react-router-dom';
import { buttonPrimary, empty } from '../lib/ui';

export default function NotFoundPage() {
  return <main className={empty}><h2>ページが見つかりません</h2><Link to="/events" className={buttonPrimary}>イベント一覧へ</Link></main>;
}
