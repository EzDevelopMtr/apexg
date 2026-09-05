import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Internal packages ship as uncompiled TypeScript, so Next transpiles them.
  // Editing a package is then visible immediately, with no intermediate build.
  transpilePackages: [
    "@apexg/core",
    "@apexg/data",
    "@apexg/ui",
    "@apexg/module-kit",
    "@apexg/module-clients",
    "@apexg/module-memberships",
  ],
};

export default nextConfig;
