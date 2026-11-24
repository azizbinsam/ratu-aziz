<script setup lang="ts">
import { gsap } from 'gsap'

// Kursor gelembung: titik kecil mengikuti cepat, cincin mengikuti dengan jeda.
// Cincin membesar di atas tombol, tautan, dan foto galeri.
const enabled = ref(false)
const dot = ref<HTMLElement | null>(null)
const ring = ref<HTMLElement | null>(null)

let ctx: gsap.Context | null = null
let move: ((e: PointerEvent) => void) | null = null
let over: ((e: PointerEvent) => void) | null = null
let down: (() => void) | null = null
let up: (() => void) | null = null

onMounted(async () => {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
  enabled.value = true
  await nextTick()
  if (!dot.value || !ring.value) return

  document.documentElement.classList.add('has-cursor')
  ctx = gsap.context(() => {
    gsap.set([dot.value, ring.value], { xPercent: -50, yPercent: -50, opacity: 0 })
    const dx = gsap.quickTo(dot.value, 'x', { duration: 0.12, ease: 'power3' })
    const dy = gsap.quickTo(dot.value, 'y', { duration: 0.12, ease: 'power3' })
    const rx = gsap.quickTo(ring.value, 'x', { duration: 0.5, ease: 'power3' })
    const ry = gsap.quickTo(ring.value, 'y', { duration: 0.5, ease: 'power3' })
    let shown = false
    let scale = 1

    const setScale = (s: number) => {
      scale = s
      gsap.to(ring.value, { scale: s, duration: 0.45, ease: 'power3.out', overwrite: 'auto' })
    }

    move = (e) => {
      if (!shown) {
        shown = true
        gsap.set([dot.value, ring.value], { x: e.clientX, y: e.clientY })
        gsap.to([dot.value, ring.value], { opacity: 1, duration: 0.4 })
      }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY)
    }
    over = (e) => {
      const t = e.target as HTMLElement | null
      const hit = t?.closest?.('[data-cursor], a, button')
      if (!hit) return setScale(1)
      setScale(hit.getAttribute('data-cursor') === 'big' ? 3 : 2)
    }
    down = () => gsap.to(ring.value, { scale: scale * 0.8, duration: 0.2 })
    up = () => gsap.to(ring.value, { scale, duration: 0.4, ease: 'power3.out' })

    window.addEventListener('pointermove', move)
    document.addEventListener('pointerover', over)
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
  })
})

onBeforeUnmount(() => {
  if (move) window.removeEventListener('pointermove', move)
  if (over) document.removeEventListener('pointerover', over)
  if (down) window.removeEventListener('pointerdown', down)
  if (up) window.removeEventListener('pointerup', up)
  document.documentElement.classList.remove('has-cursor')
  ctx?.revert()
})
</script>

<template>
  <div v-if="enabled" class="cursor" aria-hidden="true">
    <div ref="ring" class="cursor__ring" />
    <div ref="dot" class="cursor__dot" />
  </div>
</template>

<style scoped>
.cursor { pointer-events: none; }
.cursor__ring,
.cursor__dot {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 200;
  border-radius: 50%;
  mix-blend-mode: difference;
  will-change: transform;
}
.cursor__ring {
  width: 38px;
  height: 38px;
  border: 1px solid rgba(236, 233, 226, 0.85);
  background: rgba(236, 233, 226, 0.08);
}
.cursor__dot {
  width: 6px;
  height: 6px;
  background: var(--ivory);
}
</style>
