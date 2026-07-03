import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Building2, MapPin, Plus, Trash2, CheckCircle, XCircle, Upload, RefreshCw } from 'lucide-react';
import { agunanService, documentService } from '../../services';
import { JENIS_AGUNAN } from '../../utils/constants';
import { formatRupiah } from '../../utils/formatters';

// ─── Konfigurasi 5 slot halaman SHM ─────────────────────────────────────────
const SHM_PAGE_SLOTS = [
  { key: 'cover',       label: 'Cover',           desc: 'No. Sertifikat, Lokasi, NIB',    badge: 'Wajib'    },
  { key: 'pendaftaran', label: 'Pendaftaran',      desc: 'Nama Pemegang, Luas, Asal Hak', badge: 'Wajib'    },
  { key: 'peralihan',   label: 'Peralihan / HT',   desc: 'Hak Tanggungan Aktif',           badge: 'Opsional' },
  { key: 'surat_ukur',  label: 'Surat Ukur',       desc: 'Luas Terbilang, Koordinat',      badge: 'Opsional' },
  { key: 'peta',        label: 'Peta Bidang',      desc: 'Batas Tanah Tetangga',           badge: 'Opsional' },
];
const INIT_SHM_PAGES = () => ({
  cover:       { status: 'idle', data: null, fileName: '' },
  pendaftaran: { status: 'idle', data: null, fileName: '' },
  peralihan:   { status: 'idle', data: null, fileName: '' },
  surat_ukur:  { status: 'idle', data: null, fileName: '' },
  peta:        { status: 'idle', data: null, fileName: '' },
});

// ─── Merge hasil semua halaman SHM ke field form agunan ──────────────────────
function mergeShmToForm(pages) {
  const cover      = pages.cover?.data      || {};
  const pend       = pages.pendaftaran?.data || {};
  const peralihan  = pages.peralihan?.data   || {};
  const suratUkur  = pages.surat_ukur?.data  || {};
  const peta       = pages.peta?.data        || {};

  const nomor    = cover.nomor_sertifikat   || pend.nomor_sertifikat    || '';
  const nama     = pend.nama_pemegang_hak   || pend.atas_nama           || '';
  const luasM2   = (pend.luas_m2 > 0 ? pend.luas_m2 : null)
                 || (suratUkur.luas_m2 > 0 ? suratUkur.luas_m2 : null) || 0;
  const luasBgn  = (pend.luas_bangunan > 0 ? pend.luas_bangunan : null)
                 || (suratUkur.luas_bangunan > 0 ? suratUkur.luas_bangunan : null) || 0;
  const keadaan  = suratUkur.keadaan_tanah  || pend.keadaan_tanah       || '';
  const kec      = cover.kecamatan          || suratUkur.kecamatan       || pend.kecamatan       || '';
  const kab      = cover.kabupaten_kota     || suratUkur.kabupaten_kota  || pend.kabupaten_kota  || '';
  const desa     = cover.desa_kelurahan     || suratUkur.desa_kelurahan  || pend.desa_kelurahan  || '';
  const prov     = cover.provinsi           || suratUkur.provinsi        || pend.provinsi        || '';

  // [Sesi 41 NEW] NIB & Nomor Surat Ukur — dari surat_ukur atau cover
  const nib            = suratUkur.nib            || cover.nib            || '';
  const nomorSuratUkur = suratUkur.nomor_surat_ukur || cover.nomor_surat_ukur || '';

  // Gabungkan ke kode_dokumen jika tersedia
  const kodeDokParts = [];
  if (nib) kodeDokParts.push(`NIB: ${nib}`);
  if (nomorSuratUkur) kodeDokParts.push(`SU: ${nomorSuratUkur}`);
  const kodeDokumen = suratUkur.kode_dokumen || kodeDokParts.join(' | ') || '';

  // [Sesi 41 NEW] Batas tanah — prioritas dari peta, fallback ke surat_ukur
  // nama_tetangga array (backward compat): [Utara, Selatan, Timur, Barat]
  const petaTetangga = Array.isArray(peta.nama_tetangga) ? peta.nama_tetangga : [];
  const [pU = '', pS = '', pT = '', pB = ''] = petaTetangga;

  const bU = pU || peta.batas_utara   || suratUkur.batas_utara   || '';
  const bS = pS || peta.batas_selatan || suratUkur.batas_selatan || '';
  const bT = pT || peta.batas_timur   || suratUkur.batas_timur   || '';
  const bB = pB || peta.batas_barat   || suratUkur.batas_barat   || '';

  // Alamat otomatis
  const alamatParts = [desa, kec ? `Kec. ${kec}` : null, kab ? `Kab. ${kab}` : null, prov].filter(Boolean);
  const alamatOcr   = alamatParts.join(', ');

  // Deskripsi otomatis dari keadaan tanah + luas
  const deskripsiOcr = [keadaan, luasM2 ? `${luasM2} m\u00B2` : ''].filter(Boolean).join(', ');

  return {
    nomorSertifikat: nomor,
    atasNama:        nama,
    luasTanah:       luasM2,
    luasBangunan:    luasBgn,
    kabupaten:       kab,
    kecamatan:       kec,
    kelurahan:       desa,
    alamatAgunan:    alamatOcr,
    deskripsi:       deskripsiOcr,
    batasUtara:      bU,
    batasSelatan:    bS,
    batasTimur:      bT,
    batasBarat:      bB,
    // [Sesi 41 NEW]
    nib:             nib,
    nomorSuratUkur:  nomorSuratUkur,
    kodeDokumen:     kodeDokumen,
  };
}


export default function AgunanFormPage() {
  const [params] = useSearchParams();
  const pengajuanId = params.get('pengajuanId') || '';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // ─── State SHM multi-page: per agunan index ────────────────────────────────
  // shmPagesMap[index] = { cover: {status, data, fileName}, ... }
  const [shmPagesMap, setShmPagesMap] = useState({});

  const getShmPages = (index) => shmPagesMap[index] || INIT_SHM_PAGES();

  const updateShmPage = (agunanIndex, pageKey, patch) => {
    setShmPagesMap(prev => {
      const cur = prev[agunanIndex] || INIT_SHM_PAGES();
      return { ...prev, [agunanIndex]: { ...cur, [pageKey]: { ...cur[pageKey], ...patch } } };
    });
  };

  const hasShmData = (agunanIndex) => {
    const pages = getShmPages(agunanIndex);
    return Object.values(pages).some(p => p.status === 'done' && p.data);
  };

  // ─── Upload 1 halaman SHM ──────────────────────────────────────────────────
  const handleShmPageUpload = async (agunanIndex, pageKey, file) => {
    if (!file) return;
    updateShmPage(agunanIndex, pageKey, { status: 'loading', fileName: file.name });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('page_type', pageKey);

    try {
      const res  = await documentService.extractShmPage(formData);
      const data = res.data.data.data || {};
      updateShmPage(agunanIndex, pageKey, { status: 'done', data, fileName: file.name });
    } catch (err) {
      console.error(`SHM page ${pageKey} error:`, err);
      updateShmPage(agunanIndex, pageKey, { status: 'error', data: null, fileName: file.name });
      setError(`Gagal proses halaman ${pageKey}: ${err.response?.data?.message || err.message}`);
    }
  };

  // ─── Terapkan hasil merge ke form agunan ──────────────────────────────────
  const applyShmMerge = (agunanIndex) => {
    const merged = mergeShmToForm(getShmPages(agunanIndex));
    const updated = [...agunanList];
    updated[agunanIndex] = {
      ...updated[agunanIndex],
      ...(merged.nomorSertifikat && { nomorSertifikat: merged.nomorSertifikat }),
      ...(merged.atasNama        && { atasNama:        merged.atasNama }),
      ...(merged.luasTanah > 0   && { luasTanah:       merged.luasTanah }),
      ...(merged.kabupaten       && { kabupaten:        merged.kabupaten }),
      ...(merged.kecamatan       && { kecamatan:        merged.kecamatan }),
      ...(merged.kelurahan       && { kelurahan:        merged.kelurahan }),
      ...(merged.alamatAgunan    && { alamatAgunan:     merged.alamatAgunan }),
      ...(merged.deskripsi       && { deskripsi:        merged.deskripsi }),
      ...(merged.batasUtara      && { batasUtara:       merged.batasUtara }),
      ...(merged.batasSelatan    && { batasSelatan:     merged.batasSelatan }),
      ...(merged.batasTimur      && { batasTimur:       merged.batasTimur }),
      ...(merged.batasBarat      && { batasBarat:       merged.batasBarat }),
      // [Sesi 41 NEW] NIB & Nomor Surat Ukur disimpan ke kode_dokumen
      ...(merged.kodeDokumen     && { kodeDokumen:      merged.kodeDokumen }),
    };
    setAgunanList(updated);
  };

  // ─── BPKB single upload (lama, tetap dipakai) ─────────────────────────────
  const [bpkbLoadingIndex, setBpkbLoadingIndex] = useState(null);
  const handleBpkbScan = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    setBpkbLoadingIndex(index);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res       = await documentService.extractBpkb(formData);
      const extracted = res.data.data.data || {};
      const updated   = [...agunanList];
      updated[index]  = {
        ...updated[index],
        nomorSertifikat: extracted.nomor_bpkb  || updated[index].nomorSertifikat,
        atasNama:        extracted.atas_nama   || updated[index].atasNama,
        deskripsi:       `Merk: ${extracted.merk || ''}, Tipe: ${extracted.tipe || ''}, Tahun: ${extracted.tahun || ''}`,
      };
      setAgunanList(updated);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memproses OCR BPKB.');
    } finally {
      setBpkbLoadingIndex(null);
    }
  };

  // ─── State & helpers agunan list ──────────────────────────────────────────
  const blankAgunan = () => ({
    jenisAgunan: 'SHM', deskripsi: '', nomorSertifikat: '', atasNama: '',
    luasTanah: 0, luasBangunan: 0,
    nilaiPasar: 0, nilaiNjop: 0, nilaiTaksasi: 0, nilaiLikuidasi: 0,
    alamatAgunan: '', kelurahan: '', kecamatan: '', kabupaten: 'Batang', rtRw: '', latitude: '', longitude: '',
    batasUtara: '', batasSelatan: '', batasTimur: '', batasBarat: '',
    bentukTanah: 'Segi Empat', permukaanTanah: 'Rata', aksesJalan: 'Simpangan Mobil', jenisJalan: 'Aspal',
    lantaiBangunan: 'Keramik', rangkaAtap: 'Baja Ringan', penutupAtap: 'Genting', dinding: 'Bata Merah',
    fasilitasListrik: '900 Watt', fasilitasAir: 'PDAM',
  });

  const [agunanList, setAgunanList] = useState([blankAgunan()]);

  const addAgunan    = () => setAgunanList([...agunanList, blankAgunan()]);
  const removeAgunan = (i) => { if (agunanList.length > 1) setAgunanList(agunanList.filter((_, idx) => idx !== i)); };

  const updateAgunan = (index, field, value) => {
    const updated = [...agunanList];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'nilaiTaksasi') updated[index].nilaiLikuidasi = Math.round(parseFloat(value || 0) * 0.6);
    setAgunanList(updated);
  };

  const getLocation = (index) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { updateAgunan(index, 'latitude', pos.coords.latitude); updateAgunan(index, 'longitude', pos.coords.longitude); },
        () => alert('Tidak dapat mengakses GPS')
      );
    }
  };

  const handleSubmit = async () => {
    if (!pengajuanId) return setError('pengajuanId tidak tersedia');
    setLoading(true); setError('');
    try {
      for (const agunan of agunanList) await agunanService.create({ ...agunan, pengajuanId });
      navigate(`/pengajuan/${pengajuanId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan agunan.');
    }
    setLoading(false);
  };

  const totalNilaiPasar    = agunanList.reduce((s, a) => s + (parseFloat(a.nilaiPasar)    || 0), 0);
  const totalNilaiTaksasi  = agunanList.reduce((s, a) => s + (parseFloat(a.nilaiTaksasi)  || 0), 0);
  const totalNilaiLikuidasi = agunanList.reduce((s, a) => s + (parseFloat(a.nilaiLikuidasi) || 0), 0);

  // ─── Helper render status badge per slot ─────────────────────────────────
  const renderSlotStatus = (pageState) => {
    if (!pageState) return null;
    if (pageState.status === 'loading') return <span className="text-xs text-yellow-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Memproses...</span>;
    if (pageState.status === 'done')    return <span className="text-xs text-emerald-400 flex items-center gap-1 truncate max-w-[100px]" title={pageState.fileName}><CheckCircle className="w-3 h-3 shrink-0" />{pageState.fileName}</span>;
    if (pageState.status === 'error')   return <span className="text-xs text-red-400 flex items-center gap-1"><XCircle className="w-3 h-3" />Gagal</span>;
    return <span className="text-xs text-slate-500">Belum upload</span>;
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6 text-gold" /> Input Agunan</h1>
          <p className="text-sm text-slate-400">Penilaian agunan pengajuan kredit</p>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center"><p className="text-xs text-slate-500">Total Nilai Pasar</p><p className="text-lg font-bold text-gold mt-1">{formatRupiah(totalNilaiPasar)}</p></div>
        <div className="card text-center"><p className="text-xs text-slate-500">Total Nilai Taksasi</p><p className="text-lg font-bold mt-1">{formatRupiah(totalNilaiTaksasi)}</p></div>
        <div className="card text-center"><p className="text-xs text-slate-500">Total Nilai Likuidasi</p><p className="text-lg font-bold text-emerald-400 mt-1">{formatRupiah(totalNilaiLikuidasi)}</p></div>
      </div>

      {/* Agunan Items */}
      {agunanList.map((a, i) => (
        <div key={i} className="card animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gold">🏠 Agunan #{i + 1}</h3>
            {agunanList.length > 1 && (
              <button onClick={() => removeAgunan(i)} className="btn-ghost text-red-400 text-xs"><Trash2 className="w-3 h-3" /> Hapus</button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* ── SHM: Panel 5-slot upload per halaman ── */}
            {['SHM', 'SHGB', 'AJB'].includes(a.jenisAgunan) && (
              <div className="md:col-span-2 bg-navy-light/30 border border-navy-border rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gold">📄 Scan SHM Per Halaman — Akurasi Tinggi</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Upload setiap halaman SHM secara terpisah untuk hasil terbaik. Halaman opsional bisa dilewati.</p>
                  </div>
                  {hasShmData(i) && (
                    <button
                      type="button"
                      onClick={() => {
                        console.log("=== DEBUG MERGE ===");
                        console.log("PAGES DATA:", getShmPages(i));
                        const merged = mergeShmToForm(getShmPages(i));
                        console.log("MERGED DATA:", merged);
                        applyShmMerge(i);
                        alert(`Data yang berhasil di-merge:\nNo Sertifikat: ${merged.nomorSertifikat}\nNama: ${merged.atasNama}\nLuas: ${merged.luasTanah}`);
                      }}
                      className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 shrink-0 ml-3"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Terapkan ke Form
                    </button>
                  )}
                </div>

                {/* 5 slot grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {SHM_PAGE_SLOTS.map(slot => {
                    const pageState = getShmPages(i)[slot.key];
                    const isDone    = pageState?.status === 'done';
                    const isLoading = pageState?.status === 'loading';
                    return (
                      <div
                        key={slot.key}
                        className={`relative flex flex-col gap-1.5 rounded-lg border p-2.5 transition-colors
                          ${isDone    ? 'border-emerald-500/40 bg-emerald-500/5'  : ''}
                          ${isLoading ? 'border-yellow-500/40 bg-yellow-500/5'    : ''}
                          ${!isDone && !isLoading ? 'border-navy-border bg-navy/30' : ''}`}
                      >
                        {/* Badge wajib/opsional */}
                        <span className={`absolute top-1.5 right-1.5 text-[9px] font-semibold px-1 rounded
                          ${slot.badge === 'Wajib' ? 'bg-gold/20 text-gold' : 'bg-slate-700 text-slate-400'}`}>
                          {slot.badge}
                        </span>

                        <p className="text-xs font-semibold text-slate-200 pr-10">{slot.label}</p>
                        <p className="text-[10px] text-slate-500 leading-tight">{slot.desc}</p>

                        {/* Status */}
                        <div className="mt-1">{renderSlotStatus(pageState)}</div>

                        {/* Upload button */}
                        <label className={`mt-1.5 flex items-center justify-center gap-1 text-[11px] font-medium cursor-pointer rounded px-2 py-1.5 transition
                          ${isLoading ? 'opacity-50 cursor-not-allowed bg-navy-border text-slate-500' : ''}
                          ${isDone    ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30' : ''}
                          ${!isDone && !isLoading ? 'bg-navy-border text-slate-300 hover:bg-slate-600' : ''}`}>
                          {isLoading
                            ? <><Loader2 className="w-3 h-3 animate-spin" /> Proses...</>
                            : isDone
                            ? <><RefreshCw className="w-3 h-3" /> Scan Ulang</>
                            : <><Upload className="w-3 h-3" /> Upload</>}
                          <input
                            type="file"
                            accept="image/*,.pdf,application/pdf"
                            className="hidden"
                            disabled={isLoading}
                            onChange={e => { if (e.target.files[0]) handleShmPageUpload(i, slot.key, e.target.files[0]); e.target.value = ''; }}
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>

                {hasShmData(i) && (
                  <p className="text-xs text-slate-500 text-center pt-1">
                    ✅ {Object.values(getShmPages(i)).filter(p => p.status === 'done').length}/5 halaman berhasil — klik <strong className="text-gold">Terapkan ke Form</strong> untuk mengisi otomatis
                  </p>
                )}
              </div>
            )}

            {/* ── BPKB: Single upload (lama) ── */}
            {!['SHM', 'SHGB', 'AJB'].includes(a.jenisAgunan) && (
              <div className="md:col-span-2 flex items-center justify-between bg-navy-light/30 border border-navy-border p-4 rounded-xl">
                <div>
                  <h3 className="text-sm font-semibold text-gold">Scan BPKB Otomatis (OCR)</h3>
                  <p className="text-xs text-slate-400">Unggah foto dokumen BPKB untuk mengisi data otomatis</p>
                </div>
                <label className="btn-primary flex items-center gap-2 cursor-pointer">
                  {bpkbLoadingIndex === i ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {bpkbLoadingIndex === i ? 'Memproses...' : 'Unggah BPKB'}
                  <input type="file" accept="image/*,.pdf,application/pdf" onChange={e => handleBpkbScan(e, i)} className="hidden" disabled={bpkbLoadingIndex !== null} />
                </label>
              </div>
            )}

            {/* ── Informasi Dasar ── */}
            <div>
              <label className="label">Jenis Agunan</label>
              <select value={a.jenisAgunan} onChange={e => updateAgunan(i, 'jenisAgunan', e.target.value)} className="input-field">
                {JENIS_AGUNAN.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
              </select>
            </div>
            <div><label className="label">No. Sertifikat</label><input type="text" value={a.nomorSertifikat} onChange={e => updateAgunan(i, 'nomorSertifikat', e.target.value)} className="input-field" /></div>
            <div><label className="label">Atas Nama</label><input type="text" value={a.atasNama} onChange={e => updateAgunan(i, 'atasNama', e.target.value)} className="input-field" /></div>
            
            {!['SHM', 'SHGB', 'AJB'].includes(a.jenisAgunan) && (
              <div><label className="label">Deskripsi</label><input type="text" value={a.deskripsi} onChange={e => updateAgunan(i, 'deskripsi', e.target.value)} className="input-field" /></div>
            )}
            {['SHM', 'SHGB', 'AJB'].includes(a.jenisAgunan) && (
              <>
                <div><label className="label">Luas Tanah (m²)</label><input type="number" value={a.luasTanah} onChange={e => updateAgunan(i, 'luasTanah', parseFloat(e.target.value) || 0)} className="input-field text-right" /></div>
                <div><label className="label">Luas Bangunan (m²)</label><input type="number" value={a.luasBangunan} onChange={e => updateAgunan(i, 'luasBangunan', parseFloat(e.target.value) || 0)} className="input-field text-right" /></div>
              </>
            )}

            <hr className="md:col-span-2 border-navy-border" />
            <h4 className="md:col-span-2 text-sm font-semibold text-gold">💰 Penilaian</h4>
            <div><label className="label">Nilai Pasar (Rp)</label><input type="number" value={a.nilaiPasar} onChange={e => updateAgunan(i, 'nilaiPasar', parseFloat(e.target.value) || 0)} className="input-field text-right" /></div>
            <div><label className="label">Nilai NJOP (Rp)</label><input type="number" value={a.nilaiNjop} onChange={e => updateAgunan(i, 'nilaiNjop', parseFloat(e.target.value) || 0)} className="input-field text-right" /></div>
            <div><label className="label">Nilai Taksasi (Rp)</label><input type="number" value={a.nilaiTaksasi} onChange={e => updateAgunan(i, 'nilaiTaksasi', parseFloat(e.target.value) || 0)} className="input-field text-right" /></div>
            <div>
              <label className="label">Nilai Likuidasi (Rp) — auto 60%</label>
              <div className="input-field bg-navy/50 text-emerald-400 font-semibold text-right cursor-not-allowed">{formatRupiah(a.nilaiLikuidasi)}</div>
            </div>

            <hr className="md:col-span-2 border-navy-border mt-4" />
            <h4 className="md:col-span-2 text-sm font-semibold text-gold">📍 Detail Lokasi & Batas Tanah</h4>
            <div className="md:col-span-2"><label className="label">Alamat Agunan (Jalan)</label><textarea value={a.alamatAgunan} onChange={e => updateAgunan(i, 'alamatAgunan', e.target.value)} className="input-field" rows={2} /></div>
            <div><label className="label">RT/RW</label><input type="text" value={a.rtRw} onChange={e => updateAgunan(i, 'rtRw', e.target.value)} className="input-field" placeholder="Contoh: 003 / 001" /></div>
            <div><label className="label">Kelurahan / Desa</label><input type="text" value={a.kelurahan} onChange={e => updateAgunan(i, 'kelurahan', e.target.value)} className="input-field" /></div>
            <div><label className="label">Kecamatan</label><input type="text" value={a.kecamatan} onChange={e => updateAgunan(i, 'kecamatan', e.target.value)} className="input-field" /></div>
            <div><label className="label">Kabupaten / Kota</label><input type="text" value={a.kabupaten} onChange={e => updateAgunan(i, 'kabupaten', e.target.value)} className="input-field" /></div>
            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className="label">Batas Utara</label><input type="text" value={a.batasUtara} onChange={e => updateAgunan(i, 'batasUtara', e.target.value)} className="input-field" /></div>
              <div><label className="label">Batas Selatan</label><input type="text" value={a.batasSelatan} onChange={e => updateAgunan(i, 'batasSelatan', e.target.value)} className="input-field" /></div>
              <div><label className="label">Batas Timur</label><input type="text" value={a.batasTimur} onChange={e => updateAgunan(i, 'batasTimur', e.target.value)} className="input-field" /></div>
              <div><label className="label">Batas Barat</label><input type="text" value={a.batasBarat} onChange={e => updateAgunan(i, 'batasBarat', e.target.value)} className="input-field" /></div>
            </div>

            <hr className="md:col-span-2 border-navy-border mt-4" />
            <h4 className="md:col-span-2 text-sm font-semibold text-gold">📐 Bentuk & Ukuran Tanah</h4>
            <div>
              <label className="label">Bentuk Tanah</label>
              <select value={a.bentukTanah} onChange={e => updateAgunan(i, 'bentukTanah', e.target.value)} className="input-field">
                <option value="Segi Empat">Segi Empat</option>
                <option value="Segitiga">Segitiga</option>
                <option value="Tidak Beraturan">Tidak Beraturan</option>
              </select>
            </div>
            <div>
              <label className="label">Permukaan Tanah</label>
              <select value={a.permukaanTanah} onChange={e => updateAgunan(i, 'permukaanTanah', e.target.value)} className="input-field">
                <option value="Rata">Rata</option>
                <option value="Bergelombang">Bergelombang</option>
              </select>
            </div>
            <div>
              <label className="label">Akses Jalan Masuk</label>
              <select value={a.aksesJalan} onChange={e => updateAgunan(i, 'aksesJalan', e.target.value)} className="input-field">
                <option value="Simpangan Mobil">Simpangan Mobil</option>
                <option value="Hanya Masuk Satu Mobil">Hanya Masuk Satu Mobil</option>
                <option value="Simpangan Sepeda Motor">Simpangan Sepeda Motor</option>
              </select>
            </div>
            <div>
              <label className="label">Jenis Jalan</label>
              <select value={a.jenisJalan} onChange={e => updateAgunan(i, 'jenisJalan', e.target.value)} className="input-field">
                <option value="Aspal">Aspal</option>
                <option value="Paving">Paving</option>
                <option value="Beton Cor">Beton Cor</option>
                <option value="Tanah">Tanah</option>
              </select>
            </div>

            <hr className="md:col-span-2 border-navy-border mt-4" />
            <h4 className="md:col-span-2 text-sm font-semibold text-gold">🏗️ Struktur Bangunan</h4>
            <div><label className="label">Lantai Bangunan</label><input type="text" value={a.lantaiBangunan} onChange={e => updateAgunan(i, 'lantaiBangunan', e.target.value)} className="input-field" placeholder="Contoh: Keramik" /></div>
            <div><label className="label">Rangka Atap</label><input type="text" value={a.rangkaAtap} onChange={e => updateAgunan(i, 'rangkaAtap', e.target.value)} className="input-field" placeholder="Contoh: Baja Ringan" /></div>
            <div><label className="label">Penutup Atap</label><input type="text" value={a.penutupAtap} onChange={e => updateAgunan(i, 'penutupAtap', e.target.value)} className="input-field" placeholder="Contoh: Genteng" /></div>
            <div><label className="label">Dinding</label><input type="text" value={a.dinding} onChange={e => updateAgunan(i, 'dinding', e.target.value)} className="input-field" placeholder="Contoh: Bata Merah" /></div>
            <div><label className="label">Fasilitas Listrik</label><input type="text" value={a.fasilitasListrik} onChange={e => updateAgunan(i, 'fasilitasListrik', e.target.value)} className="input-field" placeholder="Contoh: 900 Watt" /></div>
            <div><label className="label">Fasilitas Air</label><input type="text" value={a.fasilitasAir} onChange={e => updateAgunan(i, 'fasilitasAir', e.target.value)} className="input-field" placeholder="Contoh: PDAM / Sumur" /></div>

            <hr className="md:col-span-2 border-navy-border mt-4" />
            <div className="flex items-end gap-2 md:col-span-2">
              <div className="flex-1"><label className="label">Titik Koordinat (GPS)</label><input type="text" readOnly value={a.latitude ? `${a.latitude}, ${a.longitude}` : ''} className="input-field" placeholder="Belum ada" /></div>
              <button onClick={() => getLocation(i)} className="btn-secondary shrink-0 mb-0"><MapPin className="w-4 h-4" /> Dapatkan GPS</button>
            </div>
          </div>
        </div>
      ))}

      <button onClick={addAgunan} className="btn-secondary w-full"><Plus className="w-4 h-4" /> Tambah Agunan Lagi</button>

      <div className="flex justify-end gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary">Batal</button>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Semua Agunan
        </button>
      </div>
    </div>
  );
}
