"use client";

import { useState } from "react";
import { useProfileSection } from "./useProfileSection";
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
    <form onSubmit={handleSubmit} className="space-y-3 rounded-[2px] border border-forest/25 bg-forest/5 p-4">
      <div className="space-y-1">
        <label className="block text-xs font-medium text-muted-strong">Category Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          required
          placeholder="Programming Languages"
          className="w-full rounded-[2px] border border-line-ink bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-muted-strong">
          Skills (comma-separated)
        </label>
        <input
          type="text"
          value={form.skillsText}
          onChange={(e) => set("skillsText", e.target.value)}
          required
          placeholder="TypeScript, Python, Go"
          className="w-full rounded-[2px] border border-line-ink bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
  category: SkillCategoryEntry;
  onEdit: () => void;
  onDelete: () => Promise<boolean>;
};

function SkillCategoryItem({ category, onEdit, onDelete }: ItemProps) {
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
    <div className="border-t border-paper-2 pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground mb-2">{category.name}</p>
          <div className="flex flex-wrap gap-1.5">
            {category.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center border-b border-moss pb-px font-serif text-[13px] italic text-forest"
              >
                {skill}
              </span>
            ))}
          </div>
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

export function SkillsSection({ initialCategories }: Props) {
  const section = useProfileSection<ReturnType<typeof formToPayload>>("skill-categories");

  return (
    <section className="rounded-[2px] border border-line-ink bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl font-medium text-ink">Skills</h2>
        {!section.isAdding && (
          <button
            onClick={section.startAdd}
            className="text-sm text-primary hover:text-primary-hover font-medium transition-colors"
          >
            + Add Category
          </button>
        )}
      </div>

      <div className="space-y-4">
        {section.isAdding && (
          <SkillForm
            onSave={section.create}
            onCancel={section.cancel}
          />
        )}

        {initialCategories.length === 0 && !section.isAdding && (
          <p className="text-sm text-muted">No skill categories added yet.</p>
        )}

        {initialCategories.map((category) =>
          section.editingId === category.id ? (
            <div key={category.id} className="border-t border-paper-2 pt-4 first:border-t-0 first:pt-0">
              <SkillForm
                initialValues={category}
                onSave={(payload) => section.update(category.id, payload)}
                onCancel={section.cancel}
              />
            </div>
          ) : (
            <SkillCategoryItem
              key={category.id}
              category={category}
              onEdit={() => section.startEdit(category.id)}
              onDelete={() => section.remove(category.id)}
            />
          )
        )}
      </div>
    </section>
  );
}
