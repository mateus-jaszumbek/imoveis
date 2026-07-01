import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  turbopack: {
    root: path.join(__dirname),
  },
  // Permite acessar o dev server de outros dispositivos na rede local
  // (ex: testar no celular via http://<ip-da-máquina>:3000)
  allowedDevOrigins: ['192.168.100.6'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
