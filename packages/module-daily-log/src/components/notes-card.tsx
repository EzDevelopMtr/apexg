"use client";

import { useState } from "react";
import type { DailyLogNote } from "@apexg/core";
import { Button, Card, CardBody, CardHeader, Textarea } from "@apexg/ui";

/** The day's notes, plus a box to add one (RF-34). */
export default function NotesCard({
  notes,
  onAddNote,
}: {
  notes: readonly DailyLogNote[];
  onAddNote: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setSaving(true);
    try {
      await onAddNote(trimmed);
      setText("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Novedades del día"
        description="Observaciones e incidentes."
      />
      <CardBody className="space-y-4">
        {notes.length === 0 ? (
          <p className="text-slate-400">Sin novedades registradas.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notes.map((note) => (
              <li key={note.id} className="py-3">
                <p className="text-slate-800">{note.text}</p>
                <p className="mt-1 text-xs text-slate-400">{note.recordedBy}</p>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-slate-100 pt-4">
          <Textarea
            id="newNote"
            label="Agregar novedad"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Ej. Se dañó una caminadora"
          />
          <div className="mt-3 flex justify-end">
            <Button onClick={submit} disabled={saving || !text.trim()}>
              {saving ? "Guardando..." : "Agregar"}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
