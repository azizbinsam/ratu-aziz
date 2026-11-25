<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Tali champagne yang meliuk-liuk di belakang seluruh halaman, dari Bab II sampai penutup.
// Ia tidak menghindari teks (berada di lapisan paling belakang). Tiap kali bertemu judul
// atau bagian penting, tali melewati sebuah titik bulat yang muncul saat ujung tali tiba.
interface Pt { x: number; y: number; node?: 'dot' | 'pin' | 'end'; noSwing?: boolean }
interface ThreadNode { x: number; y: number; kind: 'dot' | 'pin' | 'end'; on: boolean }

// --- Pengaturan tampilan ---
const SWING_STEP = 340 // jarak vertikal antar belokan (px). Kecil = lebih rapat.
const SWING_AMP = 0.3 // lebar liukan, pecahan dari lebar halaman
const HEAD_AT = 0.62 // posisi ujung tali di layar (0 atas, 1 bawah)
const MIN_GAP = 60 // jarak minimum antar titik (px)

const N = 900
const svg = ref<SVGSVGElement | null>(null)
const pathEl = ref<SVGPathElement | null>(null)
const headEl = ref<SVGCircleElement | null>(null)
const glowEl = ref<SVGCircleElement | null>(null)
const size = reactive({ w: 0, h: 0 })
const d = ref('')
const nodes = ref<ThreadNode[]>([])

let total = 0
let table: number[] = []
let xs: number[] = []
let ys: number[] = []
let raf = 0
let base = 0
let cur = 0 // panjang tali yang sedang tergambar (dihaluskan, bukan loncat per langkah)
let lastOffset = -1
let reduce = false

function build() {
  const host = svg.value?.parentElement
  if (!host) return
  const q = (s: string) => document.querySelector<HTMLElement>(s)
  const qa = (s: string) => Array.from(document.querySelectorAll<HTMLElement>(s))

  const verse = q('.verse-wrap')
  const bName = q('.person--bride .person__name')
  const bMedia = q('.person--bride .person__media')
  const bText = q('.person--bride .person__text')
  const gName = q('.person--groom .person__name')
  const gMedia = q('.person--groom .person__media')
  const gText = q('.person--groom .person__text')
  const gal = q('#bab-2-galeri')
  const date = q('.event__date')
  const loc = q('.loc__title')
  const pin = q('.loc__anchor')
  const thanks = q('.foot__thanks')
  if (![verse, bName, bMedia, bText, gName, gMedia, gText, gal, date, loc, pin, thanks].every(Boolean)) return

  const hostRect = host.getBoundingClientRect()
  base = hostRect.top + window.scrollY
  const W = host.clientWidth
  const H = host.offsetHeight
  const cx = W / 2

  // Elemen yang sedang di-pin diukur lewat pembungkusnya (pin-spacer) yang posisinya tetap.
  const R = (node: HTMLElement) => {
    const m = node.parentElement?.classList.contains('pin-spacer') ? node.parentElement : node
    const r = m.getBoundingClientRect()
    const top = r.top + window.scrollY - base
    return { top, bottom: top + r.height, left: r.left - hostRect.left, right: r.right - hostRect.left, cx: r.left - hostRect.left + r.width / 2, cy: top + r.height / 2 }
  }
  // Titik di tengah baris pertama sebuah judul
  const lineY = (node: HTMLElement) => {
    const cs = getComputedStyle(node)
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2
    return R(node).top + lh / 2
  }

  const raw: Pt[] = []
  const v = R(verse!)
  raw.push({ x: cx, y: v.top - 28, node: 'dot' })

  const bm = R(bMedia!), bt = R(bText!), gm = R(gMedia!), gt = R(gText!)
  raw.push({ x: (bm.right + bt.left) / 2, y: lineY(bName!), node: 'dot' }) // sela foto dan teks
  raw.push({ x: (gt.right + gm.left) / 2, y: lineY(gName!), node: 'dot' })

  const g = R(gal!)
  raw.push({ x: cx, y: g.top + 40 })
  raw.push({ x: cx, y: g.bottom - 40, noSwing: true }) // di dalam galeri tali tersembunyi

  const edge = (node: HTMLElement) => Math.max(12, R(node).left - 16)
  raw.push({ x: edge(date!), y: lineY(date!), node: 'dot' })
  for (const rule of qa('.event__item .event__rule')) {
    const r = R(rule)
    raw.push({ x: Math.max(12, r.left), y: r.top, node: 'dot' })
  }
  raw.push({ x: edge(loc!), y: lineY(loc!), node: 'dot' })
  const p = R(pin!)
  raw.push({ x: p.cx, y: p.cy, node: 'pin' })
  for (const t of qa('.rsvp__title')) raw.push({ x: edge(t), y: lineY(t), node: 'dot' })
  const th = R(thanks!)
  raw.push({ x: cx, y: th.top - 28, node: 'end' })

  // Urutkan dari atas, buang titik yang terlalu rapat (pin dan ujung diutamakan)
  raw.sort((a, b) => a.y - b.y)
  const pts: Pt[] = []
  for (const pt of raw) {
    const last = pts[pts.length - 1]
    if (last && pt.y - last.y < MIN_GAP) {
      if (pt.node === 'pin' || pt.node === 'end') pts.pop()
      else continue
    }
    pts.push(pt)
  }

  // Sisipkan belokan di antara titik-titik: tali berayun kiri-kanan melintasi halaman.
  const amp = W * SWING_AMP
  const full: Pt[] = [pts[0]]
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const dy = b.y - a.y
    const k = b.noSwing ? 0 : Math.floor(dy / SWING_STEP)
    let sign = a.x < cx ? 1 : -1
    for (let j = 1; j <= k; j++) {
      full.push({ x: cx + sign * amp, y: a.y + (dy * j) / (k + 1) })
      sign = -sign
    }
    full.push(b)
  }
  for (let i = 1; i < full.length; i++) full[i].y = Math.max(full[i].y, full[i - 1].y + 2)

  // Tiap ruas: kurva-S dengan garis singgung tegak lurus, halus dan tidak pernah mundur ke atas.
  let dd = `M${full[0].x},${full[0].y}`
  for (let i = 1; i < full.length; i++) {
    const { x: x0, y: y0 } = full[i - 1]
    const { x: x1, y: y1 } = full[i]
    const k = (y1 - y0) * 0.5
    dd += ` C${x0},${y0 + k} ${x1},${y1 - k} ${x1},${y1}`
  }

  size.w = W
  size.h = H
  d.value = dd
  nodes.value = full
    .filter((f) => f.node)
    .map((f) => ({ x: f.x, y: f.y, kind: f.node!, on: false }))

  nextTick(() => {
    const el = pathEl.value
    if (!el) return
    total = el.getTotalLength()
    el.style.strokeDasharray = String(total)
    table = []
    xs = []
    ys = []
    let maxY = -Infinity
    for (let i = 0; i <= N; i++) {
      const p = el.getPointAtLength((total * i) / N)
      xs.push(p.x)
      ys.push(p.y)
      maxY = Math.max(maxY, p.y)
      table.push(maxY)
    }
    cur = reduce ? total : lengthAt(headY())
    lastOffset = -1
    render()
  })
}

const headY = () => window.scrollY + window.innerHeight * HEAD_AT - base

// Panjang tali yang sesuai dengan tinggi y, dengan interpolasi supaya tidak berundak-undak.
function lengthAt(y: number) {
  if (!table.length || y <= table[0]) return 0
  if (y >= table[N]) return total
  let lo = 0
  let hi = N
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (table[mid] < y) lo = mid + 1
    else hi = mid
  }
  const y0 = table[lo - 1]
  const y1 = table[lo]
  const t = y1 > y0 ? (y - y0) / (y1 - y0) : 0
  return (total * (lo - 1 + t)) / N
}

function render() {
  const el = pathEl.value
  if (!el || !total) return
  const offset = total - cur
  if (Math.abs(offset - lastOffset) < 0.4) return
  lastOffset = offset
  el.style.strokeDashoffset = String(offset)

  // Posisi ujung tali dihitung dari tabel sampel (tanpa menyentuh DOM tiap frame)
  const f = Math.min(N - 1e-6, (cur / total) * N)
  const i = Math.floor(f)
  const t = f - i
  const pt = { x: xs[i] + (xs[i + 1] - xs[i]) * t, y: ys[i] + (ys[i + 1] - ys[i]) * t }
  const show = !reduce && cur > 0 && cur < total - 1
  for (const c of [headEl.value, glowEl.value]) {
    if (!c) continue
    c.setAttribute('cx', String(pt.x))
    c.setAttribute('cy', String(pt.y))
    c.style.opacity = show ? '1' : '0'
  }
  for (const n of nodes.value) {
    const on = reduce || pt.y >= n.y - 1
    if (n.on !== on) n.on = on
  }
}

// Ujung tali mengejar posisi gulir dengan peredaman, sehingga tetap mulus walau gulir
// bergerak berundak (gulir otomatis, roda mouse, atau layar 120 Hz).
function tick(_t: number, dtMs: number) {
  if (!total || reduce) return
  const target = lengthAt(headY())
  const dt = Math.min(dtMs, 50) / 1000
  cur += (target - cur) * (1 - Math.exp(-dt * 9))
  if (Math.abs(target - cur) < 0.1) cur = target
  render()
}

// ScrollTrigger sering me-refresh berturut-turut (tiap foto termuat, ukuran layar berubah):
// gabungkan menjadi satu kali build per frame.
function schedule() {
  if (raf) return
  raf = requestAnimationFrame(() => {
    raf = 0
    build()
  })
}

onMounted(() => {
  reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ScrollTrigger.addEventListener('refresh', schedule)
  gsap.ticker.add(tick)
  schedule()
  window.addEventListener('load', schedule, { once: true })
})

onBeforeUnmount(() => {
  ScrollTrigger.removeEventListener('refresh', schedule)
  gsap.ticker.remove(tick)
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <svg
    ref="svg"
    class="thread"
    :width="size.w"
    :height="size.h"
    :viewBox="`0 0 ${size.w} ${size.h}`"
    aria-hidden="true"
    focusable="false"
  >
    <path ref="pathEl" :d="d" fill="none" stroke="#b8a374" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.8" />
    <circle ref="glowEl" r="9" fill="#b8a374" fill-opacity="0.22" style="opacity: 0" />
    <circle ref="headEl" r="3" fill="#b8a374" style="opacity: 0" />

    <g v-for="(n, i) in nodes" :key="i" :transform="`translate(${n.x} ${n.y})`">
      <g class="node" :class="{ on: n.on }">
        <circle :r="n.kind === 'dot' ? 10 : 16" fill="none" stroke="#b8a374" stroke-opacity="0.45" stroke-width="1" />
        <circle :r="n.kind === 'dot' ? 5.5 : 6.5" fill="#b8a374" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.thread {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  overflow: visible;
  pointer-events: none;
}
.node {
  transform: scale(0);
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 0.7s cubic-bezier(0.2, 1.5, 0.4, 1);
}
.node.on { transform: scale(1); }
</style>
