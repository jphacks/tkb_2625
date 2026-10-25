import { Link } from 'react-router-dom';
import { ArrowUpRight, Plus } from 'lucide-react';
import OrganizerShell from '../../components/OrganizerShell';
import { useMe } from '../../hooks/useRogainingQuery';
import { eventDate, eventDates, eventName, eventStatus } from '../../lib/eventPresentation';
import { adminEventPath } from '../../lib/eventUri';
import { profileName } from '../../lib/rogaining';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/cn';
import { button, buttonPrimary, empty, errorPanel, eyebrow, mainContainer } from '../../lib/ui';

const linkButton = 'text-[11px] text-[#647253] underline';
const createButton = cn(buttonPrimary, 'max-sm:p-2.5 max-sm:text-[10px] max-sm:whitespace-nowrap');
const cell = 'border-b border-line px-[22px] py-5 text-xs leading-[1.8] group-last:border-b-0 max-sm:px-4 max-sm:py-[15px]';
const headCell = cn(cell, 'bg-[#eaecdf] text-[10px] font-medium tracking-[.5px] text-[#69785a]');

export default function AdminHomePage() {
  const { data, error, loading, updatedAt, retry } = useMe();
  const events = data?.organizing ?? [];
  const now = Date.now();
  return <OrganizerShell><main id="main" className={cn(mainContainer, 'pt-[5px] xl:pt-[5px] max-sm:pt-[5px]')}>
    <div className="mb-6 flex items-center justify-between gap-6 max-sm:items-start max-sm:gap-3.5"><div><span className={cn(eyebrow, 'max-sm:text-[7px] max-sm:tracking-[1px]')}>ORGANIZER / EVENT OPERATIONS</span><h2 className="my-2.5 font-mincho text-[32px] font-medium tracking-[3px] max-sm:text-[27px]">大会管理</h2><p className="text-xs leading-[1.8] text-muted max-sm:text-[10px]">チームの一歩も、新しい発見も。大会のいまを、ここから。</p></div><Link className={createButton} to="/admin/events/new"><Plus size={17}/>イベントを作成</Link></div>
    <div className="mt-7 mb-5"><h3 className="text-xl font-medium tracking-[1px] max-sm:text-lg">主催しているイベント {data && <small className="text-xs font-normal text-muted">{events.length}件</small>}</h3><p className="mt-[9px] text-[11px] leading-[1.9] text-muted max-sm:text-[10px]">ログイン中のアカウントが作成したイベントです。{updatedAt && ` 最終更新 ${formatDate(updatedAt)}`}</p></div>
    {loading && <div className={empty} role="status">イベントを読み込んでいます…</div>}
    {error && <div className={errorPanel} role="alert">{error} <button className={linkButton} onClick={retry}>再試行する</button></div>}
    {data && !events.length && <div className={empty}><h3>主催しているイベントはまだありません</h3><p>イベントを作成すると、CP・チームの登録や写真審査ができるようになります。</p><Link className={buttonPrimary} to="/admin/events/new"><Plus size={17}/>イベントを作成</Link></div>}
    {events.length > 0 && <div className="overflow-x-auto border border-line bg-[#fcfbf6]"><table className="w-full min-w-[580px] border-collapse text-left max-sm:min-w-[560px]"><caption className="sr-only">主催しているイベント</caption><thead><tr><th scope="col" className={headCell}>イベント</th><th scope="col" className={headCell}>日程</th><th scope="col" className={headCell}>状態</th><th scope="col" className={headCell}>チーム / 参加者 / CP</th><th scope="col" className={cn(headCell, 'text-right')}><span className="sr-only">操作</span></th></tr></thead><tbody>
      {events.map(event => { const dates = eventDates(event); return <tr key={event.uri} className="group">
        <th scope="row" className={cn(cell, 'min-w-[190px] text-[15px] font-medium')}><small className="mb-1 block text-[8px] font-normal tracking-[1.7px] text-muted">承認者 {event.approver ? profileName(event.approver) : '未設定'}</small><Link to={adminEventPath(event.uri)}>{eventName(event)}</Link></th>
        <td className={cell}>{dates ? <>{eventDate(dates.start)}<br />〜 {eventDate(dates.end)}</> : '日程未確認'}</td>
        <td className={cell}>{eventStatus(event, now).label}</td>
        <td className={cell}>{event.teamCount ?? 0}組 / {event.participantCount ?? 0}名 / {event.checkpointCount ?? 0}件</td>
        <td className={cell}><Link className={button} to={adminEventPath(event.uri)}>管理する<ArrowUpRight size={14}/></Link></td>
      </tr>; })}
    </tbody></table></div>}
    <p className="my-[15px] text-[10px] leading-[1.9] text-muted">承認者として指定されたイベントは一覧に表示されません。主催者から管理画面のURLを共有してもらってください。</p>
  </main></OrganizerShell>;
}
