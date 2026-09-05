import type { ReactNode } from "react";

export interface PageHeaderProps {
  /** Small label above the heading, in Spanish. */
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        {eyebrow && (
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-3xl font-bold text-slate-900">{title}</h1>
        {description && <p className="mt-2 text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
