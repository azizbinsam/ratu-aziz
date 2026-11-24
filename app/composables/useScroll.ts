import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let lenis: Lenis | null = null

// ---- Gulir otomatis ----
const SPEED = 65 // px per detik
const INPUTS = ['wheel', 'touchstart', 'keydown', 'pointerdown']
const autoActive = ref(false)
let autoPos = 0
let armTimer: ReturnType<typeof setTimeout> | null = null

function onAutoTick(_t: number, dtMs: number) {
  const max = document.documentElement.scrollHeight - window.innerHeight
  // Posisi bisa berubah di luar kendali kita (mis. lewat navbar): ikuti.
  if (Math.abs(window.scrollY - autoPos) > 3) autoPos = window.scrollY
  autoPos = Math.min(max, autoPos + (SPEED * Math.min(dtMs, 50)) / 1000)
  if (lenis) lenis.scrollTo(autoPos, { immediate: true })
  else window.scrollTo(0, autoPos)
  if (autoPos >= max - 1) stopAuto()
}

// Sentuhan, roda mouse, atau tombol apa pun dari pengunjung menghentikan gulir otomatis.
function onUserInput(e: Event) {
  if ((e.target as Element | null)?.closest?.('[data-autoscroll-toggle]')) return
  stopAuto()
}

function stopAuto() {
  if (armTimer) clearTimeout(armTimer)
  armTimer = null
  if (autoActive.value) gsap.ticker.remove(onAutoTick)
  autoActive.value = false
  INPUTS.forEach((ev) => window.removeEventListener(ev, onUserInput))
}

function startAuto() {
  if (autoActive.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (armTimer) clearTimeout(armTimer)
  armTimer = null
  autoPos = window.scrollY
  autoActive.value = true
  gsap.ticker.add(onAutoTick)
  INPUTS.forEach((ev) => window.addEventListener(ev, onUserInput, { passive: true }))
}

// Mulai otomatis setelah jeda, kecuali pengunjung sudah menyentuh halaman lebih dulu.
function armAuto(delayMs: number) {
  stopAuto()
  INPUTS.forEach((ev) => window.addEventListener(ev, onUserInput, { passive: true }))
  armTimer = setTimeout(startAuto, delayMs)
}

function toggleAuto() {
  if (autoActive.value) stopAuto()
  else startAuto()
}

export function useScroll() {
  function init() {
    if (lenis) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    lenis = new Lenis({ duration: 1.1, smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => lenis?.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)
  }
  function lock() {
    document.documentElement.classList.add('is-locked')
    lenis?.stop()
  }
  function unlock() {
    document.documentElement.classList.remove('is-locked')
    lenis?.start()
  }
  // Gulir ke bagian tertentu. Section yang sedang di-pin dihitung dari pembungkusnya.
  function scrollTo(el: HTMLElement) {
    const host = el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el
    const y = host.getBoundingClientRect().top + window.scrollY
    if (lenis) lenis.scrollTo(y, { duration: 1.6 })
    else window.scrollTo({ top: y, behavior: 'smooth' })
  }
  return { init, lock, unlock, scrollTo, autoActive, armAuto, toggleAuto }
}
