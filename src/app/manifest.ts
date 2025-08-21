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
  }
}