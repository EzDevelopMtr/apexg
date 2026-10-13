"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@apexg/ui";
import { useTheme } from "../lib/theme";

const ICON = "absolute inset-0 m-auto transition-[transform,opacity] duration-600 ease-spring motion-reduce:transition-none";
const SHOWN = "rotate-0 scale-100 opacity-100";
const HIDDEN_SUN = "-rotate-90 scale-50 opacity-0";
const HIDDEN_MOON = "rotate-90 scale-50 opacity-0";

/** Alterna entre el tema oscuro y el claro; la elección queda en este navegador. */
export default function ThemeSwitch() {
  const [theme, setTheme] = useTheme();
  const dark = theme === "dark";
  const label = dark ? "Cambiar a tema claro" : "Cambiar a tema oscuro";
  return (
    <Button variant="ghost" size="sm" onClick={() => setTheme(dark ? "light" : "dark")} aria-label={label} title={label}>
      {/* Los dos íconos están siempre: uno gira y se encoge mientras el otro entra. */}
      <span className="relative block h-[18px] w-[18px]">
        <Sun size={18} className={`${ICON} ${dark ? SHOWN : HIDDEN_SUN}`} />
        <Moon size={18} className={`${ICON} ${dark ? HIDDEN_MOON : SHOWN}`} />
      </span>
    </Button>
  );
}
