import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { membershipSections } from "@apexg/core";
import MembershipsModule from "../../../../../components/memberships-module";

interface PageProps {
  params: Promise<{ section: string }>;
}

export function generateStaticParams() {
  return membershipSections.sections.map((section) => ({
    section: section.id,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { section } = await params;
  const title = membershipSections.isSectionId(section)
    ? membershipSections.getSection(section).title
    : "Membresías";

  return { title: `${title} | APEX GYM` };
}

export default async function MembershipSectionPage({ params }: PageProps) {
  const { section } = await params;

  // Sections carry predicates, so only the id crosses to the client.
  if (!membershipSections.isSectionId(section)) notFound();

  return <MembershipsModule sectionId={section} />;
}
