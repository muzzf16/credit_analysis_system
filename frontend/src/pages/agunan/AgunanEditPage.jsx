import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Building2, MapPin, CheckCircle, XCircle, Upload, RefreshCw } from 'lucide-react';
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
  const cover     = pages.cover?.data      || {};
  const pend      = pages.pendaftaran?.data || {};
  const peralihan = pages.peralihan?.data   || {};
  const suratUkur = pages.surat_ukur?.data  || {};
  const peta      = pages.peta?.data        || {};

  const nomor  = cover.nomor_sertifikat   || pend.nomor_sertifikat    || '';
  const nama   = pend.nama_pemegang_hak   || pend.atas_nama           || '';
  const luasM2 = (pend.luas_m2 > 0 ? pend.luas_m2 : null)
               || (suratUkur.luas_m2 > 0 ? suratUkur.luas_m2 : null) || 0;
  const keadaan = suratUkur.keadaan_tanah || pend.keadaan_tanah       || '';
  const kec     = cover.kecamatan         || suratUkur.kecamatan       || pend.kecamatan      || '';
  const kab     = cover.kabupaten_kota    || suratUkur.kabupaten_kota  || '';
  const desa    = cover.desa_kelurahan    || suratUkur.desa_kelurahan  || pend.desa_kelurahan || '';
  const prov    = cover.provinsi          || suratUkur.provinsi        || '';

  const tetangga = Array.isArray(peta.nama_tetangga) ? peta.nama_tetangga : [];
  const [bU = '', bS = '', bT = '', bB = ''] = tetangga;

  const alamatParts  = [desa, kec ? `Kec. ${kec}` : null, kab ? `Kab. ${kab}` : null, prov].filter(Boolean);
  const alamatOcr    = alamatParts.join(', ');
  const deskripsiOcr = [keadaan, luasM2 ? `${luasM2} m\u00B2` : ''].filter(Boolean).join(', ');

  return { nomorSertifikat: nomor, atasNama: nama, luasTanah: luasM2,
           kabupaten: kab, kecamatan: kec, kelurahan: desa,
           alamatAgunan: alamatOcr, deskripsi: deskripsiOcr,
           batasUtara: bU, batasSelatan: bS, batasTimur: bT, batasBarat: bB };
}

export default function AgunanEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading,      setLoading]      = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error,        setError]        = useState('');
  const [successMsg,   setSuccessMsg]   = useState('');
  const [pengajuanId,  setPengajuanId]  = useState('');

  // ─── SHM multi-page state ────────────────────────────────────────────────
  const [shmPages, setShmPages] = useState(INIT_SHM_PAGES());
  // BPKB single upload loading
  const [bpkbLoading, setBpkbLoading] = useState(false);

  const updateShmPage = (pageKey, patch) =>
    setShmPages(prev => ({ ...prev, [pageKey]: { ...prev[pageKey], ...patch } }));

  const hasShmData = () => Object.values(shmPages).some(p => p.status === 'done' && p.data);

  const [form, setForm] = useState({
    jenisAgunan: 'SHM', deskripsi: '', nomorSertifikat: '', atasNama: '',
    luasTanah: 0, luasBangunan: 0,
    nilaiPasar: 0, nilaiNjop: 0, nilaiTaksasi: 0, nilaiLikuidasi: 0,
    alamatAgunan: '', kelurahan: '', kecamatan: '', kabupaten: '', rtRw: '', latitude: '', longitude: '',
    batasUtara: '', batasSelatan: '', batasTimur: '', batasBarat: '',
    bentukTanah: 'Segi Empat', permukaanTanah: 'Rata', aksesJalan: 'Simpangan Mobil', jenisJalan: 'Aspal',
    lantaiBangunan: '', rangkaAtap: '', penutupAtap: '', dinding: '', fasilitasListrik: '', fasilitasAir: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchLoading(true);
        const res = await agunanService.getById(id);
        const a   = res.data.data;
        setPengajuanId(a.pengajuan_id);
        setForm({
          jenisAgunan: a.jenis_agunan || 'SHM',
          deskripsi: a.deskripsi || '',
          nomorSertifikat: a.nomor_sertifikat || '',
          atasNama: a.atas_nama || '',
          luasTanah: a.luas_tanah || 0,
          luasBangunan: a.luas_bangunan || 0,
          nilaiPasar: a.nilai_pasar || 0,
          nilaiNjop: a.nilai_njop || 0,
          nilaiTaksasi: a.nilai_taksasi || 0,
          nilaiLikuidasi: a.nilai_likuidasi || 0,
          alamatAgunan: a.alamat_agunan || '',
          kelurahan: a.kelurahan || '',
          kecamatan: a.kecamatan || '',
          kabupaten: a.kabupaten || '',
          rtRw: a.rt_rw || '',
          latitude: a.latitude || '',
          longitude: a.longitude || '',
          batasUtara: a.batas_utara || '',
          batasSelatan: a.batas_selatan || '',
          batasTimur: a.batas_timur || '',
          batasBarat: a.batas_barat || '',
          bentukTanah: a.bentuk_tanah || 'Segi Empat',
          permukaanTanah: a.permukaan_tanah || 'Rata',
          aksesJalan: a.akses_jalan || 'Simpangan Mobil',
          jenisJalan: a.jenis_jalan || 'Aspal',
          lantaiBangunan: a.lantai_bangunan || '',
          rangkaAtap: a.rangka_atap || '',
          penutupAtap: a.penutup_atap || '',
          dinding: a.dinding || '',
          fasilitasListrik: a.fasilitas_listrik || '',
          fasilitasAir: a.fasilitas_air || '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat data agunan.');
      } finally {
        setFetchLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const update = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'nilaiTaksasi') next.nilaiLikuidasi = Math.round(parseFloat(value || 0) * 0.6);
      return next;
    });
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { update('latitude', pos.coords.latitude); update('longitude', pos.coords.longitude); },
        () => alert('Tidak dapat mengakses GPS')
      );
    }
  };

  // ─── Upload 1 halaman SHM ─────────────────────────────────────────────────
  const handleShmPageUpload = async (pageKey, file) => {
    if (!file) return;
    updateShmPage(pageKey, { status: 'loading', fileName: file.name });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('page_type', pageKey);
    try {
      const res  = await documentService.extractShmPage(formData);
      const data = res.data.data.data || {};
      updateShmPage(pageKey, { status: 'done', data, fileName: file.name });
    } catch (err) {
      updateShmPage(pageKey, { status: 'error', data: null, fileName: file.name });
      setError(`Gagal proses halaman ${pageKey}: ${err.response?.data?.message || err.message}`);
    }
  };

  // ─── Terapkan hasil merge ke form ─────────────────────────────────────────
  const applyShmMerge = () => {
    const merged = mergeShmToForm(shmPages);
    setForm(prev => ({
      ...prev,
      ...(merged.nomorSertifikat && { nomorSertifikat: merged.nomorSertifikat }),
      ...(merged.atasNama        && { atasNama:         merged.atasNama }),
      ...(merged.luasTanah > 0   && { luasTanah:        merged.luasTanah }),
      ...(merged.kabupaten       && { kabupaten:         merged.kabupaten }),
      ...(merged.kecamatan       && { kecamatan:         merged.kecamatan }),
      ...(merged.kelurahan       && { kelurahan:         merged.kelurahan }),
      ...(merged.alamatAgunan    && { alamatAgunan:      merged.alamatAgunan }),
      ...(merged.deskripsi       && { deskripsi:         merged.deskripsi }),
      ...(merged.batasUtara      && { batasUtara:        merged.batasUtara }),
      ...(merged.batasSelatan    && { batasSelatan:      merged.batasSelatan }),
      ...(merged.batasTimur      && { batasTimur:        merged.batasTimur }),
      ...(merged.batasBarat      && { batasBarat:        merged.batasBarat }),
    }));
    setSuccessMsg('✅ Data dari SHM berhasil diterapkan ke form!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ─── BPKB single upload ──────────────────────────────────────────────────
  const handleBpkbScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBpkbLoading(true); setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res       = await documentService.extractBpkb(formData);
      const extracted = res.data.data.data || {};
      setForm(prev => ({
        ...prev,
        nomorSertifikat: extracted.nomor_bpkb || prev.nomorSertifikat,
        atasNama:        extracted.atas_nama   || prev.atasNama,
        deskripsi:       `Merk: ${extracted.merk || ''}, Tipe: ${extracted.tipe || ''}, Tahun: ${extracted.tahun || ''}`,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memproses OCR BPKB.');
    } finally {
      setBpkbLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      await agunanService.update(id, form);
      setSuccessMsg('Data agunan berhasil diperbarui!');
      setTimeout(() => navigate(`/pengajuan/${pengajuanId}`), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memperbarui agunan.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Helper render status badge per slot ─────────────────────────────────
  const renderSlotStatus = (pageState) => {
    if (!pageState) return null;
    if (pageState.status === 'loading') return <span className="text-xs text-yellow-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Memproses...</span>;
    if (pageState.status === 'done')    return <span className="text-xs text-emerald-400 flex items-center gap-1 truncate max-w-[100px]" title={pageState.fileName}><CheckCircle className="w-3 h-3 shrink-0" />{pageState.fileName}</span>;
    if (pageState.status === 'error')   return <span className="text-xs text-red-400 flex items-center gap-1"><XCircle className="w-3 h-3" />Gagal</span>;
    return <span className="text-xs text-slate-500">Belum upload</span>;
  };

  if (fetchLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-gold" />
      <span className="ml-3 text-slate-400">Memuat data agunan...</span>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6 text-gold" /> Edit Agunan</h1>
          <p className="text-sm text-slate-400">Perbarui data penilaian agunan</p>
        </div>
      </div>

      {error      && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}
      {successMsg && <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 text-sm text-emerald-400">{successMsg}</div>}

      <div className="card animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ── SHM: Panel 5-slot upload per halaman ── */}
          {['SHM', 'SHGB', 'AJB'].includes(form.jenisAgunan) && (
            <div className="md:col-span-2 bg-navy-light/30 border border-navy-border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gold">📄 Scan SHM Per Halaman — Akurasi Tinggi</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Upload setiap halaman SHM secara terpisah untuk hasil terbaik. Halaman opsional bisa dilewati.</p>
                </div>
                {hasShmData() && (
                  <button
                    onClick={applyShmMerge}
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
                  const pageState = shmPages[slot.key];
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
                      <span className={`absolute top-1.5 right-1.5 text-[9px] font-semibold px-1 rounded
                        ${slot.badge === 'Wajib' ? 'bg-gold/20 text-gold' : 'bg-slate-700 text-slate-400'}`}>
                        {slot.badge}
                      </span>

                      <p className="text-xs font-semibold text-slate-200 pr-10">{slot.label}</p>
                      <p className="text-[10px] text-slate-500 leading-tight">{slot.desc}</p>
                      <div className="mt-1">{renderSlotStatus(pageState)}</div>

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
                          onChange={e => { if (e.target.files[0]) handleShmPageUpload(slot.key, e.target.files[0]); e.target.value = ''; }}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>

              {hasShmData() && (
                <p className="text-xs text-slate-500 text-center pt-1">
                  ✅ {Object.values(shmPages).filter(p => p.status === 'done').length}/5 halaman berhasil — klik <strong className="text-gold">Terapkan ke Form</strong> untuk mengisi otomatis
                </p>
              )}
            </div>
          )}

          {/* ── BPKB: Single upload ── */}
          {!['SHM', 'SHGB', 'AJB'].includes(form.jenisAgunan) && (
            <div className="md:col-span-2 flex items-center justify-between bg-navy-light/30 border border-navy-border p-4 rounded-xl">
              <div>
                <h3 className="text-sm font-semibold text-gold">Scan BPKB Otomatis (OCR)</h3>
                <p className="text-xs text-slate-400">Unggah ulang dokumen BPKB untuk mengisi ulang data otomatis</p>
              </div>
              <label className="btn-primary flex items-center gap-2 cursor-pointer">
                {bpkbLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {bpkbLoading ? 'Memproses OCR...' : 'Unggah BPKB'}
                <input type="file" accept="image/*,.pdf,application/pdf" onChange={handleBpkbScan} className="hidden" disabled={bpkbLoading} />
              </label>
            </div>
          )}

          {/* ── Informasi Dasar ── */}
          <div>
            <label className="label">Jenis Agunan</label>
            <select value={form.jenisAgunan} onChange={e => update('jenisAgunan', e.target.value)} className="input-field">
              {JENIS_AGUNAN.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
            </select>
          </div>
          <div><label className="label">No. Sertifikat</label><input type="text" value={form.nomorSertifikat} onChange={e => update('nomorSertifikat', e.target.value)} className="input-field" /></div>
          <div><label className="label">Atas Nama</label><input type="text" value={form.atasNama} onChange={e => update('atasNama', e.target.value)} className="input-field" /></div>
          <div><label className="label">Deskripsi</label><input type="text" value={form.deskripsi} onChange={e => update('deskripsi', e.target.value)} className="input-field" /></div>

          {['SHM', 'SHGB', 'AJB'].includes(form.jenisAgunan) && (
            <>
              <div><label className="label">Luas Tanah (m²)</label><input type="number" value={form.luasTanah} onChange={e => update('luasTanah', parseFloat(e.target.value) || 0)} className="input-field text-right" /></div>
              <div><label className="label">Luas Bangunan (m²)</label><input type="number" value={form.luasBangunan} onChange={e => update('luasBangunan', parseFloat(e.target.value) || 0)} className="input-field text-right" /></div>
            </>
          )}

          {/* Penilaian */}
          <hr className="md:col-span-2 border-navy-border" />
          <h4 className="md:col-span-2 text-sm font-semibold text-gold">💰 Penilaian</h4>
          <div><label className="label">Nilai Pasar (Rp)</label><input type="number" value={form.nilaiPasar} onChange={e => update('nilaiPasar', parseFloat(e.target.value) || 0)} className="input-field text-right" /></div>
          <div><label className="label">Nilai NJOP (Rp)</label><input type="number" value={form.nilaiNjop} onChange={e => update('nilaiNjop', parseFloat(e.target.value) || 0)} className="input-field text-right" /></div>
          <div><label className="label">Nilai Taksasi (Rp)</label><input type="number" value={form.nilaiTaksasi} onChange={e => update('nilaiTaksasi', parseFloat(e.target.value) || 0)} className="input-field text-right" /></div>
          <div>
            <label className="label">Nilai Likuidasi (Rp) — auto 60%</label>
            <div className="input-field bg-navy/50 text-emerald-400 font-semibold text-right cursor-not-allowed">{formatRupiah(form.nilaiLikuidasi)}</div>
          </div>

          {/* Lokasi & Batas */}
          <hr className="md:col-span-2 border-navy-border mt-4" />
          <h4 className="md:col-span-2 text-sm font-semibold text-gold">📍 Detail Lokasi & Batas Tanah</h4>
          <div className="md:col-span-2"><label className="label">Alamat Agunan (Jalan)</label><textarea value={form.alamatAgunan} onChange={e => update('alamatAgunan', e.target.value)} className="input-field" rows={2} /></div>
          <div><label className="label">RT/RW</label><input type="text" value={form.rtRw} onChange={e => update('rtRw', e.target.value)} className="input-field" placeholder="Contoh: 003 / 001" /></div>
          <div><label className="label">Kelurahan / Desa</label><input type="text" value={form.kelurahan} onChange={e => update('kelurahan', e.target.value)} className="input-field" /></div>
          <div><label className="label">Kecamatan</label><input type="text" value={form.kecamatan} onChange={e => update('kecamatan', e.target.value)} className="input-field" /></div>
          <div><label className="label">Kabupaten / Kota</label><input type="text" value={form.kabupaten} onChange={e => update('kabupaten', e.target.value)} className="input-field" /></div>
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className="label">Batas Utara</label><input type="text" value={form.batasUtara} onChange={e => update('batasUtara', e.target.value)} className="input-field" /></div>
            <div><label className="label">Batas Selatan</label><input type="text" value={form.batasSelatan} onChange={e => update('batasSelatan', e.target.value)} className="input-field" /></div>
            <div><label className="label">Batas Timur</label><input type="text" value={form.batasTimur} onChange={e => update('batasTimur', e.target.value)} className="input-field" /></div>
            <div><label className="label">Batas Barat</label><input type="text" value={form.batasBarat} onChange={e => update('batasBarat', e.target.value)} className="input-field" /></div>
          </div>

          {/* Bentuk & Ukuran */}
          <hr className="md:col-span-2 border-navy-border mt-4" />
          <h4 className="md:col-span-2 text-sm font-semibold text-gold">📐 Bentuk & Ukuran Tanah</h4>
          <div>
            <label className="label">Bentuk Tanah</label>
            <select value={form.bentukTanah} onChange={e => update('bentukTanah', e.target.value)} className="input-field">
              <option value="Segi Empat">Segi Empat</option>
              <option value="Segitiga">Segitiga</option>
              <option value="Tidak Beraturan">Tidak Beraturan</option>
            </select>
          </div>
          <div>
            <label className="label">Permukaan Tanah</label>
            <select value={form.permukaanTanah} onChange={e => update('permukaanTanah', e.target.value)} className="input-field">
              <option value="Rata">Rata</option>
              <option value="Bergelombang">Bergelombang</option>
            </select>
          </div>
          <div>
            <label className="label">Akses Jalan Masuk</label>
            <select value={form.aksesJalan} onChange={e => update('aksesJalan', e.target.value)} className="input-field">
              <option value="Simpangan Mobil">Simpangan Mobil</option>
              <option value="Hanya Masuk Satu Mobil">Hanya Masuk Satu Mobil</option>
              <option value="Simpangan Sepeda Motor">Simpangan Sepeda Motor</option>
            </select>
          </div>
          <div>
            <label className="label">Jenis Jalan</label>
            <select value={form.jenisJalan} onChange={e => update('jenisJalan', e.target.value)} className="input-field">
              <option value="Aspal">Aspal</option>
              <option value="Paving">Paving</option>
              <option value="Beton Cor">Beton Cor</option>
              <option value="Tanah">Tanah</option>
            </select>
          </div>

          {/* Struktur Bangunan */}
          <hr className="md:col-span-2 border-navy-border mt-4" />
          <h4 className="md:col-span-2 text-sm font-semibold text-gold">🏗️ Struktur Bangunan</h4>
          <div><label className="label">Lantai Bangunan</label><input type="text" value={form.lantaiBangunan} onChange={e => update('lantaiBangunan', e.target.value)} className="input-field" placeholder="Contoh: Keramik" /></div>
          <div><label className="label">Rangka Atap</label><input type="text" value={form.rangkaAtap} onChange={e => update('rangkaAtap', e.target.value)} className="input-field" placeholder="Contoh: Baja Ringan" /></div>
          <div><label className="label">Penutup Atap</label><input type="text" value={form.penutupAtap} onChange={e => update('penutupAtap', e.target.value)} className="input-field" placeholder="Contoh: Genteng" /></div>
          <div><label className="label">Dinding</label><input type="text" value={form.dinding} onChange={e => update('dinding', e.target.value)} className="input-field" placeholder="Contoh: Bata Merah" /></div>
          <div><label className="label">Fasilitas Listrik</label><input type="text" value={form.fasilitasListrik} onChange={e => update('fasilitasListrik', e.target.value)} className="input-field" placeholder="Contoh: 900 Watt" /></div>
          <div><label className="label">Fasilitas Air</label><input type="text" value={form.fasilitasAir} onChange={e => update('fasilitasAir', e.target.value)} className="input-field" placeholder="Contoh: PDAM / Sumur" /></div>

          {/* GPS */}
          <hr className="md:col-span-2 border-navy-border mt-4" />
          <div className="flex items-end gap-2 md:col-span-2">
            <div className="flex-1"><label className="label">Titik Koordinat (GPS)</label><input type="text" readOnly value={form.latitude ? `${form.latitude}, ${form.longitude}` : ''} className="input-field" placeholder="Belum ada" /></div>
            <button onClick={getLocation} className="btn-secondary shrink-0 mb-0"><MapPin className="w-4 h-4" /> Dapatkan GPS</button>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary">Batal</button>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Perubahan
        </button>
      </div>
    </div>
  );
}
