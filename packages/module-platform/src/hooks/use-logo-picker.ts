"use client";

import { useState } from "react";
import { logoProblem } from "@apexg/core";
import { LOGO_PROBLEM_TEXT } from "../gym-rules";
import { prepareLogo } from "../logo-file";
import type { PreparedLogo } from "../logo-file";

/** What the person is told about the logo they just picked. */
export type LogoNotice = Exclude<PreparedLogo["kind"], "as-is"> | null;

export interface LogoPicker {
  readonly pick: (file: File) => Promise<void>;
  readonly problem: string | null;
  readonly notice: LogoNotice;
  readonly working: boolean;
  /** Present after a background was cleared: goes back to the file as it came. */
  readonly restoreOriginal?: () => Promise<void>;
}

/**
 * Checks a picked logo, clears a painted background, and hands the result to
 * `apply` — kept as a draft while creating, uploaded at once while editing.
 * `apply` resolving `false` (an upload that failed) drops the notice with it.
 */
export function useLogoPicker(apply: (file: File) => Promise<boolean> | void): LogoPicker {
  const [problem, setProblem] = useState<string | null>(null);
  const [notice, setNotice] = useState<LogoNotice>(null);
  const [original, setOriginal] = useState<File | null>(null);
  const [working, setWorking] = useState(false);

  const adopt = async (file: File, nextNotice: LogoNotice, nextOriginal: File | null) => {
    const applied = (await apply(file)) !== false;
    setNotice(applied ? nextNotice : null);
    setOriginal(applied ? nextOriginal : null);
  };

  const pick = async (file: File) => {
    const issue = logoProblem(file);
    setProblem(issue ? LOGO_PROBLEM_TEXT[issue] : null);
    if (issue) return;
    setWorking(true);
    try {
      const prepared = await prepareLogo(file);
      await adopt(prepared.file, prepared.kind === "as-is" ? null : prepared.kind, prepared.kind === "cleared" ? file : null);
    } finally {
      setWorking(false);
    }
  };

  const restoreOriginal = original ? () => adopt(original, "opaque", null) : undefined;

  return { pick, problem, notice, working, restoreOriginal };
}
