import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dopamine Detox - Digital Wellness App',
    short_name: 'Dopamine Detox',
    description: 'Break free from digital distractions with network-level blocking across all devices',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#3b82f6',
    orientation: 'portrait',
    scope: '/',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    categories: ['health', 'lifestyle', 'productivity', 'utilities'],
    screenshots: [
      {
        src: '/screenshot-mobile.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Mobile dashboard view'
      },
      {
        src: '/screenshot-desktop.png', 
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Desktop dashboard view'
      }
    ],
    shortcuts: [
      {
        name: 'Track Habits',
        short_name: 'Habits',
        description: 'Check in with your daily habits',
        url: '/habit-tracker',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      {
        name: 'Reflection Wall',
        short_name: 'Reflect',
        description: 'Take a moment to reflect on your digital wellness',
        url: '/reflection-wall',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192', 
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      {
        name: 'Website Blocking',
        short_name: 'Block Sites',
        description: 'Manage your blocked websites and apps',
        url: '/dashboard',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png', 
            purpose: 'any'
          }
        ]
      },
      {
        name: 'Setup Guide',
        short_name: 'Setup',
        description: 'Configure your digital wellness tools',
        url: '/dashboard/setup-instructions',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    ]
  }
}