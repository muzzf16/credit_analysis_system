import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Building2, MapPin, Camera } from 'lucide-react';
import { agunanService, ocrService } from '../../services';
import { JENIS_AGUNAN } from '../../utils/constants';
import { formatRupiah } from '../../utils/formatters';

export default function AgunanEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [pengajuanId, setPengajuanId] = useState('');

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
        const a = res.data.data;
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
      if (field === 'nilaiTaksasi') {
        next.nilaiLikuidasi = Math.round(parseFloat(value || 0) * 0.6);
      }
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

  const handleOcr = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const type = ['SHM', 'SHGB', 'AJB'].includes(form.jenisAgunan) ? 'shm' : 'bpkb';
    setOcrLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    try {
      const res = await ocrService.process(formData);
      const extracted = res.data.data.data;
      if (type === 'shm') {
        setForm(prev => ({
          ...prev,
          nomorSertifikat: extracted.nomorSertifikat || prev.nomorSertifikat,
          atasNama: extracted.atasNama || prev.atasNama,
          luasTanah: extracted.luasTanah || prev.luasTanah,
          alamatAgunan: extracted.alamatAgunan || prev.alamatAgunan,
          kecamatan: extracted.kecamatan || prev.kecamatan,
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memproses OCR.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
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

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}
      {successMsg && <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 text-sm text-emerald-400">{successMsg}</div>}

      <div className="card animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* OCR Scan */}
          <div className="md:col-span-2 flex items-center justify-between bg-navy-light/30 border border-navy-border p-4 rounded-xl">
            <div>
              <h3 className="text-sm font-semibold text-gold">Scan {['SHM', 'SHGB', 'AJB'].includes(form.jenisAgunan) ? 'Sertifikat (SHM/SHGB)' : 'BPKB'} Otomatis (OCR)</h3>
              <p className="text-xs text-slate-400">Unggah ulang dokumen untuk mengisi ulang data otomatis</p>
            </div>
            <label className="btn-primary flex items-center gap-2 cursor-pointer">
              {ocrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {ocrLoading ? 'Memproses OCR...' : 'Unggah Dokumen'}
              <input type="file" accept="image/*,application/pdf" onChange={handleOcr} className="hidden" disabled={ocrLoading} />
            </label>
          </div>

          {/* Informasi Dasar */}
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
