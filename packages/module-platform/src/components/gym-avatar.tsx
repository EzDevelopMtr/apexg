import { deriveBrandPalette, isHexColor } from "@apexg/core";
import { initials } from "../gym-rules";

export type GymAvatarSize = "sm" | "md" | "lg";

const SIZES: Record<GymAvatarSize, string> = {
  sm: "size-7 rounded-lg text-[11px]",
  md: "size-11 rounded-xl text-[15px]",
  lg: "size-16 rounded-[18px] text-[22px]",
};

export interface GymAvatarProps {
  readonly name: string;
  readonly color: string | null;
  /** URL of the uploaded logo, when the gym has one. */
  readonly logoSrc?: string;
  readonly size?: GymAvatarSize;
}

/**
 * The gym's logo, or its initials on its own colour. Text colour comes from
 * the same palette the gym's app uses, so it stays readable on any brand.
 */
export default function GymAvatar({ name, color, logoSrc, size = "md" }: GymAvatarProps) {
  const palette = color && isHexColor(color) ? deriveBrandPalette(color) : undefined;
  const style = logoSrc
    ? undefined
    : palette
      ? { background: palette["--color-brand"], color: palette["--color-brand-contrast"] }
      : undefined;
  return (
    <span
      aria-hidden
      style={style}
      className={`grid shrink-0 place-items-center overflow-hidden font-bold shadow-tile ${SIZES[size]} ${logoSrc ? "bg-shell-soft" : palette ? "" : "bg-brand text-brand-contrast"}`}
    >
      {logoSrc ? <img src={logoSrc} alt="" className="size-[78%] object-contain" /> : initials(name)}
    </span>
  );
}
