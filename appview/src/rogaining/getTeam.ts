import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { teamsTable } from "../db/schema.js";
import type { ServiceAuth } from "../auth.js";
import type { AppviewEnv } from "../env.js";
import type { Server } from "../lexicons/index.js";
import { findEvent, loadEventTeams, toTeamView } from "./views.js";

export default function getTeam(server: Server<AppviewEnv>, auth: ServiceAuth) {
  server.win.tomoX.rogaining.getTeam({
    auth,
    handler: async ({ params }) => {
      const [team] = await db.select().from(teamsTable).where(eq(teamsTable.uri, params.team)).limit(1);
      // イベントの作成者以外が作ったチームは無効
      const event = team && (await findEvent(team.eventUri));
      if (!team || !event || event.authorDid !== team.authorDid) {
        return { status: 404, error: "TeamNotFound" };
      }

      const { membersOf } = await loadEventTeams(event);
      return {
        encoding: "application/json",
        body: { team: await toTeamView(team, membersOf.get(team.uri) ?? []) },
      };
    },
  });
}
