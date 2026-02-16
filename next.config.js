// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      { source: '/plan', destination: '/plan.html' },
      { source: '/plan-financiero', destination: '/plan-financiero.html' },
    ]
  },
}

module.exports = nextConfig