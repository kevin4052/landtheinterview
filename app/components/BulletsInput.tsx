"use client";

import { useEffect, useRef } from "react";

type BulletsInputProps = {
  bullets: string[];
  onChange: (bullets: string[]) => void;
  textareaClassName: string;
  placeholder?: string;
};

function autoGrow(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export function BulletsInput({
  bullets,
  onChange,
  textareaClassName,
  placeholder,
}: BulletsInputProps) {
  // A Bullet is always exactly one line; an empty list still shows one row to type into.
  const rows = bullets.length > 0 ? bullets : [""];
  const refs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const pendingFocus = useRef<{ index: number; caret: number } | null>(null);

  useEffect(() => {
    refs.current.length = rows.length;
    refs.current.forEach((el) => el && autoGrow(el));
    if (pendingFocus.current) {
      const { index, caret } = pendingFocus.current;
      pendingFocus.current = null;
      const el = refs.current[index];
      if (el) {
        el.focus();
        el.setSelectionRange(caret, caret);
      }
    }
  });

  // Newlines never persist inside a Bullet: pressing Enter or pasting multi-line
  // text lands here as a value containing "\n", and each line becomes its own row.
  function handleChange(index: number, value: string, caret: number) {
    const parts = value.split("\n");
    if (parts.length > 1) {
      let focusIndex = parts.length - 1;
      let focusCaret = parts[parts.length - 1].length;
      let remaining = caret;
      for (let i = 0; i < parts.length; i++) {
        if (remaining <= parts[i].length) {
          focusIndex = i;
          focusCaret = remaining;
          break;
        }
        remaining -= parts[i].length + 1;
      }
      pendingFocus.current = { index: index + focusIndex, caret: focusCaret };
      onChange([...rows.slice(0, index), ...parts, ...rows.slice(index + 1)]);
      return;
    }
    onChange(rows.map((b, i) => (i === index ? value : b)));
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Backspace" && rows[index] === "" && rows.length > 1) {
      e.preventDefault();
      const next = rows.filter((_, i) => i !== index);
      const target = Math.max(index - 1, 0);
      pendingFocus.current = { index: target, caret: next[target].length };
      onChange(next);
    }
  }

  function handleRemove(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function handleAdd() {
    pendingFocus.current = { index: rows.length, caret: 0 };
    onChange([...rows, ""]);
  }

  const showRemove = rows.length > 1 || rows[0] !== "";

  return (
    <div className="space-y-2">
      {rows.map((bullet, index) => (
        <div key={index} className="flex items-start gap-2">
          <textarea
            ref={(el) => {
              refs.current[index] = el;
            }}
            rows={1}
            value={bullet}
            placeholder={index === 0 ? placeholder : undefined}
            onChange={(e) => handleChange(index, e.target.value, e.target.selectionStart)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={`${textareaClassName} resize-none overflow-hidden`}
          />
          {showRemove && (
            <button
              type="button"
              onClick={() => handleRemove(index)}
              aria-label="Remove bullet"
              className="mt-2 shrink-0 text-muted-soft hover:text-red-500 transition-colors"
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        className="text-sm text-primary hover:text-primary-hover font-medium transition-colors"
      >
        + Add bullet
      </button>
    </div>
  );
}
