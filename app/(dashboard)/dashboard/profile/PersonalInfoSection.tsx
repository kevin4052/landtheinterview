"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
};

export function PersonalInfoSection({ name, email, phone, location }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [formName, setFormName] = useState(name);
  const [formEmail, setFormEmail] = useState(email);
  const [formPhone, setFormPhone] = useState(phone ?? "");
  const [formLocation, setFormLocation] = useState(location ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleEdit() {
    setFormName(name);
    setFormEmail(email);
    setFormPhone(phone ?? "");
    setFormLocation(location ?? "");
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
      body: JSON.stringify({
        name: formName,
        email: formEmail,
        phone: formPhone,
        location: formLocation,
      }),
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
    <section className="rounded-[2px] border border-line-ink bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl font-medium text-ink">Personal Info</h2>
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
              className="w-full rounded-[2px] border border-line-ink bg-paper px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">Email</label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              required
              className="w-full rounded-[2px] border border-line-ink bg-paper px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">Phone</label>
            <input
              type="tel"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              className="w-full rounded-[2px] border border-line-ink bg-paper px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">Location</label>
            <input
              type="text"
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder="e.g. Austin, TX"
              className="w-full rounded-[2px] border border-line-ink bg-paper px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
              onClick={() => setIsEditing(false)}
              className="rounded-[2px] px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink transition-colors"
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
          <div>
            <dt className="text-xs font-medium text-neutral-500">Phone</dt>
            <dd className="mt-0.5 text-sm text-foreground">{phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-neutral-500">Location</dt>
            <dd className="mt-0.5 text-sm text-foreground">{location || "—"}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
