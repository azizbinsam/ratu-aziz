<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Daftar konfirmasi dan ucapan tamu: 5 per halaman, dengan pagination.
// Data dibaca dari Google Apps Script (lihat docs/rsvp-apps-script.gs).
interface Item {
  id: string
  name: string
  attendance: 'hadir' | 'tidak'
  message: string
  time: string
  mine?: boolean
}

const PER_PAGE = 5
const config = useRuntimeConfig()
const endpoint = config.public.rsvpUrl as string
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const items = ref<Item[]>([])
const status = ref<'loading' | 'ready' | 'error'>('loading')
const page = ref(1)
const pages = computed(() => Math.max(1, Math.ceil(items.value.length / PER_PAGE)))
const visible = computed(() => items.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE))

// Nomor halaman ringkas: 1 … 4 5 6 … 20
const pageList = computed<(number | '…')[]>(() => {
  const n = pages.value
  const p = page.value
  if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1)
  const set = new Set<number>([1, n, p - 1, p, p + 1])
  if (p <= 3) [2, 3, 4].forEach((x) => set.add(x))
  if (p >= n - 2) [n - 3, n - 2, n - 1].forEach((x) => set.add(x))
  const sorted = [...set].filter((x) => x >= 1 && x <= n).sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((x, i) => {
    if (i && x - sorted[i - 1] > 1) out.push('…')
    out.push(x)
  })
  return out
})

const root = ref<HTMLElement | null>(null)
const boxEl = ref<HTMLElement | null>(null)
const listEl = ref<HTMLElement | null>(null)
const lineEl = ref<HTMLElement | null>(null)
const numsEl = ref<HTMLElement | null>(null)
const indEl = ref<HTMLElement | null>(null)

const nums = reactive({ total: 0, hadir: 0, tidak: 0 })
let skeleton: gsap.core.Tween | null = null
let introTrigger: ScrollTrigger | null = null
let busy = false

// ---------- Data ----------
function toItem(raw: Record<string, unknown>, i: number): Item {
  const time = String(raw.time ?? '')
  return {
    id: `${time}-${i}`,
    name: String(raw.name ?? '').slice(0, 80),
    attendance: raw.attendance === 'tidak' ? 'tidak' : 'hadir',
    message: String(raw.message ?? '').slice(0, 400),
    time,
  }
}

function demo(): Item[] {
  const now = Date.now()
  const rows: [string, 'hadir' | 'tidak', string, number][] = [
    ['Bapak Ahmad Fauzi', 'hadir', 'Barakallahu lakuma wa baraka alaikuma. Semoga sakinah, mawaddah, warahmah.', 12],
    ['Siti Nurhaliza', 'hadir', 'Selamat menempuh hidup baru! Bahagia selalu.', 95],
    ['Rudi Hartono', 'tidak', 'Mohon maaf belum bisa hadir. Doa terbaik untuk kalian berdua.', 240],
    ['Dewi Lestari', 'hadir', '', 600],
    ['Keluarga Besar Pak Dadang', 'hadir', 'Semoga menjadi keluarga yang diberkahi.', 1500],
    ['Nur Aini', 'hadir', 'Ikut bahagia, sampai jumpa di hari H.', 2600],
    ['Fajar Pratama', 'tidak', 'Selamat ya, semoga lancar sampai hari H.', 4000],
    ['Maulida', 'hadir', 'Masya Allah, selamat!', 7000],
    ['Bu Hj. Aminah', 'hadir', 'Semoga Allah mempersatukan kalian dalam kebaikan.', 12000],
    ['Teguh Santoso', 'hadir', '', 20000],
    ['Rina Marlina', 'hadir', 'Selamat berbahagia, Ratu dan Aziz.', 30000],
    ['Hendra', 'tidak', 'Barakallah.', 45000],
    ['Salsabila', 'hadir', 'Sakinah mawaddah warahmah!', 60000],
  ]
  return rows.map(([name, attendance, message, mins], i) => ({
    id: `demo-${i}`,
    name,
    attendance,
    message,
    time: new Date(now - mins * 60_000).toISOString(),
  }))
}

async function load(skeletonFirst = true) {
  if (skeletonFirst) {
    status.value = 'loading'
    await nextTick()
    const sk = root.value?.querySelectorAll('.sk')
    if (sk?.length && !reduce()) {
      skeleton = gsap.to(sk, { opacity: 0.3, duration: 0.9, yoyo: true, repeat: -1, stagger: 0.12, ease: 'sine.inOut' })
    }
  }
  try {
    let list: Item[] = []
    if (endpoint) {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 9000)
      const res = await fetch(`${endpoint}${endpoint.includes('?') ? '&' : '?'}action=list`, {
        signal: ctrl.signal,
        cache: 'no-store',
      })
      clearTimeout(timer)
      const data = await res.json()
      if (!data?.ok || !Array.isArray(data.items)) throw new Error('format')
      list = data.items.map(toItem)
    } else if (import.meta.dev) {
      await sleep(900)
      list = demo() // contoh data saat pengembangan, tanpa endpoint
    }
    items.value = list
    page.value = 1
    skeleton?.kill()
    status.value = 'ready'
    await nextTick()
    intro()
  } catch {
    skeleton?.kill()
    status.value = 'error'
  }
}

// ---------- Format ----------
const initial = (name: string) => (name.trim()[0] || '?').toUpperCase()

const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' })
function ago(iso: string) {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const s = Math.round((t - Date.now()) / 1000)
  const abs = Math.abs(s)
  if (abs < 45) return 'baru saja'
  if (abs < 3600) return rtf.format(Math.round(s / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(s / 3600), 'hour')
  if (abs < 86400 * 30) return rtf.format(Math.round(s / 86400), 'day')
  return new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ---------- Animasi ----------
function tweenStats(instant = false) {
  const target = {
    total: items.value.length,
    hadir: items.value.filter((i) => i.attendance === 'hadir').length,
    tidak: items.value.filter((i) => i.attendance === 'tidak').length,
  }
  gsap.to(nums, { ...target, duration: instant || reduce() ? 0 : 1.4, ease: 'power2.out', snap: { total: 1, hadir: 1, tidak: 1 } })
}

const itemEls = () => Array.from(listEl.value?.querySelectorAll<HTMLElement>('.item') ?? [])

function popAvatars(els: HTMLElement[]) {
  gsap.fromTo(
    els.map((e) => e.querySelector('.item__avatar')),
    { scale: 0.4 },
    { scale: 1, duration: 0.9, ease: 'back.out(2)', stagger: 0.09, clearProps: 'transform' },
  )
}

// Muncul pertama kali: menunggu daftar terlihat di layar
function intro() {
  introTrigger?.kill()
  const els = itemEls()
  moveIndicator(true)
  if (reduce()) {
    tweenStats(true)
    return
  }
  nums.total = nums.hadir = nums.tidak = 0
  if (els.length) gsap.set(els, { opacity: 0, y: 28 })
  if (lineEl.value) gsap.set(lineEl.value, { scaleY: 0, transformOrigin: 'top' })
  introTrigger = ScrollTrigger.create({
    trigger: boxEl.value,
    start: 'top 82%',
    once: true,
    onEnter: () => {
      tweenStats()
      if (lineEl.value) gsap.to(lineEl.value, { scaleY: 1, duration: 1.4, ease: 'power3.inOut' })
      if (els.length) {
        gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, clearProps: 'transform,opacity' })
        popAvatars(els)
      }
    },
  })
  ScrollTrigger.refresh()
}

const tweenP = (targets: gsap.TweenTarget, vars: gsap.TweenVars) =>
  new Promise<void>((resolve) => gsap.to(targets, { ...vars, onComplete: () => resolve() }))

// Ganti halaman: item lama keluar, tinggi kotak menyesuaikan, item baru masuk.
async function go(next: number) {
  if (busy || next < 1 || next > pages.value || next === page.value) return
  busy = true
  const dir = next > page.value ? 1 : -1

  if (reduce()) {
    page.value = next
    busy = false
    return
  }

  const box = boxEl.value!
  box.style.height = `${box.offsetHeight}px`
  box.style.overflow = 'hidden'

  await tweenP(itemEls(), { opacity: 0, x: -50 * dir, duration: 0.38, stagger: 0.05, ease: 'power2.in' })

  page.value = next
  await nextTick()

  const incoming = itemEls()
  gsap.set(incoming, { opacity: 0, x: 60 * dir })
  const done = new Promise<void>((resolve) => {
    gsap
      .timeline({ onComplete: () => resolve() })
      .to(box, { height: listEl.value!.offsetHeight, duration: 0.55, ease: 'power3.inOut' }, 0)
      .to(incoming, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', stagger: 0.09, clearProps: 'transform,opacity' }, 0.1)
  })
  popAvatars(incoming)
  await done

  box.style.height = ''
  box.style.overflow = ''
  ScrollTrigger.refresh() // posisi bagian di bawahnya (dan tali) ikut diperbarui
  busy = false
}

// Penunjuk halaman aktif meluncur ke nomor yang dipilih
function moveIndicator(instant = false) {
  const wrap = numsEl.value
  const ind = indEl.value
  const active = wrap?.querySelector<HTMLElement>('.pager__num.is-active')
  if (!wrap || !ind || !active) return
  gsap.to(ind, { x: active.offsetLeft, width: active.offsetWidth, duration: instant || reduce() ? 0 : 0.55, ease: 'power3.out' })
}
watch(
  () => [page.value, pageList.value.join(',')],
  async () => {
    await nextTick()
    moveIndicator()
  },
)

// Tamu yang baru mengirim konfirmasi langsung muncul di urutan pertama.
async function add(entry: Omit<Item, 'id'>) {
  items.value = [{ ...entry, id: `mine-${Date.now()}`, mine: true }, ...items.value]
  page.value = 1
  status.value = 'ready'
  await nextTick()
  tweenStats()
  const first = itemEls()[0]
  if (first && !reduce()) {
    gsap.fromTo(first, { opacity: 0, y: -24, backgroundColor: 'rgba(184,163,116,0.2)' }, { opacity: 1, y: 0, backgroundColor: 'rgba(184,163,116,0)', duration: 1.6, ease: 'power3.out', clearProps: 'transform,opacity,backgroundColor' })
    popAvatars([first])
  }
  ScrollTrigger.refresh()
}

onMounted(() => {
  load()
})
onBeforeUnmount(() => {
  skeleton?.kill()
  introTrigger?.kill()
})

defineExpose({ add })
</script>

<template>
  <div ref="root" class="wishes">
    <h2 class="rsvp__title wishes__title">Ucapan dan doa</h2>

    <p v-if="status === 'ready' && items.length" class="wishes__stats">
      <span><b>{{ nums.total }}</b> konfirmasi</span>
      <span><b>{{ nums.hadir }}</b> hadir</span>
      <span><b>{{ nums.tidak }}</b> berhalangan</span>
    </p>

    <div ref="boxEl" class="wishes__box">
      <ul v-if="status === 'loading'" class="wishes__skeletons" aria-hidden="true">
        <li v-for="n in PER_PAGE" :key="n" class="sk" />
      </ul>

      <div v-else-if="status === 'error'" class="wishes__state">
        <p>Daftar ucapan belum bisa dimuat.</p>
        <button class="btn" type="button" @click="load()">Coba lagi</button>
      </div>

      <p v-else-if="!items.length" class="wishes__state">Belum ada ucapan. Jadilah yang pertama.</p>

      <template v-else>
        <div ref="lineEl" class="wishes__line" aria-hidden="true" />
        <ol ref="listEl" class="wishes__list">
          <li v-for="it in visible" :key="it.id" class="item" :class="{ 'is-mine': it.mine }">
            <span class="item__avatar" aria-hidden="true">{{ initial(it.name) }}</span>
            <div class="item__body">
              <div class="item__head">
                <h3 class="item__name">{{ it.name }}</h3>
                <span class="item__chip" :class="it.attendance">{{ it.attendance === 'hadir' ? 'Hadir' : 'Tidak hadir' }}</span>
              </div>
              <p v-if="it.message" class="item__msg">{{ it.message }}</p>
              <p class="item__time">{{ ago(it.time) }}</p>
            </div>
          </li>
        </ol>
      </template>
    </div>

    <nav v-if="status === 'ready' && pages > 1" class="pager" aria-label="Halaman ucapan">
      <button class="pager__arrow" type="button" :disabled="page === 1" aria-label="Halaman sebelumnya" @click="go(page - 1)">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
      </button>

      <div ref="numsEl" class="pager__nums">
        <span ref="indEl" class="pager__ind" aria-hidden="true" />
        <template v-for="(p, i) in pageList" :key="i">
          <span v-if="p === '…'" class="pager__dots" aria-hidden="true">…</span>
          <button
            v-else
            class="pager__num"
            type="button"
            :class="{ 'is-active': p === page }"
            :aria-current="p === page ? 'page' : undefined"
            :aria-label="`Halaman ${p}`"
            @click="go(p)"
          >
            {{ p }}
          </button>
        </template>
      </div>

      <button class="pager__arrow" type="button" :disabled="page === pages" aria-label="Halaman berikutnya" @click="go(page + 1)">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
      </button>
    </nav>

    <p class="sr-only" aria-live="polite">Halaman {{ page }} dari {{ pages }}</p>

    <button v-if="status === 'ready'" class="wishes__refresh" type="button" @click="load(false)">Muat ulang daftar</button>
  </div>
</template>

<style scoped>
.wishes__title {
  font-family: var(--display);
  font-weight: 400;
  font-size: clamp(2.4rem, 8vw, 4.6rem);
  line-height: 1.08;
}

.wishes__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.6rem;
  margin-top: 1.6rem;
  font-size: 0.9rem;
  color: var(--stone);
}
.wishes__stats b {
  margin-right: 0.25rem;
  font-family: var(--display);
  font-weight: 400;
  font-size: 1.5rem;
  color: var(--ivory);
  font-variant-numeric: tabular-nums;
}

.wishes__box { position: relative; margin-top: 2.4rem; }
.wishes__state { padding: 2rem 0; color: var(--stone); display: grid; gap: 1.2rem; justify-items: start; }

.wishes__skeletons { list-style: none; margin: 0; padding: 0; display: grid; gap: 1.2rem; }
.sk { height: 5.2rem; background: rgba(236, 233, 226, 0.08); }

/* Garis tipis yang menghubungkan avatar, ikut tergambar saat daftar muncul */
.wishes__line {
  position: absolute;
  top: 1.8rem;
  bottom: 1.8rem;
  left: 1.3rem;
  width: 1px;
  background: rgba(236, 233, 226, 0.18);
}
.wishes__list { position: relative; list-style: none; margin: 0; padding: 0; }

.item {
  display: grid;
  grid-template-columns: 2.6rem 1fr;
  gap: 1rem;
  padding: 1.2rem 0;
}
.item__avatar {
  position: relative;
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  font-family: var(--display);
  font-size: 1.1rem;
  color: var(--champagne);
  background: var(--ink);
  border: 1px solid rgba(184, 163, 116, 0.7);
  border-radius: 50%;
}
.item__head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.3rem 0.8rem; }
.item__name {
  font-family: var(--display);
  font-weight: 400;
  font-size: 1.2rem;
  line-height: 1.25;
  overflow-wrap: anywhere;
}
.item__chip {
  padding: 0.1rem 0.6rem;
  font-size: 0.72rem;
  border: 1px solid rgba(236, 233, 226, 0.3);
  border-radius: 999px;
  color: var(--stone);
}
.item__chip.hadir { color: var(--champagne); border-color: rgba(184, 163, 116, 0.6); }
.item__msg {
  margin-top: 0.5rem;
  font-size: 0.97rem;
  line-height: 1.55;
  overflow-wrap: anywhere;
  white-space: pre-line;
}
.item__time { margin-top: 0.4rem; font-size: 0.8rem; color: var(--stone); }

/* Pagination */
.pager {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 2rem;
}
.pager__arrow,
.pager__num {
  display: grid;
  place-items: center;
  min-width: 2.4rem;
  height: 2.4rem;
  padding: 0;
  font: inherit;
  font-size: 0.95rem;
  color: var(--ivory);
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: color 0.3s, opacity 0.3s;
}
.pager__arrow { border: 1px solid rgba(236, 233, 226, 0.3); border-radius: 50%; width: 2.4rem; }
.pager__arrow:hover:not(:disabled) { color: var(--champagne); border-color: var(--champagne); }
.pager__arrow:disabled { opacity: 0.3; cursor: default; }

.pager__nums { position: relative; display: flex; align-items: center; gap: 0.15rem; }
.pager__ind {
  position: absolute;
  top: 0;
  left: 0;
  width: 2.4rem;
  height: 100%;
  border: 1px solid var(--champagne);
  border-radius: 999px;
  pointer-events: none;
}
.pager__num { position: relative; border-radius: 999px; font-variant-numeric: tabular-nums; }
.pager__num.is-active { color: var(--champagne); }
.pager__dots { padding: 0 0.3rem; color: var(--stone); }

.wishes__refresh {
  margin-top: 1.4rem;
  padding: 0;
  font: inherit;
  font-size: 0.85rem;
  color: var(--stone);
  background: none;
  border: 0;
  border-bottom: 1px solid rgba(236, 233, 226, 0.25);
  cursor: pointer;
  transition: color 0.3s;
}
.wishes__refresh:hover { color: var(--ivory); }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
