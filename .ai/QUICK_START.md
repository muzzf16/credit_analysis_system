# ⚡ QUICK START — BPR BAPERA BATANG
# Cheatsheet sesi coding. Ikuti langkah ini setiap sesi.
# ═══════════════════════════════════════════════════════

## 🚀 MULAI SESI BARU (2 menit)

### Step 1 — Buka AI tool (Claude / GPT / Gemini)

### Step 2 — Paste prompt ini di awal:
```
Aku melanjutkan project yang sudah berjalan di production.
Ini context sesi-ku:

[PASTE ISI .ai/CONTEXT.md]

Ini kode yang relevan:
[PASTE FILE YANG INGIN DIKERJAKAN]

Task sesi ini: [SATU TASK SPESIFIK]
```

### Step 3 — Tulis task yang spesifik
❌ Buruk: "kerja di modul MAK"
✅ Bagus: "Buat endpoint POST /api/mak/generate di backend/routes/mak.js yang menerima `pengajuan_id` dan generate dokumen MAK berdasarkan data analisa yang ada. Jangan ubah file lain."

---

## 🔄 GANTI MODEL SAAT TOKEN HABIS (3 menit)

### Sebelum ganti — tanya ke model saat ini:
```
Sebelum kita akhiri, tolong berikan:
1. Ringkasan apa yang kita bangun sesi ini
2. Keputusan baru yang dibuat
3. Kesalahan atau jalan buntu yang ditemui (untuk MISTAKES.md)
4. Task eksak untuk sesi berikutnya
5. File yang diubah dan file yang sudah berjalan dengan baik
```

### Copy output → update file .ai/ → buka model baru → paste CONTEXT.md

---

## 🛑 AKHIRI SESI (2 menit)

Minta AI:
```
Sesi selesai. Tolong berikan:
1. Entry baru untuk SESSION_LOG.md
2. Entry baru untuk MISTAKES.md (jika ada bug baru)
3. Apa yang harus di-paste di awal sesi berikutnya
```

Copy output → update .ai/ → commit ke Git

---

## 📋 RESEP PROMPT

### Awal sesi
```
Kamu melanjutkan project production yang sudah berjalan.
Baca context di bawah dengan cermat sebelum nulis kode apapun.
JANGAN ubah keputusan yang dikunci. JANGAN rewrite file yang berjalan.
Hanya kerjakan task yang aku sebut di akhir.

[CONTEXT.md]
[KODE RELEVAN]

Task: [task spesifik]
```

### Batasi scope
```
Sesi ini, HANYA kerjakan [X].
Jangan sentuh file lain selain yang aku sebutkan.
Jangan refactor apapun yang tidak langsung berkaitan dengan [X].
```

### Cegah rewrite
```
File [nama file] sudah berjalan dengan benar.
JANGAN rewrite atau restruktur.
Hanya tambahkan [hal spesifik] ke dalamnya.
```

### Jaga formula kredit
```
Formula kredit (DSR, RPC, DSCR, bobot 5C) adalah kebijakan bisnis BPR.
JANGAN ubah threshold atau bobot apapun.
Implementasikan logika dengan nilai yang sudah ada.
```

### Minta summary handoff
```
Kita sudah selesai untuk sesi ini. Berikan:
- Apa yang dibangun
- Keputusan baru yang dibuat
- Entry MISTAKES.md jika ada bug
- Task + file untuk di-paste sesi berikutnya
```

---

## ⚠️ TANDA AI KELUAR JALUR

Stop dan koreksi segera kalau AI:
- Menyarankan ganti PostgreSQL ke database lain
- Mau rewrite file yang tidak kamu sebut
- Mengusulkan ubah threshold DSR/RPC/DSCR
- Tidak pakai middleware auth di route baru
- Mau simpan file ke filesystem alih-alih MinIO
- Hapus atau rename kolom database
- Hardcode credentials atau URL

**Prompt koreksi:**
```
Stop. Kamu keluar dari scope.
Baca ulang bagian LOCKED DECISIONS dan JANGAN DILAKUKAN di context.
Lalu kerjakan ulang hanya task yang aku minta tadi.
```

---

## 🗂️ REFERENSI CEPAT FILE

| File | Kapan Dipakai |
|------|---------------|
| `.ai/CONTEXT.md` | Paste di SETIAP awal sesi |
| `.ai/MISTAKES.md` | Update setiap ada bug baru |
| `.ai/DECISIONS.md` | Update setiap ada keputusan arsitektur |
| `.ai/SESSION_LOG.md` | Update di akhir setiap sesi |
| `CLAUDE.md` | Auto-dibaca Claude Code — jaga tetap updated |

---

## 🐳 PERINTAH DOCKER YANG SERING DIPAKAI

```bash
# Jalankan semua service
docker-compose up -d

# Build ulang setelah perubahan kode
docker-compose up -d --build

# Lihat log semua container
docker-compose logs -f

# Lihat log spesifik
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f wa-gateway

# Jalankan migrasi
docker-compose exec backend npm run migrate

# Jalankan seed
docker-compose exec backend npm run seed

# Akses database langsung
docker-compose exec postgres psql -U postgres -d bpr_bapera

# ⚠️ HANYA DEV/STAGING — hapus semua volume
docker-compose down -v
```
