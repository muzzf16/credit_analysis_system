# AGENTS.md — BPR BAPERA BATANG
# File ini dibaca otomatis oleh: Antigravity, Cursor, Claude Code, Codex
# (dan tool kompatibel AGENTS.md lainnya)
# ═══════════════════════════════════════════════════════
# Untuk context sesi lengkap, lihat folder .ai/
# ═══════════════════════════════════════════════════════

## Project
- **App:** Sistem Analisa Kredit — PT BPR BAPERA BATANG
- **Deskripsi:** Digitalisasi proses analisa kredit konsumtif & produktif
- **Repo:** https://github.com/muzzf16/credit_analysis_system
- **Status:** Phase 1 selesai (production), Phase 3/4/5 in progress

## Stack
| Layer | Pilihan | Port |
|-------|---------|------|
| Frontend | React + Vite + TailwindCSS | 3000 dev / 80 prod |
| Backend | Node.js + Express | 5000 |
| Database | PostgreSQL 15 (23 tabel) | 5432 |
| Storage | MinIO | 9000 / 9001 |
| Proxy | Nginx | 80 |
| WA Gateway | Baileys (Node.js) | 3001 |
| Container | Docker + Docker Compose | - |

## Struktur Folder
```
frontend/src/components/  → Komponen UI reusable
frontend/src/pages/       → Komponen level route
frontend/src/hooks/       → Custom React hooks
frontend/src/utils/       → Pure functions, API calls
backend/routes/           → Express route definitions
backend/controllers/      → Business logic
backend/models/           → Database queries
backend/middleware/       → Auth, validation, logging
backend/migrations/       → Schema changes (WAJIB untuk perubahan DB)
nginx/                    → Reverse proxy config
```

## User Roles (6 role — LOCKED)
`ADMIN` | `DIREKSI` | `KABID` | `ANALIS` | `AO` | `SPI`

## Formula Kredit — TIDAK BOLEH DIUBAH
```
DSR  = (Total Cicilan / Total Penghasilan) × 100   → Maks 40%
RPC  = (Disposable Income / Angsuran) × 100         → Min 110%
DSCR = Laba Bersih / Total Kewajiban                → Min 1.2

Scoring 5C: Character 25% | Capacity 30% | Capital 15% | Collateral 20% | Condition 10%
Grade: A=90-100 | B=80-89 | C=70-79 | D=60-69 | E=<60
```
Ini kebijakan bisnis BPR, bukan asumsi teknis — jangan diubah tanpa persetujuan eksplisit.

## Aturan Wajib

### Selalu Lakukan
- `async/await` untuk semua operasi async, dengan `try/catch`
- Format response API selalu: `{ success, message, data }`
- Upload file (dokumen, foto agunan, MAK) → MinIO bucket `bpr-bapera`, bukan filesystem
- Setiap route yang butuh proteksi → middleware `authenticate` + `authorize(['ROLE'])`
- Perubahan schema database → buat file migrasi baru, jangan query manual
- Operasi pada data sensitif (debitur, kredit, approval) → catat ke tabel `audit_logs`
- Baca file yang ada dulu sebelum mengedit — jangan asumsi isinya
- Styling: TailwindCSS utility classes saja, no inline styles
- Komponen React: functional only, named exports untuk utils

### Jangan Pernah
- Hardcode credentials, JWT secret, encryption key, atau URL API di source code
- Ubah formula atau threshold kredit (DSR, RPC, DSCR, bobot 5C, grading)
- Hapus atau rename tabel/kolom yang sudah ada di production
- Buat route API tanpa middleware auth
- Simpan file upload ke filesystem lokal
- Jalankan `docker-compose down -v` di environment production
- Ubah struktur response API yang sudah berjalan (breaking change untuk frontend)
- Rewrite atau restrukturisasi file yang sudah bekerja tanpa diminta
- Menambah dependency/package baru tanpa konfirmasi

## Pattern Standar

**Error handling backend:**
```javascript
const handler = async (req, res) => {
  try {
    const result = await SomeModel.doSomething();
    res.json({ success: true, message: 'Berhasil', data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message, data: null });
  }
};
```

**Route dengan auth:**
```javascript
router.get('/endpoint', authenticate, authorize(['ANALIS', 'KABID']), handler);
```

**Data fetch frontend:**
```jsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/endpoint');
      setData(res.data.data);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

## Sebelum Mulai Task Apapun
1. Baca `.ai/CONTEXT.md` untuk context sesi lengkap & task spesifik
2. Cek `.ai/MISTAKES.md` untuk error yang pernah terjadi
3. Cek `.ai/DECISIONS.md` untuk keputusan arsitektur yang dikunci
4. Minta lihat file yang ada sebelum mengedit
5. Tetap dalam scope — hanya kerjakan yang diminta secara eksplisit

## File Context Lengkap (folder `.ai/`)
- `.ai/CONTEXT.md` — Paste ini di awal setiap sesi manual (Claude.ai, ChatGPT web, dll)
- `.ai/MISTAKES.md` — Log kesalahan & anti-pattern
- `.ai/DECISIONS.md` — Keputusan arsitektur terkunci, lebih detail dari file ini
- `.ai/SESSION_LOG.md` — Riwayat sesi & progress per modul

> Catatan: file ini (`AGENTS.md`) adalah ringkasan operasional untuk agentic tools.
> Untuk detail lengkap (modul, formula turunan, status phase per fitur), lihat `.ai/CONTEXT.md`.