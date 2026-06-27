# KNOWLEDGE_SERVICE.md

# Modul Knowledge Service

## Gambaran Umum
Modul Knowledge Service bertanggung jawab untuk mengelola, mengindeks, dan menyediakan akses ke seluruh pengetahuan organisasi yang relevan dengan analisis kredit. Knowledge Service berfungsi sebagai otak pengetahuan sistem yang memastikan bahwa setiap rekomendasi atau analisis yang dihasilkan AI Credit Analyst didasari oleh sumber yang terverifikasi dan dapat diatribusikan.

## Tujuan Utama
1. Mengumpulkan dan mengelola seluruh pengetahuan kredit yang relevan
2. Mengindeks pengetahuan untuk pencarian yang efisien dan akurat
3. Menyediakan akses terstruktur ke pengetahuan untuk komponen AI
4. Memastikan bahwa setiap output AI memiliki atribusi sumber yang jelas
5. Mendukung versioning dan pengelolaan siklus hidup pengetahuan
6. Memfasilitasi pembelajaran berkelanjutan dari pengalaman operasional
7. Menjaga konsistensi penerapan pengetahuan di seluruh organisasi

## Prinsip Dasar
- **Source of Truth**: Knowledge Service adalah sumber tunggal untuk semua pengetahuan yang digunakan sistem
- **Verifiable Sources**: Semua pengetahuan harus berasal dari sumber yang terverifikasi dan berwenang
- **Traceability**: Setiap piece of knowledge harus dapat dilacak kembali ke sumber aslinya
- **Version Control**: Perubahan pengetahuan harus memiliki versioning dan audit trail
- **Quality Assurance**: Proses review dan validasi pengetahuan sebelum dipublikasikan
- **Accessibility**: Pengetahuan harus mudah diakses oleh komponen yang membutuhkan dalam format yang sesuai
- **Currency**: Pengetahuan harus selalu diperbarui sesuai dengan perubahan regulasi dan kebijakan

## Jenis Pengetahuan yang Dikelola

### 1. Regulatory Knowledge
- **Peraturan OJK**: Peraturan Otoritas Jasa Keuangan yang relevan dengan kredit
- **SEOJK**: Surat Edaran OJK yang memberikan pedoman implementasi
- **Peraturan BI**: Peraturan Bank Indonesia yang relevan
- **UU Perbankan**: Undang-Undang yang mengatur kegiatan perbankan
- **Internasional Standards**: Basel Accords, IFRS, dll. jika berlaku

### 2. Internal Policy Knowledge
- **Kebijakan Kredit**: Dokumen kebijakan kredit yang disetujui direksi
- **SOP Operasional**: Standard Operating Procedure untuk berbagai proses kredit
- **Pedoman Analis**: Panduan teknis untuk analis kredit
- **Pedoman AO**: Panduan untuk Account Officer
- **Prosedur Approval**: Alur dan persyaratan approval untuk berbagai level

### 3. Domain Knowledge
- **Credit Analysis Methodology**: Metodologi analisis kredit yang berlaku
- **Financial Statement Analysis**: Teknik analisis laporan keuangan
- **Collateral Valuation**: Metode penilaian agunan
- **Industry Analysis**: Analisis sektor dan industri
- **Risk Assessment Framework**: Kerangka penilaian risiko
- **Scoring Models**: Penjelasan model skoring yang digunakan

### 4. Product Knowledge
- **Produk Kredit**: Spesifikasi setiap produk kredit
- **Syarat dan Ketentuan**: Terms and conditions untuk setiap produk
- **Bunga dan Biaya**: Struktur pricing untuk setiap produk
- **Limit dan Authority**: Batas wewenang untuk setiap level approver
- **Promotional Terms**: Syarat promosi khusus yang berlaku

### 5. Historical Knowledge
- **Case Studies**: Studi kasus dari pengajuan yang representatif
- **Lessons Learned**: Pelajaran dari kasus yang berhasil dan gagal
- **Best Practices**: Praktik terbaik yang teridentifikasi dari operasional
- **Common Pitfalls**: Kesalahan umum yang harus dihindari
- **Appeal Patterns**: Pola yang sering menjadi dasar approval/rejection

### 6. External Knowledge
- **Industry Reports**: Laporan industri dari sumber terpercaya
- **Economic Indicators**: Indikator ekonomi makro yang relevan
- **Market Trends**: Tren pasar yang mempengaruhi penilaian kredit
- **Competitive Analysis**: Analisis kompetitif untuk positioning
- **Technology Trends**: Tren teknologi yang mempengaruhi industri

## Struktur Pengetahuan

### Hierarchical Organization
```
Knowledge Base
├── Regulatory Layer
│   ├── OJK Regulations
│   ├── BI Regulations
│   ├── Banking Law
│   └── International Standards
├── Policy Layer
│   ├── Credit Policies
│   ├── Operational Procedures
│   ├── Approval Guidelines
│   └── Risk Frameworks
├── Methodology Layer
│   ├── Analysis Methods
│   ├── Scoring Models
│   ├── Valuation Techniques
│   └── Risk Assessment
├── Product Layer
│   ├── Consumer Loans
│   ├── Productive Loans
│   ├── Working Capital
│   ├── Investment Loans
│   └── Multi-purpose Loans
├── Domain Layer
│   ├── Industry Analysis
│   ├── Financial Statement Analysis
│   ├── Collateral Types
│   └── Risk Factors
└── Historical Layer
    ├── Case Studies
    ├── Lessons Learned
    ├── Best Practices
    └── Common Patterns
```

### Knowledge Representation
Setiap unit pengetahuan direpresentasikan dengan struktur:

```
Knowledge Item:
- Knowledge ID (unique identifier)
- Title (descriptive title)
- Category (regulatory, policy, methodology, etc.)
- Subcategory (more specific classification)
- Content (the actual knowledge content)
- Source (where it came from)
- Source Document Reference (specific document reference)
- Effective Date (when it became applicable)
- Expiration Date (when it expires, if applicable)
- Version (for versioning)
- Status (DRAFT, PUBLISHED, DEPRECATED, ARCHIVED)
- Tags (for search and categorization)
- Related Knowledge (links to related items)
- Confidence Score (how certain we are about this knowledge)
- Review Status (needs review, reviewed, approved)
- Reviewed By (who reviewed it)
- Reviewed At (when it was reviewed)
- Metadata (additional information)
```

## Komponen Utama

### 1. Knowledge Ingestion Pipeline
Komponen untuk menerima dan memproses pengetahuan dari berbagai sumber.

#### Fungsi Utama:
- Menerima dokumen dalam berbagai format (PDF, Word, HTML, teks)
- Melakukan OCR jika diperlukan untuk dokumen yang discan
- Mengekstrak teks dari berbagai format dokumen
- Melakukan parsing dan structuring dari konten
- Mengidentifikasi metadata (judul, tanggal, penulis, dll.)
- Menghasilkan embedding untuk content-based search
- Menyimpan pengetahuan terstruktur ke database

#### Sumber Input:
- Upload manual oleh pengguna
- Integrasi dengan document management system
- Import dari sistem eksternal (jika ada)
- Automated scraping dari sumber terpercaya (jika diizinkan)

### 2. Knowledge Processing Engine
Komponen untuk memproses dan mengekstrak pengetahuan dari konten mentah.

#### Fungsi Utama:
- Text extraction dan cleaning
- Semantic parsing untuk ekstraksi informasi terstruktur
- Entity recognition (produk, regulasi, prosedur, dll.)
- Relationship extraction (hubungan antar konsep)
- Summarization untuk konten yang panjang
- Classification dan tagging otomatis
- Duplicate detection dan merging
- Version detection untuk dokumen yang diperbarui

### 3. Knowledge Storage
Sistem penyimpanan terstruktur untuk pengetahuan.

#### Storage Components:
- **Metadata Store**: Database terstruktur untuk metadata pengetahuan
- **Content Store**: Penyimpanan untuk konten lengkap (file system atau object storage)
- **Vector Store**: Database vektor untuk similarity search (misal: Pinecone, Weaviate, atau PostgreSQL dengan pgvector)
- **Index Store**: Indeks terbalik untuk pencarian berbasis kata kunci
- **Relationship Store**: Graf atau tabel untuk menyimpan hubungan antar pengetahuan

### 4. Knowledge Retrieval
Sistem untuk mencari dan mengambil pengetahuan yang relevan.

#### Retrieval Methods:
- **Keyword Search**: Pencarian berbasis kata kunci
- **Semantic Search**: Pencarian berbasis makna menggunakan embedding
- **Hybrid Search**: Kombinasi keyword dan semantic search
- **Filtered Search**: Pencarian dengan filter (kategori, tanggal, status, dll.)
- **Context-Aware Search**: Pencarian yang mempertimbangkan konteks aplikasi
- **Faceted Search**: Pencarian dengan facet untuk navigasi

#### Ranking and Relevance:
- Scoring berdasarkan relevance dengan query
- Boost berdasarkan freshness (date lebih baru = lebih tinggi)
- Boost berdasarkan authority (sumber resmi = lebih tinggi)
- Personalization berdasarkan peran pengguna
- Context boosting berdasarkan konteks aplikasi

### 5. Knowledge Integration
Komponen untuk mengintegrasikan pengetahuan dengan sistem lain.

#### Integrasi dengan AI Credit Analyst:
- Menyediakan knowledge context untuk prompt engineering
- Mengembalikan pengetahuan relevan berdasarkan konteks aplikasi
- Memverifikasi bahwa output AI memiliki atribusi sumber yang benar
- Meng-update pengetahuan berdasarkan feedback dari analis

#### Integrasi dengan Rule Engine:
- Menyediakan referensi regulasi dan kebijakan untuk aturan
- Memvalidasi bahwa aturan sesuai dengan pengetahuan yang berlaku
- Mengidentifikasi konflik antara aturan dan pengetahuan

#### Integrasi dengan Policy Engine:
- Menyediakan konteks kebijakan berdasarkan pengetahuan organisasi
- Memastikan bahwa kebijakan selaras dengan regulasi dan SOP
- Meng-update kebijakan berdasarkan perubahan pengetahuan

### 6. Knowledge Versioning dan Lifecycle
Manajemen versi dan siklus hidup pengetahuan.

#### Versioning Strategy:
- Setiap perubahan pengetahuan menciptakan versi baru
- Versi dapat berupa: major, minor, patch
- Version history dipertahankan untuk audit dan rollback
- Support untuk draft, review, dan publish workflow

#### Lifecycle States:
- **Draft**: Sedang dibuat atau direvisi
- **Under Review**: Menunggu persetujuan
- **Published**: Aktif dan dapat digunakan
- **Deprecated**: Tidak berlaku lagi tetapi dipertahankan untuk referensi
- **Archived**: Diarsipkan untuk retention purposes

#### Review and Approval:
- Prosedur review untuk pengetahuan baru atau yang diubah
- Approval hierarchy berdasarkan sensitivitas pengetahuan
- Automated validation untuk konsistensi
- Notification untuk stakeholder saat ada perubahan penting

### 7. Knowledge Quality Management
Komponen untuk memastikan kualitas pengetahuan.

#### Quality Dimensions:
- **Accuracy**: Ketepatan informasi
- **Completeness**: Kelengkapan informasi
- **Consistency**: Konsistensi dengan pengetahuan lain
- **Currency**: Keaktualan informasi
- **Relevance**: Kesesuaian dengan konteks penggunaan
- **Authority**: Kredibilitas sumber

#### Quality Processes:
- Regular review dan update
- Feedback collection dari pengguna
- Automated validation rules
- Conflict detection dengan pengetahuan lain
- Usage tracking untuk identifikasi stale knowledge

## Implementasi Teknis

### Basis Data Skema

#### Tabel Knowledge Items
```sql
CREATE TABLE knowledge_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    knowledge_type VARCHAR(50) NOT NULL,  -- REGULATORY, POLICY, METHODOLOGY, PRODUCT, DOMAIN, HISTORICAL
    source VARCHAR(200) NOT NULL,
    source_document_ref VARCHAR(200),
    source_url VARCHAR(500),
    author VARCHAR(200),
    effective_date DATE NOT NULL,
    expiration_date DATE,
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'UNDER_REVIEW', 'PUBLISHED', 'DEPRECATED', 'ARCHIVED')),
    confidence_score NUMERIC(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    review_status VARCHAR(20) DEFAULT 'PENDING' CHECK (review_status IN ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    tags TEXT[],  -- Array of tags
    related_knowledge UUID[],  -- Array of related knowledge item IDs
    embedding VECTOR(1536),  -- Vector embedding untuk semantic search
    search_vector TSVECTOR,  -- Full text search vector
    metadata JSONB,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_knowledge_items_category ON knowledge_items(category);
CREATE INDEX idx_knowledge_items_type ON knowledge_items(knowledge_type);
CREATE INDEX idx_knowledge_items_status ON knowledge_items(status);
CREATE INDEX idx_knowledge_items_effective ON knowledge_items(effective_date, expiration_date);
CREATE INDEX idx_knowledge_items_embedding ON knowledge_items USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_knowledge_items_search ON knowledge_items USING gin(search_vector);
CREATE INDEX idx_knowledge_items_tags ON knowledge_items USING gin(tags);
```

#### Tabel Knowledge Relationships
```sql
CREATE TABLE knowledge_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL,  -- REFERENCES, SUPERSEDES, RELATED_TO, CONFLICTS_WITH, etc.
    strength NUMERIC(3, 2) DEFAULT 1.0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_knowledge_rels_source ON knowledge_relationships(source_id);
CREATE INDEX idx_knowledge_rels_target ON knowledge_relationships(target_id);
CREATE INDEX idx_knowledge_rels_type ON knowledge_relationships(relationship_type);
```

#### Tabel Knowledge Reviews
```sql
CREATE TABLE knowledge_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_id UUID NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    review_status VARCHAR(20) NOT NULL CHECK (review_status IN ('APPROVED', 'REJECTED', 'NEEDS_REVISION')),
    review_comments TEXT,
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    previous_version VARCHAR(20),
    changes_summary TEXT
);

-- Indexes
CREATE INDEX idx_knowledge_reviews_knowledge ON knowledge_reviews(knowledge_id);
CREATE INDEX idx_knowledge_reviews_reviewer ON knowledge_reviews(reviewer_id);
CREATE INDEX idx_knowledge_reviews_status ON knowledge_reviews(review_status);
```

#### Tabel Knowledge Access Log
```sql
CREATE TABLE knowledge_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_id UUID NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
    accessed_by UUID NOT NULL REFERENCES users(id),
    access_type VARCHAR(50) NOT NULL,  -- VIEW, DOWNLOAD, CITE, EXPORT
    access_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    context JSONB,  -- Context dari mana pengetahuan diakses
    ip_address INET,
    user_agent TEXT
);

-- Indexes
CREATE INDEX idx_knowledge_access_knowledge ON knowledge_access_logs(knowledge_id);
CREATE INDEX idx_knowledge_access_user ON knowledge_access_logs(accessed_by);
CREATE INDEX idx_knowledge_access_timestamp ON knowledge_access_logs(access_timestamp);
```

### Layanan Utama
1. **KnowledgeIngestionService**:
   - Menerima dan memproses dokumen masuk
   - Melakukan OCR, text extraction, dan parsing
   - Membuat embedding untuk konten
   - Menyimpan pengetahuan terstruktur

2. **KnowledgeRetrievalService**:
   - Mencari pengetahuan berdasarkan query
   - Menggabungkan keyword dan semantic search
   - Meranking hasil berdasarkan relevance
   - Memfilter berdasarkan kriteria yang diberikan

3. **KnowledgeManagementService**:
   - CRUD operations untuk knowledge items
   - Versioning dan lifecycle management
   - Approval workflow untuk pengetahuan baru
   - Duplicate detection dan merging

4. **KnowledgeValidationService**:
   - Memvalidasi kelengkapan dan konsistensi
   - Memeriksa konflik dengan pengetahuan lain
   - Mengidentifikasi stale knowledge
   - Menghitung quality scores

5. **KnowledgeIntegrationService**:
   - Menyediakan API untuk komponen lain
   - Mengintegrasikan dengan AI Credit Analyst
   - Mengintegrasikan dengan Rule Engine dan Policy Engine
   - Mengelola caching dan performance

6. **KnowledgeAnalyticsService**:
   - Melacak penggunaan pengetahuan
   - Menganalisis efektivitas pengetahuan
   - Mengidentifikasi gaps dalam pengetahuan
   - Melaporkan metrics untuk knowledge management

### API Endpoints
```
GET   /api/v1/knowledge/search              # Cari pengetahuan
GET   /api/v1/knowledge/{knowledgeId}       # Dapatkan pengetahuan tertentu
POST  /api/v1/knowledge                    # Buat pengetahuan baru
PUT   /api/v1/knowledge/{knowledgeId}       # Update pengetahuan
DELETE /api/v1/knowledge/{knowledgeId}      # Hapus/archive pengetahuan

GET   /api/v1/knowledge/categories          # Daftar kategori
GET   /api/v1/knowledge/types               # Daftar tipe pengetahuan
GET   /api/v1/knowledge/popular             # Pengetahuan yang sering diakses

POST  /api/v1/knowledge/{knowledgeId}/review # Ajukan untuk review
POST  /api/v1/knowledge/{knowledgeId}/publish # Publikasikan pengetahuan
POST  /api/v1/knowledge/{knowledgeId}/deprecate # Deprecate pengetahuan

GET   /api/v1/knowledge/related/{knowledgeId} # Pengetahuan terkait
GET   /api/v1/knowledge/versions/{knowledgeId} # Versi pengetahuan
```

## Integrasi dengan AI Credit Analyst

### Prompt Context Generation
Knowledge Service menyediakan konteks untuk prompt engineering:

```javascript
// Contoh: Mendapatkan knowledge context untuk analisis 5C
async function getKnowledgeContextFor5CAnalysis(application) {
    const relevantKnowledge = await knowledgeService.search({
        query: '5C analysis framework character capacity capital collateral condition',
        categories: ['METHODOLOGY', 'POLICY'],
        productTypes: [application.productType],
        limit: 10,
        minConfidenceScore: 0.7
    });
    
    return {
        regulatoryFramework: relevantKnowledge
            .filter(k => k.category === 'REGULATORY')
            .map(k => ({ title: k.title, content: k.content, source: k.source })),
        methodology: relevantKnowledge
            .filter(k => k.category === 'METHODOLOGY')
            .map(k => ({ title: k.title, content: k.content, source: k.source })),
        internalPolicies: relevantKnowledge
            .filter(k => k.knowledgeType === 'POLICY')
            .map(k => ({ title: k.title, content: k.content, source: k.source })),
        bestPractices: relevantKnowledge
            .filter(k => k.knowledgeType === 'HISTORICAL')
            .map(k => ({ title: k.title, content: k.content, source: k.source }))
    };
}
```

### Output Validation
Knowledge Service memvalidasi output AI:

```javascript
// Contoh: Memvalidasi atribusi sumber dalam output AI
async function validateAIOutputCitations(aiOutput) {
    const citedSources = extractCitations(aiOutput);  // Extract source mentions from AI output
    
    for (const citation of citedSources) {
        const knowledgeItem = await knowledgeService.findByTitle(citation.title);
        
        if (!knowledgeItem) {
            return {
                isValid: false,
                error: `Source "${citation.title}" not found in knowledge base`,
                suggestion: await knowledgeService.searchSimilar(citation.title)
            };
        }
        
        if (knowledgeItem.status !== 'PUBLISHED') {
            return {
                isValid: false,
                error: `Source "${citation.title}" is not published (status: ${knowledgeItem.status})`,
                suggestion: 'Use only published knowledge items as citations'
            };
        }
    }
    
    return { isValid: true };
}
```

## Kualitas dan Pengukuran

### Quality Metrics
1. **Coverage**: Persentase query yang mendapatkan jawaban yang memadai
2. **Relevance**: Rata-rata relevance score untuk hasil pencarian
3. **Freshness**: Persentase pengetahuan yang masih dalam status PUBLISHED dan belum expired
4. **Accuracy**: Persentase pengetahuan yang telah melalui review dan approved
5. **Usage**: Berapa sering setiap pengetahuan diakses
6. **Citation Accuracy**: Persentase kutipan yang valid dalam output AI

### Continuous Improvement
- Collect feedback dari pengguna tentang kualitas pengetahuan
- Track knowledge gaps yang dilaporkan oleh pengguna
- Analyze search patterns untuk identifikasi kebutuhan pengetahuan baru
- Monitor citation accuracy untuk identifikasi pengetahuan yang perlu diperbarui

## Keamanan dan Kontrol Akses

### Access Control
- **Public Knowledge**: Diakses oleh semua pengguna (produk, prosedur umum)
- **Internal Knowledge**: Hanya staf internal (SOP, pedoman internal)
- **Confidential Knowledge**: Hanya level tertentu (kebijakan sensitif, strategi)
- **Restricted Knowledge**: Hanya untuk role tertentu (keputusan rahasia, dll.)

### Data Protection
- Knowledge items dapat memiliki classification
- Access logging untuk semua akses pengetahuan sensitif
- Encryption untuk knowledge yang sangat sensitif
- Watermarking untuk dokumen yang di-download

## Kesimpulan
Knowledge Service merupakan komponen kunci yang menjamin bahwa seluruh operasi kredit didasari oleh pengetahuan yang terverifikasi, terstruktur, dan dapat dipertanggungjawabkan. Dengan mengelola seluruh pengetahuan organisasi dalam satu sistem yang terintegrasi, organisasi dapat mencapai konsistensi penerapan kebijakan, meningkatkan kualitas analisis, dan memenuhi persyaratan audit serta compliance.

Implementasi Knowledge Service yang efektif akan menjadi diferensiator kompetitif dalam hal kualitas analisis kredit, konsistensi keputusan, dan kemampuan untuk menjelaskan dasar setiap rekomendasi atau keputusan yang dihasilkan sistem.