"use client";

import { useMemo, useState } from "react";
import { Bold, Briefcase, FileText, List, Save, Sparkles } from "lucide-react";
import {
  generateCoverLetterAction,
  generateFitGapAction,
  saveApplicationDocument,
} from "@/app/actions/ai";

type StudioOpportunity = { id: string; title: string; companyName: string; description: string };

export default function ApplicationStudio({
  canonicalResume,
  opportunities,
}: {
  canonicalResume: string;
  opportunities: StudioOpportunity[];
}) {
  const [selectedId, setSelectedId] = useState(opportunities[0]?.id || "");
  const selected = useMemo(() => opportunities.find((item) => item.id === selectedId), [opportunities, selectedId]);
  const [manualTitle, setManualTitle] = useState("");
  const [manualCompany, setManualCompany] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [resumeText, setResumeText] = useState(canonicalResume);
  const [fitGap, setFitGap] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [busy, setBusy] = useState<"fit" | "cover" | "save-cover" | "save-resume" | "">("");
  const [message, setMessage] = useState("");

  const target = {
    title: selected?.title || manualTitle,
    companyName: selected?.companyName || manualCompany,
    description: selected?.description || manualDescription,
  };

  const ensureReady = () => {
    if (!resumeText.trim()) throw new Error("Save a canonical resume first, or paste a resume variant here.");
    if (!target.title.trim()) throw new Error("Choose an opportunity or enter a role title.");
  };

  const generateFit = async () => {
    setBusy("fit");
    setMessage("");
    try {
      ensureReady();
      const result = await generateFitGapAction({
        jobTitle: target.title,
        companyName: target.companyName,
        jobDescription: target.description,
        resumeText,
      });
      setFitGap(result.analysis);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Fit analysis failed.");
    } finally {
      setBusy("");
    }
  };

  const generateCover = async () => {
    setBusy("cover");
    setMessage("");
    try {
      ensureReady();
      const result = await generateCoverLetterAction({
        jobTitle: target.title,
        companyName: target.companyName,
        jobDescription: target.description,
        resumeText,
      });
      setCoverLetter(result.draft);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Cover letter generation failed.");
    } finally {
      setBusy("");
    }
  };

  const saveDocument = async (documentType: "cover_letter" | "resume_variant") => {
    const content = documentType === "cover_letter" ? coverLetter : resumeText;
    if (!content.trim() || !target.title.trim()) return;
    setBusy(documentType === "cover_letter" ? "save-cover" : "save-resume");
    setMessage("");
    try {
      await saveApplicationDocument({
        opportunityId: selected?.id,
        documentType,
        title: `${target.title} — ${documentType === "cover_letter" ? "Cover letter" : "Resume variant"}`,
        content,
      });
      setMessage(documentType === "cover_letter" ? "Cover letter saved." : "Resume variant saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The document could not be saved.");
    } finally {
      setBusy("");
    }
  };

  const insertFormatting = (kind: "bold" | "list") => {
    setCoverLetter((value) => kind === "bold" ? `${value}\n**Key strength:** ` : `${value}\n- `);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-heading">Application Studio</h1>
        <p className="mt-1 text-text-muted">Compare the role, tailor your evidence and save a reviewed application pack.</p>
      </div>

      <section className="rounded-2xl border border-border-light bg-bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <Briefcase className="text-primary-teal" />
          <h2 className="font-bold text-text-heading">Target opportunity</h2>
        </div>
        {opportunities.length > 0 && (
          <label className="block text-sm font-bold text-text-muted">
            From your opportunities
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-border-light bg-bg-input px-3 py-2.5 text-text-charcoal outline-none focus:border-primary-teal"
            >
              {opportunities.map((item) => <option key={item.id} value={item.id}>{item.title} — {item.companyName}</option>)}
              <option value="">Enter another role</option>
            </select>
          </label>
        )}
        {!selected && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input value={manualTitle} onChange={(event) => setManualTitle(event.target.value)} maxLength={160} placeholder="Role title" className="rounded-xl border border-border-light bg-bg-input px-3 py-2.5" />
            <input value={manualCompany} onChange={(event) => setManualCompany(event.target.value)} maxLength={160} placeholder="Company" className="rounded-xl border border-border-light bg-bg-input px-3 py-2.5" />
            <textarea value={manualDescription} onChange={(event) => setManualDescription(event.target.value)} maxLength={50000} rows={4} placeholder="Paste the job description" className="md:col-span-2 rounded-xl border border-border-light bg-bg-input p-3" />
          </div>
        )}
      </section>

      {!canonicalResume && (
        <div className="rounded-xl border border-accent-orange/30 bg-accent-orange/10 p-4 text-sm font-medium text-text-charcoal">
          No canonical resume is saved yet. You can paste one below, but saving it in Resume Manager gives you a reusable source of truth.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="flex min-h-[480px] flex-col rounded-2xl border border-border-light bg-bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center text-sm font-bold uppercase tracking-wider text-text-muted"><FileText size={16} className="mr-2 text-primary-teal" /> Resume variant</h2>
            <button onClick={() => void saveDocument("resume_variant")} disabled={Boolean(busy) || !resumeText.trim()} className="inline-flex items-center gap-2 rounded-lg border border-border-light px-3 py-2 text-xs font-bold text-text-charcoal disabled:opacity-50"><Save size={14} /> Save variant</button>
          </div>
          <textarea value={resumeText} onChange={(event) => setResumeText(event.target.value)} maxLength={100000} className="min-h-[380px] flex-1 resize-y rounded-xl border border-border-light bg-bg-input p-4 text-sm leading-relaxed outline-none focus:border-primary-teal" aria-label="Resume variant" />
        </section>

        <section className="flex min-h-[480px] flex-col rounded-2xl border border-border-light bg-bg-card p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center text-sm font-bold uppercase tracking-wider text-text-muted"><Sparkles size={16} className="mr-2 text-accent-orange" /> Fit gap</h2>
            <button onClick={generateFit} disabled={Boolean(busy)} className="rounded-lg border border-border-light bg-bg-secondary px-4 py-2 text-sm font-bold text-text-charcoal disabled:opacity-50">{busy === "fit" ? "Analysing…" : "Analyse fit"}</button>
          </div>
          <div className="min-h-[380px] flex-1 whitespace-pre-wrap rounded-xl border border-border-light bg-bg-main p-4 text-sm leading-relaxed text-text-charcoal">
            {fitGap || <span className="italic text-text-muted">Run an evidence-based comparison against the target role.</span>}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border-light bg-bg-card p-6 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">Cover letter editor</h2>
          <div className="flex gap-2">
            <button type="button" onClick={() => insertFormatting("bold")} className="rounded-lg border border-border-light p-2 text-text-muted" title="Insert emphasis"><Bold size={16} /></button>
            <button type="button" onClick={() => insertFormatting("list")} className="rounded-lg border border-border-light p-2 text-text-muted" title="Insert bullet"><List size={16} /></button>
            <button onClick={generateCover} disabled={Boolean(busy)} className="rounded-lg border border-primary-teal px-4 py-2 text-sm font-bold text-primary-teal disabled:opacity-50">{busy === "cover" ? "Drafting…" : "Generate draft"}</button>
            <button onClick={() => void saveDocument("cover_letter")} disabled={Boolean(busy) || !coverLetter.trim()} className="inline-flex items-center gap-2 rounded-lg bg-primary-teal px-4 py-2 text-sm font-bold text-bg-main disabled:opacity-50"><Save size={16} /> Save</button>
          </div>
        </div>
        <textarea value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} maxLength={100000} rows={16} placeholder="Generate a draft, then edit every claim before saving." className="w-full resize-y rounded-xl border border-border-light bg-bg-input p-4 text-sm leading-relaxed outline-none focus:border-accent-orange" aria-label="Cover letter draft" />
      </section>

      <p className="min-h-5 text-sm text-text-muted" role="status" aria-live="polite">{message}</p>
    </div>
  );
}
