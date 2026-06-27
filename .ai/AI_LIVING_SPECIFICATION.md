# AI_LIVING_SPECIFICATION.md

# AI Credit Operating System

## Living Specification

### PT BPR BAPERA BATANG

**Version:** 1.0.0
**Status:** Active
**Owner:** PT BPR BAPERA BATANG
**Last Updated:** 2026-06-27

---

# PROJECT CONSTITUTION

## Purpose

Dokumen ini adalah **Single Source of Truth** untuk seluruh proses pengembangan Credit Analysis System.

Seluruh AI Assistant (ChatGPT, Codex, Claude Code, Cursor, Gemini CLI, GitHub Copilot, dsb), developer, dan kontributor WAJIB mengikuti spesifikasi ini.

Jika terdapat konflik antara implementasi dengan dokumen ini, maka dokumen ini yang menjadi acuan utama.

---

# PROJECT VISION

Project ini bukan sekadar aplikasi analisa kredit.

Project ini adalah **AI Credit Operating System** yang mengelola seluruh siklus kredit PT BPR BAPERA.

```
Prospek Debitur
        │
        ▼
Survey Lapangan
        │
        ▼
OCR Dokumen
        │
        ▼
Document Intelligence
        │
        ▼
Financial Analysis
        │
        ▼
Rule Engine
        │
        ▼
Policy Engine
        │
        ▼
AI Credit Analyst
        │
        ▼
Memorandum Analisa Kredit
        │
        ▼
Workflow Persetujuan
        │
        ▼
Komite Kredit
        │
        ▼
Approval
        │
        ▼
Akad Kredit
        │
        ▼
Pencairan
        │
        ▼
Monitoring Kredit
        │
        ▼
Early Warning System
        │
        ▼
Portfolio Monitoring
```

---

# PROJECT OBJECTIVES

Platform harus mampu:

* mempercepat proses analisa kredit
* meningkatkan kualitas keputusan kredit
* menjaga konsistensi SOP
* mengurangi human error
* meningkatkan produktivitas analis
* menyediakan audit trail lengkap
* mendukung kepatuhan OJK
* menjadi knowledge center kredit perusahaan

---

# CORE PRINCIPLES

## Principle 1

Rule Engine adalah sumber keputusan.

AI tidak pernah menentukan approve atau reject.

---

## Principle 2

Semua kebijakan bisnis harus berupa konfigurasi.

Tidak boleh hardcode pada source code.

---

## Principle 3

Semua keputusan harus explainable.

Tidak boleh black box.

---

## Principle 4

Semua aktivitas harus memiliki audit trail.

---

## Principle 5

Seluruh perubahan policy harus memiliki versioning.

---

# PRODUCT SCOPE

Platform mendukung:

* Kredit Produktif
* Kredit Konsumtif
* Kredit Modal Kerja
* Kredit Investasi
* Kredit Multiguna
* Kredit Pensiun

Setiap produk memiliki Policy Pack masing-masing.

---

# BUSINESS DOMAINS

* Customer Management
* Survey Management
* Document Intelligence
* OCR
* Financial Analysis
* Rule Management
* Policy Management
* Decision Engine
* AI Credit Analyst
* Workflow Management
* Committee Management
* Disbursement
* Monitoring
* Early Warning System
* Knowledge Management
* Reporting
* Dashboard

---

# SYSTEM ARCHITECTURE

Platform menggunakan arsitektur microservice.

```
auth-service

customer-service

survey-service

ocr-service

document-service

financial-service

rule-engine-service

policy-service

scoring-service

ai-analyst-service

workflow-service

committee-service

disbursement-service

monitoring-service

ews-service

knowledge-service

notification-service

audit-service

report-service

dashboard-service
```

---

# TECHNOLOGY STACK

Backend

* Node.js
* Express
* TypeScript

Frontend

* React
* Vite
* Material UI

Database

* PostgreSQL

ORM

* Prisma

Authentication

* JWT

Authorization

* RBAC

API

* REST
* OpenAPI
* Swagger

AI

* GLM OCR
* LLM
* RAG
* Local AI Support

---

# RULE ENGINE

Semua keputusan kredit berasal dari Rule Engine.

Rule harus disimpan sebagai data.

Setiap Rule memiliki:

* Rule ID
* Rule Name
* Category
* Product
* Severity
* Priority
* Expression
* Operator
* Threshold
* Recommendation
* Explanation
* Version
* Effective Date
* Expired Date
* Status

Rule Engine wajib mendukung:

* AND
* OR
* Nested Rule
* Formula
* Custom Function
* Versioning
* Audit Trail
* Rule Simulation
* What-if Analysis
* Conflict Detection
* Rule Explanation

---

# POLICY ENGINE

Policy adalah kumpulan Rule.

Contoh:

Policy Kredit Produktif

* RULE001
* RULE005
* RULE010
* RULE022

Policy Kredit Konsumtif

* RULE001
* RULE003
* RULE011

Tidak boleh ada hardcode policy.

---

# AI CREDIT ANALYST

AI hanya bertugas membantu analis.

AI wajib menghasilkan:

* Executive Summary
* Analisa Usaha
* Analisa Keuangan
* Analisa Cash Flow
* Analisa Modal Kerja
* Analisa 5C
* Analisa SWOT
* Analisa Risiko
* Mitigasi Risiko
* Rekomendasi
* Kesimpulan

AI tidak boleh:

* approve kredit
* reject kredit
* mengubah Rule Engine

---

# MEMORANDUM ANALISA KREDIT

Generate otomatis dokumen lengkap.

Minimal berisi:

* Identitas Debitur
* Profil Usaha
* Survey
* Legalitas
* Agunan
* SLIK
* Omzet
* HPP
* Laba
* Cash Flow
* Working Capital
* DSR
* LTV
* 5C
* SWOT
* Risiko
* Mitigasi
* Kesimpulan
* Lampiran

---

# KNOWLEDGE SERVICE

Knowledge berasal dari:

* SOP Internal
* Kebijakan Kredit
* Peraturan Direksi
* POJK
* SEOJK
* OJK
* Manual Kredit
* Panduan AO
* Panduan Analis

Semua jawaban AI harus menyebutkan sumber knowledge.

---

# WORKFLOW ENGINE

Workflow configurable.

```
AO

↓

Supervisor

↓

Analis

↓

Komite

↓

Direktur

↓

Akad

↓

Pencairan

↓

Monitoring
```

Workflow tidak boleh hardcode.

Setiap workflow memiliki:

* SLA
* Approval
* Reject
* Revision
* Escalation
* Notification
* Audit Trail

---

# EARLY WARNING SYSTEM

Monitoring:

* DPD
* Overdue
* Cash Flow
* Omzet
* Mutasi Rekening
* Agunan
* SLIK
* Kunjungan AO
* Restrukturisasi
* Watchlist
* Risk Score

---

# EXPLAINABLE AI

Semua rekomendasi AI wajib menampilkan:

* Rule yang aktif
* Policy yang dipakai
* Data yang digunakan
* Confidence
* Alasan
* Risiko
* Mitigasi

Tidak boleh menghasilkan keputusan tanpa alasan.

---

# SECURITY

Wajib mengikuti:

* OWASP Top 10
* JWT Authentication
* RBAC
* Least Privilege
* Encryption
* Audit Log
* Backup
* Disaster Recovery

---

# DEVELOPMENT STANDARD

Gunakan:

* Clean Architecture
* SOLID
* DDD
* Repository Pattern
* DTO
* Validation
* Unit Test
* Integration Test

Tidak boleh:

* Hardcode Business Rule
* Duplicate Code
* SQL Injection
* Magic Number

---

# CODING PRINCIPLES

Setiap implementasi WAJIB melalui tahapan berikut:

1. Analisis kebutuhan bisnis
2. Analisis dampak
3. Desain database
4. Desain API
5. Desain UI
6. Desain testing
7. Implementasi
8. Dokumentasi

AI tidak boleh langsung menghasilkan kode tanpa melakukan analisis.

---

# DEFINITION OF DONE

Sebuah modul dianggap selesai jika memiliki:

* Business Analysis
* Business Flow
* Use Case
* ERD
* Database Schema
* API Specification
* Source Code
* Unit Test
* Integration Test
* Documentation
* Security Review
* Performance Review

---

# AI RESPONSE STANDARD

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

---

# LONG TERM ROADMAP

Phase 1

Foundation

Phase 2

OCR Intelligence

Phase 3

Financial Analysis

Phase 4

Rule Library

Phase 5

Policy Engine

Phase 6

Decision Engine

Phase 7

AI Credit Analyst

Phase 8

Workflow Engine

Phase 9

Committee System

Phase 10

Disbursement

Phase 11

Early Warning System

Phase 12

Risk Dashboard

Phase 13

Portfolio Analytics

Phase 14

Predictive AI

---

# PROJECT GOAL

Target akhir project ini adalah membangun AI Credit Operating System yang:

* scalable
* explainable
* auditable
* configurable
* AI assisted
* OJK compliant
* mudah dikembangkan
* mudah dipelihara
* menjadi platform utama proses kredit PT BPR BAPERA.

---

**"Configuration over Hardcode."**

**"Rule Engine is the Source of Truth."**

**"AI Assists. Rule Engine Decides."**

**"Every Decision Must Be Explainable."**
