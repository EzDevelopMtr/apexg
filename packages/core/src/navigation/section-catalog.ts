import type { IsoDate } from "../domain/calendar";
import type { IconName } from "./icons";

/**
 * What a section renders.
 *
 * `list` sections carry their own predicate, so adding one is adding a record
 * rather than extending a conditional inside a component.
 */
export type SectionView<T> =
  | {
      readonly kind: "list";
      readonly includes: (item: T, on: IsoDate) => boolean;
    }
  | { readonly kind: "form" }
  /** A bespoke screen — a dashboard or a report — with no list behind it. */
  | { readonly kind: "panel" };

export interface ModuleSection<Id extends string, T> {
  /** Segment used in the URL. */
  readonly id: Id;
  /** Sidebar label, in Spanish. */
  readonly label: string;
  /** Page heading, in Spanish. */
  readonly title: string;
  readonly icon: IconName;
  readonly view: SectionView<T>;
}

export interface SectionCatalog<Id extends string, T> {
  readonly sections: readonly ModuleSection<Id, T>[];
  readonly defaultSectionId: Id;
  /** Narrows a URL segment to a known section id. */
  readonly isSectionId: (value: string) => value is Id;
  /** Total by construction: `Id` is the union of the ids in `sections`. */
  readonly getSection: (id: Id) => ModuleSection<Id, T>;
}

/**
 * Builds the lookup, the type guard and the default for one module's sections.
 *
 * Six modules need the same three things; without this each would repeat the
 * Map, the guard and the throw.
 */
export function createSectionCatalog<Id extends string, T>(
  sections: readonly [ModuleSection<Id, T>, ...ModuleSection<Id, T>[]],
): SectionCatalog<Id, T> {
  const byId = new Map(sections.map((section) => [section.id, section]));

  return {
    sections,
    defaultSectionId: sections[0].id,

    isSectionId(value: string): value is Id {
      return byId.has(value as Id);
    },

    getSection(id: Id): ModuleSection<Id, T> {
      const section = byId.get(id);
      if (!section) {
        throw new Error(`Unknown section: ${id}`);
      }
      return section;
    },
  };
}
