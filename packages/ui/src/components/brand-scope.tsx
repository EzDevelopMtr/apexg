"use client";

import type { CSSProperties, ReactNode } from "react";
import { BrandContext } from "./brand-context";
import type { Brand } from "./brand-context";

/**
 * Applies one gym's brand to everything inside it. The palette is set as
 * custom properties on a `contents` wrapper: they inherit like any other, so
 * every `bg-brand`/`text-brand-ink` below picks them up.
 */
export default function BrandScope({ brand, children }: { brand: Brand; children: ReactNode }) {
  return (
    <BrandContext.Provider value={brand}>
      <div className="contents" style={brand.palette as CSSProperties | undefined}>
        {children}
      </div>
    </BrandContext.Provider>
  );
}
