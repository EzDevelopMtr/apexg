"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Input } from "@apexg/ui";

/** A password input with a show/hide toggle — its own component since the
 *  toggle needs state that nothing else on the login form cares about. */
export default function PasswordField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Omitted on the login, where the placeholder carries the name. */
  label?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id="password"
        label={label}
        aria-label={label ? undefined : "Contraseña"}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        icon={<LockKeyhole size={18} />}
        autoComplete="current-password"
        placeholder="Contraseña"
        className="pr-12"
      />
      <button
        type="button"
        onClick={() => setVisible((shown) => !shown)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        // With a label above, the control sits lower; without one it is the
        // only child and centres on the field.
        className={`absolute right-4 text-body-faint transition hover:text-body ${
          label ? "top-11" : "top-1/2 -translate-y-1/2"
        }`}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
