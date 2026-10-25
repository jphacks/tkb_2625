import { and, desc, eq, gt, gte, lt, lte } from "drizzle-orm";
import { db } from "../db/index.js";
import { eventsTable } from "../db/schema.js";
import type { ServiceAuth } from "../auth.js";
import type { AppviewEnv } from "../env.js";
import type { Server } from "../lexicons/index.js";
import { toEventViews } from "./views.js";

export default function listEvents(server: Server<AppviewEnv>, auth: ServiceAuth) {
  server.win.tomoX.rogaining.listEvents({
    auth,
    handler: async ({ params }) => {
      const now = new Date();
      const conditions = [];

      switch (params.status) {
        case undefined:
          break;
        case "upcoming":
          conditions.push(gt(eventsTable.startsAt, now));
          break;
        case "ongoing":
          conditions.push(lte(eventsTable.startsAt, now), gte(eventsTable.endsAt, now));
          break;
        case "ended":
          conditions.push(lt(eventsTable.endsAt, now));
          break;
        default:
          return { status: 400, error: "InvalidStatus" };
      }

      if (params.approver !== undefined) {
        conditions.push(eq(eventsTable.approverDid, params.approver));
      }

      const rows = await db
        .select()
        .from(eventsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(eventsTable.createdAt), desc(eventsTable.uri));

      return {
        encoding: "application/json",
        body: { events: await toEventViews(rows) },
      };
    },
  });
}
