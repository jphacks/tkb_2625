import type { Server } from "../lexicons/index.js";

export default function getEvent(server: Server<any>) {
  server.win.tomoX.rogaining.getEvent(async ({ auth, params, input, c }) => {
    return { status: 404, error: "EventNotFound" };
  });
}
