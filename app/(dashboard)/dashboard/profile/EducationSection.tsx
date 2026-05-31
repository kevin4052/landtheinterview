"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EducationEntry } from "./types";
import { toMonthInput, formatMonth } from "./dateUtils";

type Props = {
  initialEntries: EducationEntry[];
};

type FormState = {
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
};

const emptyForm: FormState = {
  school: "",
  degree: "",
  fieldOfStudy: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
};

function entryToForm(entry: EducationEntry): FormState {
  return {
    school: entry.school,
    degree: entry.degree,
    fieldOfStudy: entry.fieldOfStudy,
    startDate: toMonthInput(entry.startDate),
    endDate: toMonthInput(entry.endDate),
    isCurrent: entry.isCurrent,
  };
}

function formToPayload(form: FormState) {
  return {
    school: form.school,
    degree: form.degree,
    fieldOfStudy: form.fieldOfStudy,
    startDate: form.startDate,
    endDate: form.isCurrent ? undefined : form.endDate || undefined,
    isCurrent: form.isCurrent,
  };
}

type EduFormProps = {
  initialValues?: EducationEntry;
  onSave: (payload: ReturnType<typeof formToPayload>) => Promise<boolean>;
  onCancel: () => void;
};

function EduForm({ initialValues, onSave, onCancel }: EduFormProps) {
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
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="space-y-1">
        <label className="block text-xs font-medium text-neutral-600">School</label>
        <input
          type="text"
          value={form.school}
          onChange={(e) => set("school", e.target.value)}
          required
          placeholder="University of Texas at Austin"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-600">Degree</label>
          <input
            type="text"
            value={form.degree}
            onChange={(e) => set("degree", e.target.value)}
            required
            placeholder="Bachelor of Science"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-600">Field of Study</label>
          <input
            type="text"
            value={form.fieldOfStudy}
            onChange={(e) => set("fieldOfStudy", e.target.value)}
            required
            placeholder="Computer Science"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-600">Start Date</label>
          <input
            type="month"
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-600">End Date</label>
          <input
            type="month"
            value={form.endDate}
            onChange={(e) => set("endDate", e.target.value)}
            disabled={form.isCurrent}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-neutral-100 disabled:text-neutral-400"
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
        Currently enrolled
      </label>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm font-medium text-neutral-600 hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

type ItemProps = {
  entry: EducationEntry;
  onEdit: () => void;
  onDelete: () => Promise<boolean>;
};

function EduItem({ entry, onEdit, onDelete }: ItemProps) {
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
          <p className="text-sm font-semibold text-foreground">{entry.school}</p>
          <p className="text-sm text-neutral-600">
            {entry.degree} · {entry.fieldOfStudy}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">{dateRange}</p>
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

export function EducationSection({ initialEntries }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function handleAdd(payload: ReturnType<typeof formToPayload>) {
    const res = await fetch("/api/profile/education", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setIsAdding(false);
      refresh();
      return true;
    }
    return false;
  }

  async function handleUpdate(id: string, payload: ReturnType<typeof formToPayload>) {
    const res = await fetch(`/api/profile/education/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setEditingId(null);
      refresh();
      return true;
    }
    return false;
  }

  async function handleDelete(id: string): Promise<boolean> {
    const res = await fetch(`/api/profile/education/${id}`, { method: "DELETE" });
    if (res.ok) {
      refresh();
      return true;
    }
    return false;
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Education</h2>
        {!isAdding && (
          <button
            onClick={() => { setIsAdding(true); setEditingId(null); }}
            className="text-sm text-primary hover:text-primary-hover font-medium transition-colors"
          >
            + Add
          </button>
        )}
      </div>

      <div className="space-y-4">
        {isAdding && (
          <EduForm
            onSave={handleAdd}
            onCancel={() => setIsAdding(false)}
          />
        )}

        {initialEntries.length === 0 && !isAdding && (
          <p className="text-sm text-neutral-500">No education added yet.</p>
        )}

        {initialEntries.map((entry) =>
          editingId === entry.id ? (
            <div key={entry.id} className="border-t border-neutral-100 pt-4 first:border-t-0 first:pt-0">
              <EduForm
                initialValues={entry}
                onSave={(payload) => handleUpdate(entry.id, payload)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <EduItem
              key={entry.id}
              entry={entry}
              onEdit={() => { setEditingId(entry.id); setIsAdding(false); }}
              onDelete={() => handleDelete(entry.id)}
            />
          )
        )}
      </div>
    </section>
  );
}
