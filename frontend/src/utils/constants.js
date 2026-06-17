export const STATUS_PENGAJUAN = {
  DRAFT: { label: 'Draft', color: 'badge-gray' },
  DIAJUKAN: { label: 'Diajukan', color: 'badge-info' },
  SURVEY: { label: 'Survey', color: 'badge-purple' },
  ANALISA: { label: 'Analisa', color: 'badge-warning' },
  SCORING: { label: 'Scoring', color: 'badge-warning' },
  REVIEW_KABID: { label: 'Review Kabid', color: 'badge-info' },
  KOMITE: { label: 'Komite', color: 'badge-purple' },
  DIREKSI: { label: 'Direksi', color: 'badge-info' },
  DISETUJUI: { label: 'Disetujui', color: 'badge-success' },
  DITOLAK: { label: 'Ditolak', color: 'badge-danger' },
  BATAL: { label: 'Batal', color: 'badge-gray' },
};

export const JENIS_KREDIT = [
  { value: 'KONSUMTIF', label: 'Konsumtif' },
  { value: 'PRODUKTIF', label: 'Produktif' },
];

export const JENIS_AGUNAN = [
  { value: 'SHM', label: 'SHM (Sertifikat Hak Milik)' },
  { value: 'SHGB', label: 'SHGB (Sertifikat Hak Guna Bangunan)' },
  { value: 'AJB', label: 'AJB (Akta Jual Beli)' },
  { value: 'BPKB', label: 'BPKB' },
  { value: 'DEPOSITO', label: 'Deposito' },
  { value: 'MESIN', label: 'Mesin' },
  { value: 'PERSEDIAAN', label: 'Persediaan' },
];

export const GRADE_COLORS = {
  A: 'text-emerald-400', B: 'text-green-400', C: 'text-yellow-400', D: 'text-orange-400', E: 'text-red-400',
};

export const JENIS_PEKERJAAN = ['PNS', 'TNI/POLRI', 'SWASTA', 'BUMN', 'WIRASWASTA', 'PROFESIONAL', 'PENSIUNAN', 'LAINNYA'];
export const STATUS_NIKAH = ['BELUM_KAWIN', 'KAWIN', 'CERAI_HIDUP', 'CERAI_MATI'];
export const PENDIDIKAN = ['SD', 'SMP', 'SMA', 'D1', 'D3', 'S1', 'S2', 'S3'];
export const GENDER = [{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }];
export const JENIS_DOKUMEN = ['KTP', 'KK', 'NPWP', 'SLIP_GAJI', 'REKENING_KORAN', 'FOTO_RUMAH', 'FOTO_USAHA', 'SURAT_KETERANGAN', 'LAINNYA'];
