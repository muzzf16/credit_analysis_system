# ═══════════════════════════════════════════════════════
# 🧠 AI SESSION CONTEXT — BPR BAPERA BATANG
# Sistem Analisa Kredit — PT BPR BAPERA BATANG
# ═══════════════════════════════════════════════════════
# HOW TO USE:
# 1. Paste file ini di awal SETIAP sesi AI baru
# 2. Tambahkan kode yang relevan di bawah garis pemisah
# 3. Tulis task spesifik di bagian paling bawah
# ═══════════════════════════════════════════════════════

## 📦 PROJECT INFO
- **App:** Sistem Analisa Kredit — PT BPR BAPERA BATANG
- **Deskripsi:** Digitalisasi proses analisa kredit konsumtif & produktif untuk BPR
- **Repo:** https://github.com/muzzf16/credit_analysis_system
- **Tipe:** Full-stack Web App (Monorepo)
- **Status:** 🔧 Phase 1 selesai, Phase 3/4/5 in progress

---

## 🛠️ TECH STACK (LOCKED)
| Layer | Pilihan | Port | Notes |
|-------|---------|------|-------|
| Frontend | React + Vite + TailwindCSS | 3000 (dev) / 80 (prod) | |
| Backend | Node.js + Express | 5000 | REST API + Swagger docs |
| Database | PostgreSQL 15 | 5432 | 23 tabel |
| Storage | MinIO | 9000 (API) / 9001 (Console) | Dokumen, foto agunan, MAK |
| Proxy | Nginx | 80 | Reverse proxy ke semua service |
| WA Gateway | Baileys (Node.js) | 3001 | Notifikasi WhatsApp |
| Container | Docker + Docker Compose | - | Wajib untuk dev & prod |

---

## 📁 STRUKTUR PROJECT
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

---

## 🗄️ DATABASE — 23 TABEL (LOCKED SCHEMA)
```
users · roles · debitur · pasangan · pekerjaan · usaha
pengajuan · survey · survey_lingkungan · survey_usaha
agunan · agunan_foto · slik · analisa_konsumtif
analisa_produktif · credit_scoring · approval · komite
mak · dokumen · notifikasi · ews · audit_logs
```
> ⚠️ Jangan tambah/hapus tabel tanpa diskusi — schema ini sudah di-migrate di production

---

## 👤 USER ROLES (LOCKED)
| Role | Akses |
|------|-------|
| ADMIN | Full access |
| DIREKSI | Dashboard, Approval final, Monitoring |
| KABID | Approval level 1, Review scoring |
| ANALIS | Analisa, Scoring, SLIK, Agunan |
| AO | Debitur, Pengajuan, Survey |
| SPI | Audit, Reports, Monitoring |

---

## 📐 FORMULA KREDIT (JANGAN DIUBAH)
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

---

## 📋 STATUS MODUL
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

---

## 🔒 LOCKED DECISIONS — JANGAN DIUBAH TANPA DISKUSI
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

---

## ❌ JANGAN DILAKUKAN — Lihat MISTAKES.md untuk detail
- ❌ Jangan hardcode credentials atau secret key di source code
- ❌ Jangan ubah formula kredit (DSR, RPC, DSCR, Scoring 5C) tanpa konfirmasi
- ❌ Jangan tambah kolom/tabel database tanpa membuat file migrasi baru
- ❌ Jangan skip middleware auth di route yang butuh proteksi
- ❌ Jangan upload file langsung ke filesystem — wajib MinIO
- ❌ Jangan ubah struktur response API yang sudah ada (bisa break frontend)
- ❌ Jangan hapus atau rename tabel yang sudah ada di production
- ❌ Jangan gunakan `localhost` untuk URL service yang berjalan di host — dari container harus pakai `172.22.0.1` atau `host.docker.internal`
- ❌ Setelah `docker cp` file ke container, wajib `docker restart` sebelum test — Node.js cache module lama di RAM

---

## 🔧 TASK SESI INI
> Isi bagian ini sebelum mulai setiap sesi

- **Task saat ini:** Selesai memperbaiki OCR/VLM Halusinasi KTP & Upload Size Limits. Menunggu instruksi untuk mulai modul EWS (Early Warning System - Phase 5) atau Laporan.
- **File kunci yang sudah diubah sesi sebelumnya:**
  - `backend/src/services/document-ai/document-ai.service.js` — Menghapus prompt KTP contoh negatif.
  - `frontend/src/pages/debitur/DebiturFormPage.jsx` — Sinkronisasi field UI KTP sesuai asli.
  - `nginx/nginx.conf` & `backend/src/middleware/upload.js` — Naikkan limit upload ke 50MB.

---

## 🤖 PERANMU DALAM SESI INI
Kamu melanjutkan project yang **sudah berjalan di production**.
Ikuti aturan berikut dengan ketat:

1. **Baca dulu sebelum nulis** — minta lihat kode yang ada sebelum modifikasi
2. **Tetap dalam scope** — hanya kerjakan task yang diminta
3. **Tanya dulu sebelum memutuskan** — kalau ada "cara lebih baik", usulkan dulu
4. **Tidak ada kejutan** — jangan rename, restruktur, atau refactor tanpa persetujuan
5. **Hormati formula kredit** — ini domain bisnis perbankan, jangan diubah sembarangan
6. **Akhiri dengan summary** — update SESSION_LOG.md dan MISTAKES.md saat selesai

---

## 📋 TEMPEL KODE RELEVAN DI BAWAH GARIS INI
```
[Tempel file yang ingin dikerjakan di sini]
```

---

## 🎯 TASK HARI INI
```
Melanjutkan pengembangan Phase 5 (Early Warning System) atau fitur Laporan berdasarkan instruksi terbaru pengguna.
```
