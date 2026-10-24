import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createXRPCHono } from "@evex-dev/xrpc-hono";
import { createServer } from "./lexicons/index.js";

const app = new Hono();
const server = createServer({});

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
