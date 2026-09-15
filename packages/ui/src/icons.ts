import type { ComponentType } from "react";
import {
  BarChart3,
  Clock,
  CreditCard,
  Dumbbell,
  List,
  Notebook,
  Package,
  Receipt,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  Wallet,
} from "lucide-react";
import type { IconName } from "@apexg/core";

export type IconComponent = ComponentType<{
  size?: number;
  className?: string;
}>;

/**
 * Resolves the icon names `@apexg/core` uses into real components.
 *
 * The domain package cannot import React, so this mapping is the boundary
 * where a name becomes something renderable.
 */
export const ICONS: Record<IconName, IconComponent> = {
  users: Users,
  card: CreditCard,
  wallet: Wallet,
  package: Package,
  chart: BarChart3,
  dumbbell: Dumbbell,
  list: List,
  userPlus: UserPlus,
  userCheck: UserCheck,
  clock: Clock,
  userX: UserX,
  receipt: Receipt,
  notebook: Notebook,
};

export function getIcon(name: IconName): IconComponent {
  return ICONS[name];
}
