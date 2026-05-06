import type { ResumeJSON, Entry, SectionType } from "@/lib/validators/resumeJson.schema";
import { extractEntryRenderData } from "@/lib/utils/entryRenderData";

function EntryBlock({ entry, type }: { entry: Entry; type: SectionType }) {
  const data = extractEntryRenderData(entry, type);

  if (data.kind === "skill") {
    return (
      <div className="mb-1 text-sm text-zinc-700 dark:text-zinc-300">
        {data.label && (
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
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
        <span className="text-zinc-900 dark:text-zinc-100">{data.label}</span>
        {data.proficiency && (
          <span className="text-zinc-500 dark:text-zinc-400">{data.proficiency}</span>
        )}
      </div>
    );
  }

  return (
    <div className="mb-3">
      <div className="flex justify-between items-baseline gap-2 flex-wrap">
        <div>
          {data.heading && (
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {data.heading}
            </span>
          )}
          {data.subheading && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400 ml-1.5">
              {data.subheading}
            </span>
          )}
        </div>
        {data.date && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">
            {data.date}
          </span>
        )}
      </div>
      {data.body && (
        <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{data.body}</p>
      )}
      {data.bullets.length > 0 && (
        <ul className="mt-1 space-y-0.5">
          {data.bullets.map((b, i) => (
            <li
              key={i}
              className="flex gap-2 text-sm text-zinc-700 dark:text-zinc-300"
            >
              <span className="shrink-0 select-none">•</span>
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
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-8 py-6 text-sm leading-relaxed">
      <div className="text-center mb-5">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {resume.name}
        </h1>
        {resume.contact.length > 0 && (
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-xs">
            {resume.contact.join(" · ")}
          </p>
        )}
      </div>

      {resume.summary && (
        <div className="mb-4">
          <p className="text-zinc-700 dark:text-zinc-300 text-sm">
            {resume.summary}
          </p>
        </div>
      )}

      {resume.sections.map((section, i) => (
        <div key={i} className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700 pb-1 mb-2">
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
