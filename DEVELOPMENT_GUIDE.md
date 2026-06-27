# DEVELOPMENT_GUIDE.md

# Panduan Pengembangan Sistem Analisa Kredit

## Prinsip Dasar yang Wajib Diikuti

### 1. Analisis Requirement Sebelum Coding
- **WAJIB** memahami requirement bisnis sebelum menulis kode
- Dokumen requirement harus disetujui oleh pemilik produk/bisnis
- Analisis dampak (impact analysis) harus dilakukan sebelum perubahan
- Tidak boleh langsung coding tanpa pemahaman yang jelas tentang apa yang dibangun

### 2. Desain Sebelum Implementasi
- **Database Design** harus selesai sebelum kode ditulis
- **API Design** harus selesai dan dokumentasi sebelum implementasi
- **UI/UX Design** harus disetujui sebelum frontend development
- **Test Strategy** harus direncanakan sebelum implementation

### 3. Prinsip Coding yang Wajib Diikuti

#### Larangan Mutlak:
- ❌ **JANGAN** hardcode business rules atau konfigurasi di source code
- ❌ **JANGAN** membuat duplicate code - gunakan abstraksi dan reuse
- ❌ **JANGAN** SQL injection - selalu gunakan parameterized queries atau ORM
- ❌ **JANGAN** magic number - gunakan named constants atau konfigurasi
- ❌ **JANGAN** mengubah struktur database tanpa membuat migration file
- ❌ **JANGAN** mengubah API yang sudah ada tanpa dokumentasi dan versi
- ❌ **JANGAN** upload file langsung ke filesystem - WAJIB gunakan MinIO
- ❌ **JANGAN** skip middleware auth di route yang membutuhkan proteksi
- ❌ **JANGAN** menggunakan localhost untuk service yang berjalan di host dari container

#### Perintah Mutlak:
- ✅ **WAJIB** menggunakan functional React component dengan hooks
- ✅ **WAJIB** menggunakan async/await untuk operasi asynchronous
- ✅ **WAJIB** styling hanya menggunakan TailwindCSS - tidak boleh inline styles
- ✅ **WAJIB** error handling dengan pattern: try/catch + response standar `{ success, message, data }`
- ✅ **WAJIB** mencatat semua perubahan data di tabel `audit_logs`
- ✅ **WAJIB** mengikuti prinsip Configuration over Hardcode
- ✅ **WAJIB** memastikan Rule Engine adalah sumber keputusan (AI hanya membantu)
- ✅ **WAJIB** memastikan semua keputusan AI explainable (tidak boleh black box)
- ✅ **WAJIB** semua kebijakan bisnis harus dalam bentuk konfigurasi

### 4. Arsitektur dan Pola Desain yang Diperbolehkan

#### Arsitektur:
- Clean Architecture
- Domain-Driven Design (DDD)
- Microservices Architecture
- Repository Pattern
- Dependency Injection (manual atau menggunakan container sederhana)

#### Pola Desain yang Diperbolehkan:
- Singleton (untuk service yang benar-benar stateless)
- Factory (untuk pembuatan object yang kompleks)
- Strategy (untuk algoritma yang dapat ditukar)
- Observer (untuk event handling)
- Adapter (untuk integrasi dengan sistem eksternal)
- Repository (untuk abstraksi data access)
- DTO (Data Transfer Object) untuk antarmuka antara layer

#### Prinsip SOLID:
- **S**ingle Responsibility Principle: Setiap class harus memiliki satu alasan untuk berubah
- **O**pen/Closed Principle: Entitas harus terbuka untuk ekstensi, tertutup untuk modifikasi
- **L**iskov Substitution Principle: Object harus dapat digantikan dengan instance subtipenya
- **I**nterface Segregation Principle: Klien tidak harus dipaksa bergantung pada metode yang tidak mereka gunakan
- **D**ependency Inversion Principle: Bergantung pada abstraksi, bukan pada concretions

### 5. Standar Coding

#### Backend (Node.js/TypeScript):
- Gunakan ESLint dengan konfigurasi standar tim
- Gunakan Prettier untuk kode formatting
- TypeScript strict mode harus diaktifkan
- Interface sebelum implementation
- Repository pattern untuk data access
- Service layer untuk business logic
- Controller untuk handling HTTP request
- Middleware untuk cross-cutting concerns (auth, logging, validation)
- DTO untuk data transfer antara layer
- Validation menggunakan class-validator atau Joi
- Error handling dengan custom error classes

#### Frontend (React/Vite/Tailwind):
- Functional components only (no class components)
- Custom hooks untuk logika yang dapat digunakan kembali
- Custom hooks untuk data fetching
- Context API untuk state global yang tepat
- Prop drilling dihindari melalui komponen wrapper atau state management
- Custom components untuk UI yang digunakan berulang
- Tailwind utility classes untuk styling
- Responsive design sebagai default
- Aksesibilitas (a11y) dianggap sejak awal
- Error boundaries untuk penanganan error di komponen
- Suspense untuk data fetching (jika menggunakan React 18+)

### 6. Database Development Standards

#### Migrasi Database:
- Setiap perubahan database harus memiliki file migrasi
- Nama file migrasi menggunakan format timestamp_nama_migrasi.sql
- Migrasi harus dapat di-roll back dengan aman
- Data migrasi harus dipisahkan dari struktur migrasi jika diperlukan
- Testing migrasi pada staging sebelum produkcional

#### Desain Database:
- Normalisasi hingga bentuk normal yang sesuai (biasanya 3NF)
- Indeks untuk kolom yang sering digunakan dalam WHERE, JOIN, ORDER BY
- Constraint untuk integritas data (NOT NULL, UNIQUE, CHECK, FOREIGN KEY)
- Timestamps untuk audit trail (created_at, updated_at)
- Soft delete jika diperlukan (deleted_at kolom)
- Enum atau lookup table untuk nilai yang terbatas
- Partitioning untuk tabel yang sangat besar (jika diperlukan)

#### Query Guidelines:
- Selalu gunakan parameterized queries atau ORM
- Hindari SELECT * - spesifikasikan kolom yang diperlukan
- Gunakan JOIN yang sesuai (INNER, LEFT, RIGHT) berdasarkan kebutuhan bisnis
- Hindari query yang kompleks dalam loop - gunakan batch operation
- Gunakan EXPLAIN untuk menganalisis query yang kompleks
- Pertimbangkan caching untuk data yang sering diakses dan jarang berubah

### 7. API Development Standards

#### Desain API:
- RESTful principles yang konsisten
- Resource-based endpoints (GET /users, POST /users, GET /users/:id, etc.)
- HTTP status codes yang sesuai (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error)
- Consistent response format: `{ success: boolean, message?: string, data?: any, errors?: any[] }`
- Versioning menggunakan URL prefix (/api/v1/, /api/v2/, etc.)
- Documentation menggunakan OpenAPI/Swagger
- Rate limiting yang sesuai
- Input validation dan sanitization
- Authentication dan authorization yang konsisten

#### Request/Response Handling:
- Validasi input pada titik masuk (controller atau middleware)
- Sanitasi output untuk mencegah XSS
- Pagination untuk koleksi besar (limit/offset atau cursor-based)
- Filtering, sorting, dan searching capabilities
- Consistent error response format
- Meaningful error messages (technical untuk log, user-friendly untuk response)
- Timeout handling untuk operasi yang lama

### 8. Testing Standards

#### Unit Testing:
- Jest atau framework serupa untuk backend
- React Testing Library untuk frontend
- Target minimal 80% code coverage untuk business logic
- Test edge cases dan error conditions
- Mock external dependencies
- Test-driven development (TDI) disarankan untuk logika kompleks

#### Integration Testing:
- Test antar-layer dalam satu service
- Test database interactions dengan test database
- Test API endpoints dengan supertest atau serupa
- Test integrasi antar-service jika diperlukan
- Test menggunakan environment yang mirip produksi

#### End-to-End Testing:
- Cypress atau Playwright untuk testing UI
- Test critical user journey
- Test cross-browser compatibility
- Test responsive design
- Test accessibility (a11y)

#### Performance Testing:
- Load testing menggunakan k6, artillery, atau serupa
- Stress testing untuk menemukan batas sistem
- Soak testing untuk memory leak detection
- Spike testing untuk peningkatan tiba-tiba beban
- Baseline testing untuk regresi performa

### 9. Security Standards

#### Authentication:
- JWT dengan secret yang kuah dan terenkripsi
- Access token expiry: 8 jam
- Refresh token expiry: 7 hari
- Token blacklist untuk logout
- Password hashing menggunakan bcrypt dengan work factor yang cukup
- Rate limiting untuk login attempts
- Multi-factor authentication untuk role sensitif (opsional sesuai kebijakan)

#### Authorization:
- Role-Based Access Control (RBAC) yang jelas
- Permission-based akses untuk granular control
- Principle of least privilege
- Regular access review dan audit
- Separation of duties untuk fungsi kritis

#### Data Protection:
- Encryption at rest untuk data sensitif (NIK, informasi keuangan)
- Encryption in transit menggunakan TLS 1.2+
- Environment variables untuk secrets dan konfigurasi sensitif
- Secret management menggunakan HashiCorp Vault atau solusi serupa (produkshn)
- Environment-specific configuration (dev, staging, prod)
- Regular security scanning dan penetration testing

#### Input Validation dan Sanitasi:
- Validasi input pada titik masuk (whitelist approach preferred)
- Sanitasi output untuk mencegah XSS
- Parameterized queries untuk mencegah SQL injection
- Content Security Policy (CSP) headers
- File upload validation (tipe file, ukuran, konten)
- Virus scanning untuk file upload (jika diperlukan)

### 10. DevOps dan Deployment Standards

#### Containerization:
- Multi-stage Docker build untuk mengurangi image size
- Non-root user untuk menjalankan container
- Health check dalam container
- Proper signal handling untuk graceful shutdown
- Minimal base image (Alpine atau distroless jika sesuai)
- Regular security scan untuk container image

#### Configuration Management:
- Environment variables untuk konfigurasi yang bervariasi per environment
- Configuration file untuk konfigurasi statis
- Secret management untuk kredensial dan data sensitif
- Configuration validation saat startup
- Dokumentasi untuk semua konfigurasi yang diperlukan

#### Database Changes:
- Migrasi database yang dapat di-roll back
- Backup sebelum migrasi produksi
- Testing migrasi pada staging database
- Rollback plan yang teruji dan diuji
- Communication dengan stakeholder sebelum perubahan besar

#### Monitoring dan Logging:
- Structured logging dengan level yang sesuai (debug, info, warn, error)
- Audit trail untuk semua perubahan data
- Health check endpoint untuk setiap service
- Metrics collection (request rate, error rate, response time, dll)
- Alerting untuk kondisi kritis
- Log retention dan archiving policy
- Regular log review untuk deteksi anomali

#### Backup dan Disaster Recovery:
- Regular backup database dan file yang penting
- Backup recovery testing
- Geographic redundancy untuk produksi kritis
- Recovery Time Objective (RTO) dan Recovery Point Objective (RPO) yang ditetapkan
- Runbook untuk situasi darurat
- Regular disaster recovery drill

### 11. Proses Pengembangan

#### Branching Strategy:
- Main branch (master/main) untuk kode produksi yang stabil
- Develop branch untuk integrasi fitur selesai
- Feature branch untuk setiap fitur atau bug fix
- Release branch untuk persiapan rilis (jika diperlukan)
- Hotfix branch untuk perbaikan darurat produksi
- Pull Request dengan kode review yang wajib

#### Code Review:
- Setiap perubahan harus melalui code review
- Minimal satu approver dari tim yang sama
- Fokus pada: correctness, security, performance, maintainability, adherence to standards
- Otomatisasi: linting, testing, security scan sebagai bagian dari PR
- Tidak boleh merge jika ada kritis issues dari code review atau automated checks

#### Continuous Integration/Continuous Deployment (CI/CD):
- Automated testing pada setiap push ke branch
- Automated build dan testing untuk pull request
- Automated deployment ke staging setelah merge ke develop
- Manual approval untuk deployment ke produksi (atau automated dengan approval gate)
- Rollback otomatis jika health check gagal setelah deployment
- Notification untuk sukses/gagal build dan deploy

#### Release Management:
- Semantic versioning (MAJOR.MINOR.PATCH)
- Changelog untuk setiap rilis
- Release notes yang jelas dan terstruktur
- Comunicasi dengan stakeholder tentang perubahan yang diterbitkan
- Rollback plan yang teruji untuk setiap rilis
- Post-deployment verification dan smoke test

### 12. Dokumentasi yang Wajib

#### Dokumen Teknis:
- API documentation (OpenAPI/Swagger)
- Database schema documentation
- Architecture decision records (ADR)
- Setup dan installation guide
- Troubleshooting guide
- FAQ untuk developer dan support team

#### Dokumen Operasional:
- Runbook untuk operasi harian
- Procedure untuk incident response
- Backup dan recovery procedure
- Deployment procedure
- Performance tuning guide
- Security incident response plan

#### Dokumen Pengguna:
- User manual untuk setiap modul
- Training materials untuk pengguna akhir
- Quick reference guide
- FAQ untuk pengguna akhir
- Video tutorial (jika diperlukan)

### 13. Tools yang Disarankan

#### Development:
- VS Code atau IDE serupa dengan plugin yang sesuai
- Postman atau Insomnia untuk API testing
- Docker Desktop untuk lokal development
- Git untuk version control
- Node.js LTS version
- Yarn atau npm package manager

#### Testing:
- Jest untuk unit testing (backend)
- React Testing Library untuk frontend testing
- Cypress atau Playwright untuk end-to-end testing
- Supertest untuk API testing
- Jest atau Vitest untuk snapshot testing

#### Code Quality:
- ESLint dengan konfigurasi yang sesuai
- Prettier untuk kode formatting
- SonarQube atau serupa untuk code quality analysis
- Dependabot atau serupa untuk dependency vulnerability scanning
- Docker Scout atau serupa untuk container image scanning

#### Database:
- pgAdmin atau DBeaver untuk database management
- Prisma Studio untuk Prisma ORM
- Migrasi tools yang sesuai dengan pilihan ORM/querry builder

#### Project Management:
- Jira, Trello, atau serupa untuk issue tracking
- Confluence atau serupa untuk dokumentasi tim
- Slack atau serupa untuk komunikasi tim
- Zoom atau Google Meet untuk meeting virtual

### 14. Proses Pengambilan Keputusan Teknis

#### Arsitektural Decision Record (ADR):
- Setiap keputusan arsitektural signifikan harus didokumentasikan dalam ADR
- Format ADR: Konteks, Keputusan, Konsekuensi, Status
- ADR disimpan di dokumen terpisah atau di folder docs/adr/
- Review periodik untuk ADR yang mungkin sudah tidak relevan

#### Teknologi Selection:
- Evaluasi berdasarkan kriteria: kepatuhan standar, komunitas, dukungan, lisensi, biaya
- Proof of concept untuk teknologi kritis
- Kompatibilitas dengan stack yang ada
- Skill dan ketersediaan tim
- Long-term maintenance pertimbangan

#### Kerangka Waktu untuk Implementasi:
- Spike solution untuk risiko teknikal tinggi
- Prototype untuk validasi konsep
- Iteratif dan incremental development
- Definition of Done yang jelas
- Regular demo dan feedback loop

### 15. Etika dan Profesionalisme

#### Keamanan Data:
- Menjaga kerahasiaan data nasabah sesuai dengan peraturan perbankan
- Tidak menyebarkan informasi sensitif tanpa otorisasi
- Melaporkan potensi kerentanan keamanan segera
- Mengikuti prosedur incident response jika terjadi keamanan breach

#### Kualitas Kerja:
- Membuat kode yang dapat dipahami dan dipelihara oleh anggota tim lain
- Memberikan estimasi yang realistis untuk tugas
- Melaporkan kemajuan dan hambatan secara transparan
- Menerima konstruktif kritik dan feedback dari rekan kerja
- Kontinu belajar dan meningkatkan keterampilan teknis

#### Kepatuhan:
- Memahami dan mengikuti peraturan perbankan yang relevan (OJK, BI, dll)
- Memastikan solusi memenuhi standar keamanan dan privasi data
- Dokumentasi yang memenuhi persyaratan audit
- Kerja sama dengan tim compliance dan legal ketika diperlukan

## Contoh Implementasi yang Benar vs Salah

### Contoh 1: Konfigurasi vs Hardcode

**SALAH (Hardcode):**
```typescript
// service.ts
const MAX_LOAN_AMOUNT = 100000000; // 100 juta hardcoded
const INTEREST_RATE = 0.12; // 12% hardcoded

function calculateLoan(principal: number, term: number): number {
  if (principal > MAX_LOAN_AMOUNT) {
    throw new Error('Loan amount exceeds limit');
  }
  return principal * (1 + INTEREST_RATE * term);
}
```

**BENAR (Konfigurasi):**
```typescript
// config.ts
export const loanConfig = {
  maxLoanAmount: Number(process.env.MAX_LOAN_AMOUNT || '100000000'),
  interestRate: parseFloat(process.env.INTEREST_RATE || '0.12')
};

// service.ts
import { loanConfig } from './config';

function calculateLoan(principal: number, term: number, config = loanConfig): number {
  if (principal > config.maxLoanAmount) {
    throw new Error('Loan amount exceeds limit');
  }
  return principal * (1 + config.interestRate * term);
}
```

### Contoh 2: Error Handling

**SALAH:**
```typescript
// controller.ts
async function getLoanApplication(req, res) {
  try {
    const loan = await loanService.getLoanApplication(req.params.id);
    res.json(loan);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}
```

**BENAR:**
```typescript
// controller.ts
import { AppError } from '../middleware/error.middleware';
import { LoanNotFoundError } from '../errors/loan-error';

async function getLoanApplication(req, res, next) {
  try {
    const loan = await loanService.getLoanApplication(req.params.id);
    if (!loan) {
      throw new LoanNotFoundError(req.params.id);
    }
    res.json({ success: true, data: loan });
  } catch (error) {
    next(error); // Lempar ke error handling middleware
  }
}

// error.middleware.ts
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || []
    });
  }
  
  // Log error untuk debugging (tidak ekspos ke client dalam produksi)
  console.error('Unexpected error:', err);
  
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    errors: ['Terjadi kesalahan internal sistem']
  });
}
```

### Contoh 3: Repository Pattern

**SALAH (Direct Database Access):**
```typescript
// service.ts
async function getUserLoans(userId: string) {
  const query = `
    SELECT l.*, p.nama as product_name 
    FROM loans l 
    JOIN products p ON l.product_id = p.id 
    WHERE l.user_id = $1 AND l.status = 'active'
  `;
  const result = await db.query(query, [userId]);
  return result.rows;
}
```

**BENAR (Repository Pattern):**
```typescript
// loan.repository.ts
import { Loan } from './loan.entity';
import { FilterOptions } from './filter-options.interface';

export class LoanRepository {
  constructor(private db: Database) {}

  async findByUserId(userId: string, options?: FilterOptions): Promise<Loan[]> {
    const query = this.db
      .selectFrom('loans as l')
      .innerJoin('products as p', 'l.product_id', 'p.id')
      .where('l.user_id', '=', userId)
      .where('l.status', '=', 'active')
      .select([
        'l.id',
        'l.user_id',
        'l.product_id',
        'l.principal_amount',
        'l.interest_rate',
        'l.term_months',
        'l.monthly_payment',
        'l.total_payment',
        'l.status',
        'l.created_at',
        'l.updated_at',
        'p.nama as product_name'
      ]);

    if (options?.limit) {
      query.limit(options.limit);
    }
    if (options?.offset) {
      query.offset(options.offset);
    }

    const result = await query.execute();
    return result.map(row => Loan.fromDatabase(row));
  }
}

// service.ts
class LoanService {
  constructor(private loanRepository: LoanRepository) {}

  async getUserLoans(userId: string): Promise<Loan[]> {
    return this.loanRepository.findByUserId(userId);
  }
}
```

## Checklist Sebelum Merge ke Branch Utama

Sebuah pull request hanya dapat di-merge jika semua checklist berikut telah dipenuhi:

### ✅ Persiapan
- [ ] Branch dibuat dari `develop` (atau branch yang sesuai)
- [ ] Nama branch sesuai konvensi (feature/, bugfix/, hotfix/, release/)
- [ ] Commit message jelas dan deskriptif
- [ ] Kedua belah pihak telah review kode (minimal 1 approver)

### ✅ Kualitas Kode
- [ ] Tidak ada linting error (ESLint)
- [ ] Kode sudah di-format dengan Prettier
- [ ] Tidak ada console.log atau debugger yang tersisa
- [ ] Tidak ada commented-out code yang tidak perlu
- [ ] Nama variabel, fungsi, dan kelas yang deskriptif
- [ ] Komentar yang berguna (tidak过多或过少)
- [ ] Mengikuti prinsip SOLID dan clean code

### ✅ Fungsionalitas
- [ ] Semua requirement telah terpenuhi
- [ ] Unit test telah ditulis dan passing (minimal 80% coverage untuk logic baru)
- [ ] Integration test telah ditulis dan passing (jika diperlukan)
- [ ] Manual testing telah dilakukan untuk skenario utama
- [ ] Edge case dan error condition telah dipertimbangkan
- [ ] Performa telah dipertimbangkan (tidak ada N+1 query, loop yang tidak efisien, etc.)

### ✅ Keamanan
- [ ] Input validasi telah diterapkan pada semua titik masuk
- [ ] Output sanitasi untuk mencegah XSS
- [ ] Tidak ada hardcoded credentials atau secret
- [ ] Password telah di-hash (jika relevan)
- [ ] Authorization telah diperiksa untuk semua endpoint yang sensitif
- [ ] Tidak ada SQL injection vulnerability
- [ ] File upload validation telah diterapkan (jika relevan)

### ✅ Database
- [ ] Migrasi database telah dibuat (jika diperlukan)
- [ ] Migrosa telah di-test pada staging database
- [ ] Rollback procedure telah dipertimbangkan dan di-dokumentasikan
- [ ] Indeks telah ditambahkan untuk query yang sering digunakan (jika diperlukan)
- [ ] Tidak ada perubahan struktur database yang merusak tanpa migrasi yang sesuai

### ✅ API
- [ ] API documentation telah diperbarui (jika diperlukan)
- [ ] Response format konsisten dengan standar `{ success, message, data }`
- [ ] Status code HTTP yang sesuai digunakan
- [ ] Validasi input telah diterapkan
- [ ] Error response format konsisten
- [ ] Versioning telah dipertimbangkan jika ada perubahan yang breaking
- [ ] Rate limiting telah dipertimbangkan untuk endpoint publik

### ✅ Frontend
- [ ] Hanya menggunakan functional component dan hooks
- [ ] Styling hanya menggunakan TailwindCSS
- [ ] Tidak ada inline style
- [ ] Responsiveness telah dipertimbangkan
- [ ] Aksesibilitas (a11y) telah dipertimbangkan
- [ ] Error handling dalam komponen
- [ ] Loading state dan empty state telah dipertimbangkan
- [ ] Optimasi rendering (memo, useCallback, useCallback) telah dipertimbangkan

### ✅ DevOps
- [ ] Dockerfile telah diperbarui (jika diperlukan)
- [ ] Konfigurasi environment telah diperbarui (jika diperlukan)
- [ ] Health check endpoint telah ditambahkan atau diperbarui (jika diperlukan)
- [ ] Log yang sesuai telah ditambahkan
- [ ] Monitoring dan alerting pertimbangan telah dilakukan

### ✅ Dokumentasi
- [ ] Dokumentasi teknis telah diperbarui (API, database, arsitektur, dll)
- [ ] Dokumentasi pengguna telah diperbarui (jika diperlukan)
- [ ] Catatan rilis (changelog) telah diperbarui
- [ ] Panduan migrasi telah disediakan (jika diperlukan)
- [ ] Pertimbangan backward compatibility telah dibuat

### ✅ Kepatuhan
- [ ] Mematuhi prinsip Configuration over Hardcode
- [ ] Memastikan Rule Engine adalah sumber keputusan (bukan AI)
- [ ] Memastikan semua keputusan AI explainable
- [ ] Memastikan semua kebijakan bisnis dalam bentuk konfigurasi
- [ ] Memastikan audit trail untuk semua perubahan data
- [ ] Memastikan enkripsi data sensitif
- [ ] Memastikan tidak ada pelanggaran standar perbankan yang relevan

## Panduan Spesifik untuk Fitur AI Credit Analyst

### Prinsip AI yang Wajib Diikuti:
1. **AI Hanya Membantu, Tidak Memutuskan**
   - AI tidak boleh memberikan keputusan approve/reject
   - AI hanya memberikan rekomendasi dan analisis
   - Keputusan akhir selalu dibuat oleh Rule Engine atau manusia

2. **Explainability Wajib**
   - Setiap rekomendasi AI harus menjelaskan:
     - Rule mana yang aktif dan memengaruhi keputusan
     - Policy mana yang digunakan
     - Data mana yang digunakan untuk analisis
     - Tingkat kepercayaan (confidence score)
     - Alasan behind the recommendation
     - Risiko yang teridentifikasi
     - Mitigasi yang disarankan

3. **Sumber Knowledge yang Jelas**
   - Setiap jawaban AI harus menyebutkan sumber knowledgenya:
     - SOP Internal
     - Kebijakan Kredit
     - Peraturan Direksi
     - POJK/SEOJK/OJK
     - Manual Kredit
     - Panduan AO/Analis
     - Sumber lain yang relevan

4. **Bukan Black Box**
   - Tidak boleh menggunakan model yang tidak dapat diinterpretasikan
   - Model harus dapat dijelaskan dalam hal fitur dan bobotnya
   - Audit trail untuk proses pengambilan keputusan AI
   - Kemampuan untuk melakukan "what-if" analysis

### Struktur Respons AI yang Wajib:
```json
{
  "success": true,
  "data": {
    "executiveSummary": "Ringkasan eksekutif dari analisis",
    "businessAnalysis": {
      // Analisis usaha
    },
    "financialAnalysis": {
      // Analisis keuangan
    },
    "cashFlowAnalysis": {
      // Analisis arus kas
    },
    "workingCapitalAnalysis": {
      // Analisis modal kerja
    },
    "fiveCAnalysis": {
      // Analisis 5C (Character, Capacity, Capital, Collateral, Condition)
    },
    "swotAnalysis": {
      // Analisis SWOT
    },
    "riskAnalysis": {
      // Analisis risiko
    },
    "riskMitigation": [
      // Strategi mitigasi risiko
    ],
    "recommendation": "Rekomendasi spesifik berdasarkan analisis",
    "conclusion": "Kesimpulan akhir",
    "sources": [
      "SOP Internal No. XX/2023",
      "KepDir No. YY/2023",
      "POJK No. ZZ/2023"
    ],
    "confidenceScore": 0.85, // 0-1
    "activeRules": [
      "RULE001: Debt Service Ratio harus < 40%",
      "RULE005: Loan to Value ratio harus < 70%"
    ],
    "appliedPolicy": "PROD_KREDIT_PRODUKTIF_V2.1"
  }
}
```

### Implementasi Teknis AI Service:
- **Layer Isolation**: AI service hanya berkomunikasi melalui API yang terdefinisi dengan baik
- **Model Management**: Model versioning dan monitoring untuk drift detection
- **Fallback Mechanism**: Jika AI tidak tersedia atau memberikan hasil yang tidak dapat diandalkan, sistem harus tetap dapat berfungsi menggunakan rule-based approach
- **Bias Detection**: Pemantauan rutin untuk bias dalam keputusan AI
- **Feedback Loop**: Mekanisme untuk memperbaiki model berdasarkan hasil aktual keputusan

## Contoh Implementasi Service yang Benar

### Rule Engine Service
```typescript
// rule-engine.service.ts
import { RuleEngine } from './rule-engine';
import { RuleRepository } from './rule.repository';
import { LoanApplication } from './loan-application.entity';
import { RuleEngineResult } from './rule-engine-result.interface';

export class RuleEngineService {
  constructor(
    private ruleRepository: RuleRepository,
    private ruleEngine: RuleEngine
  ) {}

  async evaluateLoanApplication(application: LoanApplication): Promise<RuleEngineResult> {
    // 1. Ambil semua rule yang aktif dan relevan
    const activeRules = await this.ruleRepository.getActiveRulesForProduct(
      application.productType
    );

    // 2. Evaluasi aplikasi terhadap rule menggunakan rule engine
    const result = this.ruleEngine.evaluate(application, activeRules);

    // 3. Pastikan result memiliki penjelasan yang lengkap
    if (!result.explanation) {
      throw new Error('Rule engine result must include explanation');
    }

    return result;
  }
}
```

### AI Analyst Service
```typescript
// ai-analyst.service.ts
import { AIAnalysisResult } from './ai-analysis-result.interface';
import { KnowledgeService } from './knowledge.service';
import { LlamaService } from './llama.service';

export class AIAnalystService {
  constructor(
    private knowledgeService: KnowledgeService,
    private llamaService: LlamaService
  ) {}

  async analyzeLoanApplication(
    application: LoanApplication,
    ruleEngineResult: any
  ): Promise<AIAnalysisResult> {
    // 1. Kumpulkan data yang diperlukan untuk analisis
    const financialData = await this.getFinancialData(application);
    const collateralData = await this.getCollateralData(application);
    // ... altri data yang diperlukan

    // 2. Dapatkan knowledge yang relevan
    const relevantKnowledge = await this.knowledgeService.getRelevantKnowledge(
      application.productType,
      application.loanAmount,
      application.term
    );

    // 3. Buat prompt untuk LLM
    const prompt = this.buildAnalysisPrompt(
      application,
      financialData,
      collateralData,
      relevantKnowledge,
      ruleEngineResult
    );

    // 4. Dapatkan analisis dari LLM
    const rawAnalysis = await this.llamaService.generateCompletion(prompt, {
      temperature: 0.3, // Lower temperature for more consistent output
      maxTokens: 2000
    });

    // 5. Parse dan validasi respons
    const analysis = this.parseAndValidateAnalysis(rawAnalysis);

    // 6. Pastikan respons memiliki semua field yang wajib dan sumber
    this.validateAnalysisResponse(analysis);

    return analysis;
  }

  private validateAnalysisResponse(analysis: any): void {
    const requiredFields = [
      'executiveSummary',
      'businessAnalysis',
      'financialAnalysis',
      'cashFlowAnalysis',
      'workingCapitalAnalysis',
      'fiveCAnalysis',
      'swotAnalysis',
      'riskAnalysis',
      'riskMitigation',
      'recommendation',
      'conclusion',
      'sources',
      'confidenceScore',
      'activeRules',
      'appliedPolicy'
    ];

    for (const field of requiredFields) {
      if (!(field in analysis)) {
        throw new Error(`Missing required field in AI analysis: ${field}`);
      }
    }

    // Validasi tipe data dan nilai
    if (typeof analysis.confidenceScore !== 'number' || 
        analysis.confidenceScore < 0 || 
        analysis.confidenceScore > 1) {
      throw new Error('Confidence score must be a number between 0 and 1');
    }

    if (!Array.isArray(analysis.sources) || analysis.sources.length === 0) {
      throw new Error('Sources must be a non-empty array');
    }

    // Validasi bahwa setiap source adalah string yang bermakna
    for (const source of analysis.sources) {
      if (typeof source !== 'string' || source.trim().length === 0) {
        throw new Error('Each source must be a non-empty string');
      }
    }
  }
}
```

## Referensi dan Standar yang Diikuti

### Standar Internal:
- AI_LIVING_SPECIFICATION.md (Constitution)
- PROJECT_CONTEXT.md (Business Context)
- ARCHITECTURE.md (High Level Architecture)
- DEVELOPMENT_GUIDE.md (Ini Dokumen)
- ROADMAP.md (Roadmap Pengembangan)
- MISTAKES.md (Pelajaran dari Kesalahan)
- SESSION_LOG.md (Log Aktivitas Sesi)
- AGENTS.md (Konfigurasi Agent AI)
- kilo.json (Konfigurasi Kilo)
- .kilo/ (Konfigurasi Kilo)

### Standar Eksternal:
- **Peraturan Perbankan**: POJK, SEOJK, Peraturan OJK, Peraturan BI
- **Standar Keamanan**: OWASP Top 10, ISO 27001, NIST Cybersecurity Framework
- **Standar Pengembangan**: 
  - Clean Code by Robert C. Martin
  - Domain-Driven Design by Eric Evans
  - Clean Architecture by Robert C. Martin
  - Refactoring by Martin Fowler
  - Working Effectively with Legacy Code by Michael Feathers
- **Standar API**: REST, OpenAPI/Swagger, JSON:API
- **Standar Testing**: ISTQB, BDD/TDD principles
- **Standar Keamanan Aplikasi**: OWASP ASVS, CWE/SANS Top 25
- **Standar Arsitektur**: TOGAF, Zachman Framework, C4 Model
- **Standar Data**: GDPR (jika berlaku), PCI DSS (jika menangani pembayaran)

## Referensi Pembelajaran

### Buku:
- "Clean Code: A Handbook of Agile Software Craftsmanship" - Robert C. Martin
- "Design Patterns: Elements of Reusable Object-Oriented Software" - Gamma, Helm, Johnson, Vlissides
- "Domain-Driven Design: Tackling Complexity in the Heart of Software" - Eric Evans
- "Clean Architecture: A Craftsman's Guide to Software Structure and Design" - Robert C. Martin
- "Refactoring: Improving the Design of Existing Code" - Martin Fowler
- "Working Effectively with Legacy Code" - Michael Feathers
- "The Pragmatic Programmer" - Andrew Hunt, David Thomas
- "Clean Architecture in Python" - Leonardo Giordani
- "API Design Patterns" - JJ Geewax

### Kursus Online:
- Coursera: Software Design and Architecture (University of Alberta)
- Udemy: Domain-Driven Design Fundamentals
- Pluralsight: API Design in Node.js
- LinkedIn Learning: Writing Clean Code
- edX: Computer Science and Mobile Apps (Harvard)

### Komunitas dan Blog:
- Martin Fowler's Blog (martinfowler.com)
- Stack Overflow dan Stack Exchange
- GitHub Open Source Projects
- Dev.to, Hacker News, Reddit r/programming
- Tech blog dari perusahaan teknologi besar (Netflix, Uber, Airbnb, Spotify, dll)

---
*Document ini adalah bagian dari Living Specification untuk Sistem Analisa Kredit PT BPR BAPERA BATANG. 
Diperbarui terakhir: $(date)*