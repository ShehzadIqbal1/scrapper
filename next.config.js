/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // mongoose must stay a normal Node dependency in route handlers
  experimental: { serverComponentsExternalPackages: ['mongoose'] }
};
module.exports = nextConfig;
