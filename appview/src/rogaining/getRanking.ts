import type { Server } from "../lexicons/index.js";

export default function getRanking(server: Server<any>) {
  server.win.tomoX.rogaining.getRanking(async ({ auth, params, input, c }) => {
    return {
      encoding: "application/json",
      body: { ranking: [] },
    };
  });
}
