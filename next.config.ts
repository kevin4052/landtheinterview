import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Opt large, Node-only libraries out of Server Component / Route Handler
  // bundling so Turbopack loads them via native require() instead of pulling
  // them into the module graph. Keeps the `next dev` heap from climbing as
  // these heavy deps get re-evaluated across HMR cycles.
  // (@react-pdf/renderer is already auto-externalized by Next.)
  serverExternalPackages: ["mammoth", "unpdf", "docx"],
};

export default nextConfig;
