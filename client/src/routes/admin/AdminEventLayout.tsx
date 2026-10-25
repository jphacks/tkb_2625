import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowUpRight, Flag, ShieldCheck, Trophy, Users } from 'lucide-react';
import type { AtUriString } from '@atproto/lex';
import OrganizerShell from '../../components/OrganizerShell';
import { useCheckpoints, useEvent, useSubmissions } from '../../hooks/useRogainingQuery';
import { eventDate, eventDates, eventName, eventStatus } from '../../lib/eventPresentation';
import { eventPath, useEventUri } from '../../lib/eventUri';
import { useLexClient } from '../../lib/lexClient';
import { checkpointIsGoal, eventRecord, profileName, submissionCheckpointUri, submissionStatus } from '../../lib/rogaining';
import type { AdminEventContext, AdminEventResource } from './adminEventContext';
import { cn } from '../../lib/cn';
import { button, buttonPrimary, empty, errorPanel, eyebrow, mainContainer } from '../../lib/ui';

const errorBox = cn(errorPanel);
const emptyMain = cn(mainContainer, empty);
const metric = 'flex items-center gap-[15px] border-line p-[23px] max-[62.5rem]:gap-[9px] max-[62.5rem]:px-3.5 max-[62.5rem]:py-[18px] max-sm:py-[17px]';
const metricIcon = 'text-[#7b8966]';
const metricLabel = 'text-[10px] text-muted';
const metricValue = 'mt-1.5 block text-[29px] font-medium text-ink max-sm:text-[25px]';
const metricUnit = 'ml-2 text-[11px] font-normal';
const tab = 'flex min-h-[52px] items-center justify-center gap-2 border-b-[3px] border-transparent px-5 py-4 text-xs whitespace-nowrap text-muted max-[62.5rem]:px-[13px] max-[62.5rem]:py-3.5 max-sm:gap-[5px] max-sm:px-2.5 max-sm:py-[13px] max-sm:text-[10px] max-sm:[&>svg]:w-3.5';
const tabActive = 'border-olive bg-[#ebeede] text-olive';

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
  return <OrganizerShell><AdminEvent key={uri} uri={uri} /></OrganizerShell>;
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
    if (errors.length) return <main id="main" className={emptyMain}><h1 className="text-[2em] font-bold">イベントを取得できませんでした</h1><p role="alert">{errors[0]}</p><div className="mt-3.5 flex justify-end gap-2.5"><Link className={button} to="/admin">イベント一覧へ</Link><button className={buttonPrimary} onClick={() => retry('event', 'checkpoints', 'submissions')}>再試行する</button></div></main>;
    return <main id="main" className={emptyMain} role="status">イベントを読み込んでいます…</main>;
  }

  const { event, teams } = eventData;
  const record = eventRecord(event);
  const me = client.assertDid;
  const isAuthor = event.author.did === me;
  const isApprover = record.approver === me;
  const dates = eventDates(event);
  const status = eventStatus(event, Date.now());
  const participants = teams.reduce((sum, team) => sum + team.members.length, 0);
  // ゴールの提出は審査しない
  const goals = new Set(checkpoints.filter(checkpointIsGoal).map(cp => cp.uri));
  const pending = submissions.filter(s => submissionStatus(s) === 'pending' && !goals.has(submissionCheckpointUri(s) ?? '')).length;
  const context: AdminEventContext = { uri, event, teams, checkpoints, submissions, me, isAuthor, isApprover, retry, refresh };
  const tabs = [
    { to: 'review', label: '写真審査', icon: ShieldCheck },
    { to: 'checkpoints', label: 'CP管理', icon: Flag },
    { to: 'teams', label: 'チーム管理', icon: Users },
  ];

  return <main id="main" className={cn(mainContainer, 'pt-[5px] xl:pt-[5px] max-sm:pt-[5px]')}>
    <Link className="mb-[18px] inline-block text-xs text-[#6b765e] max-sm:mb-3" to="/admin">← 主催イベント一覧</Link>
    <div className="mb-6 flex items-center justify-between gap-6 max-sm:items-start max-sm:gap-3.5"><div><span className={cn(eyebrow, 'max-sm:text-[7px] max-sm:tracking-[1px]')}>ORGANIZER / EVENT OPERATIONS · {status.label}</span><h2 className="my-2.5 font-mincho text-[32px] font-medium tracking-[3px] max-sm:text-[27px]">{eventName(event)}</h2><p className="text-xs leading-[1.8] text-muted max-sm:text-[10px]">{dates ? `${eventDate(dates.start)} 〜 ${eventDate(dates.end)}` : '日程未確認'} · 主催 {profileName(event.author)} · 承認者 {event.approver ? profileName(event.approver) : record.approver}</p></div></div>
    {!isAuthor && !isApprover && <p className={errorBox} role="alert">ログイン中のアカウント（{me}）はこのイベントの主催者でも承認者でもありません。提出写真の閲覧・審査や、CP・チームの登録はできません。</p>}
    {errors.length > 0 && <p className={errorBox} role="alert">一部のデータを更新できませんでした：{errors[0]} <button className="bg-transparent text-[11px] text-[#647253] underline" onClick={() => retry('event', 'checkpoints', 'submissions')}>再試行</button></p>}
    <div className="my-6 grid grid-cols-4 border border-line bg-[#faf9f3] max-sm:my-[18px] max-sm:grid-cols-2">
      <div className={metric}><Users className={metricIcon} size={19}/><span className={metricLabel}>参加チーム<strong className={metricValue}>{teams.length}<small className={metricUnit}>組</small></strong></span></div>
      <div className={cn(metric, 'border-l')}><Users className={metricIcon} size={19}/><span className={metricLabel}>参加者<strong className={metricValue}>{participants}<small className={metricUnit}>名</small></strong></span></div>
      <div className={cn(metric, 'border-l max-sm:border-t max-sm:border-l-0')}><Flag className={metricIcon} size={19}/><span className={metricLabel}>チェックポイント<strong className={metricValue}>{checkpoints.length}<small className={metricUnit}>件</small></strong></span></div>
      <div className={cn(metric, 'border-l max-sm:border-t')}><ShieldCheck className={metricIcon} size={19}/><span className={metricLabel}>審査待ち<strong className={metricValue}>{pending}<small className={metricUnit}>件</small></strong></span></div>
    </div>
    <nav className="mb-[30px] flex gap-[5px] overflow-x-auto border-b border-line max-sm:mb-[22px] max-sm:gap-0" aria-label="管理者メニュー">
      {tabs.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => cn(tab, isActive && tabActive)}><Icon size={17}/>{label}</NavLink>)}
      <Link className={tab} to={`/ranking?event=${encodeURIComponent(uri)}`}><Trophy size={17}/>ランキング</Link>
      <Link className={tab} to={eventPath(uri)}><ArrowUpRight size={17}/>参加者画面</Link>
    </nav>
    <Outlet context={context} />
  </main>;
}
