"use client";

import { useCallback, useMemo, useState } from "react";
import { Building2, ExternalLink, MapPin, Search } from "lucide-react";
import CompaniesMap, { type MapCompany } from "@/components/CompaniesMap";

export type CompanyDirectoryItem = {
  name: string;
  industry: string;
  location: string;
  website: string | null;
  lat: number | null;
  lng: number | null;
  roles: Array<{ id: string; title: string; url: string | null }>;
};

export default function CompaniesDirectory({
  companies,
  mapsApiKey,
}: {
  companies: CompanyDirectoryItem[];
  mapsApiKey: string | null;
}) {
  const [query, setQuery] = useState("");
  const [selectedName, setSelectedName] = useState(companies[0]?.name || "");
  const filtered = useMemo(() => companies.filter((company) =>
    `${company.name} ${company.industry} ${company.location}`.toLowerCase().includes(query.trim().toLowerCase()),
  ), [companies, query]);
  const selected = companies.find((company) => company.name === selectedName) || filtered[0];

  // Only the filtered set is plotted, so searching narrows the map too. Anything
  // without coordinates simply cannot be placed — see the map's own notice.
  const plotted = useMemo<MapCompany[]>(
    () => filtered
      .filter((company): company is CompanyDirectoryItem & { lat: number; lng: number } =>
        company.lat !== null && company.lng !== null)
      .map((company) => ({ name: company.name, location: company.location, lat: company.lat, lng: company.lng })),
    [filtered],
  );

  const handleMapSelect = useCallback((name: string) => setSelectedName(name), []);

  return (
    // h-full against the shell's full-bleed slot, so both panes reach the
    // viewport edges. No rounding or outer border: either would reintroduce the
    // gutter this layout exists to remove.
    <div className="flex h-full w-full flex-col overflow-hidden md:flex-row">

      {/* Column 1 — targeted companies list (38%) */}
      <aside className="flex h-[45%] w-full min-h-0 flex-col border-b border-border-light bg-bg-card md:h-full md:w-[38%] md:min-w-[320px] md:max-w-[560px] md:border-b-0 md:border-r">
        <div className="shrink-0 border-b border-border-light bg-bg-secondary p-4">
          <label className="relative block">
            <span className="sr-only">Search companies or locations</span>
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search companies or locations"
              className="w-full rounded-xl border border-border-light bg-bg-input py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary-teal"
            />
          </label>
          <p className="mt-3 text-xs font-bold uppercase tracking-wider text-text-muted">
            {filtered.length} employers
            {filtered.length > 0 && ` · ${plotted.length} on map`}
          </p>
        </div>

        {/* Scrolls independently of the map. */}
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {companies.length === 0 ? (
            <div className="flex h-full items-center justify-center p-6 text-center">
              <div>
                <Building2 size={40} className="mx-auto mb-3 text-border-hover" />
                <h2 className="font-bold text-text-heading">No verified companies yet</h2>
                <p className="mt-2 text-sm text-text-muted">Approved Greenhouse and Lever sources will populate this directory during ingestion.</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-text-muted">No verified employers match that search.</p>
          ) : filtered.map((company) => {
            const isSelected = selected?.name === company.name;
            return (
              <div
                key={company.name}
                className={`overflow-hidden rounded-xl border transition ${isSelected ? "border-primary-teal bg-primary-teal-light" : "border-border-light bg-bg-main hover:border-text-muted"}`}
              >
                <button
                  onClick={() => setSelectedName(company.name)}
                  aria-expanded={isSelected}
                  className="w-full p-4 text-left"
                >
                  <h2 className="font-bold text-text-heading">{company.name}</h2>
                  <p className="mt-1 text-sm text-text-muted">{company.industry}</p>
                  <div className="mt-3 flex items-center justify-between text-xs font-medium text-text-charcoal">
                    <span><MapPin size={13} className="mr-1 inline" />{company.location}</span>
                    <span>{company.roles.length} roles</span>
                  </div>
                </button>

                {/* Roles used to live in the right pane, which is now the map.
                    They expand in place so no employer detail is lost, and the
                    links stay outside the button rather than nested in it. */}
                {isSelected && company.roles.length > 0 && (
                  <div className="border-t border-border-light/60 px-4 pb-4 pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Verified active roles</h3>
                      {company.website && (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open employer job page"
                          className="text-text-muted hover:text-primary-teal"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                    <ul className="mt-3 space-y-2">
                      {company.roles.map((role) => (
                        <li key={role.id} className="rounded-lg border border-border-light bg-bg-card p-3">
                          <p className="text-sm font-bold text-text-heading">{role.title}</p>
                          {role.url && (
                            <a
                              href={role.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center text-xs font-bold text-primary-teal"
                            >
                              View source <ExternalLink size={12} className="ml-1" />
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Column 2 — map (remaining ~62%) */}
      <section id="companies-map" className="relative min-h-0 flex-1 bg-bg-secondary">
        <CompaniesMap
          apiKey={mapsApiKey}
          companies={plotted}
          selectedName={selected?.name || ""}
          onSelect={handleMapSelect}
          plottedOf={filtered.length}
        />
      </section>
    </div>
  );
}
