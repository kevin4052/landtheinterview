"use client";

import Link from "next/link";
import { useState, useRef } from "react";

interface ResumeHistoryItemProps {
  id: string;
  title: string;
  date: string;
}

export function ResumeHistoryItem({ id, title: initialTitle, date }: ResumeHistoryItemProps) {
  const [title, setTitle] = useState(initialTitle);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialTitle);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEditing(e: React.MouseEvent) {
    e.preventDefault();
    setDraft(title);
    setError(null);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function cancel() {
    setEditing(false);
    setError(null);
  }

  async function save() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === title) {
      setEditing(false);
      return;
    }

    const previous = title;
    setTitle(trimmed);
    setEditing(false);

    try {
      const res = await fetch(`/api/resumes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) throw new Error("Save failed");
    } catch {
      setTitle(previous);
      setError("Failed to save title. Please try again.");
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  }

  return (
    <li>
      <div className="py-4 flex items-center justify-between gap-4 hover:bg-paper-2 transition-colors rounded-[2px] px-2 -mx-2 group">
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={save}
              onKeyDown={onKeyDown}
              className="font-serif font-medium text-base w-full bg-transparent border-b border-line-ink outline-none"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href={`/dashboard/history/${id}`}
                className="font-serif font-medium text-base truncate text-ink group-hover:text-forest transition-colors"
              >
                {title}
              </Link>
              <button
                onClick={startEditing}
                aria-label="Rename"
                className="opacity-100 md:opacity-0 group-hover:opacity-100 text-muted hover:text-ink transition-opacity flex-shrink-0"
              >
                <PencilIcon />
              </button>
            </div>
          )}
          {error && (
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          )}
          <p className="text-xs text-muted mt-0.5">{date}</p>
        </div>
        <Link
          href={`/dashboard/history/${id}`}
          className="text-xs text-forest shrink-0"
          tabIndex={-1}
        >
          View →
        </Link>
      </div>
    </li>
  );
}

function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}
