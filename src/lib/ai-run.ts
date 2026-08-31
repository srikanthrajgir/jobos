import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIProvider } from "@/utils/ai/provider";

export async function runTrackedAI<T>(
  supabase: SupabaseClient,
  userId: string,
  feature: string,
  inputChars: number,
  provider: AIProvider,
  operation: () => Promise<T>,
): Promise<T> {
  const minuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count, error: countError } = await supabase
    .from("ai_runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", feature)
    .gte("created_at", minuteAgo);

  if (countError) throw new Error("AI usage controls are not available. Apply the latest database migration.");
  if ((count || 0) >= 5) throw new Error("AI rate limit reached. Please wait a minute and try again.");

  const { data: run, error: insertError } = await supabase
    .from("ai_runs")
    .insert({
      user_id: userId,
      feature,
      provider: provider.name,
      model: provider.model,
      status: "started",
      input_chars: Math.max(0, Math.min(inputChars, 250_000)),
    })
    .select("id")
    .single();

  if (insertError || !run) throw new Error("Could not start the AI request audit record");

  try {
    const result = await operation();
    const outputChars = typeof result === "string" ? result.length : JSON.stringify(result).length;
    await supabase.from("ai_runs").update({
      status: "succeeded",
      output_chars: Math.min(outputChars, 250_000),
      completed_at: new Date().toISOString(),
    }).eq("id", run.id).eq("user_id", userId);
    return result;
  } catch (error) {
    await supabase.from("ai_runs").update({
      status: "failed",
      error_code: error instanceof Error ? error.name.slice(0, 80) : "UnknownError",
      completed_at: new Date().toISOString(),
    }).eq("id", run.id).eq("user_id", userId);
    throw error;
  }
}
