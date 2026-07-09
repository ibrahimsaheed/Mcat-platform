// CONCEPT: Inngest is a background job engine that lets us run async tasks
// (like score recalculation) after events occur (like a quiz attempt being
// completed). It handles retries, logging, and scheduling.
//
// WHY: We use a singleton Inngest client so all functions share the same
// configuration and event key.
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "mcat-platform",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
