<script setup lang="ts">
import { gsap } from 'gsap'

// Loader: memuat foto dan font lebih dulu (dengan batas waktu), supaya animasi amplop
// dan hero berjalan mulus tanpa menunggu unduhan.
const emit = defineEmits<{ done: []; gone: [] }>()

const gallery = import.meta.glob<string>('../assets/gallery/*.{webp,jpg,jpeg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
})
const images = ['/images/hero-bw.webp', '/images/bride.webp', '/images/groom.webp', ...Object.values(gallery)]

const MIN_MS = 900 // tampil minimal, supaya tidak berkedip bila semuanya sudah ada di cache
const MAX_MS = 12000 // batas tunggu; sisanya dimuat di latar belakang

const root = ref<HTMLElement | null>(null)
const bar = ref<HTMLElement | null>(null)
const pct = ref<HTMLElement | null>(null)

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function loadImage(src: string) {
  return new Promise<void>((resolve) => {
    const im = new Image()
    im.decoding = 'async'
    im.src = src
    // decode() memastikan gambar sudah selesai didekode, jadi tidak tersendat saat pertama tampil
    if (im.decode) im.decode().then(() => resolve(), () => resolve())
    else {
      im.onload = () => resolve()
      im.onerror = () => resolve()
    }
  })
}

async function loadFonts() {
  const fs = (document as Document & { fonts?: FontFaceSet }).fonts
  if (!fs) return
  const wanted = ['400 1em "Bodoni Moda"', 'italic 400 1em "Bodoni Moda"', '300 1em Jost', '400 1em Jost']
  await Promise.race([Promise.all(wanted.map((f) => fs.load(f).catch(() => null))), sleep(4000)])
}

onMounted(async () => {
  const t0 = performance.now()
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const shown = { v: 0 }
  const paint = () => {
    if (bar.value) bar.value.style.transform = `scaleX(${shown.v})`
    if (pct.value) pct.value.textContent = String(Math.round(shown.v * 100))
  }
  const to = (v: number) =>
    gsap.to(shown, { v, duration: reduce ? 0 : 0.6, ease: 'power2.out', overwrite: true, onUpdate: paint })

  const total = images.length + 1
  let count = 0
  const bump = () => to(++count / total)

  const tasks = [...images.map((src) => loadImage(src).then(bump)), loadFonts().then(bump)]
  await Promise.race([Promise.all(tasks), sleep(MAX_MS)])
  await sleep(Math.max(0, MIN_MS - (performance.now() - t0)))

  await new Promise<void>((r) => to(1).eventCallback('onComplete', () => r()))
  await sleep(reduce ? 0 : 250)

  gsap.to(root.value, {
    opacity: 0,
    duration: reduce ? 0 : 0.8,
    ease: 'power1.out',
    onStart: () => emit('done'), // amplop mulai muncul selagi loader memudar
    onComplete: () => emit('gone'),
  })
})
</script>

<template>
  <div ref="root" class="loader" role="status" aria-live="polite" aria-label="Memuat undangan">
    <p class="loader__mono">R &amp; A</p>
    <div class="loader__meta">
      <div class="loader__bar"><span ref="bar" /></div>
      <p class="loader__pct"><span ref="pct">0</span>%</p>
    </div>
  </div>
</template>

<style scoped>
.loader {
  position: fixed;
  inset: 0;
  z-index: 150;
  display: grid;
  place-items: center;
  background: var(--ink);
  color: var(--ivory);
}
.loader__mono {
  font-family: var(--display);
  font-style: italic;
  font-size: 2.4rem;
  letter-spacing: 0.04em;
}
.loader__meta {
  position: absolute;
  top: calc(50% + 2.6rem);
  left: 50%;
  display: grid;
  justify-items: center;
  gap: 0.7rem;
  width: min(12rem, 50vw);
  transform: translateX(-50%);
}
.loader__bar {
  width: 100%;
  height: 1px;
  background: rgba(236, 233, 226, 0.2);
}
.loader__bar span {
  display: block;
  height: 100%;
  background: var(--champagne);
  transform: scaleX(0);
  transform-origin: left;
}
.loader__pct {
  font-size: 0.8rem;
  color: var(--stone);
  font-variant-numeric: tabular-nums;
}
</style>
