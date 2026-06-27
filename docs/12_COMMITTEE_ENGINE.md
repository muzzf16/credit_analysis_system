# COMMITTEE_ENGINE.md

# Modul Committee Engine

## Gambaran Umum
Modul Committee Engine mengelola sistem komite kredit yang bertanggung jawab untuk memberikan keputusan akhir terhadap pengajuan kredit yang melebihi batas wewenang approval individual. Komite kredit merupakan organ penting dalam tata kelola kredit yang memastikan bahwa eksposur besar dinilai dengan cermat oleh multiple stakeholders sebelum disetujui.

## Tujuan Utama
1. Mengelola struktur dan keanggotaan komite kredit
2. Menjadwalkan dan mengelola rapat komite
3. Menyediakan distribusi dokumen rapat (rappel)
4. Mencatat dan mengelola proses voting dan keputusan
5. Menghasilkan notulen rapat secara otomatis
6. Melacak tindak lanjut dari keputusan komite
7. Menyediakan audit trail lengkap untuk kepatuhan

## Struktur Komite

### 1. Komite Kredit Level 1
- **Komposisi**: KABID, Analis Senior, AO Supervisor
- **Authority Limit**: Rp X miliar (sesuai AD/KREDIT)
- **Frekuensi Rapat**: Mingguan (Jumat)
- **Tujuan**: Review dan approval untuk kredit menengah

### 2. Komite Kredit Level 2
- **Komposisi**: Direktur Keuangan, KABID Senior, Analis Senior, Legal
- **Authority Limit**: Rp Y miliar (sesuai AD/KREDIT)
- **Frekuensi Rapat**: Bulanan (Senin pertama)
- **Tujuan**: Review dan approval untuk kredit besar

### 3. Komite Kredit Level 3 (Board of Directors)
- **Komposisi**: Direktur Utama, Direktur Keuangan, Direktur Operasional
- **Authority Limit**: Di atas batas Level 2
- **Frekuensi Rapat**: Ad-hoc sesuai kebutuhan
- **Tujuan**: Review dan approval untuk eksposur strategis

### 4. Komite Kredit Induk (Group/Inti)
- **Komposisi**: Direktur Utama, seluruh Direktur, Komisaris
- **Authority Limit**: Eksposur yang memerlukan persetujuan pemegang saham
- **Frekuensi Rapat**: Luar biasa
- **Tujuan**: Keputusan strategis dan transaksi yang material

## Komponen Utama

### 1. Committee Management
Manajemen struktur dan keanggotaan komite.

#### Fungsi Utama:
- Mendefinisikan struktur komite (level, nama, authority limit)
- Mengelola keanggotaan (penambahan, pengurangan, penggantian)
- Menetapkan quorum requirements
- Mengelola jadwal rapat tetap (recurring meetings)
- Mengelola delegasi wewenang

### 2. Meeting Scheduling
Penjadwalan rapat komite.

#### Jenis Rapat:
- **Rapat Tetap**: Jadwal yang diatur secara rutin (mingguan, bulanan)
- **Rapat Luar Biasa**: Dipanggil karena kebutuhan khusus
- **Rapat Darurat**: Untuk masalah yang memerlukan penanganan segera

#### Proses Penjadwalan:
1. Identifikasi aplikasi yang memerlukan komite
2. Cek ketersediaan anggota komite
3. Buat undangan rapat
4. Kirim dokumen rappel
5. Konfirmasi kehadiran
6. Reschedule jika quorum tidak terpenuhi

### 3. Document Distribution (Rappel)
Distribusi dokumen rapat kepada anggota komite.

#### Dokumen yang Didistribusikan:
- Daftar aplikasi yang akan dibahas
- Memorandum Analisa Kredit (MAK)
- Hasil Rule Engine dan Policy Engine
- Analisis AI Credit Analyst
- Dokumentasi agunan
- Rekomendasi dari analis
- Data pendukung lainnya

#### Distribusi Methods:
- Email dengan attachment
- Portal komite dengan akses aman
- Mobile app notification
- Hard copy untuk rapat tatap muka

### 4. Voting dan Decision Recording
Sistem voting dan pencatatan keputusan.

#### Jenis Voting:
- **Voting Terbuka**: Setiap anggota menyatakan secara verbal
- **Voting Tertutup**: Voting melalui sistem untuk kerahasiaan
- **Voting Elektronik**: Melalui device atau aplikasi
- **Show of Hands**: Untuk rapat tatap muka

#### Tipe Keputusan:
- **Setuju**: Setuju tanpa kondisi
- **Setuju dengan Catatan**: Setuju dengan komentar/kondisi
- **Tolak**: Menolak aplikasi
- **Tunda**: Meminta informasi tambahan atau penundaan
- **Kembalikan**: Kembalikan ke level bawah untuk perbaikan

#### Recording:
- Catatan suara setiap anggota (setuju/tolak/tunda)
- Catatan alasan untuk keputusan
- Syarat atau kondisi khusus yang disetujui
- Quorum verification
- Dokumen pendukung keputusan

### 5. Minutes of Meeting (Notulen)
Pembuatan notulen rapat secara otomatis.

#### Konten Notulen:
- Identitas rapat (tanggal, waktu, tempat, jenis rapat)
- Daftar hadir dan tidak hadir
- Agenda rapat
- Ringkasan pembicaraan
- Keputusan untuk setiap aplikasi
- Tindak lanjut yang disepakati
- Penjadwalan ulang jika diperlukan
- Materi rapat yang dipertahankan

#### Generation:
- Semi-automatic: AI assisted generation dari rekaman
- Template-based: Template yang diisi dengan data rapat
- Manual input: Untuk penyesuaian dan detail penting

### 6. Action Item Tracking
Pelacakan tindak lanjut dari keputusan komite.

#### Jenis Action Items:
- **Informational**: Hanya untuk informasi, tidak perlu tindak lanjut
- **Action Required**: Membutuhkan tindak lanjut dari tim tertentu
- **Follow-up Review**: Review berkala untuk memantau perkembangan
- **Escalation**: Eskalasi ke level yang lebih tinggi jika perlu

#### Tracking:
- Assignment kepada PIC (Person in Charge)
- Due date untuk setiap action item
- Status tracking (pending, in progress, completed)
- Escalation jika melebihi due date
- Reporting ke manajemen

## Alur Kerja Komite

### 1. Preparasi Rapat
1. **Identifikasi Aplikasi**:
   - Sistem mengidentifikasi aplikasi yang memerlukan komite
   - Verifikasi kelengkapan dokumen
   - Prioritaskan berdasarkan urgency

2. **Penjadwalan**:
   - Tentukan tanggal rapat
   - Cek ketersediaan anggota
   - Kirim undangan

3. **Persiapan Dokumen**:
   - Generate MAK untuk setiap aplikasi
   - Siapkan rappel dalam format yang sesuai
   - Distribusi dokumen H-3 (3 hari sebelum rapat)

### 2. Pelaksanaan Rapat
1. **Pembukaan**:
   - Verifikasi quorum
   - Persetujuan agenda
   - Pengumuman rapat resmi dimulai

2. **Pembahasan**:
   - Setiap aplikasi dibahas secara bergiliran
   - Presentasi dari analis
   - Diskusi dan pertanyaan dari anggota
   - Voting sesuai prosedur

3. **Pengambilan Keputusan**:
   - Rekap hasil voting
   - Dokumentasi keputusan
   - Penetapan action items

4. **Penutupan**:
   - Konfirmasi tindak lanjut
   - Jadwalkan rapat berikutnya (jika perlu)
   - Tutup rapat resmi

### 3. Pasca Rapat
1. **Dokumentasi**:
   - Generate notulen rapat
   - Input keputusan ke sistem
   - Upload foto/foto presentasi (jika ada)

2. **Distribusi**:
   - Kirim notulen kepada seluruh anggota
   - Update status aplikasi di sistem
   - Notifikasi kepada AO dan analis

3. **Follow-up**:
   - Buat action items di sistem
   - Assign PIC
   - Set tracking untuk monitoring

## Implementasi Teknis

### Basis Data Skema

#### Tabel Komite
```sql
CREATE TABLE committees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_name VARCHAR(100) NOT NULL,
    committee_level INTEGER NOT NULL,
    description TEXT,
    authority_limit NUMERIC(15, 2),
    quorum_required INTEGER NOT NULL,
    meeting_schedule VARCHAR(50),  -- e.g., 'WEEKLY_FRIDAY', 'MONTHLY_FIRST_MONDAY'
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_committees_level ON committees(committee_level);
CREATE INDEX idx_committees_status ON committees(status);
```

#### Tabel Keanggotaan Komite
```sql
CREATE TABLE committee_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,  -- CHAIRMAN, MEMBER, SECRETARY, etc.
    is_active BOOLEAN DEFAULT TRUE,
    appointed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_committee_members_committee ON committee_members(committee_id);
CREATE INDEX idx_committee_members_user ON committee_members(user_id);
CREATE INDEX idx_committee_members_active ON committee_members(is_active) WHERE is_active = TRUE;
```

#### Tabel Rapat Komite
```sql
CREATE TABLE committee_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
    meeting_type VARCHAR(20) NOT NULL CHECK (meeting_type IN ('REGULAR', 'EXTRAORDINARY', 'EMERGENCY')),
    meeting_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(200),
    agenda TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED')),
    quorum_verified BOOLEAN,
    attendees_count INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_committee_meetings_committee ON committee_meetings(committee_id);
CREATE INDEX idx_committee_meetings_date ON committee_meetings(meeting_date);
CREATE INDEX idx_committee_meetings_status ON committee_meetings(status);
```

#### Tabel Kehadiran Rapat
```sql
CREATE TABLE meeting_attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES committee_meetings(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES committee_members(id) ON DELETE CASCADE,
    attendance_status VARCHAR(20) NOT NULL CHECK (attendance_status IN ('PRESENT', 'ABSENT', 'EXCUSED', 'LATE')),
    arrival_time TIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_meeting_attendances_meeting ON meeting_attendances(meeting_id);
CREATE INDEX idx_meeting_attendances_member ON meeting_attendances(member_id);
```

#### Tabel Agenda Rapat
```sql
CREATE TABLE meeting_agendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES committee_meetings(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES pengajuan(id) ON DELETE CASCADE,
    agenda_order INTEGER NOT NULL,
    agenda_type VARCHAR(50) NOT NULL,  -- NEW_APPLICATION, FOLLOW_UP, POLICY_REVIEW, etc.
    presenter_id UUID REFERENCES users(id),
    discussion_notes TEXT,
    decision VARCHAR(50),  -- APPROVE, REJECT, REVISE, etc.
    decision_notes TEXT,
    conditions TEXT,  -- Syarat yang disetujui
    action_items TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_meeting_agendas_meeting ON meeting_agendas(meeting_id);
CREATE INDEX idx_meeting_agendas_application ON meeting_agendas(application_id);
```

#### Tabel Voting
```sql
CREATE TABLE meeting_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES committee_meetings(id) ON DELETE CASCADE,
    agenda_id UUID NOT NULL REFERENCES meeting_agendas(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES committee_members(id) ON DELETE CASCADE,
    vote VARCHAR(20) NOT NULL CHECK (vote IN ('APPROVE', 'REJECT', 'ABSTAIN', 'CONFLICT_OF_INTEREST')),
    vote_notes TEXT,
    voted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_meeting_votes_meeting ON meeting_votes(meeting_id);
CREATE INDEX idx_meeting_votes_agenda ON meeting_votes(agenda_id);
CREATE INDEX idx_meeting_votes_member ON meeting_votes(member_id);
```

#### Tabel Notulen Rapat
```sql
CREATE TABLE meeting_minutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES committee_meetings(id) ON DELETE CASCADE,
    minutes_text TEXT NOT NULL,
    decisions_summary JSONB NOT NULL,
    action_items JSONB NOT NULL,
    next_meeting_date DATE,
    next_meeting_agenda TEXT,
    prepared_by UUID NOT NULL REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'FINAL')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_meeting_minutes_meeting ON meeting_minutes(meeting_id);
CREATE INDEX idx_meeting_minutes_status ON meeting_minutes(status);
```

#### Tabel Action Items
```sql
CREATE TABLE meeting_action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES committee_meetings(id) ON DELETE CASCADE,
    agenda_id UUID REFERENCES meeting_agendas(id) ON DELETE SET NULL,
    action_description TEXT NOT NULL,
    assigned_to UUID NOT NULL REFERENCES users(id),
    due_date DATE NOT NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE')),
    completion_notes TEXT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_meeting_action_items_meeting ON meeting_action_items(meeting_id);
CREATE INDEX idx_meeting_action_items_assigned ON meeting_action_items(assigned_to);
CREATE INDEX idx_meeting_action_items_status ON meeting_action_items(status);
CREATE INDEX idx_meeting_action_items_due ON meeting_action_items(due_date);
```

### Layanan Utama
1. **CommitteeManagementService**:
   - CRUD untuk komite dan keanggotaan
   - Menentukan komite mana yang berlaku untuk aplikasi
   - Mengelola authority limits dan delegasi

2. **MeetingSchedulingService**:
   - Penjadwalan rapat
   - Manajemen ketersediaan anggota
   - Undangan dan konfirmasi

3. **DocumentDistributionService**:
   - Menyiapkan rappel untuk rapat
   - Distribusi dokumen ke anggota
   - Tracking akses dan pembukaan dokumen

4. **VotingService**:
   - Menjalankan proses voting
   - Mencatat suara setiap anggota
   - Menghitung hasil voting

5. **MinutesGenerationService**:
   - Generate notulen dari data rapat
   - Review dan approval workflow
   - Distribusi notulen

6. **ActionItemTrackingService**:
   - Membuat dan mengelola action items
   - Tracking progres dan completion
   - Eskalasi untuk overdue items

### API Endpoints
```
# Committee Management
GET    /api/v1/committees                      # Daftar komite
POST   /api/v1/committees                      # Buat komite baru
GET    /api/v1/committees/{committeeId}        # Detail komite
PUT    /api/v1/committees/{committeeId}        # Update komite
DELETE /api/v1/committees/{committeeId}        # Hapus komite

# Committee Members
GET    /api/v1/committees/{committeeId}/members # Daftar anggota
POST   /api/v1/committees/{committeeId}/members # Tambah anggota
DELETE /api/v1/committees/{committeeId}/members/{memberId} # Hapus anggota

# Meetings
GET    /api/v1/meetings                        # Daftar rapat
POST   /api/v1/meetings                        # Jadwalkan rapat baru
GET    /api/v1/meetings/{meetingId}            # Detail rapat
PUT    /api/v1/meetings/{meetingId}            # Update rapat
DELETE /api/v1/meetings/{meetingId}            # Batalkan rapat

# Meeting Agenda
GET    /api/v1/meetings/{meetingId}/agenda     # Daftar agenda rapat
POST   /api/v1/meetings/{meetingId}/agenda     # Tambah aplikasi ke agenda
PUT    /api/v1/meetings/{meetingId}/agenda/{agendaId} # Update agenda item
DELETE /api/v1/meetings/{meetingId}/agenda/{agendaId} # Hapus dari agenda

# Voting
POST   /api/v1/meetings/{meetingId}/vote       # Voting untuk agenda item
GET    /api/v1/meetings/{meetingId}/votes      # Daftar voting
GET    /api/v1/meetings/{meetingId}/results    # Hasil voting

# Attendance
GET    /api/v1/meetings/{meetingId}/attendance # Daftar kehadiran
POST   /api/v1/meetings/{meetingId}/attendance # Input kehadiran

# Minutes
GET    /api/v1/meetings/{meetingId}/minutes    # Notulen rapat
POST   /api/v1/meetings/{meetingId}/minutes    # Buat notulen
PUT    /api/v1/meetings/{meetingId}/minutes/{minutesId} # Update notulen
POST   /api/v1/meetings/{meetingId}/minutes/{minutesId}/approve # Approve notulen

# Action Items
GET    /api/v1/meetings/{meetingId}/action-items # Action items rapat
POST   /api/v1/action-items                    # Buat action item baru
PUT    /api/v1/action-items/{actionItemId}     # Update action item
DELETE /api/v1/action-items/{actionItemId}     # Hapus action item
```

## Integrasi dengan Komponen Lainnya

### 1. Dengan Decision Engine
- Menerima aplikasi yang memerlukan komite (setelah melebihi batas wewenang individual)
- Mencatat keputusan komite sebagai override dari keputusan sistem
- Memberikan feedback ke Decision Engine tentang pola keputusan komite

### 2. Dengan Workflow Engine
- Mengintegrasikan tahapan komite ke dalam workflow
- Menandai transisi status ketika aplikasi masuk/keluar komite
- Mengelola SLA untuk proses komite

### 3. Dengan Notification System
- Mengirimkan undangan rapat
- Mengirimkan pengingat sebelum rapat
- Mengirimkan notifikasi hasil keputusan

### 4. Dengan MAK Generator
- Memanggil MAK Generator untuk menghasilkan dokumen rappel
- Mengintegrasikan MAK ke dalam notulen

### 5. Dengan Reporting dan Dashboard
- Menyediakan data untuk laporan aktivitas komite
- Menyediakan metrics untuk monitoring efektivitas komite
- Tracking waktu proses komite

## Prosedur Operasional

### Pra-Rapat
1. **7 Hari Sebelum**:
   - Identifikasi aplikasi yang siap untuk komite
   - Cek kelengkapan dokumen
   - Request MAK ke sistem

2. **3 Hari Sebelum**:
   - Finalisasi daftar agenda
   - Distribusi rappel elektronik
   - Konfirmasi kehadiran

3. **1 Hari Sebelum**:
   - Finalisasi logistik rapat
   - Reminder kepada anggota
   - Persiapan presentasi

### Saat Rapat
1. **Pembukaan**:
   - Verifikasi quorum
   - Pengenalan agenda
   - Pelaporan tindak lanjut rapat sebelumnya

2. **Pembahasan**:
   - Presentasi setiap aplikasi
   - Diskusi dan pertanyaan
   - Voting

3. **Penutupan**:
   - Rekap keputusan
   - Penetapan tindak lanjut
   - Penjadwalan rapat berikutnya

### Pasca-Rapat
1. **Hari yang Sama**:
   - Input hasil voting ke sistem
   - Distribusi notifikasi keputusan

2. **1-2 Hari Setelah**:
   - Generate notulen
   - Review dan approval notulen
   - Distribusi notulen final

3. **3-5 Hari Setelah**:
   - Buat action items
   - Assign PIC
   - Start tracking

## Monitoring dan Pelaporan

### Committee Performance Metrics
- **Attendance Rate**: Persentase kehadiran anggota
- **Quorum Achievement**: Persentase rapat yang memenuhi quorum
- **Decision Rate**: Persentase aplikasi yang diputuskan vs. ditunda
- **Processing Time**: Rata-rata waktu dari masuk komite hingga keputusan
- **Revision Rate**: Persentase yang dikembalikan untuk revisi
- **Override Rate**: Persentase yang di-override dari rekomendasi

### Reporting
- **Laporan Harian**: Ringkasan rapat yang diadakan
- **Laporan Mingguan**: Statistik dan tren
- **Laporan Bulanan**: Analisis mendalam dan rekomendasi perbaikan
- **Laporan Tahunan**: Komprehensif untuk direksi

## Kesimpulan
Committee Engine mengelola proses yang kompleks dan penting dalam organisasi perbankan untuk memastikan bahwa keputusan kredit besar dibuat dengan deliberations yang appropriate, melibatkan stakeholders yang relevan, dan terdokumentasi dengan baik untuk kepatuhan dan akuntabilitas.