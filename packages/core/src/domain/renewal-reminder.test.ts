import { describe, expect, it } from "vitest";
import type { IsoDate } from "./calendar";
import { reminderNotice, renewalReminder, toWhatsAppNumber, whatsAppLink } from "./renewal-reminder";

const on = "2026-10-13" as IsoDate;
const input = {
  fullName: "  Juan Pérez Gómez",
  planName: "Mensual",
  gymName: "APEX GYM",
  expirationDate: "2026-10-15" as IsoDate,
};

describe("toWhatsAppNumber", () => {
  it("adds Colombia's code to a 10-digit mobile, ignoring separators", () => {
    expect(toWhatsAppNumber("300 123-4567")).toBe("573001234567");
  });

  it("keeps a number that already carries the code", () => {
    expect(toWhatsAppNumber("+57 300 123 4567")).toBe("573001234567");
  });

  it.each(["", "6041234567", "30012345", "12345678901234"])("rejects %j", (phone) => {
    expect(toWhatsAppNumber(phone)).toBeNull();
  });
});

describe("renewalReminder", () => {
  it("names the first name, plan, gym and date ahead of expiry", () => {
    expect(renewalReminder(input, on)).toBe(
      "Hola Juan, tu plan Mensual en APEX GYM vence el 15 oct. ¡Te esperamos para renovar!",
    );
  });

  it("says today on the expiry day", () => {
    expect(renewalReminder({ ...input, expirationDate: on }, on)).toContain("vence hoy");
  });

  it("changes the message once the plan lapsed", () => {
    const text = renewalReminder({ ...input, expirationDate: "2026-10-10" as IsoDate }, on);
    expect(text).toContain("venció el 10 oct");
    expect(text).toContain("Te extrañamos");
  });
});

describe("renewalReminder with the gym's own wording", () => {
  const templates = { upcoming: "{nombre}: {plan} {fecha} ({gimnasio}) {otro}", lapsed: "Venció {fecha}, {nombre}" };

  it("fills every placeholder and leaves unknown ones as written", () => {
    expect(renewalReminder(input, on, templates)).toBe("Juan: Mensual el 15 oct (APEX GYM) {otro}");
  });

  it("uses the lapsed text once the plan lapsed", () => {
    expect(renewalReminder({ ...input, expirationDate: "2026-10-10" as IsoDate }, on, templates)).toBe(
      "Venció el 10 oct, Juan",
    );
  });
});

describe("whatsAppLink", () => {
  it("encodes the message into a wa.me link", () => {
    expect(whatsAppLink("3001234567", "¡Hola Ana!")).toBe(
      "https://wa.me/573001234567?text=%C2%A1Hola%20Ana!",
    );
  });

  it("is null for an unusable phone", () => {
    expect(whatsAppLink("123", "Hola")).toBeNull();
  });
});

describe("reminderNotice", () => {
  it.each([
    ["2026-10-13", "Recordado hoy"],
    ["2026-10-12", "Recordado ayer"],
    ["2026-10-08", "Recordado el 8 oct"],
  ])("reads %s as %j", (sentOn, notice) => {
    expect(reminderNotice(sentOn as IsoDate, on)).toBe(notice);
  });
});
