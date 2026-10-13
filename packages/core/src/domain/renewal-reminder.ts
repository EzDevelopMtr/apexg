import type { IsoDate } from "./calendar";
import { daysBetween, formatDayMonth } from "./calendar";
import type { ClientId } from "./client";

/** Colombia's calling code: every phone the gym registers is a local mobile. */
const COUNTRY_CODE = "57";

/**
 * The phone as WhatsApp expects it in a link (country code, digits only), or
 * `null` when it cannot be a Colombian mobile — better a disabled button than
 * a chat opened with a stranger.
 */
export function toWhatsAppNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("3")) return COUNTRY_CODE + digits;
  if (digits.length === 12 && digits.startsWith(`${COUNTRY_CODE}3`)) return digits;
  return null;
}

/** What the reminder needs to know; the names come already resolved. */
export interface RenewalReminderInput {
  readonly fullName: string;
  readonly planName: string;
  readonly gymName: string;
  readonly expirationDate: IsoDate;
}

/**
 * The two reminder texts a gym can word its own way. Each may use
 * `{nombre}` (first name), `{plan}`, `{gimnasio}` and `{fecha}` ("hoy" or
 * "el 15 oct"); anything else in braces is sent as written.
 */
export interface ReminderTemplates {
  /** Before or on the expiry day. */
  readonly upcoming: string;
  /** Once the plan lapsed. */
  readonly lapsed: string;
}

/** What every gym sends until it words its own. Mirrored in the backend catalog. */
export const DEFAULT_REMINDER_TEMPLATES: ReminderTemplates = {
  upcoming: "Hola {nombre}, tu plan {plan} en {gimnasio} vence {fecha}. ¡Te esperamos para renovar!",
  lapsed:
    "Hola {nombre}, tu plan {plan} en {gimnasio} venció {fecha}. ¡Te extrañamos! Renueva y sigue entrenando con nosotros.",
};

/**
 * The renewal reminder for a client.
 *
 * Lives here, not in the button, because whether the plan already lapsed
 * picks the whole text, and that is a reading of the date.
 */
export function renewalReminder(
  input: RenewalReminderInput,
  on: IsoDate,
  templates: ReminderTemplates = DEFAULT_REMINDER_TEMPLATES,
): string {
  const remaining = daysBetween(on, input.expirationDate);
  const values: Record<string, string> = {
    "{nombre}": input.fullName.trim().split(/\s+/)[0] ?? "",
    "{plan}": input.planName,
    "{gimnasio}": input.gymName,
    "{fecha}": remaining === 0 ? "hoy" : `el ${formatDayMonth(input.expirationDate)}`,
  };
  const template = remaining < 0 ? templates.lapsed : templates.upcoming;
  return template.replace(/\{(nombre|plan|gimnasio|fecha)\}/g, (token) => values[token] ?? token);
}

/**
 * A `wa.me` link that opens the chat with the message written. It sends
 * nothing: it opens whatever WhatsApp is signed in on that device, and the
 * person at the desk presses send. `null` when the phone is not usable.
 */
export function whatsAppLink(phone: string, message: string): string | null {
  const number = toWhatsAppNumber(phone);
  return number === null ? null : `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** The latest reminder sent to a client, as the list needs it. */
export interface ReminderRecord {
  readonly clientId: ClientId;
  /** Local calendar day it was sent. */
  readonly sentOn: IsoDate;
  /** Who opened the chat; `null` if that user was since removed. */
  readonly sentByName: string | null;
}

/**
 * "Recordado hoy", "Recordado ayer" or "Recordado el 12 oct": enough for the
 * desk to decide whether to write again without opening anything.
 */
export function reminderNotice(sentOn: IsoDate, on: IsoDate): string {
  const ago = daysBetween(sentOn, on);
  if (ago <= 0) return "Recordado hoy";
  if (ago === 1) return "Recordado ayer";
  return `Recordado el ${formatDayMonth(sentOn)}`;
}
