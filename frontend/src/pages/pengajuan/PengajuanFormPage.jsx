import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save, Loader2, ArrowLeft, Search, UserCheck } from 'lucide-react';
import { pengajuanService, debiturService } from '../../services';
import { JENIS_KREDIT } from '../../utils/constants';
import { formatRupiah } from '../../utils/formatters';

export default function PengajuanFormPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preDebiturId = params.get('debiturId') || '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debitur search
  const [debiturSearch, setDebiturSearch] = useState('');
  const [debiturList, setDebiturList] = useState([]);
  const [selectedDebitur, setSelectedDebitur] = useState(null);
  const [showDebiturDropdown, setShowDebiturDropdown] = useState(false);

  const [form, setForm] = useState({
    jenisKredit: 'KONSUMTIF',
    tujuanKredit: '',
    plafonDiajukan: 0,
    jangkaWaktuBulan: 12,
    sukuBunga: 18,
    angsuranPerbulan: 0,
  });

  // Pre-load debitur if passed via query
  useEffect(() => {
    if (preDebiturId) {
      debiturService.getById(preDebiturId).then(res => {
        setSelectedDebitur(res.data.data);
      }).catch(() => {});
    }
  }, [preDebiturId]);

  // Search debitur
  useEffect(() => {
    if (debiturSearch.length >= 2) {
      debiturService.getAll({ search: debiturSearch, limit: 5 })
        .then(res => { setDebiturList(res.data.data); setShowDebiturDropdown(true); });
    } else {
      setDebiturList([]);
      setShowDebiturDropdown(false);
    }
  }, [debiturSearch]);

  // Auto-calc angsuran (flat)
  useEffect(() => {
    const { plafonDiajukan, sukuBunga, jangkaWaktuBulan } = form;
    if (plafonDiajukan > 0 && jangkaWaktuBulan > 0) {
      const bungaBulan = sukuBunga / 12 / 100;
      const pokok = plafonDiajukan / jangkaWaktuBulan;
      const bunga = plafonDiajukan * bungaBulan;
      setForm(prev => ({ ...prev, angsuranPerbulan: Math.round(pokok + bunga) }));
    }
  }, [form.plafonDiajukan, form.sukuBunga, form.jangkaWaktuBulan]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!selectedDebitur) return setError('Pilih debitur terlebih dahulu.');
    if (form.plafonDiajukan <= 0) return setError('Plafon harus lebih dari 0.');
    setLoading(true);
    setError('');
    try {
      await pengajuanService.create({ ...form, debiturId: selectedDebitur.id });
      navigate('/pengajuan');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat pengajuan.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/pengajuan')} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold">Buat Pengajuan Kredit</h1>
          <p className="text-sm text-slate-400">Formulir pengajuan kredit baru</p>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400 animate-fade-in">{error}</div>}

      {/* Debitur Selection */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gold mb-4">👤 Pilih Debitur</h3>
        {selectedDebitur ? (
          <div className="bg-navy-lighter/50 rounded-lg p-4 border border-gold/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-navy" />
              </div>
              <div>
                <p className="font-medium">{selectedDebitur.nama}</p>
                <p className="text-xs text-slate-400">{selectedDebitur.no_hp} • {selectedDebitur.kecamatan}, {selectedDebitur.kabupaten}</p>
              </div>
            </div>
            <button onClick={() => { setSelectedDebitur(null); setDebiturSearch(''); }} className="btn-ghost text-xs text-red-400">Ganti</button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={debiturSearch}
              onChange={e => setDebiturSearch(e.target.value)}
              placeholder="Ketik nama debitur untuk mencari..."
              className="input-field pl-10"
              autoFocus
            />
            {showDebiturDropdown && debiturList.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-navy-light border border-navy-border rounded-xl shadow-xl max-h-60 overflow-auto">
                {debiturList.map(d => (
                  <button key={d.id} onClick={() => { setSelectedDebitur(d); setShowDebiturDropdown(false); setDebiturSearch(''); }}
                    className="w-full text-left px-4 py-3 hover:bg-navy-lighter transition-colors border-b border-navy-border last:border-0">
                    <p className="text-sm font-medium">{d.nama}</p>
                    <p className="text-xs text-slate-500">{d.no_hp} • {d.kecamatan}</p>
                  </button>
                ))}
              </div>
            )}
            {showDebiturDropdown && debiturList.length === 0 && debiturSearch.length >= 2 && (
              <div className="absolute z-20 w-full mt-1 bg-navy-light border border-navy-border rounded-xl p-4 text-center text-sm text-slate-500">
                Debitur tidak ditemukan
              </div>
            )}
          </div>
        )}
      </div>

      {/* Kredit Form */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gold mb-4">💳 Detail Kredit</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Jenis Kredit</label>
            <select value={form.jenisKredit} onChange={e => update('jenisKredit', e.target.value)} className="input-field">
              {JENIS_KREDIT.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tujuan Kredit</label>
            <input type="text" value={form.tujuanKredit} onChange={e => update('tujuanKredit', e.target.value)} className="input-field" placeholder="Renovasi rumah, Modal usaha, dll" />
          </div>
          <div>
            <label className="label">Plafon Diajukan (Rp)</label>
            <input type="number" value={form.plafonDiajukan} onChange={e => update('plafonDiajukan', parseFloat(e.target.value) || 0)} className="input-field text-right" />
          </div>
          <div>
            <label className="label">Jangka Waktu (bulan)</label>
            <select value={form.jangkaWaktuBulan} onChange={e => update('jangkaWaktuBulan', parseInt(e.target.value))} className="input-field">
              {[6,12,18,24,36,48,60].map(m => <option key={m} value={m}>{m} bulan ({(m/12).toFixed(1)} tahun)</option>)}
            </select>
          </div>
          <div>
            <label className="label">Suku Bunga (% / tahun)</label>
            <input type="number" step="0.5" value={form.sukuBunga} onChange={e => update('sukuBunga', parseFloat(e.target.value) || 0)} className="input-field text-right" />
          </div>
          <div>
            <label className="label">Angsuran per Bulan (auto)</label>
            <div className="input-field bg-navy/50 text-gold font-semibold text-right cursor-not-allowed">{formatRupiah(form.angsuranPerbulan)}</div>
          </div>
        </div>
      </div>

      {/* Summary */}
      {form.plafonDiajukan > 0 && (
        <div className="card bg-gradient-to-r from-navy-light to-navy-lighter/50 border-gold/20">
          <h3 className="text-sm font-semibold text-gold mb-3">📋 Ringkasan Pengajuan</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-xs text-slate-500">Plafon</p><p className="font-bold text-gold">{formatRupiah(form.plafonDiajukan)}</p></div>
            <div><p className="text-xs text-slate-500">Tenor</p><p className="font-bold">{form.jangkaWaktuBulan} bulan</p></div>
            <div><p className="text-xs text-slate-500">Bunga</p><p className="font-bold">{form.sukuBunga}% / th</p></div>
            <div><p className="text-xs text-slate-500">Angsuran</p><p className="font-bold text-gold">{formatRupiah(form.angsuranPerbulan)}</p></div>
          </div>
          <p className="text-xs text-slate-500 mt-3">Total pembayaran: {formatRupiah(form.angsuranPerbulan * form.jangkaWaktuBulan)} • Total bunga: {formatRupiah(form.angsuranPerbulan * form.jangkaWaktuBulan - form.plafonDiajukan)}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button onClick={() => navigate('/pengajuan')} className="btn-secondary">Batal</button>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? 'Memproses...' : 'Ajukan Kredit'}
        </button>
      </div>
    </div>
  );
}
