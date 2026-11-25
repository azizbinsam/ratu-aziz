<script setup lang="ts">
defineProps<{ playing: boolean }>()
defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    class="music"
    type="button"
    :aria-pressed="playing"
    :aria-label="playing ? 'Matikan musik' : 'Putar musik'"
    @click="$emit('toggle')"
  >
    <span class="music__bars" :class="{ 'is-playing': playing }" aria-hidden="true">
      <i /><i /><i />
    </span>
  </button>
</template>

<style scoped>
.music {
  position: fixed;
  right: max(1rem, env(safe-area-inset-right));
  top: max(1rem, env(safe-area-inset-top));
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
  animation: music-in 1s ease 1.2s both;
}
.music__bars {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 14px;
}
.music__bars i {
  display: block;
  width: 2px;
  height: 4px;
  background: currentColor;
}
.music__bars.is-playing i { animation: bar 1s ease-in-out infinite; }
.music__bars.is-playing i:nth-child(2) { animation-delay: 0.25s; }
.music__bars.is-playing i:nth-child(3) { animation-delay: 0.5s; }

@keyframes bar {
  0%, 100% { height: 4px; }
  50% { height: 14px; }
}
@keyframes music-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
