/*
  =====================================================
  REGISTRO DE ICONOS
  =====================================================

  El paquete @apexg/core guarda los iconos como
  un NOMBRE de texto, porque no conoce React.

  Aqui traducimos ese nombre al icono real
  de lucide-react.

  Para agregar un icono nuevo:

    1. Agrega el nombre en NombreIcono (@apexg/core)
    2. Agrega la traduccion en este archivo
*/

import type { ComponentType } from "react";

import {
  BarChart3,
  Clock,
  CreditCard,
  Dumbbell,
  List,
  Package,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  Wallet,
} from "lucide-react";

import type { NombreIcono } from "@apexg/core";


/*
  -----------------------------------------------------
  TIPO DE UN COMPONENTE DE ICONO
  -----------------------------------------------------

  Solo declaramos las propiedades que realmente
  usamos, para no acoplarnos a los tipos internos
  de lucide-react.
*/

export type ComponenteIcono = ComponentType<{
  size?: number;
  className?: string;
}>;


/*
  -----------------------------------------------------
  TABLA DE TRADUCCION
  -----------------------------------------------------
*/

export const iconos: Record<NombreIcono, ComponenteIcono> = {
  "usuarios": Users,
  "tarjeta": CreditCard,
  "billetera": Wallet,
  "paquete": Package,
  "grafico": BarChart3,
  "mancuerna": Dumbbell,
  "lista": List,
  "usuario-mas": UserPlus,
  "usuario-ok": UserCheck,
  "reloj": Clock,
  "usuario-x": UserX,
};


/*
  -----------------------------------------------------
  OBTENER UN ICONO POR NOMBRE
  -----------------------------------------------------
*/

export function obtenerIcono(
  nombre: NombreIcono
): ComponenteIcono {

  return iconos[nombre];
}
