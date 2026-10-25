import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import type { AtUriString } from '@atproto/lex';
import OrganizerShell from '../../components/OrganizerShell';
import { useCheckpoints, useEvent, useSubmissions } from '../../hooks/useRogainingQuery';
import { eventDate, eventDates, eventName, eventStatus } from '../../lib/eventPresentation';
import { eventPath, useEventUri } from '../../lib/eventUri';
import { useLexClient } from '../../lib/lexClient';
import { checkpointIsGoal, eventRecord, profileName, submissionCheckpointUri, submissionStatus } from '../../lib/rogaining';
import type { AdminEventContext, AdminEventResource } from './adminEventContext';
import { cn } from '../../lib/cn';
import { button, buttonPrimary, empty, errorPanel, mainContainer, textButton } from '../../lib/ui';

const errorBox = cn(errorPanel);
const emptyMain = cn(mainContainer, empty);
const tab = 'flex h-10 items-center justify-center border-b-2 border-transparent px-4 text-[13px] whitespace-nowrap text-fg/60 hover:text-fg max-sm:px-3';
const tabActive = 'border-accent font-bold text-accent hover:text-accent';

/** 再取得中も直前のデータを表示し続ける (子ルートのフォーム入力を失わないため) */
function useLastData<T>(data: T | undefined) {
  const [last, setLast] = useState(data);
  if (data !== undefined && data !== last) setLast(data);
  return data ?? last;
}

// appview は firehose 経由でレコードを取り込むので、作成直後は反映されていないことがある
const REFRESH_DELAYS = [1500, 4000];

export default function AdminEventLayout() {
  const uri = useEventUri();
  // 別のイベントに移ったら状態を作り直す
  return <OrganizerShell participant={eventPath(uri)}><AdminEvent key={uri} uri={uri} /></OrganizerShell>;
}

function AdminEvent({ uri }: { uri: AtUriString }) {
  const client = useLexClient();
  const eventQuery = useEvent(uri);
  const checkpointQuery = useCheckpoints(uri);
  const submissionQuery = useSubmissions(uri);
  const eventData = useLastData(eventQuery.data);
  const checkpoints = useLastData(checkpointQuery.data);
  const submissions = useLastData(submissionQuery.data);

  const retries = useRef<Record<AdminEventResource, () => void>>(null!);
  retries.current = { event: eventQuery.retry, checkpoints: checkpointQuery.retry, submissions: submissionQuery.retry };
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const retry = (...targets: AdminEventResource[]) => targets.forEach(target => retries.current[target]());
  const refresh = (...targets: AdminEventResource[]) => {
    retry(...targets);
    for (const delay of REFRESH_DELAYS) timers.current.push(window.setTimeout(() => retry(...targets), delay));
  };

  const errors = [eventQuery.error, checkpointQuery.error, submissionQuery.error].filter(Boolean);
  // 作成直後のイベントは appview に未反映で EventNotFound になりうるので、何度か待って再試行する
  const justCreated = (useLocation().state as { created?: boolean } | null)?.created === true;
  const [waits, setWaits] = useState(0);
  const waiting = justCreated && !eventData && errors.length > 0 && waits < 6;
  useEffect(() => {
    if (!waiting) return;
    const timer = window.setTimeout(() => { setWaits(n => n + 1); retries.current.event(); retries.current.checkpoints(); retries.current.submissions(); }, 1500);
    return () => clearTimeout(timer);
  }, [waiting, waits]);
  if (!eventData || !checkpoints || !submissions) {
    if (waiting) return <main id="main" className={emptyMain} role="status">作成したイベントの反映を待っています…</main>;
    if (errors.length) return <main id="main" className={emptyMain}><h1>イベントを取得できませんでした</h1><p role="alert">{errors[0]}</p><div className="mt-3.5 flex justify-end gap-2.5"><Link className={button} to="/admin">イベント一覧へ</Link><button className={buttonPrimary} onClick={() => retry('event', 'checkpoints', 'submissions')}>再試行する</button></div></main>;
    return <main id="main" className={emptyMain} role="status">イベントを読み込んでいます…</main>;
  }

  const { event, teams } = eventData;
  const record = eventRecord(event);
  const me = client.assertDid;
  const isAuthor = event.author.did === me;
  const dates = eventDates(event);
  const status = eventStatus(event, Date.now());
  const participants = teams.reduce((sum, team) => sum + team.members.length, 0);
  // ゴールの提出は審査しない
  const goals = new Set(checkpoints.filter(checkpointIsGoal).map(cp => cp.uri));
  const pending = submissions.filter(s => submissionStatus(s) === 'pending' && !goals.has(submissionCheckpointUri(s) ?? '')).length;
  const context: AdminEventContext = { uri, event, teams, checkpoints, submissions, me, isAuthor, retry, refresh };
  const tabs = [
    { to: 'review', label: '写真審査' },
    { to: 'checkpoints', label: 'CP管理' },
    { to: 'teams', label: 'チーム管理' },
    { to: 'ranking', label: 'ランキング' },
  ];

  const metrics = [
    { label: 'チーム', value: teams.length },
    { label: '参加者', value: participants },
    { label: 'CP', value: checkpoints.length },
    { label: '審査待ち', value: pending, alert: pending > 0 },
  ];

  return <main id="main" className={mainContainer}>
    <Link className="text-[11px] text-fg/60 hover:underline" to="/admin">← 主催イベント一覧</Link>
    <h1 className="mt-1 text-[15px] font-bold">{eventName(event)} <span className="ml-1 text-xs font-normal text-fg/60">{status.label}</span></h1>
    <p className="mt-0.5 text-[11px] text-fg/60">{dates ? `${eventDate(dates.start)} 〜 ${eventDate(dates.end)}` : '日程未確認'} · 主催 {profileName(event.author)} · 承認者 {event.approver ? profileName(event.approver) : record.approver}</p>
    <dl className="my-2 flex flex-wrap gap-x-4 gap-y-0.5 border-y border-fg/10 py-1.5 text-xs">
      {metrics.map(({ label, value, alert }) => <div key={label} className={cn('flex items-baseline gap-1', alert && 'text-accent')}><dt className={alert ? '' : 'text-fg/60'}>{label}</dt><dd className="font-bold">{value}</dd></div>)}
    </dl>
    {!isAuthor && <p className={errorBox} role="alert">このアカウント（{me}）は主催者ではないため操作できません</p>}
    {errors.length > 0 && <p className={errorBox} role="alert">一部のデータを更新できませんでした：{errors[0]} <button className={textButton} onClick={() => retry('event', 'checkpoints', 'submissions')}>再試行</button></p>}
    <nav className="mb-3 flex overflow-x-auto border-b border-fg/10" aria-label="管理者メニュー">
      {tabs.map(({ to, label }) => <NavLink key={to} to={to} className={({ isActive }) => cn(tab, isActive && tabActive)}>{label}</NavLink>)}
    </nav>
    <Outlet context={context} />
  </main>;
}
