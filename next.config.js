/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dejamos TypeScript tal cual (no bloquea builds)
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
