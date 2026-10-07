import { materialButton } from "./material-button-classes";

export interface ToastProps {
  readonly visible: boolean;
  /** User-facing, in Spanish. */
  readonly message: string;
  /** Present when the action can be reverted: undo beats an "are you sure?". */
  readonly onUndo?: () => void;
}

/** A floating confirmation. It materializes: blur, scale and opacity settle together. */
export default function Toast({ visible, message, onUndo }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "fixed bottom-6 left-1/2 z-[60] flex items-center gap-3.5 rounded-2xl py-2.5 pl-[18px] pr-2.5 text-sm font-medium",
        "bg-surface/80 shadow-float backdrop-blur-[24px] backdrop-saturate-[1.8]",
        "transparency-reduce:bg-surface transparency-reduce:backdrop-blur-none",
        "transition-[transform,opacity,filter] duration-600 ease-spring motion-reduce:transition-opacity",
        visible
          ? "-translate-x-1/2 translate-y-0 scale-100 opacity-100 blur-none"
          : "pointer-events-none -translate-x-1/2 translate-y-4 scale-[0.96] opacity-0 blur-[6px] motion-reduce:translate-y-0 motion-reduce:blur-none",
      ].join(" ")}
    >
      <span>{message}</span>
      {onUndo ? (
        <button type="button" onClick={onUndo} className={materialButton("plain", "sm")}>
          Deshacer
        </button>
      ) : (
        <span className="w-1" />
      )}
    </div>
  );
}
