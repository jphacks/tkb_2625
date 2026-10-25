import type { ServiceAuth } from "../auth.js";
import type { AppviewEnv } from "../env.js";
import type { Server } from "../lexicons/index.js";
import { findEvent, loadEventTeams, toEventViews, toTeamView } from "./views.js";

export default function getEvent(server: Server<AppviewEnv>, auth: ServiceAuth) {
  server.win.tomoX.rogaining.getEvent({
    auth,
    handler: async ({ params }) => {
      const event = await findEvent(params.event);
      if (!event) {
        return { status: 404, error: "EventNotFound" };
      }

      const { teams, membersOf } = await loadEventTeams(event);
      const [[eventView], teamViews] = await Promise.all([
        toEventViews([event]),
        Promise.all(teams.map((team) => toTeamView(team, membersOf.get(team.uri) ?? []))),
      ]);

      return {
        encoding: "application/json",
        body: { event: eventView, teams: teamViews },
      };
    },
  });
}
