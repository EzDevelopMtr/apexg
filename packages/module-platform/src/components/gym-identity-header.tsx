import { ExternalLink } from "lucide-react";
import type { PlatformCompany } from "@apexg/core";
import { CopyButton } from "@apexg/ui";
import GymAvatar from "./gym-avatar";
import StatusPill from "./status-pill";

export interface GymIdentityHeaderProps {
  readonly company: PlatformCompany;
  readonly link: string;
  readonly logoSrc?: string;
}

/** Who this gym is, and the public link to hand to its people. */
export default function GymIdentityHeader({ company, link, logoSrc }: GymIdentityHeaderProps) {
  return (
    <div className="pb-1.5 pt-2.5">
      <div className="flex items-center gap-4">
        <GymAvatar name={company.name} color={company.brandColor} logoSrc={logoSrc} size="lg" />
        <div className="min-w-0">
          <div className="truncate text-[22px] font-bold leading-tight tracking-[-0.015em]">{company.name}</div>
          <div className="mt-1.5">
            <StatusPill status={company.status} />
          </div>
        </div>
      </div>
      <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-fill-1 py-1.5 pl-3 pr-1.5">
        <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-body-muted" title={link}>
          {link}
        </span>
        <CopyButton value={link} label="Copiar el link del gimnasio" />
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          aria-label="Abrir la entrada del gimnasio"
          title="Abrir la entrada del gimnasio"
          className="grid size-[30px] place-items-center rounded-lg text-brand-ink transition-[transform,background-color] duration-100 hover:bg-fill-2 active:scale-90"
        >
          <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
}
