# 🔒 KEPUTUSAN ARSITEKTUR — BPR BAPERA BATANG
# ═══════════════════════════════════════════════════════
# PURPOSE: Catat setiap keputusan teknis yang sudah dibuat
#          agar model AI tidak menyarankan untuk mengubahnya.
#
# STATUS:
# 🔒 LOCKED     — Sudah dipakai di production, jangan diubah
# 🔧 TENTATIVE  — Sudah diputuskan tapi belum fully tested
# 🔄 REVISABLE  — Bisa diubah jika ada alasan kuat
# ❌ DITOLAK    — Sudah dicoba dan diabaikan (simpan sebagai sejarah)
# ═══════════════════════════════════════════════════════

---

## ════════════════════════════
## KEPUTUSAN STACK
## ════════════════════════════

| Area | Keputusan | Status | Alasan |
|------|-----------|--------|--------|
| Frontend framework | React 18 + Vite | 🔒 LOCKED | Fast HMR, modern, sudah running |
| Styling | TailwindCSS v3 | 🔒 LOCKED | Sudah dipakai di seluruh UI |
| Backend runtime | Node.js + Express | 🔒 LOCKED | Sudah di production |
| Database | PostgreSQL 15 | 🔒 LOCKED | 23 tabel sudah di-migrate |
| Object storage | MinIO | 🔒 LOCKED | Dokumen & foto agunan sudah di sana |
| Proxy | Nginx | 🔒 LOCKED | Routing semua service lewat port 80 |
| Containerization | Docker + Compose | 🔒 LOCKED | Dev & production pakai Docker |
| WA Notifikasi | Baileys (Node.js) | 🔒 LOCKED | Sudah terintegrasi port 3001 |

---

## ════════════════════════════
## KEPUTUSAN SECURITY
## ════════════════════════════

| Area | Keputusan | Status | Alasan |
|------|-----------|--------|--------|
| Auth | JWT (8h access + 7d refresh) | 🔒 LOCKED | Sudah diimplementasi |
| Data sensitif NIK | Enkripsi dengan ENCRYPTION_KEY | 🔒 LOCKED | Compliance data nasabah |
| Password default | Wajib ganti setelah deploy pertama | 🔒 LOCKED | Security best practice |
| Environment secrets | Selalu di `.env`, tidak di code | 🔒 LOCKED | Tidak ada hardcoded secrets |
| Route protection | Middleware auth + role di semua route | 🔒 LOCKED | RBAC 6 role |

---

## ════════════════════════════
## KEPUTUSAN BISNIS / DOMAIN
## (PALING KRITIS — JANGAN DIUBAH)
## ════════════════════════════

| Area | Keputusan | Status | Alasan |
|------|-----------|--------|--------|
| DSR maximum | 40% | 🔒 LOCKED | Kebijakan kredit BPR |
| RPC minimum | 110% | 🔒 LOCKED | Kebijakan kredit BPR |
| DSCR minimum | 1.2 | 🔒 LOCKED | Kebijakan kredit produktif BPR |
| Scoring Character | 25% | 🔒 LOCKED | Standar 5C BPR |
| Scoring Capacity | 30% | 🔒 LOCKED | Standar 5C BPR |
| Scoring Capital | 15% | 🔒 LOCKED | Standar 5C BPR |
| Scoring Collateral | 20% | 🔒 LOCKED | Standar 5C BPR |
| Scoring Condition | 10% | 🔒 LOCKED | Standar 5C BPR |
| Grade A | 90–100 | 🔒 LOCKED | Standar grading BPR |
| Grade B | 80–89 | 🔒 LOCKED | Standar grading BPR |
| Grade C | 70–79 | 🔒 LOCKED | Standar grading BPR |
| Grade D | 60–69 | 🔒 LOCKED | Standar grading BPR |
| Grade E | < 60 | 🔒 LOCKED | Standar grading BPR |

---

## ════════════════════════════
## KEPUTUSAN ARSITEKTUR CODE
## ════════════════════════════

| Area | Keputusan | Status | Alasan |
|------|-----------|--------|--------|
| API response format | `{ success, message, data }` | 🔒 LOCKED | Sudah dipakai di semua endpoint |
| Async pattern | async/await + try/catch | 🔒 LOCKED | Konsistensi kode |
| File upload | MinIO only, tidak ke filesystem | 🔒 LOCKED | Persistent storage di Docker |
| Audit trail | Semua operasi penting → audit_logs | 🔒 LOCKED | Compliance & tracing |
| Schema change | Wajib lewat file migrasi | 🔒 LOCKED | Reproducible di semua env |
| Role-based access | 6 role ketat (ADMIN dst) | 🔒 LOCKED | Sudah didefinisikan |

---

## ════════════════════════════
## KEPUTUSAN PER PHASE
## ════════════════════════════

| Phase | Scope | Status |
|-------|-------|--------|
| Phase 1 | Core modules (01–08, 10, 12 basic) | ✅ Selesai |
| Phase 2 | [TBD] | ⬜ Belum mulai |
| Phase 3 | MAK Generator (modul 09) | 🔄 In Progress |
| Phase 4 | AI Credit Analyst (modul 13) | ⬜ Belum mulai |
| Phase 5 | EWS (modul 11) | ⬜ Belum mulai |

---

## ════════════════════════════
## PENDEKATAN YANG DITOLAK
## (Jangan disarankan lagi)
## ════════════════════════════

| Pendekatan | Alasan Ditolak |
|------------|----------------|
| MySQL / MariaDB | Sudah pakai PostgreSQL 15 di production |
| MongoDB | Tidak cocok untuk data relasional kredit |
| File upload ke local disk | Tidak persistent di Docker container |
| Redux untuk state management | Overkill, sudah pakai React state/context |
| Manual SQL tanpa migrasi | Tidak reproducible, berbahaya di production |
| Hardcode threshold kredit | Harus sesuai kebijakan bisnis, bukan asumsi developer |

---

## ════════════════════════════
## KEPUTUSAN TERBUKA
## (Belum diputuskan)
## ════════════════════════════

- [ ] Phase 4 — AI Credit Analyst: model AI mana yang akan dipakai?
- [ ] Laporan (modul 12): format export apa? (PDF / Excel / keduanya?)
- [ ] EWS (modul 11): trigger alert via WA Gateway atau email juga?
- [ ] Backup database: strategy backup otomatis PostgreSQL?
- [ ] Deployment: domain & SSL certificate untuk production?
