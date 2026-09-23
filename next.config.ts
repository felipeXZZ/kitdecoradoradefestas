import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Existe um package-lock.json solto em C:\Users\Felipe; fixa a raiz no projeto.
  turbopack: { root: path.join(__dirname) },
};

export default nextConfig;
