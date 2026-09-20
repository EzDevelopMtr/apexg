"use client";

import { Search } from "lucide-react";
import { Card, CardBody, Input } from "@apexg/ui";

export interface InventorySearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function InventorySearch({
  value,
  onChange,
}: InventorySearchProps) {
  return (
    <Card className="mb-6">
      <CardBody padding="sm">
        <Input
          id="inventory-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          icon={<Search size={20} />}
          placeholder="Buscar por nombre..."
          aria-label="Buscar ítems"
        />
      </CardBody>
    </Card>
  );
}
