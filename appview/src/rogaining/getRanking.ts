import type { ServiceAuth } from "../auth.js";
import type { AppviewEnv } from "../env.js";
import type { RankingEntry } from "../lexicons/types/win/tomo-x/rogaining/defs.js";
import type { Server } from "../lexicons/index.js";
import { findSubmissions } from "./submissions.js";
import { findEvent, loadEventTeams, toTeamView } from "./views.js";

const goalTimePoints = [30, 20, 10, 5, 3, 2, 1];

export default function getRanking(server: Server<AppviewEnv>, auth: ServiceAuth) {
  server.win.tomoX.rogaining.getRanking({
    auth,
    handler: async ({ params }) => {
      const event = await findEvent(params.event);
      if (!event) {
        return { status: 404, error: "EventNotFound" };
      }

      const { teams, teamOf, membersOf } = await loadEventTeams(event);
      const { submissions } = await findSubmissions(event, [...teamOf.keys()]);

      // 同じチェックポイントはチームごとに1回だけ数え、ゴールは通常得点に含めない
      const pointsByTeam = new Map<string, Map<string, number>>(teams.map((team) => [team.uri, new Map()]));
      const goalTimeByTeam = new Map<string, Date>();
      for (const { submit, checkpoint, approval } of submissions) {
        const teamUri = teamOf.get(submit.authorDid)!.uri;
        if (checkpoint.isGoal) {
          const current = goalTimeByTeam.get(teamUri);
          if (!current || submit.indexedAt.getTime() < current.getTime()) {
            goalTimeByTeam.set(teamUri, submit.indexedAt);
          }
          continue;
        }
        if (!approval) continue;
        pointsByTeam.get(teamUri)!.set(submit.checkpointUri, checkpoint.point);
      }

      const timePointsByTeam = new Map<string, number>();
      const finishers = [...goalTimeByTeam.entries()].sort((a, b) => a[1].getTime() - b[1].getTime());
      let previousFinishTime: number | undefined;
      let currentRank = 0;
      for (let i = 0; i < finishers.length; i++) {
        const [teamUri, finishTime] = finishers[i]!;
        const finishTimeMs = finishTime.getTime();
        if (finishTimeMs !== previousFinishTime) currentRank = i + 1;
        timePointsByTeam.set(teamUri, goalTimePoints[currentRank - 1] ?? 0);
        previousFinishTime = finishTimeMs;
      }

      const totals = teams.map((team) => {
        const checkpoints = pointsByTeam.get(team.uri)!;
        const checkpointPoints = [...checkpoints.values()].reduce((sum, point) => sum + point, 0);
        const timePoints = timePointsByTeam.get(team.uri) ?? 0;
        return {
          team,
          totalPoints: checkpointPoints + timePoints,
          approvedCount: checkpoints.size,
        };
      });
      // 同点のときは承認数と作成順を保つ (sort は安定)
      totals.sort((a, b) => b.totalPoints - a.totalPoints || b.approvedCount - a.approvedCount);

      const ranking: RankingEntry[] = await Promise.all(
        totals.map(async (entry) => ({
          $type: "win.tomo-x.rogaining.defs#rankingEntry" as const,
          // 同点は同順位 (1, 1, 3, ...)
          rank: totals.findIndex((other) => other.totalPoints === entry.totalPoints) + 1,
          team: await toTeamView(entry.team, membersOf.get(entry.team.uri) ?? []),
          totalPoints: entry.totalPoints,
          approvedCount: entry.approvedCount,
        })),
      );

      return {
        encoding: "application/json",
        body: { ranking },
      };
    },
  });
}
