import type { ResumeJSON, Entry, SectionType } from "@/lib/validators/resumeJson.schema";
import { extractEntryRenderData } from "@/lib/utils/entryRenderData";

function EntryBlock({ entry, type }: { entry: Entry; type: SectionType }) {
  const data = extractEntryRenderData(entry, type);

  if (data.kind === "skill") {
    return (
      <div className="mb-1 text-sm text-ink-soft">
        {data.label && (
          <span className="font-medium text-ink">
            {data.label}:{" "}
          </span>
        )}
        {data.value}
      </div>
    );
  }

  if (data.kind === "language") {
    return (
      <div className="flex justify-between items-baseline mb-1 text-sm">
        <span className="text-ink">{data.label}</span>
        {data.proficiency && (
          <span className="text-muted">{data.proficiency}</span>
        )}
      </div>
    );
  }

  return (
    <div className="mb-3">
      <div className="flex justify-between items-baseline gap-2 flex-wrap">
        <div>
          {data.heading && (
            <span className="text-sm font-medium text-ink">
              {data.heading}
            </span>
          )}
          {data.subheading && (
            <span className="text-sm text-muted ml-1.5">
              {data.subheading}
            </span>
          )}
        </div>
        {data.date && (
          <span className="text-xs text-muted shrink-0">
            {data.date}
          </span>
        )}
      </div>
      {data.body && (
        <p className="text-sm text-ink-soft mt-0.5">{data.body}</p>
      )}
      {data.bullets.length > 0 && (
        <ul className="mt-1 space-y-0.5">
          {data.bullets.map((b, i) => (
            <li
              key={i}
              className="flex gap-2 text-sm text-ink-soft"
            >
              <span className="shrink-0 select-none text-moss">—</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ResumePreview({ resume }: { resume: ResumeJSON }) {
  return (
    <div className="relative border border-line-ink bg-card px-8 py-6 text-sm leading-relaxed shadow-[10px_12px_0_-2px_var(--paper-2),10px_12px_0_-1px_var(--line-ink)]">
      <span className="absolute -top-[11px] right-[22px] bg-paper px-2.5 text-[11px] uppercase tracking-[0.18em] text-muted">
        Specimen
      </span>
      <div className="text-center mb-5">
        <h1 className="font-serif text-2xl font-medium tracking-tight text-ink">
          {resume.name}
        </h1>
        {resume.contact.length > 0 && (
          <p className="text-muted mt-1 text-xs">
            {resume.contact.join(" · ")}
          </p>
        )}
      </div>

      {resume.summary && (
        <div className="mb-4">
          <p className="text-ink-soft text-sm">
            {resume.summary}
          </p>
        </div>
      )}

      {resume.sections.map((section, i) => (
        <div key={i} className="mb-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-forest border-b border-line-ink pb-1 mb-2">
            {section.title}
          </h2>
          {section.entries.map((entry, j) => (
            <EntryBlock key={j} entry={entry} type={section.type} />
          ))}
        </div>
      ))}
    </div>
  );
}
