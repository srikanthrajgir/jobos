"use client";

import { useState } from "react";
import { CheckCircle2, FileText, ShieldCheck, UploadCloud } from "lucide-react";
import { extractResumeAction, saveCanonicalResumeAction } from "@/app/actions/ai";

type ResumeState = { id: string; name: string; text: string } | null;

function inferMimeType(file: File): string {
  if (file.type) return file.type;
  return file.name.toLowerCase().endsWith(".pdf")
    ? "application/pdf"
    : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}

export default function ResumeManager({ initialResume }: { initialResume: ResumeState }) {
  const [resumeId, setResumeId] = useState(initialResume?.id || "");
  const [resumeName, setResumeName] = useState(initialResume?.name || "");
  const [text, setText] = useState(initialResume?.text || "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(Boolean(initialResume));
  const [message, setMessage] = useState("");

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setSaved(false);
    setMessage("");
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("Choose a file smaller than 5 MB");
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Could not read the selected file"));
        reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
        reader.readAsDataURL(file);
      });
      const result = await extractResumeAction({ base64, mimeType: inferMimeType(file), filename: file.name });
      setResumeId(result.resumeId);
      setResumeName(file.name.replace(/\.[^.]+$/, ""));
      setText(result.text);
      setMessage("Extraction complete. Review the text, then save it as your canonical resume.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The resume could not be processed.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  const saveResume = async () => {
    if (!resumeId || !text.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      await saveCanonicalResumeAction(resumeId, text);
      setSaved(true);
      setMessage("Canonical resume saved. Application Studio will now use this version.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The resume could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-heading">Resume Manager</h1>
        <p className="mt-1 text-text-muted">Keep one reviewed canonical resume for matching and application drafts.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border-light bg-bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-muted">Upload resume</h2>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-hover p-8 text-center transition hover:border-primary-teal hover:bg-bg-hover">
              <UploadCloud size={32} className="mb-3 text-primary-teal" />
              <span className="text-sm font-bold text-text-charcoal">Choose PDF or DOCX</span>
              <span className="mt-1 text-xs text-text-muted">Private storage · maximum 5 MB</span>
              <input
                type="file"
                className="sr-only"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleUpload}
                disabled={busy}
              />
            </label>
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-bg-secondary p-3 text-xs text-text-muted">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary-teal" />
              Your source file is stored in your private Supabase folder and is never made public.
            </div>
          </div>
        </aside>

        <section className="lg:col-span-2">
          <div className="flex h-full min-h-[520px] flex-col rounded-2xl border border-border-light bg-bg-card p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">Canonical resume</h2>
                {resumeName && <p className="mt-1 text-sm font-medium text-text-charcoal">{resumeName}</p>}
              </div>
              {text && (
                <button
                  type="button"
                  onClick={saveResume}
                  disabled={busy || saved}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-teal px-4 py-2 text-sm font-bold text-bg-main disabled:opacity-60"
                >
                  {saved && <CheckCircle2 size={16} />}
                  {busy ? "Saving…" : saved ? "Saved" : "Save canonical resume"}
                </button>
              )}
            </div>

            {text ? (
              <textarea
                className="min-h-[400px] flex-1 resize-y rounded-xl border border-border-light bg-bg-input p-4 text-sm leading-relaxed text-text-charcoal outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange"
                value={text}
                maxLength={100000}
                onChange={(event) => { setText(event.target.value); setSaved(false); }}
                aria-label="Canonical resume text"
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border-light bg-bg-hover/50 p-8 text-center text-text-muted">
                <FileText size={36} className="mb-3 opacity-50" />
                <p className="font-bold text-text-heading">No canonical resume yet</p>
                <p className="mt-2 max-w-sm text-sm">Upload a resume and review the extracted text before using it in matching or applications.</p>
              </div>
            )}
            <p className="mt-4 min-h-5 text-sm text-text-muted" role="status" aria-live="polite">{message}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
