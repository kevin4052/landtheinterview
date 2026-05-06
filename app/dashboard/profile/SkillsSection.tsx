"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SkillCategoryEntry } from "./types";

type Props = {
  initialCategories: SkillCategoryEntry[];
};

type FormState = {
  name: string;
  skillsText: string;
};

const emptyForm: FormState = { name: "", skillsText: "" };

function entryToForm(entry: SkillCategoryEntry): FormState {
  return {
    name: entry.name,
    skillsText: entry.skills.join(", "),
  };
}

function formToPayload(form: FormState) {
  return {
    name: form.name,
    skills: form.skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

type SkillFormProps = {
  initialValues?: SkillCategoryEntry;
  onSave: (payload: ReturnType<typeof formToPayload>) => Promise<boolean>;
  onCancel: () => void;
};

function SkillForm({ initialValues, onSave, onCancel }: SkillFormProps) {
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
    const payload = formToPayload(form);
    if (payload.skills.length === 0) {
      setError("Add at least one skill.");
      return;
    }
    setSaving(true);
    setError(null);
    const ok = await onSave(payload);
    setSaving(false);
    if (!ok) setError("Failed to save. Please try again.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="space-y-1">
        <label className="block text-xs font-medium text-neutral-600">Category Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          required
          placeholder="Programming Languages"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-neutral-600">
          Skills (comma-separated)
        </label>
        <input
          type="text"
          value={form.skillsText}
          onChange={(e) => set("skillsText", e.target.value)}
          required
          placeholder="TypeScript, Python, Go"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

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
  category: SkillCategoryEntry;
  onEdit: () => void;
  onDelete: () => void;
};

function SkillCategoryItem({ category, onEdit, onDelete }: ItemProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  }

  return (
    <div className="border-t border-neutral-100 pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground mb-2">{category.name}</p>
          <div className="flex flex-wrap gap-1.5">
            {category.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-3">
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
      </div>
    </div>
  );
}

export function SkillsSection({ initialCategories }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function handleAdd(payload: ReturnType<typeof formToPayload>) {
    const res = await fetch("/api/profile/skill-categories", {
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
    const res = await fetch(`/api/profile/skill-categories/${id}`, {
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

  async function handleDelete(id: string) {
    const res = await fetch(`/api/profile/skill-categories/${id}`, { method: "DELETE" });
    if (res.ok) refresh();
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Skills</h2>
        {!isAdding && (
          <button
            onClick={() => { setIsAdding(true); setEditingId(null); }}
            className="text-sm text-primary hover:text-primary-hover font-medium transition-colors"
          >
            + Add Category
          </button>
        )}
      </div>

      <div className="space-y-4">
        {isAdding && (
          <SkillForm
            onSave={handleAdd}
            onCancel={() => setIsAdding(false)}
          />
        )}

        {initialCategories.length === 0 && !isAdding && (
          <p className="text-sm text-neutral-500">No skill categories added yet.</p>
        )}

        {initialCategories.map((category) =>
          editingId === category.id ? (
            <div key={category.id} className="border-t border-neutral-100 pt-4 first:border-t-0 first:pt-0">
              <SkillForm
                initialValues={category}
                onSave={(payload) => handleUpdate(category.id, payload)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <SkillCategoryItem
              key={category.id}
              category={category}
              onEdit={() => { setEditingId(category.id); setIsAdding(false); }}
              onDelete={() => handleDelete(category.id)}
            />
          )
        )}
      </div>
    </section>
  );
}
