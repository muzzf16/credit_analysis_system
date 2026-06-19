import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Shield, Search } from 'lucide-react';
import { slikService, ocrService, pengajuanService } from '../../services';
import { formatRupiah } from '../../utils/formatters';

export default function SlikFormPage() {
  const [params] = useSearchParams();
  const initialPengajuanId = params.get('pengajuanId') || '';
  const initialDebiturId = params.get('debiturId') || '';
  
  const [pengajuanId, setPengajuanId] = useState(initialPengajuanId);
  const [debiturId, setDebiturId] = useState(initialDebiturId);
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search parameters for fallback selection when accessed from Sidebar directly
  const [searchQuery, setSearchQuery] = useState('');
  const [activePengajuans, setActivePengajuans] = useState([]);
  const [selectedPengajuan, setSelectedPengajuan] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (initialPengajuanId) {
      pengajuanService.getById(initialPengajuanId)
        .then(res => {
          setSelectedPengajuan(res.data.data);
          setDebiturId(res.data.data.debitur_id);
        })
        .catch(() => {});
    }
  }, [initialPengajuanId]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      pengajuanService.getAll({ search: searchQuery, limit: 5 })
        .then(res => {
          setActivePengajuans(res.data.data);
          setShowDropdown(true);
        })
        .catch(() => {});
    } else {
      setActivePengajuans([]);
      setShowDropdown(false);
    }
  }, [searchQuery]);

  const selectPengajuan = (p) => {
    setSelectedPengajuan(p);
    setPengajuanId(p.id);
    setDebiturId(p.debitur_id);
    setShowDropdown(false);
    setSearchQuery('');
  };

  const [form, setForm] = useState({
    tanggalSlik: new Date().toISOString().split('T')[0],
    kolektibilitasTertinggi: 1,
    totalFasilitas: 0,
    totalPlafon: 0,
    totalBakiDebet: 0,
    catatan: '',
  });

  const [detailSlik, setDetailSlik] = useState([]);

  const handleOcrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'slik');

    try {
      const res = await ocrService.process(formData);
      const parsed = res.data.data?.data || {};
      
      if (parsed.detailSlik && parsed.detailSlik.length > 0) {
        setDetailSlik(parsed.detailSlik);
        setForm(prev => ({
          ...prev,
          tanggalSlik: parsed.tanggalSlik || prev.tanggalSlik,
          totalFasilitas: parsed.totalFasilitas || 0,
          totalPlafon: parsed.totalPlafon || 0,
          totalBakiDebet: parsed.totalBakiDebet || 0,
          kolektibilitasTertinggi: parsed.kolektibilitasTertinggi || 1,
        }));
        alert(`Berhasil mendeteksi ${parsed.detailSlik.length} fasilitas kredit dari dokumen SLIK.`);
      } else {
        alert('OCR berhasil diproses, namun tidak menemukan fasilitas kredit aktif.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal memproses OCR SLIK. Pastikan format file sesuai.');
    } finally {
      setOcrLoading(false);
      e.target.value = '';
    }
  };

  const addDetail = () => {
    setDetailSlik([...detailSlik, { bank: '', jenisFasilitas: '', plafon: 0, bakiDebet: 0, kolektibilitas: 1, jatuhTempo: '', tanggalMulai: '', sukuBunga: 0 }]);
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
    if (!pengajuanId || !debiturId) {
      setError('Pilih pengajuan kredit terlebih dahulu sebelum menyimpan data SLIK.');
      return;
    }
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

      {/* Pengajuan Selector */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gold mb-4">Pilih Pengajuan Kredit</h3>
        {selectedPengajuan ? (
          <div className="bg-navy-lighter/50 rounded-lg p-4 border border-gold/30 flex items-center justify-between">
            <div>
              <p className="font-medium text-white">{selectedPengajuan.nomor_pengajuan}</p>
              <p className="text-xs text-slate-400">
                Debitur: {selectedPengajuan.debitur_nama} • Plafon: {formatRupiah(selectedPengajuan.plafon_diajukan)} • {selectedPengajuan.jenis_kredit}
              </p>
            </div>
            {!initialPengajuanId && (
              <button onClick={() => { setSelectedPengajuan(null); setPengajuanId(''); setDebiturId(''); }} className="btn-ghost text-xs text-red-400">Ganti</button>
            )}
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari no. pengajuan atau nama debitur..."
              className="input-field pl-10"
            />
            {showDropdown && activePengajuans.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-navy-light border border-navy-border rounded-xl shadow-xl max-h-60 overflow-auto">
                {activePengajuans.map(p => (
                  <button key={p.id} onClick={() => selectPengajuan(p)}
                    className="w-full text-left px-4 py-3 hover:bg-navy-lighter transition-colors border-b border-navy-border last:border-0">
                    <p className="text-sm font-medium text-white">{p.nomor_pengajuan}</p>
                    <p className="text-xs text-slate-500">Debitur: {p.debitur_nama} • Plafon: {formatRupiah(p.plafon_diajukan)}</p>
                  </button>
                ))}
              </div>
            )}
            {showDropdown && activePengajuans.length === 0 && searchQuery.length >= 2 && (
              <div className="absolute z-20 w-full mt-1 bg-navy-light border border-navy-border rounded-xl p-4 text-center text-sm text-slate-500">
                Pengajuan tidak ditemukan
              </div>
            )}
          </div>
        )}
      </div>

      {/* OCR File Upload */}
      <div className="card border-dashed border-2 border-gold/40 hover:border-gold/85 transition-all bg-navy-light/20">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Shield className="w-10 h-10 text-gold mb-3 animate-pulse" />
          <h3 className="text-base font-semibold text-white">Unggah Dokumen SLIK (iDeb OJK)</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            Unggah file PDF hasil download iDeb OJK atau scan foto dokumen SLIK untuk membaca data secara otomatis.
          </p>
          <input
            type="file"
            accept=".pdf,image/*"
            id="slik-file-upload"
            className="hidden"
            onChange={handleOcrUpload}
          />
          <button
            onClick={() => document.getElementById('slik-file-upload').click()}
            disabled={ocrLoading}
            className="btn-primary text-xs mt-5 px-6"
          >
            {ocrLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-navy" /> Memproses Dokumen SLIK...
              </span>
            ) : (
              'Unggah & Parse Dokumen SLIK'
            )}
          </button>
        </div>
      </div>

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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div><label className="label text-xs">Nama Bank</label><input type="text" value={d.bank} onChange={e => updateDetail(i, 'bank', e.target.value)} className="input-field text-sm" placeholder="BRI, BCA, dll" /></div>
                  <div><label className="label text-xs">Jenis Fasilitas</label><input type="text" value={d.jenisFasilitas} onChange={e => updateDetail(i, 'jenisFasilitas', e.target.value)} className="input-field text-sm" placeholder="KPR, KMK, dll" /></div>
                  <div><label className="label text-xs">Kolektibilitas</label>
                    <select value={d.kolektibilitas} onChange={e => updateDetail(i, 'kolektibilitas', parseInt(e.target.value))} className="input-field text-sm">
                      {[1,2,3,4,5].map(k => <option key={k} value={k}>{kolLabels[k]}</option>)}
                    </select>
                  </div>
                  <div><label className="label text-xs">Suku Bunga (%)</label><input type="number" step="0.01" value={d.sukuBunga || 0} onChange={e => updateDetail(i, 'sukuBunga', parseFloat(e.target.value)||0)} className="input-field text-sm text-right" /></div>
                  <div><label className="label text-xs">Plafon</label><input type="number" value={d.plafon} onChange={e => updateDetail(i, 'plafon', parseFloat(e.target.value)||0)} className="input-field text-sm text-right" /></div>
                  <div><label className="label text-xs">Baki Debet</label><input type="number" value={d.bakiDebet} onChange={e => updateDetail(i, 'bakiDebet', parseFloat(e.target.value)||0)} className="input-field text-sm text-right" /></div>
                  <div><label className="label text-xs">Tanggal Mulai</label><input type="date" value={d.tanggalMulai || ''} onChange={e => updateDetail(i, 'tanggalMulai', e.target.value)} className="input-field text-sm" /></div>
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
