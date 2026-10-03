import { describe, expect, it } from "vitest";
import { MODULES } from "../navigation/modules";
import { DEFAULT_GYM_SETTINGS, isModuleEnabled } from "./gym-settings";

describe("DEFAULT_GYM_SETTINGS", () => {
  it("enables every module of the app", () => {
    for (const module of MODULES) {
      expect(isModuleEnabled(DEFAULT_GYM_SETTINGS, module.id), module.id).toBe(true);
    }
  });

  it("an empty list turns every module off", () => {
    expect(isModuleEnabled({ ...DEFAULT_GYM_SETTINGS, enabledModules: [] }, "clients")).toBe(false);
  });
});
