"use client";

import { useState } from "react";
import { useProfileSection } from "./useProfileSection";
import type { WorkExperienceEntry } from "./types";
import { toMonthInput, formatMonth } from "./dateUtils";
import { BulletsInput } from "@/app/components/BulletsInput";

type Props = {
  initialEntries: WorkExperienceEntry[];
};

type FormState = {
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  bullets: string[];
};

const emptyForm: FormState = {
  company: "",
  title: "",
  location: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  bullets: [],
};

function entryToForm(entry: WorkExperienceEntry): FormState {
  return {
    company: entry.company,
    title: entry.title,
    location: entry.location ?? "",
    startDate: toMonthInput(entry.startDate),
    endDate: toMonthInput(entry.endDate),
    isCurrent: entry.isCurrent,
    bullets: entry.bullets,
  };
}

function formToPayload(form: FormState) {
  return {
    company: form.company,
    title: form.title,
    location: form.location || undefined,
    startDate: form.startDate,
    endDate: form.isCurrent ? undefined : form.endDate || undefined,
    isCurrent: form.isCurrent,
    bullets: form.bullets.map((b) => b.trim()).filter(Boolean),
  };
}

type WorkExpFormProps = {
  initialValues?: WorkExperienceEntry;
  onSave: (payload: ReturnType<typeof formToPayload>) => Promise<boolean>;
  onCancel: () => void;
};

function WorkExpForm({ initialValues, onSave, onCancel }: WorkExpFormProps) {
  const [form, setForm] = useState<FormState>(
    initialValues ? entryToForm(initialValues) : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const ok = await onSave(formToPayload(form));
    setSaving(false);
    if (!ok) setError("Failed to save. Please try again.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-[2px] border border-forest/25 bg-forest/5 p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-600">Company</label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => set("company", e.target.value)}
            required
            placeholder="Acme Corp"
            className="w-full rounded-[2px] border border-line-ink bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-600">Job Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
            placeholder="Software Engineer"
            className="w-full rounded-[2px] border border-line-ink bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-neutral-600">Location (optional)</label>
        <input
          type="text"
          value={form.location}
          onChange={(e) => set("location", e.target.value)}
          placeholder="San Francisco, CA"
          className="w-full rounded-[2px] border border-line-ink bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-600">Start Date</label>
          <input
            type="month"
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            required
            className="w-full rounded-[2px] border border-line-ink bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-600">End Date</label>
          <input
            type="month"
            value={form.endDate}
            onChange={(e) => set("endDate", e.target.value)}
            disabled={form.isCurrent}
            className="w-full rounded-[2px] border border-line-ink bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-neutral-100 disabled:text-neutral-400"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={form.isCurrent}
          onChange={(e) => set("isCurrent", e.target.checked)}
          className="h-4 w-4 rounded border-neutral-300 text-primary"
        />
        Currently working here
      </label>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-neutral-600">Bullets</label>
        <BulletsInput
          bullets={form.bullets}
          onChange={(bullets) => set("bullets", bullets)}
          placeholder="Built a distributed caching layer that reduced API latency by 40%"
          textareaClassName="w-full rounded-[2px] border border-line-ink bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-[2px] border border-forest bg-forest px-4 py-2 text-sm font-semibold text-paper transition-colors hover:border-ink hover:bg-ink disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[2px] px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

type ItemProps = {
  entry: WorkExperienceEntry;
  onEdit: () => void;
  onDelete: () => Promise<boolean>;
};

function WorkExpItem({ entry, onEdit, onDelete }: ItemProps) {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(false);
    const ok = await onDelete();
    setDeleting(false);
    if (!ok) setDeleteError(true);
  }

  const dateRange = `${formatMonth(entry.startDate)} – ${
    entry.isCurrent ? "Present" : entry.endDate ? formatMonth(entry.endDate) : ""
  }`;

  return (
    <div className="border-t border-neutral-100 pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{entry.title}</p>
          <p className="text-sm text-neutral-600">{entry.company}</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            {dateRange}
            {entry.location ? ` · ${entry.location}` : ""}
          </p>
          {entry.bullets.length > 0 && (
            <ul className="mt-2 space-y-1">
              {entry.bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-xs text-neutral-600">
                  <span className="mt-0.5 shrink-0 text-neutral-400">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex gap-3">
            <button
              onClick={onEdit}
              className="text-sm text-primary hover:text-primary-hover font-medium transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm text-red-500 hover:text-red-600 transition-colors disabled:opacity-60"
            >
              {deleting ? "…" : "Delete"}
            </button>
          </div>
          {deleteError && (
            <p className="text-xs text-red-500">Failed to delete. Try again.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function WorkExperienceSection({ initialEntries }: Props) {
  const section = useProfileSection<ReturnType<typeof formToPayload>>("work-experience");

  return (
    <section className="rounded-[2px] border border-line-ink bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl font-medium text-ink">Work Experience</h2>
        {!section.isAdding && (
          <button
            onClick={section.startAdd}
            className="text-sm text-primary hover:text-primary-hover font-medium transition-colors"
          >
            + Add
          </button>
        )}
      </div>

      <div className="space-y-4">
        {section.isAdding && (
          <WorkExpForm
            onSave={section.create}
            onCancel={section.cancel}
          />
        )}

        {initialEntries.length === 0 && !section.isAdding && (
          <p className="text-sm text-neutral-500">No work experience added yet.</p>
        )}

        {initialEntries.map((entry) =>
          section.editingId === entry.id ? (
            <div key={entry.id} className="border-t border-neutral-100 pt-4 first:border-t-0 first:pt-0">
              <WorkExpForm
                initialValues={entry}
                onSave={(payload) => section.update(entry.id, payload)}
                onCancel={section.cancel}
              />
            </div>
          ) : (
            <WorkExpItem
              key={entry.id}
              entry={entry}
              onEdit={() => section.startEdit(entry.id)}
              onDelete={() => section.remove(entry.id)}
            />
          )
        )}
      </div>
    </section>
  );
}
