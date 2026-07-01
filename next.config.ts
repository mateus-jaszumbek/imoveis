import type { NextConfig } from "next";
import path from "path";

// Permite tanto o Supabase Cloud (produção) quanto um stack Docker local
// (dev) sem precisar trocar a política conforme o ambiente.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co http://localhost:8000",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co http://localhost:8000 ws://localhost:8000 https://viacep.com.br",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
].join('; ')

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  turbopack: {
    root: path.join(__dirname),
  },
  // Permite acessar o dev server de outros dispositivos na rede local
  // (ex: testar no celular via http://<ip-da-máquina>:3000)
  allowedDevOrigins: ['192.168.100.6'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'Content-Security-Policy', value: CSP },
        ],
      },
    ]
  },
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
