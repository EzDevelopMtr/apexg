import { redirect } from "next/navigation";
import { inventorySections } from "@apexg/core";

export default async function InventoryIndexPage({ params }: { params: Promise<{ gym: string }> }) {
  const { gym } = await params;
  redirect(`/${gym}/modules/inventory/${inventorySections.defaultSectionId}`);
}
