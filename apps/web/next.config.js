/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@rental-marketplace/shared'],
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

module.exports = nextConfig;
