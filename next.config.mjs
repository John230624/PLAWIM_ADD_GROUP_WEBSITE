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
      { // Ajoutez ce nouveau pattern pour googleusercontent.com
        protocol: 'http', // L'URL que vous avez fournie était http, assurez-vous que c'est correct.
                          // Si l'image est servie via HTTPS, changez à 'https'.
        hostname: 'googleusercontent.com',
        port: '',
        pathname: '/**', // Autorise n'importe quel chemin sur ce hostname
      },
    ],
  },
};

export default nextConfig;