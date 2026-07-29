import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // output: "standalone", // Commented for Vercel (Vercel manages its own output)
  // Uncomment for self-hosted / Docker deployments
  async rewrites() {
    return [
      {
        source: "/((?!api|_next|favicon|afrispine|robots|sitemap|manifest).*)",
        destination: "/",
      },
    ];
  },
};

export default nextConfig;