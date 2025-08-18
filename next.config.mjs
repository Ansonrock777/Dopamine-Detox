/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@supabase/supabase-js"],
  webpack: (config, { isServer }) => {
    // Fix for Windows readlink issues
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
