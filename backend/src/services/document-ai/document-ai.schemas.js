/**
 * Document AI DTO Schemas and Validation Functions
 */

const KTP_SCHEMA = {
  nik: "",
  nama: "",
  tempat_lahir: "",
  tanggal_lahir: "",
  jenis_kelamin: "",
  alamat: "",
  rt: "",
  rw: "",
  kelurahan: "",
  kecamatan: "",
  agama: "",
  status_perkawinan: "",
  pekerjaan: "",
  kewarganegaraan: ""
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

const SHM_SCHEMA = {
  nomor_sertifikat: "",
  jenis_hak: "",
  atas_nama: "",
  luas_tanah: "",
  desa: "",
  kecamatan: "",
  kabupaten: ""
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
        result[key] = (data[key] !== undefined && data[key] !== null) ? String(data[key]).trim() : "";
      });
      return result;
    }
    case 'kk': {
      const result = {};
      result.nomor_kk = (data.nomor_kk !== undefined && data.nomor_kk !== null) ? String(data.nomor_kk).trim() : "";
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
            cleanMember[k] = (member[k] !== undefined && member[k] !== null) ? String(member[k]).trim() : "";
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
        result[key] = (data[key] !== undefined && data[key] !== null) ? String(data[key]).trim() : "";
      });
      return result;
    }
    case 'shm': {
      const result = {};
      Object.keys(SHM_SCHEMA).forEach(key => {
        result[key] = (data[key] !== undefined && data[key] !== null) ? String(data[key]).trim() : "";
      });
      return result;
    }
    case 'bpkb': {
      const result = {};
      Object.keys(BPKB_SCHEMA).forEach(key => {
        result[key] = (data[key] !== undefined && data[key] !== null) ? String(data[key]).trim() : "";
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
    default:
      throw new Error(`Unsupported schema validation type: ${type}`);
  }
}

module.exports = {
  KTP_SCHEMA,
  KK_SCHEMA,
  NPWP_SCHEMA,
  SHM_SCHEMA,
  BPKB_SCHEMA,
  SURVEY_SCHEMA,
  validateAndClean
};
