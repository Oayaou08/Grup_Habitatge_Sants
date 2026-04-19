// ============================================================
// api.js — GHAS Web · Capa de datos (Google Sheets → JSON)
// ============================================================
// CONFIGURACIÓN: Cambia SHEET_ID por el ID de tu Google Sheet
// El ID está en la URL: docs.google.com/spreadsheets/d/[ESTE_ID]/edit
// ============================================================


export const CONFIG = {
  SHEET_ID: '2PACX-1vSwPoWTnG3j1R-bPtHwf4H2FK6feKqW1Dgsa5YYmn-cuJoX0F7W3N7Tc_zDAeXprWi56yJvkIrD_ZU7',
  SHEETS: {
    news: 'news',
    events: 'events',
  },
  CACHE_TTL_MS: 5 * 60 * 1000,
};

const _cache = {};

function buildURL(sheetName) {
  return `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
}

// Parsea la tabla gviz a un array de objetos planos
function parseGvizTable(table) {
  if (!table || !table.cols || !table.rows) return [];

  const headers = table.cols.map(col =>
    (col.label || col.id || '').toLowerCase().trim().replace(/\s+/g, '_')
  );

  return table.rows
    .filter(row => row && row.c && row.c.some(cell => cell && cell.v != null))
    .map(row => {
      const obj = {};
      headers.forEach((key, i) => {
        const cell = row.c?.[i];
        // Google formatea fechas como Date(year,month,day) — las normalizamos
        if (cell && typeof cell.v === 'string' && cell.v.startsWith('Date(')) {
          obj[key] = cell.f || parseDateString(cell.v);
        } else {
          obj[key] = cell ? (cell.v ?? '') : '';
        }
      });
      return obj;
    });
}

// Convierte "Date(2024,0,15)" → "2024-01-15"
function parseDateString(str) {
  const match = str.match(/Date\((\d+),(\d+),(\d+)\)/);
  if (!match) return str;
  const [, y, m, d] = match.map(Number);
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// Fetch con caché
async function fetchSheet(sheetName) {
  const now = Date.now();
  const cached = _cache[sheetName];

  if (cached && now - cached.ts < CONFIG.CACHE_TTL_MS) {
    return cached.data;
  }

  const url = buildURL(sheetName);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Error ${response.status} cargando hoja "${sheetName}"`);
  }

  const text = await response.text();

  // Extraer JSON del wrapper JSONP de Google
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?\s*$/);
  if (!match) {
    throw new Error(`Respuesta inesperada de Google Sheets para "${sheetName}"`);
  }

  const parsed = JSON.parse(match[1]);

  if (parsed.status === 'error') {
    const errMsg = parsed.errors?.[0]?.detailed_message || 'Error desconocido';
    throw new Error(`Google Sheets error: ${errMsg}`);
  }

  const data = parseGvizTable(parsed.table);
  _cache[sheetName] = { data, ts: now };
  return data;
}

// ── API pública ───────────────────────────────────────────────

export async function fetchNews() {
  const rows = await fetchSheet(CONFIG.SHEETS.news);
  // Ordenar por fecha descendente
  return rows.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function fetchEvents() {
  const rows = await fetchSheet(CONFIG.SHEETS.events);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Separar próximos (desc) y pasados (asc)
  const upcoming = rows
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const past = rows
    .filter(e => new Date(e.date) < today)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return [...upcoming, ...past];
}

export function clearCache() {
  Object.keys(_cache).forEach(k => delete _cache[k]);
}