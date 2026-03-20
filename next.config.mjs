/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/universe/:id/production',
        destination: '/production',
        permanent: false,
      },
      {
        source: '/universe/:id/production/:path*',
        destination: '/production/:path*',
        permanent: false,
      },
      {
        source: '/dashboard',
        destination: '/production',
        permanent: false,
      },
    ];
  },
  experimental: {
    // Enable server actions for form handling
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  // Ensure Neo4j driver works in API routes
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
