import type { ReactNode } from "react";
import { Card, CardBody } from "@apexg/ui";

export interface KpiCardProps {
  /** Label, in Spanish. */
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "positive" | "negative";
  icon?: ReactNode;
}

const TONES = {
  neutral: "text-body",
  positive: "text-ok-ink",
  negative: "text-danger-ink",
} as const;

export default function KpiCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon,
}: KpiCardProps) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-body-soft">
            {label}
          </p>
          {icon && <span className="text-body-faint">{icon}</span>}
        </div>
        <p className={`mt-2 text-2xl font-bold ${TONES[tone]}`}>{value}</p>
        {hint && <p className="mt-1 text-sm text-body-soft">{hint}</p>}
      </CardBody>
    </Card>
  );
}
