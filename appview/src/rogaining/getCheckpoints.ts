import type { ServiceAuth } from "../auth.js";
import type { AppviewEnv } from "../env.js";
import type { Server } from "../lexicons/index.js";
import { findEvent, findValidCheckpoints, toCheckpointView } from "./views.js";

export default function getCheckpoints(server: Server<AppviewEnv>, auth: ServiceAuth) {
  server.win.tomoX.rogaining.getCheckpoints({
    auth,
    handler: async ({ auth, params }) => {
      const event = await findEvent(params.event);
      if (!event) {
        return { status: 404, error: "EventNotFound" };
      }

      // 内部画像は参加者に見せない
      const includeInternal = auth.credentials.iss === event.authorDid;
      const rows = await findValidCheckpoints(event);

      return {
        encoding: "application/json",
        body: { checkpoints: await Promise.all(rows.map((row) => toCheckpointView(row, includeInternal))) },
      };
    },
  });
}
