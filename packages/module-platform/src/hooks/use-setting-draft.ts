"use client";

import { useState } from "react";
import type { PlatformSetting } from "@apexg/core";

/** The unsaved edits of one setting card: its general value and a new exception. */
export function useSettingDraft(setting: PlatformSetting) {
  const [general, setGeneral] = useState<unknown>(
    setting.platform?.value ?? setting.defaultValue,
  );
  const [enforced, setEnforced] = useState(setting.platform?.enforced ?? false);
  const [exceptionCompanyId, setExceptionCompanyId] = useState("");
  const [exceptionValue, setExceptionValue] = useState<unknown>(
    setting.defaultValue,
  );
  return {
    general,
    setGeneral,
    enforced,
    setEnforced,
    exceptionCompanyId,
    setExceptionCompanyId,
    exceptionValue,
    setExceptionValue,
  };
}
