import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = withNextIntl({
  /* Configuración básica */
  
  // Agregar headers para políticas de permisos
  async headers() {
    return [
      {
        // Aplicar a todas las rutas
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=*, geolocation=*, interest-cohort=(), payment=*, magnetometer=*, gyroscope=*, accelerometer=*, autoplay=*, serial=*, xr-spatial-tracking=*'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          }
          // Las siguientes políticas pueden interferir con StackBlitz
          // {
          //   key: 'Cross-Origin-Embedder-Policy',
          //   value: 'require-corp'
          // },
          // {
          //   key: 'Cross-Origin-Opener-Policy',
          //   value: 'same-origin'
          // }
        ]
      },
      {
        // Ruta específica para el editor con configuraciones más permisivas
        source: '/generate/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://stackblitz.com https://*.stackblitz.io;"
          }
        ]
      }
    ];
  },
  
  // Configurar CORS para iframes y solicitudes externas
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*'
      },
      // Para permitir solicitudes a StackBlitz
      {
        source: '/stackblitz/:path*',
        destination: 'https://stackblitz.com/:path*'
      }
    ];
  }
});

export default nextConfig;
