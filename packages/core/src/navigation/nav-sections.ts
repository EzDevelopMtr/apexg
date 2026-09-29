import { clientSections } from "./client-sections";
import { dailyLogSections } from "./daily-log-sections";
import { expenseSections } from "./expense-sections";
import { financeSections } from "./finance-sections";
import { inventorySections } from "./inventory-sections";
import { membershipSections } from "./membership-sections";
import { paymentSections } from "./payment-sections";
import { trainerSections } from "./trainer-sections";
import type { IconName } from "./icons";
import type { ModuleSection, SectionView } from "./section-catalog";

/**
 * What navigation needs from a section, and nothing more.
 *
 * Sections carry predicates, and a function cannot cross the server/client
 * boundary. Stripping them here means a navigation bar can never accidentally
 * be handed one.
 */
export interface NavigableSection {
  readonly id: string;
  readonly label: string;
  readonly icon: IconName;
  readonly kind: SectionView<never>["kind"];
}

/**
 * Una pestaña de la barra superior de un módulo.
 *
 * `matches` son las secciones que la dejan marcada: la pestaña del listado
 * sigue activa mientras se mira cualquiera de sus filtros, porque "En mora" es
 * el mismo listado de clientes visto de otra forma, no otro lugar.
 */
export interface NavTab {
  readonly id: string;
  readonly label: string;
  readonly icon: IconName;
  readonly matches: readonly string[];
}

function toNavigable(
  sections: readonly ModuleSection<string, never>[],
): readonly NavigableSection[] {
  return sections.map(({ id, label, icon, view }) => ({
    id,
    label,
    icon,
    kind: view.kind,
  }));
}

/** Navigation for each module, keyed by module id. Plain data only. */
export const NAV_SECTIONS: Record<string, readonly NavigableSection[]> = {
  clients: toNavigable(clientSections.sections),
  memberships: toNavigable(membershipSections.sections),
  payments: toNavigable(paymentSections.sections),
  trainers: toNavigable(trainerSections.sections),
  expenses: toNavigable(expenseSections.sections),
  inventory: toNavigable(inventorySections.sections),
  finances: toNavigable(financeSections.sections),
  dailyLog: toNavigable(dailyLogSections.sections),
};

export function navSectionsFor(moduleId: string): readonly NavigableSection[] {
  return NAV_SECTIONS[moduleId] ?? [];
}

function listsOf(moduleId: string): readonly NavigableSection[] {
  return navSectionsFor(moduleId).filter((section) => section.kind === "list");
}

/** Rótulo de la pestaña que lleva al listado del módulo. */
const LIST_TAB_LABEL = "Listado";

/**
 * Las pestañas de la barra superior, en el orden del catálogo — o ninguna.
 *
 * Una pestaña es un LUGAR distinto al que moverse. Por eso:
 *
 * - Todos los listados se funden en una sola pestaña: sus variantes ("En
 *   mora", "Agotados") son filtros de esa tabla ({@link listFiltersFor}).
 * - Un formulario de un módulo con listado no es pestaña: se abre con el
 *   botón de acción de la tabla ({@link primaryActionFor}). Tenerlo en los dos
 *   sitios era ofrecer dos botones que hacen lo mismo.
 * - Si al final queda un solo lugar, no hay pestañas: una sola opción no
 *   navega a ninguna parte, y repetía lo que la barra ya dice con el nombre
 *   del módulo.
 *
 * Todo sale del `kind` de cada sección, así que un filtro o un panel nuevo es
 * un registro más en el catálogo, no una pestaña que alguien deba recordar.
 */
export function navTabsFor(moduleId: string): readonly NavTab[] {
  const sections = navSectionsFor(moduleId);
  const listIds = listsOf(moduleId).map((section) => section.id);
  const firstList = listIds[0];
  const hasList = firstList !== undefined;

  const tabs = sections
    .filter((section) =>
      section.kind === "list"
        ? section.id === firstList
        : !(hasList && section.kind === "form"),
    )
    .map(({ id, label, icon }) => ({
      id,
      // "Listado" y no "Todos los clientes": el nombre del módulo ya está al
      // lado, en la misma barra.
      label: id === firstList ? LIST_TAB_LABEL : label,
      icon,
      matches: id === firstList ? listIds : [id],
    }));

  return tabs.length > 1 ? tabs : [];
}

/**
 * La acción principal del listado — el formulario del módulo —, o null.
 *
 * Solo en módulos con listado: sin tabla no hay dónde ponerla, y ahí el
 * formulario conserva su pestaña.
 */
export function primaryActionFor(moduleId: string): NavigableSection | null {
  if (listsOf(moduleId).length === 0) return null;
  return (
    navSectionsFor(moduleId).find((section) => section.kind === "form") ?? null
  );
}

/** Etiqueta del filtro que devuelve el listado completo. */
const ALL_FILTER_LABEL = "Todos";

/**
 * Los filtros de la tabla del módulo, o ninguno.
 *
 * Solo aparecen cuando hay más de un listado: una sola opción no filtra nada,
 * y mostrarla sería un control que no hace nada. El primero se rotula
 * "Todos" porque su propia etiqueta ("Todos los clientes") repetiría el
 * nombre del módulo al lado de "En mora".
 */
export function listFiltersFor(
  moduleId: string,
): readonly NavigableSection[] {
  const lists = listsOf(moduleId);
  if (lists.length < 2) return [];

  return lists.map((section, index) =>
    index === 0 ? { ...section, label: ALL_FILTER_LABEL } : section,
  );
}

/**
 * Si la vista necesita un título visible.
 *
 * Solo cuando nada más en pantalla dice dónde se está: un formulario abierto
 * con el botón de acción. Un listado ya lo dice su filtro activo, y un panel
 * o un formulario con pestaña, la pestaña marcada — ahí un título grande
 * repetía la misma palabra dos veces.
 */
export function needsVisibleTitle(
  moduleId: string,
  sectionId: string,
): boolean {
  return primaryActionFor(moduleId)?.id === sectionId;
}
