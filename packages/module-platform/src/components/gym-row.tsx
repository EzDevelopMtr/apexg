import { ChevronRight } from "lucide-react";
import type { PlatformCompany } from "@apexg/core";
import GymAvatar from "./gym-avatar";
import StatusPill from "./status-pill";

export interface GymRowProps {
  readonly company: PlatformCompany;
  readonly logoSrc?: string;
  readonly onOpen: (id: string) => void;
  /** An inset hairline above every row but the first. */
  readonly separated: boolean;
}

const COLUMNS = "grid grid-cols-[44px_minmax(0,1fr)_auto_20px] items-center gap-4 px-[18px] md:grid-cols-[44px_minmax(0,1.6fr)_120px_110px_90px_24px]";

export const LIST_COLUMNS = COLUMNS;

/** One gym. The whole row is the button: it presses in on pointer-down. */
export default function GymRow({ company, logoSrc, onOpen, separated }: GymRowProps) {
  const dimmed = company.status === "suspended" ? "opacity-55" : "";
  return (
    <button
      type="button"
      onClick={() => onOpen(company.id)}
      className={`${COLUMNS} relative min-h-[68px] w-full text-left transition-[background-color,transform] duration-100 ease-out hover:bg-fill-1 ${separated ? "before:absolute before:left-[78px] before:right-0 before:top-0 before:h-px before:bg-hairline" : ""} focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-ink active:scale-[0.995] active:bg-fill-2`}
    >
      <span className={dimmed}>
        <GymAvatar name={company.name} color={company.brandColor} logoSrc={logoSrc} />
      </span>
      <span className={`min-w-0 ${dimmed}`}>
        <span className="block truncate text-[15px] font-semibold tracking-[-0.01em]">{company.name}</span>
        <span className="font-mono text-xs text-body-faint">/{company.slug}</span>
      </span>
      <StatusPill status={company.status} />
      <span className="hidden text-right text-[15px] font-semibold tabular-nums md:block">
        {company.activeClients.toLocaleString("es-CO")}
        <small className="block text-[11px] font-medium text-body-faint">clientes</small>
      </span>
      <span className="hidden text-right text-[15px] font-semibold tabular-nums md:block">
        {company.users}
        <small className="block text-[11px] font-medium text-body-faint">usuarios</small>
      </span>
      <ChevronRight size={18} className="text-body-faint" aria-hidden />
    </button>
  );
}
