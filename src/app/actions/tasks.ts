"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { uuidSchema } from "@/lib/validation";
import { createClient } from "@/utils/supabase/server";

export async function completeTask(taskId: string) {
  const id = uuidSchema.parse(taskId);
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from("user_tasks").update({
    status: "done",
    completed_at: new Date().toISOString(),
  }).eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
  if (error || !data) throw new Error("Task not found");
  revalidatePath("/app");
}
