"use client";

import type { UseClientFormResult } from "../hooks/use-client-form";
import ClientAdditionalFields from "./client-additional-fields";
import ClientContactFields from "./client-contact-fields";
import ClientMembershipFields from "./client-membership-fields";

/** Composes the form's field groups. Layout only — no rules, no state. */
export default function ClientFormFields(form: UseClientFormResult) {
  return (
    <div className="space-y-5">
      <ClientContactFields {...form} />
      <ClientAdditionalFields {...form} />
      <ClientMembershipFields {...form} />
    </div>
  );
}
