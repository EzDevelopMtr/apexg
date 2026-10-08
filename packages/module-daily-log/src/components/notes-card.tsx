"use client";

import { useState } from "react";
import type { DailyLogNote } from "@apexg/core";
import { Card, CardBody, CardHeader, Input } from "@apexg/ui";

/** The day's notes, plus a box to add one with Enter — no separate button (RF-34). */
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
      <CardHeader title="Novedades del día" />
      <CardBody className="space-y-4">
        {notes.length === 0 ? (
          <p className="text-body-faint">Sin novedades registradas.</p>
        ) : (
          <ul className="divide-y divide-line-soft">
            {notes.map((note) => (
              <li key={note.id} className="py-3">
                <p className="text-body">{note.text}</p>
                <p className="mt-1 text-xs text-body-faint">
                  {note.recordedBy}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-line-soft pt-4">
          <Input
            id="newNote"
            label="Agregar novedad"
            value={text}
            disabled={saving}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void submit();
            }}
            placeholder="Ej. Se dañó una caminadora"
          />
          {saving && <p className="mt-2 text-xs text-body-faint">Guardando...</p>}
        </div>
      </CardBody>
    </Card>
  );
}
