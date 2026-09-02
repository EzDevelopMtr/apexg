"use client";

import { Plus } from "lucide-react";

import type { Entrenador } from "@apexg/core";
import { Button, Input } from "@apexg/ui";

interface EntrenadorFormProps {
  formulario: Entrenador;
  errores: string[];
  onChange: (entrenador: Entrenador) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancelar: () => void;
}

export default function EntrenadorForm({
  formulario,
  errores,
  onChange,
  onSubmit,
  onCancelar,
}: EntrenadorFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {errores.length > 0 && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {errores.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Input
          etiqueta="Nombre completo"
          id="nombre"
          value={formulario.nombre}
          onChange={(event) => onChange({ ...formulario, nombre: event.target.value })}
          required
        />
        <Input
          etiqueta="Documento"
          id="documento"
          value={formulario.documento}
          onChange={(event) => onChange({ ...formulario, documento: event.target.value })}
          required
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Input
          etiqueta="Teléfono"
          id="telefono"
          type="tel"
          value={formulario.telefono}
          onChange={(event) => onChange({ ...formulario, telefono: event.target.value })}
          required
        />
        <Input
          etiqueta="Certificados (opcional)"
          id="certificados"
          value={formulario.certificados}
          onChange={(event) => onChange({ ...formulario, certificados: event.target.value })}
          placeholder="N/A"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Input
          etiqueta="Fecha de contratación"
          id="fechaContratacion"
          type="date"
          value={formulario.fechaContratacion}
          onChange={(event) =>
            onChange({ ...formulario, fechaContratacion: event.target.value })
          }
          required
        />
        <Input
          etiqueta="Sueldo"
          id="sueldo"
          type="number"
          min="1"
          value={formulario.sueldo || ""}
          onChange={(event) => onChange({ ...formulario, sueldo: Number(event.target.value) })}
          required
        />
      </div>

      <Input
        etiqueta="Cupo máximo de clientes"
        id="cupoMaximo"
        type="number"
        min="1"
        value={formulario.cupoMaximo || ""}
        onChange={(event) => onChange({ ...formulario, cupoMaximo: Number(event.target.value) })}
        required
      />

      <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={formulario.activo}
          onChange={(event) => onChange({ ...formulario, activo: event.target.checked })}
          className="h-4 w-4 accent-blue-600"
        />
        Entrenador activo
      </label>

      <div className="flex gap-3">
        <Button type="submit">
          <Plus size={18} />
          Guardar entrenador
        </Button>
        <Button type="button" variante="secundario" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
