import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const isStaticExport = process.env.NEXT_OUTPUT_EXPORT === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  distDir: isStaticExport ? ".next-pages" : undefined,
  output: isStaticExport ? "export" : undefined,
  trailingSlash: isStaticExport,
  basePath: isGitHubPages ? basePath : undefined,
  assetPrefix: isGitHubPages ? `${basePath}/` : undefined,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    unoptimized: isStaticExport,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2_678_400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
