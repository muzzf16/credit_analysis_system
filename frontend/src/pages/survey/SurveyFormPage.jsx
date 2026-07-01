import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, MapPin, Home, Briefcase, Camera, Calculator } from 'lucide-react';
import { surveyService } from '../../services';

export default function SurveyFormPage() {
  const [params] = useSearchParams();
  const pengajuanId = params.get('pengajuanId') || '';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const [form, setForm] = useState({
    tanggalSurvey: new Date().toISOString().split('T')[0],
    kesimpulan: '',
    rekomendasi: '',
  });

  const [lingkungan, setLingkungan] = useState({
    karakterDebitur: 3, karakterKeterangan: '',
    hubunganSosial: 3, hubunganKeterangan: '',
    statusKepemilikanRumah: 'MILIK', kondisiRumah: 'BAIK',
    latitude: '', longitude: '', alamatSurvey: '',
  });

  const [usaha, setUsaha] = useState({
    jenisUsaha: '', lamaUsahaTahun: 0, jamOperasional: '',
    jumlahKaryawan: 0, omsetHarian: 0, omsetBulanan: 0,
    hppBulanan: 0, biayaOperasional: 0, labaBersihBulanan: 0,
    supplier: '', pelangganUtama: '', kompetitor: '',
    latitude: '', longitude: '',
  });

  // Auto-calc laba
  const autoCalcLaba = () => {
    const laba = usaha.omsetBulanan - usaha.hppBulanan - usaha.biayaOperasional;
    setUsaha(prev => ({ ...prev, labaBersihBulanan: laba }));
  };

  // Get GPS location
  const getLocation = (target) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const setter = target === 'lingkungan' ? setLingkungan : setUsaha;
        setter(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
      }, () => alert('Tidak dapat mengakses GPS'));
    }
  };

  const handleSubmit = async () => {
    if (!pengajuanId) return setError('pengajuanId tidak tersedia');
    setLoading(true);
    setError('');
    try {
      await surveyService.create({
        pengajuanId, ...form,
        lingkungan,
        usaha: (usaha.jenisUsaha || usaha.omsetHarian || usaha.omsetBulanan) ? usaha : undefined,
      });
      navigate(`/pengajuan/${pengajuanId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan survey.');
    }
    setLoading(false);
  };

  const TABS = [
    { label: 'Lingkungan', icon: Home },
    { label: 'Usaha', icon: Briefcase },
    { label: 'Kesimpulan', icon: Save },
  ];

  const ScoreInput = ({ label, value, onChange, keterangan, onKeteranganChange }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm text-slate-400">{label}</label>
        <span className="text-sm font-bold text-gold">{value}/5</span>
      </div>
      <input type="range" min="1" max="5" value={value} onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-navy-lighter rounded-lg appearance-none cursor-pointer accent-gold" />
      <div className="flex justify-between text-[10px] text-slate-600">
        <span>Buruk</span><span>Kurang</span><span>Cukup</span><span>Baik</span><span>Sangat Baik</span>
      </div>
      {onKeteranganChange && (
        <textarea value={keterangan} onChange={e => onKeteranganChange(e.target.value)}
          className="input-field text-sm mt-2" rows={2} placeholder="Keterangan..." />
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><MapPin className="w-6 h-6 text-gold" /> Survey Lapangan</h1>
          <p className="text-sm text-slate-400">Input hasil survey AO</p>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-1 bg-navy-lighter/50 p-1 rounded-xl">
        {TABS.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === i ? 'bg-navy-light text-gold shadow' : 'text-slate-400 hover:text-white'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="card animate-fade-in">
        {/* Lingkungan Tab */}
        {activeTab === 0 && (
          <div className="space-y-6">
            <div>
              <label className="label">Tanggal Survey</label>
              <input type="date" value={form.tanggalSurvey} onChange={e => setForm({...form, tanggalSurvey: e.target.value})} className="input-field max-w-xs" />
            </div>

            <ScoreInput label="Karakter Debitur" value={lingkungan.karakterDebitur}
              onChange={v => setLingkungan({...lingkungan, karakterDebitur: v})}
              keterangan={lingkungan.karakterKeterangan}
              onKeteranganChange={v => setLingkungan({...lingkungan, karakterKeterangan: v})} />

            <ScoreInput label="Hubungan Sosial" value={lingkungan.hubunganSosial}
              onChange={v => setLingkungan({...lingkungan, hubunganSosial: v})}
              keterangan={lingkungan.hubunganKeterangan}
              onKeteranganChange={v => setLingkungan({...lingkungan, hubunganKeterangan: v})} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Status Kepemilikan Rumah</label>
                <select value={lingkungan.statusKepemilikanRumah} onChange={e => setLingkungan({...lingkungan, statusKepemilikanRumah: e.target.value})} className="input-field">
                  {['MILIK', 'SEWA', 'KELUARGA', 'DINAS', 'LAINNYA'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Kondisi Rumah</label>
                <select value={lingkungan.kondisiRumah} onChange={e => setLingkungan({...lingkungan, kondisiRumah: e.target.value})} className="input-field">
                  {['BAIK', 'SEDANG', 'KURANG'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* GPS */}
            <div>
              <label className="label">Koordinat GPS</label>
              <div className="flex gap-3 items-center">
                <input type="text" value={lingkungan.latitude} onChange={e => setLingkungan({...lingkungan, latitude: e.target.value})} className="input-field" placeholder="Latitude" />
                <input type="text" value={lingkungan.longitude} onChange={e => setLingkungan({...lingkungan, longitude: e.target.value})} className="input-field" placeholder="Longitude" />
                <button onClick={() => getLocation('lingkungan')} className="btn-secondary shrink-0"><MapPin className="w-4 h-4" /> GPS</button>
              </div>
            </div>

            <div>
              <label className="label">Alamat Survey</label>
              <textarea value={lingkungan.alamatSurvey} onChange={e => setLingkungan({...lingkungan, alamatSurvey: e.target.value})} className="input-field" rows={2} />
            </div>
          </div>
        )}

        {/* Usaha Tab */}
        {activeTab === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="label">Jenis Usaha</label><input type="text" value={usaha.jenisUsaha} onChange={e => setUsaha({...usaha, jenisUsaha: e.target.value})} className="input-field" /></div>
              <div><label className="label">Lama Usaha (tahun)</label><input type="number" value={usaha.lamaUsahaTahun} onChange={e => setUsaha({...usaha, lamaUsahaTahun: parseInt(e.target.value)||0})} className="input-field" /></div>
              <div><label className="label">Jam Operasional</label><input type="text" value={usaha.jamOperasional} onChange={e => setUsaha({...usaha, jamOperasional: e.target.value})} className="input-field" placeholder="08:00 - 17:00" /></div>
              <div><label className="label">Jumlah Karyawan</label><input type="number" value={usaha.jumlahKaryawan} onChange={e => setUsaha({...usaha, jumlahKaryawan: parseInt(e.target.value)||0})} className="input-field" /></div>
            </div>

            <hr className="border-navy-border" />
            <h4 className="text-sm font-semibold text-gold">💰 Keuangan Usaha</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="label">Omset Harian</label><input type="number" value={usaha.omsetHarian} onChange={e => setUsaha({...usaha, omsetHarian: parseFloat(e.target.value)||0})} className="input-field text-right" /></div>
              <div><label className="label">Omset Bulanan</label><input type="number" value={usaha.omsetBulanan} onChange={e => setUsaha({...usaha, omsetBulanan: parseFloat(e.target.value)||0})} className="input-field text-right" /></div>
              <div><label className="label">HPP Bulanan</label><input type="number" value={usaha.hppBulanan} onChange={e => setUsaha({...usaha, hppBulanan: parseFloat(e.target.value)||0})} className="input-field text-right" /></div>
              <div><label className="label">Biaya Operasional</label><input type="number" value={usaha.biayaOperasional} onChange={e => setUsaha({...usaha, biayaOperasional: parseFloat(e.target.value)||0})} className="input-field text-right" /></div>
            </div>
            <button onClick={autoCalcLaba} className="btn-secondary text-sm"><Calculator className="w-4 h-4" /> Hitung Laba</button>
            <div className="bg-navy-lighter/50 rounded-lg p-4">
              <p className="text-xs text-slate-500">Laba Bersih Bulanan</p>
              <p className="text-xl font-bold text-gold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(usaha.labaBersihBulanan)}</p>
            </div>

            <hr className="border-navy-border" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="label">Supplier</label><textarea value={usaha.supplier} onChange={e => setUsaha({...usaha, supplier: e.target.value})} className="input-field" rows={2} /></div>
              <div><label className="label">Pelanggan Utama</label><textarea value={usaha.pelangganUtama} onChange={e => setUsaha({...usaha, pelangganUtama: e.target.value})} className="input-field" rows={2} /></div>
              <div><label className="label">Kompetitor</label><textarea value={usaha.kompetitor} onChange={e => setUsaha({...usaha, kompetitor: e.target.value})} className="input-field" rows={2} /></div>
            </div>

            <div className="flex gap-3 items-center">
              <input type="text" value={usaha.latitude} readOnly className="input-field" placeholder="Latitude" />
              <input type="text" value={usaha.longitude} readOnly className="input-field" placeholder="Longitude" />
              <button onClick={() => getLocation('usaha')} className="btn-secondary shrink-0"><MapPin className="w-4 h-4" /> GPS</button>
            </div>
          </div>
        )}

        {/* Kesimpulan Tab */}
        {activeTab === 2 && (
          <div className="space-y-4">
            <div>
              <label className="label">Kesimpulan Survey</label>
              <textarea value={form.kesimpulan} onChange={e => setForm({...form, kesimpulan: e.target.value})} className="input-field" rows={4} placeholder="Kesimpulan dari hasil survey lapangan..." />
            </div>
            <div>
              <label className="label">Rekomendasi AO</label>
              <textarea value={form.rekomendasi} onChange={e => setForm({...form, rekomendasi: e.target.value})} className="input-field" rows={4} placeholder="Rekomendasi AO berdasarkan survey..." />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary">Batal</button>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? 'Menyimpan...' : 'Simpan Survey'}
        </button>
      </div>
    </div>
  );
}

