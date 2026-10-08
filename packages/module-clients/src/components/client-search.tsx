"use client";

import { Search } from "lucide-react";
import { Input } from "@apexg/ui";

export interface ClientSearchProps {
  value: string;
  onChange: (value: string) => void;
}

/** Sits on the same row as the filters: it used to take a card of its own. */
export default function ClientSearch({ value, onChange }: ClientSearchProps) {
  return (
    <div className="w-full sm:w-80">
      <Input
        id="client-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        icon={<Search size={18} />}
        placeholder="Buscar por nombre, documento o teléfono..."
        aria-label="Buscar clientes"
      />
    </div>
  );
}
