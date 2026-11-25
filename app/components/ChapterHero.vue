<script setup lang="ts">
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { wedding } from '~/data/wedding'

const root = ref<HTMLElement | null>(null)
const img = ref<HTMLImageElement | null>(null)
const meta = ref<HTMLElement | null>(null)
const namesEl = ref<HTMLElement | null>(null)

let ctx: gsap.Context | null = null
let splits: SplitText[] = []
let onMove: ((e: PointerEvent) => void) | null = null
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

onMounted(() => {
  if (reduce() || !root.value) return
  ctx = gsap.context(() => {
    // Keadaan awal. Hero berada di balik gerbang sampai undangan dibuka.
    gsap.set(img.value, { scale: 1.18, transformOrigin: '50% 100%' })
    gsap.set(meta.value, { opacity: 0 })
    splits = gsap.utils
      .toArray<HTMLElement>('.js-split', root.value)
      .map((el) => SplitText.create(el, { type: 'chars', mask: 'chars' }))
    gsap.set(splits.flatMap((s) => s.chars), { yPercent: 105 })

    // Parallax saat gulir
    const small = window.innerWidth < 768
    const trigger = { trigger: root.value, start: 'top top', end: 'bottom top', scrub: true }
    gsap.to(img.value, { yPercent: small ? 3 : 5, ease: 'none', scrollTrigger: trigger })
    gsap.to('.name--a', { yPercent: small ? -10 : -18, ease: 'none', scrollTrigger: trigger })
    gsap.to('.name--b', { yPercent: small ? 10 : 18, ease: 'none', scrollTrigger: trigger })

    // Foto sedikit melebar dan meredup saat hero ditinggalkan
    gsap.to('.hero__frame', { opacity: 0.35, ease: 'none', scrollTrigger: trigger })

    // Gerak mouse (hanya perangkat dengan kursor)
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const qx = gsap.quickTo(namesEl.value, 'x', { duration: 1.2, ease: 'power3' })
      const qy = gsap.quickTo(namesEl.value, 'y', { duration: 1.2, ease: 'power3' })
      onMove = (e: PointerEvent) => {
        qx(-(e.clientX / window.innerWidth - 0.5) * 40)
        qy(-(e.clientY / window.innerHeight - 0.5) * 26)
      }
      window.addEventListener('pointermove', onMove)
    }
  }, root.value)
})

function intro() {
  if (reduce() || !ctx) return
  ctx.add(() => {
    const tl = gsap.timeline()
    tl.to(img.value, { scale: 1, duration: 2.8, ease: 'power2.out' }, 0)
      .to(splits.flatMap((s) => s.chars), { yPercent: 0, duration: 1.4, ease: 'power4.out', stagger: 0.07 }, 0.2)
      .to(meta.value, { opacity: 1, duration: 1.2, ease: 'power1.out' }, 1.5)
  })
}

onBeforeUnmount(() => {
  if (onMove) window.removeEventListener('pointermove', onMove)
  ctx?.revert()
  splits.forEach((s) => s.revert())
})

defineExpose({ intro })
</script>

<template>
  <section id="bab-1" ref="root" class="hero">
    <div class="hero__frame">
      <img
        ref="img"
        class="hero__img"
        src="/images/hero-bw.webp"
        alt="Ratu dan Aziz berdiri saling membelakangi di depan tirai putih"
        width="1066"
        height="1600"
        fetchpriority="high"
        decoding="async"
      />
    </div>

    <div class="hero__type">
      <p class="mark hero__chapter">The Wedding of</p>
      <h1 ref="namesEl" class="hero__names">
        <span class="name name--a js-split">{{ wedding.bride.short }}</span>
        <span class="amp js-split">&amp;</span>
        <span class="name name--b js-split">{{ wedding.groom.short }}</span>
      </h1>
      <div ref="meta" class="hero__meta">
        <p>{{ wedding.dateText }}</p>
        <p>{{ wedding.place }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  display: grid;
  place-items: center;
  height: 100svh;
  min-height: 560px;
  overflow: hidden;
  background: var(--ink);
}

/* Foto dipotong dari atas supaya watermark fotografer tidak tampil di hero. */
.hero__frame {
  position: relative;
  width: min(100vw, calc(100svh * 0.666));
  height: 100%;
  overflow: hidden;
}
.hero__img {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 120%;
  object-fit: cover;
  object-position: 50% 100%;
  will-change: transform;
}

/* Teks memakai blend "difference": terbaca di atas hitam maupun putih. */
.hero__type {
  position: absolute;
  inset: 0;
  color: var(--ivory);
  mix-blend-mode: difference;
  pointer-events: none;
}
.hero__chapter {
  position: absolute;
  top: max(2rem, 5svh);
  left: 50%;
  transform: translateX(-50%);
  color: inherit;
}
.hero__names {
  position: absolute;
  inset: 0;
  font-family: var(--display);
  font-weight: 400;
  font-size: clamp(4.6rem, 22vw, 14rem);
}
.name {
  position: absolute;
  line-height: 1.05;
}
.name--a { left: 5vw; top: 14svh; }
.name--b { right: 5vw; bottom: 20svh; }
.amp {
  position: absolute;
  top: 50%;
  left: 50%;
  font-style: italic;
  font-size: 0.38em;
  line-height: 1.2;
  transform: translate(-50%, -50%);
}

.hero__meta {
  position: absolute;
  left: 0;
  right: 0;
  bottom: max(2rem, 5svh);
  display: flex;
  justify-content: center;
  gap: 1.4rem;
  font-size: 0.85rem;
  font-weight: 400;
  letter-spacing: 0.04em;
}
@media (min-width: 768px) {
  .hero__meta { gap: 2.4rem; font-size: 0.95rem; }
}

/* Mobile: wajah mempelai ada di sekitar 18-32% tinggi layar.
   Kedua nama diturunkan ke sepertiga bawah supaya wajah tetap bersih. */
@media (max-width: 767px) {
  .hero__names { font-size: clamp(3.6rem, 19vw, 6.5rem); }
  .name--a { top: auto; bottom: 36svh; left: 5vw; }
  .name--b { bottom: 19svh; right: 5vw; }
  .amp { top: 68%; }
}
</style>
