# 02_ARCHITECTURE.md

# High Level Architecture

## Sistem Overview
Platform ini menggunakan arsitektur microservice dengan setiap layanan berkomunikasi melalui REST API.

## Microservices Architecture

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

## Teknologi Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 15
- **Authentication**: JWT
- **Authorization**: RBAC (Role-Based Access Control)
- **API**: REST dengan OpenAPI/Swagger documentation

### Frontend
- **Framework**: React
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: React Hooks (useState, useEffect, useContext)
- **HTTP Client**: Custom utility layer (bukan fetch langsung)

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Object Storage**: MinIO (S3-compatible)
- **Real-time Communication**: WebSocket (untuk notifikasi real-time)
- **AI Services**: Llama.cpp server (3 instance untuk VLM, embedding, dan LLM)
- **Message Queue**: Untuk operasi background (jika diperlukan)

## Arsitektur Dalam Setiap Service

### Clean Architecture
Setiap microservice mengikuti prinsip Clean Architecture:
- **Entities**: Bisnis object yang universelle
- **Use Cases**: Kasus penggunaan bisnis
- **Interface Adapters**: Controller, Presenters, Gateway
- **Frameworks & Drivers**: Framework, Driver, Tools

### Domain-Driven Design (DDD)
- Setiap service memiliki bounded context yang jelas
- Entities dan Value Objects didefinisikan sesuai domain
- Repository pattern untuk abstraksi data access
- Service layer untuk logika bisnis

### Kommunikasi Antar-Service
- REST API sebagai protokol utama
- Message queue untuk event-driven communication (sesuai kebutuhan)
- Shared kernel untuk konstanta dan tipe data yang bersama
- Anti-corruption layer untuk integrasi dengan sistem legacy

## Alur Data Utama

### Alur Pengajuan Kredit
1. AO membuat pengajuan kredit melalui frontend
2. Data disimpan ke database melalui pengajuan-service
3. AO mengupload dokumen ke MinIO
4. OCR service memproses dokumen
5. Document service mengelola metadata dokumen
6. Financial service menganalisis data keuangan
7. Rule engine menerapkan aturan kredit
8. Policy engine menerapkan kebijakan produk
9. AI Credit Analyst memberikan rekomendasi
10. Workflow service mengelola approval process
11. Komite memberikan keputusan akhir
12. Disbursement service mengatur pencairan dana
13. Monitoring service memantau kredit yang sudah dicairkan
14. Early Warning System mendeteksi risiko dini

### Alur Survey
1. AO membuat survey di lapangan
2. Data survey disimpan ke survey-service
3. Survey lingkungan dan usaha disimpan ke tabel terpisah
4. Data digunakan untuk analisis kredit

### Alur Pengajuan MAK
1. Sistem menghasilkan Memorandum Analisa Kredit otomatis
2. Data diambil dari berbagai service (analisa, financial, dll)
3. Template diaplikasikan berdasarkan jenis kredit
4. Hasil disimpan sebagai dokumen di MinIO
5. Notifikasi dikirim ke pihak yang berkepentingan

## Keamanan

### Authentication & Authorization
- JWT tokens dengan akses token (8 jam) dan refresh token (7 hari)
- Password di-hash menggunakan bcrypt
- Role-Based Access Control (RBAC) yang ketat
- Setiap endpoint dilindungi oleh middleware autentikasi
- Akses berbasis role sesuai matriks otorisasi

### Data Protection
- Enkripsi data sensitif (NIK, data keuangan) menggunakan ENCRYPTION_KEY
- HTTPS hanya untuk semua komunikasi
- File upload hanya ke MinIO, tidak ke filesystem lokal
- Audit trail lengkap di tabel audit_logs
- Backup dan disaster recovery terencana

### API Security
- Validasi input pada semua endpoint
- Rate limiting untuk mencegah abuse
- CORS yang dikonfigurasi dengan benar
- Security headers (Helmet atau setara)
- Sanitasi output untuk mencegah XSS

## Skalabilitas dan Performa

### Horizontal Scaling
- Setiap service dapat diskalakan secara horizontal
- Load balancing melalui Nginx
- Database connection pooling
- Stateless services untuk memudahkan scaling

### Caching
- Redis untuk caching yang sesuai (jika diperlukan)
- HTTP caching headers untuk assets statis
- Template caching untuk MAK generation

### Database Performance
- Indeks yang tepat untuk query yang sering digunakan
- Connection pooling
- Read replicas untuk laporan (jika diperlukan)
- Partiisi tabel besar jika diperlukan

## Monitoring dan Logging

### Logging
- Structured logging di semua service
- Audit logs untuk semua perubahan data
- Error logging dengan stack trace
- Performance logging untuk monitoring latency
- Log aggregation menggunakan ELK stack atau sejenisnya

### Monitoring
- Health check endpoint untuk setiap service
- Metrics collection (request rate, error rate, response time)
- Business metrics (jumlah pengajuan, approval rate, dsb.)
- Alerting untuk sistem down atau performance degradation
- Dashboard monitoring menggunakan Grafana atau sejenisnya

## Testing Strategy

### Unit Testing
- Minimal 80% coverage untuk business logic
- Mocking untuk external dependencies
- Test case untuk edge cases dan error conditions

### Integration Testing
- Test antar-layer dalam satu service
- Test database interactions
- Test API endpoints dengan database test

### End-to-End Testing
- Critical user journey testing
- Cross-service workflow testing
- UI testing untuk kritikal paths

### Performance Testing
- Load testing untuk puncak beban
- Stress testing untuk menemukan breakpoint
- Soak testing untuk memory leak detection

## Deployment Strategy

### Development
- Docker Compose untuk seluruh stack
- Hot reload untuk frontend development
- Local database dan MinIO untuk development
- Lokal llama-server untuk AI development

### Staging
- Mirror dari produksi
- Automated deployment dari branch develop
- Integrated testing sebelum produksi

### Production
- Blue-green deployment atau rolling update
- Database migration yang aman
- Health checks sebelum traffic dialihkan
- Rollback plan yang teruji

## Integrasi Sistem Eksternal

### OJK / POJK / SEOJK
- Laporan reguler sesuai regulasi
- Real-time reporting jika diperlukan oleh regulator
- Audit trail yang sesuai standar perbankan

### Sistem Perbankan Lain
- SLIK (Sistem Informasi Layanan Kredit)
- Sistem BI Checking
- Sistem pelaporan ke OJK
- Sistem intern perbankan lain (jika ada)

### Layanan Third Party
- OCR service (Google Vision API, Tesseract, atau custom model)
- SMS gateway (untuk notifikasi)
- Email service (SendGrid, SMTP, atau layanan serupa)
- Payment gateway (jika diperlukan untuk administrasi)

## Evolusi Arsitektur

### Rencana Masa Depan
- Event-driven architecture dengan message queue (Apache Kafka/RabbitMQ)
- Microservice mesh dengan service Istio/Linkerd
- Event sourcing untuk audit trail yang lebih baik
- CQRS untuk operasi baca/write yang kompleks
- Machine learning model serving untuk fitur AI lanjutan

### Teknologi yang Dipertimbangkan
- GraphQL untuk API yang lebih efisien
- WebSocket untuk real-time collaboration
- Serverless functions untuk pekerjaan spesifik
- Graph database untuk relationship analysis yang kompleks