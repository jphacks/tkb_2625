import type { ServiceAuth } from "../auth.js";
import type { AppviewEnv } from "../env.js";
import type { Server } from "../lexicons/index.js";
import { findSubmissions, InvalidCursorError } from "./submissions.js";
import { findEvent, loadEventTeams, toSubmissionView } from "./views.js";

export default function listSubmissions(server: Server<AppviewEnv>, auth: ServiceAuth) {
  server.win.tomoX.rogaining.listSubmissions({
    auth,
    handler: async ({ auth, params }) => {
      const event = await findEvent(params.event);
      if (!event) {
        return { status: 404, error: "EventNotFound" };
      }

      // 作成者と approver は全チーム、参加者は自分のチームの分だけ見られる
      const viewer = auth.credentials.iss;
      const { teamOf, membersOf } = await loadEventTeams(event);
      let authorDids: string[];
      if (viewer === event.authorDid || viewer === event.approverDid) {
        authorDids = [...teamOf.keys()];
      } else {
        const team = teamOf.get(viewer);
        authorDids = team ? (membersOf.get(team.uri) ?? []) : [];
      }

      let page;
      try {
        page = await findSubmissions(event, authorDids, { limit: params.limit ?? 50, cursor: params.cursor });
      } catch (err) {
        if (err instanceof InvalidCursorError) return { status: 400, message: "invalid cursor" };
        throw err;
      }

      const submissions = await Promise.all(
        page.submissions.map((row) => toSubmissionView(row, event, teamOf.get(row.submit.authorDid)!.uri)),
      );
      return {
        encoding: "application/json",
        body: { cursor: page.cursor, submissions },
      };
    },
  });
}
