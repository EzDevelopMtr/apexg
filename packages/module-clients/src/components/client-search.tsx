"use client";

import { Search } from "lucide-react";
import { Card, CardBody, Input } from "@apexg/ui";

export interface ClientSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ClientSearch({ value, onChange }: ClientSearchProps) {
  return (
    <Card className="mb-6">
      <CardBody className="p-4">
        <Input
          id="client-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          icon={<Search size={20} />}
          placeholder="Buscar por nombre, documento o teléfono..."
          aria-label="Buscar clientes"
        />
      </CardBody>
    </Card>
  );
}
