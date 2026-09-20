import type { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`rounded-2xl border border-line bg-panel ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-line px-6 py-4">
      <div>
        <h2 className="font-bold text-body">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-body-soft">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export type CardPadding = "sm" | "md";

const PADDING: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-6",
};

/**
 * The padding is a named choice, not something a caller overrides through
 * `className`. Passing `p-4` there used to look like it worked and did not:
 * both classes end up on the element, and Tailwind emits `.p-6` after `.p-4`,
 * so the default silently won every time.
 */
export function CardBody({
  children,
  className = "",
  padding = "md",
}: CardProps & { padding?: CardPadding }) {
  return <div className={`${PADDING[padding]} ${className}`}>{children}</div>;
}
