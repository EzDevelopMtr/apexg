import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "success" | "warning" | "danger";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-orange-100 text-orange-700",
  danger: "bg-red-100 text-red-700",
};

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

/**
 * A status pill.
 *
 * The tone is a visual concern the caller chooses; mapping a domain state to a
 * tone belongs in the module that owns that state, not here.
 */
export default function Badge({ tone = "neutral", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
