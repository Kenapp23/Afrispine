import type { NextConfig } from "next";
import { networkInterfaces } from "os";

// Collect all local network IPs so the Z.ai preview iframe can load _next assets
// even when it connects via the machine's IP rather than a domain.
function getLocalIps(): string[] {
  const ips: string[] = [];
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips;
}

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    // Z.ai preview panel loads the app in an iframe
    'space-z.ai',
    // All local network IPs (changes per sandbox session)
    ...getLocalIps(),
  ],
};

export default nextConfig;
