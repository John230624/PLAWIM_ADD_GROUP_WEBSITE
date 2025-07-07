/** @type {import('next').NextConfig} */
const nextConfig = {
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
        protocol: 'http', // ou 'https' si nécessaire
        hostname: 'googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true, // <-- Ignore les erreurs eslint lors du build
  },
};

export default nextConfig;
