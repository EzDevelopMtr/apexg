import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "success" | "warning" | "danger";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-idle-soft text-idle-ink",
  success: "bg-ok-soft text-ok-ink",
  warning: "bg-warn-soft text-warn-ink",
  danger: "bg-danger-soft text-danger-ink",
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
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
