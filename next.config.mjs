import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@supabase/supabase-js"],
  webpack: (config, { isServer }) => {
    // Comprehensive Windows symlink fixes
    config.resolve.symlinks = false;
    
    // Additional Windows-specific fixes
    if (process.platform === 'win32') {
      // Prevent Windows readlink errors
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules/**', '**/.next/**'],
        poll: 1000,
        aggregateTimeout: 300,
      };
      
      // Fix for OneDrive symlink issues
      config.cache = {
        ...config.cache,
        type: 'filesystem',
        cacheDirectory: resolve(__dirname, '.next/cache'),
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    
    return config;
  },

  // PWA Performance Optimizations
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "lucide-react",
    ],
  },

  // Image optimization
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Headers for PWA caching
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/(icon-.*\\.png|manifest\\.webmanifest)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=1, stale-while-revalidate=59",
          },
        ],
      },
    ];
  },

  // Enable compression
  compress: true,
};

export default nextConfig;
