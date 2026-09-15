/**
 * `@apexg/module-clients` — the Clients module.
 *
 * The app supplies routing and the repositories; this package owns the screens
 * and the state around them.
 */

export { default as ClientsPage } from "./components/clients-page";
export type { ClientsPageProps } from "./components/clients-page";

export { default as ClientForm } from "./components/client-form";
export type { ClientFormProps } from "./components/client-form";

export { STATUS_LABELS, STATUS_TONES } from "./components/client-status";
