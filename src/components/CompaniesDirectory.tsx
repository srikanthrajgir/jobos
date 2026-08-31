"use client";

import { useMemo, useState } from "react";
import { Building2, ExternalLink, MapPin, Search } from "lucide-react";

export type CompanyDirectoryItem = {
  name: string;
  industry: string;
  location: string;
  website: string | null;
  roles: Array<{ id: string; title: string; url: string | null }>;
};

export default function CompaniesDirectory({ companies }: { companies: CompanyDirectoryItem[] }) {
  const [query, setQuery] = useState("");
  const [selectedName, setSelectedName] = useState(companies[0]?.name || "");
  const filtered = useMemo(() => companies.filter((company) =>
    `${company.name} ${company.industry} ${company.location}`.toLowerCase().includes(query.trim().toLowerCase()),
  ), [companies, query]);
  const selected = companies.find((company) => company.name === selectedName) || filtered[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-heading">Companies</h1>
        <p className="mt-1 text-text-muted">Explore employers with currently verified opportunities.</p>
      </div>
      <div className="grid min-h-[620px] overflow-hidden rounded-2xl border border-border-light bg-bg-card shadow-sm lg:grid-cols-[380px_1fr]">
        <aside className="flex min-h-0 flex-col border-r border-border-light">
          <div className="border-b border-border-light bg-bg-secondary p-4">
            <label className="relative block">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search companies or locations" className="w-full rounded-xl border border-border-light bg-bg-input py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary-teal" />
            </label>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-text-muted">{filtered.length} employers</p>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {filtered.length === 0 ? <p className="p-6 text-center text-sm text-text-muted">No verified employers match that search.</p> : filtered.map((company) => (
              <button key={company.name} onClick={() => setSelectedName(company.name)} className={`w-full rounded-xl border p-4 text-left transition ${selected?.name === company.name ? "border-primary-teal bg-primary-teal-light" : "border-border-light bg-bg-main hover:border-text-muted"}`}>
                <h2 className="font-bold text-text-heading">{company.name}</h2>
                <p className="mt-1 text-sm text-text-muted">{company.industry}</p>
                <div className="mt-3 flex items-center justify-between text-xs font-medium text-text-charcoal"><span><MapPin size={13} className="mr-1 inline" />{company.location}</span><span>{company.roles.length} roles</span></div>
              </button>
            ))}
          </div>
        </aside>

        <section className="p-6 md:p-8">
          {selected ? (
            <>
              <div className="mb-8 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-primary-teal-light p-4 text-primary-teal"><Building2 size={30} /></div>
                  <div><h2 className="text-3xl font-bold text-text-heading">{selected.name}</h2><p className="mt-1 text-text-muted">{selected.industry} · {selected.location}</p></div>
                </div>
                {selected.website && <a href={selected.website} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-border-light p-2.5 text-text-muted hover:text-primary-teal" title="Open employer job page"><ExternalLink size={20} /></a>}
              </div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-muted">Verified active roles</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {selected.roles.map((role) => (
                  <article key={role.id} className="rounded-xl border border-border-light bg-bg-main p-4">
                    <h4 className="font-bold text-text-heading">{role.title}</h4>
                    {role.url && <a href={role.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center text-sm font-bold text-primary-teal">View source <ExternalLink size={14} className="ml-1" /></a>}
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-center"><div><Building2 size={48} className="mx-auto mb-4 text-border-hover" /><h2 className="text-xl font-bold text-text-heading">No verified companies yet</h2><p className="mt-2 max-w-md text-text-muted">Approved Greenhouse and Lever sources will populate this directory during ingestion.</p></div></div>
          )}
        </section>
      </div>
    </div>
  );
}
