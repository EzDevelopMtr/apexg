import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  CLIENT_SECTIONS,
  getClientSection,
  isClientSectionId,
} from "@apexg/core";
import ClientsModule from "../../../../../components/clients-module";

interface PageProps {
  params: Promise<{ section: string }>;
}

export function generateStaticParams() {
  return CLIENT_SECTIONS.map((section) => ({ section: section.id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { section } = await params;
  const title = isClientSectionId(section)
    ? getClientSection(section).title
    : "Clientes";

  return { title: `${title} | APEX GYM` };
}

export default async function ClientSectionPage({ params }: PageProps) {
  const { section } = await params;

  // Narrowing here turns an unknown URL into a 404 instead of an empty screen,
  // and gives the client component a typed id to resolve.
  if (!isClientSectionId(section)) notFound();

  return <ClientsModule sectionId={section} />;
}
