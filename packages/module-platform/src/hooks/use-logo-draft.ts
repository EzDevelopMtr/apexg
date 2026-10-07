"use client";

import { useEffect, useState } from "react";
import { useLogoPicker } from "./use-logo-picker";

/**
 * A logo picked before its gym exists: kept here, shown from a local preview,
 * and uploaded once the gym is created. A file that would be refused is never
 * kept — the person learns why at once, not after creating the gym.
 */
export function useLogoDraft() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const picker = useLogoPicker((next) => {
    setFile(next);
    setPreview(URL.createObjectURL(next));
  });

  // Each preview URL holds the file in memory until revoked.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  return { file, preview, picker };
}
