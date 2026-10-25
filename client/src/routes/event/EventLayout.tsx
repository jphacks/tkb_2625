import { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useOutletContext } from 'react-router-dom';
import { ChevronLeft, Compass, X } from 'lucide-react';
import type { AtUriString } from '@atproto/lex';
import ParticipantNav from '../../components/ParticipantNav';
import Countdown, { useExpired } from '../../components/Countdown';
import { useCheckpoints, useEvent, useSubmissions } from '../../hooks/useRogainingQuery';
import { adminEventPath, useEventUri } from '../../lib/eventUri';
import { useLexClient } from '../../lib/lexClient';
import { cn } from '../../lib/cn';
import { button, buttonPrimary, empty, errorPanel, iconButton, liveDot, mainContainer, notice as noticeClass } from '../../lib/ui';
import { SiteFooter, SiteHeader, SkipLink } from '../../components/SiteChrome';
import { eventDate, eventName, eventOrganizer } from '../../lib/eventPresentation';
import { approvedPoints, checkpointIsGoal, checkpointStatus, eventRecord, findTeamOf, latestSubmissionByCheckpoint, profileName, submissionCreatedAt, teamName, type CheckpointStatus } from '../../lib/rogaining';
import type { CheckpointView, EventView, SubmissionView, TeamView } from '../../lexicons/win/tomo-x/rogaining/defs';

export type EventContext = {
  uri: AtUriString;
  event: EventView;
  /** イベントの全チーム */
  teams: TeamView[];
  /** ログイン中ユーザーが所属するチーム。未所属なら undefined */
  team: TeamView | undefined;
  /** 作成順のチェックポイント */
  checkpoints: CheckpointView[];
  /** 自分のチームの提出 (新しい順)。送信直後でまだ appview に反映されていないものも含む */
  submissions: SubmissionView[];
  /** チェックポイント URI → 最新の提出 */
  latest: Map<string, SubmissionView>;
  /** 最新の提出による状態。ゴールは審査されないので、提出済みなら approved として扱う */
  statusOf: (checkpoint: CheckpointView) => CheckpointStatus;
  points: number;
  approvedCount: number;
  started: boolean;
  ended: boolean;
  /** チームに所属していて開催中なら提出できる */
  canSubmit: boolean;
  submissionsState: { loading: boolean; error?: string; updatedAt?: string; refresh: () => void };
  /** 作成した提出を appview に反映されるまで手元で表示し、反映を待って再取得する */
  addSubmission: (submission: SubmissionView) => void;
  notify: (message: string) => void;
};

/** EventLayout 配下のページでイベントのデータを受け取る */
export function useEventContext() {
  return useOutletContext<EventContext>();
}

const POLL_INTERVAL = 2000, POLL_LIMIT = 60000;

export default function EventLayout() {
  const uri = useEventUri();
  const client = useLexClient();
  const event = useEvent(uri);
  const checkpoints = useCheckpoints(uri);
  const submissions = useSubmissions(uri);
  // 再取得中も直前のデータを表示し続ける
  const [kept, setKept] = useState<SubmissionView[]>();
  if (submissions.data && submissions.data !== kept) setKept(submissions.data);
  const fetched = submissions.data ?? kept;
  const [local, setLocal] = useState<{ view: SubmissionView; addedAt: number }[]>([]);
  const [notice, setNotice] = useState('');
  const record = event.data ? eventRecord(event.data.event) : undefined;
  const started = useExpired(record?.startsAt || '9999-12-31T00:00:00.000Z');
  const ended = useExpired(record?.endsAt || '9999-12-31T00:00:00.000Z');
  const team = event.data ? findTeamOf(event.data.teams, client.did) : undefined;

  const derived = useMemo(() => {
    const unindexed = local.filter(({ view }) => !fetched?.some(s => s.uri === view.uri));
    const own = [...(fetched ?? []).filter(s => team && s.team === team.uri), ...unindexed.map(({ view }) => view)]
      .sort((a, b) => Date.parse(submissionCreatedAt(b)) - Date.parse(submissionCreatedAt(a)));
    const latest = latestSubmissionByCheckpoint(own);
    return { own, latest, waiting: unindexed.some(({ addedAt }) => Date.now() - addedAt < POLL_LIMIT), ...approvedPoints(checkpoints.data ?? [], own) };
  }, [fetched, local, team, checkpoints.data]);
  // 作成したレコードが appview に取り込まれるまで再取得を繰り返す
  const retrySubmissions = submissions.retry;
  useEffect(() => {
    if (!derived.waiting || submissions.loading) return;
    const timer = setTimeout(retrySubmissions, POLL_INTERVAL);
    return () => clearTimeout(timer);
  }, [derived.waiting, submissions.loading, submissions.updatedAt]); // retry は毎回作り直される関数なので依存に含めない

  if (event.loading || checkpoints.loading) return <main className={empty} role="status"><Compass size={20}/><p>読み込み中…</p></main>;
  if (!event.data || !checkpoints.data) return <main className={empty}><h1>大会データを取得できませんでした</h1><p role="alert">{event.error || checkpoints.error}</p><div className="flex flex-wrap gap-2"><button className={buttonPrimary} onClick={() => { if (event.error) event.retry(); if (checkpoints.error) checkpoints.retry(); }}>再試行</button><Link className={button} to="/events">イベント一覧へ</Link></div></main>;

  const context: EventContext = {
    uri, event: event.data.event, teams: event.data.teams, team, checkpoints: checkpoints.data,
    submissions: derived.own, latest: derived.latest, statusOf: cp => checkpointIsGoal(cp) && derived.latest.has(cp.uri) ? 'approved' : checkpointStatus(derived.latest, cp),
    points: derived.points, approvedCount: derived.count, started, ended, canSubmit: Boolean(team) && started && !ended,
    submissionsState: { loading: submissions.loading, error: submissions.error, updatedAt: submissions.updatedAt, refresh: submissions.retry },
    addSubmission: view => setLocal(previous => [...previous, { view, addedAt: Date.now() }]),
    notify: setNotice,
  };
  const scored = checkpoints.data.filter(cp => !checkpointIsGoal(cp)).length;
  const startsAt = Date.parse(record?.startsAt ?? '');

  const live = started && !ended;
  const organizer = eventOrganizer(event.data.event);

  return <div>
    <SkipLink target="main"/>
    <SiteHeader to="/events">
      <Link to="/events" className={cn(iconButton, '-mx-2 hover:not-disabled:bg-bg/15')} aria-label="イベント一覧" title="イベント一覧"><ChevronLeft size={18}/></Link>
      <span className="flex min-w-0 items-center gap-2 text-[13px] font-bold">{live && <><span className={cn(liveDot, 'bg-bg')} aria-hidden="true"/><span className="sr-only">開催中</span></>}<span className="truncate">{eventName(event.data.event)}</span></span>
      <span className="truncate text-[11px] text-bg/70 max-md:hidden">{Number.isFinite(startsAt) && `${eventDate(startsAt)} · `}主催 {organizer}</span>
    </SiteHeader>

    <div className="border-b border-fg/10">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-4 gap-y-0.5 px-4 py-1.5 max-sm:px-3">
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          {team ? <><strong className="shrink-0 text-[14px] font-bold">{teamName(team)}</strong><span className="truncate text-[11px] text-fg/60 max-sm:hidden">{team.members.map(profileName).join('・')}</span></> : <span className="text-[13px] text-fg/60">チーム未所属</span>}
        </div>
        {record && <div className="[&_strong]:text-[15px] [&>div]:flex-row [&>div]:items-baseline [&>div]:gap-1.5">
          <Countdown endsAt={record.endsAt} startsAt={record.startsAt}/>
        </div>}
        <div className="flex items-baseline gap-2 tabular-nums">
          <strong className="text-[15px] font-bold text-accent"><span className="sr-only">獲得ポイント </span>{derived.points}<small className="ml-0.5 text-[11px]">pt</small></strong>
          <span className="text-[11px] text-fg/60"><span className="sr-only">達成チェックポイント </span>{derived.count}/{scored}</span>
        </div>
      </div>
    </div>

    <ParticipantNav uri={uri}/>

    <main id="main" className={mainContainer}>
      {notice && <div className={noticeClass} role="status">{notice}<button className={cn(iconButton, 'hover:not-disabled:bg-bg/15')} aria-label="通知を閉じる" onClick={() => setNotice('')}><X size={18}/></button></div>}
      {submissions.error && !fetched && <div className={errorPanel} role="alert"><p>提出状況を取得できませんでした。{submissions.error}</p><button className={button} onClick={submissions.retry}>再試行</button></div>}
      <Outlet context={context}/>
    </main>
    <SiteFooter to={event.data.event.author.did === client.did ? adminEventPath(uri) : '/admin'}>主催者画面</SiteFooter>
  </div>;
}
