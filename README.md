# Undangan Ratu & Aziz (Nuxt 4 + GSAP)

## Jalankan lokal
```bash
npm install
npm run dev
```
Buka `http://localhost:3000/?to=Bapak+Ahmad`. Nilai `to` muncul sebagai nama tamu.

## Ganti isi
- Teks (nama, orang tua, ayat, tanggal): `app/data/wedding.ts`
- Foto hero dan mempelai: `public/images/` (`hero.webp`, `bride.webp`, `groom.webp`)
- Galeri: taruh foto di `app/assets/gallery/` (`.webp`, `.jpg`, `.png`). Semua file otomatis masuk, diurutkan menurut nama (`01`, `02`, ... `10`). Cukup tambah file, tidak perlu ubah kode.
- Musik: taruh file di `public/audio/music.mp3`
- Efek hitam putih dipasang lewat CSS (`filter: grayscale`), jadi file foto tetap berwarna.

## Deploy ke Vercel
1. `git init`, commit, push ke GitHub, lalu import repo di Vercel (preset Nuxt terdeteksi otomatis).
2. Tambahkan environment variable `NUXT_PUBLIC_SITE_URL` berisi alamat situs (mis. `https://undangan-kamu.vercel.app`) supaya pratinjau WhatsApp (`og.jpg`) tampil.

## RSVP ke Google Sheets
1. Buat Google Sheets baru, lalu **Extensions > Apps Script**.
2. Tempel isi `docs/rsvp-apps-script.gs`, simpan.
3. **Deploy > New deployment > Web app**, Execute as: *Me*, Who has access: *Anyone*. Salin URL Web App.
4. Di Vercel tambahkan environment variable `NUXT_PUBLIC_RSVP_URL` berisi URL itu, lalu deploy ulang.
   Untuk uji lokal, buat file `.env` berisi `NUXT_PUBLIC_RSVP_URL=...`.

Tanpa variabel ini, mode `npm run dev` hanya mensimulasikan pengiriman, dan versi produksi menampilkan pesan gagal kirim.
Setiap jawaban masuk sebagai satu baris di sheet bernama `RSVP`.

## Yang perlu diisi di `app/data/wedding.ts`
- `parents` (nama orang tua), `venue.mapsUrl` (tautan Google Maps; kosong = pencarian dari alamat), `gifts` (rekening amplop digital)
- `end` hanya dipakai untuk tombol "Simpan ke kalender" (perkiraan jam selesai)
