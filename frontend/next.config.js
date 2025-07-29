/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  // Ensure proper static asset handling
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  // Optimize for production
  compress: true,
  poweredByHeader: false,
}

module.exports = nextConfig
