"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Slides a thumb under the selected tab of a segmented control.
 *
 * Writes the thumb's transform straight onto the element instead of through
 * state: it is layout, measured from the DOM, and a re-render per resize would
 * buy nothing. The transition lives in CSS, so a second click mid-slide simply
 * retargets from where the thumb is.
 */
export function useActiveThumb(selected: string) {
  const container = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return undefined;
    const place = () => {
      const active = root.querySelector<HTMLElement>(`[data-segment="${CSS.escape(selected)}"]`);
      if (!active || !thumb.current) return;
      thumb.current.style.width = `${active.offsetWidth}px`;
      thumb.current.style.transform = `translateX(${active.offsetLeft}px)`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(root);
    return () => observer.disconnect();
  }, [selected]);

  return { container, thumb };
}
