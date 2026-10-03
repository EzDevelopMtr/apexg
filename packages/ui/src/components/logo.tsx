"use client";

import { useBrand } from "./brand-context";

export type LogoSize = "sm" | "md" | "lg";

export interface LogoProps {
  size?: LogoSize;
  /** Drops the wordmark and leaves only the peak mark. */
  markOnly?: boolean;
  className?: string;
}

const MARK: Record<LogoSize, string> = {
  sm: "h-7",
  md: "h-10",
  lg: "h-16",
};

const WORDMARK: Record<LogoSize, string> = {
  sm: "text-base",
  md: "text-2xl",
  lg: "text-4xl",
};

const SUBMARK: Record<LogoSize, string> = {
  sm: "text-[0.5rem]",
  md: "text-[0.6rem]",
  lg: "text-xs",
};

const RULE: Record<LogoSize, string> = {
  sm: "w-4",
  md: "w-6",
  lg: "w-10",
};

/** An uploaded logo already carries its own wordmark: it gets the lockup's height. */
const IMAGE: Record<LogoSize, string> = {
  sm: "h-12 max-w-40",
  md: "h-16 max-w-52",
  lg: "h-28 max-w-80",
};

/** "APEX GYM" → ["APEX", "GYM"]: the first word large, the rest under the rule. */
function splitName(name: string): [string, string] {
  const [first = name, ...rest] = name.trim().split(/\s+/);
  return [first, rest.join(" ")];
}

/**
 * The gym's lockup: its uploaded logo, or else a hollow peak with an accented
 * summit over the gym's name — which, for APEX GYM, is its own logo.
 *
 * The drawn mark stays sharp at any size and inherits the accent token — a
 * change of brand colour moves it too. It takes `brand-ink` rather than
 * `brand`: the mark is a thin shape on the darkest surface in the app, where
 * the fill colour would sink into the background.
 */
export default function Logo({
  size = "md",
  markOnly = false,
  className = "",
}: LogoProps) {
  const { name, logoSrc } = useBrand();

  if (logoSrc) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <img src={logoSrc} alt={name} className={`${IMAGE[size]} w-auto object-contain`} />
      </div>
    );
  }

  const [headline, subline] = splitName(name);
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        viewBox="0 0 120 100"
        role="img"
        aria-label={name}
        className={`${MARK[size]} w-auto`}
      >
        <path
          d="M60 2 L118 98 L92 98 L60 44 L28 98 L2 98 Z"
          fill="currentColor"
          className="text-body"
        />
        <path d="M60 54 L80 90 L40 90 Z" className="fill-brand-ink" />
      </svg>

      {!markOnly && (
        <>
          <span
            className={`mt-2 font-bold uppercase leading-none tracking-[0.22em] text-body ${WORDMARK[size]}`}
          >
            {headline}
          </span>
          {subline && (
            <span className="mt-1.5 flex items-center gap-2">
              <span className={`h-px bg-brand-ink ${RULE[size]}`} />
              <span
                className={`font-semibold uppercase leading-none tracking-[0.42em] text-body ${SUBMARK[size]}`}
              >
                {subline}
              </span>
              <span className={`h-px bg-brand-ink ${RULE[size]}`} />
            </span>
          )}
        </>
      )}
    </div>
  );
}
