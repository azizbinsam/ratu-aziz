// Atur NUXT_PUBLIC_SITE_URL di Vercel (mis. https://undangan-kamu.vercel.app)
// supaya gambar pratinjau WhatsApp memakai alamat penuh.
const siteUrl = (process.env.NUXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
const title = 'The Wedding of Ratu & Aziz'
const description =
  'Kami mengundang Anda di pernikahan Ratu Siti Humairoh dan Abdul Aziz, Minggu 27 Desember 2026 di Rangkasbitung.'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: false },
  runtimeConfig: {
    public: {
      // Alamat Web App Google Apps Script untuk RSVP (lihat docs/rsvp-apps-script.gs)
      rsvpUrl: process.env.NUXT_PUBLIC_RSVP_URL || '',
    },
  },
  css: ['lenis/dist/lenis.css', '~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      title,
      meta: [
        { name: 'description', content: description },
        { name: 'theme-color', content: '#000000' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:image', content: `${siteUrl}/og.jpg` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..600;1,6..96,400..600&family=Jost:wght@300;400;500&display=swap',
        },
      ],
    },
  },
})
