<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

// Semua foto di app/assets/gallery otomatis masuk, diurutkan menurut nama file
// (01, 02, 03, ...). Untuk menambah foto cukup masukkan file baru ke folder itu.
const modules = import.meta.glob<string>('../assets/gallery/*.{webp,jpg,jpeg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
})
const photos = Object.entries(modules)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, src], i) => ({ src, alt: `Foto kebersamaan Ratu dan Aziz, nomor ${i + 1}` }))

const root = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
const bar = ref<HTMLElement | null>(null)

let ctx: gsap.Context | null = null
let split: SplitText | null = null
let loaded = 0

// Lebar track baru diketahui setelah semua foto termuat.
function onImgLoad() {
  loaded += 1
  if (loaded >= photos.length) ScrollTrigger.refresh()
}

onMounted(() => {
  if (!root.value || !track.value) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) return // CSS menyediakan gulir horizontal biasa

  ctx = gsap.context(() => {
    const dist = () => Math.max(0, track.value!.scrollWidth - window.innerWidth)

    const slide = gsap.to(track.value, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: root.value,
        start: 'top top',
        end: () => `+=${dist()}`,
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    })

    gsap.to(bar.value, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { trigger: root.value, start: 'top top', end: () => `+=${dist()}`, scrub: true, invalidateOnRefresh: true },
    })

    const title = root.value!.querySelector<HTMLElement>('.gallery__title')!
    split = SplitText.create(title, { type: 'lines', mask: 'lines' })
    gsap.from(split.lines, {
      yPercent: 110,
      duration: 1.2,
      ease: 'power4.out',
      stagger: 0.12,
      scrollTrigger: { trigger: root.value, start: 'top 70%', once: true },
    })

    gsap.utils.toArray<HTMLElement>('.gallery__item', root.value!).forEach((item) => {
      const inner = item.querySelector('.gallery__inner')!
      const gray = item.querySelector('.gallery__gray')!
      const base = { trigger: item, containerAnimation: slide, scrub: true }
      // Hitam putih berganti warna ketika foto masuk dari kanan. Yang dianimasikan hanya
      // opacity lapisan abu-abu (murah), bukan filter pada foto besar (mahal).
      gsap.fromTo(gray, { opacity: 1 }, { opacity: 0, ease: 'none', scrollTrigger: { ...base, start: 'left 92%', end: 'left 50%' } })
      // Foto bergeser sedikit di dalam bingkainya (kedalaman)
      gsap.fromTo(
        inner,
        { xPercent: -4, scale: 1.12 },
        { xPercent: 4, scale: 1.12, ease: 'none', scrollTrigger: { ...base, start: 'left right', end: 'right left' } },
      )
    })
  }, root.value)
})

onBeforeUnmount(() => {
  ctx?.revert()
  split?.revert()
})
</script>

<template>
  <section id="bab-2-galeri" ref="root" class="gallery">
    <div ref="track" class="gallery__track">
      <div class="gallery__intro">
        <h2 class="gallery__title">Momen yang<br />kami simpan</h2>
        <p class="gallery__hint">Gulir untuk melihat foto</p>
      </div>

      <figure v-for="photo in photos" :key="photo.src" class="gallery__item" data-cursor="big">
        <div class="gallery__photo">
          <div class="gallery__inner">
            <img class="gallery__color" :src="photo.src" :alt="photo.alt" decoding="async" @load="onImgLoad" />
            <img class="gallery__gray" :src="photo.src" alt="" aria-hidden="true" decoding="async" />
          </div>
        </div>
      </figure>

      <div class="gallery__end" aria-hidden="true" />
    </div>

    <div class="gallery__progress" aria-hidden="true"><span ref="bar" /></div>
  </section>
</template>

<style scoped>
.gallery {
  position: relative;
  z-index: 2;
  height: 100svh;
  min-height: 520px;
  overflow: hidden;
  background: var(--ink);
}
@media (prefers-reduced-motion: reduce) {
  .gallery { overflow-x: auto; }
}

.gallery__track {
  display: flex;
  align-items: center;
  gap: 6vw;
  width: max-content;
  height: 100%;
  padding: 0 8vw;
  will-change: transform;
}

.gallery__intro { flex: 0 0 auto; width: min(80vw, 44rem); }
.gallery__title {
  font-family: var(--display);
  font-weight: 400;
  font-size: clamp(2.6rem, 9vw, 7rem);
  line-height: 1.05;
}
.gallery__hint {
  margin-top: 2rem;
  font-size: 0.95rem;
  color: var(--stone);
}

.gallery__item {
  flex: 0 0 auto;
  height: 60svh;
  margin: 0;
}
.gallery__item:nth-of-type(odd) { margin-bottom: 10svh; }
.gallery__item:nth-of-type(even) { margin-top: 10svh; }
.gallery__photo {
  height: 100%;
  overflow: hidden;
  transition: transform 0.9s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.gallery__item:hover .gallery__photo { transform: scale(1.03); }
.gallery__inner { position: relative; height: 100%; width: fit-content; }
.gallery__color {
  display: block;
  height: 100%;
  width: auto;
  max-width: none;
}
.gallery__gray {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  filter: grayscale(1) contrast(1.1); /* statis: dihitung sekali, tidak per frame */
  will-change: opacity;
}
@media (prefers-reduced-motion: reduce) {
  .gallery__gray { display: none; }
}
.gallery__end { flex: 0 0 4vw; }

.gallery__progress {
  position: absolute;
  left: 8vw;
  right: 8vw;
  bottom: max(2rem, 6svh);
  height: 1px;
  background: rgba(236, 233, 226, 0.18);
}
.gallery__progress span {
  display: block;
  height: 100%;
  background: var(--champagne);
  transform: scaleX(0);
  transform-origin: left;
}

@media (min-width: 768px) {
  .gallery__item { height: 68svh; }
}
</style>
