"use client";

import { useMemo, useState } from "react";
import {
  Bookmark, Briefcase, Building2, Calendar, CheckCircle2, DollarSign,
  EyeOff, Inbox, Loader2, MapPin, Search, Star, Target, XCircle, Zap,
} from "lucide-react";
import {
  confirmApplication,
  getApplicationDraft,
  updateMatchStatus,
  type OpportunityMatch,
} from "@/app/actions/opportunities";

const TABS = [
  { id: "new", label: "For You", icon: Inbox },
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "applied", label: "Applied", icon: CheckCircle2 },
  { id: "dismissed", label: "Dismissed", icon: XCircle },
] as const;

type MatchStatus = typeof TABS[number]["id"];
type Draft = { subject: string; body: string; recipient: string; idempotencyKey: string };

export default function OpportunityLayout({ initialMatches }: { initialMatches: OpportunityMatch[] }) {
  const [activeTab, setActiveTab] = useState<MatchStatus>("new");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matches, setMatches] = useState(initialMatches);
  const [query, setQuery] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [message, setMessage] = useState("");

  const filteredMatches = useMemo(() => matches.filter((match) => {
    if (match.status !== activeTab) return false;
    const opportunity = match.job_opportunities;
    const haystack = `${opportunity?.title || ""} ${opportunity?.company_name || ""}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  }), [activeTab, matches, query]);

  const selectedMatch = matches.find((match) => match.opportunity_id === selectedId);
  const opportunity = selectedMatch?.job_opportunities;

  const updateStatus = async (status: "new" | "saved" | "dismissed") => {
    if (!selectedMatch) return;
    const previous = matches;
    setLoadingAction(status);
    setMessage("");
    setMatches((items) => items.map((item) => item.id === selectedMatch.id ? { ...item, status } : item));
    try {
      await updateMatchStatus(selectedMatch.id, status);
    } catch (error) {
      setMatches(previous);
      setMessage(error instanceof Error ? error.message : "The opportunity could not be updated.");
    } finally {
      setLoadingAction(null);
    }
  };

  const startApplication = async () => {
    if (!selectedId) return;
    setLoadingAction("draft");
    setMessage("");
    try {
      const prepared = await getApplicationDraft(selectedId);
      setDraft({ ...prepared, idempotencyKey: crypto.randomUUID() });
      setAuthorized(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The application draft could not be prepared.");
    } finally {
      setLoadingAction(null);
    }
  };

  const submitApplication = async () => {
    if (!selectedId || !draft || !authorized) return;
    setLoadingAction("confirm");
    setMessage("");
    try {
      await confirmApplication({
        opportunityId: selectedId,
        subject: draft.subject,
        body: draft.body,
        authorized: true,
        idempotencyKey: draft.idempotencyKey,
      });
      setMatches((items) => items.map((item) => item.opportunity_id === selectedId ? { ...item, status: "applied" } : item));
      setDraft(null);
      setAuthorized(false);
      setMessage("Application sent and added to your pipeline.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The application could not be sent. It is safe to retry.");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 overflow-x-auto border-b border-border-light">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedId(null); setDraft(null); setMessage(""); }}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-4 text-sm font-bold ${activeTab === tab.id ? "border-primary-teal text-primary-teal" : "border-transparent text-text-muted hover:bg-bg-hover hover:text-text-charcoal"}`}
          >
            <tab.icon size={18} /> {tab.label}
            <span className="rounded-full border border-border-light bg-bg-secondary px-2 py-0.5 text-xs">{matches.filter((item) => item.status === tab.id).length}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className={`w-full flex-col border-r border-border-light md:flex md:w-[40%] ${selectedId ? "hidden" : "flex"}`}>
          <div className="shrink-0 border-b border-border-light p-4">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles or companies" className="w-full rounded-xl border border-border-light bg-bg-secondary py-2 pl-10 pr-4 text-sm outline-none focus:border-primary-teal" />
            </label>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {filteredMatches.length === 0 ? (
              <div className="p-8 text-center">
                <Inbox size={44} className="mx-auto mb-4 text-border-hover" />
                <p className="font-bold text-text-heading">Nothing here yet</p>
                <p className="mt-1 text-sm text-text-muted">New verified opportunities will appear after the daily matching run.</p>
              </div>
            ) : filteredMatches.map((match) => {
              const job = match.job_opportunities;
              if (!job) return null;
              return (
                <button key={match.id} onClick={() => setSelectedId(match.opportunity_id)} className={`w-full rounded-xl border p-4 text-left transition ${selectedId === match.opportunity_id ? "border-primary-teal bg-bg-hover" : "border-border-light bg-bg-main hover:border-text-muted"}`}>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="rounded-md bg-primary-teal-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-teal-dark">{match.match_category || "Matched"}</span>
                    <span className="text-xs text-text-muted">{new Date(match.batch_date).toLocaleDateString("en-AU")}</span>
                  </div>
                  <h3 className="text-lg font-bold leading-tight text-text-heading">{job.title}</h3>
                  <p className="mt-1 flex items-center text-sm font-medium text-text-charcoal"><Building2 size={14} className="mr-1.5" />{job.company_name || "Unknown company"}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-muted">
                    <span className="rounded bg-bg-secondary px-2 py-1"><MapPin size={12} className="mr-1 inline" />{job.suburb || job.work_arrangement || "Location not listed"}</span>
                    <span className="rounded bg-bg-secondary px-2 py-1"><Briefcase size={12} className="mr-1 inline" />{job.employment_type || "Type not listed"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className={`w-full overflow-y-auto bg-bg-main md:block md:w-[60%] ${selectedId ? "block" : "hidden"}`}>
          {opportunity && selectedMatch ? (
            <div className="p-6 md:p-8">
              <button onClick={() => setSelectedId(null)} className="mb-5 text-sm font-bold text-text-muted md:hidden">← Back to list</button>
              <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <h2 className="text-3xl font-bold text-text-heading">{opportunity.title}</h2>
                  <p className="mt-2 flex items-center text-lg font-medium text-primary-teal"><Building2 size={18} className="mr-2" />{opportunity.company_name || "Unknown company"}</p>
                </div>
                {!draft && activeTab !== "applied" && (
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => void updateStatus(activeTab === "saved" ? "new" : "saved")} disabled={Boolean(loadingAction)} title={activeTab === "saved" ? "Move back to For You" : "Save for later"} className="rounded-xl border border-border-light p-2.5 text-text-muted hover:text-primary-teal"><Bookmark size={20} /></button>
                    <button onClick={() => void updateStatus("dismissed")} disabled={Boolean(loadingAction)} title="Dismiss" className="rounded-xl border border-border-light p-2.5 text-text-muted hover:text-red-500"><EyeOff size={20} /></button>
                    {opportunity.application_mode === "email" && opportunity.application_email ? (
                      <button onClick={startApplication} disabled={Boolean(loadingAction)} className="inline-flex items-center rounded-xl bg-primary-teal px-5 py-2.5 font-bold text-bg-main disabled:opacity-50">{loadingAction === "draft" ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Zap size={18} className="mr-2" />}Apply with JobOS</button>
                    ) : opportunity.application_url ? (
                      <a href={opportunity.application_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-xl bg-primary-teal px-5 py-2.5 font-bold text-bg-main">Apply on employer site</a>
                    ) : null}
                  </div>
                )}
              </div>

              {draft && (
                <section className="mb-8 rounded-2xl border border-primary-teal bg-bg-secondary p-6">
                  <h3 className="mb-4 flex items-center text-lg font-bold text-primary-teal-dark"><Zap size={20} className="mr-2" />Review application</h3>
                  <div className="space-y-4 rounded-xl border border-border-light bg-bg-card p-4">
                    <div><span className="text-xs font-bold uppercase text-text-muted">To</span><p className="mt-1 text-sm font-medium text-text-charcoal">{draft.recipient}</p></div>
                    <label className="block text-xs font-bold uppercase text-text-muted">Subject<input value={draft.subject} maxLength={200} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} className="mt-1 w-full rounded-lg border border-border-light bg-bg-input p-2 text-sm font-medium normal-case text-text-charcoal" /></label>
                    <label className="block text-xs font-bold uppercase text-text-muted">Message<textarea value={draft.body} maxLength={20000} rows={10} onChange={(event) => setDraft({ ...draft, body: event.target.value })} className="mt-1 w-full resize-y rounded-lg border border-border-light bg-bg-input p-3 text-sm font-medium normal-case text-text-charcoal" /></label>
                  </div>
                  <label className="my-5 flex cursor-pointer items-start gap-3 text-sm font-medium text-text-charcoal"><input type="checkbox" checked={authorized} onChange={(event) => setAuthorized(event.target.checked)} className="mt-1 h-4 w-4" />I reviewed this message and authorise JobOS to email it with my canonical resume attached.</label>
                  <div className="flex gap-3">
                    <button onClick={() => { setDraft(null); setAuthorized(false); }} className="rounded-xl border border-border-light bg-bg-card px-5 py-2.5 font-bold text-text-charcoal">Cancel</button>
                    <button onClick={submitApplication} disabled={!authorized || Boolean(loadingAction)} className="flex-1 rounded-xl bg-primary-teal px-5 py-2.5 font-bold text-bg-main disabled:opacity-50">{loadingAction === "confirm" ? "Sending securely…" : "Send application"}</button>
                  </div>
                </section>
              )}

              <p className="mb-5 min-h-5 text-sm text-text-muted" role="status" aria-live="polite">{message}</p>

              <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                <Stat icon={MapPin} label="Location" value={[opportunity.suburb, opportunity.state].filter(Boolean).join(", ") || opportunity.work_arrangement || "Not listed"} />
                <Stat icon={Briefcase} label="Type" value={opportunity.employment_type || "Not listed"} />
                <Stat icon={DollarSign} label="Salary" value={opportunity.salary_min ? `${opportunity.salary_currency || "$"}${opportunity.salary_min.toLocaleString()}` : "Not listed"} />
                <Stat icon={Calendar} label="Published" value={opportunity.published_at ? new Date(opportunity.published_at).toLocaleDateString("en-AU") : "Recent"} />
              </div>

              <section className="mb-8 overflow-hidden rounded-xl border border-border-light">
                <header className="flex items-center border-b border-border-light bg-bg-secondary px-5 py-3"><Star size={16} className="mr-2 text-accent-orange" /><h3 className="text-sm font-bold uppercase tracking-wider text-text-heading">Why JobOS selected this</h3></header>
                <ul className="space-y-3 bg-bg-card p-5">
                  {selectedMatch.match_reasons.map((reason) => <li key={reason} className="flex items-start text-sm font-medium text-text-charcoal"><CheckCircle2 size={16} className="mr-2 mt-0.5 shrink-0 text-green-500" />{reason}</li>)}
                  {selectedMatch.potential_gaps.map((gap) => <li key={gap} className="flex items-start text-sm font-medium text-text-charcoal"><XCircle size={16} className="mr-2 mt-0.5 shrink-0 text-accent-orange" />{gap}</li>)}
                </ul>
              </section>

              <section><h3 className="mb-4 border-b border-border-light pb-2 text-xl font-bold text-text-heading">About the role</h3><p className="whitespace-pre-wrap font-medium leading-relaxed text-text-charcoal">{opportunity.description_excerpt || "The employer has not supplied a description excerpt."}</p></section>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center"><div><Target size={48} className="mx-auto mb-4 text-border-hover" /><p className="font-bold text-text-heading">Select an opportunity</p><p className="mt-1 text-sm text-text-muted">Review the match details and prepare your application.</p></div></div>
          )}
        </main>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return <div className="rounded-xl border border-border-light bg-bg-secondary p-4"><Icon size={16} className="mb-2 text-text-muted" /><p className="mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">{label}</p><p className="text-sm font-medium text-text-charcoal">{value}</p></div>;
}
