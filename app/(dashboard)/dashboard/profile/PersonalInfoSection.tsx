"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ContactLink } from "@/lib/db/schema";

const LABEL_SUGGESTIONS = ["LinkedIn", "GitHub", "X", "Portfolio", "Website"];

type Props = {
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  contactLinks: ContactLink[];
};

export function PersonalInfoSection({ name, email, phone, location, contactLinks }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [formName, setFormName] = useState(name);
  const [formEmail, setFormEmail] = useState(email);
  const [formPhone, setFormPhone] = useState(phone ?? "");
  const [formLocation, setFormLocation] = useState(location ?? "");
  const [formLinks, setFormLinks] = useState<ContactLink[]>(contactLinks);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleEdit() {
    setFormName(name);
    setFormEmail(email);
    setFormPhone(phone ?? "");
    setFormLocation(location ?? "");
    setFormLinks(contactLinks);
    setError(null);
    setIsEditing(true);
  }

  function updateLink(index: number, patch: Partial<ContactLink>) {
    setFormLinks((links) =>
      links.map((link, i) => (i === index ? { ...link, ...patch } : link))
    );
  }

  function removeLink(index: number) {
    setFormLinks((links) => links.filter((_, i) => i !== index));
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
        contactLinks: formLinks,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setIsEditing(false);
      startTransition(() => router.refresh());
    } else if (res.status === 400) {
      setError("Check your links — each needs a label and a valid URL.");
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
            <label className="block text-xs font-medium text-muted-strong">Name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              className="w-full rounded-[2px] border border-line-ink bg-paper px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted-strong">Email</label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              required
              className="w-full rounded-[2px] border border-line-ink bg-paper px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted-strong">Phone</label>
            <input
              type="tel"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              className="w-full rounded-[2px] border border-line-ink bg-paper px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted-strong">Location</label>
            <input
              type="text"
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder="e.g. Austin, TX"
              className="w-full rounded-[2px] border border-line-ink bg-paper px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted-strong">Links</label>
            <datalist id="contact-link-label-suggestions">
              {LABEL_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <div className="space-y-2">
              {formLinks.map((link, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => updateLink(i, { label: e.target.value })}
                    list="contact-link-label-suggestions"
                    placeholder="Label"
                    required
                    maxLength={40}
                    className="w-28 shrink-0 rounded-[2px] border border-line-ink bg-paper px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) => updateLink(i, { url: e.target.value })}
                    placeholder="linkedin.com/in/you"
                    required
                    className="w-full rounded-[2px] border border-line-ink bg-paper px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(i)}
                    aria-label="Remove link"
                    className="shrink-0 px-2 text-sm text-ink-soft hover:text-red-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setFormLinks((links) => [...links, { label: "", url: "" }])}
              className="text-sm text-primary hover:text-primary-hover font-medium transition-colors"
            >
              + Add link
            </button>
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
            <dt className="text-xs font-medium text-muted">Name</dt>
            <dd className="mt-0.5 text-sm text-foreground">{name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted">Email</dt>
            <dd className="mt-0.5 text-sm text-foreground">{email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted">Phone</dt>
            <dd className="mt-0.5 text-sm text-foreground">{phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted">Location</dt>
            <dd className="mt-0.5 text-sm text-foreground">{location || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted">Links</dt>
            {contactLinks.length === 0 ? (
              <dd className="mt-0.5 text-sm text-foreground">—</dd>
            ) : (
              contactLinks.map((link, i) => (
                <dd key={i} className="mt-0.5 text-sm text-foreground">
                  {link.label}:{" "}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-hover transition-colors break-all"
                  >
                    {link.url}
                  </a>
                </dd>
              ))
            )}
          </div>
        </dl>
      )}
    </section>
  );
}
