/**
 * Document AI DTO Schemas and Validation Functions
 */

const KTP_SCHEMA = {
  nik: "",
  nama: "",
  tempat_tgl_lahir: "",
  jenis_kelamin: "",
  alamat: "",
  rt_rw: "",
  kel_desa: "",
  kecamatan: "",
  agama: "",
  status_perkawinan: "",
  pekerjaan: "",
  kewarganegaraan: "",
  berlaku_hingga: ""
};

const SURAT_NIKAH_SCHEMA = {
  suamiNama: "",
  suamiNik: "",
  istriNama: "",
  istriNik: "",
  tanggalNikah: ""
};

const KK_SCHEMA = {
  nomor_kk: "",
  kepala_keluarga: "",
  alamat: "",
  anggota: []
};

const NPWP_SCHEMA = {
  nomor_npwp: "",
  nama: "",
  alamat: ""
};

/**
 * SHM Schema — diperluas berdasarkan data nyata SHM No. 01620 (AAW579903).
 * Field lama dipertahankan untuk backward compatibility.
 * Field baru ditambah untuk kelengkapan data agunan.
 */
const SHM_SCHEMA = {
  // ── Identitas Sertifikat ─────────────────────────────────────────────────
  nomor_sertifikat    : "",   // contoh: "01620"
  jenis_hak           : "",   // contoh: "HAK MILIK"
  kode_dokumen        : "",   // contoh: "AAW579903"
  nib                 : "",   // contoh: "11.32.08.05.02739"

  // ── Pemegang Hak ─────────────────────────────────────────────────────────
  atas_nama           : "",   // alias nama_pemegang_hak (backward compat)
  nama_pemegang_hak   : "",   // contoh: "MUKHAMAD NURRIDHO AJI"
  tanggal_lahir_pemegang: "", // contoh: "31-05-1992"

  // ── Lokasi ────────────────────────────────────────────────────────────────
  provinsi            : "",   // contoh: "JAWA TENGAH"
  kabupaten_kota      : "",   // contoh: "BATANG"
  kabupaten           : "",   // alias kabupaten_kota (backward compat)
  kecamatan           : "",   // contoh: "LIMPUNG"
  desa_kelurahan      : "",   // contoh: "SIDOMULYO"
  desa                : "",   // alias desa_kelurahan (backward compat)
  kantor_pertanahan   : "",   // contoh: "KANTOR PERTANAHAN KABUPATEN BATANG"

  // ── Luas & Surat Ukur ─────────────────────────────────────────────────────
  luas_tanah          : "",   // angka saja (string), alias luas_m2
  luas_m2             : 0,    // angka integer
  luas_terbilang      : "",   // contoh: "Seribu Tiga Ratus Delapan Puluh Tiga Meter Persegi"
  keadaan_tanah       : "",   // contoh: "Sebidang tanah sawah"
  nomor_surat_ukur    : "",   // contoh: "01496/Sidomulyo/2020"
  tanggal_surat_ukur  : "",   // contoh: "26-06-2020"

  // ── Pendaftaran ───────────────────────────────────────────────────────────
  asal_hak            : "",   // contoh: "Konversi Pengakuan Hak Bekas Hak Yasan C No.1198"
  tanggal_pembukuan   : "",   // contoh: "29-06-2020"

  // ── Referensi DI ──────────────────────────────────────────────────────────
  daftar_isian_307    : "",   // contoh: "44727/2020"
  daftar_isian_208    : "",   // contoh: "21341/2020"

  // ── Hak Tanggungan ────────────────────────────────────────────────────────
  hak_tanggungan_aktif: false,  // boolean: apakah ada HT aktif
  nama_kreditur_ht    : "",     // contoh: "PT BPR BAPERA BATANG"
  nomor_ht            : "",     // contoh: "05132/2023"
};

const BPKB_SCHEMA = {
  nomor_bpkb: "",
  nomor_polisi: "",
  merk: "",
  tipe: "",
  tahun: "",
  atas_nama: ""
};

const SURVEY_SCHEMA = {
  jenis_usaha: "",
  perkiraan_skala: "",
  kondisi_bangunan: "",
  indikasi_aktif: true,
  catatan: ""
};

/**
 * Validate and clean the parsed object to match the schema
 * @param {object} rawData - Object parsed from LLM JSON response
 * @param {string} type - ktp, kk, npwp, shm, bpkb, survey
 * @returns {object} Cleaned object matching exact schema
 */
function validateAndClean(rawData, type) {
  const data = rawData && typeof rawData === 'object' ? rawData : {};

  switch (type.toLowerCase()) {
    case 'ktp': {
      const result = {};
      Object.keys(KTP_SCHEMA).forEach(key => {
        let val = (data[key] !== undefined && data[key] !== null) ? String(data[key]).trim() : "";
        if (key === 'nik') val = val.replace(/\D/g, '');
        if (key === 'jenis_kelamin') {
          val = val.toUpperCase();
          if (val.includes('PRIA') || val.includes('LAKI')) val = 'LAKI-LAKI';
          else if (val.includes('WANITA') || val.includes('PEREMPUAN')) val = 'PEREMPUAN';
        }
        result[key] = val;
      });

      // Parsing manual tempat_tgl_lahir
      result.tempat_lahir = "";
      result.tanggal_lahir = "";
      if (result.tempat_tgl_lahir) {
        const parts = result.tempat_tgl_lahir.split(',');
        if (parts.length > 1) {
          result.tempat_lahir = parts[0].trim();
          let rawTgl = parts.slice(1).join(',').trim();
          result.tanggal_lahir = rawTgl.replace(/[^\d-]/g, ''); // hanya angka dan strip
        } else {
          result.tempat_lahir = result.tempat_tgl_lahir;
        }
      }

      // Parsing rt_rw
      result.rt = "";
      result.rw = "";
      if (result.rt_rw) {
        const parts = result.rt_rw.split('/');
        result.rt = parts[0] ? parts[0].trim() : "";
        result.rw = parts[1] ? parts[1].trim() : "";
      }

      // Alias backward compat untuk frontend
      result.kelurahan = result.kel_desa;

      return result;
    }
    case 'surat_nikah': {
      const result = {};
      Object.keys(SURAT_NIKAH_SCHEMA).forEach(key => {
        let val = (data[key] !== undefined && data[key] !== null) ? String(data[key]).trim() : "";
        if (key === 'suamiNik' || key === 'istriNik') val = val.replace(/\D/g, '');
        result[key] = val;
      });
      return result;
    }
    case 'kk': {
      const result = {};
      let noKk = (data.nomor_kk !== undefined && data.nomor_kk !== null) ? String(data.nomor_kk).trim() : "";
      result.nomor_kk = noKk.replace(/\D/g, '');
      result.kepala_keluarga = (data.kepala_keluarga !== undefined && data.kepala_keluarga !== null) ? String(data.kepala_keluarga).trim() : "";
      result.alamat = (data.alamat !== undefined && data.alamat !== null) ? String(data.alamat).trim() : "";
      
      let rawAnggota = data.anggota;
      if (!Array.isArray(rawAnggota)) {
        rawAnggota = [];
      }
      result.anggota = rawAnggota.map(member => {
        if (typeof member === 'object' && member !== null) {
          const cleanMember = {};
          const memberKeys = [
            'nik', 'nama', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir', 
            'agama', 'pendidikan', 'jenis_pekerjaan', 'hubungan_keluarga', 'kewarganegaraan'
          ];
          memberKeys.forEach(k => {
            let mVal = (member[k] !== undefined && member[k] !== null) ? String(member[k]).trim() : "";
            if (k === 'nik') mVal = mVal.replace(/\D/g, '');
            cleanMember[k] = mVal;
          });
          return cleanMember;
        } else {
          return { nama: String(member).trim() };
        }
      });
      return result;
    }
    case 'npwp': {
      const result = {};
      Object.keys(NPWP_SCHEMA).forEach(key => {
        let val = (data[key] !== undefined && data[key] !== null) ? String(data[key]).trim() : "";
        if (key === 'nomor_npwp') val = val.replace(/[^0-9.-]/g, '');
        result[key] = val;
      });
      return result;
    }
    case 'shm': {
      const result = {};

      // ── Helper: safe string ───────────────────────────────────────────────
      const str = (key, fallbackKey) => {
        const v = data[key] ?? data[fallbackKey] ?? null;
        if (v === null || v === undefined) return "";
        const s = String(v).trim();
        // Treat sentinel null strings from VLM as empty
        return (s === 'null' || s === 'NULL') ? "" : s;
      };

      // ── Identitas Sertifikat ──────────────────────────────────────────────
      result.nomor_sertifikat = str('nomor_sertifikat');
      result.jenis_hak        = str('jenis_hak') || "HAK MILIK";
      result.kode_dokumen     = str('kode_dokumen');
      result.nib              = str('nib');

      // ── Pemegang Hak ─────────────────────────────────────────────────────
      // nama_pemegang_hak adalah primary, atas_nama adalah alias (backward compat)
      const namaPemegang = str('nama_pemegang_hak') || str('atas_nama');
      result.nama_pemegang_hak      = namaPemegang;
      result.atas_nama              = namaPemegang; // keep backward compat
      result.tanggal_lahir_pemegang = str('tanggal_lahir_pemegang');

      // ── Lokasi ────────────────────────────────────────────────────────────
      const kabupaten = str('kabupaten_kota') || str('kabupaten');
      const desa      = str('desa_kelurahan') || str('desa');
      result.provinsi          = str('provinsi');
      result.kabupaten_kota    = kabupaten;
      result.kabupaten         = kabupaten; // backward compat
      result.kecamatan         = str('kecamatan');
      result.desa_kelurahan    = desa;
      result.desa              = desa;      // backward compat
      result.kantor_pertanahan = str('kantor_pertanahan');

      // ── Luas & Surat Ukur ─────────────────────────────────────────────────
      // luas_m2 bisa berupa integer dari VLM, luas_tanah bisa string
      let luasM2 = 0;
      const rawLuas = data.luas_m2 ?? data.luas_tanah ?? null;
      if (rawLuas !== null) {
        const cleaned = String(rawLuas).replace(/[^\d]/g, '');
        luasM2 = parseInt(cleaned, 10) || 0;
      }
      result.luas_m2         = luasM2;
      result.luas_tanah      = luasM2 > 0 ? String(luasM2) : ""; // backward compat string
      result.luas_terbilang  = str('luas_terbilang');
      result.keadaan_tanah   = str('keadaan_tanah');
      result.nomor_surat_ukur  = str('nomor_surat_ukur');
      result.tanggal_surat_ukur = str('tanggal_surat_ukur');

      // ── Pendaftaran ───────────────────────────────────────────────────────
      result.asal_hak         = str('asal_hak');
      result.tanggal_pembukuan = str('tanggal_pembukuan');

      // ── Referensi DI ──────────────────────────────────────────────────────
      result.daftar_isian_307 = str('daftar_isian_307');
      result.daftar_isian_208 = str('daftar_isian_208');

      // ── Hak Tanggungan ────────────────────────────────────────────────────
      let htAktif = false;
      if (data.hak_tanggungan_aktif !== undefined && data.hak_tanggungan_aktif !== null) {
        if (typeof data.hak_tanggungan_aktif === 'boolean') {
          htAktif = data.hak_tanggungan_aktif;
        } else {
          const s = String(data.hak_tanggungan_aktif).toLowerCase().trim();
          htAktif = (s === 'true' || s === '1' || s === 'yes' || s === 'ada');
        }
      }
      result.hak_tanggungan_aktif = htAktif;
      result.nama_kreditur_ht     = str('nama_kreditur_ht');
      result.nomor_ht             = str('nomor_ht');

      return result;
    }
    case 'bpkb': {
      const result = {};
      Object.keys(BPKB_SCHEMA).forEach(key => {
        let val = (data[key] !== undefined && data[key] !== null) ? String(data[key]).trim() : "";
        if (key === 'tahun') val = val.replace(/\D/g, '');
        result[key] = val;
      });
      return result;
    }
    case 'survey': {
      const result = {};
      result.jenis_usaha = (data.jenis_usaha !== undefined && data.jenis_usaha !== null) ? String(data.jenis_usaha).trim() : "";
      result.perkiraan_skala = (data.perkiraan_skala !== undefined && data.perkiraan_skala !== null) ? String(data.perkiraan_skala).trim() : "";
      result.kondisi_bangunan = (data.kondisi_bangunan !== undefined && data.kondisi_bangunan !== null) ? String(data.kondisi_bangunan).trim() : "";
      
      if (data.indikasi_aktif !== undefined && data.indikasi_aktif !== null) {
        if (typeof data.indikasi_aktif === 'boolean') {
          result.indikasi_aktif = data.indikasi_aktif;
        } else {
          const strVal = String(data.indikasi_aktif).toLowerCase().trim();
          result.indikasi_aktif = strVal === 'true' || strVal === '1' || strVal === 'yes' || strVal === 'aktif';
        }
      } else {
        result.indikasi_aktif = true;
      }
      
      result.catatan = (data.catatan !== undefined && data.catatan !== null) ? String(data.catatan).trim() : "";
      return result;
    }
    case 'shm_cover': {
      const s = (k) => { const v = data[k]; return (v === null || v === undefined || String(v).trim() === 'null') ? '' : String(v).trim(); };
      return {
        kode_dokumen    : s('kode_dokumen'),
        nomor_sertifikat: s('nomor_sertifikat'),
        jenis_hak       : s('jenis_hak') || 'HAK MILIK',
        nib             : s('nib'),
        provinsi        : s('provinsi'),
        kabupaten_kota  : s('kabupaten_kota'),
        kecamatan       : s('kecamatan'),
        desa_kelurahan  : s('desa_kelurahan'),
        kantor_pertanahan : s('kantor_pertanahan'),
        daftar_isian_307  : s('daftar_isian_307'),
        daftar_isian_208  : s('daftar_isian_208'),
      };
    }
    case 'shm_pendaftaran': {
      const s = (k) => { const v = data[k]; return (v === null || v === undefined || String(v).trim() === 'null') ? '' : String(v).trim(); };
      let luasM2 = 0;
      const rawLuas = data.luas_m2 ?? null;
      if (rawLuas !== null) luasM2 = parseInt(String(rawLuas).replace(/[^\d]/g, ''), 10) || 0;
      return {
        nama_pemegang_hak     : s('nama_pemegang_hak') || s('atas_nama'),
        tanggal_lahir_pemegang: s('tanggal_lahir_pemegang'),
        nib                   : s('nib'),
        nomor_sertifikat      : s('nomor_sertifikat'),
        desa_kelurahan        : s('desa_kelurahan'),
        asal_hak              : s('asal_hak'),
        luas_m2               : luasM2,
        keadaan_tanah         : s('keadaan_tanah'),
        nomor_surat_ukur      : s('nomor_surat_ukur'),
        tanggal_surat_ukur    : s('tanggal_surat_ukur'),
        tanggal_pembukuan     : s('tanggal_pembukuan'),
      };
    }
    case 'shm_peralihan': {
      const s = (k) => { const v = data[k]; return (v === null || v === undefined || String(v).trim() === 'null') ? '' : String(v).trim(); };
      let htAktif = false;
      if (data.hak_tanggungan_aktif !== undefined && data.hak_tanggungan_aktif !== null) {
        if (typeof data.hak_tanggungan_aktif === 'boolean') htAktif = data.hak_tanggungan_aktif;
        else { const sv = String(data.hak_tanggungan_aktif).toLowerCase().trim(); htAktif = sv === 'true' || sv === '1' || sv === 'yes' || sv === 'ada'; }
      }
      // Jika ada kejadian HT, pastikan hak_tanggungan_aktif true
      const kejadian = Array.isArray(data.kejadian) ? data.kejadian : [];
      if (kejadian.length > 0 && kejadian.some(k => /HAK TANGGUNGAN/i.test(String(k.jenis || '')))) htAktif = true;
      return {
        hak_tanggungan_aktif: htAktif,
        nama_kreditur_ht    : s('nama_kreditur_ht'),
        nomor_ht            : s('nomor_ht'),
        tanggal_apht        : s('tanggal_apht'),
        apht_ppat           : s('apht_ppat'),
        kejadian            : kejadian,
      };
    }
    case 'shm_surat_ukur': {
      const s = (k) => { const v = data[k]; return (v === null || v === undefined || String(v).trim() === 'null') ? '' : String(v).trim(); };
      let luasM2 = 0;
      const rawLuas = data.luas_m2 ?? null;
      if (rawLuas !== null) luasM2 = parseInt(String(rawLuas).replace(/[^\d]/g, ''), 10) || 0;
      return {
        kode_dokumen   : s('kode_dokumen'),
        nib            : s('nib'),
        nomor_surat_ukur : s('nomor_surat_ukur'),
        provinsi       : s('provinsi'),
        kabupaten_kota : s('kabupaten_kota'),
        kecamatan      : s('kecamatan'),
        desa_kelurahan : s('desa_kelurahan'),
        peta_lembar    : s('peta_lembar'),
        peta_kotak     : s('peta_kotak'),
        keadaan_tanah  : s('keadaan_tanah'),
        luas_m2        : luasM2,
        luas_terbilang : s('luas_terbilang'),
        koordinat      : s('koordinat'),
      };
    }
    case 'shm_peta': {
      const s = (k) => { const v = data[k]; return (v === null || v === undefined || String(v).trim() === 'null') ? '' : String(v).trim(); };
      const cleanArr = (arr) => Array.isArray(arr) ? arr.map(x => String(x || '').trim()).filter(Boolean) : [];
      return {
        skala              : s('skala'),
        nomor_bidang_utama : s('nomor_bidang_utama'),
        nama_tetangga      : cleanArr(data.nama_tetangga),
        label_objek        : cleanArr(data.label_objek),
        koordinat          : s('koordinat'),
        penjelasan_legenda : s('penjelasan_legenda'),
      };
    }
    default:
      throw new Error(`Unsupported schema validation type: ${type}`);

  }
}

module.exports = {
  KTP_SCHEMA,
  SURAT_NIKAH_SCHEMA,
  KK_SCHEMA,
  NPWP_SCHEMA,
  SHM_SCHEMA,
  BPKB_SCHEMA,
  SURVEY_SCHEMA,
  validateAndClean
};
