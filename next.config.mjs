/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.LEGALOPS_NEXT_DIST_DIR || '.next',
  async headers() { return [{ source: '/club-sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }, { key: 'Service-Worker-Allowed', value: '/' }] }, { source: '/club-pwa/manifest.webmanifest', headers: [{ key: 'Content-Type', value: 'application/manifest+json' }, { key: 'Cache-Control', value: 'no-cache' }] }] },
  experimental: { serverActions: { bodySizeLimit: '6mb' } } }

export default nextConfig
