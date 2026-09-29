import { needsVisibleTitle } from "@apexg/core";
import { PageHeader } from "@apexg/ui";

export interface SectionHeadingProps {
  moduleId: string;
  sectionId: string;
  /** El título de la sección, en español. */
  title: string;
}

/**
 * El título de la vista: visible solo cuando nada más dice dónde se está.
 *
 * En un listado lo dice el filtro activo y en un panel la pestaña marcada;
 * ahí el título grande —más un rótulo encima y una descripción debajo—
 * repetía el nombre del módulo cuatro veces en la misma pantalla. Queda
 * igual como `h1` para lectores de pantalla, que no ven la barra de un
 * vistazo.
 */
export default function SectionHeading({
  moduleId,
  sectionId,
  title,
}: SectionHeadingProps) {
  if (needsVisibleTitle(moduleId, sectionId)) {
    return <PageHeader title={title} />;
  }
  return <h1 className="sr-only">{title}</h1>;
}
