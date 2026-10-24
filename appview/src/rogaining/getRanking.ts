import type { ServiceAuth } from "../auth.js";
import type { AppviewEnv } from "../env.js";
import type { Server } from "../lexicons/index.js";

export default function getRanking(server: Server<AppviewEnv>, auth: ServiceAuth) {
  server.win.tomoX.rogaining.getRanking({
    auth,
    handler: async ({ auth, params, input, c }) => {
      return {
        encoding: "application/json",
        body: { ranking: [] },
      };
    },
  });
}
