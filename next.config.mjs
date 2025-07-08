/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // désactive strict mode en dev
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/chemin/vers/vos/images/**',
      },
      {
        protocol: 'http',
        hostname: 'googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    incrementalCacheHandlerPath: './cache-handler.js'
  }
};

export default nextConfig;