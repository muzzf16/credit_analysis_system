# Panduan Deploy Docker — Sistem Analisa Kredit BPR BAPERA

Dokumentasi ini menjelaskan langkah-langkah untuk melakukan deployment sistem ke lingkungan produksi atau staging menggunakan Docker dan Docker Compose.

---

## 🏗️ Topologi Container

Sistem dideploy menggunakan **Nginx** sebagai reverse proxy utama di port `80` yang meneruskan request ke komponen-komponen berikut:

- **Frontend App**: React SPA dideploy menggunakan Nginx image terpisah (Port `80` internal)
- **Backend API**: Node.js Express server (Port `5000` internal)
- **WhatsApp Gateway**: Baileys Node.js microservice (Port `3001` internal)
- **Database (PostgreSQL 15)**: Penyimpanan data relasional (Port `5432` external/internal)
- **Object Storage (MinIO)**: Penyimpanan dokumen debitur, agunan, dan MAK (API Port `9000`, Console Port `9001`)

---

## 📋 Prasyarat Sistem

Sebelum memulai, pastikan server tujuan telah terinstall tools berikut:
1. **Docker Engine** v20.10+
2. **Docker Compose** v2.0+
3. **Git**

---

## 🚀 Langkah Deployment

### 1. Kloning Source Code
Kloning repositori sistem di server:
```bash
git clone https://github.com/muzzf16/credit_analysis_system.git
cd credit_analysis_system
```

### 2. Konfigurasi Environment Variable (`.env`)
Salin file template `.env` dan sesuaikan nilainya dengan konfigurasi server Anda:
```bash
cp .env.example .env
```

Buka berkas `.env` yang baru dibuat dan isi variabel-variabel kunci berikut:
```ini
# ENVIRONMENT
NODE_ENV=production
PORT=5000

# DATABASE
DB_HOST=postgres
DB_PORT=5432
DB_NAME=bpr_bapera
DB_USER=postgres
DB_PASSWORD=MasukkanPasswordKuatDisini

# JWT AUTH
JWT_SECRET=GantiDenganSecretMin32KarakterAcak
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d

# ENCRYPTION (Untuk data NIK sensitif)
ENCRYPTION_KEY=IsiDengan32KarakterKunciEnkripsi

# MINIO (OBJECT STORAGE)
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=bpr_bapera_admin
MINIO_SECRET_KEY=IsiPasswordMinIOSensitive
MINIO_BUCKET=bpr-bapera
MINIO_USE_SSL=false
```

> [!WARNING]
> Pastikan untuk tidak membiarkan password bawaan/default pada parameter `DB_PASSWORD`, `JWT_SECRET`, `ENCRYPTION_KEY`, dan `MINIO_SECRET_KEY` ketika dideploy di production.

### 3. Build & Menjalankan Container
Jalankan perintah berikut untuk mengunduh base image, build Dockerfile frontend & backend, dan menjalankan container di latar belakang (*detached mode*):
```bash
docker-compose up -d --build
```

Gunakan perintah ini untuk memeriksa apakah semua container telah berjalan normal (`STATUS: Up`):
```bash
docker-compose ps
```

### 4. Eksekusi Migrasi & Data Seeding Awal
Ketika kontainer database PostgreSQL selesai di-setup pada instalasi pertama kali, Anda harus menjalankan skrip migrasi untuk membuat tabel-tabel database (23 tabel) beserta pengisian data peranan (*roles*) dan administrator awal:

```bash
# Jalankan migrasi tabel database
docker-compose exec backend npm run migrate

# Masukkan data bawaan (Roles & user admin awal)
docker-compose exec backend npm run seed
```

---

## 🔐 Akun Akses Default
Setelah seed berhasil dijalankan, silakan masuk ke aplikasi menggunakan kredensial administrator awal berikut:
- **URL Aplikasi**: `http://<IP_SERVER_ATAU_DOMAIN>/`
- **Username**: `admin`
- **Password**: `Admin@123`

> [!IMPORTANT]
> Segera ganti password akun `admin` bawaan melalui menu User / Akun Anda setelah login pertama kali untuk mencegah celah keamanan.

---

## 📱 Aktivasi WhatsApp Gateway (Baileys)
Layanan WhatsApp Gateway berjalan secara internal. Untuk menyambungkan nomor WhatsApp bisnis BPR Anda agar dapat mengirimkan notifikasi otomatis:

1. Akses logs container WhatsApp Gateway untuk melihat kode QR autentikasi:
   ```bash
   docker-compose logs -f wa-gateway
   ```
2. Tunggu hingga terminal menampilkan QR Code berbasis ASCII.
3. Buka aplikasi WhatsApp di HP Anda, masuk ke **Perangkat Tertaut** -> **Tautkan Perangkat**, lalu pindai (*scan*) QR Code yang tampil di logs terminal tersebut.
4. Setelah berhasil tertaut, status log akan berubah menjadi `WhatsApp Connection Active`.

---

## 🛠️ Pemecahan Masalah (Troubleshooting) & Logs

### Memantau Log Container secara Real-Time
Untuk mendiagnosis masalah atau melihat aktivitas aplikasi:
```bash
# Melihat log semua container
docker-compose logs -f

# Hanya log backend API
docker-compose logs -f backend

# Hanya log Nginx proxy
docker-compose logs -f nginx
```

### Reset Data MinIO / Database (Hanya Staging/Dev)
Jika ingin mengosongkan volume data lokal untuk instalasi ulang yang bersih:
```bash
docker-compose down -v
docker-compose up -d --build
```

### Akses Database Secara Langsung
Jika perlu melakukan pengecekan data di PostgreSQL menggunakan terminal CLI:
```bash
docker-compose exec postgres psql -U postgres -d bpr_bapera
```
