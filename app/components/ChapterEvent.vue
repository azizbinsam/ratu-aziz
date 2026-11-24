<script setup lang="ts">
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { wedding } from '~/data/wedding'

const [dayName, dateRest] = wedding.dateText.split(', ')

const root = ref<HTMLElement | null>(null)
const now = ref(Date.now())
const target = new Date(wedding.start).getTime()
const over = computed(() => now.value >= target)

const parts = computed(() => {
  const s = Math.floor(Math.max(0, target - now.value) / 1000)
  return [
    { n: Math.floor(s / 86400), l: 'hari' },
    { n: Math.floor((s % 86400) / 3600), l: 'jam' },
    { n: Math.floor((s % 3600) / 60), l: 'menit' },
    { n: s % 60, l: 'detik' },
  ]
})
const pad = (n: number) => String(n).padStart(2, '0')

const calendarUrl = computed(() => {
  const fmt = (d: string) => new Date(d).toISOString().replace(/[-:]|\.\d{3}/g, '')
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Pernikahan ${wedding.bride.short} & ${wedding.groom.short}`,
    dates: `${fmt(wedding.start)}/${fmt(wedding.end)}`,
    location: `${wedding.venue.name}, ${wedding.venue.address}`,
    details: 'Undangan pernikahan',
  })
  return `https://calendar.google.com/calendar/render?${q}`
})

let timer: ReturnType<typeof setInterval> | null = null
let ctx: gsap.Context | null = null
const splits: SplitText[] = []

onMounted(() => {
  timer = setInterval(() => (now.value = Date.now()), 1000)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !root.value) return
  const el = root.value

  ctx = gsap.context(() => {
    const date = el.querySelector<HTMLElement>('.event__date')!
    const dateSplit = SplitText.create(date, { type: 'lines', mask: 'lines' })
    splits.push(dateSplit)
    gsap.from(dateSplit.lines, {
      yPercent: 110,
      duration: 1.3,
      ease: 'power4.out',
      stagger: 0.14,
      scrollTrigger: { trigger: date, start: 'top 85%', once: true },
    })

    el.querySelectorAll<HTMLElement>('.event__item').forEach((item, i) => {
      const rule = item.querySelector('.event__rule')
      const time = item.querySelector<HTMLElement>('.event__time')!
      const meta = item.querySelectorAll('.event__name, .event__place')

      // Garis terbentang, angka naik per karakter
      const timeSplit = SplitText.create(time, { type: 'chars', mask: 'chars' })
      splits.push(timeSplit)
      const tl = gsap.timeline({ scrollTrigger: { trigger: item, start: 'top 80%', once: true } })
      tl.from(rule, { scaleX: 0, transformOrigin: 'left', duration: 1.4, ease: 'power3.inOut' })
        .from(meta, { opacity: 0, y: 14, duration: 0.9, stagger: 0.1, ease: 'power2.out' }, 0.3)
        .from(timeSplit.chars, { yPercent: 110, duration: 1.3, ease: 'power4.out', stagger: 0.08 }, 0.2)

      // Angka waktu bergeser berlawanan arah saat digulir
      gsap.fromTo(
        time,
        { xPercent: i % 2 ? 6 : -6 },
        {
          xPercent: i % 2 ? -6 : 6,
          ease: 'none',
          scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
    })

    gsap.from('.count__cell', {
      opacity: 0,
      y: 24,
      duration: 1,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.count', start: 'top 88%', once: true },
    })
  }, el)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  ctx?.revert()
  splits.forEach((s) => s.revert())
})
</script>

<template>
  <section id="bab-3" ref="root" class="event">
    <p class="mark">Waktu dan Tempat</p>

    <h2 class="event__date">
      <span>{{ dayName }}</span>
      <span>{{ dateRest }}</span>
    </h2>

    <div class="event__list">
      <article v-for="e in wedding.events" :key="e.key" class="event__item">
        <div class="event__rule" />
        <p class="event__name mark">{{ e.name }}</p>
        <p class="event__time">{{ e.time }}</p>
        <p class="event__place">{{ wedding.zone }}, {{ wedding.venue.name }}</p>
      </article>
    </div>

    <div class="count" role="timer" aria-label="Hitung mundur menuju hari pernikahan">
      <template v-if="!over">
        <div v-for="u in parts" :key="u.l" class="count__cell">
          <span class="count__n">{{ pad(u.n) }}</span>
          <span class="count__l">{{ u.l }}</span>
        </div>
      </template>
      <p v-else class="count__done">Hari yang dinanti telah tiba.</p>
    </div>

    <a class="btn event__cal" :href="calendarUrl" target="_blank" rel="noopener">Simpan ke kalender</a>
  </section>
</template>

<style scoped>
.event {
  padding: 22svh 6vw 18svh;
  position: relative;
  z-index: 1;
}
.event__date {
  margin-top: 6svh;
  font-family: var(--display);
  font-weight: 400;
  font-size: clamp(2.8rem, 10vw, 8rem);
  line-height: 1.05;
}
.event__date span { display: block; }

.event__list {
  display: grid;
  gap: 8svh;
  max-width: 72rem;
  margin-top: 14svh;
}
.event__rule {
  height: 1px;
  margin-bottom: 1.4rem;
  background: rgba(236, 233, 226, 0.3);
}
.event__time {
  font-family: var(--display);
  font-weight: 400;
  font-size: clamp(4.5rem, 20vw, 11rem);
  line-height: 1;
}
.event__place {
  margin-top: 0.8rem;
  font-size: 0.95rem;
  color: var(--stone);
}

.count {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2vw;
  max-width: 40rem;
  margin-top: 16svh;
}
.count__cell { display: grid; gap: 0.3rem; }
.count__n {
  font-family: var(--display);
  font-weight: 400;
  font-size: clamp(2.2rem, 9vw, 4.4rem);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.count__l { font-size: 0.85rem; color: var(--stone); }
.count__done {
  grid-column: 1 / -1;
  font-family: var(--display);
  font-size: clamp(1.3rem, 4vw, 2rem);
}
.event__cal { margin-top: 6svh; }

@media (min-width: 768px) {
  .event__list { grid-template-columns: 1fr 1fr; gap: 6vw; }
}
</style>
