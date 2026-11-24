<script setup lang="ts">
import { gsap } from 'gsap'
import { wedding } from '~/data/wedding'

const props = defineProps<{ guest: string }>()
const emit = defineEmits<{ open: [] }>()

const done = ref(false)
const ready = ref(false) // tombol baru bisa ditekan setelah amplop selesai muncul
const clicked = ref(false)
const aspect = ref(0.666) // rasio surat = rasio bingkai hero, supaya perpindahannya mulus

const root = ref<HTMLElement | null>(null)
const pop = ref<HTMLElement | null>(null)
const float = ref<HTMLElement | null>(null)
const env = ref<HTMLElement | null>(null)
const flap = ref<HTMLElement | null>(null)
const letterbox = ref<HTMLElement | null>(null)
const letter = ref<HTMLElement | null>(null)
const action = ref<HTMLElement | null>(null)
const btn = ref<HTMLElement | null>(null)

const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const monogram = `${wedding.bride.short[0]}&${wedding.groom.short[0]}`
const nameSize = computed(() => {
  const n = props.guest.length
  return n > 34 ? '0.85rem' : n > 22 ? '1rem' : '1.3rem'
})

let entrance: gsap.core.Timeline | null = null
let floatTween: gsap.core.Tween | null = null

function measureAspect() {
  const f = document.querySelector<HTMLElement>('.hero__frame')
  const r = f?.getBoundingClientRect()
  if (r && r.height) aspect.value = r.width / r.height
}

onMounted(() => {
  measureAspect()
  window.addEventListener('resize', measureAspect)
  if (reduce()) {
    ready.value = true
    return
  }

  // Amplop muncul dari bawah layar sambil sedikit berputar, lalu berhenti miring.
  gsap.set(pop.value, { y: () => window.innerHeight })
  gsap.set(env.value, { rotation: -13 })
  gsap.set(action.value, { opacity: 0, y: 14 })

  entrance = gsap.timeline({ delay: 0.35 })
  entrance
    .to(pop.value, { y: 0, duration: 1.7, ease: 'back.out(0.8)' }, 0)
    .to(env.value, { rotation: -4, duration: 1.7, ease: 'power3.out' }, 0)
    .to(action.value, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }, 1.35)
    .add(() => {
      ready.value = true
      floatTween = gsap.to(float.value, { y: -7, rotation: 0.8, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      nextTick(() => btn.value?.focus({ preventScroll: true }))
    }, 1.6)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measureAspect)
  entrance?.kill()
  floatTween?.kill()
})

// Tombol tertarik pelan ke arah mouse
function onMagnet(e: PointerEvent) {
  if (e.pointerType !== 'mouse' || !btn.value) return
  const r = btn.value.getBoundingClientRect()
  gsap.to(btn.value, {
    x: (e.clientX - (r.left + r.width / 2)) * 0.25,
    y: (e.clientY - (r.top + r.height / 2)) * 0.35,
    duration: 0.4,
    ease: 'power3.out',
  })
}
function onMagnetLeave() {
  if (btn.value) gsap.to(btn.value, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' })
}

function onClick() {
  if (clicked.value || !ready.value) return
  clicked.value = true
  emit('open')
}

// Urutan: amplop lurus, tutup (flap) terbuka, surat naik, lalu surat membesar
// menjadi halaman hero sementara amplop jatuh ke bawah.
function open(onMid?: () => void): Promise<void> {
  return new Promise((resolve) => {
    if (reduce()) {
      onMid?.()
      done.value = true
      resolve()
      return
    }
    floatTween?.kill()
    const H = env.value!.offsetHeight

    gsap
      .timeline()
      .to(float.value, { y: 0, rotation: 0, duration: 0.5, ease: 'power2.out' }, 0)
      .to(action.value, { opacity: 0, y: 10, duration: 0.4, ease: 'power2.in' }, 0)
      .to(env.value, { rotation: 0, duration: 0.9, ease: 'power3.inOut' }, 0)
      // Tutup amplop: naik sampai tegak, lalu berbalik ke belakang amplop.
      .to(flap.value, { rotationX: 90, duration: 0.5, ease: 'power1.in' }, 0.3)
      .set(flap.value, { zIndex: 1 })
      .to(flap.value, { rotationX: 180, duration: 0.75, ease: 'power2.out' })
      // Surat naik keluar dari amplop
      .to(letter.value, { y: -H * 0.8, duration: 1.25, ease: 'power3.inOut' }, '+=0.05')
      .add(() => expand(H, onMid, resolve), '+=0.2')
  })
}

function expand(H: number, onMid: (() => void) | undefined, resolve: () => void) {
  const lr = letter.value!.getBoundingClientRect()
  const frame = document.querySelector<HTMLElement>('.hero__frame')?.getBoundingClientRect()
  const t = frame ?? ({ left: 0, top: 0, width: window.innerWidth, height: window.innerHeight } as DOMRect)

  const s = t.width / lr.width
  const dx = t.left + t.width / 2 - (lr.left + lr.width / 2)
  const dy = t.top + t.height / 2 - (lr.top + lr.height / 2)
  const x0 = gsap.getProperty(letter.value, 'x') as number
  const y0 = gsap.getProperty(letter.value, 'y') as number

  const pieces = root.value!.querySelectorAll('.env__back, .env__flap, .env__piece, .env__label')
  // Tutup amplop (3D) tidak boleh diberi opacity: sisi dalamnya akan berganti warna.
  // Ia jatuh bersama badan amplop dan tertutup surat yang membesar.
  const fades = root.value!.querySelectorAll('.env__back, .env__piece, .env__label')
  const drop = H * 1.7
  const clip = { d: 0 }

  gsap
    .timeline({
      onComplete: () => {
        done.value = true
        resolve()
      },
    })
    .to(letter.value, { x: x0 + dx, y: y0 + dy, scale: s, duration: 1.6, ease: 'power3.inOut' }, 0)
    // Badan amplop jatuh ke bawah; batas potong surat ikut turun bersamanya,
    // sehingga bagian surat yang tadinya di dalam amplop terungkap perlahan.
    .to(pieces, { y: `+=${drop}`, duration: 1.2, ease: 'power2.in' }, 0.1)
    .to(fades, { opacity: 0, duration: 0.5, ease: 'none' }, 0.8)
    .to(
      clip,
      {
        d: drop,
        duration: 1.2,
        ease: 'power2.in',
        onUpdate: () => {
          if (letterbox.value) letterbox.value.style.clipPath = `inset(-3000px -3000px ${-clip.d}px -3000px)`
        },
      },
      0.1,
    )
    .add(() => onMid?.(), 1.5)
    .to(root.value, { opacity: 0, duration: 0.5, ease: 'power1.out' }, 1.6)
}

defineExpose({ open })
</script>

<template>
  <div v-if="!done" ref="root" class="gate" role="dialog" aria-modal="true" aria-label="Undangan pernikahan">
    <div class="gate__stage">
      <div ref="pop" class="pop">
        <div ref="float" class="float">
          <div ref="env" class="env" :style="{ '--ar': aspect }">
            <div class="env__back" aria-hidden="true" />

            <div ref="letterbox" class="env__letterbox" aria-hidden="true">
              <div ref="letter" class="letter">
                <div class="letter__frame">
                  <img class="letter__img" src="/images/hero.webp" alt="" decoding="async" />
                </div>
              </div>
            </div>

            <div class="env__piece env__piece--l" aria-hidden="true" />
            <div class="env__piece env__piece--r" aria-hidden="true" />
            <div class="env__piece env__piece--b" aria-hidden="true" />

            <div class="env__label">
              <p class="label__to">Kepada Yth.</p>
              <p class="label__name" :style="{ fontSize: nameSize }">{{ guest }}</p>
            </div>

            <div ref="flap" class="env__flap" aria-hidden="true">
              <div class="flap__face flap__face--front">
                <span class="seal">{{ monogram }}</span>
              </div>
              <div class="flap__face flap__face--back" />
            </div>
          </div>
        </div>
      </div>

      <div ref="action" class="gate__action">
        <div class="gate__magnet" @pointermove="onMagnet" @pointerleave="onMagnetLeave">
          <button ref="btn" class="btn" type="button" :disabled="!ready || clicked" @click="onClick">
            Buka undangan
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gate {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--ink);
}
.gate__stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.6rem;
  width: 100%;
}
.gate__action { text-align: center; }
.gate__magnet { display: inline-block; padding: 1rem 2rem; }

/* ---- Amplop (flat) ---- */
.env {
  --w: min(80vw, 28rem);
  --paper: #ece9e2;
  position: relative;
  width: var(--w);
  aspect-ratio: 3 / 2;
  perspective: 1100px;
  will-change: transform;
}
.env > * { position: absolute; }

.env__back {
  inset: 0;
  z-index: 1;
  background: #b9b2a0;
}

.env__letterbox {
  inset: 0;
  z-index: 2;
  clip-path: inset(-3000px -3000px 0 -3000px); /* terbuka ke atas, terpotong di tepi bawah amplop */
}
.letter {
  position: absolute;
  top: 6%;
  left: 8%;
  width: 84%;
}
.letter__frame {
  position: relative;
  width: 100%;
  aspect-ratio: var(--ar);
  overflow: hidden;
  background: #111;
  filter: grayscale(1) contrast(1.12);
}
/* Sama persis dengan keadaan awal foto hero, supaya serah-terimanya tidak terlihat */
.letter__img {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 120%;
  object-fit: cover;
  object-position: 50% 100%;
  transform: scale(1.18);
  transform-origin: 50% 100%;
}

.env__piece { inset: 0; z-index: 3; }
.env__piece--l { background: #d8d2c3; clip-path: polygon(0 0, 50.6% 55%, 0 100%); }
.env__piece--r { background: #d4cebf; clip-path: polygon(100% 0, 49.4% 55%, 100% 100%); }
.env__piece--b { background: #e6e1d5; clip-path: polygon(0 100%, 50% 55%, 100% 100%); }

.env__label {
  z-index: 4;
  left: 14%;
  width: 72%;
  top: 63%;
  padding: 0.5rem 0.6rem;
  text-align: center;
  color: var(--ink);
  background: #fbfaf6;
  outline: 1px solid rgba(184, 163, 116, 0.8);
  outline-offset: -4px;
}
.label__to {
  font-size: 0.66rem;
  letter-spacing: 0.06em;
  color: #6f6b62;
}
.label__name {
  margin-top: 0.1rem;
  font-family: var(--display);
  font-weight: 400;
  line-height: 1.15;
  text-wrap: balance;
  overflow-wrap: anywhere;
}

/* Tutup amplop: dua sisi (depan dan dalam). Sisi dalam dibalik dengan rotateY agar
   segitiganya tetap menunjuk ke bawah di bidang tutup; kalau memakai rotateX, bentuknya
   terbalik dan setelah tutup terbuka ujungnya malah menghadap ke amplop. */
.env__flap {
  top: 0;
  left: 0;
  width: 100%;
  height: 58%;
  z-index: 6;
  transform-origin: 50% 0;
  transform-style: preserve-3d;
}
.flap__face {
  position: absolute;
  inset: 0;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.flap__face--front { background: #f3f0e8; }
.flap__face--back { background: #c9c2b0; transform: rotateY(180deg); }

.seal {
  position: absolute;
  left: 50%;
  top: calc(64% - 1.3rem);
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  font-family: var(--display);
  font-style: italic;
  font-size: 0.95rem;
  color: #3b3426;
  background: var(--champagne);
  border-radius: 50%;
  box-shadow: inset 0 0 0 3px #f3f0e8, inset 0 0 0 4px rgba(59, 52, 38, 0.35);
  transform: translateX(-50%);
}

@media (min-width: 768px) {
  .env { --w: min(34rem, 56svh * 1.5); }
  .label__to { font-size: 0.75rem; }
}
</style>
