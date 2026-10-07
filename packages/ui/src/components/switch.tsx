export interface SwitchProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  /** Accessible name, in Spanish. */
  readonly label: string;
  readonly disabled?: boolean;
}

/**
 * On/off. The thumb stretches while pressed and travels on a spring — the
 * same feedback as the system switch it imitates.
 */
export default function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`group relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink disabled:opacity-40 ${checked ? "bg-brand" : "bg-fill-3"}`}
    >
      <span
        aria-hidden
        className={`absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-body shadow-raised transition-[transform,width] duration-450 ease-spring-fast group-active:w-8 motion-reduce:transition-none ${checked ? "translate-x-5 group-active:translate-x-[15px]" : ""}`}
      />
    </button>
  );
}
