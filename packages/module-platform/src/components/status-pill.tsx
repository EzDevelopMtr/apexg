import type { CompanyStatus } from "@apexg/core";

const STYLES: Record<CompanyStatus, string> = {
  active: "bg-ok-soft text-ok-ink",
  suspended: "bg-warn-soft text-warn-ink",
};

const LABELS: Record<CompanyStatus, string> = {
  active: "Activo",
  suspended: "Suspendido",
};

/** Whether a gym's people can sign in. Status hues, because it is a state. */
export default function StatusPill({ status }: { readonly status: CompanyStatus }) {
  return (
    <span className={`inline-flex h-6 w-max items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold ${STYLES[status]}`}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {LABELS[status]}
    </span>
  );
}
