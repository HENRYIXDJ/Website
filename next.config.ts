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
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  webpack(config) {
    const webpack = require('webpack');

    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^react$/,
        (resource: any) => {
          if (resource.context && (resource.context.includes('sanity') || resource.context.includes('@sanity'))) {
            resource.request = require('path').resolve(__dirname, 'lib/react-shim.js');
          }
        }
      )
    );

    return config;
  },
};

export default nextConfig;
