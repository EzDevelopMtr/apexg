"use client";

import { useActiveThumb } from "../hooks/use-active-thumb";

export interface SegmentedOption<T extends string> {
  readonly id: T;
  /** User-facing, in Spanish. */
  readonly label: string;
}

export interface SegmentedControlProps<T extends string> {
  readonly options: readonly SegmentedOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  /** Accessible name of the group, in Spanish. */
  readonly label: string;
  readonly size?: "md" | "sm";
}

const BUTTON_SIZE = { md: "px-[18px] py-1.5 text-[13px]", sm: "px-3 py-[5px] text-xs" } as const;

/**
 * A choice among a few peers, with a thumb that slides to the selected one.
 * Selects on pointer-down (feedback before release); the keyboard reaches it
 * through the click a button fires on Enter/Space (`detail === 0`).
 */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
}: SegmentedControlProps<T>) {
  const { container, thumb } = useActiveThumb(value);
  const select = (id: T) => {
    if (id !== value) onChange(id);
  };

  return (
    <div
      ref={container}
      role="tablist"
      aria-label={label}
      className="relative inline-flex rounded-[11px] bg-fill-2 p-[3px]"
    >
      <span
        ref={thumb}
        aria-hidden
        className="absolute bottom-[3px] left-0 top-[3px] rounded-lg bg-fill-3 shadow-raised transition-[transform,width] duration-450 ease-spring-fast motion-reduce:transition-none"
      />
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          data-segment={option.id}
          aria-selected={option.id === value}
          onPointerDown={() => select(option.id)}
          onClick={(event) => event.detail === 0 && select(option.id)}
          className={`relative z-[1] rounded-lg font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink ${BUTTON_SIZE[size]} ${option.id === value ? "text-body" : "text-body-soft hover:text-body-muted"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
