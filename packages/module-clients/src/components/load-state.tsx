import { Card, CardBody } from "@apexg/ui";

/** Placeholder shown while clients load. */
export function LoadingState() {
  return (
    <Card>
      <CardBody className="py-12 text-center text-body-faint">
        Cargando clientes...
      </CardBody>
    </Card>
  );
}

/** Shown when loading fails, with a way back. */
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card>
      <CardBody className="py-12 text-center">
        <p role="alert" className="font-semibold text-danger-ink">
          No pudimos cargar los clientes.
        </p>
        <p className="mt-1 text-sm text-body-soft">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 font-semibold text-brand-ink hover:underline"
        >
          Reintentar
        </button>
      </CardBody>
    </Card>
  );
}
