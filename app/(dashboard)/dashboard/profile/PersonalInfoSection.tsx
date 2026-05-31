"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  name: string;
  email: string;
};

export function PersonalInfoSection({ name, email }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [formName, setFormName] = useState(name);
  const [formEmail, setFormEmail] = useState(email);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleEdit() {
    setFormName(name);
    setFormEmail(email);
    setError(null);
    setIsEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formName, email: formEmail }),
    });
    setSaving(false);
    if (res.ok) {
      setIsEditing(false);
      startTransition(() => router.refresh());
    } else {
      setError("Failed to save. Please try again.");
    }
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Personal Info</h2>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="text-sm text-primary hover:text-primary-hover font-medium transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">Name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">Email</label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
              onClick={() => setIsEditing(false)}
              className="rounded-md px-4 py-2 text-sm font-medium text-neutral-600 hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <dl className="space-y-3">
          <div>
            <dt className="text-xs font-medium text-neutral-500">Name</dt>
            <dd className="mt-0.5 text-sm text-foreground">{name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-neutral-500">Email</dt>
            <dd className="mt-0.5 text-sm text-foreground">{email}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
