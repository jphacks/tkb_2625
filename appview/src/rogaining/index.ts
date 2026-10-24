import type { Server } from "../lexicons/index.js";
import getCheckpoints from "./getCheckpoints.js";
import getEvent from "./getEvent.js";
import getRanking from "./getRanking.js";
import listEvents from "./listEvents.js";
import listSubmissions from "./listSubmissions.js";
import type { AppviewEnv } from "../env.js";
import type { ServiceAuth } from "../auth.js";

export default function registerRogaining(server: Server<AppviewEnv>,auth:ServiceAuth) {
  getCheckpoints(server,auth);
  getEvent(server,auth);
  getRanking(server,auth);
  listEvents(server,auth);
  listSubmissions(server,auth);
}
