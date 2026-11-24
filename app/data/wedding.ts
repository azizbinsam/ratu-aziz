// Semua teks undangan ada di sini. Ganti isinya, kode tidak perlu disentuh.
export const wedding = {
  bride: {
    short: 'Ratu',
    name: 'Ratu Siti Humairoh, S.Pd.',
    parents: 'Putri Ke-5 dari Bapak Tubagus Saepudin dan Ibu Siti Aisyah (Almh)',
  },
  groom: {
    short: 'Aziz',
    name: 'Abdul Aziz, S.Ak.',
    parents: 'Putra Ke-1 dari Bapak H. Sambas (Alm) dan Ibu Nuraeni',
  },
  dateText: 'Minggu, 27 Desember 2026',
  place: 'Rangkasbitung, Lebak',
  verse: {
    text: 'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.',
    source: 'QS. Ar-Rum: 21',
  },

  // Acara. Waktu dalam WIB.
  zone: 'WIB',
  start: '2026-12-27T10:00:00+07:00',
  end: '2026-12-27T14:00:00+07:00', // perkiraan selesai, dipakai untuk tombol kalender
  events: [
    { key: 'akad', name: 'Akad nikah', time: '10.00' },
    { key: 'resepsi', name: 'Resepsi', time: '11.00' },
  ],

  // Lokasi. Kosongkan mapsUrl untuk memakai pencarian Google Maps dari alamat.
  venue: {
    name: 'Kp. Rancatimah',
    address: 'Ds. Cijoro Lebak, Rangkasbitung',
    mapsUrl: 'https://maps.app.goo.gl/3NU7KifapEvKPiPf6',
  },

  // Amplop digital. Ganti dengan rekening asli.
  gifts: [
    { bank: 'DANA', number: '083119131343', holder: 'Ratu Siti Humairoh' },
    { bank: 'BNI', number: '605672647', holder: 'Abdul Aziz' },
  ],
}
