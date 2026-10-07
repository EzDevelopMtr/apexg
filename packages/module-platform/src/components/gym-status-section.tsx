import { Pause, Play } from "lucide-react";
import type { CompanyStatus } from "@apexg/core";
import { materialButton } from "@apexg/ui";
import Section from "./section";

export interface GymStatusSectionProps {
  readonly status: CompanyStatus;
  readonly busy: boolean;
  readonly onToggle: () => void;
}

/** Suspend or bring back a gym. Reversible, so it asks nothing: the toast offers undo. */
export default function GymStatusSection({ status, busy, onToggle }: GymStatusSectionProps) {
  const suspended = status === "suspended";
  return (
    <Section title="Estado">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{suspended ? "Reactivar gimnasio" : "Suspender gimnasio"}</div>
          <div className="text-xs text-body-faint">
            {suspended ? "Sus usuarios vuelven a poder iniciar sesión." : "Nadie del gimnasio puede entrar. Se puede deshacer."}
          </div>
        </div>
        <button type="button" disabled={busy} onClick={onToggle} className={materialButton(suspended ? "primary" : "destructive", "sm")}>
          {suspended ? <Play size={15} /> : <Pause size={15} />}
          {suspended ? "Reactivar" : "Suspender"}
        </button>
      </div>
    </Section>
  );
}
