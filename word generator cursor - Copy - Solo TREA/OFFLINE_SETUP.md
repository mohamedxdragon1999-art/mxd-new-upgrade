# MXD Word Search Generator — Offline Setup Guide

## 🚀 Quick Start (Works Immediately!)

Just **double-click `index.html`** — the app will load from CDNs if you have internet.

## 📦 Full Offline Mode (No Internet Required)

To run completely offline, download these files into the `libs/` folder:

### Required Files

| File | Download Link | Size |
|------|---------------|------|
| `libs/react.production.min.js` | [Download](https://unpkg.com/react@18/umd/react.production.min.js) | ~45 KB |
| `libs/react-dom.production.min.js` | [Download](https://unpkg.com/react-dom@18/umd/react-dom.production.min.js) | ~130 KB |
| `libs/babel.min.js` | [Download](https://unpkg.com/@babel/standalone/babel.min.js) | ~1.2 MB |
| `libs/html2canvas.min.js` | [Download](https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js) | ~200 KB |
| `libs/jszip.min.js` | [Download](https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js) | ~100 KB |

**Already included:** `libs/jspdf.umd.min.js` ✓

### One-Click Download (PowerShell)

Run this in PowerShell from the project folder:

```powershell
$libs = "C:\Users\moham\OneDrive\Desktop\word generator cursor - Copy\libs"
Invoke-WebRequest -Uri "https://unpkg.com/react@18/umd/react.production.min.js" -OutFile "$libs\react.production.min.js"
Invoke-WebRequest -Uri "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" -OutFile "$libs\react-dom.production.min.js"
Invoke-WebRequest -Uri "https://unpkg.com/@babel/standalone/babel.min.js" -OutFile "$libs\babel.min.js"
Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" -OutFile "$libs\html2canvas.min.js"
Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js" -OutFile "$libs\jszip.min.js"
```

### Alternative: Use a Local Server

If you prefer not to download files, run a local server:

**Python:**
```bash
python -m http.server 8000
```
Then open: `http://localhost:8000`

**Node.js:**
```bash
npx serve .
```

**VS Code:**
1. Install "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"

## ⚙️ Settings System

Press **Ctrl+,** or **F1** to open the comprehensive settings modal with:
- 🔍 Search across all 80+ settings
- ⚡ 12 one-click presets (Kids, Senior, Expert, KDP, etc.)
- 👤 Profile management (save/load/delete settings profiles)
- 📤 Export/Import settings as JSON
- ↩️ Undo/redo support
- 🤖 AI recommendations based on your configuration
- ♿ Auto-detection of accessibility preferences

## 🎮 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New Puzzle |
| `Ctrl+E` | Export PDF |
| `Ctrl+S` | Save Puzzle |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+G` | Generate |
| `Ctrl+,` | Open Settings |
| `F1` | Open Settings |
| `F11` | Fullscreen |
| `Esc` | Exit Fullscreen / Close Modal |
| `Ctrl+Shift+P` | Performance Dashboard |

## 🔧 Troubleshooting

### "Missing Local Dependencies" popup appears
- Click "Download from CDN" links to get the files
- Or use a local server (see above)
- Or click "Continue Anyway" — core features will still work

### App doesn't load at all
- Check browser console (F12) for errors
- Ensure all `.js` files are in the same folder as `index.html`
- Try opening with a local server instead of `file://`

### Settings not saving
- Check if localStorage is enabled in your browser
- Try clearing browser data and reloading
- Export settings as backup: Settings → Export
