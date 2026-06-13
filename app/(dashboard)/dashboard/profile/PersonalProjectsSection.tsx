"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PersonalProjectEntry } from "./types";
import { BulletsInput } from "@/app/components/BulletsInput";

type Props = {
  initialEntries: PersonalProjectEntry[];
};

type FormState = {
  title: string;
  url: string;
  bullets: string[];
};

const emptyForm: FormState = {
  title: "",
  url: "",
  bullets: [],
};

function entryToForm(entry: PersonalProjectEntry): FormState {
  return {
    title: entry.title,
    url: entry.url ?? "",
    bullets: entry.bullets,
  };
}

function formToPayload(form: FormState) {
  return {
    title: form.title,
    url: form.url,
    bullets: form.bullets.map((b) => b.trim()).filter(Boolean),
  };
}

type ProjectFormProps = {
  initialValues?: PersonalProjectEntry;
  onSave: (payload: ReturnType<typeof formToPayload>) => Promise<boolean>;
  onCancel: () => void;
};

function ProjectForm({ initialValues, onSave, onCancel }: ProjectFormProps) {
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
    if (!ok) setError("Failed to save. Check the URL and try again.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-[2px] border border-forest/25 bg-forest/5 p-4">
      <div className="space-y-1">
        <label className="block text-xs font-medium text-neutral-600">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          required
          placeholder="Open Source CLI Tool"
          className="w-full rounded-[2px] border border-line-ink bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-neutral-600">URL (optional)</label>
        <input
          type="text"
          value={form.url}
          onChange={(e) => set("url", e.target.value)}
          placeholder="github.com/you/project"
          className="w-full rounded-[2px] border border-line-ink bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-neutral-600">Bullets</label>
        <BulletsInput
          bullets={form.bullets}
          onChange={(bullets) => set("bullets", bullets)}
          placeholder="Built a CLI that automates release notes from commit history"
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
  entry: PersonalProjectEntry;
  onEdit: () => void;
  onDelete: () => Promise<boolean>;
};

function ProjectItem({ entry, onEdit, onDelete }: ItemProps) {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(false);
    const ok = await onDelete();
    setDeleting(false);
    if (!ok) setDeleteError(true);
  }

  return (
    <div className="border-t border-neutral-100 pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{entry.title}</p>
          {entry.url && (
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:text-primary-hover transition-colors break-all"
            >
              {entry.url}
            </a>
          )}
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

export function PersonalProjectsSection({ initialEntries }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function handleAdd(payload: ReturnType<typeof formToPayload>) {
    const res = await fetch("/api/profile/personal-projects", {
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
    const res = await fetch(`/api/profile/personal-projects/${id}`, {
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
    const res = await fetch(`/api/profile/personal-projects/${id}`, { method: "DELETE" });
    if (res.ok) {
      refresh();
      return true;
    }
    return false;
  }

  return (
    <section className="rounded-[2px] border border-line-ink bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl font-medium text-ink">Personal Projects</h2>
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
          <ProjectForm
            onSave={handleAdd}
            onCancel={() => setIsAdding(false)}
          />
        )}

        {initialEntries.length === 0 && !isAdding && (
          <p className="text-sm text-neutral-500">No personal projects added yet.</p>
        )}

        {initialEntries.map((entry) =>
          editingId === entry.id ? (
            <div key={entry.id} className="border-t border-neutral-100 pt-4 first:border-t-0 first:pt-0">
              <ProjectForm
                initialValues={entry}
                onSave={(payload) => handleUpdate(entry.id, payload)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <ProjectItem
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
