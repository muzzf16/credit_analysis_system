import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BarChart3, Save, Loader2, ArrowLeft, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { analisaService, slikService, pengajuanService } from '../../services';
import { formatRupiah, formatPercent } from '../../utils/formatters';

export default function AnalisaProduktifPage() {
  const [params] = useSearchParams();
  const pengajuanId = params.get('pengajuanId') || '';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    omsetBulan1: 0, omsetBulan2: 0, omsetBulan3: 0,
    hppBulan1: 0, hppBulan2: 0, hppBulan3: 0,
    biayaOpBulan1: 0, biayaOpBulan2: 0, biayaOpBulan3: 0,
    angsuranPerBulan: 0, pengurangAngsuran: 0,
  });

  useEffect(() => {
    if (!pengajuanId) return;

    const loadData = async () => {
      setLoadingData(true);
      try {
        let slikInstallment = 0;
        let angsuranDariPengajuan = 0;

        // 1. Fetch Credit Application details
        try {
          const pRes = await pengajuanService.getById(pengajuanId);
          if (pRes.data?.data?.angsuran_perbulan) {
            angsuranDariPengajuan = Number(pRes.data.data.angsuran_perbulan);
          }
        } catch (e) {
          console.error("Failed to load pengajuan", e);
        }

        // 2. Fetch SLIK details
        try {
          const slikRes = await slikService.getByPengajuanId(pengajuanId);
          const slikData = slikRes.data?.data;
          if (slikData && slikData.detail_slik) {
            slikData.detail_slik.forEach(f => {
              let tenorBulan = 0;
              if (f.tanggalMulai && f.jatuhTempo) {
                const start = new Date(f.tanggalMulai);
                const end = new Date(f.jatuhTempo);
                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                  tenorBulan = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                }
              }
              const plafon = Number(f.plafon || 0);
              const rateTahunan = Number(f.sukuBunga || 0);
              if (plafon > 0 && rateTahunan > 0 && tenorBulan > 0) {
                const rateBulanan = (rateTahunan / 100) / 12;
                const angsuran = (plafon * rateBulanan * Math.pow(1 + rateBulanan, tenorBulan)) / (Math.pow(1 + rateBulanan, tenorBulan) - 1);
                if (!isNaN(angsuran) && isFinite(angsuran)) {
                  slikInstallment += angsuran;
                }
              }
            });
          }
        } catch (err) {
          console.error("Failed to load SLIK:", err);
        }

        // 3. Fetch existing saved Produktif analysis
        try {
          const res = await analisaService.getProduktif(pengajuanId);
          if (res.data?.data) {
            const data = res.data.data;
            setForm({
              omsetBulan1: Number(data.omset_bulan1 || 0),
              omsetBulan2: Number(data.omset_bulan2 || 0),
              omsetBulan3: Number(data.omset_bulan3 || 0),
              hppBulan1: Number(data.hpp_bulan1 || 0),
              hppBulan2: Number(data.hpp_bulan2 || 0),
              hppBulan3: Number(data.hpp_bulan3 || 0),
              biayaOpBulan1: Number(data.biaya_op_bulan1 || 0),
              biayaOpBulan2: Number(data.biaya_op_bulan2 || 0),
              biayaOpBulan3: Number(data.biaya_op_bulan3 || 0),
              pengurangAngsuran: Number(data.pengurang_angsuran || Math.round(slikInstallment) || 0),
              angsuranPerBulan: angsuranDariPengajuan || 0,
            });
          } else {
            // No analysis yet, set defaults
            setForm(prev => ({
              ...prev,
              pengurangAngsuran: Math.round(slikInstallment),
              angsuranPerBulan: angsuranDariPengajuan,
            }));
          }
        } catch (err) {
          // If analysis service fails or returns 404, set defaults
          setForm(prev => ({
            ...prev,
            pengurangAngsuran: Math.round(slikInstallment),
            angsuranPerBulan: angsuranDariPengajuan,
          }));
        }
      } catch (err) {
        console.error("Error loading page data:", err);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [pengajuanId]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));

  const calc = useMemo(() => {
    const rataOmset = (form.omsetBulan1 + form.omsetBulan2 + form.omsetBulan3) / 3;
    const rataHpp = (form.hppBulan1 + form.hppBulan2 + form.hppBulan3) / 3;
    const rataBiayaOp = (form.biayaOpBulan1 + form.biayaOpBulan2 + form.biayaOpBulan3) / 3;
    const labaKotor = rataOmset - rataHpp;
    const labaBersih = labaKotor - rataBiayaOp;
    const gpm = rataOmset > 0 ? (labaKotor / rataOmset) * 100 : 0;
    const npm = rataOmset > 0 ? (labaBersih / rataOmset) * 100 : 0;
    const dscr = form.angsuranPerBulan > 0 ? labaBersih / form.angsuranPerBulan : 0;
    const bep = rataOmset > 0 ? rataBiayaOp / (1 - rataHpp / rataOmset) : 0;

    const stressTest = [10, 20, 30].map(p => {
      const omset = rataOmset * (1 - p / 100);
      const laba = omset - rataHpp - rataBiayaOp;
      const d = form.angsuranPerBulan > 0 ? laba / form.angsuranPerBulan : 0;
      return { persen: p, omset, laba, dscr: d, layak: d >= 1.2 };
    });

    return { rataOmset, rataHpp, rataBiayaOp, labaKotor, labaBersih, gpm, npm, dscr, bep, stressTest, layak: dscr >= 1.2 && labaBersih > 0 };
  }, [form]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await analisaService.saveProduktif({ ...form, pengajuanId });
      setSaved(true);
    } catch (err) { alert(err.response?.data?.message || 'Gagal menyimpan'); }
    setLoading(false);
  };

  const ri = (label, field) => {
    const displayValue = form[field] ? form[field].toLocaleString('id-ID') : '';
    const handleChange = (e) => {
      const rawValue = e.target.value.replace(/\D/g, '');
      update(field, rawValue);
    };
    return (
      <div>
        <label className="label text-xs">{label}</label>
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">Rp</span>
          <input type="text" value={displayValue} onChange={handleChange} className="input-field text-right text-sm pl-7" />
        </div>
      </div>
    );
  };

  if (loadingData) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-gold" /> Analisa Produktif</h1>
          <p className="text-sm text-slate-400">Kalkulasi kelayakan kredit produktif</p>
        </div>
      </div>

      {!pengajuanId && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400 font-medium">Pengajuan ID tidak ditemukan! Silakan buka menu <strong>Pengajuan Kredit</strong> terlebih dahulu, lalu klik tombol <strong>Analisa</strong> pada pengajuan yang diinginkan agar data dapat tersimpan.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Input 3 Bulan */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gold mb-4">📊 Data Keuangan 3 Bulan</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr><th className="table-header">Komponen</th><th className="table-header">Bulan 1</th><th className="table-header">Bulan 2</th><th className="table-header">Bulan 3</th><th className="table-header">Rata-rata</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="table-cell font-medium">Omset</td>
                    <td className="table-cell">{ri('', 'omsetBulan1')}</td>
                    <td className="table-cell">{ri('', 'omsetBulan2')}</td>
                    <td className="table-cell">{ri('', 'omsetBulan3')}</td>
                    <td className="table-cell font-semibold text-gold">{formatRupiah(calc.rataOmset)}</td>
                  </tr>
                  <tr>
                    <td className="table-cell font-medium">HPP</td>
                    <td className="table-cell">{ri('', 'hppBulan1')}</td>
                    <td className="table-cell">{ri('', 'hppBulan2')}</td>
                    <td className="table-cell">{ri('', 'hppBulan3')}</td>
                    <td className="table-cell font-semibold">{formatRupiah(calc.rataHpp)}</td>
                  </tr>
                  <tr>
                    <td className="table-cell font-medium">Biaya Operasional</td>
                    <td className="table-cell">{ri('', 'biayaOpBulan1')}</td>
                    <td className="table-cell">{ri('', 'biayaOpBulan2')}</td>
                    <td className="table-cell">{ri('', 'biayaOpBulan3')}</td>
                    <td className="table-cell font-semibold">{formatRupiah(calc.rataBiayaOp)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="label">Pengurang Angsuran</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">Rp</span>
                  <input type="text" value={form.pengurangAngsuran ? form.pengurangAngsuran.toLocaleString('id-ID') : ''} onChange={e => update('pengurangAngsuran', e.target.value.replace(/\D/g, ''))} className="input-field text-right pl-10" />
                </div>
              </div>
              <div>
                <label className="label">Angsuran per Bulan</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">Rp</span>
                  <input type="text" value={form.angsuranPerBulan ? form.angsuranPerBulan.toLocaleString('id-ID') : ''} onChange={e => update('angsuranPerBulan', e.target.value.replace(/\D/g, ''))} className="input-field text-right pl-10" />
                </div>
              </div>
            </div>
          </div>

          {/* Stress Test */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gold mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Stress Testing</h3>
            <table className="w-full">
              <thead>
                <tr><th className="table-header">Skenario</th><th className="table-header">Omset</th><th className="table-header">Laba Bersih</th><th className="table-header">DSCR</th><th className="table-header">Status</th></tr>
              </thead>
              <tbody>
                <tr className="bg-emerald-500/5">
                  <td className="table-cell font-medium">Normal</td>
                  <td className="table-cell">{formatRupiah(calc.rataOmset)}</td>
                  <td className="table-cell">{formatRupiah(calc.labaBersih)}</td>
                  <td className="table-cell font-bold">{calc.dscr.toFixed(2)}</td>
                  <td className="table-cell">{calc.layak ? <span className="badge-success">Layak</span> : <span className="badge-danger">Tidak Layak</span>}</td>
                </tr>
                {calc.stressTest.map(s => (
                  <tr key={s.persen} className={s.layak ? '' : 'bg-red-500/5'}>
                    <td className="table-cell font-medium text-amber-400">Turun {s.persen}%</td>
                    <td className="table-cell">{formatRupiah(s.omset)}</td>
                    <td className="table-cell">{formatRupiah(s.laba)}</td>
                    <td className="table-cell font-bold">{s.dscr.toFixed(2)}</td>
                    <td className="table-cell">{s.layak ? <span className="badge-success">Layak</span> : <span className="badge-danger">Tidak Layak</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Result Panel */}
        <div className="card sticky top-20 h-fit">
          <h3 className="text-sm font-semibold text-gold mb-4">📊 Rasio Keuangan</h3>
          <div className="space-y-3">
            <ResultRow label="Laba Kotor" value={formatRupiah(calc.labaKotor)} />
            <ResultRow label="Laba Bersih" value={formatRupiah(calc.labaBersih)} highlight />
            <hr className="border-navy-border" />
            <ResultRow label="GPM" value={formatPercent(calc.gpm)} />
            <ResultRow label="NPM" value={formatPercent(calc.npm)} />
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">DSCR</span>
              <span className={`text-sm font-bold ${calc.dscr >= 1.2 ? 'text-emerald-400' : 'text-red-400'}`}>
                {calc.dscr.toFixed(2)} {calc.dscr >= 1.2 ? '✓' : '✗'} (min 1.2)
              </span>
            </div>
            <ResultRow label="BEP" value={formatRupiah(calc.bep)} />
            <hr className="border-navy-border" />
            <div className={`flex items-center justify-center gap-2 py-3 rounded-lg ${calc.layak ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {calc.layak ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <span className="font-bold">{calc.layak ? 'LAYAK' : 'TIDAK LAYAK'}</span>
            </div>
          </div>
          <button onClick={handleSave} disabled={loading || !pengajuanId} className="btn-primary w-full mt-4">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? 'Tersimpan ✓' : 'Simpan Analisa'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultRow({ label, value, highlight }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-gold' : 'text-white'}`}>{value}</span>
    </div>
  );
}
