/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: false, // Disable SWC minification to avoid binary issues
  // Ensure proper static asset handling
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  // Optimize for production
  compress: true,
  poweredByHeader: false,
  // Fallback to Babel if SWC fails
  experimental: {
    forceSwcTransforms: false,
  },
}

module.exports = nextConfig
