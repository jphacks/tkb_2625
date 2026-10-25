import { desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { eventsTable, teamMembersTable } from "../db/schema.js";
import type { ServiceAuth } from "../auth.js";
import type { AppviewEnv } from "../env.js";
import type { Server } from "../lexicons/index.js";
import { loadEventTeams, toEventViews, toTeamView } from "./views.js";

export default function getMe(server: Server<AppviewEnv>, auth: ServiceAuth) {
  server.win.tomoX.rogaining.getMe({
    auth,
    handler: async ({ auth }) => {
      const me = auth.credentials.iss;

      const memberships = await db
        .selectDistinct({ eventUri: teamMembersTable.eventUri })
        .from(teamMembersTable)
        .where(eq(teamMembersTable.memberDid, me));
      const [joinedEvents, organizing] = await Promise.all([
        memberships.length === 0
          ? []
          : db
              .select()
              .from(eventsTable)
              .where(inArray(eventsTable.uri, memberships.map((row) => row.eventUri)))
              .orderBy(desc(eventsTable.startsAt), desc(eventsTable.uri)),
        db
          .select()
          .from(eventsTable)
          .where(eq(eventsTable.authorDid, me))
          .orderBy(desc(eventsTable.startsAt), desc(eventsTable.uri)),
      ]);

      // 無効なチーム (イベント作成者以外が作ったもの) や、後から作られたチームでの所属は除く
      const participating = (
        await Promise.all(
          joinedEvents.map(async (event) => {
            const { teamOf, membersOf } = await loadEventTeams(event);
            const team = teamOf.get(me);
            return team && { event, team, members: membersOf.get(team.uri) ?? [] };
          }),
        )
      ).filter((entry) => entry !== undefined);

      const [participatingEventViews, organizingViews, teamViews] = await Promise.all([
        toEventViews(participating.map((entry) => entry.event)),
        toEventViews(organizing),
        Promise.all(participating.map((entry) => toTeamView(entry.team, entry.members))),
      ]);

      return {
        encoding: "application/json",
        body: {
          participating: participating.map((_, i) => ({
            $type: "win.tomo-x.rogaining.getMe#participation" as const,
            event: participatingEventViews[i],
            team: teamViews[i],
          })),
          organizing: organizingViews,
        },
      };
    },
  });
}
