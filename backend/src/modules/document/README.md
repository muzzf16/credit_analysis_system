# Document AI Module - LFM2.5-VL & Tesseract Fallback

Modul ini bertugas mengekstrak data dari berbagai jenis dokumen kredit BPR menggunakan Vision-Language Model (VLM) LFM2.5-VL-1.6B, dengan fallback otomatis ke mesin Tesseract OCR jika model LFM tidak dapat dihubungi atau gagal menghasilkan JSON yang valid.

---

## 1. CONFIGURATION & ENVIRONMENT

Tambahkan parameter berikut ke `.env` backend Anda untuk mengontrol behavior mesin ekstraksi:

```ini
# Pilihan engine: 'lfm' atau 'tesseract' (Default: 'lfm')
OCR_ENGINE=lfm

# URL endpoint llama-server untuk LFM2.5-VL (Default: port 1976)
LFM_API_URL=http://localhost:1976
```

---

## 2. LLAMA-SERVER DEPLOYMENT FOR LFM2.5-VL

VLM `LFM2.5-VL-1.6B` memerlukan server `llama-server` yang terpisah dengan model multimedia projection (`mmproj`). 

### Run command manual:
```bash
llama-server \
  -m /models/LFM2.5-VL-1.6B-Q4_0.gguf \
  --mmproj /models/mmproj-LFM2.5-VL-1.6B-Q4_0.gguf \
  -c 2048 \
  -t 8 \
  -ngl 0 \
  -np 1 \
  --host 0.0.0.0 \
  --port 1976
```

### Systemd Service Configuration (`/etc/systemd/system/llama-lfm.service`):
```ini
[Unit]
Description=Llama.cpp Server for LFM2.5-VL
After=network.target

[Service]
Type=simple
User=multipilar
WorkingDirectory=/opt/credit_analysis_system
ExecStart=/usr/local/bin/llama-server -m /models/LFM2.5-VL-1.6B-Q4_0.gguf --mmproj /models/mmproj-LFM2.5-VL-1.6B-Q4_0.gguf -c 2048 -t 8 -ngl 0 -np 1 --host 0.0.0.0 --port 1976
Restart=always
RestartSec=5
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=llama-lfm

[Install]
WantedBy=multi-user.target
```

Untuk mengaktifkan service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable llama-lfm
sudo systemctl start llama-lfm
sudo systemctl status llama-lfm
```

---

## 3. API ENDPOINTS & CURL EXAMPLES

Seluruh endpoint berikut menggunakan authentication token (`Authorization: Bearer <jwt_token>`) dan menerima unggahan file melalui `multipart/form-data` dengan key `file`.

### A. KTP Extraction (`POST /api/document/ktp`)
Menerima: `.jpg`, `.jpeg`, `.png`, `.pdf` (halaman pertama)
```bash
curl -X POST http://localhost:8085/api/document/ktp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/ktp.jpg"
```
**Response Format:**
```json
{
  "success": true,
  "message": "Ekstraksi KTP berhasil.",
  "data": {
    "engineUsed": "lfm",
    "success": true,
    "data": {
      "nik": "3325010101900001",
      "nama": "BUDI SANTOSO",
      "tempat_lahir": "BATANG",
      "tanggal_lahir": "01-01-1990",
      "jenis_kelamin": "LAKI-LAKI",
      "alamat": "JL. RAYA BATANG NO. 10",
      "rt": "01",
      "rw": "02",
      "kelurahan": "KAUMAN",
      "kecamatan": "BATANG",
      "agama": "ISLAM",
      "status_perkawinan": "BELUM KAWIN",
      "pekerjaan": "WIRASWASTA",
      "kewarganegaraan": "WNI"
    }
  }
}
```

### B. KK Extraction (`POST /api/document/kk`)
```bash
curl -X POST http://localhost:8085/api/document/kk \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/kk.jpg"
```
**Response Format:**
```json
{
  "success": true,
  "message": "Ekstraksi KK berhasil.",
  "data": {
    "engineUsed": "lfm",
    "success": true,
    "data": {
      "nomor_kk": "3325010203040506",
      "kepala_keluarga": "BUDI SANTOSO",
      "alamat": "JL. RAYA BATANG NO. 10",
      "anggota": [
        {
          "nik": "3325010101900001",
          "nama": "BUDI SANTOSO",
          "jenis_kelamin": "LAKI-LAKI",
          "tempat_lahir": "BATANG",
          "tanggal_lahir": "01-01-1990",
          "agama": "ISLAM",
          "pendidikan": "SLTA/SEDERAJAT",
          "jenis_pekerjaan": "WIRASWASTA",
          "hubungan_keluarga": "KEPALA KELUARGA",
          "kewarganegaraan": "WNI"
        }
      ]
    }
  }
}
```

### C. NPWP Extraction (`POST /api/document/npwp`)
```bash
curl -X POST http://localhost:8085/api/document/npwp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/npwp.jpg"
```
**Response Format:**
```json
{
  "success": true,
  "message": "Ekstraksi NPWP berhasil.",
  "data": {
    "engineUsed": "lfm",
    "success": true,
    "data": {
      "nomor_npwp": "99.123.456.7-501.000",
      "nama": "BUDI SANTOSO",
      "alamat": "BATANG"
    }
  }
}
```

### D. SHM Extraction (`POST /api/document/shm`)
```bash
curl -X POST http://localhost:8085/api/document/shm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/shm.jpg"
```
**Response Format:**
```json
{
  "success": true,
  "message": "Ekstraksi SHM berhasil.",
  "data": {
    "engineUsed": "lfm",
    "success": true,
    "data": {
      "nomor_sertifikat": "12345",
      "jenis_hak": "HAK MILIK",
      "atas_nama": "BUDI SANTOSO",
      "luas_tanah": "150",
      "desa": "KAUMAN",
      "kecamatan": "BATANG",
      "kabupaten": "BATANG"
    }
  }
}
```

### E. BPKB Extraction (`POST /api/document/bpkb`)
```bash
curl -X POST http://localhost:8085/api/document/bpkb \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/bpkb.jpg"
```
**Response Format:**
```json
{
  "success": true,
  "message": "Ekstraksi BPKB berhasil.",
  "data": {
    "engineUsed": "lfm",
    "success": true,
    "data": {
      "nomor_bpkb": "H-1234567-B",
      "nomor_polisi": "G 1234 AB",
      "merk": "HONDA",
      "tipe": "VARIO 150",
      "tahun": "2021",
      "atas_nama": "BUDI SANTOSO"
    }
  }
}
```

### F. Survey Photo Analysis (`POST /api/document/survey`)
```bash
curl -X POST http://localhost:8085/api/document/survey \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/toko.jpg"
```
**Response Format:**
```json
{
  "success": true,
  "message": "Ekstraksi SURVEY berhasil.",
  "data": {
    "engineUsed": "lfm",
    "success": true,
    "data": {
      "jenis_usaha": "Toko Kelontong",
      "perkiraan_skala": "Mikro",
      "kondisi_bangunan": "Sangat Baik",
      "indikasi_aktif": true,
      "catatan": "Toko tampak aktif dengan stok barang yang cukup banyak dan pembeli bertransaksi."
    }
  }
}
```
