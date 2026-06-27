# PROJECT_CONTEXT.md

## Project Name
Credit Analysis System - PT BPR BAPERA BATANG

## Organization
PT BPR BAPERA BATANG

## Business Goal
Digitalisasi proses analisa kredit konsumtif & produktif untuk BPR

## Current Status
- Phase 1: Master Data, Data Debitur, Pengajuan Kredit, Survey AO, Analisa Kredit, Scoring Engine (5C), Agunan, Workflow Approval, Dashboard Kredit - SELESAI
- Phase 3: Document AI (VLM) - PRODUCTION READY
- Phase 4: AI Credit Analyst - BELUM MULAI
- Phase 5: Early Warning System (EWS) - BELUM MULAI
- Phase 6: MAK Generator - IN PROGRESS
- Phase 7: Policy Engine - PLANNING
- Phase 8: Decision Engine - PLANNING
- Phase 9: Committee System - PLANNING
- Phase 10: Disbursement - PLANNING
- Phase 11: Portfolio Analytics - PLANNING
- Phase 12: Predictive AI - PLANNING
- Phase 13: Risk Dashboard - PLANNING
- Phase 14: Laporan - BASIC ONLY (Phase 1)

## Priority Saat Ini
1. Rule Library (Sprint 6.3: Prompt Definitions & Builder)
2. LLM Adapters (Sprint 6.4)
3. Narrative Engine (Sprint 6.5)
4. MAK Builder (Sprint 6.6)

## Rantai Resmi (Official Chain)
`AssessmentContext → DecisionIntent → DecisionPolicy → DecisionKernel → AnalysisPackage → PromptContext → LLM → Narrative → MAK`

## Teknologi Stack (LOCKED)
- Frontend: React + Vite + TailwindCSS (Port 3000 dev / 80 prod)
- Backend: Node.js + Express (Port 5000) - REST API + Swagger docs
- Database: PostgreSQL 15 (Port 5432) - 23 tabel
- Storage: MinIO (9000 API / 9001 Console) - Dokumen, foto agunan, MAK
- Proxy: Nginx (Port 80) - Reverse proxy ke semua service
- WA Gateway: Baileys (Node.js) (Port 3001) - Notifikasi WhatsApp
- Container: Docker + Docker Compose - Wajib untuk dev & prod
- AI: GLM OCR, LLM, RAG, Local AI Support

## Struktur Proyek
```
Analisakredit/
├── frontend/         ← React + Vite + Tailwind (semua UI di sini)
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── utils/
├── backend/          ← Node.js + Express API
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   └── migrations/
├── nginx/            ← Konfigurasi reverse proxy
├── docker-compose.yml
└── .env
```

## Database — 23 TABEL (LOCKED SCHEMA)
```
users · roles · debitur · pasangan · pekerjaan · usaha
pengajuan · survey · survey_lingkungan · survey_usaha
agunan · agunan_foto · slik · analisa_konsumtif
analisa_produktif · credit_scoring · approval · komite
mak · dokumen · notifikasi · ews · audit_logs
```
> ⚠️ Jangan tambah/hapus tabel tanpa diskusi — schema ini sudah di-migrate di production

## User Roles (LOCKED)
| Role | Akses |
|------|-------|
| ADMIN | Full access |
| DIREKSI | Dashboard, Approval final, Monitoring |
| KABID | Approval level 1, Review scoring |
| ANALIS | Analisa, Scoring, SLIK, Agunan |
| AO | Debitur, Pengajuan, Survey |
| SPI | Audit, Reports, Monitoring |

## Formula Kredit (JANGAN DIUBAH)
### Konsumtif
```
Disposable Income = Total Penghasilan - Total Pengeluaran
DSR  = (Total Cicilan / Total Penghasilan) × 100   → Maks 40%
RPC  = (Disposable Income / Angsuran) × 100         → Min 110%
```
### Produktif
```
GPM  = (Laba Kotor / Omset) × 100
NPM  = (Laba Bersih / Omset) × 100
DSCR = Laba Bersih / Total Kewajiban                → Min 1.2
```
### Credit Scoring 5C
```
Character 25% | Capacity 30% | Capital 15% | Collateral 20% | Condition 10%
Grade: A=90-100 | B=80-89 | C=70-79 | D=60-69 | E=<60
```

## Status Modul
| # | Modul | Status | Phase |
|---|-------|--------|-------|
| 01 | Master Data | ✅ Selesai | Phase 1 |
| 02 | Data Debitur | ✅ Selesai | Phase 1 |
| 03 | Pengajuan Kredit | ✅ Selesai | Phase 1 |
| 04 | Survey AO | ✅ Selesai | Phase 1 |
| 05 | Analisa Kredit | ✅ Selesai | Phase 1 |
| 06 | Scoring Engine (5C) | ✅ Selesai | Phase 1 |
| 07 | Agunan | ✅ Selesai | Phase 1 |
| 08 | Workflow Approval | ✅ Selesai | Phase 1 |
| 09 | MAK Generator | 🔄 In Progress | Phase 3 |
| 10 | Dashboard Kredit | ✅ Selesai | Phase 1 |
| 11 | EWS | ⬜ Belum mulai | Phase 5 |
| 12 | Laporan | 🔄 Basic only | Phase 1 |
| 13 | AI Credit Analyst | ⬜ Belum mulai | Phase 4 |
| 14 | Document AI (VLM) | ✅ Production-ready | Phase 3 |

## Keputusan yang Kunci (LOCKED) - JANGAN DIUBAH TANPA DISKUSI
- Semua API call dari frontend wajib melalui utility layer (bukan langsung fetch)
- Auth menggunakan JWT dengan expiry 8 jam, refresh 7 hari
- Data NIK dan data sensitif debitur wajib dienkripsi (ENCRYPTION_KEY)
- Upload file (dokumen, foto agunan) wajib ke MinIO — bukan local disk
- Komponen React: functional only, hooks, async/await
- Styling: TailwindCSS only — no inline styles
- Error handling: try/catch + response standar `{ success, message, data }`
- Semua perubahan data tercatat di tabel `audit_logs`
- **VLM llama-server**: `LFM_API_URL` di `docker-compose.yml` harus pakai IP gateway docker (`172.22.0.1:1976`) — JANGAN `localhost` karena tidak bisa diakses dari dalam container
- **3 llama-server** berjalan di host: port 1976 (VLM/LFM2.5-VL), port 1977 (embedding/nomic), port 1978 (LLM/Qwen3.5)

## Jangan Dilakukan — Lihat MISTAKES.md untuk detail
- ❌ Jangan hardcode credentials atau secret key di source code
- ❌ Jangan ubah formula kredit (DSR, RPC, DSCR, Scoring 5C) tanpa konfirmasi
- ❌ Jangan tambah kolom/tabel database tanpa membuat file migrasi baru
- ❌ Jangan skip middleware auth di route yang butuh proteksi
- ❌ Jangan upload file langsung ke filesystem — wajib MinIO
- ❌ Jangan ubah struktur response API yang sudah ada (bisa break frontend)
- ❌ Jangan hapus atau rename tabel yang sudah ada di production
- ❌ Jangan gunakan `localhost` untuk URL service yang berjalan di host — dari container harus pakai `172.22.0.1` atau `host.docker.internal`
- ❌ Setelah `docker cp` file ke container, wajib `docker restart` sebelum test — Node.js cache module lama di RAM

## Task Sesi Ini
> Isi bagian ini sebelum mulai setiap sesi

- **Task saat ini:** AI Architecture v1.0 **TERKUNCI (LOCKED)**.
- **Sprint berikutnya:** 6.3 Prompt Definitions → 6.4 LLM Adapters → 6.5 Narrative → 6.6 MAK Builder.
- **STOP:** Tidak menambah bounded context arsitektur baru setelah 5.10.
- **Rantai resmi:** `AssessmentContext → DecisionIntent → DecisionPolicy → DecisionKernel → AnalysisPackage → PromptContext → LLM → Narrative → MAK`

## Peranmu Dalam Sesi Ini
Kamu melanjutkan project yang **sudah berjalan di production**.
Ikuti aturan berikut dengan ketat:

1. **Baca dulu sebelum nulis** — minta lihat kode yang ada sebelum modifikasi
2. **Tetap dalam scope** — hanya kerjakan task yang diminta
3. **Tanya dulu sebelum memutuskan** — kalau ada "cara lebih baik", usulkan dulu
4. **Tidak ada kejutan** — jangan rename, restruktur, atau refactor tanpa persetujuan
5. **Hormati formula kredit** — ini domain bisnis perbankan, jangan diubah sembarangan
6. **Akhiri dengan summary** — update SESSION_LOG.md dan MISTAKES.md saat selesai