"use client";

import { useEffect } from "react";

/**
 * While a dialog is open, the page behind it does not scroll: a wheel or a
 * swipe over the dialog used to move the app underneath, which reads as the
 * dialog sliding away. The scrollbar's width is kept as padding so the page
 * does not jump sideways when it disappears.
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return undefined;
    const { body, documentElement } = document;
    const previous = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    return () => {
      body.style.overflow = previous.overflow;
      body.style.paddingRight = previous.paddingRight;
    };
  }, [locked]);
}
