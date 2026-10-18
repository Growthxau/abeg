import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'G-Squad Automated Trading Platform',
    short_name: 'G-Squad',
    description: 'Automated trading platform for Deriv Synthetic Indices, with a dashboard to monitor your bot and manage trading settings.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#FAF5F5',
    theme_color: '#722F37',
    icons: [
      {
        src: '/logo.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
        purpose: 'maskable',
      },
      {
        src: '/logo.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'maskable',
      },
    ],
  };
}
