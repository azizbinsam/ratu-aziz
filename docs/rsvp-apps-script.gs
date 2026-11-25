// Tempel di Google Apps Script yang terhubung ke Google Sheets RSVP
// (Extensions > Apps Script pada spreadsheet itu).
// Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone.
// Salin URL Web App ke variabel NUXT_PUBLIC_RSVP_URL.
//
// Setelah mengubah skrip ini: Deploy > Manage deployments > ikon pensil > Version: New version
// > Deploy. URL tetap sama.
//
// Menyembunyikan ucapan: isi kolom "Tampil" pada baris itu dengan "tidak".

const SHEET_NAME = 'RSVP'
const HEADERS = ['Waktu', 'Nama', 'Kehadiran', 'Jumlah tamu', 'Ucapan', 'Nama di tautan', 'Tampil']
const LIST_LIMIT = 200 // jumlah terbaru yang dikirim ke situs

// Sel yang diawali = + - @ akan dibaca Sheets sebagai rumus. Netralkan.
function safe(v, max) {
  let s = String(v || '').slice(0, max)
  if (/^[=+\-@]/.test(s)) s = "'" + s
  return s
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME)
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS)
  return sh
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

function doPost(e) {
  const p = e.parameter
  if (p.website) return json({ ok: true }) // kolom jebakan untuk bot
  getSheet().appendRow([
    new Date(),
    safe(p.name, 80),
    safe(p.attendance, 20),
    safe(p.guests, 3),
    safe(p.message, 400),
    safe(p.guest_link, 80),
    'ya',
  ])
  CacheService.getScriptCache().remove('list')
  return json({ ok: true })
}

// Hanya nama, kehadiran, ucapan, dan waktu yang dikirim ke situs.
// Jumlah tamu dan nama di tautan tidak pernah keluar dari spreadsheet.
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'list') return json({ ok: true, items: readList() })
  return json({ ok: true })
}

function readList() {
  const cache = CacheService.getScriptCache()
  const hit = cache.get('list')
  if (hit) return JSON.parse(hit)

  const sh = getSheet()
  const n = sh.getLastRow() - 1
  const rows = n > 0 ? sh.getRange(2, 1, n, HEADERS.length).getValues() : []
  const out = []
  for (let i = rows.length - 1; i >= 0 && out.length < LIST_LIMIT; i--) {
    const r = rows[i]
    const name = String(r[1] || '').trim()
    if (!name || String(r[6]).toLowerCase() === 'tidak') continue
    out.push({
      name: name,
      attendance: r[2] === 'tidak' ? 'tidak' : 'hadir',
      message: String(r[4] || ''),
      time: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
    })
  }
  try {
    cache.put('list', JSON.stringify(out), 30) // batas cache 100 KB; abaikan bila terlalu besar
  } catch (err) {}
  return out
}
