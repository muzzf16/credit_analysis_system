# PROJECT_CONSTITUTION.md

# AI Credit Operating System - PT BPR BAPERA BATANG
## Single Source of Truth

### Purpose
Dokumen ini adalah **Single Source of Truth** untuk seluruh proses pengembangan Credit Analysis System.
Seluruh AI Assistant, developer, dan kontributor WAJIB mengikuti spesifikasi ini.
Jika terdapat konflik antara implementasi dengan dokumen ini, maka dokumen ini yang menjadi acuan utama.

### Vision
Project ini bukan sekadar aplikasi analisa kredit.
Project ini adalah **AI Credit Operating System** yang mengelola seluruh siklus kredit PT BPR BAPERA.

### Core Principles

#### Principle 1: Rule Engine adalah sumber keputusan.
AI tidak pernah menentukan approve atau reject.

#### Principle 2: Semua kebijakan bisnis harus berupa konfigurasi.
Tidak boleh hardcode pada source code.

#### Principle 3: Semua keputusan harus explainable.
Tidak boleh black box.

#### Principle 4: Semua aktivitas harus memiliki audit trail.

#### Principle 5: Seluruh perubahan policy harus memiliki versioning.

### Product Scope
Platform mendukung:
- Kredit Produktif
- Kredit Konsumtif
- Kredit Modal Kerja
- Kredit Investasi
- Kredit Multiguna
- Kredit Pensiun
Setiap produk memiliki Policy Pack masing-masing.

### System Architecture
Platform menggunakan arsitektur microservice dengan layanan-layanan berikut:
- auth-service
- customer-service
- survey-service
- ocr-service
- document-service
- financial-service
- rule-engine-service
- policy-service
- scoring-service
- ai-analyst-service
- workflow-service
- committee-service
- disbursement-service
- monitoring-service
- ews-service
- knowledge-service
- notification-service
- audit-service
- report-service
- dashboard-service

### Technology Stack
**Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL
**Frontend**: React, Vite, TailwindCSS
**Database**: PostgreSQL 15
**Storage**: MinIO
**Authentication**: JWT
**Authorization**: RBAC
**API**: REST, OpenAPI, Swagger
**AI**: GLM OCR, LLM, RAG, Local AI Support

### AI Response Standard
Setiap AI Assistant yang membantu project ini WAJIB memberikan output dalam urutan berikut:
1. Business Analysis
2. Functional Requirement
3. Non Functional Requirement
4. Architecture Review
5. Database Design
6. API Design
7. Folder Structure
8. Implementation Plan
9. Source Code
10. Testing
11. Documentation
12. Future Enhancement

Tidak boleh langsung menghasilkan kode tanpa penjelasan.

### Definition of Done
Sebuah modul dianggap selesai jika memiliki:
- Business Analysis
- Business Flow
- Use Case
- ERD
- Database Schema
- API Specification
- Source Code
- Unit Test
- Integration Test
- Documentation
- Security Review
- Performance Review

### Project Goal
Target akhir project ini adalah membangun AI Credit Operating System yang:
- scalable
- explainable
- auditable
- configurable
- AI assisted
- OJK compliant
- mudah dikembangkan
- mudah dipelihara
- menjadi platform utama proses kredit PT BPR BAPERA.

### Key Slogans
**"Configuration over Hardcode."**
**"Rule Engine is the Source of Truth."**
**"AI Assists. Rule Engine Decides."**
**"Every Decision Must Be Explainable."**

---
*Document ini adalah bagian dari Living Specification untuk Sistem Analisa Kredit PT BPR BAPERA BATANG. 
Diperbarui terakhir: 2026-06-27*