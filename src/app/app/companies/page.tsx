import CompaniesDirectory, { type CompanyDirectoryItem } from "@/components/CompaniesDirectory";
import { createClient } from "@/utils/supabase/server";

export default async function CompaniesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_opportunities")
    .select("id, company_name, industry, suburb, state, title, canonical_url")
    .eq("status", "active")
    .not("company_name", "is", null)
    .order("last_verified_at", { ascending: false })
    .limit(500);

  const grouped = new Map<string, CompanyDirectoryItem>();
  for (const job of data || []) {
    const name = job.company_name?.trim();
    if (!name) continue;
    const existing: CompanyDirectoryItem = grouped.get(name) || {
      name,
      industry: job.industry || "Industry not listed",
      location: [job.suburb, job.state].filter(Boolean).join(", ") || "Location varies",
      website: job.canonical_url || null,
      roles: [],
    };
    if (existing.roles.length < 8) existing.roles.push({ id: job.id, title: job.title, url: job.canonical_url || null });
    grouped.set(name, existing);
  }

  return <CompaniesDirectory companies={[...grouped.values()].sort((a, b) => a.name.localeCompare(b.name))} />;
}
