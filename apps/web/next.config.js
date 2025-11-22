/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: {
    locales: ['it', 'de', 'en'],
    defaultLocale: 'it',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;