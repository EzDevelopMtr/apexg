import type { IconName } from "@apexg/core";
import { ICONS } from "../icons";

export interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

/**
 * Renders an icon by name.
 *
 * Callers pass a name rather than resolving a component themselves, so the
 * lookup stays inside this package and no caller assigns a component to a
 * local variable during render.
 */
export default function Icon({ name, size, className }: IconProps) {
  const Resolved = ICONS[name];
  return <Resolved size={size} className={className} />;
}
