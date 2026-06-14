import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [
    react(),
    // Conditional bundle analyzer — only runs when ANALYZE=true
    process.env.ANALYZE === "true" &&
      visualizer({
        open: true,
        filename: "bundle-stats.html",
        gzipSize: true,
        brotliSize: true,
      }),
    // Minimal PWA / offline shell (safe for Capacitor — SW is protocol-aware)
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        name: "Nodes",
        short_name: "Nodes",
        description: "Визуализатор жизненного опыта и привычек (Second Brain)",
        theme_color: "#030303",
        background_color: "#030303",
        display: "standalone",
        orientation: "portrait",
        start_url: "./index.html",
        icons: [
          {
            src: "icons/icon-48x48.png",
            sizes: "48x48",
            type: "image/png"
          },
          {
            src: "icons/icon-72x72.png",
            sizes: "72x72",
            type: "image/png"
          },
          {
            src: "icons/icon-96x96.png",
            sizes: "96x96",
            type: "image/png"
          },
          {
            src: "icons/icon-128x128.png",
            sizes: "128x128",
            type: "image/png"
          },
          {
            src: "icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "icons/icon-256x256.png",
            sizes: "256x256",
            type: "image/png"
          },
          {
            src: "icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      },
      workbox: {
        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,woff2}",
        ],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /\.(?:woff|woff2|ttf|otf)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /\/locales\/.*\.json$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "i18n-translations-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          }
        ]
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    host: "127.0.0.1",
    watch: {
      ignored: ["**/android/**", "**/ios/**"]
    }
  },
  optimizeDeps: {
    entries: ["index.html"]
  },
  build: {
    // Skip compressed-size logging in build output — saves time
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-ui": ["zustand", "@tanstack/react-query"],
          "vendor-animation": ["motion"],
          "vendor-lucide": ["lucide-react"],
          "vendor-graph": ["react-force-graph-2d"],
          "vendor-charts": ["recharts"],
        },
      },
    },
  },
});
