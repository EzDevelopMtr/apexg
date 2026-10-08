import Link from "next/link";
import type { Module } from "@apexg/core";
import { ACCENT_GLOW, ACCENT_TILE, Icon } from "@apexg/ui";

/** A module checked now and then: one compact line, still a single click away. */
export default function ManagementModuleCard({ module, href }: { module: Module; href: string | null }) {
  const body = (
    <>
      <span aria-hidden className={`absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${ACCENT_GLOW[module.accent]}`} />
      <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ACCENT_TILE[module.accent]}`}>
        <Icon name={module.icon} size={18} />
      </span>
      <span className="relative min-w-0">
        <span className="block truncate font-semibold text-body">{module.name}</span>
        <span className="block truncate text-xs text-body-faint">{href ? module.description : "Próximamente"}</span>
      </span>
    </>
  );
  const classes = "group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-line bg-panel p-3.5 text-left transition duration-300";

  return href ? (
    <Link href={href} className={`${classes} hover:-translate-y-0.5 hover:shadow-lg`}>
      {body}
    </Link>
  ) : (
    <div aria-disabled="true" className={`${classes} cursor-not-allowed opacity-50`}>
      {body}
    </div>
  );
}
