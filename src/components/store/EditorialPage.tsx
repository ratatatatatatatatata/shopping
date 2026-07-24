import type { ReactNode } from "react";

/**
 * Shared editorial layout for static/policy pages.
 * Body text is split into paragraphs on blank lines.
 */
export function EditorialPage({
  kicker = "ХЭТ",
  title,
  subtitle,
  body,
  children,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  body: string;
  children?: ReactNode;
}) {
  const paragraphs = body
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-400">
        {kicker}
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
        {title}
      </h1>
      {subtitle && <p className="mt-3 text-neutral-500">{subtitle}</p>}
      <div className="mt-8 space-y-5 border-t border-ink/10 pt-8">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-[15px] leading-relaxed text-neutral-700">
            {p}
          </p>
        ))}
      </div>
      {children}
    </div>
  );
}
