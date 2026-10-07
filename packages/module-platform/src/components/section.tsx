import type { ReactNode } from "react";

export interface SectionProps {
  /** Small caps heading, in Spanish. */
  readonly title: string;
  readonly help?: ReactNode;
  readonly children: ReactNode;
}

/** A group inside a sheet: heading, optional note, and its content on a soft fill. */
export default function Section({ title, help, children }: SectionProps) {
  return (
    <section className="mt-[22px]">
      <h3 className="mb-2 ml-0.5 text-xs font-semibold uppercase tracking-[0.07em] text-body-faint">{title}</h3>
      {help && <p className="mx-0.5 mb-2.5 text-[13px] text-body-faint">{help}</p>}
      <div className="rounded-[14px] bg-fill-1 p-3.5">{children}</div>
    </section>
  );
}
