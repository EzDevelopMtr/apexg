import type { ReactNode } from "react";
import { Card, CardBody } from "@apexg/ui";
import type { Collection } from "../hooks/use-collection";

/** Placeholder shown while a collection loads. */
export function LoadingState({ message }: { message: string }) {
  return (
    <Card>
      <CardBody className="py-12 text-center text-slate-400">
        {message}
      </CardBody>
    </Card>
  );
}

/** Shown when loading fails, with a way back. */
export function ErrorState({
  message,
  detail,
  onRetry,
}: {
  message: string;
  detail: string | null;
  onRetry: () => void;
}) {
  return (
    <Card>
      <CardBody className="py-12 text-center">
        <p role="alert" className="font-semibold text-red-600">
          {message}
        </p>
        {detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 font-semibold text-blue-600 hover:underline"
        >
          Reintentar
        </button>
      </CardBody>
    </Card>
  );
}

/**
 * Renders the loading and error states, and the children once ready.
 *
 * Every module needs the same three states; without this each page would carry
 * the same two early returns.
 */
export function CollectionGate<T>({
  collection,
  loadingMessage,
  errorMessage,
  children,
}: {
  collection: Collection<T>;
  loadingMessage: string;
  errorMessage: string;
  children: ReactNode;
}) {
  if (collection.state === "loading") {
    return <LoadingState message={loadingMessage} />;
  }

  if (collection.state === "error") {
    return (
      <ErrorState
        message={errorMessage}
        detail={collection.error}
        onRetry={collection.reload}
      />
    );
  }

  return <>{children}</>;
}
