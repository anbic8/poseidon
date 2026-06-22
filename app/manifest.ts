import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             'Poseidon – Schwimmtagebuch',
    short_name:       'Poseidon',
    description:      'Schwimmtagebuch für Wettkämpfe und Training',
    start_url:        '/',
    display:          'standalone',
    orientation:      'portrait-primary',
    background_color: '#ffffff',
    theme_color:      '#2563eb',
    categories:       ['sports', 'health'],
    icons: [
      {
        src:     '/poseidon.png',
        sizes:   'any',
        type:    'image/png',
        purpose: 'any',
      },
      {
        src:     '/icon.png',   // generiert von app/icon.tsx
        sizes:   '512x512',
        type:    'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      { name: 'Training',   url: '/training',     icons: [{ src: '/poseidon.png', sizes: 'any' }] },
      { name: 'Wettkämpfe', url: '/competitions', icons: [{ src: '/poseidon.png', sizes: 'any' }] },
      { name: 'Bestzeiten', url: '/bestzeiten',   icons: [{ src: '/poseidon.png', sizes: 'any' }] },
    ],
  }
}
