import type { ServiceAuth } from "../auth.js";
import type { AppviewEnv } from "../env.js";
import type { Server } from "../lexicons/index.js";

export default function listSubmissions(server: Server<AppviewEnv>, auth: ServiceAuth) {
  server.win.tomoX.rogaining.listSubmissions({
    auth,
    handler: async ({ auth, params, input, c }) => {
      return {
        encoding: "application/json",
        body: { submissions: [] },
      };
    },
  });
}
