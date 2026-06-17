"use client";

import { useState, useRef } from "react";

interface ResumeTitleEditorProps {
  id: string;
  title: string;
}

export function ResumeTitleEditor({ id, title: initialTitle }: ResumeTitleEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialTitle);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEditing() {
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
    <div>
      <div className="flex items-center gap-2 group">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={onKeyDown}
            className="font-serif text-3xl font-medium tracking-tight text-ink bg-transparent border-b border-line-ink outline-none w-full"
            autoFocus
          />
        ) : (
          <>
            <h1 className="font-serif text-3xl font-medium tracking-tight text-ink">
              {title}
            </h1>
            <button
              onClick={startEditing}
              aria-label="Rename"
              className="opacity-100 md:opacity-0 group-hover:opacity-100 text-muted hover:text-ink transition-opacity flex-shrink-0"
            >
              <PencilIcon />
            </button>
          </>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}

function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
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
