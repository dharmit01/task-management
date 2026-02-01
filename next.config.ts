import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow network IP access
  ...(process.env.NODE_ENV === 'development' && {
    // This will be needed in future Next.js versions
    // For now, the warning is informational only
  }),
};

export default nextConfig;
