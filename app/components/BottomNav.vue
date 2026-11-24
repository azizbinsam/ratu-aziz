<script setup lang="ts">
// Navigasi bawah untuk mobile. Bagian aktif dihitung dari posisi gulir, sehingga
// tetap benar saat galeri sedang di-pin.
const items = [
  { id: 'bab-1', label: 'Awal', icon: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>' },
  { id: 'bab-2', label: 'Mempelai', icon: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>' },
  { id: 'bab-2-galeri', label: 'Galeri', icon: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 16l5-5 4 4 3-3 6 6"/>' },
  { id: 'bab-3', label: 'Acara', icon: '<rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 10h18M8 3v4M16 3v4"/>' },
  { id: 'bab-4', label: 'Lokasi', icon: '<path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>' },
  { id: 'bab-5', label: 'RSVP', icon: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 7l9 7 9-7"/>' },
]

const active = ref('bab-1')
const { scrollTo } = useScroll()

let raf = 0
function update() {
  raf = 0
  const mid = window.innerHeight * 0.5
  let current = items[0].id
  for (const it of items) {
    const el = document.getElementById(it.id)
    if (el && el.getBoundingClientRect().top <= mid) current = it.id
  }
  active.value = current
}
function onScroll() {
  if (!raf) raf = requestAnimationFrame(update)
}

function go(id: string) {
  const el = document.getElementById(id)
  if (el) scrollTo(el)
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  update()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <nav class="nav" aria-label="Navigasi bagian">
    <button
      v-for="it in items"
      :key="it.id"
      type="button"
      class="nav__item"
      :class="{ 'is-active': active === it.id }"
      :aria-current="active === it.id ? 'true' : undefined"
      @click="go(it.id)"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="it.icon" />
      <span>{{ it.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.nav { display: none; }

@media (max-width: 767px) {
  .nav {
    position: fixed;
    left: 50%;
    bottom: max(0.8rem, env(safe-area-inset-bottom));
    z-index: 55;
    display: flex;
    width: min(94vw, 26rem);
    padding: 0.35rem;
    background: rgba(0, 0, 0, 0.62);
    border: 1px solid rgba(236, 233, 226, 0.22);
    border-radius: 999px;
    backdrop-filter: blur(10px);
    transform: translateX(-50%);
    animation: nav-in 0.9s ease 1.5s both;
  }
}
.nav__item {
  flex: 1;
  display: grid;
  justify-items: center;
  gap: 0.15rem;
  padding: 0.45rem 0;
  font: inherit;
  font-size: 0.62rem;
  color: var(--stone);
  background: none;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.3s;
}
.nav__item.is-active { color: var(--champagne); }

@keyframes nav-in {
  from { opacity: 0; transform: translate(-50%, 12px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
</style>
