import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calculator, Save, Loader2, ArrowLeft, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { analisaService, slikService, pengajuanService } from '../../services';
import { formatRupiah, formatPercent } from '../../utils/formatters';

export default function AnalisaKonsumtifPage() {
  const [params] = useSearchParams();
  const pengajuanId = params.get('pengajuanId') || '';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [useDsr, setUseDsr] = useState(false);

  const [form, setForm] = useState({
    gajiPokok: 0, tunjangan: 0, bonusRata: 0, usahaSampingan: 0, pendapatanPasangan: 0,
    listrik: 0, air: 0, transportasi: 0, pendidikan: 0, cicilanExisting: 0, pengurangAngsuran: 0, kebutuhanRumahTangga: 0, pengeluaranLain: 0,
    angsuranDiajukan: 0,
  });

  useEffect(() => {
    if (!pengajuanId) return;

    const loadData = async () => {
      try {
        // 1. Fetch SLIK data and Pengajuan data
        let slikInstallment = 0;
        let angsuranDariPengajuan = 0;

        try {
          const pRes = await pengajuanService.getById(pengajuanId);
          if (pRes.data?.data?.angsuran_perbulan) {
            angsuranDariPengajuan = Number(pRes.data.data.angsuran_perbulan);
          }
        } catch(e) { console.error("Failed to load pengajuan", e); }

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

        // 2. Fetch existing analysis
        try {
          const res = await analisaService.getKonsumtif(pengajuanId);
          if (res.data?.data) {
            const data = res.data.data;
            setForm({
              gajiPokok: Number(data.gaji_pokok || 0),
              tunjangan: Number(data.tunjangan || 0),
              bonusRata: Number(data.bonus_rata || 0),
              usahaSampingan: Number(data.usaha_sampingan || 0),
              pendapatanPasangan: Number(data.pendapatan_pasangan || 0),
              listrik: Number(data.listrik || 0),
              air: Number(data.air || 0),
              transportasi: Number(data.transportasi || 0),
              pendidikan: Number(data.pendidikan || 0),
              cicilanExisting: Number(data.cicilan_existing || Math.round(slikInstallment) || 0),
              pengurangAngsuran: Number(data.pengurang_angsuran || 0),
              kebutuhanRumahTangga: Number(data.kebutuhan_rumah_tangga || 0),
              pengeluaranLain: Number(data.pengeluaran_lain || 0),
              angsuranDiajukan: Number(data.angsuran_diajukan) > 0 ? Number(data.angsuran_diajukan) : angsuranDariPengajuan || 0,
            });
            setUseDsr(data.use_dsr !== undefined ? data.use_dsr : false);
          } else {
            // No analysis yet, set default
            setForm(prev => ({
              ...prev,
              cicilanExisting: Math.round(slikInstallment),
              angsuranDiajukan: angsuranDariPengajuan
            }));
          }
        } catch (err) {
          // If analysis service fails or returns 404, set default
          setForm(prev => ({
            ...prev,
            cicilanExisting: Math.round(slikInstallment),
            angsuranDiajukan: angsuranDariPengajuan
          }));
        }
      } catch (err) {
        console.error("Error loading page data:", err);
      }
    };

    loadData();
  }, [pengajuanId]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));

  // Real-time calculation
  const calc = useMemo(() => {
    const totalPenghasilan = form.gajiPokok + form.tunjangan + form.bonusRata + form.usahaSampingan + form.pendapatanPasangan;
    const totalPengeluaranBase = form.listrik + form.air + form.transportasi + form.pendidikan + form.kebutuhanRumahTangga + form.pengeluaranLain;
    const totalCicilan = form.cicilanExisting + form.pengurangAngsuran + form.angsuranDiajukan;
    const totalPengeluaran = totalPengeluaranBase + form.cicilanExisting;
    const disposableIncome = totalPenghasilan - totalPengeluaranBase - (form.cicilanExisting + form.pengurangAngsuran);
    const dsr = totalPenghasilan > 0 ? (totalCicilan / totalPenghasilan) * 100 : 0;
    
    let maxDsr = 40;
    if (totalPenghasilan <= 5000000) maxDsr = 30;
    else if (totalPenghasilan <= 15000000) maxDsr = 40;
    else if (totalPenghasilan <= 50000000) maxDsr = 50;
    else maxDsr = 60;

    const rpc = form.angsuranDiajukan > 0 ? (disposableIncome / form.angsuranDiajukan) * 100 : 0;
    const maxAngsuran = disposableIncome * 0.95;
    const layak = useDsr 
      ? (dsr <= maxDsr && rpc >= 110 && form.angsuranDiajukan > 0) 
      : (rpc >= 110 && form.angsuranDiajukan > 0);

    return { totalPenghasilan, totalPengeluaran, totalCicilan, disposableIncome, dsr, maxDsr, rpc, maxAngsuran, layak };
  }, [form, useDsr]);

  const handleAutoFillPengeluaran = () => {
    const totalPenghasilan = form.gajiPokok + form.tunjangan + form.bonusRata + form.usahaSampingan + form.pendapatanPasangan;
    if (totalPenghasilan <= 0) {
      alert("Masukkan data penghasilan terlebih dahulu.");
      return;
    }
    
    let pct = 0.50;
    if (totalPenghasilan <= 2000000) pct = 0.80;
    else if (totalPenghasilan <= 7000000) pct = 0.75;
    else if (totalPenghasilan <= 10000000) pct = 0.60;
    else if (totalPenghasilan <= 15000000) pct = 0.55;
    
    const target = totalPenghasilan * pct;
    
    // Distribute naturally and round to nearest 1,000 Rp
    const roundToThousand = (val) => Math.round(val / 1000) * 1000;
    
    setForm(prev => ({
      ...prev,
      kebutuhanRumahTangga: roundToThousand(target * 0.60),
      listrik: roundToThousand(target * 0.05),
      air: roundToThousand(target * 0.05),
      pendidikan: roundToThousand(target * 0.15),
      transportasi: roundToThousand(target * 0.10),
      pengeluaranLain: roundToThousand(target * 0.05)
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await analisaService.saveKonsumtif({ ...form, useDsr, pengajuanId });
      setSaved(true);
    } catch (err) { alert(err.response?.data?.message || 'Gagal menyimpan'); }
    setLoading(false);
  };

  const renderInput = (label, field) => {
    const displayValue = form[field] ? form[field].toLocaleString('id-ID') : '';
    const handleChange = (e) => {
      const rawValue = e.target.value.replace(/\D/g, '');
      update(field, rawValue);
    };
    return (
      <div>
        <label className="label">{label}</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">Rp</span>
          <input 
            type="text" 
            value={displayValue} 
            onChange={handleChange}
            className="input-field text-right pl-10" 
            placeholder="0" 
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Calculator className="w-6 h-6 text-gold" /> Analisa Konsumtif</h1>
          <p className="text-sm text-slate-400">Kalkulasi kelayakan kredit konsumtif</p>
        </div>
      </div>

      {!pengajuanId && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400 font-medium">Pengajuan ID tidak ditemukan! Silakan buka menu <strong>Pengajuan Kredit</strong> terlebih dahulu, lalu klik tombol <strong>Analisa</strong> pada pengajuan yang diinginkan agar data dapat tersimpan.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Penghasilan */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gold mb-4">💰 Penghasilan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderInput('Gaji Pokok', 'gajiPokok')}
              {renderInput('Tunjangan', 'tunjangan')}
              {renderInput('Bonus (Rata-rata)', 'bonusRata')}
              {renderInput('Usaha Sampingan', 'usahaSampingan')}
              {renderInput('Pendapatan Pasangan', 'pendapatanPasangan')}
            </div>
          </div>

          {/* Pengeluaran */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gold">📋 Pengeluaran</h3>
              <button 
                type="button"
                onClick={handleAutoFillPengeluaran} 
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 hover:bg-navy-lighter transition-colors"
              >
                ⚡ Auto-fill Pengeluaran
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderInput('Listrik', 'listrik')}
              {renderInput('Air', 'air')}
              {renderInput('Transportasi', 'transportasi')}
              {renderInput('Pendidikan', 'pendidikan')}
              {renderInput('Cicilan Existing', 'cicilanExisting')}
              {renderInput('Pengurang Angsuran', 'pengurangAngsuran')}
              {renderInput('Kebutuhan Rumah Tangga', 'kebutuhanRumahTangga')}
              {renderInput('Pengeluaran Lain', 'pengeluaranLain')}
            </div>
          </div>
        </div>

        {/* Result Panel */}
        <div className="space-y-4">
          <div className="card sticky top-20">
            <h3 className="text-sm font-semibold text-gold mb-4">📊 Hasil Analisa</h3>
            <div className="space-y-3">
              <ResultRow label="Total Penghasilan" value={formatRupiah(calc.totalPenghasilan)} />
              <ResultRow label="Total Pengeluaran" value={formatRupiah(calc.totalPengeluaran)} />
              <hr className="border-navy-border" />
              <ResultRow label="Disposable Income" value={formatRupiah(calc.disposableIncome)} highlight />
              <ResultRow label="Max Angsuran (95%)" value={formatRupiah(calc.maxAngsuran)} />
              
              <div className="pt-2">
                {renderInput('Angsuran Diajukan', 'angsuranDiajukan')}
              </div>
              <hr className="border-navy-border" />

              {/* DSR */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400" title="Aktifkan/Matikan aturan DSR">DSR</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={useDsr} onChange={(e) => setUseDsr(e.target.checked)} className="sr-only peer" />
                    <div className="w-7 h-4 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                <span className={`text-sm font-bold ${!useDsr ? 'text-slate-400' : (calc.dsr <= calc.maxDsr ? 'text-emerald-400' : 'text-red-400')}`}>
                  {formatPercent(calc.dsr)} {!useDsr ? '(Diabaikan)' : (calc.dsr <= calc.maxDsr ? '✓' : '✗')} {useDsr && `(max ${calc.maxDsr}%)`}
                </span>
              </div>

              {/* RPC */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">RPC</span>
                <span className={`text-sm font-bold ${calc.rpc >= 110 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatPercent(calc.rpc)} {calc.rpc >= 110 ? '✓' : '✗'} (min 110%)
                </span>
              </div>

              <hr className="border-navy-border" />

              {/* Status */}
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
