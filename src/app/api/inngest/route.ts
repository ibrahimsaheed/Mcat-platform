// CONCEPT: This Route Handler mounts the Inngest dev server at /api/inngest.
// Inngest uses this endpoint to receive events and trigger functions.
//
// In production, the Inngest Cloud handles this — in development, we run
// `npx inngest dev` locally to serve the same endpoint.
import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { recalculateScoreAnalytics } from "@/inngest/functions/recalculateScoreAnalytics";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [recalculateScoreAnalytics],
});
