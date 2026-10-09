import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { SectionCatalog } from "@apexg/core";

export interface SectionRouteParams {
  params: Promise<{ section: string }>;
}

/**
 * The route plumbing every module page repeats.
 *
 * Every module needs the same title lookup and the same 404 for an unknown
 * segment. Only the id crosses to the client: sections carry predicates, and a
 * function cannot cross the server/client boundary.
 *
 * No `generateStaticParams`: under `/[gym]` the page reads the session, so
 * it is rendered per request. Declaring static params made a production build
 * treat it as static and answer 500 (DYNAMIC_SERVER_USAGE); `next dev` hid it.
 */
export function createSectionRoute<Id extends string>(
  catalog: SectionCatalog<Id, never>,
  fallbackTitle: string,
) {
  return {
    async generateMetadata({ params }: SectionRouteParams): Promise<Metadata> {
      const { section } = await params;
      const title = catalog.isSectionId(section)
        ? catalog.getSection(section).title
        : fallbackTitle;

      return { title };
    },

    /** Narrows the segment, or renders a 404. */
    async resolve({ params }: SectionRouteParams): Promise<Id> {
      const { section } = await params;
      if (!catalog.isSectionId(section)) notFound();
      return section;
    },
  };
}
