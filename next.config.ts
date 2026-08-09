import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['sanity', '@sanity/vision', 'next-sanity'],
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tegbbmt42xpyzcnx.private.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-930b5248e181432aa6e2f5a31832fd8d.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-c7c5ff43a8ae174ad91e2668de0ad7f0.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  webpack(config) {
    let compilerRuntime: string;
    try {
      compilerRuntime = require.resolve('react/compiler-runtime');
    } catch {
      compilerRuntime = require('path').resolve(__dirname, 'lib/empty.js');
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      'react/compiler-runtime': compilerRuntime,
      'react/jsx-runtime': require.resolve('react/jsx-runtime'),
      'react/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime'),
      'react$': require('path').resolve(__dirname, 'lib/react-shim.js'),
      'react': require('path').resolve(__dirname, 'lib/react-shim.js'),
    };
    return config;
  },
};

export default nextConfig;
