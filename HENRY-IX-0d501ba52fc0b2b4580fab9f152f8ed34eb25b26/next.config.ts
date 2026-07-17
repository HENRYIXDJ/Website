import type {NextConfig} from 'next';
import { withBotId } from 'botid/next/config';
import path from 'path';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
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
      {
        protocol: 'https',
        hostname: 'pub-930b5248e181432aa6e2f5a31832fd8d.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
  transpilePackages: ['motion'],
  webpack: (config, {dev, webpack, nextRuntime, isServer}) => {
    if (!isServer) {
      if (config.resolve.alias) {
        delete config.resolve.alias['react'];
        delete config.resolve.alias['react$'];
      }
      config.resolve.alias = {
        ...config.resolve.alias,
        react$: path.resolve(__dirname, 'lib/react-shim.js'),
      };
    }

    if (isServer) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /[\\/]app[\\/]studio[\\/]\[\[\.\.\.index\]\][\\/]page\.tsx$/,
          path.resolve(__dirname, 'lib/studio-mock.js')
        )
      );
    }

    if (nextRuntime === 'edge') {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@workflow/world-local': false,
        '@workflow/world-vercel': false,
      };
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:/,
          path.resolve(__dirname, 'lib/empty.js')
        )
      );
    }
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

import { withWorkflow } from "workflow/next";

export default withWorkflow(withBotId(nextConfig));
