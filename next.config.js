/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
    reactStrictMode: false,
    swcMinify: true,
    images: {
        domains: ['firebasestorage.googleapis.com'],
    },
    compiler: {
        styledComponents: true,
        removeConsole: process.env.NODE_ENV === 'production',
    },
    // Les Server Actions sont disponibles par défaut dans Next.js 14.2.0
};

module.exports = nextConfig; 