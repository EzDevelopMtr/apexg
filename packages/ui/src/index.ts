/**
 * `@apexg/ui` — presentational primitives.
 *
 * Knows nothing about Next.js, routing or business rules, so it can be reused
 * by any app in the monorepo. Navigation lives in `apps/frontend`.
 */

/* Form controls */
export { default as Field } from "./components/field";
export { controlClasses } from "./components/control-classes";
export { useFirstInvalidFocus } from "./hooks/use-first-invalid-focus";
export type { FieldProps } from "./components/field";

export { default as Input } from "./components/input";
export type { InputProps } from "./components/input";

export { default as Select } from "./components/select";
export type { SelectProps, SelectOption } from "./components/select";

export { default as Textarea } from "./components/textarea";
export type { TextareaProps } from "./components/textarea";

/* Display */
export { default as Badge } from "./components/badge";
export type { BadgeProps, BadgeTone } from "./components/badge";

export { default as Button } from "./components/button";
export type {
  ButtonProps,
  ButtonVariant,
  ButtonSize,
} from "./components/button";

export { default as Card, CardHeader, CardBody } from "./components/card";
export type { CardPadding } from "./components/card";
export type { CardProps } from "./components/card";

export { default as Logo } from "./components/logo";
export type { LogoProps, LogoSize } from "./components/logo";

export { default as PageHeader } from "./components/page-header";
export type { PageHeaderProps } from "./components/page-header";

export { default as Modal } from "./components/modal";
export type { ModalProps } from "./components/modal";

export {
  default as Table,
  TableRow,
  TableCell,
  TableEmpty,
} from "./components/table";
export type { TableProps } from "./components/table";

/* Layout */
export { default as ModuleLayout } from "./layout/module-layout";
export type { ModuleLayoutProps } from "./layout/module-layout";

export { SidebarShell, SidebarLabel } from "./layout/sidebar";
export type { SidebarShellProps } from "./layout/sidebar";

export { sidebarItemClasses } from "./layout/sidebar-classes";

/* Accents */
export { ACCENT_TILE, ACCENT_GLOW } from "./accents";

/* Icons */
export { getIcon } from "./icons";
export { default as Icon } from "./components/icon";
export type { IconComponent } from "./icons";
export type { IconProps } from "./components/icon";
