# Mandala Chart App

Aplikasi web professional untuk **Mandala Chart** goal planning. Pecah tujuan besar menjadi langkah terstruktur menggunakan metode Mandala 9x9 dengan bantuan AI.

---

## Cara Menjalankan

### 1. Setup API Key

Edit `backend/.env` dan masukkan Groq API key Anda:
```
GROQ_API_KEY=your_key_here
```
Dapatkan API key gratis di: https://console.groq.com

### 2. Jalankan Aplikasi

```bash
# Cara cepat (jalankan backend + frontend sekaligus)
chmod +x start.sh && ./start.sh

# Atau secara terpisah:
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Buka browser: **http://localhost:5173**

---

## Fitur

| Fitur | Keterangan |
|---|---|
| Grid 9x9 interaktif | Click to edit, double-click to navigate |
| Undo / Redo | Ctrl+Z / Ctrl+Y |
| Auto Save | localStorage + backend sync |
| Zoom & Pan | Scroll zoom, drag canvas |
| Focus Mode | Highlight satu cabang, dim yang lain |
| AI: Generate 8 Pillars | Buat 8 sub-goal dari main goal |
| AI: Break Down | Pecah sub-goal menjadi 8 aksi |
| AI: Improve | Rephrase agar lebih actionable |
| AI: Make SMART | Konversi ke SMART goals |
| Template Preset | 5 template siap pakai |
| Export PNG | Layout bersih untuk cetak |
| Export PDF | Format A3 landscape |
| Export Markdown | Terstruktur dengan heading |
| Export JSON | Import kembali ke aplikasi |

## Struktur Project

```
Chart/
├── backend/           # Node.js + Express + SQLite + Groq
│   └── src/
│       ├── routes/    # projects.js, ai.js, export.js
│       ├── services/  # project, ai, export services
│       ├── middleware/ # rateLimit, logger
│       └── db/        # schema, database connector
└── frontend/          # Vite + TailwindCSS
    └── src/
        ├── core/      # mandala.js, history.js, storage.js
        ├── ui/        # grid.js, toast.js, breadcrumb.js
        ├── services/  # api.js
        └── templates/ # presets.js
```

## API Endpoints

| Method | Path | Keterangan |
|---|---|---|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Buat project baru |
| PUT | `/api/projects/:id` | Update project |
| POST | `/api/ai/generate-pillars` | Generate 8 sub-goals |
| POST | `/api/ai/breakdown` | Generate 8 aksi |
| POST | `/api/ai/improve` | Improve teks |
| POST | `/api/ai/make-smart` | Konversi ke SMART |
| POST | `/api/export/png` | Export PNG |
| POST | `/api/export/pdf` | Export PDF |

## Rate Limit AI
- 20 request per menit per IP
- Response 429 jika terlampaui
