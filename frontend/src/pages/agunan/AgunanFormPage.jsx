import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Building2, Camera, MapPin, Plus, Trash2 } from 'lucide-react';
import { agunanService } from '../../services';
import { JENIS_AGUNAN } from '../../utils/constants';
import { formatRupiah } from '../../utils/formatters';

export default function AgunanFormPage() {
  const [params] = useSearchParams();
  const pengajuanId = params.get('pengajuanId') || '';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [agunanList, setAgunanList] = useState([{
    jenisAgunan: 'SHM', deskripsi: '', nomorSertifikat: '', atasNama: '',
    luasTanah: 0, luasBangunan: 0,
    nilaiPasar: 0, nilaiNjop: 0, nilaiTaksasi: 0, nilaiLikuidasi: 0,
    alamatAgunan: '', kecamatan: '', latitude: '', longitude: '',
  }]);

  const addAgunan = () => {
    setAgunanList([...agunanList, {
      jenisAgunan: 'SHM', deskripsi: '', nomorSertifikat: '', atasNama: '',
      luasTanah: 0, luasBangunan: 0,
      nilaiPasar: 0, nilaiNjop: 0, nilaiTaksasi: 0, nilaiLikuidasi: 0,
      alamatAgunan: '', kecamatan: '', latitude: '', longitude: '',
    }]);
  };

  const removeAgunan = (index) => {
    if (agunanList.length > 1) setAgunanList(agunanList.filter((_, i) => i !== index));
  };

  const updateAgunan = (index, field, value) => {
    const updated = [...agunanList];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calc nilai likuidasi (60% dari nilai taksasi, standar BPR)
    if (field === 'nilaiTaksasi') {
      updated[index].nilaiLikuidasi = Math.round(parseFloat(value || 0) * 0.6);
    }

    setAgunanList(updated);
  };

  const getLocation = (index) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        updateAgunan(index, 'latitude', pos.coords.latitude);
        updateAgunan(index, 'longitude', pos.coords.longitude);
      }, () => alert('Tidak dapat mengakses GPS'));
    }
  };

  const handleSubmit = async () => {
    if (!pengajuanId) return setError('pengajuanId tidak tersedia');
    setLoading(true);
    setError('');
    try {
      for (const agunan of agunanList) {
        await agunanService.create({ ...agunan, pengajuanId });
      }
      navigate(`/pengajuan/${pengajuanId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan agunan.');
    }
    setLoading(false);
  };

  // Total summary
  const totalNilaiPasar = agunanList.reduce((s, a) => s + (parseFloat(a.nilaiPasar) || 0), 0);
  const totalNilaiTaksasi = agunanList.reduce((s, a) => s + (parseFloat(a.nilaiTaksasi) || 0), 0);
  const totalNilaiLikuidasi = agunanList.reduce((s, a) => s + (parseFloat(a.nilaiLikuidasi) || 0), 0);

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
            <div>
              <label className="label">Jenis Agunan</label>
              <select value={a.jenisAgunan} onChange={e => updateAgunan(i, 'jenisAgunan', e.target.value)} className="input-field">
                {JENIS_AGUNAN.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
              </select>
            </div>
            <div><label className="label">No. Sertifikat</label><input type="text" value={a.nomorSertifikat} onChange={e => updateAgunan(i, 'nomorSertifikat', e.target.value)} className="input-field" /></div>
            <div><label className="label">Atas Nama</label><input type="text" value={a.atasNama} onChange={e => updateAgunan(i, 'atasNama', e.target.value)} className="input-field" /></div>
            <div><label className="label">Deskripsi</label><input type="text" value={a.deskripsi} onChange={e => updateAgunan(i, 'deskripsi', e.target.value)} className="input-field" /></div>

            {['SHM', 'SHGB', 'AJB'].includes(a.jenisAgunan) && (
              <>
                <div><label className="label">Luas Tanah (m²)</label><input type="number" value={a.luasTanah} onChange={e => updateAgunan(i, 'luasTanah', parseFloat(e.target.value)||0)} className="input-field text-right" /></div>
                <div><label className="label">Luas Bangunan (m²)</label><input type="number" value={a.luasBangunan} onChange={e => updateAgunan(i, 'luasBangunan', parseFloat(e.target.value)||0)} className="input-field text-right" /></div>
              </>
            )}

            <hr className="md:col-span-2 border-navy-border" />
            <h4 className="md:col-span-2 text-sm font-semibold text-gold">💰 Penilaian</h4>

            <div><label className="label">Nilai Pasar (Rp)</label><input type="number" value={a.nilaiPasar} onChange={e => updateAgunan(i, 'nilaiPasar', parseFloat(e.target.value)||0)} className="input-field text-right" /></div>
            <div><label className="label">Nilai NJOP (Rp)</label><input type="number" value={a.nilaiNjop} onChange={e => updateAgunan(i, 'nilaiNjop', parseFloat(e.target.value)||0)} className="input-field text-right" /></div>
            <div><label className="label">Nilai Taksasi (Rp)</label><input type="number" value={a.nilaiTaksasi} onChange={e => updateAgunan(i, 'nilaiTaksasi', parseFloat(e.target.value)||0)} className="input-field text-right" /></div>
            <div>
              <label className="label">Nilai Likuidasi (Rp) — auto 60%</label>
              <div className="input-field bg-navy/50 text-emerald-400 font-semibold text-right cursor-not-allowed">{formatRupiah(a.nilaiLikuidasi)}</div>
            </div>

            <hr className="md:col-span-2 border-navy-border" />
            <div className="md:col-span-2"><label className="label">Alamat Agunan</label><textarea value={a.alamatAgunan} onChange={e => updateAgunan(i, 'alamatAgunan', e.target.value)} className="input-field" rows={2} /></div>
            <div><label className="label">Kecamatan</label><input type="text" value={a.kecamatan} onChange={e => updateAgunan(i, 'kecamatan', e.target.value)} className="input-field" /></div>
            <div className="flex items-end gap-2">
              <div className="flex-1"><label className="label">GPS</label><input type="text" readOnly value={a.latitude ? `${a.latitude}, ${a.longitude}` : ''} className="input-field" placeholder="Belum ada" /></div>
              <button onClick={() => getLocation(i)} className="btn-secondary shrink-0 mb-0"><MapPin className="w-4 h-4" /></button>
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
