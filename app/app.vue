<script setup lang="ts">
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { wedding } from '~/data/wedding'

const route = useRoute()
// Nama tamu dari tautan, mis. ?to=Bapak+Ahmad
const linkName = computed(() => {
  const raw = Array.isArray(route.query.to) ? route.query.to[0] : route.query.to
  return (raw ?? '').toString().trim().slice(0, 60)
})
const guest = computed(() => linkName.value || 'Tamu Undangan')

const gate = ref<{ open: (onMid?: () => void) => Promise<void> } | null>(null)
const hero = ref<{ intro: () => void } | null>(null)
const audio = ref<HTMLAudioElement | null>(null)
const bar = ref<HTMLElement | null>(null)
const opened = ref(false)
const loaded = ref(false) // foto dan font selesai dimuat
const loaderGone = ref(false)
const playing = ref(false)

const { init, lock, unlock, armAuto } = useScroll()

onMounted(() => {
  history.scrollRestoration = 'manual'
  window.scrollTo(0, 0)
  init()
  lock()
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => bar.value && (bar.value.style.transform = `scaleX(${self.progress})`),
  })
  if (document.readyState === 'complete') ScrollTrigger.refresh()
  else window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })
})

async function startMusic() {
  try {
    await audio.value?.play()
    playing.value = true
  } catch {
    playing.value = false // file belum ada atau browser menolak
  }
}

function toggleMusic() {
  if (playing.value) {
    audio.value?.pause()
    playing.value = false
  } else {
    startMusic()
  }
}

function onLoaded() {
  loaded.value = true
  ScrollTrigger.refresh() // ukuran foto sudah pasti
}

async function onOpen() {
  if (opened.value) return
  opened.value = true
  startMusic()
  await gate.value?.open(() => hero.value?.intro())
  unlock()
  ScrollTrigger.refresh()
  armAuto(4500) // gulir otomatis dimulai setelah intro hero selesai
}
</script>

<template>
  <div>
    <div class="progress" aria-hidden="true"><span ref="bar" /></div>
    <Preloader v-if="!loaderGone" @done="onLoaded" @gone="loaderGone = true" />
    <BubbleField v-if="loaded" />
    <BubbleCursor v-if="loaded" />
    <OpeningGate ref="gate" :guest="guest" :start="loaded" @open="onOpen" />

    <div class="page">
    <ThreadLine />
    <main>
      <ChapterHero ref="hero" />
      <ChapterCouple />
      <ChapterGallery />
      <ChapterEvent />
      <ChapterLocation />
      <ChapterRsvp :guest="linkName" />
    </main>

    <footer class="foot">
      <p class="foot__thanks">Terima kasih atas doa dan kehadiran Anda.</p>
      <p>{{ wedding.bride.short }} &amp; {{ wedding.groom.short }}, {{ wedding.dateText }}</p>
    </footer>
    </div>

    <BottomNav v-if="opened" />
    <MusicToggle v-if="opened" :playing="playing" @toggle="toggleMusic" />
    <AutoScrollToggle v-if="opened" />
    <audio ref="audio" src="/audio/music.mp3" loop preload="none" />
  </div>
</template>

<style>
.progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 60;
  height: 2px;
  pointer-events: none;
}
.progress span {
  display: block;
  height: 100%;
  background: var(--champagne);
  transform: scaleX(0);
  transform-origin: left;
}
.page { position: relative; }
.page > main,
.page > footer { position: relative; z-index: 1; }
.foot__thanks {
  margin-bottom: 1rem;
  font-family: var(--display);
  font-size: clamp(1.3rem, 4vw, 2rem);
  color: var(--ivory);
}
.foot {
  padding: 10svh 6vw 18svh;
  text-align: center;
  font-size: 0.9rem;
  color: var(--stone);
}
</style>
