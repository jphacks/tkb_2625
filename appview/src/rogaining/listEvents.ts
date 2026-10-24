import type { Server } from "../lexicons/index.js";

export default function listEvents(server: Server<any>) {
  server.win.tomoX.rogaining.listEvents(async ({ auth, params, input, c }) => {
    return {
      encoding: "application/json",
      body: { events: [] },
    };
  });
}
