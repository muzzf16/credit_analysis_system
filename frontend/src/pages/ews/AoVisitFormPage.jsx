import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, ArrowLeft, Loader2, Save, MapPin,
  AlertTriangle, CheckSquare, Square, Info
} from 'lucide-react';
import { ewsService, monitoringService } from '../../services';
import { toast } from 'react-toastify';

export default function AoVisitFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeLoans, setActiveLoans] = useState([]);

  // Form State
  const [form, setForm] = useState({
    monitoringId: '',
    penurunanOmzet: false,
    penurunanCashflow: false,
    kondisiAgunan: 'Normal',
    catatan: '',
  });

  useEffect(() => {
    loadActiveLoans();
  }, []);

  const loadActiveLoans = async () => {
    setLoading(true);
    try {
      const res = await monitoringService.getAll({ status: 'AKTIF', limit: 100 });
      setActiveLoans(res.data.data || []);
    } catch {
      toast.error('Gagal mengambil daftar pinjaman aktif.');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.monitoringId) {
      toast.warning('Silakan pilih rekening pinjaman debitur.');
      return;
    }

    setSubmitting(true);
    try {
      await ewsService.logAoVisit(form);
      toast.success('Laporan kunjungan AO dan indikator kualitatif EWS berhasil disimpan.');
      navigate('/ews');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan laporan kunjungan.');
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-slate-100 pb-12">
      {/* Back button and title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/ews')}
          className="p-2 rounded-lg bg-navy border border-navy-border hover:border-gold hover:text-gold transition text-slate-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            Form Kunjungan Monitoring AO
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Log inspeksi lapangan rutin untuk memperbarui parameter risiko kualitatif EWS.
          </p>
        </div>
      </div>

      <div className="bg-navy border border-navy-border rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r from-gold to-gold-dark" />
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
            <p className="text-sm">Memuat data pinjaman aktif...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Select Active Loan */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Pilih Debitur / Rekening Kredit
              </label>
              <select
                value={form.monitoringId}
                onChange={(e) => setForm({ ...form, monitoringId: e.target.value })}
                required
                className="w-full bg-navy-light border border-navy-border text-slate-200 rounded-lg p-3 outline-none focus:border-gold text-sm"
              >
                <option value="">-- Pilih Rekening Debitur --</option>
                {activeLoans.map((loan) => (
                  <option key={loan.id} value={loan.id}>
                    {loan.nomor_pengajuan} - {loan.debitur_nama} ({loan.jenis_kredit})
                  </option>
                ))}
              </select>
            </div>

            {/* Qualitative Risk Section */}
            <div className="bg-navy-light border border-navy-border rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Info className="w-4.5 h-4.5 text-gold" /> Faktor Risiko Kualitatif Lapangan
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Penurunan Omzet */}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, penurunanOmzet: !form.penurunanOmzet })}
                  className={`flex items-center justify-between p-3.5 rounded-lg border text-left transition ${
                    form.penurunanOmzet
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-navy border-navy-border text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-sm font-semibold">Omzet Usaha Menurun?</span>
                  {form.penurunanOmzet ? <CheckSquare className="w-5 h-5 text-red-400" /> : <Square className="w-5 h-5" />}
                </button>

                {/* Penurunan Cashflow */}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, penurunanCashflow: !form.penurunanCashflow })}
                  className={`flex items-center justify-between p-3.5 rounded-lg border text-left transition ${
                    form.penurunanCashflow
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-navy border-navy-border text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-sm font-semibold">Arus Kas (Cashflow) Terganggu?</span>
                  {form.penurunanCashflow ? <CheckSquare className="w-5 h-5 text-red-400" /> : <Square className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Collateral Condition */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Kondisi Agunan Jaminan Terkini
              </label>
              <select
                value={form.kondisiAgunan}
                onChange={(e) => setForm({ ...form, kondisiAgunan: e.target.value })}
                required
                className="w-full bg-navy-light border border-navy-border text-slate-200 rounded-lg p-3 outline-none focus:border-gold text-sm"
              >
                <option value="Normal">Normal (Sesuai taksasi awal)</option>
                <option value="Menyusut">Menyusut (Nilai pasar turun)</option>
                <option value="Rusak Sebagian">Rusak Sebagian (Butuh renovasi/pemeliharaan)</option>
                <option value="Rusak Total">Rusak Total / Hilang (Gawat Darurat)</option>
                <option value="Sengketa">Dalam Sengketa Hukum / Penyitaan Pihak Lain</option>
              </select>
            </div>

            {/* AO inspection Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Catatan Temuan Kunjungan AO
              </label>
              <textarea
                placeholder="Masukkan rincian temuan lapangan, kondisi usaha debitur, alasan penurunan omzet, hasil wawancara debitur, rencana penagihan, dll..."
                value={form.catatan}
                onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                required
                rows={5}
                className="w-full bg-navy-light border border-navy-border text-slate-200 rounded-lg p-3 outline-none focus:border-gold text-sm resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-navy-border/60">
              <button
                type="button"
                onClick={() => navigate('/ews')}
                className="px-5 py-2.5 rounded-lg border border-navy-border hover:bg-navy-light text-slate-400 font-semibold text-sm transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-navy font-bold px-6 py-2.5 rounded-lg shadow-lg shadow-gold-500/10 transition disabled:opacity-50 text-sm"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Kunjungan
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
