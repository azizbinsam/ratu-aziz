<script setup lang="ts">
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { wedding } from '~/data/wedding'

type Dir = 'ltr' | 'rtl'

const people = [
  { key: 'bride', dir: 'ltr' as Dir, label: 'Mempelai wanita', src: '/images/bride.webp', ...wedding.bride },
  { key: 'groom', dir: 'rtl' as Dir, label: 'Mempelai pria', src: '/images/groom.webp', ...wedding.groom },
]

// Tepi lengkung yang menyapu foto. Koordinat 0..1 (objectBoundingBox).
// p = 0 : belum terlihat, p = 1 : foto terbuka penuh.
const C = 0.22
function swipePath(p: number, dir: Dir) {
  const x = -C + p * (1 + 2 * C)
  const f = (v: number) => +(dir === 'ltr' ? v : 1 - v).toFixed(4)
  return `M${f(0)},0 L${f(x)},0 C${f(x + C)},0.33 ${f(x + C)},0.67 ${f(x)},1 L${f(0)},1 Z`
}

const root = ref<HTMLElement | null>(null)
let ctx: gsap.Context | null = null
const splits: SplitText[] = []

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !root.value) return
  const el = root.value
  ctx = gsap.context(() => {
    // Ayat: kata-kata menyala satu per satu mengikuti gulir.
    const verse = el.querySelector<HTMLElement>('.verse')!
    const verseSplit = SplitText.create(verse, { type: 'words' })
    splits.push(verseSplit)
    gsap.fromTo(
      verseSplit.words,
      { opacity: 0.18 },
      {
        opacity: 1,
        ease: 'none',
        stagger: 0.1,
        scrollTrigger: { trigger: verse, start: 'top 80%', end: 'bottom 45%', scrub: true },
      },
    )

    people.forEach((p) => {
      const person = el.querySelector<HTMLElement>(`.person--${p.key}`)!
      const media = person.querySelector<HTMLElement>('.person__media')!
      const image = media.querySelector('img')!
      const path = el.querySelector<SVGPathElement>(`#clip-${p.key}-path`)!
      const state = { p: 0 }
      path.setAttribute('d', swipePath(0, p.dir))

      const st = { trigger: media, start: 'top 90%', end: 'top 30%', scrub: 0.5 }

      // Sapuan lengkung mengikuti gulir
      gsap.to(state, {
        p: 1,
        ease: 'none',
        onUpdate: () => path.setAttribute('d', swipePath(state.p, p.dir)),
        scrollTrigger: st,
      })
      // Foto mengecil dari zoom ke ukuran sebenarnya selama disapu
      gsap.fromTo(image, { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: st })

      // Deskripsi masuk dari sisi yang berlawanan dengan foto
      const text = person.querySelector<HTMLElement>('.person__text')!
      const nameEl = text.querySelector<HTMLElement>('.person__name')!
      const nameSplit = SplitText.create(nameEl, { type: 'lines', mask: 'lines' })
      splits.push(nameSplit)
      const tl = gsap.timeline({ scrollTrigger: { trigger: text, start: 'top 82%', once: true } })
      tl.from(text.querySelector('.mark'), { opacity: 0, x: p.dir === 'ltr' ? 30 : -30, duration: 0.9, ease: 'power3.out' })
        .from(nameSplit.lines, { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.1 }, 0.1)
        .from(text.querySelector('.person__parents'), { opacity: 0, y: 16, duration: 1, ease: 'power2.out' }, 0.5)
    })
  }, el)
})

onBeforeUnmount(() => {
  ctx?.revert()
  splits.forEach((s) => s.revert())
})
</script>

<template>
  <section id="bab-2" ref="root" class="couple">
    <p class="mark">Dengan Rahmat-Mu</p>

    <blockquote class="verse-wrap">
      <p class="verse">{{ wedding.verse.text }}</p>
      <footer class="verse__src">{{ wedding.verse.source }}</footer>
    </blockquote>

    <div class="people">
      <article
        v-for="p in people"
        :key="p.key"
        class="person"
        :class="[`person--${p.key}`, { 'person--reverse': p.dir === 'rtl' }]"
      >
        <div class="person__media" :style="{ clipPath: `url(#clip-${p.key})` }">
          <img :src="p.src" :alt="`Potret ${p.name}`" width="1400" height="1866" loading="lazy" decoding="async" />
        </div>
        <div class="person__text">
          <p class="mark">{{ p.label }}</p>
          <h2 class="person__name">{{ p.name }}</h2>
          <p class="person__parents">{{ p.parents }}</p>
        </div>
      </article>
    </div>

    <svg class="clips" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <clipPath v-for="p in people" :id="`clip-${p.key}`" :key="p.key" clipPathUnits="objectBoundingBox">
          <path :id="`clip-${p.key}-path`" :d="swipePath(1, p.dir)" />
        </clipPath>
      </defs>
    </svg>
  </section>
</template>

<style scoped>
.couple {
  padding: 22svh 6vw 18svh;
  position: relative;
  z-index: 1;
}
.clips { position: absolute; }

.verse-wrap {
  max-width: 34rem;
  margin: 12svh auto 0;
  text-align: center;
}
.verse {
  font-family: var(--display);
  font-weight: 400;
  font-size: clamp(1.4rem, 2.9vw, 2.3rem);
  line-height: 1.35;
}
.verse__src {
  margin-top: 1.6rem;
  font-size: 0.9rem;
  color: var(--stone);
}

.people {
  display: grid;
  gap: 20svh;
  max-width: 72rem;
  margin: 22svh auto 0;
}

/* Foto kiri, deskripsi kanan. Mempelai pria sebaliknya. */
.person {
  display: grid;
  grid-template-columns: 11fr 10fr;
  gap: 5vw;
  align-items: center;
}
.person--reverse { grid-template-columns: 10fr 11fr; }
.person--reverse .person__media { order: 2; }
.person--reverse .person__text { order: 1; text-align: right; }
.person--reverse .person__parents { margin-left: auto; }

.person__media {
  aspect-ratio: 3 / 4;
  overflow: hidden;
}
.person__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.person__name {
  margin-top: 0.6rem;
  font-family: var(--display);
  font-weight: 400;
  font-size: clamp(1.1rem, 4.6vw, 2.6rem);
  line-height: 1.2;
}
.person__parents {
  margin-top: 0.9rem;
  max-width: 24rem;
  font-size: clamp(0.8rem, 2.6vw, 0.98rem);
  color: var(--stone);
}

@media (min-width: 768px) {
  .person { gap: 6vw; }
}
</style>