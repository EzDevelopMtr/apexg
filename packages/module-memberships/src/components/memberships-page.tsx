"use client";

import { useMemo, useState } from "react";
import type { MembershipSectionId, MembershipType, Role } from "@apexg/core";
import { canManageMemberships, membershipSections, today } from "@apexg/core";
import { CollectionGate } from "@apexg/module-kit";
import { Modal } from "@apexg/ui";
import { useMembershipTypes } from "../hooks/use-membership-types";
import MembershipForm from "./membership-form";
import { emptyMembershipType } from "./empty-membership-type";
import MembershipList from "./membership-list";

export interface MembershipsPageProps {
  sectionId: MembershipSectionId;
  /** Decides whether the catalogue is editable (RF-12). */
  role: Role;
  onNavigate: (sectionId: string) => void;
}

/**
 * Entry point of the Memberships module.
 *
 * The list is always on screen; creating a plan opens as a dialog over it,
 * like editing one already did.
 */
export default function MembershipsPage({
  sectionId,
  role,
  onNavigate,
}: MembershipsPageProps) {
  const requested = membershipSections.getSection(sectionId);
  const section = membershipSections.sectionBehind(sectionId);
  const creating = requested.view.kind === "form";
  const collection = useMembershipTypes();
  const [editing, setEditing] = useState<MembershipType | null>(null);
  const [referenceDate] = useState(today);
  const close = () => onNavigate(section.id);

  const visible = useMemo(() => {
    if (section.view.kind !== "list") return [];
    const { includes } = section.view;
    return collection.items.filter((type) => includes(type, referenceDate));
  }, [collection.items, section, referenceDate]);

  const handleSave = async (type: MembershipType) => {
    await collection.save(type);
    setEditing(null);
    if (creating) close();
  };

  return (
    <CollectionGate
      collection={collection}
      loadingMessage="Cargando planes..."
      errorMessage="No pudimos cargar los planes."
    >
      <MembershipList
        types={visible}
        onEdit={canManageMemberships(role) ? setEditing : undefined}
      />

      <Modal open={creating} title={requested.title} onClose={close}>
        <MembershipForm type={emptyMembershipType()} onSave={handleSave} onCancel={close} />
      </Modal>

      <Modal
        open={editing !== null}
        title="Editar plan"
        description="Los cambios afectan a inscripciones futuras, no a las ya registradas."
        onClose={() => setEditing(null)}
      >
        {editing && (
          <MembershipForm
            type={editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </CollectionGate>
  );
}
