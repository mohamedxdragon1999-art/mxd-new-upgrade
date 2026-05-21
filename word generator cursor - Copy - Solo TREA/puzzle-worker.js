// puzzle-worker.js â€” Web Worker for puzzle generation + PDF export
importScripts('libs/jspdf.umd.min.js');
importScripts('mxd-mask-pipeline.js');
const { jsPDF } = self.jspdf;

// IndexedDB cache for generated PDFs
const PDF_CACHE_DB = 'mxd_pdf_cache_v1';
const PDF_CACHE_STORE = 'pdfs';
let pdfCacheDB = null;

async function openPdfCache() {
  if (pdfCacheDB) return pdfCacheDB;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(PDF_CACHE_DB, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(PDF_CACHE_STORE)) {
        db.createObjectStore(PDF_CACHE_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => { pdfCacheDB = e.target.result; resolve(pdfCacheDB); };
    req.onerror = (e) => { reject(e.target.error); };
  });
}

async function cachePdf(id, blob) {
  try {
    const db = await openPdfCache();
    const tx = db.transaction(PDF_CACHE_STORE, 'readwrite');
    const store = tx.objectStore(PDF_CACHE_STORE);
    store.put({ id, blob, size: blob.size, cachedAt: Date.now() });
    return true;
  } catch(e) { return false; }
}

async function getCachedPdf(id) {
  try {
    const db = await openPdfCache();
    return new Promise((resolve, reject) => {
      const req = db.transaction(PDF_CACHE_STORE).objectStore(PDF_CACHE_STORE).get(id);
      req.onsuccess = () => resolve(req.result ? req.result.blob : null);
      req.onerror = () => resolve(null);
    });
  } catch(e) { return null; }
}

async function clearExpiredCache(maxAge = 86400000) {
  try {
    const db = await openPdfCache();
    const tx = db.transaction(PDF_CACHE_STORE, 'readwrite');
    const store = tx.objectStore(PDF_CACHE_STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      const now = Date.now();
      req.result.forEach(item => {
        if (now - item.cachedAt > maxAge) store.delete(item.id);
      });
    };
  } catch(e) {}
}

function generatePdfCacheKey(puzzles, cfg) {
  const hash = puzzles.length + '_' + (cfg.rows || 0) + 'x' + (cfg.cols || 0) + '_' + (cfg.showSolution ? 'sol' : 'no') + '_' + (cfg.title || '') + '_' + (cfg.template || 'default');
  let h = 0;
  for (let i = 0; i < hash.length; i++) { h = ((h << 5) - h + hash.charCodeAt(i)) | 0; }
  return 'pdf_' + Math.abs(h).toString(36);
}

function parseWords(txt) {
  return txt.split(/[\n,]+/).map(w => w.trim().replace(/[^a-zA-Z]/g, '')).filter(w => w.length >= 2);
}

const TEMPLATES = {
  classic: { n: 'Classic White', bg: '#ffffff', tc: '#1a1a2e', cc: '#2d2d44', pb: '#f3f0ff', pc: '#4a3d8f', ac: '#e8e0ff', ff: 'Inter,sans-serif', bw: false, gl: false, gb: false, sh: true },
  grid_lines: { n: 'Grid Lines', bg: '#ffffff', tc: '#1e3a5f', cc: '#1e40af', pb: '#e8f4ff', pc: '#1e40af', ac: '#dbeafe', ff: 'Inter,monospace', bw: false, gl: true, gb: true, sh: true },
  ocean: { n: 'Ocean Blue', bg: '#eff6ff', tc: '#1e3a5f', cc: '#1e40af', pb: '#dbeafe', pc: '#1e40af', ac: '#bfdbfe', ff: 'Inter,sans-serif', bw: false, gl: false, gb: false, sh: true },
  forest: { n: 'Forest Green', bg: '#f0fdf4', tc: '#14532d', cc: '#166534', pb: '#dcfce7', pc: '#14532d', ac: '#bbf7d0', ff: 'Inter,sans-serif', bw: false, gl: false, gb: false, sh: true },
  sunset: { n: 'Sunset Orange', bg: '#fff7ed', tc: '#9a3412', cc: '#c2410c', pb: '#fed7aa', pc: '#9a3412', ac: '#fdba74', ff: 'Inter,sans-serif', bw: false, gl: false, gb: false, sh: true },
  rose: { n: 'Rose Gold', bg: '#fff1f2', tc: '#9f1239', cc: '#be123c', pb: '#ffe4e6', pc: '#9f1239', ac: '#fecdd3', ff: 'Inter,sans-serif', bw: false, gl: false, gb: false, sh: true },
  gold: { n: 'Gold Premium', bg: '#fffbeb', tc: '#78350f', cc: '#92400e', pb: '#fef3c7', pc: '#78350f', ac: '#fde68a', ff: 'Georgia,serif', bw: false, gl: true, gb: false, sh: true },
  lavender: { n: 'Lavender Dream', bg: '#f5f3ff', tc: '#4c1d95', cc: '#6d28d9', pb: '#ede9fe', pc: '#4c1d95', ac: '#ddd6fe', ff: 'Inter,sans-serif', bw: false, gl: false, gb: false, sh: true },
  mint: { n: 'Mint Fresh', bg: '#f0fdfa', tc: '#134e4a', cc: '#0f766e', pb: '#ccfbf1', pc: '#134e4a', ac: '#99f6e4', ff: 'Inter,sans-serif', bw: false, gl: false, gb: false, sh: true },
  slate: { n: 'Slate Cool', bg: '#f8fafc', tc: '#0f172a', cc: '#334155', pb: '#e2e8f0', pc: '#0f172a', ac: '#cbd5e1', ff: 'Inter,sans-serif', bw: false, gl: true, gb: false, sh: true },
  dark_purple: { n: 'Dark Purple', bg: '#1e1b4b', tc: '#c4b5fd', cc: '#e0e7ff', pb: 'rgba(139,92,246,.2)', pc: '#c4b5fd', ac: '#4c1d95', ff: 'Inter,sans-serif', bw: false, gl: false, gb: false, sh: false },
  midnight: { n: 'Midnight Dark', bg: '#0f172a', tc: '#94a3b8', cc: '#cbd5e1', pb: 'rgba(148,163,184,.1)', pc: '#94a3b8', ac: '#1e293b', ff: 'Inter,monospace', bw: false, gl: false, gb: false, sh: false },
  neon_dark: { n: 'Neon Dark', bg: '#0a0a0f', tc: '#39ff14', cc: '#00ffff', pb: 'rgba(57,255,20,.08)', pc: '#39ff14', ac: 'rgba(57,255,20,.15)', ff: 'Inter,monospace', bw: false, gl: true, gb: false, sh: false },
  deep_sea: { n: 'Deep Sea', bg: '#0c1445', tc: '#67e8f9', cc: '#a5f3fc', pb: 'rgba(103,232,249,.1)', pc: '#67e8f9', ac: 'rgba(103,232,249,.15)', ff: 'Inter,sans-serif', bw: false, gl: false, gb: false, sh: false },
  galaxy: { n: 'Galaxy', bg: '#13002b', tc: '#d8b4fe', cc: '#e9d5ff', pb: 'rgba(216,180,254,.1)', pc: '#d8b4fe', ac: 'rgba(139,92,246,.2)', ff: 'Inter,sans-serif', bw: false, gl: false, gb: false, sh: false },
  newspaper: { n: 'Newspaper', bg: '#faf6f0', tc: '#1a1a1a', cc: '#333333', pb: '#e8e0d0', pc: '#333333', ac: '#c0b090', ff: 'Georgia,serif', bw: true, gl: false, gb: true, sh: false },
  bw_clean: { n: 'Black & White', bg: '#ffffff', tc: '#000000', cc: '#000000', pb: '#eeeeee', pc: '#333333', ac: '#cccccc', ff: 'Inter,monospace', bw: true, gl: false, gb: false, sh: false },
  bw_grid: { n: 'B&W Grid', bg: '#ffffff', tc: '#000000', cc: '#000000', pb: '#f0f0f0', pc: '#222222', ac: '#cccccc', ff: 'Inter,monospace', bw: true, gl: true, gb: true, sh: false },
  kids: { n: 'Kids Colorful', bg: '#fffde7', tc: '#e65100', cc: '#1565c0', pb: '#e1f5fe', pc: '#01579b', ac: '#b3e5fc', ff: 'Arial,sans-serif', bw: false, gl: true, gb: true, sh: true },
  retro: { n: 'Retro Terminal', bg: '#0d1117', tc: '#00ff41', cc: '#00cc33', pb: 'rgba(0,255,65,.08)', pc: '#00ff41', ac: 'rgba(0,255,65,.12)', ff: 'Courier New,monospace', bw: false, gl: true, gb: false, sh: false },
  notebook_blank: { n: 'Notebook Classic', bg: '#fefefe', tc: '#2c2c2c', cc: '#1a1a1a', pb: '#f5f5dc', pc: '#8b4513', ac: '#ddd8c4', ff: 'Courier New,monospace', bw: false, gl: false, gb: false, sh: true },
  notebook_grid: { n: 'Grid Notebook', bg: '#ffffff', tc: '#2c2c2c', cc: '#1e40af', pb: '#e3f2fd', pc: '#1565c0', ac: '#bbdefb', ff: 'Consolas,monospace', bw: false, gl: true, gb: true, sh: true },
  notebook_lined: { n: 'Lined Notebook', bg: '#fffef8', tc: '#1a1a1a', cc: '#333333', pb: '#fffde7', pc: '#795548', ac: '#d7ccc8', ff: 'Times New Roman,serif', bw: false, gl: false, gb: false, sh: true },
  journal_classic: { n: 'Journal Classic', bg: '#faf8f5', tc: '#3e2723', cc: '#4e342e', pb: '#efebe9', pc: '#5d4037', ac: '#d7ccc8', ff: 'Georgia,serif', bw: false, gl: false, gb: false, sh: true },
  journal_diary: { n: 'Personal Diary', bg: '#fff0f5', tc: '#880e4f', cc: '#ad1457', pb: '#fce4ec', pc: '#c2185b', ac: '#f8bbd0', ff: 'Comic Sans MS,sans-serif', bw: false, gl: false, gb: false, sh: true },
  journal_travel: { n: 'Travel Journal', bg: '#e8f5e9', tc: '#1b5e20', cc: '#2e7d32', pb: '#c8e6c9', pc: '#388e3c', ac: '#a5d6a7', ff: 'Verdana,sans-serif', bw: false, gl: false, gb: false, sh: true },
  journal_sketch: { n: 'Sketch Journal', bg: '#fff8e1', tc: '#e65100', cc: '#bf360c', pb: '#fff3e0', pc: '#ef6c00', ac: '#ffe0b2', ff: 'Arial,sans-serif', bw: false, gl: false, gb: false, sh: true },
  planner_weekly: { n: 'Weekly Planner', bg: '#ffffff', tc: '#1a237e', cc: '#283593', pb: '#e8eaf6', pc: '#3949ab', ac: '#c5cae9', ff: 'Arial,sans-serif', bw: false, gl: false, gb: false, sh: true },
  planner_monthly: { n: 'Monthly Planner', bg: '#f3e5f5', tc: '#4a148c', cc: '#6a1b9a', pb: '#ede7f6', pc: '#7b1fa2', ac: '#d1c4e9', ff: 'Helvetica,sans-serif', bw: false, gl: false, gb: false, sh: true },
  planner_daily: { n: 'Daily Planner', bg: '#e3f2fd', tc: '#0d47a1', cc: '#1565c0', pb: '#bbdefb', pc: '#1976d2', ac: '#90caf9', ff: 'Segoe UI,sans-serif', bw: false, gl: false, gb: false, sh: true },
  bulletin_dots: { n: 'Bullet Journal Dots', bg: '#fafafa', tc: '#212121', cc: '#424242', pb: '#f5f5f5', pc: '#616161', ac: '#eeeeee', ff: 'Roboto,sans-serif', bw: false, gl: false, gb: false, sh: true },
  bulletin_squares: { n: 'Bullet Journal Squares', bg: '#ffffff', tc: '#1a1a1a', cc: '#212121', pb: '#f5f5f5', pc: '#424242', ac: '#e0e0e0', ff: 'Arial,sans-serif', bw: true, gl: true, gb: true, sh: false },
  mood: { n: 'Mood Tracker', bg: '#f3e5f5', tc: '#4a148c', cc: '#6a1b9a', pb: '#ede7f6', pc: '#7b1fa2', ac: '#d1c4e9', ff: 'Comic Sans MS,sans-serif', bw: false, gl: false, gb: false, sh: true },
  gratitude_journal: { n: 'Gratitude Journal', bg: '#f3e5f5', tc: '#4a148c', cc: '#6a1b9a', pb: '#ede7f6', pc: '#7b1fa2', ac: '#d1c4e9', ff: 'Comic Sans MS,sans-serif', bw: false, gl: false, gb: false, sh: true },
  fitness_log: { n: 'Fitness Log', bg: '#e8f5e9', tc: '#1b5e20', cc: '#2e7d32', pb: '#c8e6c9', pc: '#388e3c', ac: '#a5d6a7', ff: 'Arial,sans-serif', bw: false, gl: false, gb: false, sh: true },
  budget_tracker: { n: 'Budget Tracker', bg: '#fce4ec', tc: '#880e4f', cc: '#ad1457', pb: '#f8bbd0', pc: '#c2185b', ac: '#f48fb1', ff: 'Courier New,monospace', bw: false, gl: false, gb: false, sh: true },
  study_notes: { n: 'Study Notes', bg: '#e3f2fd', tc: '#0d47a1', cc: '#1565c0', pb: '#bbdefb', pc: '#1976d2', ac: '#90caf9', ff: 'Times New Roman,serif', bw: false, gl: false, gb: false, sh: true },
  science_lab: { n: 'Science Lab', bg: '#e0f7fa', tc: '#006064', cc: '#00838f', pb: '#b2ebf2', pc: '#0097a7', ac: '#80deea', ff: 'Consolas,monospace', bw: false, gl: false, gb: false, sh: true },
  memory_book: { n: 'Memory Book', bg: '#fce4ec', tc: '#880e4f', cc: '#ad1457', pb: '#f8bbd0', pc: '#c2185b', ac: '#f48fb1', ff: 'Comic Sans MS,sans-serif', bw: false, gl: false, gb: false, sh: true },
  dream_journal: { n: 'Dream Journal', bg: '#1a1a2e', tc: '#e1bee7', cc: '#ce93d8', pb: '#2d2d44', pc: '#9c27b0', ac: '#7b1fa2', ff: 'Georgia,serif', bw: false, gl: false, gb: false, sh: false },
  vintage_parchment: { n: 'Vintage Parchment', bg: '#f5e6c8', tc: '#4e342e', cc: '#5d4037', pb: '#efebe9', pc: '#8d6e63', ac: '#bcaaa4', ff: 'Georgia,serif', bw: false, gl: false, gb: false, sh: true },
  minimalist_white: { n: 'Minimalist White', bg: '#ffffff', tc: '#000000', cc: '#212121', pb: '#ffffff', pc: '#424242', ac: '#e0e0e0', ff: 'Helvetica,sans-serif', bw: false, gl: false, gb: false, sh: true },
  minimalist_black: { n: 'Minimalist Black', bg: '#121212', tc: '#ffffff', cc: '#e0e0e0', pb: '#1e1e1e', pc: '#9e9e9e', ac: '#424242', ff: 'Helvetica,sans-serif', bw: false, gl: false, gb: false, sh: true },
};

const COLORS = ['#6c63ff', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4'];
const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];

function seeded(seed) {
  let a = (seed >>> 0) || 1;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function empty(R, C) { return Array.from({ length: R }, () => Array(C).fill('')); }

function mxpShapeCell(R, C, x, y, k) {
  const cx = (C - 1) / 2, cy = (R - 1) / 2, rx = C / 2, ry = R / 2;
  const inE = (xx, yy, ax, ay) => { const dx = (xx - cx) / ax, dy = (yy - cy) / ay; return dx * dx + dy * dy <= 1; };
  const poly = (pts, xx, yy) => { let ins = false; for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) { const [xa, ya] = pts[a], [xb, yb] = pts[b]; if ((ya > yy) !== (yb > yy) && xx < (xb - xa) * (yy - ya) / (yb - ya) + xa) ins = !ins } return ins; };
  const nPts = (n, r1, r2, off) => { const p = []; for (let i = 0; i < n; i++) { const t = i * 2 * Math.PI / n + off; p.push([cx + r1 * Math.cos(t), cy + r2 * Math.sin(t)]) } return p; };
  const rect = (x0, y0, x1, y1) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
  const fl = (v) => Math.floor(v);
  const xu = (p) => fl(C * p), yu = (p) => fl(R * p);
  if (k <= 10) {
    const s = k;
    if (s === 1) return rect(xu(.38), 0, xu(.62), R - 1);
    if (s === 2) return rect(0, yu(.58), C - 1, R - 1) || rect(xu(.12), yu(.22), xu(.32), yu(.58)) || rect(xu(.68), yu(.22), xu(.88), yu(.58));
    if (s === 3) return rect(xu(.18), yu(.45), xu(.82), R - 1) || rect(xu(.35), yu(.18), xu(.65), yu(.45));
    if (s === 4) { const g = Math.max(2, fl(C / 9)); return (x % g === 0) || (y % g === 0); }
    if (s === 5) return poly([[cx, cy - ry * .9], [cx - rx * .35, cy + ry * .2], [cx + rx * .35, cy + ry * .2]], x, y) || rect(xu(.3), yu(.55), xu(.7), R - 1);
    if (s === 6) { const w = Math.max(1, xu(.12)); return rect(0, 0, w - 1, R - 1) || rect(C - w, 0, C - 1, R - 1) || rect(xu(.4), 0, xu(.6), yu(.35)); }
    if (s === 7) { const t = Math.min(R, C, 12); return y >= R - t && Math.abs(x - cx) <= (t - (R - 1 - y)) * ((rx * .95) / t); }
    if (s === 8) return inE(x, y, rx * .95, ry * .55) && y >= yu(.35);
    if (s === 9) return rect(0, yu(.35), xu(.45), R - 1) || rect(xu(.55), yu(.25), C - 1, R - 1);
    return rect(xu(.15), yu(.55), xu(.85), R - 1) && !rect(xu(.35), yu(.35), xu(.65), yu(.75));
  }
  if (k <= 20) {
    const s = k - 10;
    if (s === 1) return inE(x, y, rx * .55, ry * .42) || inE(x, y + ry * .35, rx * .35, ry * .25);
    if (s === 2) return inE(x, y, rx * .45, ry * .38) || inE(x, y - ry * .25, rx * .22, ry * .18) || inE(x, y + ry * .32, rx * .2, ry * .18);
    if (s === 3) return inE(x, y, rx * .5, ry * .55) || poly([[cx, cy + ry * .2], [cx - rx * .55, cy - ry * .35], [cx + rx * .55, cy - ry * .35]], x, y);
    if (s === 4) return inE(x, y, rx * .65, ry * .45) || inE(x + rx * .35, y, rx * .25, ry * .22) || inE(x - rx * .35, y, rx * .25, ry * .22);
    if (s === 5) return inE(x, y, rx * .7, ry * .35) || inE(x, y + ry * .25, rx * .55, ry * .2);
    if (s === 6) return inE(x, y, rx * .35, ry * .35) || inE(x + rx * .28, y - ry * .12, rx * .22, ry * .22) || inE(x - rx * .28, y - ry * .12, rx * .22, ry * .22);
    if (s === 7) return inE(x, y, rx * .55, ry * .38) || poly([[cx - rx * .75, cy], [cx - rx * .35, cy - ry * .45], [cx - rx * .35, cy + ry * .45]], x, y);
    if (s === 8) return inE(x, y, rx * .62, ry * .32) || inE(x, y - ry * .18, rx * .9, ry * .22);
    if (s === 9) return inE(x, y, rx * .75, ry * .55) || inE(x, y - ry * .35, rx * .45, ry * .28);
    return inE(x, y, rx * .55, ry * .45) || poly([[cx + rx * .55, cy], [cx + rx * .95, cy - ry * .35], [cx + rx * .95, cy + ry * .35]], x, y);
  }
  if (k <= 30) {
    const s = k - 20;
    const aw = Math.max(1, fl(C * (0.1 + s * 0.02))), ah = Math.max(1, fl(R * (0.1 + ((s + 2) % 5) * 0.03)));
    if (s <= 3) return (x >= aw && x < C - aw) || (y >= ah && y < R - ah);
    if (s <= 6) { const t = Math.max(1, Math.min(fl(Math.min(C, R) / 4), 1 + (s % 4))); return x >= 0 && x < C && y >= 0 && y < R && !(x >= t && x < C - t && y >= t && y < R - t); }
    if (s <= 8) { const ri = Math.max(0.22, 0.32 + ((s % 5) * 0.04)); return inE(x, y, rx * 0.92, ry * 0.92) && !inE(x, y, rx * ri, ry * ri); }
    const ang = Math.atan2(y - cy, x - cx), dist = Math.hypot(x - cx, y - cy);
    const mod = 0.55 + 0.45 * Math.abs(Math.cos(2 * ang + s * 0.21));
    return dist <= Math.max(rx, ry) * mod * 0.93;
  }
  if (k <= 38) {
    const s = k - 30;
    const pow = 2.05 + (s / 7.5) * 3.1;
    const nx = Math.abs(x - cx) / (rx * 0.98), ny = Math.abs(y - cy) / (ry * 0.98);
    return Math.pow(nx, pow) + Math.pow(ny, pow) <= 1;
  }
  if (k <= 44) {
    const s = k - 38;
    const wide = (s % 2) === 1;
    const mul = 0.3 + (s / 6) * 0.55;
    return wide ? inE(x, y, rx * mul, ry) : inE(x, y, rx, ry * mul);
  }
  if (k <= 52) {
    const s = k - 44;
    const pts = 6 + s;
    const inner = 0.16 + ((s % 5) * 0.04);
    const a = Math.atan2(y - cy, x - cx), d = Math.hypot(x - cx, y - cy);
    const rMx = Math.max(rx, ry) * (inner + (1 - inner) * Math.abs(Math.cos((pts / 2) * a + Math.PI / 2)));
    return d <= rMx * 0.93;
  }
  if (k <= 58) {
    const s = k - 52;
    const n = 8 + s;
    return poly(nPts(n, rx * .95, ry * .95, -Math.PI / 2), x, y);
  }
  if (k === 59) return poly([[0, 0], [C - 1, 0], [cx, cy]], x, y) || poly([[0, R - 1], [C - 1, R - 1], [cx, cy]], x, y);
  const ri = Math.max(0.26, 0.38);
  return inE(x, y, rx * 0.94, ry * 0.94) && !inE(x, y, rx * ri, ry * ri);
}

function mxShapeCell(R, C, x, y, idx) {
  const cx = (C - 1) / 2, cy = (R - 1) / 2, rx = C / 2, ry = R / 2;
  const inE = (xx, yy, ax, ay) => { const dx = (xx - cx) / ax, dy = (yy - cy) / ay; return dx * dx + dy * dy <= 1; };
  const poly = (pts, xx, yy) => { let ins = false; for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) { const [xa, ya] = pts[a], [xb, yb] = pts[b]; if ((ya > yy) !== (yb > yy) && xx < (xb - xa) * (yy - ya) / (yb - ya) + xa) ins = !ins } return ins; };
  const nPts = (n, r1, r2, off = 0) => { const p = []; for (let i = 0; i < n; i++) { const t = i * 2 * Math.PI / n + off; p.push([cx + r1 * Math.cos(t), cy + r2 * Math.sin(t)]) } return p; };
  const slot = idx - 1;
  const region = Math.floor(slot / 40);
  const j = slot % 40;
  if (region === 0) { const n = 7 + j; return poly(nPts(n, rx * .95, ry * .95, -Math.PI / 2), x, y); }
  if (region === 1) {
    const pts = 5 + (j % 12);
    const inner = 0.17 + ((Math.floor(j / 12) % 8) * 0.042);
    const a = Math.atan2(y - cy, x - cx), d = Math.hypot(x - cx, y - cy);
    const rMx = Math.max(rx, ry) * (inner + (1 - inner) * Math.abs(Math.cos((pts / 2) * a + Math.PI / 2)));
    return d <= rMx * 0.93;
  }
  if (region === 2) { const wide = (j % 2) === 0; const mul = 0.28 + (j / 39) * 0.62; return wide ? inE(x, y, rx * mul, ry) : inE(x, y, rx, ry * mul); }
  if (region === 3) { const pow = 2.05 + (j / 39) * 3.35; const nx = Math.abs(x - cx) / (rx * 0.98); const ny = Math.abs(y - cy) / (ry * 0.98); return Math.pow(nx, pow) + Math.pow(ny, pow) <= 1; }
  const bucket = Math.floor(j / 10);
  const sub = j % 10;
  if (bucket === 0) { const aw = Math.max(1, Math.floor(C * (0.12 + sub * 0.028))); const ah = Math.max(1, Math.floor(R * (0.11 + ((sub + 3) % 5) * 0.03))); return (x >= aw && x < C - aw) || (y >= ah && y < R - ah); }
  if (bucket === 1) { const t = Math.max(1, Math.min(Math.floor(Math.min(C, R) / 4), 1 + sub % 4)); return x >= 0 && x < C && y >= 0 && y < R && !(x >= t && x < C - t && y >= t && y < R - t); }
  if (bucket === 2) { const ri = Math.max(0.22, 0.34 + ((sub % 6) * 0.045)); return inE(x, y, rx * 0.92, ry * 0.92) && !inE(x, y, rx * ri, ry * ri); }
  const ang = Math.atan2(y - cy, x - cx), dist = Math.hypot(x - cx, y - cy);
  const mod = 0.58 + 0.42 * Math.abs(Math.cos(2 * ang + sub * 0.25));
  return dist <= Math.max(rx, ry) * mod * 0.93;
}

function mask(R, C, shape, scale = 1.0) {
  // Use shared 3-stage pipeline if available
  if (typeof MXDMaskPipeline !== 'undefined' && MXDMaskPipeline.generate) {
    var svgPaths = MXDMaskPipeline.SHAPE_PATHS || {};
    var m = MXDMaskPipeline.generate(R, C, shape, scale, svgPaths, null);
    if (m) return m;
  }
  // Fallback: original math-based mask
  const m = Array.from({ length: R }, () => Array(C).fill(false));
  const cx = (C - 1) / 2, cy = (R - 1) / 2, rx = C / 2 * scale, ry = R / 2 * scale;
  const inE = (x, y, ax, ay) => { const dx = (x - cx) / ax, dy = (y - cy) / ay; return dx * dx + dy * dy <= 1; };
  const poly = (pts, x, y) => { let i = false; for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) { const [xa, ya] = pts[a], [xb, yb] = pts[b]; if ((ya > y) !== (yb > y) && x < (xb - xa) * (y - ya) / (yb - ya) + xa) i = !i } return i; };
  const nPts = (n, r1, r2, off = 0) => { const p = []; for (let i = 0; i < n; i++) { const a = i * 2 * Math.PI / n + off; p.push([cx + r1 * Math.cos(a), cy + r2 * Math.sin(a)]) } return p; };
  for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
    let v = false;
    switch (shape) {
      case 'square': v = true; break;
      case 'circle': v = inE(x, y, rx, ry); break;
      case 'oval': v = inE(x, y, rx, ry * 0.65); break;
      case 'diamond': v = Math.abs(x - cx) / rx + Math.abs(y - cy) / ry <= 1; break;
      case 'triangle': { const w = ((y + 1) / R) * C, l = (C - w) / 2; v = x >= l && x < l + w; break; }
      case 'tri_down': { const w = ((R - y) / R) * C, l = (C - w) / 2; v = x >= l && x < l + w; break; }
      case 'tri_left': { const h = ((x + 1) / C) * R, t = (R - h) / 2; v = y >= t && y < t + h; break; }
      case 'tri_right': { const h = ((C - x) / C) * R, t = (R - h) / 2; v = y >= t && y < t + h; break; }
      case 'pentagon': v = poly(nPts(5, rx * .95, ry * .95, -Math.PI / 2), x, y); break;
      case 'hexagon': v = poly(nPts(6, rx * .95, ry * .95, 0), x, y); break;
      case 'octagon': v = poly(nPts(8, rx * .95, ry * .95, 0), x, y); break;
      case 'star5': { const a = Math.atan2(y - cy, x - cx), d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2), r = Math.max(rx, ry) * (0.38 + 0.62 * Math.abs(Math.cos(2.5 * a + Math.PI / 2))); v = d <= r * .93; break; }
      case 'star4': { const a = Math.atan2(y - cy, x - cx), d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2), r = Math.max(rx, ry) * (0.3 + 0.7 * Math.abs(Math.cos(2 * a))); v = d <= r * .93; break; }
      case 'star6': { const a = Math.atan2(y - cy, x - cx), d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2), r = Math.max(rx, ry) * (0.4 + 0.6 * Math.abs(Math.cos(3 * a))); v = d <= r * .93; break; }
      case 'heart': { const nx = (x - cx) / (rx * .88), ny = (y - cy) / (ry * .88), h = nx * nx + ny * ny - 1; v = h * h * h - nx * nx * ny * ny * ny <= 0.06; break; }
      case 'cross': { const aw = Math.floor(C / 3), ah = Math.floor(R / 3); v = (x >= aw && x < C - aw) || (y >= ah && y < R - ah); break; }
      case 'moon': { const full = inE(x, y, rx, ry), cut = ((x - (cx + rx * .22)) ** 2 / (rx * .8) ** 2 + (y - cy) ** 2 / (ry * .92) ** 2) <= 1; v = full && !cut; break; }
      case 'cloud': { const bs = [[cx, cy, rx * .55, ry * .55], [cx - rx * .45, cy + ry * .18, rx * .4, ry * .4], [cx + rx * .45, cy + ry * .18, rx * .4, ry * .4], [cx - rx * .22, cy - ry * .18, rx * .38, ry * .38], [cx + rx * .22, cy - ry * .18, rx * .38, ry * .38]]; v = bs.some(([bx, by, bx2, by2]) => inE(x, y, bx2, by2) && ((x - bx) ** 2 / bx2 ** 2 + (y - by) ** 2 / by2 ** 2) <= 1); break; }
      case 'shield': { const top = inE(x, y, rx * .9, ry * .62) && y <= cy + ry * .35; const bot = y > cy + ry * .3 && poly([[cx - rx * .82, cy + ry * .3], [cx + rx * .82, cy + ry * .3], [cx, R - .5]], x, y); v = top || bot; break; }
      case 'lightning': v = poly([[cx + rx * .2, 0], [cx - rx * .5, ry], [cx + rx * .1, ry], [cx - rx * .2, R - 1], [cx + rx * .5, ry * 1.05], [cx, ry * 1.05], [cx + rx * .2, 0]], x, y); break;
      case 'letter_L': { const sw = Math.floor(C * .35), bh = Math.floor(R * .28); v = (x < sw) || (y >= R - bh); break; }
      case 'letter_T': { const th = Math.floor(R * .28), sw = Math.floor(C * .35), sx = Math.floor((C - sw) / 2); v = (y < th) || (x >= sx && x < sx + sw); break; }
      case 'letter_O': { const tk = Math.max(2, Math.floor(Math.min(rx, ry) * .35)); v = inE(x, y, rx, ry) && !inE(x, y, rx - tk, ry - tk); break; }
      case 'letter_X': { const dx2 = Math.abs(x - cx), dy2 = Math.abs(y - cy), w = Math.max(2, Math.floor(Math.min(rx, ry) * .28)); v = Math.abs(dx2 - dy2) < w * (rx / ry) || Math.abs(dx2 + dy2 - Math.max(rx, ry)) < w; break; }
      case 'letter_C': { const tk = Math.max(2, Math.floor(Math.min(rx, ry) * .35)); const ring = inE(x, y, rx, ry) && !inE(x, y, rx - tk, ry - tk); const cut = x > cx + rx * .15 && Math.abs(y - cy) < ry * .38; v = ring && !cut; break; }
      case 'cat': { const body = inE(x, y, rx * .85, ry * .6), eL = poly([[cx - rx * .6, cy - ry * .35], [cx - rx * .2, cy - ry * .35], [cx - rx * .4, cy - ry * 1.0]], x, y), eR = poly([[cx + rx * .2, cy - ry * .35], [cx + rx * .6, cy - ry * .35], [cx + rx * .4, cy - ry * 1.0]], x, y); v = body || eL || eR; break; }
      case 'bird': { const body = inE(x, y, rx * .55, ry * .4), wing = poly([[cx - rx * .9, cy - .1], [cx + rx * .1, cy - ry * .5], [cx + rx * .1, cy + ry * .1]], x, y), tail = poly([[cx + rx * .45, cy - ry * .1], [cx + rx * 1.0, cy - ry * .55], [cx + rx * 1.0, cy + ry * .2], [cx + rx * .45, cy + ry * .1]], x, y); v = body || wing || tail; break; }
      case 'fish': { const body = inE(x, y, rx * .7, ry * .55), tail = poly([[cx + rx * .55, cy], [cx + rx * 1.0, cy - ry * .55], [cx + rx * 1.0, cy + ry * .55]], x, y); v = body || tail; break; }
      case 'tree': { const tw = Math.floor(C * .18), th = Math.floor(R * .28), tx = Math.floor((C - tw) / 2), trunk = x >= tx && x < tx + tw && y >= R - th, top = y < R - th && Math.abs(x - cx) <= (R - th - y) * ((rx * .9) / (R - th)); v = trunk || top; break; }
      case 'house': { const wh = Math.floor(R * .5), wy = Math.floor(R * .45), wall = y >= wy && x >= Math.floor(C * .1) && x < Math.floor(C * .9), roof = y < wy && Math.abs(x - cx) <= ((wy - y) * (rx * .85) / wy); v = wall || roof; break; }
      case 'arrow_r': { const mid = Math.floor(R / 2), tip = Math.floor(C * .55), shaft = y >= mid - Math.floor(R * .18) && y <= mid + Math.floor(R * .18) && x < tip, head = Math.abs(y - mid) <= (C - x) * .65 && x >= tip; v = shaft || head; break; }
      case 'arrow_u': { const mid = Math.floor(C / 2), tip = Math.floor(R * .45), shaft = x >= mid - Math.floor(C * .18) && x <= mid + Math.floor(C * .18) && y > tip, head = Math.abs(x - mid) <= (R - y) * .65 && y <= tip; v = shaft || head; break; }
      case 'hourglass': { const cy2 = cy; const top = y <= cy2 && Math.abs(x - cx) <= ((y + 1) / (cy2 + 1)) * rx * 0.92; const den = Math.max(0.001, (R - 1 - cy2)); const bot = y >= cy2 && Math.abs(x - cx) <= ((R - 1 - y) / den) * rx * 0.92; v = top || bot; break; }
      case 'stadium': { const pillRx = rx * 0.92, pillRy = ry * 0.48, halfW = Math.max(0, pillRx - pillRy), dx = Math.abs(x - cx), dyy = Math.abs(y - cy); v = (dx <= halfW && dyy <= pillRy) || (Math.hypot(dx - halfW, dyy) <= pillRy + 0.5); break; }
      case 'arch_up': v = inE(x, y, rx * 0.95, ry * 0.9) && y <= cy + ry * 0.12; break;
      case 'bowtie': v = poly([[0, 0], [C - 1, 0], [cx, cy]], x, y) || poly([[0, R - 1], [C - 1, R - 1], [cx, cy]], x, y); break;
      case 'donut': v = inE(x, y, rx * 0.94, ry * 0.94) && !inE(x, y, rx * 0.55, ry * 0.55); break;
      default: {
        const mxp = /^mxp_(\d+)$/.exec(shape);
        if (mxp) { const ik = parseInt(mxp[1], 10); if (ik >= 1 && ik <= 60) { v = mxpShapeCell(R, C, x, y, ik); break; } }
        const mx = /^shape_mx_(\d+)$/.exec(shape);
        if (mx) { const ix = parseInt(mx[1], 10); if (ix >= 1 && ix <= 200) { v = mxShapeCell(R, C, x, y, ix); break; } }
        v = true; break;
      }
    }
    m[y][x] = v;
  }
  return m;
}
function canPlace(grid, mask, word, r, c, dr, dc, overlapPolicy) {
  const R = grid.length, C = grid[0].length;
  for (let i = 0; i < word.length; i++) {
    const nr = r + dr * i, nc = c + dc * i;
    if (nr < 0 || nr >= R || nc < 0 || nc >= C || !mask[nr][nc]) return false;
    if (grid[nr][nc] !== '') {
      if (overlapPolicy === 'none') return false;
      if (grid[nr][nc] !== word[i]) return false;
    }
  }
  return true;
}

function place(grid, mask, word, opts) {
  const { diag, rev, allowH, allowV, overlapPolicy, rng } = opts;
  const dirs = [];
  if (allowH !== false) dirs.push(DIRS[0]);
  if (allowV !== false) dirs.push(DIRS[1]);
  if (rev) {
    if (allowH !== false) dirs.push(DIRS[2]);
    if (allowV !== false) dirs.push(DIRS[3]);
  }
  if (diag) dirs.push(...DIRS.slice(4));
  dirs.sort(() => (rng() - 0.5));
  const R = grid.length, C = grid[0].length;
  const pos = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) pos.push([r, c]);
  pos.sort(() => (rng() - 0.5));
  for (const [dr, dc] of dirs) for (const [r, c] of pos)
    if (canPlace(grid, mask, word, r, c, dr, dc, overlapPolicy)) {
      const cells = [];
      for (let i = 0; i < word.length; i++) { grid[r + dr * i][c + dc * i] = word[i]; cells.push([r + dr * i, c + dc * i]); }
      return cells;
    }
  return null;
}

function fill(grid, mask, lc, rng) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid[0].length; c++)
    if (mask[r][c] && grid[r][c] === '') { const ch = A[Math.floor(rng() * 26)]; grid[r][c] = lc === 'lower' ? ch.toLowerCase() : ch; }
}

function hashSeed(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return h >>> 0;
}

function generatePuzzle(cfg) {
  const { rows, cols, words, shape, allowDiag, allowReverse, allowH = true, allowV = true, letterCase, maxAttempts = 120 } = cfg;
  const overlapPolicy = cfg.overlapPolicy || 'matchOnly';
  const m = mask(rows, cols, shape, cfg.shapeScale || 1.0);
  const activeCells = m.flat().filter(Boolean).length;
  const maxLetters = Math.floor(activeCells * 0.55);
  const sorted = [...words].sort((a, b) => b.length - a.length);
  const selected = [];
  let totalLen = 0;
  for (const w of sorted) { if (totalLen + w.length <= maxLetters) { selected.push(w); totalLen += w.length; } }
  const seedInput = JSON.stringify({ rows, cols, shape, allowDiag, allowReverse, allowH, allowV, words: selected.map(w => w.toUpperCase()).sort(), page: cfg.pageIndex || 0 });
  const seed = (cfg.seed !== undefined && cfg.seed !== '' && cfg.seed !== null) ? hashSeed(String(cfg.seed) + '_page_' + (cfg.pageIndex || 0)) : hashSeed(seedInput);
  const rng = seeded(seed);
  for (let a = 0; a < maxAttempts; a++) {
    const grid = empty(rows, cols), placements = {};
    for (const w of selected) {
      const uw = letterCase === 'lower' ? w.toLowerCase() : w.toUpperCase();
      const cells = place(grid, m, uw, { diag: allowDiag, rev: allowReverse, allowH, allowV, overlapPolicy, rng });
      if (cells) placements[w] = cells;
    }
    if (Object.keys(placements).length === selected.length) {
      fill(grid, m, letterCase, rng);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!m[r][c]) grid[r][c] = '';
      return { grid, mask: m, placements, success: true, wordsPlaced: selected.length };
    }
  }
  const grid = empty(rows, cols), placements = {};
  for (const w of selected) {
    const uw = letterCase === 'lower' ? w.toLowerCase() : w.toUpperCase();
    const cells = place(grid, m, uw, { diag: allowDiag, rev: allowReverse, allowH, allowV, overlapPolicy, rng });
    if (cells) placements[w] = cells;
  }
  fill(grid, m, letterCase, rng);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!m[r][c]) grid[r][c] = '';
  return { grid, mask: m, placements, success: Object.keys(placements).length === selected.length, wordsPlaced: Object.keys(placements).length };
}

function hex2rgb(h) {
  if (!h || typeof h !== 'string' || h[0] !== '#' || h.length < 7) return [0, 0, 0];
  const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16);
  if ([r, g, b].some(n => Number.isNaN(n))) return [0, 0, 0];
  return [r, g, b];
}

function drawPage(doc, pz, cfg, idx, isSol) {
  const W = cfg.docW || 612, H = cfg.docH || 792, M = cfg.docM || 36;
  const tmpl = TEMPLATES[cfg.template] || TEMPLATES.classic;
  const showGridLines = !!(tmpl.gl || cfg.forceGridLines);
  const bw = tmpl.bw || cfg.colorMode === 'bw';
  const { grid, mask: m, placements } = pz;
  const rows = grid.length, cols = grid[0].length;
  if (tmpl.bg && tmpl.bg !== '#ffffff') {
    const [r, g, b] = hex2rgb(tmpl.bg.startsWith('#') ? tmpl.bg : '#1a1a2e');
    doc.setFillColor(r, g, b); doc.rect(0, 0, W, H, 'F');
  }
  // Professional title rendering with alignment, style, weight, color, subtitle support
  const titlePos = cfg.titlePos || 1;
  const titleAlign = cfg.titleAlign || 'center';
  const titleStyle = cfg.titleStyle || 'none';
  const titleWeight = cfg.titleWeight || 800;
  const titleColorHex = cfg.titleColor || tmpl.tc || '#1a1a2e';
  const titleColor = bw ? [0, 0, 0] : hex2rgb(titleColorHex);
  const titleBgHex = cfg.titleBg || '';
  const subtitle = cfg.subtitle || '';
  const titleFontSize = Math.min(Math.max(cfg.titleFontSize || 22, 10), 36);
  const titleIndent = cfg.titleIndent || 0;
  const titleGap = cfg.titleGap || 0;
  const titleText = (cfg.title || 'Word Search') + (isSol ? ' â€” Solution Key' : '');
  // Compute title position
  const alignOption = titleAlign === 'left' ? 'left' : titleAlign === 'right' ? 'right' : 'center';
  let titleX = alignOption === 'center' ? W / 2 : alignOption === 'left' ? M : W - M;
  titleX += titleIndent;
  const titleY = M + 16 + titleGap;
  // Draw banner/boxed background
  if (titleStyle === 'banner' || titleStyle === 'boxed' || titleBgHex) {
    const tw = doc.getTextWidth(titleText) + 32;
    const bx = alignOption === 'center' ? titleX - tw / 2 : alignOption === 'left' ? titleX - 4 : titleX - tw + 4;
    const by = titleY - titleFontSize - 4;
    const bh = titleFontSize + 14 + (subtitle ? titleFontSize * 0.55 + 6 : 0);
    if (titleBgHex) { const [br, bg, bb] = hex2rgb(titleBgHex); doc.setFillColor(br, bg, bb); }
    else { doc.setFillColor(bw ? 240 : Math.min(255, titleColor[0] + 50), bw ? 240 : Math.min(255, titleColor[1] + 50), bw ? 240 : Math.min(255, titleColor[2] + 50)); }
    if (titleStyle === 'boxed') { doc.roundedRect(bx, by, tw, bh, 3, 3, 'F'); doc.setDrawColor(...titleColor); doc.setLineWidth(1); doc.roundedRect(bx, by, tw, bh, 3, 3, 'S'); }
    else { doc.rect(0, by, W, bh, 'F'); }
  }
  // Underline style
  if (titleStyle === 'underline') {
    const tw = doc.getTextWidth(titleText);
    const ul = alignOption === 'center' ? titleX - tw / 2 : alignOption === 'left' ? titleX : titleX - tw;
    const ur = ul + tw;
    doc.setDrawColor(...titleColor); doc.setLineWidth(1.5); doc.line(ul, titleY + 2, ur, titleY + 2);
  }
  // Draw title text
  const fontStyle = titleWeight >= 700 ? 'bold' : 'normal';
  doc.setTextColor(...titleColor); doc.setFont('helvetica', fontStyle); doc.setFontSize(titleFontSize);
  doc.text(titleText, titleX, titleY, { align: alignOption });
  // Draw subtitle
  if (subtitle) {
    const subFS = Math.max(9, Math.round(titleFontSize * 0.55));
    doc.setFont('helvetica', 'normal'); doc.setFontSize(subFS);
    doc.setTextColor(...titleColor.map(v => Math.min(255, v + 60)));
    doc.text(subtitle, titleX, titleY + subFS + 4, { align: alignOption });
  }
  // Answer key label (only for solution pages)
  if (isSol) { doc.setFont('helvetica', 'italic'); doc.setFontSize(10); doc.setTextColor(...titleColor.map(v => Math.min(255, v + 60))); doc.text('Answer Key', titleX, M + 32 + titleGap, { align: alignOption }); }
  const maxGW = W - M * 2.2, maxGH = H - M * 2 - 130;
  const cs = Math.min(Math.floor(maxGW / cols), Math.floor(maxGH / rows), 24);
  const gw = cols * cs, gh = rows * cs, gx = (W - gw) / 2, gy = M + 50;
  if (tmpl.gb) { doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.5); doc.rect(gx, gy, gw, gh); }
  if (showGridLines) { doc.setDrawColor(230, 230, 230); doc.setLineWidth(0.3); for (let c2 = 0; c2 <= cols; c2++) doc.line(gx + c2 * cs, gy, gx + c2 * cs, gy + gh); for (let r2 = 0; r2 <= rows; r2++) doc.line(gx, gy + r2 * cs, gx + gw, gy + r2 * cs); }
  const solSet = new Set();
  if (isSol) { Object.values(placements).forEach(cells => { cells.forEach(([r, c]) => solSet.add(`${r}-${c}`)); }); }
  const solStyle = cfg.solutionStyle || 'highlight';
  const hlRaw = (cfg.highlightColor && String(cfg.highlightColor).startsWith('#')) ? cfg.highlightColor : '#c9a227';
  const [hr, hg, hb] = hex2rgb(hlRaw);
  if (isSol) {
    const perpOff = (x1, y1, x2, y2, off) => { const len = Math.hypot(x2 - x1, y2 - y1) || 1; return [-(y2 - y1) / len * off, (x2 - x1) / len * off]; };
    if (['highlight', 'dim', 'dashed', 'double_line'].includes(solStyle)) {
      let ci = 0;
      Object.entries(placements).forEach(([, cells]) => {
        if (cells.length < 2) return;
        const [r1, c1] = cells[0], [r2, c2] = cells[cells.length - 1];
        const x1 = gx + c1 * cs + cs / 2, y1 = gy + r1 * cs + cs / 2, x2 = gx + c2 * cs + cs / 2, y2 = gy + r2 * cs + cs / 2;
        const col = bw ? '#aaaaaa' : COLORS[ci % COLORS.length];
        const [cr, cg, cb] = hex2rgb(col);
        doc.setDrawColor(cr, cg, cb); doc.setLineCap('round');
        if (solStyle === 'dashed' && doc.setLineDashPattern) { doc.setLineDashPattern([Math.max(3, cs * 0.22), cs * 0.16], 0); }
        else if (doc.setLineDashPattern) { doc.setLineDashPattern([], 0); }
        if (solStyle === 'dim') { doc.setLineWidth(cs * 0.38); doc.setGState && doc.setGState(doc.GState({ opacity: 0.14 })); doc.line(x1, y1, x2, y2); doc.setGState && doc.setGState(doc.GState({ opacity: 1 })); }
        else if (solStyle === 'double_line') { const off = Math.max(1, cs * 0.1); const [px, py] = perpOff(x1, y1, x2, y2, off); doc.setLineWidth(cs * 0.2); doc.setGState && doc.setGState(doc.GState({ opacity: 0.42 })); doc.line(x1 + px, y1 + py, x2 + px, y2 + py); doc.line(x1 - px, y1 - py, x2 - px, y2 - py); doc.setGState && doc.setGState(doc.GState({ opacity: 1 })); }
        else { doc.setLineWidth(cs * 0.65); doc.setGState && doc.setGState(doc.GState({ opacity: solStyle === 'dashed' ? 0.35 : 0.28 })); doc.line(x1, y1, x2, y2); doc.setGState && doc.setGState(doc.GState({ opacity: 1 })); }
        if (doc.setLineDashPattern) doc.setLineDashPattern([], 0); ci++;
      });
    } else if (solStyle === 'circle') { doc.setDrawColor(hr, hg, hb); doc.setLineWidth(1.1); for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { if (!m[r][c] || !solSet.has(`${r}-${c}`)) continue; doc.circle(gx + c * cs + cs / 2, gy + r * cs + cs / 2, cs * 0.38, 'S'); } }
    else if (solStyle === 'boxed') { doc.setDrawColor(hr, hg, hb); doc.setLineWidth(1.35); for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { if (!m[r][c] || !solSet.has(`${r}-${c}`)) continue; doc.rect(gx + c * cs + 1.2, gy + r * cs + 1.2, cs - 2.4, cs - 2.4, 'S'); } }
    else if (solStyle === 'underline') { doc.setDrawColor(hr, hg, hb); doc.setLineWidth(1.15); for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { if (!m[r][c] || !solSet.has(`${r}-${c}`)) continue; doc.line(gx + c * cs + cs * 0.18, gy + r * cs + cs * 0.8, gx + c * cs + cs * 0.82, gy + r * cs + cs * 0.8); } }
    else if (solStyle === 'dot') { doc.setFillColor(hr, hg, hb); const rad = Math.max(1.4, cs * 0.11); for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { if (!m[r][c] || !solSet.has(`${r}-${c}`)) continue; doc.circle(gx + c * cs + cs / 2, gy + r * cs + cs * 0.42, rad, 'F'); } }
  }
  const cellColor = bw ? [0, 0, 0] : hex2rgb(tmpl.cc || '#2d2d44');
  const dimColor = [180, 180, 180];
  doc.setFontSize(Math.max(cs * 0.52, 8));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (!m[r][c] || !grid[r][c]) continue;
    const inSolWord = solSet.has(`${r}-${c}`);
    if (isSol && solStyle === 'dim' && !inSolWord) doc.setTextColor(...dimColor);
    else doc.setTextColor(...cellColor);
    doc.setFont('helvetica', isSol && inSolWord ? 'bold' : 'normal');
    doc.text(grid[r][c], gx + c * cs + cs / 2, gy + r * cs + cs / 2 + 1, { align: 'center', baseline: 'middle' });
  }
  const wlY = gy + gh + 18;
  const wlColor = bw ? [0, 0, 0] : hex2rgb(tmpl.tc || '#2d2d44');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...wlColor);
  doc.text('WORDS TO FIND', W / 2, wlY, { align: 'center' });
  const fs2 = Math.min(cfg.wordFontSize || 11, 13);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(fs2);
  const pillColor = bw ? [80, 80, 80] : hex2rgb(tmpl.pc || '#4a3d8f');
  doc.setTextColor(...pillColor);
  const words = Object.keys(placements);
  let wx = M, wy = wlY + 16;
  words.forEach(w => {
    const label = w.toUpperCase();
    const tw = doc.getTextWidth(label) + 16;
    if (wx + tw > W - M) { wx = M; wy += fs2 + 8; }
    if (wy > H - M) return;
    if (tmpl.pb && !bw) {
      const [pr, pg, pb2] = hex2rgb(tmpl.pb.startsWith('#') ? tmpl.pb : '#f3f0ff');
      doc.setFillColor(pr, pg, pb2); doc.roundedRect(wx, wy - fs2 + 2, tw, fs2 + 4, 3, 3, 'F');
    }
    doc.text(label, wx + 8, wy); wx += tw;
  });
  if (cfg.showPageNum) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(160, 160, 160); doc.text(`${isSol ? 'Solution ' : ''}Page ${(cfg.pageNum || 1) + idx}`, W / 2, H - 14, { align: 'center' }); }
}

async function generatePDF(puzzles, cfg, onProgress) {
  // Check cache first
  const cacheKey = generatePdfCacheKey(puzzles, cfg);
  const cached = await getCachedPdf(cacheKey);
  if (cached) {
    if (onProgress) onProgress(puzzles.length, puzzles.length, 'Loaded from cache');
    return { doc: null, blob: cached, fromCache: true, cacheKey };
  }

  // KDP compliance validation
  const kdpCheck = validateKdpCompliance(cfg);
  if (onProgress && kdpCheck.issues.length > 0) {
    kdpCheck.issues.forEach(issue => {
      if (issue.severity === 'error') console.error('[PDF KDP] ' + issue.message);
      else console.warn('[PDF KDP] ' + issue.message);
    });
  }

  var fmt = cfg.format || 'letter';
  if (cfg.docW && cfg.docH) { fmt = [cfg.docW, cfg.docH]; }
  const orientation = cfg.docW && cfg.docH ? (cfg.docW > cfg.docH ? 'landscape' : 'portrait') : (cfg.orientation || 'portrait');
  const doc = new jsPDF({ orientation, unit: 'pt', format: fmt, compress: cfg.compress !== false });

  // Embed PDF metadata
  if (cfg.metadata) {
    const meta = cfg.metadata;
    if (meta.title) doc.setProperties({ title: meta.title });
    if (meta.author) doc.setProperties({ author: meta.author });
    if (meta.subject) doc.setProperties({ subject: meta.subject });
    if (meta.keywords) doc.setProperties({ keywords: meta.keywords });
  } else {
    doc.setProperties({
      title: cfg.title || 'Word Search Puzzle',
      author: cfg.author || 'MXD Word Search Generator',
      subject: 'Word Search Puzzle Book',
      creator: 'MXD Word Search Generator v3.0',
      keywords: (cfg.words || []).slice(0, 20).join(', ')
    });
  }

  // Add watermark if configured (free tier)
  const addWatermark = cfg.watermark === true;
  const watermarkText = cfg.watermarkText || 'Generated by MXD Word Search';

  const includeSolutions = cfg.showSolution === true;
  const total = puzzles.length * (includeSolutions ? 2 : 1);
  let done = 0;

  for (let i = 0; i < puzzles.length; i++) {
    if (i > 0) doc.addPage();
    drawPage(doc, puzzles[i], cfg, i, false);
    if (addWatermark) {
      doc.setFontSize(8); doc.setTextColor(180, 180, 180);
      doc.text(watermarkText, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }
    done++;
    if (onProgress) onProgress(done, total, `Puzzle ${i + 1}/${puzzles.length}`);
    if (done % 5 === 0) await new Promise(r => setTimeout(r, 0));
  }

  if (includeSolutions) {
    for (let i = 0; i < puzzles.length; i++) {
      doc.addPage();
      drawPage(doc, puzzles[i], cfg, i, true);
      if (addWatermark) {
        doc.setFontSize(8); doc.setTextColor(180, 180, 180);
        doc.text(watermarkText, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      }
      done++;
      if (onProgress) onProgress(done, total, `Solution ${i + 1}/${puzzles.length}`);
      if (done % 5 === 0) await new Promise(r => setTimeout(r, 0));
    }
  }

  // Generate blob and cache it
  const blob = doc.output('blob');
  await cachePdf(cacheKey, blob);

  // Periodic cache cleanup
  if (Math.random() < 0.1) clearExpiredCache();

  return { doc, blob, fromCache: false, cacheKey, kdpCompliance: kdpCheck };
}

self.onmessage = async function (e) {
  const msg = e.data;
  const send = (data) => { self.postMessage({ id: msg.id, ...data }); };

  try {
    if (msg.type === 'bulk') {
      const { cfg, wordText, count } = msg;
      const parsedWords = parseWords(wordText);
      const puzzles = [];
      for (let i = 0; i < count; i++) {
        const result = generatePuzzle({ ...cfg, words: parsedWords, pageIndex: i });
        puzzles.push(result);
        send({ type: 'progress', done: i + 1, total: count, label: `Generating puzzle ${i + 1}/${count}...` });
        if ((i + 1) % 30 === 0) await new Promise(r => setTimeout(r, 0));
      }
      send({ type: 'puzzles', puzzles });
    }

    else if (msg.type === 'generate' || msg.type === 'pdf') {
      const { puzzles, cfg } = msg;
      const result = await generatePDF(puzzles, cfg, (done, total, label) => {
        send({ type: 'progress', done, total, label });
      });
      const blob = result.blob || result.doc.output('blob');
      send({ type: 'result', blob, fromCache: result.fromCache, kdpCompliance: result.kdpCompliance });
    }

    else if (msg.type === 'bulk-pdf') {
      const { cfg, wordText, count } = msg;
      const parsedWords = parseWords(wordText);
      const puzzles = [];
      const totalSteps = count * 2;
      for (let i = 0; i < count; i++) {
        const result = generatePuzzle({ ...cfg, words: parsedWords, pageIndex: i });
        puzzles.push(result);
        send({ type: 'progress', done: i + 1, total: totalSteps, label: `Generating puzzle ${i + 1}/${count}...` });
        if ((i + 1) % 30 === 0) await new Promise(r => setTimeout(r, 0));
      }
      const result = await generatePDF(puzzles, cfg, (done, total, label) => {
        send({ type: 'progress', done: count + done, total: totalSteps, label });
      });
      const blob = result.blob || result.doc.output('blob');
      send({ type: 'result', blob, fromCache: result.fromCache, kdpCompliance: result.kdpCompliance });
    }
  } catch (err) {
    send({ type: 'error', error: err.message });
  }
};
