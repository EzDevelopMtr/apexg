"use client";

import { useEffect, useState } from "react";
import { logoProblem } from "@apexg/core";
import { LOGO_PROBLEM_TEXT } from "../gym-rules";

/**
 * A logo picked before its gym exists: kept here, shown from a local preview,
 * and uploaded once the gym is created. A file that would be refused is never
 * kept — the person learns why at once, not after creating the gym.
 */
export function useLogoDraft() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [problem, setProblem] = useState<string | null>(null);

  // Each preview URL holds the file in memory until revoked.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const pick = (next: File) => {
    const issue = logoProblem(next);
    setProblem(issue ? LOGO_PROBLEM_TEXT[issue] : null);
    if (issue) return;
    setFile(next);
    setPreview(URL.createObjectURL(next));
  };

  return { file, preview, problem, pick };
}
