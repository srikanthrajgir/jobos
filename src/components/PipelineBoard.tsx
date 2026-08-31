"use client";

import { useState } from "react";
import { Briefcase, CalendarClock, GripVertical, Plus, X } from "lucide-react";
import {
  createApplication,
  updateApplicationStage,
  type PipelineApplication,
} from "@/app/actions/pipeline";

const STAGES = [
  { id: "saved", label: "Saved", tone: "bg-slate-400" },
  { id: "draft", label: "Drafting", tone: "bg-violet-400" },
  { id: "applied", label: "Applied", tone: "bg-primary-teal" },
  { id: "interview", label: "Interview", tone: "bg-accent-orange" },
  { id: "offer", label: "Offer", tone: "bg-emerald-500" },
  { id: "accepted", label: "Accepted", tone: "bg-green-600" },
  { id: "rejected", label: "Closed", tone: "bg-rose-400" },
] as const;

type Stage = typeof STAGES[number]["id"];

export default function PipelineBoard({ initialApplications }: { initialApplications: PipelineApplication[] }) {
  const [applications, setApplications] = useState(initialApplications);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const moveApplication = async (id: string, stage: Stage) => {
    const previous = applications;
    setApplications((items) => items.map((item) => item.id === id ? { ...item, status: stage } : item));
    setMessage("");
    try {
      await updateApplicationStage(id, stage);
      setMessage("Application moved.");
    } catch {
      setApplications(previous);
      setMessage("The application could not be moved. Please try again.");
    }
  };

  const addApplication = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await createApplication({ company, title });
      setApplications((items) => [{
        id: result.id,
        companyName: company.trim(),
        roleTitle: title.trim(),
        status: "saved",
        appliedAt: null,
        followUpAt: null,
        notes: "",
        deliveryStatus: "not_required",
        updatedAt: new Date().toISOString(),
      }, ...items]);
      setCompany("");
      setTitle("");
      setShowForm(false);
      setMessage("Application added to Saved.");
    } catch {
      setMessage("The application could not be added. Check the details and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-heading">Application Pipeline</h1>
          <p className="mt-1 text-text-muted">Move each application as your job search progresses.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-teal px-4 py-2.5 font-bold text-bg-main hover:bg-primary-teal-dark"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Cancel" : "Add application"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addApplication} className="grid gap-4 rounded-2xl border border-border-light bg-bg-card p-5 shadow-sm md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="text-sm font-bold text-text-muted">
            Company
            <input
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              required
              maxLength={160}
              className="mt-2 w-full rounded-xl border border-border-light bg-bg-input px-3 py-2.5 font-medium text-text-charcoal outline-none focus:border-primary-teal"
              placeholder="Company name"
            />
          </label>
          <label className="text-sm font-bold text-text-muted">
            Role
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={160}
              className="mt-2 w-full rounded-xl border border-border-light bg-bg-input px-3 py-2.5 font-medium text-text-charcoal outline-none focus:border-primary-teal"
              placeholder="Role title"
            />
          </label>
          <button disabled={busy} className="rounded-xl bg-accent-orange px-5 py-2.5 font-bold text-white disabled:opacity-50">
            {busy ? "Adding…" : "Add"}
          </button>
        </form>
      )}

      <p className="min-h-5 text-sm text-text-muted" role="status" aria-live="polite">{message}</p>

      {applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-hover bg-bg-card p-12 text-center">
          <Briefcase size={40} className="mx-auto mb-4 text-primary-teal" />
          <h2 className="text-xl font-bold text-text-heading">Your pipeline is ready</h2>
          <p className="mx-auto mt-2 max-w-lg text-text-muted">Add an application manually or submit one from Opportunities. It will appear here automatically.</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4" aria-label="Application pipeline board">
          {STAGES.map((stage) => {
            const stageApplications = applications.filter((item) =>
              stage.id === "rejected"
                ? ["rejected", "withdrawn"].includes(item.status)
                : item.status === stage.id,
            );
            return (
              <section
                key={stage.id}
                className="w-[290px] shrink-0 rounded-2xl border border-border-light bg-bg-secondary p-3"
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggedId) void moveApplication(draggedId, stage.id);
                  setDraggedId(null);
                }}
              >
                <header className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${stage.tone}`} />
                    <h2 className="text-sm font-bold uppercase tracking-wide text-text-heading">{stage.label}</h2>
                  </div>
                  <span className="rounded-full bg-bg-card px-2 py-0.5 text-xs font-bold text-text-muted">{stageApplications.length}</span>
                </header>

                <div className="min-h-[160px] space-y-3">
                  {stageApplications.map((application) => (
                    <article
                      key={application.id}
                      draggable
                      onDragStart={() => setDraggedId(application.id)}
                      onDragEnd={() => setDraggedId(null)}
                      className="rounded-xl border border-border-light bg-bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold leading-tight text-text-heading">{application.roleTitle}</h3>
                          <p className="mt-1 text-sm font-medium text-text-charcoal">{application.companyName}</p>
                        </div>
                        <GripVertical size={18} className="shrink-0 cursor-grab text-text-muted" aria-hidden="true" />
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
                        <CalendarClock size={14} />
                        Updated {new Date(application.updatedAt).toLocaleDateString("en-AU")}
                      </div>
                      <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-text-muted">
                        Move to
                        <select
                          value={stage.id === "rejected" && application.status === "withdrawn" ? "withdrawn" : application.status}
                          onChange={(event) => void moveApplication(application.id, event.target.value as Stage)}
                          className="mt-1 w-full rounded-lg border border-border-light bg-bg-input px-2 py-2 text-sm font-medium text-text-charcoal"
                        >
                          {STAGES.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                          <option value="withdrawn">Withdrawn</option>
                        </select>
                      </label>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
