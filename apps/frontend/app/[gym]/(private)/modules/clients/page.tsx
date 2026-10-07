import { redirect } from "next/navigation";
import { DEFAULT_CLIENT_SECTION } from "@apexg/core";

export default async function ClientsIndexPage({ params }: { params: Promise<{ gym: string }> }) {
  const { gym } = await params;
  redirect(`/${gym}/modules/clients/${DEFAULT_CLIENT_SECTION}`);
}
