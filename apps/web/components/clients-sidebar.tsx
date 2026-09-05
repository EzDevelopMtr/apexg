"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CLIENT_SECTIONS } from "@apexg/core";
import {
  Icon,
  SidebarLabel,
  SidebarShell,
  sidebarItemClasses,
} from "@apexg/ui";

export const CLIENTS_BASE_PATH = "/modules/clients";

export default function ClientsSidebar() {
  const currentPath = usePathname();

  return (
    <SidebarShell
      title="CLIENTES"
      subtitle="APEX GYM"
      iconName="users"
      footer={
        <Link
          href="/modules"
          className="flex h-12 w-full items-center rounded-xl px-3 text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={21} className="shrink-0" />
          <SidebarLabel>Cambiar módulo</SidebarLabel>
        </Link>
      }
    >
      {CLIENT_SECTIONS.map((section) => {
        const path = `${CLIENTS_BASE_PATH}/${section.id}`;
        const active = currentPath === path;

        return (
          <Link
            key={section.id}
            href={path}
            aria-current={active ? "page" : undefined}
            className={sidebarItemClasses(active)}
          >
            <Icon name={section.icon} size={21} className="shrink-0" />
            <SidebarLabel>{section.label}</SidebarLabel>
          </Link>
        );
      })}
    </SidebarShell>
  );
}
