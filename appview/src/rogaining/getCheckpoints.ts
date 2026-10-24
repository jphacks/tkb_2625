import type { Server } from "../lexicons/index.js";

export default function getCheckpoints(server: Server<any>) {
  server.win.tomoX.rogaining.getCheckpoints(async ({ auth, params, input, c }) => {
    return {
      encoding: "application/json",
      body: { checkpoints: [] },
    };
  });
}
