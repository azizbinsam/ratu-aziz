<script setup lang="ts">
import { gsap } from 'gsap'

// Gelembung: melayang pelan, menghindari kursor, ikut terbawa gulir,
// muncul sebagai jejak saat mouse bergerak, dan meletus saat klik atau sentuh.
type Kind = 'ambient' | 'trail' | 'burst'
interface Bubble {
  kind: Kind
  x: number
  y: number
  r: number
  vx: number
  vy: number
  base: number
  age: number
  life: number
  phase: number
  tint: 0 | 1
}

const TAU = Math.PI * 2
const canvas = ref<HTMLCanvasElement | null>(null)
const bubbles: Bubble[] = []
const pointer = { x: -999, y: -999, active: false, lastX: 0, lastY: 0, lastT: 0 }

let c: CanvasRenderingContext2D | null = null
let w = 0
let h = 0
let lastScroll = 0
let running = false

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const transient = () => bubbles.filter((b) => b.kind !== 'ambient').length

function ambient(initial: boolean): Bubble {
  const r = rand(6, 34)
  const base = -rand(10, 26) * (0.6 + r / 40)
  return {
    kind: 'ambient',
    x: rand(0, w),
    y: initial ? rand(0, h) : h + r + rand(0, h * 0.3),
    r,
    vx: 0,
    vy: base,
    base,
    age: 0,
    life: Infinity,
    phase: rand(0, TAU),
    tint: Math.random() < 0.3 ? 1 : 0,
  }
}

function spawn(kind: Kind, x: number, y: number, r: number, speed: number, angle: number, life: number) {
  if (transient() > 90) return
  bubbles.push({
    kind, x, y, r,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    base: 0, age: 0, life,
    phase: rand(0, TAU),
    tint: Math.random() < 0.3 ? 1 : 0,
  })
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  w = window.innerWidth
  h = window.innerHeight
  const el = canvas.value!
  el.width = Math.round(w * dpr)
  el.height = Math.round(h * dpr)
  c!.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function draw(b: Bubble, alpha: number, scale = 1) {
  const ctx = c!
  const r = b.r * scale
  const rgb = b.tint ? '184,163,116' : '236,233,226'
  ctx.lineWidth = 1
  if (r > 9) {
    const g = ctx.createRadialGradient(b.x - r * 0.3, b.y - r * 0.3, r * 0.1, b.x, b.y, r)
    g.addColorStop(0, `rgba(${rgb},0)`)
    g.addColorStop(1, `rgba(${rgb},${0.1 * alpha})`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(b.x, b.y, r, 0, TAU)
    ctx.fill()
  }
  ctx.strokeStyle = `rgba(${rgb},${0.38 * alpha})`
  ctx.beginPath()
  ctx.arc(b.x, b.y, r, 0, TAU)
  ctx.stroke()
  if (r > 7) {
    ctx.strokeStyle = `rgba(${rgb},${0.7 * alpha})`
    ctx.beginPath()
    ctx.arc(b.x, b.y, r * 0.74, Math.PI * 1.12, Math.PI * 1.38)
    ctx.stroke()
  }
}

function tick(_t: number, dtMs: number) {
  if (!c) return
  const dt = Math.min(dtMs, 50) / 1000
  const sy = window.scrollY
  const ds = sy - lastScroll
  lastScroll = sy
  c.clearRect(0, 0, w, h)

  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i]
    b.age += dt
    b.phase += dt * 1.4
    b.y -= ds * (0.15 + b.r / 90) // gelembung besar ikut gulir lebih jauh

    if (b.kind === 'ambient') {
      if (pointer.active) {
        const dx = b.x - pointer.x
        const dy = b.y - pointer.y
        const R = b.r + 120
        const d2 = dx * dx + dy * dy
        if (d2 < R * R) {
          const d = Math.sqrt(d2) || 1
          const f = (1 - d / R) * 320
          b.vx += (dx / d) * f * dt
          b.vy += (dy / d) * f * dt * 0.6
        }
      }
      b.vx *= Math.exp(-dt * 2)
      b.vy += (b.base - b.vy) * Math.min(1, dt * 1.5)
      b.x += (b.vx + Math.sin(b.phase) * 8) * dt
      b.y += b.vy * dt
      if (b.y < -b.r * 2) Object.assign(b, ambient(false))
      if (b.x < -b.r) b.x = w + b.r
      if (b.x > w + b.r) b.x = -b.r
      draw(b, 1)
    } else {
      b.vx *= Math.exp(-dt * 1.5)
      b.vy += -22 * dt
      b.x += b.vx * dt
      b.y += b.vy * dt
      const t = b.age / b.life
      if (t >= 1) {
        bubbles.splice(i, 1)
        continue
      }
      const pop = t > 0.85 ? (t - 0.85) / 0.15 : 0 // meletus di akhir hidupnya
      draw(b, (1 - t) * (1 - pop * 0.6), 1 + pop * 0.4)
    }
  }
}

function onMove(e: PointerEvent) {
  const mouse = e.pointerType === 'mouse'
  pointer.x = e.clientX
  pointer.y = e.clientY
  pointer.active = mouse
  if (!mouse) return
  const now = performance.now()
  const dist = Math.hypot(e.clientX - pointer.lastX, e.clientY - pointer.lastY)
  if (dist > 46 && now - pointer.lastT > 70) {
    pointer.lastX = e.clientX
    pointer.lastY = e.clientY
    pointer.lastT = now
    spawn('trail', e.clientX + rand(-8, 8), e.clientY + rand(-8, 8), rand(3, 9), rand(10, 30), -Math.PI / 2 + rand(-0.9, 0.9), rand(1.6, 2.6))
  }
}

function onDown(e: PointerEvent) {
  const n = e.pointerType === 'mouse' ? 11 : 8
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rand(-0.3, 0.3)
    spawn('burst', e.clientX, e.clientY, rand(3, 13), rand(70, 170), a, rand(1.1, 1.9))
  }
}

function onLeave() {
  pointer.active = false
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !canvas.value) return
  c = canvas.value.getContext('2d')
  if (!c) return
  resize()
  lastScroll = window.scrollY
  const count = w < 768 ? 9 : 16
  for (let i = 0; i < count; i++) bubbles.push(ambient(true))

  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerdown', onDown, { passive: true })
  document.addEventListener('pointerleave', onLeave)
  gsap.ticker.add(tick)
  running = true
})

onBeforeUnmount(() => {
  if (!running) return
  gsap.ticker.remove(tick)
  window.removeEventListener('resize', resize)
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerdown', onDown)
  document.removeEventListener('pointerleave', onLeave)
})
</script>

<template>
  <canvas ref="canvas" class="bubbles" aria-hidden="true" />
</template>

<style scoped>
.bubbles {
  position: fixed;
  inset: 0;
  z-index: 120;
  width: 100%;
  height: 100%;
  pointer-events: none;
  mix-blend-mode: difference;
}
</style>
