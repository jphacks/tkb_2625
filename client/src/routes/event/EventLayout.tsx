import { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useOutletContext } from 'react-router-dom';
import { Compass, Flag, Sprout, X } from 'lucide-react';
import type { AtUriString } from '@atproto/lex';
import ParticipantNav from '../../components/ParticipantNav';
import Countdown, { useExpired } from '../../components/Countdown';
import { useCheckpoints, useEvent, useSubmissions } from '../../hooks/useRogainingQuery';
import { useEventUri } from '../../lib/eventUri';
import { useLexClient } from '../../lib/lexClient';
import { cn } from '../../lib/cn';
import { button, buttonPrimary, empty, errorPanel, eyebrow, iconButton, liveDot, mainContainer, notice as noticeClass } from '../../lib/ui';
import { HeaderLabel, SiteFooter, SiteHeader, SkipLink } from '../../components/SiteChrome';
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

  if (event.loading || checkpoints.loading) return <main className={empty} role="status"><Compass size={32}/><p>大会データを読み込んでいます…</p></main>;
  if (!event.data || !checkpoints.data) return <main className={empty}><h1>大会データを取得できませんでした</h1><p role="alert">{event.error || checkpoints.error}</p><div className="flex flex-wrap gap-2.5"><button className={buttonPrimary} onClick={() => { if (event.error) event.retry(); if (checkpoints.error) checkpoints.retry(); }}>再試行する</button><Link className={button} to="/events">イベント一覧へ</Link></div></main>;

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

  return <div>
    <SkipLink target="main"/>
    <SiteHeader to="/events" label="ROAM イベント一覧">
      <HeaderLabel className="flex items-center gap-[9px] text-ink max-sm:gap-1.5 max-xs:hidden"><span className={cn(liveDot, !(started && !ended) && 'bg-[#b4b5a3]')}/> {eventName(event.data.event)} {Number.isFinite(startsAt) && <span className="border-l border-line pl-4 text-muted max-md:hidden">{eventDate(startsAt)}</span>}</HeaderLabel>
    </SiteHeader>

    <div className="mx-auto grid max-w-[1160px] grid-cols-[1fr_245px_220px] items-center gap-[30px] p-8 max-md:grid-cols-[1fr_190px_170px] max-md:gap-[15px] max-sm:grid-cols-2 max-sm:gap-x-0 max-sm:gap-y-[22px] max-sm:px-[18px] max-sm:pt-6 max-sm:pb-[21px]">
      <div className="max-sm:col-span-full"><span className={eyebrow}>{team ? 'YOUR TEAM' : 'NO TEAM'}</span><h1 className="mt-2 mb-2.5 flex items-center gap-[15px] text-[26px] font-semibold tracking-[2px] max-sm:mb-2 max-sm:text-2xl">{team ? teamName(team) : 'チーム未所属'}<Sprout size={22}/></h1><span className="text-[11px] tracking-[.6px] text-muted max-sm:text-[10px]">{team ? team.members.map(profileName).join('・') : 'チームに登録されると写真を提出できます。'}</span></div>
      {record && <Countdown endsAt={record.endsAt} startsAt={record.startsAt}/>}
      <div className="border-l border-line pl-[35px] max-md:pl-5 max-sm:pl-6"><span className="flex items-center gap-[7px] text-[11px] tracking-[1px] text-[#737d6b] max-sm:text-[10px]"><Flag size={14}/> 獲得ポイント</span><strong className="block text-[38px] leading-[1.45] font-medium tracking-[1.5px] tabular-nums max-md:text-[34px] max-sm:text-[30px] max-sm:leading-[1.5]">{derived.points}<small className="ml-[9px] text-[15px] font-normal tracking-[0] max-sm:text-xs">pt</small></strong><span className="text-[10px] text-muted max-sm:text-[8px]">{derived.count} / {scored} チェックポイント達成</span></div>
    </div>

    <ParticipantNav/>

    <main id="main" className={mainContainer}>
      {notice && <div className={noticeClass} role="status">{notice}<button className={iconButton} aria-label="通知を閉じる" onClick={() => setNotice('')}><X size={18}/></button></div>}
      {submissions.error && !fetched && <div className={errorPanel} role="alert"><p>提出状況を取得できませんでした。{submissions.error}</p><button className={button} onClick={submissions.retry}>再試行する</button></div>}
      <Outlet context={context}/>
    </main>
    <SiteFooter><span>主催：{eventOrganizer(event.data.event)}</span></SiteFooter>
  </div>;
}
