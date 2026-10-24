import type { Server } from "../lexicons/index.js";

export default function listSubmissions(server: Server<any>) {
  server.win.tomoX.rogaining.listSubmissions(async ({ auth, params, input, c }) => {
    return {
      encoding: "application/json",
      body: { submissions: [] },
    };
  });
}
