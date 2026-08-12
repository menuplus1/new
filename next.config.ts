import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** حزمة مستقلة تعمل على أي خادم Node (cPanel/Passenger أو VPS) بلا node_modules كاملة:
   *  .next/standalone/server.js يشغّل الموقع بنفسه. */
  output: "standalone",
};

export default nextConfig;
