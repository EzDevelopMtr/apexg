"use client";

import { createContext, useContext } from "react";
import type { BrandPalette } from "@apexg/core";

/** What the chrome shows of the gym it is serving. */
export interface Brand {
  /** "APEX GYM": the logo's wordmark when there is no uploaded logo. */
  readonly name: string;
  /** URL of the uploaded logo, if the gym has one. */
  readonly logoSrc?: string;
  /** `undefined`: keep the defaults of `theme.css`. */
  readonly palette?: BrandPalette;
}

export const BrandContext = createContext<Brand>({ name: "APEX GYM" });

export function useBrand(): Brand {
  return useContext(BrandContext);
}
