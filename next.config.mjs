/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? process.env.VITE_API_URL ?? "",
    NEXT_PUBLIC_FRONTEND_FORGE_API_KEY:
      process.env.NEXT_PUBLIC_FRONTEND_FORGE_API_KEY ??
      process.env.VITE_FRONTEND_FORGE_API_KEY ??
      "",
    NEXT_PUBLIC_FRONTEND_FORGE_API_URL:
      process.env.NEXT_PUBLIC_FRONTEND_FORGE_API_URL ??
      process.env.VITE_FRONTEND_FORGE_API_URL ??
      "",
  },
};

export default nextConfig;
