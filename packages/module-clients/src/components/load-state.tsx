import { Card, CardBody } from "@apexg/ui";

/** Placeholder shown while clients load. */
export function LoadingState() {
  return (
    <Card>
      <CardBody className="py-12 text-center text-slate-400">
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
        <p role="alert" className="font-semibold text-red-600">
          No pudimos cargar los clientes.
        </p>
        <p className="mt-1 text-sm text-slate-500">{message}</p>
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
