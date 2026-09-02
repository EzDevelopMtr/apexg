"use client";

import { Membresias } from "@apexg/modulo-membresias";

import { useSesion } from "../lib/auth";

export default function MembresiasSeccion({ seccion }: { seccion: string }) {
  const { sesion } = useSesion();

  return <Membresias activeSection={seccion} rol={sesion?.rol} />;
}
