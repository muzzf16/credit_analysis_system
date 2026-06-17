# BPR BAPERA BATANG — Sistem Analisa Kredit

Sistem digitalisasi proses analisa kredit konsumtif & produktif untuk **PT BPR BAPERA BATANG**.

## 🏗️ Arsitektur

```
Frontend  : React + Vite + TailwindCSS (Port 3000)
Backend   : Node.js + Express (Port 5000)
Database  : PostgreSQL 15 (Port 5432)
Storage   : MinIO (Port 9000 / Console 9001)
Proxy     : Nginx (Port 80)
```

## 📋 Modul Sistem

| # | Modul | Status |
|---|---|---|
| 01 | Master Data | ✅ Phase 1 |
| 02 | Data Debitur | ✅ Phase 1 |
| 03 | Pengajuan Kredit | ✅ Phase 1 |
| 04 | Survey AO | ✅ Phase 1 |
| 05 | Analisa Kredit | ✅ Phase 1 |
| 06 | Scoring Engine (5C) | ✅ Phase 1 |
| 07 | Agunan | ✅ Phase 1 |
| 08 | Workflow Approval | ✅ Phase 1 |
| 09 | MAK Generator | 🔄 Phase 3 |
| 10 | Dashboard Kredit | ✅ Phase 1 |
| 11 | EWS | 🔄 Phase 5 |
| 12 | Laporan | ✅ Phase 1 (basic) |
| 13 | AI Credit Analyst | 🔄 Phase 4 |

## 🚀 Quick Start (Development)

### Prerequisites
- Docker Desktop
- Node.js 20+
- Git

### 1. Clone & Setup
```bash
git clone <repo>
cd Analisakredit
cp .env.example .env
# Edit .env sesuai kebutuhan
```

### 2. Jalankan dengan Docker
```bash
docker-compose up -d
```

### 3. Akses Aplikasi
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:5000
- **MinIO Console**: http://localhost:9001
- **Docs API**: http://localhost:5000/api/docs

### Default Login
```
Username : admin
Password : Admin@123
```

## 🗄️ Database

### Migrasi Manual
```bash
cd backend
npm run migrate
npm run seed
```

### Database Entities (23 tables)
`users` · `roles` · `debitur` · `pasangan` · `pekerjaan` · `usaha` · `pengajuan` · `survey` · `survey_lingkungan` · `survey_usaha` · `agunan` · `agunan_foto` · `slik` · `analisa_konsumtif` · `analisa_produktif` · `credit_scoring` · `approval` · `komite` · `mak` · `dokumen` · `notifikasi` · `ews` · `audit_logs`

## 👤 User Roles

| Role | Akses |
|---|---|
| **ADMIN** | Full access |
| **DIREKSI** | Dashboard, Approval final, Monitoring |
| **KABID** | Approval level 1, Review scoring |
| **ANALIS** | Analisa, Scoring, SLIK, Agunan |
| **AO** | Debitur, Pengajuan, Survey |
| **SPI** | Audit, Reports, Monitoring |

## 📐 Formulas Kredit

### Konsumtif
```
Disposable Income = Total Penghasilan - Total Pengeluaran
DSR = (Total Cicilan / Total Penghasilan) × 100  → Max 40%
RPC = (Disposable Income / Angsuran) × 100        → Min 110%
```

### Produktif
```
GPM = (Laba Kotor / Omset) × 100
NPM = (Laba Bersih / Omset) × 100
DSCR = Laba Bersih / Total Kewajiban              → Min 1.2
```

### Credit Scoring (5C)
```
Character  25% | Capacity 30% | Capital 15%
Collateral 20% | Condition 10%

Grade: A=90-100 | B=80-89 | C=70-79 | D=60-69 | E=<60
```

## 🔧 Development

```bash
# Backend dev
cd backend
npm install
npm run dev

# Frontend dev
cd frontend
npm install
npm run dev
```

## 📁 Project Structure
```
Analisakredit/
├── backend/          # Node.js + Express API
├── frontend/         # React + Vite + Tailwind
├── nginx/            # Reverse proxy config
├── docker-compose.yml
└── .env
```

## 📞 Support
PT BPR BAPERA BATANG — IT Division
