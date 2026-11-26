import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page is behind auth and loads its data client-side through the BFF proxy,
  // so Cache Components / partial prefetching bring no benefit here.
  cacheComponents: false,
  devIndicators: { position: "bottom-left" },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
