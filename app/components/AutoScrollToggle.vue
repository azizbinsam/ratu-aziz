<script setup lang="ts">
const { autoActive, toggleAuto } = useScroll()
</script>

<template>
  <button
    class="auto"
    type="button"
    data-autoscroll-toggle
    :aria-pressed="autoActive"
    :aria-label="autoActive ? 'Hentikan gulir otomatis' : 'Mulai gulir otomatis'"
    @click="toggleAuto"
  >
    <svg v-if="autoActive" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" />
      <rect x="14" y="5" width="4" height="14" />
    </svg>
    <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M6 6l6 6 6-6M6 12l6 6 6-6" />
    </svg>
  </button>
</template>

<style scoped>
.auto {
  position: fixed;
  right: max(1rem, env(safe-area-inset-right));
  top: calc(max(1rem, env(safe-area-inset-top)) + 3.5rem);
  z-index: 50;
  display: grid;
  place-items: center;
  width: 2.8rem;
  height: 2.8rem;
  padding: 0;
  color: var(--ivory);
  background: rgba(0, 0, 0, 0.72);
  border: 1px solid rgba(236, 233, 226, 0.35);
  border-radius: 50%;
  cursor: pointer;
  animation: auto-in 1s ease 1.4s both;
}
.auto[aria-pressed='true'] { border-color: var(--champagne); color: var(--champagne); }

@keyframes auto-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
