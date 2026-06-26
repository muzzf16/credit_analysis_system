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

- [ ] Laporan (modul 12): format export apa? (PDF / Excel / keduanya?)
- [ ] EWS (modul 11): trigger alert via WA Gateway atau email juga?
- [ ] Backup database: strategy backup otomatis PostgreSQL?
- [ ] Deployment: domain & SSL certificate untuk production?

---

## ════════════════════════════
## KEPUTUSAN TERKUNCI (PHASE 5: POLICY & DECISION)
## (Jangan diubah tanpa persetujuan user)
## ════════════════════════════

**A. Policy Platform**
1. **Policy Platform !== Config**: Policy adalah domain bisnis dengan state machine lifecycle dan diregister di Policy Registry independen.
2. **Capability-Driven Policy**: Metadata policy pack memiliki kapabilitas `products`, `segments`, `channels`, dll untuk context resolution.
3. **Registry vs Resolver**: Registry mengelola CRUD & lifecycle. Resolver mencari policy berdasarkan *context object*.
4. **Enhanced Fingerprint**: Fingerprint = `SHA256(schema + policy + rules version)`.

**B. Rule Library & Formula Engine**
5. **Rule Library Bounded Context**: Rule Library bukan sekadar folder, melainkan modul penuh (`modules/rules/library`) dengan registry, resolver, contract, validator.
6. **Rule As Object**: Rule bukan function biasa (`calculateDSR()`), melainkan object dengan `metadata()` dan `execute(context)` yang menghasilkan `RuleResult`.
7. **Rule Metadata**: Setiap rule wajib memiliki metadata (`code`, `category`, `version`, `severity`, `outputs`) yang bisa dibaca tanpa eksekusi.
8. **Rich RuleResult**: Output rule berstruktur `{code, passed, metrics, reasonCodes}`, bukan boolean `true/false`.
9. **Standard Execution Context**: Semua rule menerima param yang sama: `execute({ assessment, policy, facts })`. Jangan ada rule dengan param berbeda.
10. **Rule Independence**: Rule dilarang memanggil rule lain. Pipeline yang mengatur urutan eksekusi.
11. **Formula Engine**: Perhitungan matematis (rumus) dipisah ke *Formula Engine*. Rule memanggil *Formula Engine*, bukan menghitung sendiri.

**C. Business Capability, Projection, Intent & Policy Governance**
12. **Pipeline Plan**: Urutan eksekusi *Stage* didefinisikan secara deklaratif di **Pipeline Plan**.
13. **Pipeline Engine**: Pipeline Engine agnostic terhadap daftar Stage. Ia HANYA melooping `PipelinePlan.stages`.
14. **PipelineResult**: Pipeline mengeksekusi Stage secara berurutan dan mengeluarkan `PipelineResult`.
15. **Facts Platform (Canonical Language)**: `PipelineResult` diekstrak menjadi **Business Facts** oleh **Facts Extractor**. Seluruh platform HANYA berbicara menggunakan bahasa kanonik *FactCollection*.
16. **Fact Definition**: Setiap Fact dibatasi secara ketat oleh **Fact Definition** (Single Source of Truth).
17. **Capability Platform**: *FactCollection* diabstraksi menjadi **Business Capability** (misal: `Financial Capability: READY`) oleh *Capability Evaluator*.
18. **DecisionFacts Projection**: *CapabilityCollection* di-mapping menjadi status kriteria persetujuan (`financialEligible=true`) oleh *DecisionFacts Projector*. Sebagai Read Model, tidak ada komputasi logika bisnis di sini.
19. **DecisionIntent Platform**: Sistem mengonversi `DecisionFacts` menjadi agregat *Intent* (rekomendasi, risiko, kondisi). Sistem tidak pernah membuat keputusan akhir secara otoritatif.
20. **Decision Policy Platform (Governance)**: Menyediakan aturan *Authority Matrix*, *Escalation*, *Override*, dan *Committee Rules*. *Decision Policy* dipadukan dengan *Intent* oleh *Decision Builder* untuk mencetak *Decision* akhir.
21. **AI Boundaries**: AI hanya boleh membaca `AssessmentContext`, `CapabilityCollection`, `DecisionFacts`, `DecisionIntent`, `DecisionPolicy` dan `Decision` akhir (Facts Before AI).

**D. Stage Engine, Profiles & Execution Hierarchy**
22. **Execution Hierarchy Resmi**: Architecture mengikuti batas akhir sistem: `Policy → Pipeline Plan → Stage Profile → Stage → Rule → Formula`. (Disusul oleh `Pipeline Engine → PipelineResult → Facts Platform → Capability Platform → DecisionFacts Projection → DecisionIntent Platform → Decision Policy Platform → Decision Builder → Decision → Committee Workflow → Decision Audit → AI Credit Analyst`).
19. **Stage As Orchestrator**: Stage memiliki lifecycle lengkap dan mengembalikan `StageResult`.
20. **Layer Isolation**: Stage HANYA mengenal Rule. Pipeline HANYA mengenal Stage. FactsBuilder HANYA mengenal Extractor.
21. **Stage Registry & Resolver**: Stage diregistrasi dan dicari via `StageResolver.resolve(code)`.
22. **Profiles Bounded Context**: `Stage Profile` adalah Entity *immutable* (Bounded Context).
23. **Execution Context**: Kontrak eksekusi berstandar: `execute({ assessment, stageProfile, execution })`.
24. **Configuration Fingerprinting**: Semua artefak konfigurasi (Policy, Pipeline Plan, Stage Profile, **Fact Definition**) wajib dihitung *Fingerprint* (SHA-256) saat diregistrasi untuk reproduksibilitas audit.
25. **Traceable PipelineResult**: Mengunci sekumpulan fingerprint (`policy`, `pipeline`, `profiles[]`).
26. **No Direct Decision**: Stage dan Pipeline hanya menghasilkan fakta/result eksekusi. Keputusan kredit hanya dibuat di `Decision Builder`.
