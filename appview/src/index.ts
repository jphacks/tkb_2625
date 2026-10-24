import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createServer } from "./lexicons/index.js";
import { createServiceAuth } from "./auth.js";
import registerRogaining from "./rogaining/index.js";

const app = new Hono();
const server = createServer({});
const auth = createServiceAuth({ ownDid: "did:web:rogaining.tomo-x.win", serviceId: "rogaining_api" });
registerRogaining(server, auth);

app.route("/", server.xrpc.createApp());
serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
