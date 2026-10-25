import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import OrganizerShell from '../../components/OrganizerShell';
import { useMe } from '../../hooks/useRogainingQuery';
import { eventDate, eventDates, eventName, eventStatus } from '../../lib/eventPresentation';
import { adminEventPath } from '../../lib/eventUri';
import { profileName } from '../../lib/rogaining';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/cn';
import { buttonPrimary, empty, errorPanel, mainContainer, table, textButton } from '../../lib/ui';

export default function AdminHomePage() {
  const { data, error, loading, updatedAt, retry } = useMe();
  const events = data?.organizing ?? [];
  const now = Date.now();
  return <OrganizerShell><main id="main" className={mainContainer}>
    <div className="mb-3 flex items-center justify-between gap-3">
      <h1 className="flex items-center gap-2 text-[15px] font-bold">主催イベント{data && <small className="text-xs font-normal text-fg/60">{events.length}件</small>}{updatedAt && <small className="text-[11px] font-normal text-fg/60 max-sm:hidden">更新 {formatDate(updatedAt)}</small>}</h1>
      <Link className={buttonPrimary} to="/admin/events/new"><Plus size={16}/>イベントを作成</Link>
    </div>
    {loading && <div className={empty} role="status">読み込み中…</div>}
    {error && <div className={errorPanel} role="alert">{error} <button className={textButton} onClick={retry}>再試行</button></div>}
    {data && !events.length && <div className={empty}><h2>主催しているイベントはまだありません</h2><Link className={buttonPrimary} to="/admin/events/new"><Plus size={16}/>イベントを作成</Link></div>}
    {events.length > 0 && <div className="overflow-x-auto"><table className={cn(table, 'min-w-[560px]')}><caption className="sr-only">主催しているイベント</caption><thead><tr><th scope="col">イベント</th><th scope="col">日程</th><th scope="col">状態</th><th scope="col">承認者</th><th scope="col" className="text-right">チーム / 参加者 / CP</th></tr></thead><tbody>
      {events.map(event => { const dates = eventDates(event); return <tr key={event.uri} className="hover:bg-fg/5">
        <th scope="row" className="!border-fg/10 !text-[13px] !text-fg"><Link className="font-bold text-accent hover:underline" to={adminEventPath(event.uri)}>{eventName(event)}</Link></th>
        <td className="whitespace-nowrap">{dates ? `${eventDate(dates.start)} 〜 ${eventDate(dates.end)}` : '日程未確認'}</td>
        <td className="whitespace-nowrap">{eventStatus(event, now).label}</td>
        <td>{event.approver ? profileName(event.approver) : '未設定'}</td>
        <td className="text-right whitespace-nowrap">{event.teamCount ?? 0}組 / {event.participantCount ?? 0}名 / {event.checkpointCount ?? 0}件</td>
      </tr>; })}
    </tbody></table></div>}
  </main></OrganizerShell>;
}
