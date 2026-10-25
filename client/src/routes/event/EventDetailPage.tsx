import { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminMap from '../../components/AdminMap';
import { useEventContext } from './EventLayout';
import { eventDate, eventDates, eventName, eventOrganizer } from '../../lib/eventPresentation';
import { checkpointIsGoal, checkpointLocation, checkpointName, checkpointNumber, checkpointPoint } from '../../lib/rogaining';
import { eventPath } from '../../lib/eventUri';
import { button, empty } from '../../lib/ui';

export default function EventDetailPage() {
  const { uri, event, checkpoints } = useEventContext();
  const [focus, setFocus] = useState<[number, number] | null>(null);
  const dates = eventDates(event);
  const description = typeof event.record.description === 'string' ? event.record.description.trim() : '';
  return <>
    <section aria-labelledby="event-title" className="mb-8 [overflow-wrap:anywhere]">
      <h1 id="event-title" className="mb-5 text-2xl font-medium">{eventName(event)}</h1>
      <dl className="grid gap-4 text-sm">
        <div><dt className="mb-1 text-muted">開催期間（日本時間）</dt><dd>{dates ? <><time dateTime={new Date(dates.start).toISOString()}>{eventDate(dates.start)}</time> 〜 <time dateTime={new Date(dates.end).toISOString()}>{eventDate(dates.end)}</time></> : '開催期間が設定されていません。'}</dd></div>
        <div><dt className="mb-1 text-muted">主催者</dt><dd>{eventOrganizer(event)}</dd></div>
        <div><dt className="mb-1 text-muted">説明</dt><dd className="whitespace-pre-wrap leading-loose">{description || '説明はまだありません。'}</dd></div>
      </dl>
      <div className="mt-5 flex flex-wrap gap-3"><Link className={button} to={eventPath(uri, 'cards')}>チェックポイントのカードを見る</Link><Link className={button} to={eventPath(uri, 'team')}>チームを見る</Link></div>
    </section>
    <section aria-labelledby="checkpoints-title">
      <h2 id="checkpoints-title" className="mb-4 text-xl font-medium">チェックポイント <small className="text-sm text-muted">{checkpoints.length}件</small></h2>
      {!checkpoints.length ? <p className={empty}>チェックポイントはまだありません。</p> : <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-5 max-md:grid-cols-1">
        <AdminMap checkpoints={checkpoints} focus={focus}/>
        <ul className="min-w-0 divide-y divide-line border border-line">{checkpoints.map((cp, i) => {
          const location = checkpointLocation(cp);
          return <li key={cp.uri} className="p-4 [overflow-wrap:anywhere]">
            <div className="flex items-start justify-between gap-3"><h3 className="font-medium">{checkpointIsGoal(cp) ? 'GOAL' : `CP ${checkpointNumber(i)}`} · {checkpointName(cp)}</h3><span className="shrink-0 text-olive">{checkpointPoint(cp)} pt</span></div>
            {location ? <button className={`${button} mt-3`} onClick={() => setFocus([location.lat, location.lng])} aria-label={`${checkpointName(cp)}を地図で見る`}>地図で見る</button> : <p className="mt-2 text-xs text-muted">位置情報なし</p>}
          </li>;
        })}</ul>
      </div>}
    </section>
  </>;
}
