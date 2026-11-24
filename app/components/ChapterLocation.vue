<script setup lang="ts">
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { wedding } from '~/data/wedding'

const mapsHref = computed(
  () =>
    wedding.venue.mapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${wedding.venue.name}, ${wedding.venue.address}`)}`,
)

const root = ref<HTMLElement | null>(null)
let ctx: gsap.Context | null = null
let split: SplitText | null = null

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !root.value) return
  const el = root.value
  ctx = gsap.context(() => {
    const title = el.querySelector<HTMLElement>('.loc__title')!
    split = SplitText.create(title, { type: 'lines', mask: 'lines' })
    gsap.from(split.lines, {
      yPercent: 110,
      duration: 1.2,
      ease: 'power4.out',
      stagger: 0.1,
      scrollTrigger: { trigger: title, start: 'top 85%', once: true },
    })
    gsap.from('.loc__addr, .loc__btn', {
      opacity: 0,
      y: 16,
      duration: 1,
      stagger: 0.15,
      ease: 'power2.out',
      scrollTrigger: { trigger: title, start: 'top 80%', once: true },
    })

  }, el)
})

onBeforeUnmount(() => {
  ctx?.revert()
  split?.revert()
})
</script>

<template>
  <section id="bab-4" ref="root" class="loc">
    <p class="mark">Tempat</p>

    <div class="loc__grid">
      <div class="loc__text">
        <h2 class="loc__title">{{ wedding.venue.name }}</h2>
        <p class="loc__addr">{{ wedding.venue.address }}</p>
        <a class="btn loc__btn" :href="mapsHref" target="_blank" rel="noopener">Buka Google Maps</a>
      </div>

      <!-- Tempat penanda lokasi pada tali yang menjalar (lihat ThreadLine) -->
      <div class="loc__anchor" aria-hidden="true" />
    </div>
  </section>
</template>

<style scoped>
.loc {
  padding: 20svh 6vw 18svh;
  position: relative;
  z-index: 1;
}
.loc__grid {
  display: grid;
  gap: 8svh;
  max-width: 72rem;
  margin-top: 6svh;
}
.loc__title {
  font-family: var(--display);
  font-weight: 400;
  font-size: clamp(2.8rem, 10vw, 7rem);
  line-height: 1.05;
}
.loc__addr {
  margin-top: 1.4rem;
  max-width: 24rem;
  color: var(--stone);
}
.loc__btn { margin-top: 2.4rem; }
.loc__anchor {
  width: 45%;
  min-height: 9rem;
  justify-self: end;
}

@media (min-width: 768px) {
  .loc__grid { grid-template-columns: 1.2fr 1fr; align-items: center; }
}
</style>
