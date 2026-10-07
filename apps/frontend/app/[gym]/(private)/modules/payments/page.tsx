import { redirect } from "next/navigation";
import { paymentSections } from "@apexg/core";

export default async function PaymentsIndexPage({ params }: { params: Promise<{ gym: string }> }) {
  const { gym } = await params;
  redirect(`/${gym}/modules/payments/${paymentSections.defaultSectionId}`);
}
