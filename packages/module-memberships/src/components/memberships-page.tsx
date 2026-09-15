"use client";

import { useMemo, useState } from "react";
import type { MembershipSectionId, MembershipType, Role } from "@apexg/core";
import { canManageMemberships, membershipSections, today } from "@apexg/core";
import { CollectionGate } from "@apexg/module-kit";
import { Card, CardBody, Modal } from "@apexg/ui";
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
 * Dispatches on the section's view kind rather than comparing URL strings, so
 * a new section needs no change here.
 */
export default function MembershipsPage({
  sectionId,
  role,
  onNavigate,
}: MembershipsPageProps) {
  const section = membershipSections.getSection(sectionId);
  const collection = useMembershipTypes();
  const [editing, setEditing] = useState<MembershipType | null>(null);
  const [referenceDate] = useState(today);

  const visible = useMemo(() => {
    if (section.view.kind !== "list") return [];
    const { includes } = section.view;
    return collection.items.filter((type) => includes(type, referenceDate));
  }, [collection.items, section, referenceDate]);

  const handleSave = async (type: MembershipType) => {
    await collection.save(type);
    setEditing(null);
    if (section.view.kind === "form") onNavigate("all");
  };

  if (section.view.kind === "form") {
    return (
      <Card>
        <CardBody>
          <MembershipForm
            type={emptyMembershipType()}
            onSave={handleSave}
            onCancel={() => onNavigate("all")}
          />
        </CardBody>
      </Card>
    );
  }

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
