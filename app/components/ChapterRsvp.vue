<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { wedding } from '~/data/wedding'

const props = defineProps<{ guest: string }>()

const config = useRuntimeConfig()
const endpoint = config.public.rsvpUrl as string

const form = reactive({
  name: props.guest,
  attendance: '' as '' | 'hadir' | 'tidak',
  guests: '1',
  message: '',
  website: '', // kolom jebakan untuk bot
})
const state = ref<'idle' | 'sending' | 'sent'>('idle')
const list = ref<{ add: (e: { name: string; attendance: 'hadir' | 'tidak'; message: string; time: string }) => void } | null>(null)
const error = ref('')

async function submit() {
  if (state.value === 'sending') return
  error.value = ''
  if (!form.name.trim()) return void (error.value = 'Isi nama Anda terlebih dahulu.')
  if (!form.attendance) return void (error.value = 'Pilih kehadiran Anda.')
  if (form.website) return void (state.value = 'sent') // bot: pura-pura berhasil

  state.value = 'sending'
  try {
    if (endpoint) {
      await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors', // Apps Script tidak mengirim header CORS; respons tidak bisa dibaca
        body: new URLSearchParams({
          name: form.name.trim(),
          attendance: form.attendance,
          guests: form.attendance === 'hadir' ? form.guests : '0',
          message: form.message.trim(),
          guest_link: props.guest,
        }),
      })
    } else if (import.meta.dev) {
      await new Promise((r) => setTimeout(r, 700)) // simulasi saat pengembangan
    } else {
      throw new Error('RSVP belum dihubungkan')
    }
    // Langsung tampil di daftar ucapan tanpa menunggu muat ulang
    list.value?.add({
      name: form.name.trim(),
      attendance: form.attendance as 'hadir' | 'tidak',
      message: form.message.trim(),
      time: new Date().toISOString(),
    })
    state.value = 'sent'
  } catch {
    error.value = 'Pesan belum terkirim. Periksa koneksi Anda, lalu coba lagi.'
    state.value = 'idle'
  }
}

// Amplop digital
const giftOpen = ref(false)
const panel = ref<HTMLElement | null>(null)
const copied = ref(-1)
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

async function toggleGift() {
  giftOpen.value = !giftOpen.value
  await nextTick()
  const d = reduce() ? 0 : undefined
  if (giftOpen.value) {
    gsap.fromTo(
      panel.value,
      { height: 0, opacity: 0 },
      { height: 'auto', opacity: 1, duration: d ?? 0.9, ease: 'power3.out', onComplete: () => ScrollTrigger.refresh() },
    )
  } else {
    gsap.to(panel.value, { height: 0, opacity: 0, duration: d ?? 0.6, ease: 'power3.inOut', onComplete: () => ScrollTrigger.refresh() })
  }
}

async function copy(number: string, i: number) {
  try {
    await navigator.clipboard.writeText(number)
  } catch {
    const t = document.createElement('textarea')
    t.value = number
    t.setAttribute('readonly', '')
    t.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(t)
    t.select()
    document.execCommand('copy')
    t.remove()
  }
  copied.value = i
  setTimeout(() => copied.value === i && (copied.value = -1), 2000)
}

const root = ref<HTMLElement | null>(null)
let ctx: gsap.Context | null = null
const splits: SplitText[] = []

onMounted(() => {
  if (reduce() || !root.value) return
  const el = root.value
  ctx = gsap.context(() => {
    el.querySelectorAll<HTMLElement>('.rsvp__title').forEach((t) => {
      const s = SplitText.create(t, { type: 'lines', mask: 'lines' })
      splits.push(s)
      gsap.from(s.lines, {
        yPercent: 110,
        duration: 1.2,
        ease: 'power4.out',
        stagger: 0.1,
        scrollTrigger: { trigger: t, start: 'top 85%', once: true },
      })
    })
    gsap.from('.rsvp__field', {
      opacity: 0,
      y: 22,
      duration: 0.9,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.rsvp__form', start: 'top 80%', once: true },
    })
    gsap.from('.gift__intro, .gift__toggle', {
      opacity: 0,
      y: 18,
      duration: 0.9,
      stagger: 0.12,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.gift', start: 'top 82%', once: true },
    })
  }, el)
})

onBeforeUnmount(() => {
  ctx?.revert()
  splits.forEach((s) => s.revert())
})
</script>

<template>
  <section id="bab-5" ref="root" class="rsvp">
    <p class="mark">Bab V</p>

    <div class="rsvp__wrap">
      <h2 class="rsvp__title">Konfirmasi<br />kehadiran</h2>

      <form v-if="state !== 'sent'" class="rsvp__form" novalidate @submit.prevent="submit">
        <div class="rsvp__field">
          <label for="rsvp-name">Nama</label>
          <input id="rsvp-name" v-model="form.name" type="text" autocomplete="name" maxlength="80" />
        </div>

        <fieldset class="rsvp__field rsvp__choice">
          <legend>Apakah Anda hadir?</legend>
          <label class="chip">
            <input v-model="form.attendance" type="radio" name="attendance" value="hadir" />
            <span>Hadir</span>
          </label>
          <label class="chip">
            <input v-model="form.attendance" type="radio" name="attendance" value="tidak" />
            <span>Tidak hadir</span>
          </label>
        </fieldset>

        <div v-if="form.attendance === 'hadir'" class="rsvp__field">
          <label for="rsvp-guests">Jumlah tamu</label>
          <select id="rsvp-guests" v-model="form.guests">
            <option v-for="n in 5" :key="n" :value="String(n)">{{ n }} orang</option>
          </select>
        </div>

        <div class="rsvp__field">
          <label for="rsvp-msg">Ucapan dan doa</label>
          <textarea id="rsvp-msg" v-model="form.message" rows="3" maxlength="300" />
        </div>

        <input v-model="form.website" class="rsvp__trap" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" />

        <p v-if="error" class="rsvp__error" role="alert">{{ error }}</p>
        <button class="btn" type="submit" :disabled="state === 'sending'">
          {{ state === 'sending' ? 'Mengirim' : 'Kirim konfirmasi' }}
        </button>
      </form>

      <div v-else class="rsvp__done" role="status">
        <p class="rsvp__thanks">Terima kasih, {{ form.name.trim() }}.</p>
        <p class="rsvp__note">
          {{ form.attendance === 'hadir' ? 'Kami menunggu kehadiran Anda pada 27 Desember.' : 'Terima kasih atas doa dan perhatian Anda.' }}
        </p>
      </div>
    </div>

    <div class="wishes-host">
      <RsvpList ref="list" />
    </div>

    <div class="gift">
      <h2 class="rsvp__title">Amplop digital</h2>
      <p class="gift__intro">
        Doa restu Anda sudah menjadi hadiah terbaik bagi kami. Bila ingin memberi tanda kasih, Anda dapat mengirimnya ke rekening berikut.
      </p>
      <button class="btn gift__toggle" type="button" :aria-expanded="giftOpen" aria-controls="gift-panel" @click="toggleGift">
        {{ giftOpen ? 'Tutup' : 'Kirim hadiah' }}
      </button>

      <div id="gift-panel" ref="panel" class="gift__panel" :aria-hidden="!giftOpen" :inert="!giftOpen">
        <div class="gift__cards">
          <article v-for="(g, i) in wedding.gifts" :key="g.bank + i" class="gift__card">
            <p class="gift__bank">{{ g.bank }}</p>
            <p class="gift__no">{{ g.number }}</p>
            <p class="gift__holder">a.n. {{ g.holder }}</p>
            <button class="btn" type="button" @click="copy(g.number, i)">
              {{ copied === i ? 'Tersalin' : 'Salin nomor' }}
            </button>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.rsvp {
  padding: 20svh 6vw 14svh;
  position: relative;
  z-index: 1;
}
.rsvp__wrap,
.gift { max-width: 40rem; margin: 6svh auto 0; }
.gift { margin-top: 22svh; }
.wishes-host { max-width: 40rem; margin: 22svh auto 0; }

.rsvp__title {
  font-family: var(--display);
  font-weight: 400;
  font-size: clamp(2.4rem, 8vw, 4.6rem);
  line-height: 1.08;
}

.rsvp__form { display: grid; gap: 2rem; margin-top: 3.4rem; }
.rsvp__field { display: grid; gap: 0.4rem; border: 0; padding: 0; margin: 0; }
.rsvp__field label,
.rsvp__field legend { font-size: 0.9rem; color: var(--stone); padding: 0; }

input[type='text'],
select,
textarea {
  width: 100%;
  padding: 0.7rem 0;
  font: inherit;
  font-size: 1.05rem;
  color: var(--ivory);
  background: transparent;
  border: 0;
  border-bottom: 1px solid rgba(236, 233, 226, 0.35);
  border-radius: 0;
  resize: vertical;
  transition: border-color 0.3s;
}
select option { color: #000; }
input[type='text']:focus,
select:focus,
textarea:focus { outline: none; border-bottom-color: var(--champagne); }

.rsvp__choice { grid-auto-flow: column; justify-content: start; gap: 0.8rem; }
.rsvp__choice legend { grid-column: 1 / -1; margin-bottom: 0.4rem; }
.chip { position: relative; cursor: pointer; }
.chip input { position: absolute; opacity: 0; inset: 0; }
.chip span {
  display: inline-block;
  padding: 0.7rem 1.4rem;
  font-size: 0.95rem;
  border: 1px solid rgba(236, 233, 226, 0.35);
  transition: background 0.3s, color 0.3s, border-color 0.3s;
}
.chip input:checked + span { background: var(--ivory); color: var(--ink); border-color: var(--ivory); }
.chip input:focus-visible + span { outline: 2px solid var(--champagne); outline-offset: 3px; }

.rsvp__trap { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
.rsvp__error { color: #e0a8a0; font-size: 0.95rem; }
.rsvp__form .btn { justify-self: start; }

.rsvp__done { margin-top: 3.4rem; }
.rsvp__thanks { font-family: var(--display); font-size: clamp(1.6rem, 5vw, 2.4rem); line-height: 1.2; }
.rsvp__note { margin-top: 1rem; color: var(--stone); }

.gift__intro { margin-top: 1.6rem; color: var(--stone); max-width: 30rem; }
.gift__toggle { margin-top: 2.2rem; }
.gift__panel { height: 0; opacity: 0; overflow: hidden; }
.gift__cards { display: grid; gap: 1.2rem; padding-top: 2.4rem; }
.gift__card {
  display: grid;
  gap: 0.4rem;
  justify-items: start;
  padding: 1.6rem;
  border: 1px solid rgba(236, 233, 226, 0.25);
}
.gift__bank { font-family: var(--display); font-size: 1.5rem; }
.gift__no { font-size: 1.3rem; letter-spacing: 0.12em; font-variant-numeric: tabular-nums; }
.gift__holder { color: var(--stone); font-size: 0.95rem; margin-bottom: 0.8rem; }
</style>
