import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Yeni sürüm yayına çıktığında telefondaki uygulama kendini günceller;
      // kullanıcıdan "yenile" beklemiyoruz.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon-32x32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Bütçem — Akıllı Finans Yönetimi',
        short_name: 'Bütçem',
        description:
          'Kişisel finans yönetimi: gelir, harcama, yatırım takibi ve AI destekli finansal asistan.',
        lang: 'tr',
        // standalone: ana ekrandan açıldığında Safari arayüzü olmadan tam ekran
        display: 'standalone',
        scope: '/',
        start_url: '/',
        theme_color: '#0F141B',
        background_color: '#0F141B',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Yalnızca derleme çıktısı önbelleğe alınır (uygulama kabuğu).
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        // /api/* ASLA önbelleğe alınmıyor: finans verisi her zaman canlı
        // gelmeli ve kimliğe bağlı cevaplar diskte tutulmamalı.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Fontlar offline'da da gelsin diye uzun ömürlü önbellek
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
