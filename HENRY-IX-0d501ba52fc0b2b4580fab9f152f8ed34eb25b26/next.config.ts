import type {NextConfig} from 'next';
import { withBotId } from 'botid/next/config';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: process.env.CF_PAGES === '1',
  },
  // Allow access to remote image placeholder.
  images: {
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
    ],
  },

  transpilePackages: ['motion'],
  webpack: (config, {dev, webpack}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    config.plugins.push(new webpack.DefinePlugin({
      'require.main.filename': JSON.stringify('/tmp/dummy.js'),
    }));
    return config;
  },
};

export default nextConfig;
