# Rekomendasi Arsitektur & Best Practices Optimasi OCR

Dokumen ini berisi rekomendasi arsitektur dan *best practices* untuk mengoptimalkan penggunaan OCR pada dokumen Data Debitur (KTP/KK), Agunan (SHM), dan SPT PBB (NJOP) di lingkungan PT BPR BAPERA BATANG.

## 1. Arsitektur Hybrid (Two-Pass OCR Pipeline)

Sistem saat ini sudah menggunakan pendekatan hybrid yang baik (Tesseract sebagai *primary*, VLM/GLM sebagai *fallback*). Untuk memaksimalkannya:

*   **Fast-Pass (Tesseract + Regex/Heuristics):** Digunakan sebagai garda terdepan. Sangat cepat (under 2 detik) dan murah. Cocok untuk dokumen dengan layout terstandar (seperti KTP) yang hasil scan/fotonya jelas.
*   **Deep-Pass (VLM / LLM Fallback):** Digunakan HANYA jika Tesseract gagal atau menghasilkan *confidence score* di bawah *threshold*. Sangat efektif untuk dokumen kompleks (SHM), tulisan tangan, tabel berantakan (SPPT PBB), atau foto miring/silau.

**Rekomendasi *Threshold*:**
*   **KTP / Dokumen Terstruktur:** Set threshold di `0.50` - `0.65`.
*   **SHM / Dokumen Kompleks:** Set threshold lebih tinggi (misal `0.45` - `0.50`). Tesseract sering memaksakan membaca teks yang salah pada dokumen SHM yang memiliki stempel atau tanda tangan, menghasilkan *confidence* palsu. Dengan *threshold* lebih tinggi, sistem akan lebih sering *fallback* ke LLM yang jauh lebih pintar memahami konteks SHM.

## 2. Preprocessing Gambar (Computer Vision)

Kualitas OCR sangat bergantung pada input gambar. Lanjutkan penggunaan OpenCV Python pipeline yang ada, namun pastikan hal berikut:
*   **Deskewing & Perspective Correction:** Tambahkan deteksi sudut (corner detection) untuk memperbaiki foto dokumen yang miring atau difoto dari sudut tertentu (terutama KTP dan SPPT PBB).
*   **Adaptive Binarization:** Jangan gunakan *global thresholding*. Gunakan *adaptive thresholding* (seperti Otsu's atau Bradley) untuk mengatasi bayangan gelap/terang tidak merata pada foto kamera HP.
*   **Noise Removal & Dilation/Erosion:** Untuk menghilangkan bintik-bintik (noise) atau menghubungkan huruf-huruf yang terputus akibat stempel (kasus SHM).
*   **Resolusi:** Pastikan DPI gambar di-upscale ke minimal 300 DPI sebelum masuk ke Tesseract. VLM sebaliknya, seringkali bekerja lebih baik dengan gambar asli (berwarna) karena memanfaatkan informasi warna (seperti warna stempel, tanda tangan). **Selalu kirim gambar original (berwarna) ke VLM, bukan hasil binarization Tesseract.**

## 3. Optimasi Tesseract OCR

*   **PSM (Page Segmentation Mode):**
    *   KTP: PSM `6` (Assume a single uniform block of text).
    *   SHM: PSM `6` atau `4` (bergantung pada halaman, tapi 6 biasanya bekerja paling stabil).
    *   SPPT PBB: PSM `4` (Assume a single column of text of variable sizes) atau `6` (Assume a single uniform block of text). PSM 4 biasanya lebih baik untuk data berbentuk tabel/kolom tak beraturan.
*   **Whitelist Karakter:** Batasi karakter yang boleh dibaca Tesseract.
    *   NIK/Nomor: Jika membaca area NIK, batasi hanya angka `0-9`.
    *   KTP General: `A-Z 0-9 -/.,:` (Hindari karakter aneh seperti `!@#$%`).
*   **Fine-tuning (Tessdata):** Jika memungkinkan, latih (*fine-tune*) model Tesseract `.traineddata` khusus untuk font dokumen Indonesia (Arial/Helvetica standar KTP).

## 4. Optimasi Prompt VLM / LLM

Saat menggunakan LLM (seperti GLM-4V) untuk fallback:
*   **Sangat Spesifik:** Beritahu LLM bentuk dokumennya. *"Kamu adalah ahli baca SHM Indonesia"*.
*   **Aturan Ketat (Zero-Hallucination):** Berikan perintah eksplisit: *"DILARANG mengarang. Jika blur, kosongkan."* LLM cenderung menebak teks yang blur, ini berbahaya untuk data legal seperti Nomor Sertifikat atau Luas Tanah.
*   **Format Output:** Selalu minta *output* dalam bentuk JSON dan berikan skema lengkap beserta tipe datanya (string, integer). Contoh: `{"luas_m2": 0}` bukan `{"luas_m2": ""}`.
*   **Common Pitfalls:** Minta LLM memperhatikan perbedaan `1` dan `I`, `0` dan `O`, terutama di NIK KTP dan NIB SHM.

## 5. Security & Data Privacy

*   Pastikan API LLM yang digunakan mematuhi standar privasi data (tidak melatih model dari data input).
*   Jika menggunakan Tesseract lokal, aman. Namun jika gambar NIK, KK, atau SHM dikirim ke external VLM API, pastikan *endpoint* terenkripsi (HTTPS) dan tidak ada penyimpanan data permanen di sisi vendor LLM.

## 6. Feedback Loop (Continuous Learning)

*   Buat mekanisme di Frontend di mana petugas *Credit Analyst* atau *AO* dapat mengoreksi hasil OCR yang salah.
*   Simpan pasangan *gambar asli* dan *hasil koreksi akhir* ke dalam database khusus sebagai dataset. Dataset ini sangat berharga untuk melatih model mandiri (*fine-tuning*) di masa depan.
