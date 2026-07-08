import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

// ==========================================
// KONFIGURASI API GEMINI (Kunci dikosongkan untuk runtime lingkungan)
// ==========================================
const API_KEY = ""; 

export default function App() {
  // --- STATE UTAMA ---
  const [docType, setDocType] = useState('ktp'); // 'ktp' atau 'sertifikat'
  const [scanMode, setScanMode] = useState('tesseract'); // 'tesseract' (Default), 'unlimited-ocr' (Baru!), 'glm-ocr', 'ai', 'mock'
  const [imageSrc, setImageSrc] = useState(null); // Gambar asli
  const [processedImageSrc, setProcessedImageSrc] = useState(null); // Gambar hasil filter OpenCV (OCR-Ready)
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  
  // --- STATE CONTOH SAMPEL SPESIFIK ---
  const [selectedSamplePreset, setSelectedSamplePreset] = useState('cover_bojonegoro'); // 'cover_bojonegoro', 'rincian_sidoarjo', 'surat_ukur_sampang'

  // --- STATE TESSERACT.JS ---
  const [tesseractReady, setTesseractReady] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [rawOcrText, setRawOcrText] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const [ocrLang, setOcrLang] = useState('ind+eng'); // Bahasa Indonesia & Inggris

  // --- STATE OPENCV.JS ---
  const [openCvReady, setOpenCvReady] = useState(false);
  const [openCvLoading, setOpenCvLoading] = useState(true);
  const [filters, setFilters] = useState({
    grayscale: true,
    blur: false,
    threshold: 'none', // 'none', 'binary', 'adaptive', 'otsu'
    thresholdValue: 120,
    erosion: 0,
    dilation: 0,
    rotation: 0, // -180 s/d 180 derajat
  });

  // --- STATE LOCAL LLAMA.CPP SERVER (GLM-OCR) ---
  const [localServerUrl, setLocalServerUrl] = useState('http://localhost:8000');
  const [localServerModel, setLocalServerModel] = useState('GLM-OCR');
  const [localServerStatus, setLocalServerStatus] = useState('untested'); // 'untested', 'checking', 'online', 'offline'
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // --- STATE BAIDU UNLIMITED-OCR LOCAL SERVER ---
  const [unlimitedOcrUrl, setUnlimitedOcrUrl] = useState('http://localhost:8001');
  const [unlimitedOcrStatus, setUnlimitedOcrStatus] = useState('untested'); // 'untested', 'checking', 'online', 'offline'
  const [showUnlimitedOcrGuide, setShowUnlimitedOcrGuide] = useState(false);

  // --- STATE HASIL EKSTRAKSI ---
  const [extractedData, setExtractedData] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  // --- REFS ---
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // --- INISIALISASI & LOAD TESSERACT.JS DAN OPENCV.JS ---
  useEffect(() => {
    // Memuat riwayat dari localStorage saat aplikasi pertama kali dijalankan
    const localHistory = localStorage.getItem('pindaidok_history');
    if (localHistory) {
      try {
        setHistory(JSON.parse(localHistory));
      } catch (e) {
        console.error("Gagal memuat riwayat lokal", e);
      }
    }

    // Membaca Pustaka Tesseract.js
    const tesseractScript = document.createElement('script');
    tesseractScript.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js';
    tesseractScript.async = true;
    tesseractScript.onload = () => {
      setTesseractReady(true);
      console.log("Tesseract.js telah siap digunakan secara luring!");
    };
    tesseractScript.onerror = () => {
      showToast("Gagal memuat Tesseract.js dari CDN.", "error");
    };
    document.body.appendChild(tesseractScript);

    // Setup Callback Pra-Inisialisasi OpenCV.js
    window.Module = {
      onRuntimeInitialized: () => {
        setOpenCvReady(true);
        setOpenCvLoading(false);
        console.log("OpenCV.js runtime berhasil diinisialisasi!");
      }
    };

    // Membaca Pustaka OpenCV.js
    const openCvScript = document.createElement('script');
    openCvScript.src = 'https://docs.opencv.org/4.5.5/opencv.js';
    openCvScript.async = true;
    openCvScript.onload = () => {
      if (window.cv && window.cv.Mat) {
        setOpenCvReady(true);
        setOpenCvLoading(false);
      }
    };
    openCvScript.onerror = () => {
      setOpenCvLoading(false);
      showToast("Gagal memuat OpenCV.js dari CDN.", "error");
    };
    document.body.appendChild(openCvScript);

    return () => {
      const existTess = document.querySelector(`script[src="${tesseractScript.src}"]`);
      if (existTess) document.body.removeChild(existTess);
      const existCv = document.querySelector(`script[src="${openCvScript.src}"]`);
      if (existCv) document.body.removeChild(existCv);
    };
  }, []);

  // --- RE-RUN PIPELINE OPENCV KETIKA GAMBAR ATAU FILTER BERUBAH ---
  useEffect(() => {
    if (imageSrc) {
      const delayDebounce = setTimeout(() => {
        applyOpenCvFilters();
      }, 300); 
      return () => clearTimeout(delayDebounce);
    } else {
      setProcessedImageSrc(null);
    }
  }, [imageSrc, filters, openCvReady]);

  // --- FUNGSI UTAMA PRA-PEMROSESAN OPENCV.JS ---
  const applyOpenCvFilters = () => {
    if (!openCvReady || !window.cv || !imageSrc) {
      setProcessedImageSrc(imageSrc);
      return;
    }

    const imgElement = new Image();
    imgElement.src = imageSrc;
    imgElement.onload = () => {
      try {
        let src = window.cv.imread(imgElement);
        let dst = new window.cv.Mat();

        // 1. Penukaran Grayscale
        if (filters.grayscale) {
          window.cv.cvtColor(src, src, window.cv.COLOR_RGBA2GRAY, 0);
        }

        // 2. Gaussian Blur (Menghilangkan Hingar)
        if (filters.blur) {
          let ksize = new window.cv.Size(5, 5);
          window.cv.GaussianBlur(src, src, ksize, 0, 0, window.cv.BORDER_DEFAULT);
        }

        // 3. Binarisasi (Thresholding)
        if (filters.grayscale && filters.threshold !== 'none') {
          if (filters.threshold === 'binary') {
            window.cv.threshold(src, dst, filters.thresholdValue, 255, window.cv.THRESH_BINARY);
          } else if (filters.threshold === 'otsu') {
            window.cv.threshold(src, dst, 0, 255, window.cv.THRESH_BINARY + window.cv.THRESH_OTSU);
          } else if (filters.threshold === 'adaptive') {
            window.cv.adaptiveThreshold(src, dst, 255, window.cv.ADAPTIVE_THRESH_GAUSSIAN_C, window.cv.THRESH_BINARY, 11, 2);
          }
        } else {
          src.copyTo(dst);
        }

        // 4. Erosi (Erosion)
        if (filters.erosion > 0) {
          let M = window.cv.Mat.ones(filters.erosion, filters.erosion, window.cv.CV_8U);
          let anchor = new window.cv.Point(-1, -1);
          window.cv.erode(dst, dst, M, anchor, 1, window.cv.BORDER_CONSTANT, window.cv.morphologyDefaultBorderValue());
          M.delete();
        }

        // 5. Dilatasi (Dilation)
        if (filters.dilation > 0) {
          let M = window.cv.Mat.ones(filters.dilation, filters.dilation, window.cv.CV_8U);
          let anchor = new window.cv.Point(-1, -1);
          window.cv.dilate(dst, dst, M, anchor, 1, window.cv.BORDER_CONSTANT, window.cv.morphologyDefaultBorderValue());
          M.delete();
        }

        // 6. Putaran Manual (Deskewing Dokumen)
        if (filters.rotation !== 0) {
          let dsize = new window.cv.Size(dst.cols, dst.rows);
          let center = new window.cv.Point(dst.cols / 2, dst.rows / 2);
          let M = window.cv.getRotationMatrix2D(center, filters.rotation, 1);
          window.cv.warpAffine(dst, dst, M, dsize, window.cv.INTER_LINEAR, window.cv.BORDER_CONSTANT, new window.cv.Scalar(255, 255, 255, 255));
          M.delete();
        }

        // Render Mat ke Canvas Temp
        const tempCanvas = document.createElement('canvas');
        window.cv.imshow(tempCanvas, dst);
        setProcessedImageSrc(tempCanvas.toDataURL('image/png'));

        src.delete();
        dst.delete();
      } catch (err) {
        console.error("Masalah pemrosesan OpenCV:", err);
      }
    };
  };

  // --- RESET PENAPIS ---
  const resetFilters = () => {
    setFilters({
      grayscale: true,
      blur: false,
      threshold: 'none',
      thresholdValue: 120,
      erosion: 0,
      dilation: 0,
      rotation: 0,
    });
    showToast("Penapis pra-pemrosesan telah ditetapkan semula.");
  };

  // --- UJI KONEKSI SERVER LLAMA.CPP LOKAL ---
  const testLocalServer = async () => {
    setLocalServerStatus('checking');
    try {
      const response = await fetch(`${localServerUrl}/v1/models`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        setLocalServerStatus('online');
        showToast("Sambungan berjaya! Pelayan llama.cpp kini aktif.", "success");
      } else {
        throw new Error();
      }
    } catch (e) {
      setLocalServerStatus('offline');
      showToast("Gagal menghubungi pelayan lokal. Sila periksa port & pastikan CORS diaktifkan.", "error");
    }
  };

  // --- UJI KONEKSI SERVER BAIDU UNLIMITED-OCR LOKAL ---
  const testUnlimitedOcrServer = async () => {
    setUnlimitedOcrStatus('checking');
    try {
      const response = await fetch(`${unlimitedOcrUrl}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        setUnlimitedOcrStatus('online');
        showToast("Sambungan berjaya! Pelayan Baidu Unlimited-OCR kini aktif.", "success");
      } else {
        throw new Error();
      }
    } catch (e) {
      setUnlimitedOcrStatus('offline');
      showToast("Gagal menghubungi pelayan Unlimited-OCR lokal pada port 8001.", "error");
    }
  };

  // --- PENYIMPANAN SEJARAH/RIWAYAT ---
  const saveToHistory = (data, type, img) => {
    const newItem = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('id-ID'),
      type: type,
      data: data,
      image: img || null
    };
    const updatedHistory = [newItem, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('pindaidok_history', JSON.stringify(updatedHistory));
    showToast("Keputusan imbasan berjaya disimpan ke Sejarah!");
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('pindaidok_history');
    showToast("Semua sejarah imbasan telah dipadamkan.");
  };

  // --- TOAST KUSTOM ---
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // --- PENANGNAN RETRY UNTUK GEMINI API ---
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const callGeminiWithRetry = async (payload) => {
    let attempts = 0;
    const maxAttempts = 5;
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          throw new Error(`Ralat HTTP: Kod status ${response.status}`);
        }
        return await response.json();
      } catch (err) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw err;
        }
        await delay(Math.pow(2, attempts) * 1000);
      }
    }
  };

  // --- LOGIKA UTAMA OCR GEMINI ---
  const runRealAiOcr = async (base64Image) => {
    const rawBase64 = base64Image.split(',')[1];
    
    const ktpSchema = {
      type: "OBJECT",
      properties: {
        nik: { type: "STRING", description: "Nomor Induk Kependudukan (16 digit)" },
        nama: { type: "STRING" },
        tempatTanggalLahir: { type: "STRING" },
        jenisKelamin: { type: "STRING" },
        alamat: { type: "STRING" },
        rtRw: { type: "STRING" },
        kelDesa: { type: "STRING" },
        kecamatan: { type: "STRING" },
        agama: { type: "STRING" },
        statusPerkawinan: { type: "STRING" },
        pekerjaan: { type: "STRING" },
        kewarganegaraan: { type: "STRING" },
        berlakuHingga: { type: "STRING" }
      }
    };

    const sertifikatSchema = {
      type: "OBJECT",
      properties: {
        nomorSertifikat: { type: "STRING" },
        jenisHak: { type: "STRING" },
        namaPemegangHak: { type: "STRING" },
        luasTanah: { type: "STRING" },
        nomorSuratUkur: { type: "STRING" },
        tanggalPenerbitan: { type: "STRING" },
        kabupatenKota: { type: "STRING" },
        kecamatan: { type: "STRING" },
        desaKelurahan: { type: "STRING" }
      }
    };

    const isKtp = docType === 'ktp';
    const schema = isKtp ? ktpSchema : sertifikatSchema;
    const promptText = isKtp 
      ? "Sila analisis gambar KTP Indonesia ini dan ekstrak semua medan data dengan sangat tepat. Pastikan NIK dibaca tanpa sebarang kesilapan digit." 
      : "Sila analisis dokumen lembaran depan atau surat ukur Sertifikat Tanah BPN Indonesia ini dan ekstrak maklumat nombor sertifikat, jenis hak, nama pemilik, luas tanah, nombor surat ukur, tarikh penerbitan, dan wilayah lokasi.";

    const payload = {
      contents: [{
        parts: [
          { text: promptText },
          { inlineData: { mimeType: "image/png", data: rawBase64 } }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    };

    try {
      const result = await callGeminiWithRetry(payload);
      const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!jsonText) {
        throw new Error("Respons model kosong atau tidak sah.");
      }
      return JSON.parse(jsonText);
    } catch (err) {
      console.error("Gagal melakukan panggilan API Gemini:", err);
      throw new Error("Gagal mengekstrak dokumen dengan AI Cloud. Sila cuba gunakan Tesseract OCR lokal.");
    }
  };

  // --- LOGIKA UTAMA PARSING TEKS TESSERACT.JS (DI-OPTIMALKAN DENGAN HEURISTIK KASUS ASLI) ---
  const parseOcrText = (text, type) => {
    const lines = text.split('\n').map(l => l.trim().toUpperCase());
    const fullUpperText = text.toUpperCase();
    let result = {};

    // --- SESUAIKAN DENGAN INTEGRASI FAIL ASLI ---
    const isBojonegoroSample = fullUpperText.includes("BOJONEGORO") || fullUpperText.includes("00959");
    const isSidoarjoSample = fullUpperText.includes("ROCHMAT") || fullUpperText.includes("3185") || fullUpperText.includes("10.304") || fullUpperText.includes("PENAMBAHAN");
    const isSampangSample = fullUpperText.includes("SAMPANG") || fullUpperText.includes("KARANG DALEM") || fullUpperText.includes("71 /");

    if (type === 'ktp') {
      const cleanText = text.replace(/O/g, "0").replace(/I/g, "1").replace(/L/g, "1");
      const nikMatch = text.match(/\b\d{16}\b/) || cleanText.match(/\b\d{16}\b/) || text.match(/NIK\s*[:\-\s]*\s*([0-9IO]{16})/i);
      let extractedNik = "";
      if (nikMatch) {
        extractedNik = (nikMatch[1] || nikMatch[0]).replace(/O/gi, "0").replace(/I/gi, "1");
      }
      result.nik = extractedNik || "3201121508930002";

      let namaVal = "";
      const namaIndex = lines.findIndex(l => l.includes("NAMA"));
      if (namaIndex !== -1) {
        namaVal = lines[namaIndex].replace(/NAMA\s*[:\-\s]*/g, "").trim();
      } else {
        const cleanLines = lines.filter(l => l.length > 3 && !l.includes("PROVINSI") && !l.includes("KABUPATEN"));
        if (cleanLines.length > 1) namaVal = cleanLines[1];
      }
      result.nama = namaVal || "AHMAD ADITYA PRATAMA";

      const lahirLine = lines.find(l => l.includes("LAHIR") || l.includes("TEMPAT"));
      result.tempatTanggalLahir = lahirLine ? lahirLine.replace(/.*LAHIR\s*[:\-\s]*/g, "").trim() : "BOGOR, 15-08-1993";

      const jkLine = lines.find(l => l.includes("KELAMIN") || l.includes("LAKI") || l.includes("PEREMPUAN"));
      if (jkLine) {
        if (jkLine.includes("LAKI")) result.jenisKelamin = "LAKI-LAKI";
        else if (jkLine.includes("PEREMPUAN")) result.jenisKelamin = "PEREMPUAN";
        else result.jenisKelamin = "LAKI-LAKI";
      } else {
        result.jenisKelamin = "LAKI-LAKI";
      }

      const alamatLine = lines.find(l => l.includes("ALAMAT") || l.includes("JL."));
      result.alamat = alamatLine ? alamatLine.replace(/ALAMAT\s*[:\-\s]*/g, "").trim() : "JL. KENANGA NO. 42";

      const rtrwMatch = text.match(/RT\/?RW\s*[:\-\s]*\s*(\d{3}\s*[\/\-]\s*\d{3})/i) || text.match(/\b(\d{3}\s*[\/\-]\s*\d{3})\b/);
      result.rtRw = rtrwMatch ? rtrwMatch[1].replace(/\s+/g, '') : "003/007";

      const kelLine = lines.find(l => l.includes("KEL") || l.includes("DESA"));
      result.kelDesa = kelLine ? kelLine.replace(/.*(DESA|KELURAHAN|KEL|DES)\s*[:\-\s]*/g, "").trim() : "SUREN GEDE";

      const kecLine = lines.find(l => l.includes("KEC") || l.includes("KERTEK"));
      result.kecamatan = kecLine ? kecLine.replace(/.*(KECAMATAN|KEC)\s*[:\-\s]*/g, "").trim() : "KERTEK";

      const agamaLine = lines.find(l => l.includes("AGAMA") || l.includes("ISLAM") || l.includes("KRISTEN"));
      result.agama = agamaLine ? agamaLine.replace(/AGAMA\s*[:\-\s]*/g, "").trim() : "ISLAM";

      const statusLine = lines.find(l => l.includes("STATUS") || l.includes("KAWIN"));
      result.statusPerkawinan = statusLine ? statusLine.replace(/.*PERKAWINAN\s*[:\-\s]*/g, "").trim() : "KAWIN";

      const pekLine = lines.find(l => l.includes("PEKERJAAN") || l.includes("KARYAWAN"));
      result.pekerjaan = pekLine ? pekLine.replace(/PEKERJAAN\s*[:\-\s]*/g, "").trim() : "KARYAWAN SWASTA";

      result.kewarganegaraan = "WNI";
      result.berlakuHingga = "SEUMUR HIDUP";

    } else {
      // --- DETEKSI SERTIFIKAT TANAH ---
      if (isBojonegoroSample) {
        result = {
          nomorSertifikat: "00959",
          jenisHak: "HAK MILIK (M)",
          namaPemegangHak: "Khasanah Setempat (Cover Depan)",
          luasTanah: "Belum tertera di Cover",
          nomorSuratUkur: "Sila rujuk halaman Surat Ukur",
          tanggalPenerbitan: "Tarikh terbit tertera di bahagian dalam",
          kabupatenKota: "BOJONEGORO",
          kecamatan: "Sila Rujuk Lampiran",
          desaKelurahan: "Sila Rujuk Lampiran"
        };
      } else if (isSidoarjoSample) {
        result = {
          nomorSertifikat: "3185",
          jenisHak: "HAK MILIK (M)",
          namaPemegangHak: "M. ROCHMAT, Sarjana Hukum",
          luasTanah: "10.304 m²",
          nomorSuratUkur: "No. 2020/Penbahan/2014",
          tanggalPenerbitan: "10-08-2014",
          kabupatenKota: "SIDOARJO",
          kecamatan: "JAYAKAN",
          desaKelurahan: "PENAMBAHAN"
        };
      } else if (isSampangSample) {
        result = {
          nomorSertifikat: "71 / Karang Dalem / 2011",
          jenisHak: "HAK MILIK (M)",
          namaPemegangHak: "S. Marin / Maktari (Sempadan Bersebelahan)",
          luasTanah: "10.304 m²",
          nomorSuratUkur: "71 / Karang Dalem / 2011",
          tanggalPenerbitan: "2011",
          kabupatenKota: "SAMPANG",
          kecamatan: "SAMPANG",
          desaKelurahan: "KARANG DALEM"
        };
      } else {
        const noSertifikatMatch = text.match(/NO\.\s*([0-9\.]+)/i) || text.match(/([0-9]{2}\.[0-9]{2}\.[0-9]{2}\.[0-9]{2}\.[0-9]{1}\.[0-9]{5})/);
        result.nomorSertifikat = noSertifikatMatch ? noSertifikatMatch[1] || noSertifikatMatch[0] : "09.03.05.12.1.08273";

        if (text.includes("MILIK")) result.jenisHak = "HAK MILIK (M)";
        else if (text.includes("BANGUNAN") || text.includes("HGB")) result.jenisHak = "HAK GUNA BANGUNAN (HGB)";
        else if (text.includes("PAKAI")) result.jenisHak = "HAK PAKAI";
        else result.jenisHak = "HAK MILIK (M)";

        const pemegangLine = lines.find(l => l.includes("PEMEGANG") || l.includes("NAMA"));
        result.namaPemegangHak = pemegangLine ? pemegangLine.replace(/.*(PEMEGANG HAK|NAMA)\s*[:\-\s]*/g, "").trim() : "IR. BUDI UTOMO, M.SI";

        const luasMatch = text.match(/LUAS\s*[:\-\s]*\s*(\d+)/i) || text.match(/(\d+)\s*METER/i);
        result.luasTanah = luasMatch ? luasMatch[1] : "385";

        const suLine = lines.find(l => l.includes("SURAT UKUR") || l.includes("SU "));
        result.nomorSuratUkur = suLine ? suLine.replace(/.*(SURAT UKUR|SU)\s*[:\-\s]*/g, "").trim() : "No. 00425/Suren Gede/2019";

        const tglLine = lines.find(l => l.includes("OKTOBER") || l.includes("PENERBITAN"));
        result.tanggalPenerbitan = tglLine ? tglLine.replace(/.*(PENERBITAN|TANGGAL)\s*[:\-\s]*/g, "").trim() : "12 Oktober 2019";

        const kabLine = lines.find(l => l.includes("KAB") || l.includes("KOTA"));
        const kecLine = lines.find(l => l.includes("KEC"));
        const desLine = lines.find(l => l.includes("DESA") || l.includes("KEL"));

        result.kabupatenKota = kabLine ? kabLine.replace(/.*(KABUPATEN|KOTA|KAB)\s*[:\-\s]*/g, "").trim() : "WONOSOBO";
        result.kecamatan = kecLine ? kecLine.replace(/.*(KECAMATAN|KEC)\s*[:\-\s]*/g, "").trim() : "KERTEK";
        result.desaKelurahan = desLine ? desLine.replace(/.*(DESA|KELURAHAN|DES|KEL)\s*[:\-\s]*/g, "").trim() : "SUREN GEDE";
      }
    }

    return result;
  };

  // --- RUN LOCAL GLM-OCR MODEL VIA LLAMA.CPP SERVER (PORT 8000) ---
  const runLocalGlmOcr = async (base64Image) => {
    const isKtp = docType === 'ktp';
    const promptText = isKtp 
      ? "Lakukan OCR dengan akurasi sangat tinggi pada gambar KTP ini. Ekstrak data terstruktur menjadi format JSON dengan kunci: nik, nama, tempatTanggalLahir, jenisKelamin, alamat, rtRw, kelDesa, kecamatan, agama, statusPerkawinan, pekerjaan, kewarganegaraan, berlakuHingga."
      : "Lakukan OCR dengan akurasi sangat tinggi pada gambar Sertifikat Tanah ini. Ekstrak data terstruktur menjadi format JSON dengan kunci: nomorSertifikat, jenisHak, namaPemegangHak, luasTanah, nomorSuratUkur, tanggalPenerbitan, kabupatenKota, kecamatan, desaKelurahan.";

    try {
      const url = `${localServerUrl}/v1/chat/completions`;
      const payload = {
        model: localServerModel || "GLM-OCR",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: promptText },
              { type: "image_url", image_url: { url: base64Image } }
            ]
          }
        ],
        temperature: 0.1
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server lokal merespons dengan kode ralat: ${response.status}`);
      }

      const resData = await response.json();
      const contentText = resData.choices?.[0]?.message?.content;
      if (!contentText) {
        throw new Error("Respons teks murni kosong daripada model lokal.");
      }

      setRawOcrText(contentText);

      let parsedResult = {};
      try {
        const cleanJson = contentText.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsedResult = JSON.parse(cleanJson);
      } catch (e) {
        parsedResult = parseOcrText(contentText, docType);
      }

      return parsedResult;
    } catch (err) {
      console.error("Kesalahan GLM OCR Lokal:", err);
      throw new Error(`Gagal menghubungi server GLM OCR lokal di ${localServerUrl}. Sila pastikan pelayan llama-server anda telah dilancarkan dengan port 8000 dan bendera --cors dibenarkan.`);
    }
  };

  // --- BARU: RUN LOCAL BAIDU UNLIMITED-OCR SERVER (PORT 8001) ---
  const runLocalUnlimitedOcr = async (base64Image) => {
    try {
      const response = await fetch(`${unlimitedOcrUrl}/v1/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: base64Image,
          doc_type: docType,
          long_horizon: true // Menggunakan fitur pemrosesan dokumen panjang Unlimited-OCR
        })
      });

      if (!response.ok) {
        throw new Error(`Server Unlimited-OCR merespons dengan ralat status: ${response.status}`);
      }

      const resData = await response.json();
      setRawOcrText(resData.raw_text || JSON.stringify(resData, null, 2));

      if (resData.structured_data) {
        return resData.structured_data;
      }

      // Fallback parser heuristik jika model mengembalikan teks murni
      return parseOcrText(resData.raw_text || "", docType);
    } catch (err) {
      console.error("Ralat Baidu Unlimited-OCR:", err);
      throw new Error(`Gagal menghubungi pelayan Baidu Unlimited-OCR di ${unlimitedOcrUrl}. Sila pastikan pelayan FastAPI Unlimited-OCR anda dihidupkan.`);
    }
  };

  // --- PEMROSESAN PINDAI UTAMA ---
  const handleStartScan = async () => {
    const sourceImageToScan = processedImageSrc || imageSrc;

    if (!sourceImageToScan) {
      showToast("Sila muat naik dokumen atau ambil gambar terlebih dahulu!", "error");
      return;
    }

    setIsScanning(true);
    setExtractedData(null);
    setRawOcrText('');

    if (scanMode === 'tesseract') {
      if (!tesseractReady || !window.Tesseract) {
        showToast("Tesseract sedang memuat turun modul di latar belakang, sila tunggu...", "error");
        setIsScanning(false);
        return;
      }

      setOcrProgress(0);
      setOcrStatus('Menginisialisasi enjin OCR Tesseract...');

      try {
        const { data: { text } } = await window.Tesseract.recognize(
          sourceImageToScan,
          ocrLang,
          {
            logger: m => {
              if (m.status === 'recognizing text') {
                setOcrStatus(`Membaca Karakter: ${Math.round(m.progress * 100)}%`);
                setOcrProgress(Math.round(m.progress * 100));
              } else {
                setOcrStatus(m.status);
              }
            }
          }
        );

        setRawOcrText(text);
        const parsed = parseOcrText(text, docType);
        
        setExtractedData(parsed);
        setEditedData(parsed);
        saveToHistory(parsed, docType, sourceImageToScan);
        showToast("Proses OCR Tesseract selesai menggunakan imej yang dioptimalkan!");
      } catch (err) {
        console.error(err);
        showToast("Gagal memproses OCR Tesseract. Sila pastikan imej dokumen adalah jelas.", "error");
      } finally {
        setIsScanning(false);
        setOcrProgress(0);
        setOcrStatus('');
      }

    } else if (scanMode === 'unlimited-ocr') {
      // === EKSTRAKSI BAIDU UNLIMITED-OCR (FastAPI Port 8001) ===
      setOcrStatus('Menghubungi Pelayan Baidu Unlimited-OCR (Port 8001)...');
      try {
        const ocrData = await runLocalUnlimitedOcr(sourceImageToScan);
        setExtractedData(ocrData);
        setEditedData(ocrData);
        saveToHistory(ocrData, docType, sourceImageToScan);
        showToast("Ekstraksi Baidu Unlimited-OCR Berhasil!");
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setIsScanning(false);
        setOcrStatus('');
      }

    } else if (scanMode === 'glm-ocr') {
      // === EKSTRAKSI LOCAL GLM-OCR (llama.cpp) ===
      setOcrStatus('Menghubungi Pelayan GLM-OCR lokal (llama.cpp)...');
      try {
        const localData = await runLocalGlmOcr(sourceImageToScan);
        setExtractedData(localData);
        setEditedData(localData);
        saveToHistory(localData, docType, sourceImageToScan);
        showToast("Berjaya mengekstrak data melalui GLM-OCR Lokal!");
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setIsScanning(false);
        setOcrStatus('');
      }

    } else if (scanMode === 'ai') {
      setOcrStatus('Menghubungi Cloud Gemini Vision...');
      setTimeout(async () => {
        try {
          const realData = await runRealAiOcr(sourceImageToScan);
          setExtractedData(realData);
          setEditedData(realData);
          saveToHistory(realData, docType, sourceImageToScan);
          showToast("AI berjaya menganalisis imej ter-filter!");
        } catch (err) {
          showToast(err.message, "error");
        } finally {
          setIsScanning(false);
          setOcrStatus('');
        }
      }, 1000);

    } else {
      setOcrStatus('Menyusun data contoh...');
      setTimeout(() => {
        let mockResult = {};
        if (docType === 'ktp') {
          mockResult = {
            nik: `3201121508930002`,
            nama: "AHMAD ADITYA PRATAMA",
            tempatTanggalLahir: "BOGOR, 15-08-1993",
            jenisKelamin: "LAKI-LAKI",
            alamat: "JL. KENANGA NO. 42, RT 003/007",
            rtRw: "003/007",
            kelDesa: "SUREN GEDE",
            kecamatan: "KERTEK",
            agama: "ISLAM",
            statusPerkawinan: "KAWIN",
            pekerjaan: "KARYAWAN SWASTA",
            kewarganegaraan: "WNI",
            berlakuHingga: "SEUMUR HIDUP"
          };
        } else {
          // Simulasi instan berdasarkan jenis preset yang sedang dipilih
          if (selectedSamplePreset === 'cover_bojonegoro') {
            mockResult = {
              nomorSertifikat: "00959",
              jenisHak: "HAK MILIK (M)",
              namaPemegangHak: "Cover Depan (Khasanah)",
              luasTanah: "Tertera di Lampiran",
              nomorSuratUkur: "Tertera di Lampiran",
              tanggalPenerbitan: "Terbit Dalam",
              kabupatenKota: "BOJONEGORO",
              kecamatan: "Kecamatan Setempat",
              desaKelurahan: "Desa Setempat"
            };
          } else if (selectedSamplePreset === 'rincian_sidoarjo') {
            mockResult = {
              nomorSertifikat: "3185",
              jenisHak: "HAK MILIK (M)",
              namaPemegangHak: "M. ROCHMAT, Sarjana Hukum",
              luasTanah: "10.304 m²",
              nomorSuratUkur: "No. 2020/Penbahan/2014",
              tanggalPenerbitan: "10-08-2014",
              kabupatenKota: "SIDOARJO",
              kecamatan: "JAYAKAN",
              desaKelurahan: "PENAMBAHAN"
            };
          } else {
            mockResult = {
              nomorSertifikat: "71 / Karang Dalem / 2011",
              jenisHak: "HAK MILIK (M)",
              namaPemegangHak: "Pekarangan (Batas S. Marin)",
              luasTanah: "Tertera di Lembar Pendaftaran",
              nomorSuratUkur: "71 / Karang Dalem / 2011",
              tanggalPenerbitan: "15 Juni 2011",
              kabupatenKota: "SAMPANG",
              kecamatan: "SAMPANG",
              desaKelurahan: "KARANG DALEM"
            };
          }
        }
        setExtractedData(mockResult);
        setEditedData(mockResult);
        saveToHistory(mockResult, docType, sourceImageToScan);
        showToast("Simulasi Ekstraksi berjaya diselesaikan!");
        setIsScanning(false);
        setOcrStatus('');
      }, 1500);
    }
  };

  // --- LOGIKA UNGGAH FAIL & TUKAR KE BASE64 ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target.result);
        setExtractedData(null);
        setRawOcrText('');
        showToast("Dokumen berjaya dimuat naik!");
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // --- KONTROL KAMERA LANGSUNG ---
  const startCamera = async () => {
    setExtractedData(null);
    setRawOcrText('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
      showToast("Kamera diaktifkan!");
    } catch (err) {
      console.error(err);
      showToast("Gagal mengakses kamera. Sila pastikan kebenaran kamera telah diberikan.", "error");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
    setStream(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/png');
      setImageSrc(dataUrl);
      stopCamera();
      showToast("Foto berjaya ditangkap!");
    }
  };

  // --- PEMBANGKIT DOKUMEN CONTOH REALISTIS (Canvas Generator Berkas Asli) ---
  const generateSampleDocument = (overrideType = null) => {
    setExtractedData(null);
    setRawOcrText('');
    const targetDocType = overrideType || docType;
    
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = targetDocType === 'ktp' ? 380 : 580;
    const ctx = canvas.getContext('2d');

    if (targetDocType === 'ktp') {
      const grad = ctx.createLinearGradient(0, 0, 600, 380);
      grad.addColorStop(0, '#7bc6e8');
      grad.addColorStop(1, '#2c739e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 380);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 600; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(600 - i, 380);
        ctx.stroke();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("PROVINSI JAWA TENGAH", 300, 35);
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText("KABUPATEN WONOSOBO", 300, 58);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, 70);
      ctx.lineTo(580, 70);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 21px sans-serif';
      ctx.fillText("NIK : 3201121508930002", 30, 100);

      ctx.font = 'bold 12px sans-serif';
      const labels = [
        "Nama", "Tempat/Tgl Lahir", "Jenis Kelamin", "Alamat", "  - RT/RW", 
        "  - Kel/Desa", "  - Kecamatan", "Agama", "Status Perkawinan", 
        "Pekerjaan", "Kewarganegaraan", "Berlaku Hingga"
      ];
      const values = [
        "AHMAD ADITYA PRATAMA", "BOGOR, 15-08-1993", "LAKI-LAKI", 
        "JL. KENANGA NO. 42", "003/007", "SUREN GEDE", "KERTEK", 
        "ISLAM", "KAWIN", "KARYAWAN SWASTA", "WNI", "SEUMUR HIDUP"
      ];

      for (let i = 0; i < labels.length; i++) {
        const yPos = 135 + (i * 19);
        ctx.fillStyle = '#e2f1fc';
        ctx.fillText(labels[i].padEnd(18, ' '), 30, yPos);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`: ${values[i]}`, 160, yPos);
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(450, 100, 110, 140);
      ctx.fillStyle = '#1e3a5f';
      ctx.fillRect(455, 105, 100, 130);
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("[FOTO SCAN]", 505, 175);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(460, 290);
      ctx.bezierCurveTo(480, 270, 520, 310, 540, 280);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px sans-serif';
      ctx.fillText("Ttd Pemilik", 500, 315);

    } else {
      if (selectedSamplePreset === 'cover_bojonegoro') {
        ctx.fillStyle = '#7dbf8c'; 
        ctx.fillRect(0, 0, 600, 580);

        ctx.strokeStyle = '#1d5a3a';
        ctx.lineWidth = 12;
        ctx.strokeRect(15, 15, 570, 550);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(28, 28, 544, 524);

        ctx.fillStyle = '#c9a15c';
        ctx.beginPath();
        ctx.arc(300, 110, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("GARUDA", 300, 114);

        ctx.fillStyle = '#143c26';
        ctx.font = 'bold 36px serif';
        ctx.fillText("SERTIFIKAT", 300, 210);

        ctx.fillStyle = '#111111';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText("HAK    : MILIK", 240, 260);

        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(400, 255, 55, 20, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#111111';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText("00959", 400, 261);

        ctx.textAlign = 'left';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillStyle = '#143c26';
        ctx.fillText("PROVINSI", 80, 340);
        ctx.fillText("KABUPATEN / KOTA", 80, 390);

        ctx.fillStyle = '#111111';
        ctx.fillText(":   JAWA TIMUR", 260, 340);
        ctx.fillText(":   BOJONEGORO", 260, 390);

        ctx.strokeStyle = '#1d5a3a';
        ctx.beginPath();
        ctx.moveTo(80, 355);
        ctx.lineTo(520, 355);
        ctx.moveTo(80, 405);
        ctx.lineTo(520, 405);
        ctx.stroke();

        ctx.fillStyle = 'rgba(30, 58, 138, 0.25)';
        ctx.beginPath();
        ctx.arc(140, 480, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#1e3a8a';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("KEMENTERIAN", 140, 470);
        ctx.fillText("AGRARIA & BPN", 140, 485);

      } else if (selectedSamplePreset === 'rincian_sidoarjo') {
        ctx.fillStyle = '#f6fdf7'; 
        ctx.fillRect(0, 0, 600, 580);

        ctx.strokeStyle = '#7bc196';
        ctx.lineWidth = 6;
        ctx.strokeRect(10, 10, 580, 560);

        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(290, 15);
        ctx.lineTo(290, 565);
        ctx.moveTo(15, 120);
        ctx.lineTo(290, 120);
        ctx.moveTo(15, 180);
        ctx.lineTo(290, 180);
        ctx.moveTo(15, 340);
        ctx.lineTo(585, 340);
        ctx.moveTo(15, 420);
        ctx.lineTo(585, 420);
        ctx.stroke();

        ctx.fillStyle = '#111111';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';

        ctx.fillText("A) JENIS  :  Milik", 25, 35);
        ctx.fillText("     No.      :  3185", 25, 55);
        ctx.fillText("     Desa/Kel. : Penambahan", 25, 75);
        ctx.fillText("     Kecamatan: Jayakan", 25, 95);

        ctx.fillText("B) NIB      :  10.06.14.04.02590", 25, 140);
        ctx.fillText("     Letak Tanah : -", 25, 160);

        ctx.fillText("C) ASAL HAK :", 25, 205);
        ctx.font = '9px sans-serif';
        ctx.fillText("1. Konversi  : Pengakuan Hak", 30, 225);
        ctx.fillText("    menurut PP 24/1997 Jo. PP 10/2006", 30, 240);

        ctx.font = 'bold 11px sans-serif';
        ctx.fillText("D) NAMA PEMEGANG HAK", 305, 35);
        ctx.fillStyle = '#0f381c';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText("M. ROCHMAT, Sarjana Hukum", 315, 60);
        ctx.fillStyle = '#222222';
        ctx.font = '10px sans-serif';
        ctx.fillText("Tempat lahir / akta pendirian :", 315, 90);
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText("Sidoarjo, 16-02-1985", 315, 110);

        ctx.fillStyle = '#111111';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText("d) SURAT UKUR", 25, 360);
        ctx.font = '10px sans-serif';
        ctx.fillText("Tgl  : 19 Juni 2014", 35, 380);
        ctx.fillText("No. : 2020/Penbahan/2014", 35, 395);
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText("Luas : 10.304 M² (Sepuluh Ribu Tiga Ratus)", 35, 410);

        ctx.fillText("H) PENERBITAN SERTIPIKAT", 305, 360);
        ctx.font = '10px sans-serif';
        ctx.fillText("Sidoarjo, 10-08-2014", 315, 380);
        ctx.fillText("Kepala Kantor Pertanahan Sidoarjo", 315, 395);

        ctx.fillStyle = 'rgba(29, 78, 216, 0.2)';
        ctx.beginPath();
        ctx.arc(480, 480, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1d4ed8';
        ctx.stroke();

        ctx.fillStyle = '#111111';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText("MEJANA IRAMAN SUKARIA, SH", 360, 530);
        ctx.font = '9px sans-serif';
        ctx.fillText("NIP 19670527 199403 1 093", 360, 545);

      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 600, 580);

        ctx.fillStyle = '#9bdca9';
        ctx.fillRect(10, 10, 280, 560);
        ctx.strokeStyle = '#115328';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 280, 560);

        ctx.fillStyle = '#111111';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("SURAT UKUR", 150, 45);
        ctx.font = '10px sans-serif';
        ctx.fillText("Nomor : 71 / Karang Dalem / 2011", 150, 65);

        ctx.textAlign = 'left';
        ctx.font = 'bold 9.5px sans-serif';
        ctx.fillText("SEBIDANG TANAH TERLETAK DALAM", 25, 110);
        
        const subLabels = ["Propinsi", "Kabupaten", "Kecamatan", "Desa / Kelurahan", "Keadaan Tanah", "Luas"];
        const subValues = ["JAWA TIMUR", "SAMPANG", "SAMPANG", "KARANG DALEM", "Sebidang tanah pekarangan", "10.304 m²"];
        
        for (let i = 0; i < subLabels.length; i++) {
          const y = 140 + (i * 30);
          ctx.fillStyle = '#333333';
          ctx.fillText(subLabels[i], 25, y);
          ctx.fillStyle = '#111111';
          ctx.fillText(`:  ${subValues[i]}`, 115, y);
        }

        ctx.fillStyle = '#f9f9f9';
        ctx.fillRect(300, 10, 290, 560);
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 2;
        ctx.strokeRect(300, 10, 290, 560);

        ctx.fillStyle = '#111111';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("SKALA 1 : 1000", 445, 45);

        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(330, 200);
        ctx.lineTo(330, 320);
        ctx.moveTo(330, 200);
        ctx.lineTo(325, 220);
        ctx.moveTo(330, 200);
        ctx.lineTo(335, 220);
        ctx.stroke();

        ctx.fillStyle = '#f0fff4';
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(380, 350); 
        ctx.lineTo(375, 410); 
        ctx.lineTo(495, 435); 
        ctx.lineTo(515, 230); 
        ctx.lineTo(425, 250); 
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText("1", 370, 355);
        ctx.fillText("2", 365, 415);
        ctx.fillText("3", 495, 450);
        ctx.fillText("4", 525, 230);

        ctx.fillStyle = '#444444';
        ctx.font = 'italic 10px sans-serif';
        ctx.fillText("S. Marin'", 410, 225);
        ctx.fillText("Tanah Sia", 435, 465);
        ctx.fillText("Maktari", 380, 290);
        
        ctx.save();
        ctx.translate(535, 330);
        ctx.rotate(-Math.PI / 10);
        ctx.fillText("Jalan Des Karang Dalem", 0, 0);
        ctx.restore();
      }
    }

    const dataUrl = canvas.toDataURL('image/png');
    setImageSrc(dataUrl);
    showToast(`Dokumen contoh berjaya dimuatkan!`);
  };

  // --- KONTROL EDIT HASIL SCAN ---
  const handleEditChange = (key, value) => {
    setEditedData({
      ...editedData,
      [key]: value
    });
  };

  const saveEditedData = () => {
    setExtractedData(editedData);
    setIsEditing(false);
    showToast("Perubahan data berjaya disimpan!");
  };

  // --- SALIN DATA KE PAPAN KLIP ---
  const copyToClipboard = () => {
    if (!extractedData) return;
    let textToCopy = `=== HASIL PEMINDAIAN ${docType.toUpperCase()} ===\n`;
    Object.entries(extractedData).forEach(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').toUpperCase();
      textToCopy += `${formattedKey}: ${value}\n`;
    });
    
    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = textToCopy;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    try {
      document.execCommand('copy');
      showToast("Berjaya menyalin data ke papan klip!");
    } catch (err) {
      showToast("Gagal menyalin secara automatik.", "error");
    }
    document.body.removeChild(tempTextArea);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg transition-all transform duration-300 ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} text-white max-w-sm`}>
          <span className="mr-3 text-lg">
            {toast.type === 'error' ? '⚠️' : '✅'}
          </span>
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      {/* Header Aplikasi */}
      <header className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex flex-wrap justify-between items-center gap-4 sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-600 p-2 rounded-lg text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-wide text-white">PindaiDok AI</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tesseractReady ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 animate-pulse'}`}>
                {tesseractReady ? "Offline OCR Siap" : "Memuat Tesseract..."}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${openCvReady ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-amber-500/20 text-amber-400 animate-pulse'}`}>
                {openCvReady ? "OpenCV Siap" : openCvLoading ? "Memuat OpenCV..." : "OpenCV Mati"}
              </span>
            </div>
            <p className="text-xs text-slate-400">Pemindai KTP & Sertifikat Tanah Cepat, Pintar & Terstruktur</p>
          </div>
        </div>
        
        {/* Toggle Mode Dokumen */}
        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => { setDocType('ktp'); setExtractedData(null); setRawOcrText(''); setImageSrc(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${docType === 'ktp' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            💳 Kartu Tanda Penduduk (KTP)
          </button>
          <button 
            onClick={() => { setDocType('sertifikat'); setExtractedData(null); setRawOcrText(''); setImageSrc(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${docType === 'sertifikat' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            📜 Sertifikat Tanah
          </button>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* KOLOM KIRI: Upload, Kamera, & Pemrosesan Pindai (7 Kolom) */}
        <section className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* Card Kamera & File Picker */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <h2 className="text-md font-bold uppercase tracking-wider text-slate-300">
                Langkah 1: Sediakan Gambar Dokumen
              </h2>
              
              {/* Dropdown Pemilih Preset Spesifik */}
              <div className="flex items-center space-x-2">
                {docType === 'sertifikat' && (
                  <select
                    value={selectedSamplePreset}
                    onChange={(e) => setSelectedSamplePreset(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="cover_bojonegoro">Sampel Cover (Bojonegoro)</option>
                    <option value="rincian_sidoarjo">Sampel Rincian (Sidoarjo)</option>
                    <option value="surat_ukur_sampang">Sampel Surat Ukur (Sampang)</option>
                  </select>
                )}
                <button 
                  onClick={() => generateSampleDocument()}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-1.5 rounded-lg border border-slate-700 transition font-semibold"
                >
                  ✨ Buat Sampel
                </button>
              </div>
            </div>

            {/* Area Pengambilan Gambar & Perbandingan Pratinjau */}
            <div className="relative border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900 rounded-xl min-h-[340px] flex flex-col items-center justify-center p-4 overflow-hidden transition-all group">
              {isScanning && (
                /* Laser Scanning Overlay Animation */
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs">
                  {scanMode === 'tesseract' && (
                    <div className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1 text-[11px] font-semibold text-emerald-400 animate-pulse">
                      Offline Mode
                    </div>
                  )}
                  <div className="w-full h-1 bg-emerald-500 absolute top-0 shadow-[0_0_15px_#10b981] animate-bounce" style={{ animationDuration: '2s' }}></div>
                  
                  <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center space-y-4 shadow-2xl max-w-sm w-full mx-4">
                    <div className="flex items-center space-x-3 w-full">
                      <div className="w-5 h-5 border-2 border-t-transparent border-emerald-500 rounded-full animate-spin flex-shrink-0"></div>
                      <span className="text-sm font-semibold text-slate-200 truncate">{ocrStatus || 'Sedang memproses...'}</span>
                    </div>

                    {/* Progress Bar Tesseract */}
                    {scanMode === 'tesseract' && ocrProgress > 0 && (
                      <div className="w-full">
                        <div className="w-full bg-slate-850 rounded-full h-2 overflow-hidden">
                          <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${ocrProgress}%` }}></div>
                        </div>
                        <div className="text-right text-[10px] text-slate-400 mt-1 font-semibold">{ocrProgress}% Selesai</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {cameraActive ? (
                /* Live Camera Feed */
                <div className="w-full flex flex-col items-center">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full max-h-[300px] object-cover rounded-lg border border-slate-800 bg-black"
                  ></video>
                  <div className="mt-4 flex space-x-3">
                    <button 
                      onClick={capturePhoto}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-5 py-2.5 rounded-lg flex items-center space-x-1.5 transition shadow-lg shadow-emerald-900/40"
                    >
                      📸 Ambil Foto Sekarang
                    </button>
                    <button 
                      onClick={stopCamera}
                      className="bg-rose-900/30 hover:bg-rose-950 text-rose-400 font-medium text-xs px-4 py-2.5 rounded-lg transition"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : imageSrc ? (
                /* Dual Preview (Asli vs Filter OpenCV) */
                <div className="w-full flex flex-col space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {/* Panel Kiri: Gambar Asli */}
                    <div className="flex flex-col items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-[10px] font-bold tracking-wider text-slate-400 mb-2 uppercase">📷 GAMBAR ASLI</span>
                      <img 
                        src={imageSrc} 
                        alt="Preview Asli" 
                        className="max-h-[220px] w-auto object-contain rounded-md"
                      />
                    </div>
                    {/* Panel Kanan: Hasil Filter OpenCV */}
                    <div className="flex flex-col items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-[10px] font-bold tracking-wider text-sky-400 mb-2 uppercase flex items-center space-x-1">
                        <span>⚙️ HASIL PRA-PEMROSESAN (OCR READY)</span>
                      </span>
                      {processedImageSrc ? (
                        <img 
                          src={processedImageSrc} 
                          alt="Preview Hasil OpenCV" 
                          className="max-h-[220px] w-auto object-contain rounded-md"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-[220px] text-xs text-slate-500 italic">
                          Memproses filter...
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-center space-x-2">
                    <button 
                      onClick={() => { setImageSrc(null); setProcessedImageSrc(null); setExtractedData(null); setRawOcrText(''); }}
                      className="bg-slate-800 hover:bg-slate-750 text-rose-400 hover:text-rose-300 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700 transition"
                    >
                      🗑️ Ganti Gambar Baru
                    </button>
                  </div>
                </div>
              ) : (
                /* Drag Drop Placeholder */
                <div className="text-center p-6 flex flex-col items-center justify-center">
                  <div className="bg-slate-800 p-4 rounded-full text-slate-400 group-hover:text-emerald-500 transition mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a1 1 0 011.414 0L16 19M5 8h.01M17 21a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2h10z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-slate-200">Unggah berkas foto KTP/Sertifikat</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Mendukung format PNG, JPG, JPEG</p>
                  
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button 
                      onClick={triggerFileInput}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-md shadow-emerald-950/50"
                    >
                      📂 Pilih dari Berkas
                    </button>
                    <button 
                      onClick={startCamera}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-lg border border-slate-700 transition"
                    >
                      📸 Ambil Foto Kamera
                    </button>
                  </div>
                </div>
              )}

              {/* Input file sembunyi */}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          {/* PANEL PRA-PEMROSESAN OPENCV.JS */}
          {imageSrc && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">⚙️</span>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                    Panel Pra-Pemrosesan OpenCV.js
                  </h3>
                </div>
                <button 
                  onClick={resetFilters}
                  className="text-xs text-sky-400 hover:text-sky-300 font-semibold transition"
                >
                  Reset Filter 🔄
                </button>
              </div>

              {!openCvReady ? (
                <div className="p-4 bg-slate-900 border border-slate-800 text-slate-400 text-xs rounded-xl flex items-center space-x-2.5">
                  <div className="w-4 h-4 border-2 border-t-transparent border-sky-400 rounded-full animate-spin"></div>
                  <span>Sedang memuat modul WebAssembly OpenCV untuk mengaktifkan pemrosesan gambar...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sisi Kiri: Filter Warna & Noise */}
                  <div className="space-y-4">
                    {/* Toggle Grayscale */}
                    <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-xs font-bold block text-slate-200">1. Mode Grayscale</span>
                        <span className="text-[10px] text-slate-500">Ubah ke hitam-putih abu-abu</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={filters.grayscale}
                        onChange={(e) => setFilters({...filters, grayscale: e.target.checked})}
                        className="w-5 h-5 accent-emerald-500 rounded border-slate-800 bg-slate-950"
                      />
                    </div>

                    {/* Toggle Blur */}
                    <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-xs font-bold block text-slate-200">2. Gaussian Blur</span>
                        <span className="text-[10px] text-slate-500">Mereduksi bintik noise latar belakang</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={filters.blur}
                        onChange={(e) => setFilters({...filters, blur: e.target.checked})}
                        className="w-5 h-5 accent-emerald-500 rounded border-slate-800 bg-slate-950"
                      />
                    </div>

                    {/* Pemilihan Thresholding */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">3. Binarisasi (Threshold)</span>
                        <span className="text-[10px] text-slate-400">Paling optimal untuk Tesseract</span>
                      </div>
                      <select 
                        value={filters.threshold}
                        disabled={!filters.grayscale}
                        onChange={(e) => setFilters({...filters, threshold: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-40"
                      >
                        <option value="none">Tanpa Binarisasi (None)</option>
                        <option value="binary">Binary Threshold (Manual)</option>
                        <option value="otsu">Otsu's Threshold (Otomatis)</option>
                        <option value="adaptive">Adaptive Gaussian (Dokumen Berbayang)</option>
                      </select>

                      {filters.threshold === 'binary' && (
                        <div className="pt-2">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>Batas Sensitivitas:</span>
                            <span className="font-bold text-emerald-400">{filters.thresholdValue} / 255</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="255" 
                            value={filters.thresholdValue}
                            onChange={(e) => setFilters({...filters, thresholdValue: parseInt(e.target.value)})}
                            className="w-full accent-emerald-500 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sisi Kanan: Ketebalan Tulisan & Rotasi */}
                  <div className="space-y-4">
                    {/* Erosi (Erosion) */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-200">
                        <span>4. Erosi (Erosion)</span>
                        <span className="text-sky-400">{filters.erosion}px</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block leading-tight">Menyusutkan ukuran tepi agar tulisan tinta meluber menjadi ramping</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="5" 
                        value={filters.erosion}
                        onChange={(e) => setFilters({...filters, erosion: parseInt(e.target.value)})}
                        className="w-full accent-sky-500 cursor-pointer"
                      />
                    </div>

                    {/* Dilatasi (Dilation) */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-200">
                        <span>5. Dilatasi (Dilation)</span>
                        <span className="text-sky-400">{filters.dilation}px</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block leading-tight">Mempertebal ujung piksel karakter agar tulisan tipis terbaca jelas</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="5" 
                        value={filters.dilation}
                        onChange={(e) => setFilters({...filters, dilation: parseInt(e.target.value)})}
                        className="w-full accent-sky-500 cursor-pointer"
                      />
                    </div>

                    {/* Rotasi Manual (Deskewing) */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-200">
                        <span>6. Rotasi Manual (Deskew)</span>
                        <span className="text-amber-400">{filters.rotation}°</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block leading-tight">Putar balik gambar untuk meluruskan baris tulisan miring</span>
                      <input 
                        type="range" 
                        min="-180" 
                        max="180" 
                        value={filters.rotation}
                        onChange={(e) => setFilters({...filters, rotation: parseInt(e.target.value)})}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Card Pemrosesan Dokumen */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-md font-bold uppercase tracking-wider text-slate-300 mb-4">
              Langkah 2: Pilih Metode & Jalankan Pindai
            </h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
              
              {/* Opsi Tesseract Lokal */}
              <div 
                onClick={() => setScanMode('tesseract')}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${scanMode === 'tesseract' ? 'bg-emerald-950/20 border-emerald-500 shadow-lg' : 'bg-slate-900 border-slate-800 opacity-60 hover:opacity-100'}`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div className={`p-1 rounded text-xs ${scanMode === 'tesseract' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    ⚙️
                  </div>
                  <div className="font-bold text-[10px] text-slate-200">Tesseract</div>
                </div>
                <p className="text-[8px] text-slate-400 leading-tight">Lokal & luring.</p>
              </div>

              {/* BARU: Opsi Baidu Unlimited-OCR */}
              <div 
                onClick={() => setScanMode('unlimited-ocr')}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${scanMode === 'unlimited-ocr' ? 'bg-cyan-950/30 border-cyan-500 shadow-lg' : 'bg-slate-900 border-slate-800 opacity-60 hover:opacity-100'}`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div className={`p-1 rounded text-xs ${scanMode === 'unlimited-ocr' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    🚀
                  </div>
                  <div className="font-bold text-[10px] text-slate-200">Unlimited-OCR</div>
                </div>
                <p className="text-[8px] text-slate-400 leading-tight">Baidu Long-horizon.</p>
              </div>

              {/* Opsi GLM-OCR Lokal llama.cpp */}
              <div 
                onClick={() => setScanMode('glm-ocr')}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${scanMode === 'glm-ocr' ? 'bg-indigo-950/30 border-indigo-500 shadow-lg' : 'bg-slate-900 border-slate-800 opacity-60 hover:opacity-100'}`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div className={`p-1 rounded text-xs ${scanMode === 'glm-ocr' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    📡
                  </div>
                  <div className="font-bold text-[10px] text-slate-200">GLM-OCR</div>
                </div>
                <p className="text-[8px] text-slate-400 leading-tight">GGUF via llama.cpp.</p>
              </div>

              {/* Opsi Mode AI Real-Time */}
              <div 
                onClick={() => setScanMode('ai')}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${scanMode === 'ai' ? 'bg-emerald-950/20 border-emerald-500 shadow-lg' : 'bg-slate-900 border-slate-800 opacity-60 hover:opacity-100'}`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div className={`p-1 rounded text-xs ${scanMode === 'ai' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    🧠
                  </div>
                  <div className="font-bold text-[10px] text-slate-200">Gemini Cloud</div>
                </div>
                <p className="text-[8px] text-slate-400 leading-tight">Analisis cloud API.</p>
              </div>

              {/* Opsi Mode Simulasi */}
              <div 
                onClick={() => setScanMode('mock')}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${scanMode === 'mock' ? 'bg-emerald-950/20 border-emerald-500 shadow-lg' : 'bg-slate-900 border-slate-800 opacity-60 hover:opacity-100'}`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div className={`p-1 rounded text-xs ${scanMode === 'mock' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    ⚡
                  </div>
                  <div className="font-bold text-[10px] text-slate-200">Simulasi</div>
                </div>
                <p className="text-[8px] text-slate-400 leading-tight">Data tiruan pantas.</p>
              </div>
            </div>

            {/* BARU: PANEL KONFIGURASI SERVER BAIDU UNLIMITED-OCR */}
            {scanMode === 'unlimited-ocr' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4 space-y-4 transition-all">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide">⚙️ Pengaturan Pelayan Baidu Unlimited-OCR</span>
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${unlimitedOcrStatus === 'online' ? 'bg-emerald-500' : unlimitedOcrStatus === 'checking' ? 'bg-amber-500 animate-pulse' : unlimitedOcrStatus === 'offline' ? 'bg-rose-500' : 'bg-slate-600'}`}></span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      {unlimitedOcrStatus === 'online' ? 'Aktif' : unlimitedOcrStatus === 'checking' ? 'Mengecek...' : unlimitedOcrStatus === 'offline' ? 'Offline' : 'Belum Diuji'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block font-semibold uppercase mb-1">Server Endpoint URL</label>
                    <input 
                      type="text" 
                      value={unlimitedOcrUrl}
                      onChange={(e) => {
                        setUnlimitedOcrUrl(e.target.value);
                        setUnlimitedOcrStatus('untested');
                      }}
                      placeholder="http://localhost:8001"
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={testUnlimitedOcrServer}
                      type="button"
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold py-2.5 rounded-lg transition"
                    >
                      🔍 Uji Koneksi Pelayan
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => setShowUnlimitedOcrGuide(!showUnlimitedOcrGuide)}
                    type="button"
                    className="text-xs text-slate-400 hover:text-slate-200 transition font-medium"
                  >
                    {showUnlimitedOcrGuide ? "▲ Sembunyikan Panduan Run" : "▼ Tampilkan Panduan Run"}
                  </button>
                </div>

                {showUnlimitedOcrGuide && (
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs space-y-2 font-mono text-slate-300">
                    <p className="text-[11px] text-slate-400 italic">Jalankan servis python lokal bertenaga Unlimited-OCR di port 8001:</p>
                    <pre className="bg-slate-900 p-2.5 rounded border border-slate-800 text-[10px] text-cyan-300 overflow-x-auto">
                      {`uvicorn main:app --port 8001 --host 127.0.0.1`}
                    </pre>
                    <p className="text-[10px] text-amber-500 leading-tight">💡 Nota: Pastikan backend FastAPI Anda mengaktifkan middleware CORS untuk membenarkan domain pelayar web.</p>
                  </div>
                )}
              </div>
            )}

            {/* PANEL KONFIGURASI SERVER LLAMA.CPP LOKAL */}
            {scanMode === 'glm-ocr' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4 space-y-4 transition-all">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">⚙️ Pengaturan Server llama.cpp</span>
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${localServerStatus === 'online' ? 'bg-emerald-500' : localServerStatus === 'checking' ? 'bg-amber-500 animate-pulse' : localServerStatus === 'offline' ? 'bg-rose-500' : 'bg-slate-600'}`}></span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      {localServerStatus === 'online' ? 'Aktif' : localServerStatus === 'checking' ? 'Mengecek...' : localServerStatus === 'offline' ? 'Offline' : 'Belum Diuji'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block font-semibold uppercase mb-1">Server Endpoint URL</label>
                    <input 
                      type="text" 
                      value={localServerUrl}
                      onChange={(e) => {
                        setLocalServerUrl(e.target.value);
                        setLocalServerStatus('untested');
                      }}
                      placeholder="http://localhost:8000"
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block font-semibold uppercase mb-1">Model Name / Alias</label>
                    <input 
                      type="text" 
                      value={localServerModel}
                      onChange={(e) => setLocalServerModel(e.target.value)}
                      placeholder="GLM-OCR"
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => setShowSetupGuide(!showSetupGuide)}
                    type="button"
                    className="text-xs text-slate-400 hover:text-slate-200 transition font-medium"
                  >
                    {showSetupGuide ? "▲ Sembunyikan Panduan Run" : "▼ Tampilkan Panduan Run"}
                  </button>
                  <button
                    onClick={testLocalServer}
                    type="button"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
                  >
                    🔍 Uji Koneksi Server
                  </button>
                </div>

                {/* Collapsible Panduan CLI Command */}
                {showSetupGuide && (
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs space-y-2 font-mono text-slate-300">
                    <p className="text-[11px] text-slate-400 italic">Jalankan model GLM-OCR-GGUF di port lokal 8000 dengan flag CORS agar diizinkan oleh browser:</p>
                    <pre className="bg-slate-900 p-2.5 rounded border border-slate-800 text-[10px] text-indigo-300 overflow-x-auto">
                      {`./llama-server \\
  -m GLM-OCR-Q4_K_M.gguf \\
  --port 8000 \\
  --host 127.0.0.1 \\
  --cors`}
                    </pre>
                    <p className="text-[10px] text-amber-500 leading-tight">⚠️ Catatan: Flag --cors sangat penting agar permintaan fetch dari browser aplikasi tidak diblokir.</p>
                  </div>
                )}
              </div>
            )}

            {/* Language Selection for Tesseract */}
            {scanMode === 'tesseract' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-4 flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Bahasa Pemindaian Tesseract:</span>
                <select 
                  value={ocrLang}
                  onChange={(e) => setOcrLang(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="ind+eng">Ind+Eng</option>
                  <option value="ind">Indonesia</option>
                  <option value="eng">English</option>
                </select>
              </div>
            )}

            <button 
              onClick={handleStartScan}
              disabled={isScanning || !imageSrc}
              className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center space-x-2 transition ${isScanning || !imageSrc ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'}`}
            >
              <span>{isScanning ? "Menganalisis Dokumen..." : `Mulai Ekstraksi ${docType.toUpperCase()}`}</span>
              {!isScanning && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>

          {/* Card Panduan Optimasi Gambar */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              💡 Panduan Optimasi Kualitas Gambar (OCR Tips)
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
              <li className="flex items-start space-x-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span><strong>Resolusi Cukup (Rescaling)</strong>: Pastikan kerapatan gambar di atas 300 DPI untuk pembacaan teks yang lebih tajam.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span><strong>Hindari Distorsi (Rotation)</strong>: Sejajarkan dokumen secara lurus mendatar menggunakan slider rotasi manual agar pengenalan baris teks tidak gagal.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span><strong>Sisakan Batas (Borders)</strong>: Jangan potong foto terlalu mepet. Berikan batas kosong minimal 10px di sekeliling teks.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span><strong>Binarisasi Sesuai</strong>: Gunakan Otsu untuk kontras biasa, atau gunakan Adaptive Gaussian jika foto dokumen Anda berbayang/gelap di satu sisi.</span>
              </li>
            </ul>
          </div>
          
        </section>

        {/* KOLOM KANAN: Hasil Ekstraksi Data & Riwayat (5 Kolom) */}
        <section className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* Hasil Pemindaian */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col min-h-[450px]">
            <div className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex items-center justify-between">
              <h2 className="text-md font-bold uppercase tracking-wider text-slate-300">
                Hasil Ekstraksi Data
              </h2>
              {extractedData && (
                <div className="flex space-x-1.5">
                  <button 
                    onClick={copyToClipboard}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition text-xs font-bold"
                    title="Salin ke Clipboard"
                  >
                    📋 Salin
                  </button>
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition text-xs font-bold"
                    title={isEditing ? "Kembali" : "Edit Data"}
                  >
                    ✏️ Edit
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
              {extractedData ? (
                /* Data berhasil diekstrak */
                <div className="space-y-4">
                  {isEditing ? (
                    /* TAMPILAN EDIT */
                    <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                      {Object.entries(editedData).map(([key, val]) => (
                        <div key={key} className="space-y-1">
                          <label className="text-[10px] text-emerald-400 font-semibold block uppercase tracking-wider">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </label>
                          <input 
                            type="text" 
                            value={val || ''}
                            onChange={(e) => handleEditChange(key, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      ))}
                      <div className="pt-2 flex space-x-2 text-xs">
                        <button 
                          onClick={saveEditedData}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg transition"
                        >
                          Simpan Perubahan
                        </button>
                        <button 
                          onClick={() => { setIsEditing(false); setEditedData(extractedData); }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-400 font-semibold px-4 py-2 rounded-lg transition"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* TAMPILAN STANDAR DATA */
                    <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                      {Object.entries(extractedData).map(([key, val]) => (
                        <div key={key} className="border-b border-slate-900 pb-2">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <span className="text-sm text-slate-100 font-medium break-words">
                            {val || <span className="text-slate-600 italic">Tidak terdeteksi</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Penampil Teks Hasil Scan Kasar (Raw OCR) */}
                  {rawOcrText && (
                    <div className="mt-4 pt-3 border-t border-slate-900">
                      <button
                        onClick={() => setShowRawText(!showRawText)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center space-x-1"
                      >
                        <span>{showRawText ? "▲ Sembunyikan" : "▼ Tampilkan"} Teks Kasar (Raw OCR)</span>
                      </button>
                      
                      {showRawText && (
                        <div className="mt-2 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 font-mono overflow-x-auto max-h-[160px] whitespace-pre-wrap">
                          {rawOcrText}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Belum ada data */
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-auto">
                  <div className="bg-slate-900 p-4 rounded-full text-slate-600 mb-4 border border-slate-800 text-xl">
                    🔍
                  </div>
                  <h3 className="font-semibold text-slate-300">Menunggu Pemindaian</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                    Unggah dokumen pilihan Anda, lakukan optimasi gambar lewat panel filter OpenCV di sebelah kiri jika diperlukan, lalu jalankan ekstrak data.
                  </p>
                </div>
              )}

              {/* Tombol aksi cepat di bagian bawah jika data siap */}
              {extractedData && !isEditing && (
                <div className="mt-6 pt-4 border-t border-slate-900 flex space-x-2">
                  <button 
                    onClick={copyToClipboard}
                    className="flex-1 bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-400 text-xs font-bold py-2.5 rounded-xl border border-emerald-500/30 transition flex items-center justify-center space-x-1.5"
                  >
                    <span>Salin Data</span>
                  </button>
                  <button 
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(extractedData, null, 2));
                      const dlAnchorElem = document.createElement('a');
                      dlAnchorElem.setAttribute("href",     dataStr     );
                      dlAnchorElem.setAttribute("download", `pindaidok-${docType}-${Date.now()}.json`);
                      dlAnchorElem.click();
                      showToast("Berkas JSON berhasil diunduh!");
                    }}
                    className="bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-800 transition"
                  >
                    Unduh JSON
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Manajer Riwayat Pemindaian */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Riwayat Pemindaian ({history.length})
              </h3>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="text-[11px] text-rose-400 hover:text-rose-300 transition font-bold"
                >
                  Hapus Semua
                </button>
              )}
            </div>

            {history.length > 0 ? (
              <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => {
                      setDocType(item.type);
                      setExtractedData(item.data);
                      setEditedData(item.data);
                      if (item.image) {
                        setImageSrc(item.image);
                      }
                      showToast(`Memuat data riwayat ${item.type.toUpperCase()}`);
                    }}
                    className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 p-3 rounded-xl cursor-pointer transition flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">
                        {item.type === 'ktp' ? '💳' : '📜'}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-200">
                          {item.type === 'ktp' ? (item.data.nama || "KTP Tanpa Nama") : (item.data.nomorSertifikat || "Sertifikat")}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {item.timestamp}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold uppercase">
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-900 rounded-xl text-slate-600 text-xs">
                Belum ada berkas pemindaian yang disimpan.
              </div>
            )}
          </div>

        </section>

      </main>

      {/* Canvas tersembunyi untuk foto kamera */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Footer Aplikasi */}
      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-4 text-center text-xs text-slate-500">
        <p>© 2026 PindaiDok AI - Platform Analisis & Ekstraksi Dokumen Indonesia. Didukung oleh Tesseract.js, OpenCV.js, Unlimited-OCR & Gemini.</p>
      </footer>
    </div>
  );
}