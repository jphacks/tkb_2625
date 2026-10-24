import type { ServiceAuth } from "../auth.js";
import type { AppviewEnv } from "../env.js";
import type { Server } from "../lexicons/index.js";

export default function getEvent(server: Server<AppviewEnv>, auth: ServiceAuth) {
  server.win.tomoX.rogaining.getEvent({
    auth,
    handler: async ({ auth, params, input, c }) => {
      return { status: 404, error: "EventNotFound" };
    },
  });
}
