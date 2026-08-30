/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // Ensure CSS modules work properly in production
  experimental: {
    optimizeCss: false, // Disable CSS optimization that might break custom styles
  },

  // Preserve important CSS during build
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
}

export default nextConfig
