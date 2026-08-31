import ApplicationStudio from "@/components/ApplicationStudio";
import { requireUserPage } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export default async function ApplicationStudioPage() {
  const user = await requireUserPage();
  const supabase = await createClient();
  const [{ data: resume }, { data: matches }] = await Promise.all([
    supabase.from("resumes").select("extracted_text, parsed_data").eq("user_id", user.id).eq("is_primary", true).maybeSingle(),
    supabase.from("user_opportunity_matches").select(`
      opportunity_id,
      job_opportunities (id, title, company_name, description_excerpt)
    `).eq("user_id", user.id).in("status", ["new", "saved"]).order("created_at", { ascending: false }).limit(30),
  ]);
  const resumeText = resume?.extracted_text || (resume?.parsed_data as { summary?: string } | null)?.summary || "";
  const opportunities = (matches || []).flatMap((match) => {
    const opportunity = match.job_opportunities as unknown as { id: string; title: string; company_name: string | null; description_excerpt: string | null } | null;
    return opportunity ? [{
      id: opportunity.id,
      title: opportunity.title,
      companyName: opportunity.company_name || "Unknown company",
      description: opportunity.description_excerpt || "",
    }] : [];
  });
  return <ApplicationStudio canonicalResume={resumeText} opportunities={opportunities} />;
}
