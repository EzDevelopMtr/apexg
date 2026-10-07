"use client";

import { useCallback, useState } from "react";

export type PanelTab = "gyms" | "settings";
const TAB_ORDER: readonly PanelTab[] = ["gyms", "settings"];

/**
 * Which tab shows and which sheet is open. The edited gym is kept after the
 * sheet closes so it can slide out with its content instead of empty.
 */
export function usePanelView() {
  const [tab, setTabState] = useState<PanelTab>("gyms");
  const [enterFrom, setEnterFrom] = useState<"left" | "right">("right");
  const [sheet, setSheet] = useState<"none" | "editor" | "creator">("none");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creation, setCreation] = useState(0);

  const setTab = useCallback(
    (next: PanelTab) => {
      setEnterFrom(TAB_ORDER.indexOf(next) > TAB_ORDER.indexOf(tab) ? "right" : "left");
      setTabState(next);
    },
    [tab],
  );

  const openEditor = useCallback((id: string) => {
    setEditingId(id);
    setSheet("editor");
  }, []);

  /** Each opening starts a blank form: `creation` keys it. */
  const openCreator = useCallback(() => {
    setCreation((count) => count + 1);
    setSheet("creator");
  }, []);

  const closeSheet = useCallback(() => setSheet("none"), []);

  return { tab, setTab, enterFrom, sheet, editingId, creation, openEditor, openCreator, closeSheet };
}
