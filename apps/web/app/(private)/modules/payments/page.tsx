import { redirect } from "next/navigation";
import { paymentSections } from "@apexg/core";

export default function PaymentsIndexPage() {
  redirect(`/modules/payments/${paymentSections.defaultSectionId}`);
}
