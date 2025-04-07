// const path = require('path');

const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  swcMinify: false,
  // assetPrefix: isProd ? 'http://blogstatic.curlyhair.cn/' : '/',
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  transpilePackages: ['next-international', 'international-types'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP', 'FID', 'INP'],
  },
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
        hostname: 'www.thecocktaildb.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // destination: 'http://www.curlyhair.cn:8080/mmall/:path*', // 替换为后端 URL
        destination: isProd
          ? 'http://www.curlyhair.cn:8080/:path*'
          : 'http://localhost:8080/:path*', // 替换为后端 URL
      },
    ];
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      bufferutil: 'commonjs bufferutil',
      canvas: 'commonjs canvas',
    });
    // config.externals.push('canvas');
    config.resolve.alias.canvas = false;
    // config.output.publicPath = isProd
    //   ? 'http://blogstatic.curlyhair.cn/_next/'
    //   : '/_next/';
    // config.infrastructureLogging = { debug: /PackFileCache/ };
    // console.log('???', path.join(__dirname, 'components/ui'));
    // config.resolve.alias['~ui'] = path.join(__dirname, 'components/ui');

    return config;
  },
};

module.exports = nextConfig;
