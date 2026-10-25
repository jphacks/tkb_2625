import type { ServiceAuth } from "../auth.js";
import type { AppviewEnv } from "../env.js";
import type { RankingEntry } from "../lexicons/types/win/tomo-x/rogaining/defs.js";
import type { Server } from "../lexicons/index.js";
import { findSubmissions } from "./submissions.js";
import { findEvent, loadEventTeams, toTeamView } from "./views.js";

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

      // 同じチェックポイントはチームごとに1回だけ数える
      const pointsByTeam = new Map<string, Map<string, number>>(teams.map((team) => [team.uri, new Map()]));
      for (const { submit, checkpoint, approval } of submissions) {
        if (!approval) continue;
        pointsByTeam.get(teamOf.get(submit.authorDid)!.uri)!.set(submit.checkpointUri, checkpoint.point);
      }

      const totals = teams.map((team) => {
        const checkpoints = pointsByTeam.get(team.uri)!;
        return {
          team,
          totalPoints: [...checkpoints.values()].reduce((sum, point) => sum + point, 0),
          approvedCount: checkpoints.size,
        };
      });
      // 同点のときは作成順を保つ (sort は安定)
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
