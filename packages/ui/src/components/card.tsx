import type { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-line bg-panel shadow-sm ${className}`}
    >
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

export function CardBody({ children, className = "" }: CardProps) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
