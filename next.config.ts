import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Ensure Three.js and related packages are processed correctly
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
