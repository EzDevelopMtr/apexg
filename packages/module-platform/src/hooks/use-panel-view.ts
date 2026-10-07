"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PanelTab = "gyms" | "settings";
const TAB_ORDER: readonly PanelTab[] = ["gyms", "settings"];
type SheetKind = "none" | "editor" | "creator";

/** The sheet slides out in 600 ms; its content leaves the page right after. */
const UNMOUNT_AFTER_MS = 650;

/**
 * Which tab shows and which sheet is open. The edited gym is kept after the
 * sheet closes so it can slide out with its content instead of empty.
 */
export function usePanelView() {
  const [tab, setTabState] = useState<PanelTab>("gyms");
  const [enterFrom, setEnterFrom] = useState<"left" | "right">("right");
  const [sheet, setSheet] = useState<SheetKind>("none");
  // What stays rendered while the sheet slides out. Then it goes, so a
  // password shown once is not left in the page behind a hidden sheet.
  const [mounted, setMounted] = useState<SheetKind>("none");
  const timer = useRef<number | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creation, setCreation] = useState(0);
  const [edition, setEdition] = useState(0);

  const setTab = useCallback(
    (next: PanelTab) => {
      setEnterFrom(TAB_ORDER.indexOf(next) > TAB_ORDER.indexOf(tab) ? "right" : "left");
      setTabState(next);
    },
    [tab],
  );

  /** Each opening starts from the saved gym: `edition` keys the editor, so drafts and revealed passwords never survive a close. */
  const openEditor = useCallback((id: string) => {
    setEdition((count) => count + 1);
    setEditingId(id);
    window.clearTimeout(timer.current);
    setMounted("editor");
    setSheet("editor");
  }, []);

  /** Each opening starts a blank form: `creation` keys it. */
  const openCreator = useCallback(() => {
    setCreation((count) => count + 1);
    window.clearTimeout(timer.current);
    setMounted("creator");
    setSheet("creator");
  }, []);

  const closeSheet = useCallback(() => {
    setSheet("none");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMounted("none"), UNMOUNT_AFTER_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { tab, setTab, enterFrom, sheet, mounted, editingId, edition, creation, openEditor, openCreator, closeSheet };
}
