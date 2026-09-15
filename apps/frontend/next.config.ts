import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the dev server serve assets/HMR when accessed through a tunnel
  // (Cloudflare quick tunnel), which uses a different host than localhost.
  allowedDevOrigins: ["*.trycloudflare.com"],
  // Internal packages ship as uncompiled TypeScript, so Next transpiles them.
  // Editing a package is then visible immediately, with no intermediate build.
  transpilePackages: [
    "@apexg/core",
    "@apexg/data",
    "@apexg/ui",
    "@apexg/module-kit",
    "@apexg/module-clients",
    "@apexg/module-memberships",
    "@apexg/module-payments",
    "@apexg/module-trainers",
    "@apexg/module-expenses",
    "@apexg/module-inventory",
    "@apexg/module-finances",
    "@apexg/module-daily-log",
  ],
};

export default nextConfig;
