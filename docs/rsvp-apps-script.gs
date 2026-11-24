// Tempel di Google Apps Script yang terhubung ke Google Sheets RSVP.
// Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone.
// Salin URL Web App ke variabel NUXT_PUBLIC_RSVP_URL.

const SHEET_NAME = 'RSVP'

// Sel yang diawali = + - @ akan dibaca Sheets sebagai rumus. Netralkan.
function safe(v, max) {
  let s = String(v || '').slice(0, max)
  if (/^[=+\-@]/.test(s)) s = "'" + s
  return s
}

function doPost(e) {
  const p = e.parameter
  if (p.website) return ok() // kolom jebakan untuk bot
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME)
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Waktu', 'Nama', 'Kehadiran', 'Jumlah tamu', 'Ucapan', 'Nama di tautan'])
  }
  sh.appendRow([
    new Date(),
    safe(p.name, 80),
    safe(p.attendance, 20),
    safe(p.guests, 3),
    safe(p.message, 400),
    safe(p.guest_link, 80),
  ])
  return ok()
}

function ok() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
    ContentService.MimeType.JSON,
  )
}
