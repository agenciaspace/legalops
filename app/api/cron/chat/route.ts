import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { chatJson } from "@/lib/chat/access";
import { processChatStep } from "@/lib/chat/engine";
export const maxDuration = 60;
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return chatJson({ error: "Unauthorized" }, 401);
  try {
    const recovery = await createAdminClient().rpc("chat_recover_stale_runs");
    if (recovery.error) throw recovery.error;
    const results = await Promise.all([processChatStep(), processChatStep()]);
    return chatJson({ results });
  } catch {
    return chatJson({ error: "queue_unavailable" }, 503);
  }
}
