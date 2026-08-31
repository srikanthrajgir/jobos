import ResumeManager from "@/components/ResumeManager";
import { requireUserPage } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export default async function ResumePage() {
  const user = await requireUserPage();
  const supabase = await createClient();
  const { data: primary } = await supabase
    .from("resumes")
    .select("id, display_name, extracted_text, parsed_data")
    .eq("user_id", user.id)
    .eq("is_primary", true)
    .maybeSingle();

  const text = primary?.extracted_text || (primary?.parsed_data as { summary?: string } | null)?.summary || "";
  return <ResumeManager initialResume={primary ? { id: primary.id, name: primary.display_name, text } : null} />;
}
