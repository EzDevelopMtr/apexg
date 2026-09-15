import type { ReactNode } from "react";

export interface ModulePageHeaderProps {
  /** Small label above the heading, in Spanish. */
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** The heading block every module page shares. */
export default function ModulePageHeader({
  eyebrow,
  title,
  description,
  action,
}: ModulePageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        {eyebrow && (
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-ink">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-3xl font-bold text-body">{title}</h1>
        {description && <p className="mt-2 text-body-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}
