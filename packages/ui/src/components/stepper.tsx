import { Minus, Plus } from "lucide-react";

export interface StepperProps {
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly onChange: (value: number) => void;
  /** How the value reads, e.g. "3 días". */
  readonly format: (value: number) => string;
  /** Accessible name of the value, in Spanish. */
  readonly label: string;
}

const STEP =
  "grid h-7 w-[30px] place-items-center rounded-[7px] text-body transition-[transform,background-color] duration-100 ease-out hover:bg-fill-3 active:scale-[0.92] disabled:pointer-events-none disabled:opacity-30";

/** A small number nudged one step at a time: direct manipulation, no typing. */
export default function Stepper({ value, min, max, onChange, format, label }: StepperProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-[10px] bg-fill-2 p-[3px]" role="group" aria-label={label}>
      <button type="button" className={STEP} disabled={value <= min} onClick={() => onChange(value - 1)} aria-label="Menos">
        <Minus size={14} />
      </button>
      <output className="min-w-16 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {format(value)}
      </output>
      <button type="button" className={STEP} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="Más">
        <Plus size={14} />
      </button>
    </span>
  );
}
