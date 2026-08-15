import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root. Without this, a stray lockfile in a parent
  // directory is picked up as the root and the build warns (and traces the
  // wrong files).
  turbopack: { root: __dirname },
  outputFileTracingRoot: path.join(__dirname),

  async headers() {
    return [
      {
        // Every file in public/fonts carries a content hash in its name, so a
        // changed font is a changed URL and a cached one can never be stale.
        // Next does not fingerprint /public itself, which is why this is here
        // rather than left to the default (max-age=0) treatment.
        source: "/fonts/:file*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
