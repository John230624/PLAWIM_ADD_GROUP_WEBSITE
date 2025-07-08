/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // active la génération statique
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
};

export default nextConfig;
