export interface SectionHeadingProps {
  /** El título de la sección, en español. */
  title: string;
}

/**
 * El título de la vista, solo para lectores de pantalla.
 *
 * Nada en pantalla lo necesita: un listado lo dice su filtro activo, un panel
 * la pestaña marcada y un formulario se abre como diálogo con su propio
 * título. Visible, repetía el nombre del módulo una vez más.
 */
export default function SectionHeading({ title }: SectionHeadingProps) {
  return <h1 className="sr-only">{title}</h1>;
}
