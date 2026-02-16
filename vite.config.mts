import { fileURLToPath } from 'node:url'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Pages from 'vite-plugin-pages'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import vuetify from 'vite-plugin-vuetify'
import viteBasicSslPlugin from '@vitejs/plugin-basic-ssl'
import { ClientSideLayout } from 'vite-plugin-vue-layouts'
import VueDevTools from 'vite-plugin-vue-devtools'
// import ClosePlugin from './vite-plugin-close.ts' // Only if the build process remains stuck just before completion

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    open: true,
    port: 3000,
  },
  plugins: [
    // ClosePlugin(),
    VueDevTools(),
    vue(),
    viteBasicSslPlugin(),
    Pages(),

    // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
    vuetify({
      styles: {
        configFile: 'src/styles/variables/_vuetify.scss',
      },
    }),
    Components({
      dirs: ['src/@core/components', 'src/components'],
      dts: true,
    }),
    AutoImport({
      imports: ['vue', 'vue-router', '@vueuse/core', '@vueuse/math', 'vue-i18n', 'pinia'],
      vueTemplate: true,
    }),
    VueI18nPlugin({
      runtimeOnly: true,
      compositionOnly: true,
      include: [fileURLToPath(new URL('./src/plugins/i18n/locales/**', import.meta.url))],
    }),
    ClientSideLayout({
      defaultLayout: 'default',
    }),
  ],
  define: {
    'process.env': {},
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@themeConfig': fileURLToPath(new URL('./themeConfig.ts', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/@core', import.meta.url)),
      '@domain': fileURLToPath(new URL('./src/@domain', import.meta.url)),
      '@layouts': fileURLToPath(new URL('./src/@layouts', import.meta.url)),
      '@images': fileURLToPath(new URL('./src/assets/images/', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/styles/', import.meta.url)),
      '@configured-variables': fileURLToPath(new URL('./src/styles/variables/_template.scss', import.meta.url)),
      '@validators': fileURLToPath(new URL('./src/@core/utils/validators', import.meta.url)),
      apexcharts: fileURLToPath(new URL('node_modules/apexcharts-clevision', import.meta.url)),
    },
  },
  build: {
    cssMinify: 'lightningcss',
    chunkSizeWarningLimit: 5000,
    minify: 'terser',
    target: 'esnext',
    rollupOptions: {
      treeshake: false,
    },
  },
  optimizeDeps: {
    exclude: ['vuetify'],
    entries: ['./src/**/*.vue'],
  },
})
