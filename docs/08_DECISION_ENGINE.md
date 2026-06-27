# DECISION_ENGINE.md

# Modul Decision Engine

## Gambaran Umum
Modul Decision Engine adalah komponen inti yang bertanggung jawab untuk membuat keputusan kredit berdasarkan hasil evaluasi Rule Engine, dalam konteks kebijakan yang berlaku, dan menggambarkan keputusan tersebut dalam bentuk yangjelas dan dapat dipertanggungjawabkan. Menurut prinsip dasar sistem: "Rule Engine adalah sumber keputusan" dan "AI tidak pernah menentukan approve atau reject." Decision Engine memastikan bahwa semua keputusan kredit dibuat berdasarkan aturan yang telah ditetapkan, dengan jelasnya penjelasan, dan sesuai dengan kebijakan yang berlaku.

## Tujuan Utama
1. Menerapkan aturan kredit yang telah ditentukan dalam Rule Engine
2. Menginterpretasikan hasil evaluasi Rule Engine dalam konteks kebijakan yang berlaku
3. Membuat keputusan kredit yang konsisten dan dapat dipertanggungjawabkan
4. Menyediakan penjelasan lengkap untuk setiap keputusan yang diambil
5. Mendukung mekanisme override dan pengecualian dengan audit trail yang lengkap
6. Mengintegrasikan dengan sistem approval workflow
7. Memastikan bahwa keputusan tidak boleh dibuat oleh AI, hanya oleh Rule Engine dalam konteks kebijakan

## Prinsip Dasar
- **Rule Engine is the Source of Truth**: Keputusan kredit harus berasal dari Rule Engine, bukan dari kode aplikasi atau opini AI
- **Explainable Decisions**: Setiap keputusan harus disertai dengan penjelasan lengkap mengenai mana aturan yang berlaku dan bagaimana mereka memengaruhi keputusan
- **Policy Context**: Keputusan harus dibuat dalam konteks kebijakan yang berlaku
- **Audit Trail**: Semua keputusan dan perubahan pada keputusan harus dilengkapi dengan informasi lengkap tentang siapa, kapan, dan mengapa
- **No AI Decision Making**: AI hanya boleh memberikan analisis dan rekomendasi, tidak boleh membuat keputusan approve/reject
- **Configurable Decision Logic**: Logika keputusan harus dapat diatur melalui konfigurasi, tidak boleh hardcode

## Komponen Utama

### 1. Decision Policy Engine
Komponen yang bertanggung jawab untuk menentukan logika keputusan berdasarkan hasil Rule Engine dan konteks kebijakan.

#### Fungsi Utama:
- Menerima hasil evaluasi dari Rule Engine
- Menerima konteks efektif dari Policy Engine
- Menerapkan logika keputusan yang dikonfigurasi
- Menghasilkan keputusan awal berdasarkan aturan yang diterapkan
- Mendeteksi dan melaporkan konflik yang perlu diselesaikan secara manual
- Menyediakan rekomendasi keputusan (APPROVE, REJECT, REQUIRES_REVIEW, etc.)

#### Logika Keputusan Dasar:
```
function makeDecision(ruleEngineResult, policyContext):
    # Ekstrak rekomendasi dari hasil Rule Engine
    ruleRecommendations = ruleEngineResult.appliedRules.map(rule -> rule.recommendation)
    
    # Terapkan hierarki keputusan berdasarkan konfigurasi kebijakan
    decisionHierarchy = policyContext.decisionHierarchy  # e.g., [REJECT, REQUIRES_REVIEW, APPROVE_WITH_CONDITIONS, APPROVE]
    
    # Tentukan keputusan awal berdasarkan rekomendasi yang paling "ekstrim"
    preliminaryDecision = determinePreliminaryDecision(ruleRecommendations, decisionHierarchy)
    
    # Deteksi konflik yang perlu resolusi manual
    conflicts = detectConflictsRequiringManualResolution(ruleEngineResult, policyContext)
    
    # Terapkan overrides dan pengecualian jika ada
    finalDecision = applyOverridesAndExceptions(preliminaryDecision, policyContext, ruleEngineResult)
    
    # Buat penjelasan komprehensif
    explanation = generateDecisionExplanation(
        preliminaryDecision, 
        finalDecision, 
        ruleEngineResult, 
        policyContext, 
        conflicts
    )
    
    return DecisionResult(
        decision: finalDecision,
        preliminaryDecision: preliminaryDecision,
        explanation: explanation,
        appliedRules: ruleEngineResult.appliedRules,
        conflicts: conflicts,
        policyContext: policyContext,
        metadata: generateDecisionMetadata(ruleEngineResult, policyContext)
    )
```

### 2. Decision Kernel
Komponen inti yang melaksanakan eksekusi logika keputusan.

#### Fungsi Utama:
- Mengevaluasi kondisi keputusan berdasarkan hasil Rule Engine
- Menerapkan logika Boolean dan fuzzy logic untuk keputusan kompleks
- Mengelola decision tree atau decision table untuk skenario kompleks
- Menyediakan mekanisme untuk penyesuaian dinamis logika keputusan
- Mendukung decision logic yang berbasis skor atau kontribusi

#### Implementasi Logic:
- **Rule-Based Decision**: Menggunakan rekomendasi langsung dari Rule Engine
- **Score-Based Decision**: Menggabungkan kontribusi dari berbagai aturan untuk menghasilkan skor keputusan
- **Hybrid Decision**: Kombinasi dari rule-based dan score-based
- **Decision Table**: Menggunakan tabel keputusan untuk skenario kompleks dengan banyak kondisi
- **Fuzzy Logic**: Untuk keputusan yang termasuk derajat keanggotaan

### 3. Override dan Exception Management
Komponen yang menangani situasi ketika diperlukan untuk menyimpang dari keputusan standar.

#### Fungsi Utama:
- Mendeteksi situasi yang memerlukan override berdasarkan kebijakan
- Memproses permintaan override dengan alasan yang jelas
- Menyediakan mekanisme approval untuk override
- Mencatat seluruh override dan exception dengan audit trail lengkap
- Menerapkan kebijakan yang membatasi seberapa sering dan kapan override boleh dilakukan
- Memastikan bahwa override tidak dapat digunakan untuk mengabaikan aturan kritis

#### Jenis Override:
- **Manual Override**: Keputusan dibuat oleh manusia yang melepas rekomendasi sistem
- **Conditional Override**: Override yang diberikan otomatis ketika kondisi tertentu terpenuhi
- **Time-Based Override**: Override yang hanya berlaku dalam periode waktu tertentu
- **Role-Based Override**: Override yang hanya boleh dilakukan oleh pengguna dengan peran tertentu
- **Amount-Based Override**: Override yang hanya boleh dilakukan untuk jumlah pinjaman di bawah ambang tertentu

### 4. Decision Explanation Generator
Komponen yang bertanggung jawab untuk membuat penjelasan lengkap untuk setiap keputusan.

#### Fungsi Utama:
- Menerangkan mana aturan yang diterapkan dan kontribusi masing-masing
- Menerangkan bagaimana kebijakan memengaruhi keputusan
- Menerangkan mengapa keputusan dibuat (atau tidak dibuat)
- Menerangkan konflik yang terdeteksi dan bagaimana mereka diselesaikan
- Menerangkan alasan di balik override atau exception (jika ada)
- Memberikan referensi ke sumber aturan dan kebijakan yang digunakan
- Menyediakan versi dalam bahasa yang mudah dipahami oleh pengguna bisnis

### 5. Decision Logging dan Audit Trail
Komponen yang mencatat semua keputusan dan perubahan untuk tujuan kepatuhan dan analisis.

#### Fungsi Utama:
- Mencatat setiap keputusan kredit yang dibuat
- Mencatat setiap override dan exception dengan alasan lengkap
- Mencatat siapa yang membuat keputusan (sistem atau manusia)
- Mencatat waktu keputusan dibuat
- Mencatat konteks kebijakan yang berlaku saat keputusan dibuat
- Mencatat hasil Rule Engine yang digunakan
- Mengintegrasikan dengan sistem audit log pusat
- Menyediakan fasilitas untuk pelaporan dan analisis keputusan

## Alur Kerja Utama

### 1. Pemasukan Hasil Rule Engine dan Konteks Kebijakan
Saat permohonan kredit siap untuk pengambilan keputusan:
1. Rule Engine mengevaluasi aplikasi terhadap aturan aktif yang relevan
2. Rule Engine mengembalikan hasil evaluasi yang mencakup:
   - Daftar aturan yang diterapkan
   - Rekomendasi per aturan
   - Penjelasan per aturan
   - Deteksi konflik antar-aturan (jika ada)
3. Policy Engine menentukan kebijakan efektif yang berlaku untuk konteks aplikasi
4. Policy Engine mengembalikan:
   - Kebijakan efektif yang menentukan kontekstualisasi
   - Himpunan efektif aturan yang dievaluasi oleh Rule Engine
   - Informasi tentang pewarisan, overrides, dan resolusi konflik antar-kebijakan
5. Decision Engine menerima kedua hasil ini sebagai input

### 2. Pemrosesan Keputusan
1. Decision Policy Engine memproses hasil Rule Engine dengan konteks kebijakan
2. Menerapkan logika keputusan yang dikonfigurasi untuk menghasilkan keputusan awal
3. Mendeteksi konflik yang memerlukan resolusi manual
4. Memproses override dan exception jika berlaku
5. Decision Kernel melaksanakan eksekusi logika keputusan akhir
6. Decision Explanation Generator membuat penjelasan lengkap
7. Decision Logging dan Audit Trail mencatat keputusan dan detail terkait

### 3. Integrasi dengan Workflow Approval
Hasil dari Decision Engine menjadi input untuk sistem approval workflow:
1. Keputusan awal dari Decision Engine menentukan langkah selanjutnya dalam workflow
2. Jika keputusan adalah APPROVE atau REJECT dengan otoritas yang cukup,Workflow mungkin langsung melangkah ke tahap selanjutnya
3. Jika keputusan adalah REQUIRES_REVIEW atau melebihi batas wewenang otomatis,Workflow mengalihkan ke approver yang sesuai
4. Informasi tentang aturan yang diterapkan, kebijakan yang berlaku, dan penjelasan lengkap menjadi bagian dari berkas yang ditinjau oleh approver
5. Jika approver memberikan keputusan yang berbeda (override),Decision Engine mencatat ini sebagai override dengan audit trail lengkap
6. Keputusan akhir (dari sistem atau manusia) menjadi keputusan resmi yang menggerakkan alur kerja selanjutnya

### 4. Contoh Alur Kerja Lengkap
**Skenaario**: Nasabah memohon KTA sebesar 500 juta

1. **Input ke Decision Engine**:
   - Dari Rule Engine:
     - RULE_CONSUMER_001: DSR < 40%? Hasil: 35% → LULUS, rekomendasi: APPROVE
     - RULE_CONSUMER_002: Jumlah pinjaman < 200 juta? Hasil: 500 juta > 200 juta → TIDAK LULUS, rekomendasi: REJECT
     - RULE_CONSUMER_003: Jangka waktu < 60 bulan? Hasil: 36 bulan → LULUS, rekomendasi: APPROVE
     - Konflik terdeteksi: Satu rule REJECT, dua rule APPROVE
   - Dari Policy Engine:
     - Kebijakan efektif: Kebijakan Kredit Konsumtif Standar
     - Hierarki keputusan: [REJECT, REQUIRES_REVIEW, APPROVE_WITH_CONDITIONS, APPROVE]
     - Nilai ambang batas untuk RULE_CONSUMER_002: 200 juta (tidak dapat di-override untuk nasabah reguler)
     - Mechanisme resolve konflik: Mayoritas menang (jika tidak ada konflik kritis)

2. **Pemrosesan di Decision Engine**:
   - Decision Policy Engine:
     - Mengevaluasi rekomendasi: [APPROVE, REJECT, APPROVE]
     - Menerapkan hierarki keputusan: REJECT memiliki prioritas tertinggi
     - Menentukan keputusan awal: REJECT (karena ada satu rule yang merekomendasikan REJECT dan itu memiliki prioritas tertinggi)
     - Mendeteksi konflik yang perlu resolusi manual: Tidak ada, karena hierarki keputusan jelas menangguhkan keputusan berdasarkan prioritas
   - Decision Kernel:
     - Mengeksekusi logika keputusan: Memutuskan REJECT berdasarkan rekomendasi Rule Engine dan hierarki kebijakan
   - Decision Explanation Generator:
     - Membuat penjelasan: "Aplikasi ditolak karena jumlah pinjaman (500 juta) melebihi batas maksimum yang diizinkan untuk produk KTA sebesar 200 juta, sesuai dengan RULE_CONSUMER_002 dalam Kebijakan Kredit Konsumtif Standar."
   - Decision Logging dan Audit Trail:
     - Mencatat keputusan: REJECT dengan alasan lengkap dan referensi ke rule dan kebijakan yang relevan

3. **Integrasi dengan Workflow**:
   - Keputusan REJECT dari Decision Engine diterima oleh Workflow Engine
   - Workflow menentukan bahwa tidak perlu approver manusia karena keputusan jelas dan dalam batas wewenang otomatis
   - Workflow melangkah ke pembuatan dokumen keputusan dan pemberitahuan kepada nasabah
   - Seluruh proses dicatat dalam audit trail untuk tujuan kepatuhan dan analisis

### 5. Contoh Override
**Skenaario**: Nasabah VIP memohon KTA sebesar 250 juta (melebihi batas reguler 200 juta)

1. **Input ke Decision Engine**:
   - Dari Rule Engine:
     - RULE_CONSUMER_002: Jumlah pinjaman < 200 juta? Hasil: 250 juta > 200 juta → TIDAK LULUS, rekomendasi: REJECT
   - Dari Policy Engine:
     - Kebijakan efektif: Kebijakan Kredit Konsumtif untuk Nasabah VIP
     - Nilai ambang batas untuk RULE_CONSUMER_002: 300 juta (lebih tinggi dari kebijakan reguler)
     - Status: Nasabah teridentifikasi sebagai VIP berdasarkan status dalam sistem nasabah

2. **Pemrosesan di Decision Engine**:
   - Decision Policy Engine:
     - Mengevaluasi rekomendasi terhadap ambang batas yang efektif (300 juta)
     - RULE_CONSUMER_002: 250 juta < 300 juta → LULUS, rekomendasi: APPROVE
     - Tidak terdeteksi konflik
   - Decision Kernel:
     - Mengeksekusi logika keputusan: Memutuskan APPROVE
   - Decision Explanation Generator:
     - Membuat penjelasan: "Aplikasi disetujui karena meskipun jumlah pinjaman (250 juta) melebihi batas reguler untuk KTA sebesar 200 juta, nasabah memiliki status VIP yang memberikan ambang batas pinjaman sebesar 300 juta sesuai dengan Kebijakan Kredit Konsumtif untuk Nasabah VIP."
   - Decision Logging dan Audit Trail:
     - Mencatat keputusan: APPROVE dengan alasan lengkap
     - Tidak mencatat override karena keputusan sesuai dengan kebijakan efektif yang berlaku

### 6. Contoh Manual Override
**Skenaario**: Analis merasa bahwa aplikasi yang ditolak sistem sebenarnya layak berdasarkan pertimbangan khusus

1. **Input ke Decision Engine**:
   - Dari Rule Engine:
     - Hasil akumulatif menghasilkan keputusan REJECT berdasarkan aturan standar
   - Dari Policy Engine:
     - Kebijakan efektif berlaku
     - Manual override mungkin dengan persetujuan tingkat tertentu

2. **Pemrosesan di Decision Engine**:
   - Decision Policy Engine:
     - Menghasilkan keputusan awal: REJECT
     - Mendeteksi bahwa sistem mengizinkan manual override dengan persetujuan
   - Decision Kernel:
     - Menunggu input dari sistem approval workflow
   - Dikerjakan oleh Workflow Engine:
     - Mengalihkan ke approver yang sesuai karena melebihi batas wewenang otomatis atau karena manual override diminta
     - Approver manusia meninjau aplikasi dan memberikan keputusan APPROVE dengan alasan spesifik
   - Decision Engine menerima override:
     - Mencatat override sebagai manual override dengan alasan lengkap
     - Mengubah keputusan akhir menjadi APPROVE
     - Memastikan audit trail lengkap mencatat siapa yang membuat override, kapan, dan mengapa

## Integrasi dengan Komponen Lainnya

### 1. Dengan Rule Engine
- Decision Engine tergantung helt pada hasil evaluasi dari Rule Engine
- Tidak boleh memodifikasi atau menambah aturan dalam Rule Engine
- Harus menerapkan aturan apa adanya sebagaimana yang dievaluasi oleh Rule Engine
- Jika ada ketidaksesuaian antara hasil Rule Engine dan harapan bisnis, solusinya adalah melalui perubahan aturan di Rule Engine (melewati proses yang tepat), bukan melalui modifikasi di Decision Engine

### 2. Dengan Policy Engine
- Menerima konteks efektif yang menentukan mana aturan yang relevan dan bagaimana mereka harus dievaluasi
- Menggunakan hierarki keputusan dan parameter konfigurasi dari kebijakan efektif
- Menghormati pewarisan dan overrides yang ditetapkan dalam kebijakan
- Tidak boleh mengubah atau mendengar aturan apa pun dari kebijakan

### 3. Dengan AI Credit Analyst
- Menerima analisis dan rekomendasi dari AI sebagai informasi tambahan
- TIDAK BOLEH menggunakan rekomendasi AI sebagai dasar untuk keputusan approve/reject
- Harus menjelaskan dalam penjelasan keputusan jika dan bagaimana rekomendasi AI dipertimbangkan (atau tidak dipertimbangkan) oleh manusia)
- Memastikan bahwa keputusan akhir tetap berdasarkan Rule Engine dan kebijakan, bukan analisis AI

### 4. Dengan Workflow Engine
- Memberikan keputusan awal sebagai input untuk menentukan langkah selanjutnya dalam workflow
- Menerima hasil override dari workflow ketika approver manusia memberikan keputusan yang berbeda
- Mencatat seluruh override dengan audit trail lengkap
- Memberikan informasi yang diperlukan untuk pembuatan dokumen keputusan dan surat kepada nasabah
- Mengintegrasikan dengan sistem notifikasi untuk pemberitahuan keputusan

### 5. Dengan Knowledge Service
- Menerapkan sumber aturan dan kebijakan yang ditentukan dalam knowledge base
- Memastikan bahwa semua referensi ke aturan dan kebijakan dalam penjelasan bisa divalidasi terhadap knowledge base
- Menggunakan pengetahuan dari SOP dan peraturan untuk menjelaskan dasar keputusan dalam bahasa yang mudah dimengerti

## Implementasi Teknis

### Basis Data Skema

#### Tabel Keputusan Utama
```sql
CREATE TABLE credit_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES pengajuan(id) ON DELETE CASCADE,
    decision_type VARCHAR(20) NOT NULL CHECK (decision_type IN ('APPROVE', 'REJECT', 'REQUIRES_REVIEW', 'REQUIRES_REVISION')),
    preliminary_decision_type VARCHAR(20) CHECK (preliminary_decision_type IN ('APPROVE', 'REJECT', 'REQUIRES_REVIEW', 'REQUIRES_REVISION')),
    is_override BOOLEAN DEFAULT FALSE,
    override_reason TEXT,
    overridden_by UUID REFERENCES users(id),
    overridden_at TIMESTAMP WITH TIME ZONE,
    decision_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decision_maker_type VARCHAR(20) NOT NULL CHECK (decision_maker_type IN ('SYSTEM', 'HUMAN')),
    decision_maker_id UUID REFERENCES users(id),
    rule_engine_result JSONB NOT NULL,  -- Hasil lengkap dari Rule Engine
    policy_context JSONB NOT NULL,      -- Konteks efektif dari Policy Engine
    explanation TEXT NOT NULL,
    metadata JSONB,                     -- Metadata tambahan
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_credit_decisions_application ON credit_decisions(application_id);
CREATE INDEX idx_credit_decisions_timestamp ON credit_decisions(decision_timestamp);
CREATE INDEX idx_credit_decisions_decision_type ON credit_decisions(decision_type);
CREATE INDEX idx_credit_decisions_is_override ON credit_decisions(is_override) WHERE is_override = TRUE;
CREATE INDEX idx_credit_decisions_overridden_by ON credit_decisions(overridden_by);
```

#### Tabel Decision Log untuk Audit Trail yang lebih Detail
```sql
CREATE TABLE decision_decision_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL REFERENCES credit_decisions(id) ON DELETE CASCADE,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN (
        'DECISION_MADE', 
        'OVERRIDE_APPLIED', 
        'OVERRIDE_REQUESTED', 
        'OVERRIDE_APPROVED', 
        'OVERRIDE_REJECTED',
        'EXPLANATION_GENERATED',
        'CONFLICT_DETECTED',
        'CONFLICT_RESOLVED'
    )),
    action_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    performed_by UUID REFERENCES users(id),
    performed_by_type VARCHAR(20) NOT NULL CHECK (performed_by_type IN ('SYSTEM', 'HUMAN')),
    details JSONB,  -- Informasi spesifik tentang tindakan
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_decision_log_decision_id ON decision_decision_log(decision_id);
CREATE INDEX idx_decision_log_timestamp ON decision_decision_log(action_timestamp);
CREATE INDEX idx_decision_log_action_type ON decision_decision_log(action_type);
```

### Layanan Utama
1. **DecisionRepository**:
   - Mengelola persistence dan retrieval dari tabel credit_decisions dan decision_log
   - Menyediakan query untuk mengambil keputusan berdasarkan aplikasi, waktu, atau kriteria lainnya

2. **DecisionPolicyEngine**:
   - Menerapkan logika keputusan berdasarkan hasil Rule Engine dan konteks kebijakan
   - Mengimplementasikan hierarki keputusan dan logika resolusi konflik
   - Menyediakan fungsi untuk mendeteksi konflik yang memerlukan resolusi manual

3. **DecisionKernel**:
   - Mengeksekusi logika keputusan inti
   - Mengelola decision tree, decision table, atau logika lain yang dikonfigurasi
   - Menyediakan mekanisme untuk penyesuaian dinamis

4. **OverrideManager**:
   - Mengelola permintaan, approval, dan pengecualian override
   - Menerapkan batasan dan kondisi untuk override
   - Mencatat seluruh override dengan audit trail lengkap

5. **ExplanationGenerator**:
   - Membuat penjelasan lengkap untuk keputusan
   - Mengintegrasikan informasi dari Rule Engine, Policy Engine, dan konteks override
   - Menyediakan versi teknis dan versi bisnis dari penjelasan

6. **DecisionService**:
   - Antarmuka utama untuk komponen lain
   - Mengorkestrasi seluruh proses pengambilan keputusan
   - Menyediakan fungsi untuk mengambil keputusan, membuat override, dan mengambil riwayat keputusan

### API Endpoints
```
GET   /api/v1/decisions/{applicationId}      # Dapatkan keputusan untuk aplikasi tertentu
POST  /api/v1/decisions/{applicationId}/override # Minta override untuk keputusan
GET   /api/v1/decisions/{decisionId}/log     # Dapatkan riwayat tindakan untuk keputusan
GET   /api/v1/decisions/statistics           # Dapatkan statistik keputusan
POST  /api/v1/decisions/{decisionId}/reconsider # Perminta pertimbangan ulang keputusan
```

## Penanganan Konflik dan Edge Cases

### Jenis Konflik yang Dipertimbangkan
1. **Rule-Rule Conflict**: Dua atau lebih rule yang memberikan rekomendasi yang bertentangan
2. **Rule-Policy Conflict**: Hasil Rule Engine bertentangan dengan kebijakan efektif
3. **Policy-Policy Conflict**: Kebijakan yang berlaku secara bersamaan memberikan arahan yang berbeda
4. **Context-Conflict**: Konteks aplikasi tidak jelas sehingga tidak dapat menentukan kebijakan efektif yang tepat
5. **Data-Conflict**: Data yang tidak konsisten atau tidak lengkap sehingga tidak dapat dievaluasi dengan benar

### Strategi Resolusi Konflik
1. **Hierarchy-Based**: Menggunakan prioritas yang ditetapkan dalam kebijakan
2. **Specificity-Based**: Rule atau kebijakan yang lebih spesifik menang
3. **Recency-Based**: Rule atau kebijakan yang lebih baru atau lebih baru diupdate menang
4. **Expert Review**: Konflik yang dialgsikan untuk resolusi manusia
5. **Conservative Approach**: Dalam hal ragu, pilih opsi yang lebih konservatif (cenderung REJECT)

### Edge Cases yang Dipertimbangkan
1. **Tidak Ada Rules yang Berlaku**: 
   - Gunakan default action dari kebijakan efektif
   - Flag untuk review manual jika default action tidak jelas
   - Catat sebagai kejadian khusus untuk analisis nanti

2. **Rules yang Berkontradiksi Secara Ekstrem**:
   - Deteksi dan flag untuk review manual
   - Beri penjelasan lengkap tentang sifat konflik
   - Terapkan kebijakan resolusi konflik yang dikonfigurasi

3. **Data yang Tidak Lengkap atau Tidak Konsisten**:
   - Validasi input ke Decision Engine
   - Kembalikan error 400 dengan detail tentang data yang missing atau tidak konsisten
   - Jika mungkin, gunakan pendekatan konservatif

4. **Kebijakan yang Tidak Dapat Ditentukan**:
   - Gunakan kebijakan dasar sebagai fallback
   - Flag untuk review manual
   - Catat kejadian untuk analisis dan perbaikan konfigurasi kebijakan

5. **Override yang Berlebihan**:
   - Terapkan batasan atas frekuensi override per user, per produk, atau per periode
   - Require approval tingkat tinggi untuk override
   - Pantau pola override untuk mendeteksi penyalahgunaan

## Kepatuhan dan Audit

### Persyaratan Kepatuhan
1. **OJK dan Peraturan Perbankan**:
   - Semua keputusan harus dapat dijelaskan dan divalidasi
   - Audit trail lengkap untuk semua keputusan dan perubahan
   - Retensi catatan keputusan sesuai dengan persyaratan perbankan
   - Kemampuan untuk menghasilkan laporan keputusan untuk regulator

2. **Standar Internal**:
   - Semua keputusan harus sesuai dengan prinsip-prinsip sistem
   - Tidak boleh ada keputusan yang dibuat oleh AI
   - Semua override harus memiliki alasan yang jelas dan approval yang sesuai
   - Audit trail harus lengkap dan tidak dapat diubah

### Audit Trail Requirements
- **Who**: Siapa yang membuat keputusan (sistem atau manusia dengan ID spesifik)
- **What**: Apa keputusan yang dibuat (APPROVE, REJECT, etc.)
- **When**: Kapan keputusan dibuat (timestamp dengan zona waktu)
- **Where**: Di mana aplikasi keputusan dibuat untuk (application ID)
- **Why**: Alasan lengkap untuk keputusan, termasuk referensi ke aturan dan kebijakan
- **How**: Proses yang diikuti untuk membuat keputusan
- **Override Info**: Jika override, siapa yang menyetujui, kapan, dan alasan lengkap

### Retention dan Archiving
- **Active Decisions**: Retained seumur hidup aplikasi + 7 tahun setelah pencairan atau penolakan
- **Archived Decisions**: Retained 10 tahun setelah pencairan atau penolakan (sesuai OJK)
- **Decision Logs**: Retained 5 tahun untuk tujuan analisis dan audit
- **Metadata dan Statistik**: Retained sesuai dengan kebutuhan bisnis dan regulasi

## Skalabilitas dan Performa

### Optimasi Database
- **Indexing**:
  - Index pada application_id untuk pencarian cepat berdasarkan aplikasi
  - Index pada decision_timestamp untuk query berbasis waktu
  - Index pada decision_type untuk statistik dan filtering
  - Composite index pada (application_id, decision_timestamp) untuk riwayat aplikasi
- **Partitioning**:
  - Pertimbangkan partitioning berdasarkan tahun untuk tabel keputusan yang sangat besar
  - Partitioning berdasarkan bulan untuk tabel decision log
- **Materialized Views**:
  - Pertimbangkan materialized view untuk statistik keputusan yang sering diakses
  - Refresh sesuai dengan kebutuhan (per jam, per hari, atau manual)

### Caching Strategi
- **Decision Results Cache**:
  - Cache keputusan untuk aplikasi yang baru saja diproses
  - Invalidasi cache ketika ada perubahan pada aturan atau kebijakan yang relevan
  - Gunakan strategi waktu-basis (TTL) untuk cache keputusan
- **Policy Context Cache**:
  - Cache konteks efektif untuk kombinasi umum produk-segmen-waktu
  - Invalidasi ketika ada perubahan pada kebijakan
- **Rule Engine Result Cache**:
  - Cache hasil Rule Engine untuk aplikasi yang identikal (jarang terjadi karena data berubah)

### Pemrosesan Paralel
- **Batch Processing**:
  - Untuk pemrosesan massal (misal: pembaruan skor kredit), gunakan pemrosesan batch
  - Pastikan tidak ada konflik sumber daya yang dapat menyebabkan race condition
- **Async Decision Making**:
  - Untuk keputusan yang membutuhkan komputasi berat, pertimbangkan pemrosesan asinkron
  - Gunakan pola request-response dengan polling atau webhook untuk hasil

## Testing dan Kualitas Jaminan

### Jenis Pengujian
1. **Unit Testing**:
   - Menguji komponen individual seperti DecisionPolicyEngine, DecisionKernel, OverrideManager
   - Menggunakan mocked Rule Engine results dan Policy Context
   - Menguji logika keputusan berbagai skenario
   - Menguji fungsi override dan exception handling

2. **Integration Testing**:
   - Menguji interaksi antara DecisionRepository, DecisionService, dan komponen terkait
   - Menguji alur lengkap dari penerimaan hasil Rule Engine hingga pengembalian keputusan akhir
   - Menguji integrasi dengan Workflow Engine melalui pesan atau panggilan API

3. **Decision-Based Testing**:
   - Membuat skenario aplikasi yang mewakili berbagai kombinasi hasil Rule Engine dan konteks kebijakan
   - Memastikan bahwa keputusan yang dihasilkan konsisten dengan ekspektasi berdasarkan prinsip sistem
   - Uji regresi setiap kali ada perubahan pada logika keputusan atau konfigurasi kebijakan

4. **Override and Exception Testing**:
   - Membuat skenario yang secara sengaya memicu kondisi override dan exception
   - Memastikan bahwa mekanisme override berfungsi sesuai dengan ekspektasi
   - Uji batasan dan kondisi yang ditetapkan untuk override
   - Uji audit trail untuk override

5. **Performance Testing**:
   - Menguji waktu respons untuk pengambilan keputusan satu aplikasi
   - Menguji throughput dalam skenario beban tinggi
   - Menguji konsumsi memori selama pembuatan keputusan berulang

6. **Security Testing**:
   - Menguji kerentanan terhadap injection attacks (melalui input aplikasi atau parameter)
   - Menguji akses tidak berotorisasi ke fungsi manajemen keputusan
   - Menguji keasilan data dan audit trail
   - Menguji bahwa AI tidak dapat membuat keputusan approve/reject langsung

### Strategi Pengujian Keputusan
1. **Boundary Value Testing**:
   - Uji nilai di atas, tepat pada, dan di bawah ambang batas kritis
   - Contoh: Untuk rule dengan ambang batas 200 juta, uji dengan 199.999.999, 200.000.000, 200.000.001

2. **Equivalence Partitioning**:
   - Bagi ruang input (kombinasi rekomendasi Rule Engine) menjadi kelas yang perilaku harapan sama
   - Uji satu representasi dari setiap kelas

3. **State-Based Testing**:
   - Uji transisi antar-status keputusan (misal: dari REQUIRE_REVIEW ke APPROVE setelah override)
   - Uji efek perubahan status pada evaluasi keputusan

4. **Path Testing**:
   - Untuk keputusan dengan logika kompleks (banyak conditional overrides, dll.), pastikan semua jalur kode dieksekusi setidaknya sekali

## Dokumentasi dan Pelatihan

### Dokumentasi Pengguna
1. **Panduan Pengguna Decision Engine untuk Analis dan Manajemen**:
   - Cara membaca dan memahami hasil keputusan
   - Cara memahami penjelasan yang disediakan
   - Cara menggunakan informasi dari keputusan dalam proses selanjutnya
   - Prosedur untuk meminta override atau review ulang

2. **Panduan Teknis untuk Tim Pengembang**:
   - Arsitektur dan komponen Decision Engine
   - Panduan untuk menambah tipe logika keputusan baru
   - Panduan untuk optimasi kinerja
   - Panduan untuk troubleshooting masalah umum

3. **Panduan Kepatuhan untuk Tim Audit dan Kepatuhan**:
   - Cara membaca audit trail keputusan
   - Cara memvalidasi bahwa keputusan sesuai dengan peraturan
   - Cara menggunakan data keputusan untuk laporan kepatuhan

### Materi Pelatihan
1. **Pelatihan Dasar Pengambilan Keputusan Sistem**:
   - Konsep dan prinsip dasar keputusan dalam sistem
   - Memahami hubungan antara Rule Engine, kebijakan, dan keputusan
   - Pemahaman dasar tentang explainability dan audit trail

2. **Pelatihan Lanjutan Penulisan Logika Keputusan**:
   - Cara menulis logika keputusan yang efektif dan efisien
   - Mengenali dan menghindari ketika umum dalam pembentukan logika keputusan
   - Teknik untuk membuat logika keputusan yang mudah dipahami dan dipelihara

3. **Pelatihan Pemecahan Masalah**:
   - Cara menginterpretasikan hasil keputusan yang tidak diharapkan
   - Teknik untuk menyusap dan memperbaiki logika keputusan yang bermasalah
   - Metode untuk menganalisis efektivitas keputusan berdasarkan hasil aktual

## Pendekatan Implementasi dan Pengembangan

### Fase 1: Fondasi Decision Engine
- Implementasi model data dasar untuk keputusan dan log mereka
- Pengembangan core decision policy engine untuk menerapkan hierarki keputusan
- Implementasi antarmuka dasar untuk menerima hasil Rule Engine dan konteks kebijakan
- Pengembangan penjelasan generator dasar
- Pembuatan integrasi dasar dengan Rule Engine dan Policy Engine

### Fase 2: Fitur Lanjutan
- Implementasi decision kernel dengan dukungan untuk berbagai tipe logika keputusan
- Pengembangan override dan exception management lengkap
- Implementasi decision logging dan audit trail yang komprehensif
- Pengembangan integrasi dengan workflow engine
- Peningkatan penjelasan generator dengan dukungan untuk versi teknis dan bisnis

### Fase 3: Fitur Enterprise
- Implementasi alur kerja persetujuan untuk override
- Pengembangan templat keputusan untuk penggunaan ulang yang cepat
- Integrasi dengan sistem notifikasi dan peringatan keputusan
- Peningkatan kapasitor raportasi dan analitik
- Implementasi kontrol akses berbasis peran yang lebih halus

## Pertimbangan untuk Masa Depan

### Integrasi dengan Kecerdasan Buatan
1. **Decision Recommendation Engine**:
   - Sistem yang menggunakan machine learning untuk menyuggestikan keputusan berdasarkan hasil historis
   - Analisis pola keputusan untuk mengidentifikasi area yang mungkin perlu penyesuaian logika keputusan
   - **Penting**: Rekomendasi AI hanya boleh digunakan sebagai input untuk peningkatan logika keputusan, bukan untuk membuat keputusan langsung

2. **Dynamic Decision Logic Adjustment**:
   - Logika keputusan yang dapat menyesuaikan parameter tertentu secara otomatis berdasarkan hasil historis
   - Sistem yang memantau kinerja dan mengusulkan penyesuaian untuk optimalisasi keputusan

### Enhanced Governance dan Compliance
1. **Automated Decision Compliance Checking**:
   - Sistem yang secara otomatis memeriksa keputusan terhadap regulasi yang relevan
   - Peringatan ketika keputusan berpotensi melanggar persyaratan perbankan

2. **Decision Impact Simulation Lanjutan**:
   - Simulasi yang menggunakan model ekonomi makro untuk memproyeksikan dampak perubahan logika keputusan
   - Analisis skenario untuk memahami efek keputusan dalam berbagai kondisi masa depan

### Pengalaman Pengguna yang Ditingkatkan
1. **Visual Decision Builder**:
   - Antarmuka drag-and-drop untuk membangun logika keputusan secara visual
   - Peta hubungan yang jelas menunjukkan alur logika dan poin keputusan

2. **Natural Decision Definition**:
   - Kemampuan untuk mendefinisikan aspek tertentu dari logika keputusan menggunakan bahasa natural
   - Konversi otomatis dari bahasa natural ke struktur logika keputusan formal

3. **Collaborative Decision Development**:
   - Fasilitas untuk kolaborasi tim dalam pengembangan dan review logika keputusan
   - Komentaring dan review system yang terintegrasi
   - Change tracking dengan tingkat detail yang lebih tinggi

## Kesimpulan
Decision Engine merupakan komponen kritis yang menjamin bahwa keputusan kredit dibuat berdasarkan aturan yang jelas, transparan, dan dapat dipertanggungjawabkan. Dengan memisahkan logika keputusan dari kode aplikasi dan mengembangkannya sebagai konfigurasi yang dapat diatur, sistem mencapai keputusan yang konsisten sesuai dengan prinsip-prinsip sistem, sementara tetap memberikan fleksibilitas untuk pengecualian yang terkontrol melalui mekanisme override yang terlengkap dengan audit trail.

Implementasi Decision Engine yang kuat memungkinkan organisasi untuk:
1. Memastikan bahwa semua keputusan kredit dibuat berdasarkan Rule Engine sebagai sumber keputusan
2. Menyediakan transparansi dan akuntabilitas yang diperlukan untuk kepatuhan regulasi dan audit internal
3. Mengizinkan pengecualian yang terkontrol dan dapat diukur melalui mekanisme override yang terlengkap
4. Menyediakan fondasi yang kuat untuk pertumbuhan dan evolusi sistem kredit menjadi lebih cerdas, responsif, dan efektif dalam menyeimbangkan otomatisasi dengan penilaian manusia yang diperlukan
5. Menciptakan sistem yang dapat dipercaya oleh pemangku kepentingan karena keputusan dibuat berdasarkan aturan yang jelas dan dapat divalidasi, bukan berdasarkan opini subjektif atau black box AI

Sebagai salah satu dari tiga pilar utama sistem (bersama dengan Rule Engine dan Policy Engine), Decision Engine memastikan bahwa keputusan kredit dibuat tidak hanya berdasarkan aturan teknis, tetapi juga dalam konteks strategis yang tepat, membuatnya sebuah komponen yang tak tergantikan dalam mencapai visi Sistem Analisa Kredit sebagai AI Credit Operating System yang sepenuhnya terintegrasi dan berkualitas tinggi.