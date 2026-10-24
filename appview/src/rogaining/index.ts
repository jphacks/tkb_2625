import type { Server } from "../lexicons/index.js";
import getCheckpoints from "./getCheckpoints.js";
import getEvent from "./getEvent.js";
import getRanking from "./getRanking.js";
import listEvents from "./listEvents.js";
import listSubmissions from "./listSubmissions.js";

export default function registerRogaining(server: Server<any>) {
  getCheckpoints(server);
  getEvent(server);
  getRanking(server);
  listEvents(server);
  listSubmissions(server);
}
