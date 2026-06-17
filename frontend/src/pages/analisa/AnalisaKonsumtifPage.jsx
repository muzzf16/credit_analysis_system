import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calculator, Save, Loader2, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { analisaService } from '../../services';
import { formatRupiah, formatPercent } from '../../utils/formatters';

export default function AnalisaKonsumtifPage() {
  const [params] = useSearchParams();
  const pengajuanId = params.get('pengajuanId') || '';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    gajiPokok: 0, tunjangan: 0, bonusRata: 0, usahaSampingan: 0, pendapatanPasangan: 0,
    listrik: 0, air: 0, transportasi: 0, pendidikan: 0, cicilanExisting: 0, kebutuhanRumahTangga: 0, pengeluaranLain: 0,
    angsuranDiajukan: 0,
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));

  // Real-time calculation
  const calc = useMemo(() => {
    const totalPenghasilan = form.gajiPokok + form.tunjangan + form.bonusRata + form.usahaSampingan + form.pendapatanPasangan;
    const totalPengeluaranBase = form.listrik + form.air + form.transportasi + form.pendidikan + form.kebutuhanRumahTangga + form.pengeluaranLain;
    const totalCicilan = form.cicilanExisting + form.angsuranDiajukan;
    const totalPengeluaran = totalPengeluaranBase + totalCicilan;
    const disposableIncome = totalPenghasilan - totalPengeluaranBase - form.cicilanExisting;
    const dsr = totalPenghasilan > 0 ? (totalCicilan / totalPenghasilan) * 100 : 0;
    const rpc = form.angsuranDiajukan > 0 ? (disposableIncome / form.angsuranDiajukan) * 100 : 0;
    const maxAngsuran = totalPenghasilan * 0.4 - form.cicilanExisting;
    const layak = dsr <= 40 && rpc >= 110 && form.angsuranDiajukan > 0;

    return { totalPenghasilan, totalPengeluaran, totalCicilan, disposableIncome, dsr, rpc, maxAngsuran, layak };
  }, [form]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await analisaService.saveKonsumtif({ ...form, pengajuanId });
      setSaved(true);
    } catch (err) { alert(err.response?.data?.message || 'Gagal menyimpan'); }
    setLoading(false);
  };

  const renderInput = (label, field) => (
    <div>
      <label className="label">{label}</label>
      <input type="number" value={form[field]} onChange={e => update(field, e.target.value)}
        className="input-field text-right" placeholder="0" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Calculator className="w-6 h-6 text-gold" /> Analisa Konsumtif</h1>
          <p className="text-sm text-slate-400">Kalkulasi kelayakan kredit konsumtif</p>
        </div>
      </div>

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
            <h3 className="text-sm font-semibold text-gold mb-4">📋 Pengeluaran</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderInput('Listrik', 'listrik')}
              {renderInput('Air', 'air')}
              {renderInput('Transportasi', 'transportasi')}
              {renderInput('Pendidikan', 'pendidikan')}
              {renderInput('Cicilan Existing', 'cicilanExisting')}
              {renderInput('Kebutuhan Rumah Tangga', 'kebutuhanRumahTangga')}
              {renderInput('Pengeluaran Lain', 'pengeluaranLain')}
              {renderInput('Angsuran Diajukan', 'angsuranDiajukan')}
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
              <ResultRow label="Max Angsuran (40%)" value={formatRupiah(calc.maxAngsuran)} />
              <hr className="border-navy-border" />

              {/* DSR */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">DSR</span>
                <span className={`text-sm font-bold ${calc.dsr <= 40 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatPercent(calc.dsr)} {calc.dsr <= 40 ? '✓' : '✗'} (max 40%)
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
