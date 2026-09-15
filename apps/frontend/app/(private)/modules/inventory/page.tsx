import { redirect } from "next/navigation";
import { inventorySections } from "@apexg/core";

export default function InventoryIndexPage() {
  redirect(`/modules/inventory/${inventorySections.defaultSectionId}`);
}
