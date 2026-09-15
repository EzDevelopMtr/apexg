import { redirect } from "next/navigation";
import { DEFAULT_CLIENT_SECTION } from "@apexg/core";

export default function ClientsIndexPage() {
  redirect(`/modules/clients/${DEFAULT_CLIENT_SECTION}`);
}
