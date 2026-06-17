import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Shield } from 'lucide-react';
import { slikService } from '../../services';
import { formatRupiah } from '../../utils/formatters';

export default function SlikFormPage() {
  const [params] = useSearchParams();
  const pengajuanId = params.get('pengajuanId') || '';
  const debiturId = params.get('debiturId') || '';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    tanggalSlik: new Date().toISOString().split('T')[0],
    kolektibilitasTertinggi: 1,
    totalFasilitas: 0,
    totalPlafon: 0,
    totalBakiDebet: 0,
    catatan: '',
  });

  const [detailSlik, setDetailSlik] = useState([]);

  const addDetail = () => {
    setDetailSlik([...detailSlik, { bank: '', jenisFasilitas: '', plafon: 0, bakiDebet: 0, kolektibilitas: 1, jatuhTempo: '' }]);
  };

  const updateDetail = (index, field, value) => {
    const updated = [...detailSlik];
    updated[index] = { ...updated[index], [field]: value };
    setDetailSlik(updated);

    // Auto-recalculate totals
    const totalFasilitas = updated.length;
    const totalPlafon = updated.reduce((s, d) => s + (parseFloat(d.plafon) || 0), 0);
    const totalBakiDebet = updated.reduce((s, d) => s + (parseFloat(d.bakiDebet) || 0), 0);
    const kolektibilitasTertinggi = Math.max(1, ...updated.map(d => parseInt(d.kolektibilitas) || 1));
    setForm(prev => ({ ...prev, totalFasilitas, totalPlafon, totalBakiDebet, kolektibilitasTertinggi }));
  };

  const removeDetail = (index) => {
    const updated = detailSlik.filter((_, i) => i !== index);
    setDetailSlik(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await slikService.create({ ...form, pengajuanId, debiturId, detailSlik });
      navigate(`/pengajuan/${pengajuanId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data SLIK.');
    }
    setLoading(false);
  };

  const kolColors = ['', 'text-emerald-400', 'text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400'];
  const kolLabels = ['', '1 - Lancar', '2 - Dalam Perhatian Khusus', '3 - Kurang Lancar', '4 - Diragukan', '5 - Macet'];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-gold" /> Input Data SLIK</h1>
          <p className="text-sm text-slate-400">Input manual data hasil pengecekan SLIK</p>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-xs text-slate-500">Kolektibilitas Tertinggi</p>
          <p className={`text-3xl font-bold mt-1 ${kolColors[form.kolektibilitasTertinggi]}`}>{form.kolektibilitasTertinggi}</p>
          <p className="text-[10px] text-slate-500 mt-1">{kolLabels[form.kolektibilitasTertinggi]}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-500">Total Fasilitas</p>
          <p className="text-3xl font-bold mt-1">{form.totalFasilitas}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-500">Total Plafon</p>
          <p className="text-xl font-bold mt-1 text-gold">{formatRupiah(form.totalPlafon)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-500">Total Baki Debet</p>
          <p className="text-xl font-bold mt-1">{formatRupiah(form.totalBakiDebet)}</p>
        </div>
      </div>

      {/* Detail */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gold">Detail Fasilitas Kredit</h3>
          <button onClick={addDetail} className="btn-secondary text-sm">+ Tambah Fasilitas</button>
        </div>

        {detailSlik.length === 0 ? (
          <p className="text-center text-slate-500 py-8">Belum ada data fasilitas. Klik "Tambah Fasilitas" jika debitur memiliki pinjaman di bank lain.</p>
        ) : (
          <div className="space-y-4">
            {detailSlik.map((d, i) => (
              <div key={i} className="bg-navy-lighter/50 rounded-lg p-4 border border-navy-border animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Fasilitas #{i + 1}</span>
                  <button onClick={() => removeDetail(i)} className="text-xs text-red-400 hover:text-red-300">Hapus</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div><label className="label text-xs">Nama Bank</label><input type="text" value={d.bank} onChange={e => updateDetail(i, 'bank', e.target.value)} className="input-field text-sm" placeholder="BRI, BCA, dll" /></div>
                  <div><label className="label text-xs">Jenis Fasilitas</label><input type="text" value={d.jenisFasilitas} onChange={e => updateDetail(i, 'jenisFasilitas', e.target.value)} className="input-field text-sm" placeholder="KPR, KMK, dll" /></div>
                  <div><label className="label text-xs">Kolektibilitas</label>
                    <select value={d.kolektibilitas} onChange={e => updateDetail(i, 'kolektibilitas', parseInt(e.target.value))} className="input-field text-sm">
                      {[1,2,3,4,5].map(k => <option key={k} value={k}>{kolLabels[k]}</option>)}
                    </select>
                  </div>
                  <div><label className="label text-xs">Plafon</label><input type="number" value={d.plafon} onChange={e => updateDetail(i, 'plafon', parseFloat(e.target.value)||0)} className="input-field text-sm text-right" /></div>
                  <div><label className="label text-xs">Baki Debet</label><input type="number" value={d.bakiDebet} onChange={e => updateDetail(i, 'bakiDebet', parseFloat(e.target.value)||0)} className="input-field text-sm text-right" /></div>
                  <div><label className="label text-xs">Jatuh Tempo</label><input type="date" value={d.jatuhTempo} onChange={e => updateDetail(i, 'jatuhTempo', e.target.value)} className="input-field text-sm" /></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Catatan */}
      <div className="card">
        <label className="label">Tanggal SLIK</label>
        <input type="date" value={form.tanggalSlik} onChange={e => setForm({...form, tanggalSlik: e.target.value})} className="input-field max-w-xs mb-4" />
        <label className="label">Catatan</label>
        <textarea value={form.catatan} onChange={e => setForm({...form, catatan: e.target.value})} className="input-field" rows={3} placeholder="Catatan hasil pengecekan SLIK..." />
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary">Batal</button>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Data SLIK
        </button>
      </div>
    </div>
  );
}
