# 09_ai_credit_analyst.md

# Modul AI Credit Analyst

## Gambaran Umum
Modul AI Credit Analyst merupakan komponen kecerdasan buatan yang dirancang untuk membantu analis kredit dalam melakukan analisis yang lebih mendalam, komprehensif, dan konsisten terhadap permohonan kredit. Menurut prinsip dasar sistem: "AI hanya bertugas membantu analis. AI wajib menghasilkan: Executive Summary, Analisa Usaha, Analisa Keuangan, Analisa Cash Flow, Analisa Modal Kerja, Analisa 5C, Analisa SWOT, Analisa Risiko, Mitigasi Risiko, Rekomendasi, Kesimpulan. AI tidak boleh: approve kredit, reject kredit, mengubah Rule Engine."

Modul ini bertindak sebagai decision support system yang memberikan wawasan dan rekomendasi, namun keputusan akhir tetap ditentukan oleh Rule Engine (dalam konteks kebijakan yang berlaku) dan/atau oleh manusia melalui proses approval workflow.

## Tujuan Utama
1. Meningkatkan kualitas dan konsistensi analisis kredit melalui penggunaan kecerdasan buatan
2. Mengurangi beban kerja administratif dan analitis yang berulang pada analis manusia
3. Menyediakan analisis yang lebih menyeluruh dan berbasis data daripada yang mungkin dicapai melalui analisis manual saja
4. Membantu mengidentifikasi pola dan tren yang mungkin tidak terlihat melalui analisis konvensional
5. Menyediakan dasar yang lebih objektif untuk pertimbangan manusia dalam proses pengambilan keputusan
6. Mengurangi variasi subjektif dalam analisis kredit antar-analis berbeda
7. Mempercepat proses analisis tanpa mengorbankan kualitas
8. Menyediakan konsistensi dalam penerapan metodologi analisis antara berbagai analis dan cabang

## Prinsip Dasar yang Wajib Diikuti

### 1. AI Hanya Membantu, Tidak Memutuskan
- AI tidak boleh memberikan keputusan akhir approve atau reject
- AI hanya memberikan analisis, wawasan, dan rekomendasi yang harus dianggap sebagai input bagi manusia atau Rule Engine
- Keputusan akhir harus selalu berasal dari Rule Engine (dalam konteks kebijakan) atau melalui proses approval umano

### 2. Explainability Wajib (Tidak Boleh Black Box)
Setiap output dari AI Credit Analyst harus mencantumkan:
- **Rule yang aktif dan memengaruhi rekomendasi**
- **Policy yang dipakai dalam konteks analisis**
- **Data yang digunakan untuk analys**
- **Confidence score (tingkat kepercayaan) dari hasil analisis**
- **Alasan di balik setiap rekomendasi atau kesimpulan**
- **Risiko yang teridentifikasi dalam analisis**
- **Mitigasi risiko yang disarankan**

### 3. Sumber Pengetahuan yang Jelas dan Terverifikasi
Setiap kesimpulan atau rekomendasi dari AI harus menyebutkan sumber pengetahuannya, termasuk:
- SOP Internal
- Kebijakan Kredit
- Peraturan Direksi
- POJK/SEOJK/OJK
- Manual Kredit
- Panduan AO/Panduan Analis
- Sumber lain yang relevan dan terverifikasi

### 4. Konsistensi dengan Rule Engine dan Kebijakan
- AI tidak boleh mendukung atau menyarankan hal yang melanggar aturan aktif dalam Rule Engine
- Analisis AI harus selalu dalam konteks kebijakan yang berlaku
- Ketika ada ketidaksesuaian antara saran AI dan hasil Rule Engine, ketidaksesuaian tersebut harus dijelaskan dengan jelas

### 5. Berkontribusi terhadap Pembelajaran Berkelanjutan
- Sistem harus memiliki mekanisme untuk belajar dari hasil aktual keputusan (secara anotasi dan dengan persetujuan)
- Pembelajaran harus dilakukan dengan cara yang tidak mengkompromisi prinsip explainability dan kepatuhan
- Model harus rutin dievaluasi untuk bias, accuracy, dan relevance

## Arsitektur dan Komponen Utama

### 1. Knowledge Base Management
Komponen yang bertanggung jawab untuk mengelola sumber pengetahuan yang digunakan oleh AI untuk menganalisis dan memberikan rekomendasi.

#### Fungsi Utama:
- Ingest dan pengelolaan dokumen sumber (SOP, peraturan, manual, dll.)
- Pemrosesan bahasa natural untuk ekstraksi pengetahuan terstruktur
- Penyimpanan dan indeksasi pengetahuan untuk pencarian yang efisien
- Version control dan managed updates untuk sumber pengetahuan
- Penilaian relevansi dan kualitas sumber pengetahuan

#### Teknologi yang Digunakan:
- Natural Language Processing (NLP) untuk memahami dokumen teks
- Embedding models (seperti yang berjalan di port 1977) untuk representasi semantik
- Vector database untuk pencarian kesamaan yang efisien
- Document management system untuk penyimpanan dan versi kontrol

### 2. Large Language Model (LLM) Interface
Komponen yang bertanggung jawab untuk berkomunikasi dengan model bahasa besar yang menghasilkan analisis dan rekomendasi.

#### Fungsi Utama:
- Mengirimkan prompt yang sesuai ke model bahasa
- Menerima dan memproses respons dari model bahasa
- Mengelola parameter seperti temperature, max tokens, dll.
- Implementasi fallback dan retry mechanism
- Token usage monitoring dan cost management
- Respons caching untuk pertanyaan yang sering diajukan

#### Teknologi yang Digunakan:
- LLM yang berjalan di port 1978 (Qwen3.5 atau model yang setara)
- API wrapper untuk komunikasi dengan model
- Prompt template management
- Respons parsing dan validation

### 3. Analysis Modules
Serangkaian modul yang masing-masing menangani aspek tertentu dari analisis kredit, masing-masing menggunakan kombinasi teknik teknik traditional NLP, knowledge-based reasoning, dan LLM generation.

#### 3.1 Executive Summary Modul
- Membuat ringkasan eksekutif yang mencaptur poin-poin penting dari analisis lengkap
- Menyajikan gambaran umum yang cepat dipahami untuk pengambil keputusan
- Menyoroti temuan kritis, risiko utama, dan rekomendasi utama

#### 3.2 Business Analysis Modul
- Menganalisis aspek-usaha dari nasabah meliputi:
  - Jenis dan jenis usaha
  - Lama berdirinya usaha
  - Struktur kepemilikan dan manajemen
  - Lokasi dan jangkauan pasar
  - Kompetitif dan diferensiasi
  - Prospects dan tantangan industri
  - Model pendapatan dan struktur biaya

#### 3.3 Financial Analysis Modul
- Menganalisis laporan keuangan yang diserahkan nasabah
- Menghitung dan menganalisis rasio keuangan kunci:
  - Likuiditas (Current Ratio, Quick Ratio)
  - Solvabilitas (Debt to Equity, Debt to Assets)
  - Profitabilitas (ROE, ROA, Net Profit Margin)
  - Efisiensi (Asset Turnover, Inventory Turnover)
- Mendeteksi anomaly atau inkonsistensi dalam laporan keuangan
- Membandingkan kinerja dengan standar industri atau benchmark

#### 3.4 Cash Flow Analysis Modul
- Menganalisis laporan arus kas jika tersedia
- Membangun proyeksi arus kas masa depan berdasarkan asumsi yang wajar
- Menilai kemampuan nasabah untuk menghasilkan arus kas yang cukup untuk melunasi utang
- Mengidentifikasi potensi ketidaksesuaian antara penerimaan dan pembayaran
- Menghitung metrik seperti Debt Service Coverage Ratio (DSCR)

#### 3.5 Working Capital Analysis Modul
- Menganalisis manajemen modal kerja nasabah
- Evaluasi komponen-komponen seperti:
  - Tagihan yang harus diterima (Accounts Receivable)
  - Persediaan (Inventory)
  - Utang yang harus dibayarkan (Accounts Payable)
- Menghitung konversi kas dan efektywitas penggunaan modal kerja
- Menganalisis kebijakan kredit dan tagihan yang berlaku

#### 3.6 5C Analysis Modul
Menganalisis lima dimensi klasik kredit worthiness:
- **Character**: Kepaduan dan reputasi nasabah
  - Riwayat kredit (SLIK, referensi perbankan, dll.)
  - Referensi pribadi dan profesional
  - Stabilitas tempat tinggal dan pekerjaan
  - Ketidakpatuhan hukum atau finansial dalam masa lalu
- **Capacity**: Kemampuan nasabah untuk melunasi utang
  - Analisis pendapatan dan arus kas
  - Debt service coverage
  - Stabilitas dan pertumbuhan pendapatan
- **Capital**: Jumlah modal sendiri yang diinvestasikan dalam usaha
  - Equity nasabah dalam usaha
  - Aset lain yang dapat dicairkan
  - Cadangan dana darurat
- **Collateral**: Aset yang dijadikan jaminan untuk kredit
  - Jenis, nilai, dan likuiditas aset jaminan
  - Rasio pinjaman terhadap nilai jaminan (LTV)
  - Kondisi dan lokasi aset jaminan
  - Hak tanggapan dan prioritas jalan
- **Condition**: Kondisi lingkungan usaha dan ekonomi makro
  - Tren industri dan pasar
  - Kondisi ekonomi lokal dan nasional
  - Regulasi dan kebijakan yang relevan
  - Pesaingan dan tantangan pasar

#### 3.7 SWOT Analysis Modul
Mengidentifikasi:
- **Strengths (Kekuatan)**: Sifat internal yang menguntungkan
- **Weaknesses (Kelemahan)**: Sifat internal yang menguntungkan
- **Opportunities (Peluang)**: Kondisi ekstern yang dapat dimanfaatkan
- **Threats (Ancaman)**: Kondisi ekstern yang mungkin merugikan

#### 3.8 Risk Analysis Modul
Mengidentifikasi dan menganalisis berbagai jenis risiko:
- **Credit Risk**: Risiko gagal bayar utang pokok dan bunga
- **Market Risk**: Risiko dari perubahan kondisi pasar yang mempengaruhi nilai aset atau pendapatan
- **Operational Risk**: Risiko dari kegagalan proses internal, sistem, atau sumber daya manusia
- **Liquidity Risk**: Risiko tidak dapat memenuhi kewajiban keuangan jangka pendek
- **Reputational Risk**: Risiko kerusakan reputasi akibat asosiasi dengan nasibah
- **Compliance Risk**: Risiko tidak mematuhi peraturan atau hukum yang berlaku

#### 3.9 Risk Mitigation Modul
Mengusulkan strategi untuk mengurangi atau mengelola risiko yang teridentifikasi:
- Strukturasi kredit yang berbeda (tenor, jumlah, jadwal pembayaran)
- Persyaratan jaminan tambahan atau jenis jaminan yang berbeda
- Ketentuan khusus dalam perjanjian kredit (covenants)
- Pemantauan dan laporan yang lebih ketat
- Program pembinaan atau asesoran bisnis
- Asuransi atau perlindungan lain yang relevan

#### 3.10 Rekomendasi dan Kesimpulan Modul
Menghasilkan:
- Rekomendasi spesifik berdasarkan analisis lengkap
- Pertimbangan yang mendasari rekomendasi tersebut
- Kesimpulan akhir yang merangkum seluruh analisis
- Clear statement tentang apa yang dimasukkan dan apa yang tidak termasuk dalam ruang lingkup analisis
- Pernyataan tentang batasan analisis dan area yang mungkin memerlukan penyelidikan lebih lanjut

### 4. Prompt Engineering dan Management
Komponen yang bertanggung jawab untuk membuat, mengelola, dan mengoptimasi prompt yang dikirimkan ke model bahasa.

#### Fungsi Utama:
- Pembuatan template prompt untuk setiap jenis analisis
- Dinamis penyisipan data dan konteks ke dalam template
- Optimasi prompt untuk kualitas, relevansi, dan efisiensi token
- Pengelolaan versi dan A/B testing untuk prompt
- Validasi hasil untuk kepatuhan dengan prinsip explainability dan sumber pengetahuan

### 5. Output Processing dan Validation
Komponen yang memproses dan memvalidasi respons dari model bahasa sebelum diserahkan kepada pengguna atau sistem lain.

#### Fungsi Utama:
- Parsing respons terstruktur dari output bebas bahasa alami
- Validasi bahwa semua bagian yang wajib ada hadir (executive summary, analisa masing-masing, dll.)
- Verifikasi bahwa sumber-sumber yang disebutkan ada dalam knowledge base
- Pemeriksaan bahwa confidence score berada dalam rentang yang wajar (0-1)
- Validasi bahwa tidak ada pernyataan yang melanggar prinsip-prinsip dasar (misalnya,AI tidak boleh memberi keputusan approve/reject)
- Format konsisten dan penyampaian dalam bahasa yang tepat

## Alur Kerja Utama

### 1. Persiapan dan Inisialisasi
Saat sistem mulai atau ketika ada pembaruan pada knowledge base:
1. Knowledge base di-load dan di-indeks untuk pencarian yang efisien
2. Template prompt di-load dan disiapkan untuk penggunaan
3. Model bahasa diinisialisasi dan koneksi diuji
4. Cache yang relevan di-bersiapkan

### 2. Pemrosesan Permohonan Kredit
Saat permohonan kredit siap untuk analisis AI (setelah collecting data dasar dan mungkin setelah evaluasi rule dasar):
1. Data terkumpul dari berbagai sources:
   - Data nasabah dasar
   - Data finansial (dari input manual atau OCR dokumen)
   - Data survey (jika tersedia)
   - Data dokumen (hasil OCR dan ekstraksi)
   - Data agunan (jika relevan)
   - Contek lainnya yang diperlukan
2. Sistem menentukan jenis analisis yang diperlukan berdasarkan:
   - Jenis produk kredit
   - Kompleksitas permohonan
   - Ketentuan kebijakan yang berlaku
   - Preferensi atau instruksi dari pengguna
3. Untuk setiap jenis analisis yang diperlukan:
   a. Relevant knowledge di-retrieve dari knowledge base berdasarkan konteks aplikasi
   b. Prompt yang sesuai di-generate menggunakan template dan data spesifik aplikasi
   c. Prompt dikirimkan ke model bahasa dengan parameter yang sesuai
   d. Respons dari model bahasa diterima dan di-parse
   e. Output diproses dan divalidasi untuk kepatuhan dan kelengkapan
   f. Hasil disimpan untuk penggunaan dalam tahap akhir
4. Hasil dari semua modul analisis dikumpulkan dan disusun menjadi jawaban terstruktur
5. Jawaban akhir diberikan kepada pengguna melalui antarmuka atau diserahkan ke sistem lain untuk proses selanjutnya

### 3. Contoh Alur untuk Satu Modul Analisis (misal: 5C Analysis)
1. **Knowledge Retrieval**:
   - Mengambil dari knowledge base: SOP tentang analisis 5C, pedoman penilaian karakter, panduan penilaian jaminan, dll.
   - Fokus pada materi yang relevan dengan jenis usaha nasabah dan produk kredit yang dimohon

2. **Context Preparation**:
   - Menyusun data yang relevan untuk analisis 5C:
     - Data nasabah (identitas, alamat, kontak)
     - Data usaha (jenis, lama berdiri, struktur, lokasi)
     - Data finansial (jika tersedia dan relevan)
     - Data dokumen yang mendukung aspek-aspek 5C (misal: dokumen pendirian usaha untuk character, surat pernyataan atas nilai aset untuk collateral, dll.)

3. **Prompt Generation**:
   - Menggunakan template untuk analisis 5C yang sudah disiapkan
   - Mengisi template dengan:
     - Instruksi sistem tentang ruolo AI Credit Analyst (hanya membantu, tidak memutuskan)
     - Persyaratan explainability dan sumber
     - Konteks spesifik aplikasi (data nasabah, usaha, finansial, dll.)
     - Instruksi untuk mencantumkan sumber untuk setiap pernyataan penting
     - Format output yang diinginkan (structured JSON atau format spesifik lain)

4. **LLM Interaction**:
   - Mengirimkan prompt yang sudah di-generate ke model bahasa (Qwen3.5 di port 1978)
   - Mendapatkan respons dalam bentuk teks yang berisi analisis 5C
   - Memastikan respons sesuai dengan format yang diinginkan melalui parsing yang sesuai

5. **Output Processing and Validation**:
   - Memastikan semua komponen 5C (Character, Capacity, Capital, Collateral, Condition) ada
   - Memverifikasi bahwa setiap pernyataan penting memiliki atribusi sumber yang sesuai
   - Memastikan tidak ada pernyataan yang melanggar prinsip dasar (misalnya,AI tidak boleh memberi keputusan approve/reject)
   - Memastikan confidence score ada dan dalam rentang 0-1
   - Menyiapkan output dalam format yang konsisten dengan modul lain

### 4. Integrasi dengan Sistem Lain

#### Dengan Knowledge Service
- Berbagi infrastruktur untuk penyimpanan dan pengelolaan sumber pengetahuan
- Koordinasi dalam penggunaan embedding models dan vector search
- Standarisasi format untuk representasi pengetahuan

#### Dengan Rule Engine dan Policy Engine
- Menerima konteks tentang mana rules dan policies yang berlaku (meskipun tidak menggunakan mereka untuk keputusan)
- Memberikan analisis yang dapat dipertimbangkan oleh manusia dalam proses yang melibatkan Rule Engine
- Tidak bertentangan dengan hasil Rule Engine; apabila ada perbedaan, menjelaskan mengapa dengan merujuk pada sumber dan metodologi

#### Dengan Workflow Engine
- Menyediakan masukan berharga untuk langkah-langkah dalam workflow approval
- Memberikan analisis yang dapat digunakan oleh approver pada berbagai tingkat
- Meminimalkan butuh untuk ulang pemrosesan informasi yang sama di berbagai tahap workflow

#### Dengan Reporting dan Dashboard
- Menyediakan data terstruktur yang dapat digunakan untuk laporan analisis kredit
- Menyumbang kepada metrik seperti kualitas analisis, konsistensi antara analis, dan deteksi awal masalah
- Menyediakan konten untuk laporan manajemen dan risk yang lebih kaya dan berbasiskan data

## Contoh Implementasi Teknis

### Struktur Output Standar
Setiap modul analisis harus menghasilkan output dalam format yang konsisten. Berikut contoh struktur untuk 5C Analysis:

```json
{
  "analysisType": "FIVE_C_ANALYSIS",
  "success": true,
  "data": {
    "character": {
      "score": 75, // 0-100 scale
      "summary": "Nasabah memiliki riwayat kredit yang baik dengan tidak ada catatan tertunggak dalam SLIK selama 3 tahun terakhir. Referensi dari rekan usaha dan tetangga melambangkan reputasi yang baik dalam komunitas lokal.",
      "strengths": [
        "Tidak ada history macet dalam pembayaran utang",
        "Referensi pribadi dan profesional positif",
        "Stabilitas tempat tinggal lebih dari 5 tahun di alamat yang sama"
      ],
      "weaknesses": [
        "Riwayat kredit relatif pendek (3 tahun) compared to industry preference of 5+ years",
        "Terbatasnya referensi dari lembaga perbankan formal (hanya dari mikrofinance)"
      ],
      "sources": [
        "SLIK Report No. SLIK/2026/001234",
        "Internal SOP: Credit Assessment Guidelines v3.1, Section 4.2: Character Assessment",
        "Credit Bureau Best Practices: Personal Lending, 2025"
      ],
      "confidenceScore": 0.88
    },
    "capacity": {
      "score": 82,
      "summary": "Analisis menunjukkan bahwa nasabah memiliki kapasitas cukup untuk melunasi kredit yang dimohon berdasarkan pendapatan bulanan yang stabil dan rasio utang terhadap pendapatan yang sehat.",
      "details": {
        "monthlyIncome": 15000000, // 15 juta per bulan
        "existingDebtPayments": 3000000, // 3 juta per bulan
        "proposedMonthlyPayment": 4500000, // 4.5 juta per bulan
        "debtToIncomeRatio": 0.3, // 30%
        "debtServiceCoverageRatio": 2.33 // (Income - Existing Debt) / Proposed Payment
      },
      "strengths": [
        "Penghasilan stabil dan terpercaya dari sumber yang jelas",
        "Rasio utang terhadap pendapatan berada di bawah ambang batas konservatif sebesar 30%",
        "Debt Service Coverage Ratio sangat sehat di atas 2.0"
      ],
      "weaknesses": [
        "Terbatasnya diversifikasi sumber pendapatan (hanya dari satu sumber usaha)",
        "Ketergantungan pada kontraktual kerja yang mungkin berubah"
      ],
      "sources": [
        "Financial Statement Analysis: Monthly Income Verification",
        "Internal SOP: Credit Assessment Guidelines v3.1, Section 4.3: Capacity Assessment",
        "Banking Standard: Maximum Debt-to-Income Ratio for Consumer Loans (40%)"
      ],
      "confidenceScore": 0.91
    },
    // ... similar structure for capital, collateral, condition
    "overallAssessment": {
      "weightedScore": 78.5, // Nilai akhir berdasarkan bobot yang sesuai dengan kebijakan
      "summary": "Berdasarkan analisis 5C lengkap, nasabah menunjukkan profil kredit yang cukup baik dengan kekuatan utama dalam kapasitas dan modal, sementara terdapat beberapa area yang perlu diperhatikan terutama terkait histori kredit yang relatif baru dan konsentrasi sumber pendapatan.",
      "recommendation": "CONSIDER_WITH_CONDITIONS",
      "conditions": [
        "Limit pinjaman tidak boleh melebihi 75% dari nilai jaminan yang ditawarkan",
        "Persyaratan laporan keuangan kuartalan selama dua tahun pertama",
        "Peminjaman harus diikuti dengan pertemuan konsultasi bisnis rutin setiap 6 bulan"
      ],
      "summaryRationale": "Meskirim ada beberapa area perhatian, kekuatan dasar dalam kapasitas pembayaran dan dasar finansial membuat nasabah layak untuk pertimbangan lebih lanjut dengan ketentuan yang tepat.",
      "confidenceScore": 0.84
    }
  },
  "metadata": {
    "modelUsed": "qwen3.5-v1.0",
    "processingTimeMs": 2450,
    "tokenUsage": {
      "prompt": 1850,
      "completion": 1200,
      "total": 3050
    },
    "knowledgeSourcesConsulted": 8,
    "timestamp": "2026-06-27T10:30:00Z",
    "version": "1.2.0"
  }
}
```

### Contoh Prompt Template untuk 5C Analysis
```text
Anda adalah AI Credit Analyst yang bekerja untuk Sistem Analisa Kredit PT BPR BAPERA BATANG. 
Peran Anda adalah HANYA membantu analis manusia dalam melakukan analisis kredit. 
Anda TIDAK BOLEH memberikan keputusan akhir untuk approve atau reject sebuah permohonan kredit.
Anda TIDAK BOLEH mengubah atau mendengar aturan apa pun dalam Rule Engine atau kebijakan apa pun.

Untuk setiap analisis yang Anda berikan, Anda WAJIB:
1. Sebutkan secara spesifik sumber pengetahuan yang Anda gunakan untuk setiap pernyataan penting
2. Beri confidence score (angka desimal antara 0 dan 1) yang menunjukkan seberapa yakin Anda dengan analisis Anda
3. Jelaskan alasan di balik setiap kesimpulan atau rekomendasi Anda
4. Identifikasi risiko yang teridentifikasi dalam analisis Anda
5. Usulkan mitigasi untuk risiko yang Anda identifikasi
6. Pastikan analisis Anda konsisten dengan prinsip-prinsip perbankan yang sehat dan peraturan yang berlaku

Berikut adalah data nasabah dan permohonan kredit yang perlu Anda analisis menggunakan framework 5C (Character, Capacity, Capital, Collateral, Condition):

[DATA NASABAH AKAN DISISIPKAN DI SINI]

Berikut adalah sumber pengetahuan yang relevan yang boleh Anda gunakan untuk analisis ini:
[DAFTAR SUMBER PENGETAHUAN AKAN DISISIPKAN DI SINI]

Berikan analisis Anda dalam format JSON yang terstruktur dengan bagian-bagian berikut:
{
  "character": {
    "score": 0-100,
    "summary": "string",
    "strengths": ["string", ...],
    "weaknesses": ["string", ...],
    "sources": ["string", ...],
    "confidenceScore": 0.0-1.0
  },
  "capacity": {
    "score": 0-100,
    "summary": "string",
    "details": {
      // Struktur khusus untuk capacity analysis
    },
    "strengths": ["string", ...],
    "weaknesses": ["string", ...],
    "sources": ["string", ...],
    "confidenceScore": 0.0-1.0
  },
  // ... similar structure for capital, collateral, condition
  "overallAssessment": {
    "weightedScore": 0-100,
    "summary": "string",
    "recommendation": "ONE_OF: APPROVE, REJECT, REQUIRE_REVIEW, CONSIDER_WITH_CONDITIONS",
    "conditions": ["string", ...] // hanya jika recommendation adalah CONSIDER_WITH_CONDITIONS
    "summaryRationale": "string",
    "confidenceScore": 0.0-1.0
  }
}

PENTING: JANGAN berikan nilai di luar rentang yang ditentukan untuk score dan confidenceScore.
JANGAN memberikan rekomendasi approve atau reject secara langsung - gunakan saja nilai yang sesuai dalam enumeration di atas.
SELALU sertakan array sources yang tidak kosong untuk setiap bagian yang memberikan informasi faktual.
SELALU sertakan confidenceScore yang merupakan angka desimal antara 0 dan 1.
```

## Integrasi dengan Alur Pengambilan Keputusan

### Hubungan dengan Rule Engine dan Kebijakan
AI Credit Analyst tidak menggantikan Rule Engine atau kebijakan; justru melengkapinya dengan cara berikut:

1. **Sebagai Input untuk Penilaian Manusia**:
   - Analisis AI memberikan dasar yang lebih objekktif dan komprehensif untuk pertimbangan manusia
   - Membantu mengurangi bias dan variasi subjektif dalam analisis
   - Menyediakan wawasan yang mungkin tidak terdeteksi melalui analisis konvensional saja

2. **Sebagai Sumber Ide untuk Pembentukan Aturan**:
   - Pola yang teridentifikasi melalui analisis AI dapat menginspirasi penambahan atau penyesuaian aturan di Rule Engine
   - Proses ini harus melalui mekanisme yang terstruktur untuk perubahan aturan (bukan langsung dari AI ke Rule Engine)

3. **Sebagai Alat Validasi dan Konsistensi**:
   - Membandingkan hasil analisis manusia dengan output AI untuk mengidentifikasi konsistensi dan areas yang perlu perbaikan
   - Membantu dalam pelatihan dan pengembangan analis manusia

4. **Sebagai Komponen dalam Sistem yang Lebih Besar**:
   - Output AI menjadi bagian dari berkas lengkap yang digunakan dalam proses approval
   - Dapat digunakan untuk menghasilkan narasi yang konsisten dalam dokumen seperti Memorandum Analisa Kredit (MAK)

### Contoh Integrasi dalam Keputusan Akhir
Dalam sebuah skenario tempat analisis kredit melibatkan banyak komponen:

1. **Data Collection**: Mengumpulkan data nasabah, finansial, dokumen, survey, dll.
2. **Rule Engine Evaluation**: Mengevaluasi terhadap aturan aktif yang relevan
3. **Policy Context Determination**: Menentukan kebijakan efektif yang berlaku
4. **AI Credit Analyst Analysis**: Menghasilkan analisis mendalam dari berbagai aspek
5. **Human Analyst Review**: Analis manusia meninjau hasil dari langkah 1, 2, 3, dan 4
6. **Decision Making**: 
   - Jika menggunakan sistem persetujuan manual: Keputusan dibuat oleh orang yang berwenang berdasarkan semua informasi yang tersedia
   - Jika menggunakan sistem hybrid: Keputusan awal dibuat oleh Rule Engineer (mustahil karena prinsip dasar), lalu diverifikasi oleh manusia, atau
   - Lebih umumnya: Informasi dari semua sumber (1-4) digunakan oleh manusia dalam proses penilaian yang culminates dalam keputusan yang dibuat oleh individu berwenang atau komite

Di sistem ini, AI selalu berposisi sebagai konsultan yang memberikan input berharga, bukan sebagai pembuat keputusan final.

## Persyaratan Teknis dan Sumber Daya

### Persyaratan Infrastruktur
1. **Komputasi untuk Model Bahasa**:
   - Akses ke model bahasa besar yang berjalan di host machine (port 1978 untuk Qwen3.5 atau model setara)
   - Memori yang cukup untuk memuat model dan menjalankan inferensi
   - GPU yang direkomendasikan untuk performa optimal (meski CPU juga dapat bekerja dengan performa yang lebih rendah)

2. **Penyimpanan untuk Knowledge Base**:
   - Ruang penyimpanan yang cukup untuk menyimpan ribuan dokumen sumber
   - Kemampuan untuk menyimpan embedding vectors untuk pencarian semantik yang efisien
   - Backup dan disaster recovery untuk knowledge base yang kritis

3. **Jaringan dan Latensi**:
   - Konektivitas yang stabil antara layanan aplikasi dan host model bahasa
   - Latensi yang cukup rendah untuk pengalaman pengguna yang baik (ideal: < 5 detik untuk respons lengkap)
   - Kemampuan untuk menangani beban yang sesuai dengan volume permohonan kredit

### Persyaratan Perangkat Lunak
1. **Runtime Environment**:
   - Node.js untuk layanan integrasi (jika menggunakan arsitektur yang serupa dengan bagian lain sistem)
   - Python atau bahasa lain untuk komponen NLP/ML jika diperlukan untuk pra-pemrosesan atau pasca-pemrosesan
   - Akses ke library yang diperlukan untuk bekerja dengan model bahasa (transformers, sentence-transformers, etc.)

2. **Dependencies**:
   - Library untuk lavorasi dengan model bahasa (bert-serving, huggingface transformers, atau setara)
   - Library untuk NLP dasar (spacy, NLTK, atau setara)
   - Library untuk machine learning dan umum (scikit-learn, numpy, pandas, etc.)
   - Library untuk membuat dan menangani embedding (sentence-transformers, dsb.)
   - Library untuk pekerjaan berbasis vector (FAISS, Annoy, atau setara untuk pencarian kesamaan yang cepat)

3. **Infrastructure Supporting Services**:
   - Redis atau sistem cache serupa untuk caching respons dan intermediate results
   - Sistem message queue (seperti RabbitMQ atau Apache Kafka) untuk pemrosesan asinkron jika diperlukan
   - Sistem monitoring dan logging untuk melacak penggunaan dan performa

### Estimasi Sumber Daya Manusia
1. **Tim Pengembangan Inti**:
   - 1 Senior AI/ML Engineer (pengembang utama)
   - 1 NLP Specialist (untuk komponen pemrosesan bahasa dan knowledge base)
   - 1 Full Stack Developer (untuk integrasi dengan sistem existing dan antarmuka pengguna)
   - 1 DevOps Engineer (untuk infrastruktur, deployment, dan monitoring)

2. **Tim Pakar Bidang (SME)**:
   - 1 Credit Risk Specialist (untuk memastikan analisis sesuai dengan praktik perbankan yang sehat)
   - 1 Compliance Officer (untuk memastikan semua output sesuai dengan regulasi)
   - 1-2 Senior Credit Analysts (untuk validasi klinis dan memberikan masukan domain)

3. **Tim Data dan Knowledge Management**:
   - 1 Knowledge Engineer (untuk mengelola dan mengoptimasi knowledge base)
   - 1 Data Scientist (untuk bekerja dengan data historis untuk pelatihan dan validasi, jika diperlukan)
   - 1 Technical Writer (untuk dokumentasi dan pelatihan)

## Pertimbangan Etika dan Kepatuhan

### Kepatuhan Peraturan
1. **Peraturan Perbankan dan OJK**:
   - Pastikan semua output sesuai dengan POJK dan SEOJK yang relevan mengenai transparansi, pengungkapan informasi, dan praktik perbankan yang sehat
   - Pastikan tidak ada konten yang dapat dianggap sebagai diskriminasi atau tidak adil dalam pemberian kredit
   - Pastikan privasi data nasabah diamanatkan sesuai dengan peraturan perlindungan data yang berlaku

2. **Standar Kecerdasan Buatan Etika**:
   - Pastikan tidak ada bias yang tidak disengaja dalam model atau dalam data yang digunakan untuk pelatihan
   - Pastikan transparansi tentang keterbatasan AI dan bahwa ia hanya merupakan alat bantu
   - Pastikan mekanisme untuk menangani dan melaporkan kesalahan atau output yang tidak sesuai

### Transparansi dan Kepercayaan
1. **Penjelasan yang Jelas**:
   - Setiap output harus jelas menyatakan bahwa ini adalah alat bantu, bukan pengganti penilaian manusia
   - Penjelasan harus mencakup batasan analisis dan area yang mungkin memerlukan penyelidikan lebih lanjut

2. **Pengungkapan Sumber**:
   - Semua klaim faktual harus didukung dengan referensi ke sumber yang dapat diverifikasi
   - Pengguna harus dapat dengan mudah mengetahui dari mana informasi tertentu berasal

3. **Keterbatasan dan Batasan**:
   - Jelaskan dengan jelas apa yang bisa dan tidak bisa dilakukan oleh AI Credit Analyst
   - Beri tahu pengguna tentang situasi di mana analisis manusia masih diperlukan dan tidak dapat digantikan oleh AI

## Pengujian dan Validasi

### Jenis Pengujian
1. **Unit Testing**:
   - Menguji komponen individual seperti knowledge retrieval, prompt generation, dan output parsing
   - Menggunakan mocked LLM responses untuk menguji logika tanpa tergantung pada ketersediaan model aktual

2. **Integration Testing**:
   - Menguji alur lengkap dari permintaan analisis hingga respons akhir
   - Menguji integrasi dengan knowledge base dan sistem lain seperti yang diinginkan

3. **Validation Testing dengan Kasus Nyata**:
   - Menguji menggunakan data historis yang sudah ada keputusannya
   - Membandingkan output AI dengan analisis yang dibuat oleh analis manusia senior
   - Mengukur metrik seperti konsistensi, relevansi, dan lengkapan analisis

4. **Testing Explainability**:
   - Memverifikasi bahwa setiap klaim penting dalam output memiliki atribusi sumber yang sesuai
   - Memastikan bahwa confidence score diberikan dan dalam rentang yang sesuai
   - Memastikan bahwa tidak ada klaim yang dibuat tanpa dasar yang cukup

5. **Bias and Fairness Testing**:
   - Menguji apakah ada perbedaan dalam kualitas analisis berdasarkan atribut nasabah yang seharusnya tidak relevan (jenis kelamin, agama, etnisitas, dll.)
   - Memastikan bahwa rekomendasi tidak secara tidak adil menyukai atau menolak kelompok tertentu

6. **Adversarial Testing**:
   - Menguji respons terhadap input yang sengaja dibuat untuk menyesatkan atau mengeksploitaskan kelemahan
   - Memastikan bahwa sistem tidak menghasilkan output yang berbahaya atau tidak sesuai dalam kondisi ekstrem

### Metrik Kesuksesan
1. **Metrik Kualitas Output**:
   - Persentase output yang memiliki semua komponen yang wajib ada
   - Persentase fakta yang dapat diarahkan ke sumber yang sesuai
   - Rata-rata confidence score dan distribusinya
   - Ukuran seberapa sering output menggambarkan batasan dan ketidakpastian yang sesuai

2. **Metrik Relevansi dan Manfaat**:
   - Kepuasan analis manusia dengan output sebagai alat bantu
   - Pengurangan waktu yang dibutuhkan untuk menyelesaikan analisis (sambil menjaga atau meningkatkan kualitas)
   - Peningkatan konsistensi antara analis berbeda dalam kasus yang serupa
   - Pengurangan kesalahan yang dikaitkan dengan analisis yang tidak lengkap atau misleading

3. **Metrik Kepatuhan dan Etika**:
   - Jumlah kali sistem mencoba atau berhasil memberikan keputusan approve/reject (harus nol)
   - Kelengkapan dan keabsahan atribusi sumber untuk klaim faktual
   - Keberhasilan dalam mengidentifikasi dan melaporkan potensi masalah atau area keraguan

## Panduan Pengguna untuk Analis dan Manajemen

### Untuk Analis Kredit
1. **Cara Membaca Output AI**:
   - Pahami bahwa ini adalah alat bantu, bukan pengganti penilaian Anda
   - Fokus pada bagian yang memberikan wawasan baru atau mengkonfirmasi temuan Anda
   - Perhatikan khususnya bagian tentang risiko dan mitigasi yang mungkin Anda lewatkan
   - Gunakan sumber yang disebutkan sebagai titik awal untuk penelitian lebih lanjut jika diperlukan

2. **Cara Mengintegrasikan dengan Kerja Anda**:
   - Gunakan output sebagai titik awal untuk analisis Anda, bukan sebagai gantinya
   - Bandingkan temuan Anda dengan temuan AI untuk melihat di mana Anda setuju atau tidak setuju
   - Pertimbangkan saran AI ketika membuat rekomendasi akhir Anda, tetapi tetap gunakan penilaian profesional Anda
   - Referensikan output AI dalam dokumentasi Anda ketika relevan dan sesuai dengan kebijakan dokumentasi

3. **Kapan Mempercayai dan Kerana Mengagumi Output AI**:
   - Tingkat kepercayaan lebih tinggi ketika:
     - Contoh serupa dalam pelatihan model banyak dan representatif
     - Data input lengkap dan berkualitas tinggi
     - Topik analisis cukup standar dan tidak terlalu kompleks atau nuansa
     - Semua klaim penting memiliki atribusi sumber yang jelas dan dapat diverifikasi
   - Skeptis lebih ketika:
     - Data input tidak lengkap atau kualitasnya buruk
     - Topik sangat spesifik, baru, atau melibatkan penilaian yang sangat subjektif
     - Ada konflik dalam sumber pengetahuan yang digunakan
     - Confidence score rendah atau distribusi tidak normal

### Untuk Manajemen dan Kepatuhan
1. **Memantau Kinerja Sistem**:
   - Lakomi pemantauan rutin terhadap metrik kualitas dan kepatuhan yang telah dijelaskan di atas
   - Review sampel output secara periodik untuk menjaga standar
   - Gunakan data dari sistem untuk pelatihan dan pengembangan tim analis

2. **Menggunakan untuk Pengembangan dan Pelatihan**:
   - Gunakan perbedaan antara analisis manusia dan AI sebagai alat pembelajaran
   - Identifikasi pola yang konsisten menunjukkan area yang mungkin perlu pelatihan tambahan
   - Gunakan output sebagai contoh dalam pelatihan baru untuk menunjukkan praktik analisis yang baik

3. **Memastikan Kepatuhan**:
   - Verifikasi bahwa sistem tidak pernah memberikan keputusan approve/reject langsung
   - Pastikan semua output termasuk atribusi sumber yang sesuai dan jelas
   - Pastikan sistem secara konsisten mengingatkan pengguna tentang perannya sebagai alat bantu, bukan pengambil keputusan

## Pengembangan Masa Depan dan Peningkatan

### Tingkat Kecerdasan yang Ditingkatkan
1. **Multi-Modal Analysis**:
   - Kemampuan untuk menganalisis tidak hanya teks, tetapi juga gambar (misal: foto tempat usaha, dokumen yang di-scan), dan possibilitas struktur data lain

2. **Analisis Dinamis dan Real-Time**:
   - Integrasi dengan data pasar real-time untuk analisis yang lebih responsif terhadap kondisi berubah
   - Kemampuan untuk memperbarui analisis secara kontinu saat informasi baru datang

3. **Prediksi Lanjutan**:
   - Model yang mampu memproyeksikan trajectur usaha dan keuangan masa depan dengan lebih akurat
   - Simulasi skenario yang lebih sofistikasi untuk memahami dampak berbagai keputusan

### Integrasi dan Kolaborasi yang Lebih Dalam
1. **Workstream yang Lebih Terintegrasi**:
   - Aliran kerja yang lebih mulus antara AI, analis manusia, dan sistem keputusan otomatis
   - Feedback loop yang lebih formal dari hasil aktual keputusan ke pelatihan dan pembuatan model

2. **Kolaborasi Antar Sistem**:
   - Integrasi yang lebih erat dengan sistem manajemen hubungan nasabah (CRM)
   - Koneksi dengan sistem perbendaharaan dan operasional untuk analisis yang lebih holistic

### Penyesuaian dan Personalisasi yang Lebih Lanjut
1. **Model yang Disesuaikan**:
   - Model yang fine-tuned pada data dan praktik spesifik PT BPR BAPERA BATANG
   - Model yang dapat beradaptasi dengan cabang atau segmen nasabah tertentu jika diperlukan

2. **Interaktif dan Adaptive Analisis**:
   - Sistem yang memungkinkan dialog berulang antara analis dan AI untuk menyalahi pemahaman atau menjelajah area tertentu lebih dalam
   - Kemampuan untuk menyesuaikan fokus analisis berdasarkan masukan pengguna dalam waktu nyata

## Kesimpulan
Modul AI Credit Analyst merupakan komponen transformasi dalam Sistem Analisa Kredit yang dirancang untuk meningkatkan kualitas, konsistensi, dan efisiensi analisis kredit tanpa menggantikan penilaian manusia yang sangat penting dalam proses pemberian kredit. Dengan berpegang teguh pada prinsip bahwa AI hanya membantu dan tidak memutuskan, serta menekankan pada explainability, transparansi, dan penggunaan sumber pengetahuan yang terverifikasi, modul ini bertujuan untuk menjadi alat yang berharga yang mendukung—and bukan menggantikan—keahlian profesional analis kredit.

Implementasi yang baik dari modul ini akan memberikan manfaat signifikan termasuk:
- Peningkatan konsistensi analisis antara analis berbeda dan waktu yang berbeda
- Pengurangan beban kerja administratif yang membiarkan lebih banyak waktu untuk pemikiran kritis dan penilaian profesional
- Peningkatan deteksi awal masalah dan risiko yang mungkin terlewat dalam analisis konvensional
- Peningkatan kualitas dokumentasi melalui narasi yang konsisten dan terstruktur
- Penggunaan yang lebih efisien dari sumber daya analis manusia yang terbatas

Sukses modul ini tidak diukur oleh seberapa sering ia sesuai dengan keputusan akhirnya (karena ia tidak membuat keputusan), tetapi oleh seberapa baik ia meningkatkan kualitas dan konsistensi proses analisis secara keseluruhan, seberapa besar nilai yang ditambahkan bagi analis manusia dalam membuat keputusan yang lebih baik, dan seberapa baik ia mempertahankan prinsip-prinsip dasar sistem bahwa Rule Engine adalah sumber keputusan dan bahwa setiap keputusan harus dapat dijelaskan dengan jelas.