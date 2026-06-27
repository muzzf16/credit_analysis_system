import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Search, Eye, RefreshCw, CheckCircle, XCircle,
  FileText, Activity, ShieldAlert, Sparkles, Loader2, ArrowRight
} from 'lucide-react';
import { ewsService } from '../../services';
import { formatRupiah } from '../../utils/formatters';
import { toast } from 'react-toastify';

const RISK_THEMES = {
  LOW: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-300' },
  MEDIUM: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', badge: 'bg-yellow-500/20 text-yellow-300' },
  HIGH: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', badge: 'bg-red-500/20 text-red-300' },
};

const TRIGGER_LABELS = {
  TUNGGAKAN: '🚨 Tunggakan Pembayaran',
  RISK_KUALITATIF: '📋 Risiko Kualitatif AO',
  OMZET_DROP: '📉 Penurunan Omzet',
  JATUH_TEMPO_REMINDER: '📅 Jatuh Tempo H-3',
};

export default function EwsDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ statusAlert: 'AKTIF', riskScore: '', search: '' });

  useEffect(() => {
    loadData();
    loadSummary();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await ewsService.getAll(filters);
      setData(res.data.data || []);
    } catch (err) {
      toast.error('Gagal memuat data alert EWS.');
      setData([]);
    }
    setLoading(false);
  };

  const loadSummary = async () => {
    try {
      const res = await ewsService.getSummary();
      setSummary(res.data.data);
    } catch {
      setSummary(null);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await ewsService.scan();
      const stats = res.data.data;
      toast.success(
        `Pemindaian selesai! Di-scan: ${stats.scanned}, Alert Baru: ${stats.alertsCreated}, Diupdate: ${stats.alertsUpdated}, Selesai: ${stats.resolved}`
      );
      loadData();
      loadSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menjalankan pemindaian EWS.');
    }
    setScanning(false);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <ShieldAlert className="w-7 h-7 text-red-500 animate-pulse" /> Early Warning System (EWS)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Sistem deteksi dini risiko kredit macet dan kepatuhan kolektibilitas nasabah.
          </p>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-semibold px-5 py-2.5 rounded-lg shadow-lg shadow-red-900/20 transition duration-200 disabled:opacity-50"
        >
          {scanning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Memindai Portfolio...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Pindai Portofolio
            </>
          )}
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-navy border border-navy-border p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Alert Aktif</p>
              <h3 className="text-3xl font-bold text-red-400 mt-1">{summary.totals.active}</h3>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-navy border border-navy-border p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Resolved</p>
              <h3 className="text-3xl font-bold text-emerald-400 mt-1">{summary.totals.resolved}</h3>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-navy border border-navy-border p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Dismissed</p>
              <h3 className="text-3xl font-bold text-slate-400 mt-1">{summary.totals.dismissed}</h3>
            </div>
            <div className="p-3 rounded-lg bg-slate-500/10 text-slate-400">
              <XCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-navy border border-navy-border p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Kunjungan AO Baru</p>
              <button
                onClick={() => navigate('/ews/visit')}
                className="mt-2 text-xs font-bold text-gold flex items-center gap-1 hover:text-gold-dark"
              >
                Catat Kunjungan <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 text-gold">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Filters and List */}
      <div className="bg-navy border border-navy-border rounded-xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-navy-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Select */}
            <select
              value={filters.statusAlert}
              onChange={(e) => setFilters({ ...filters, statusAlert: e.target.value })}
              className="bg-navy-light border border-navy-border text-slate-300 rounded-lg px-3 py-2 outline-none focus:border-gold text-sm"
            >
              <option value="AKTIF">Alert Aktif</option>
              <option value="RESOLVED">Resolved (Selesai)</option>
              <option value="DISMISSED">Dismissed (Diabaikan)</option>
            </select>

            {/* Risk Select */}
            <select
              value={filters.riskScore}
              onChange={(e) => setFilters({ ...filters, riskScore: e.target.value })}
              className="bg-navy-light border border-navy-border text-slate-300 rounded-lg px-3 py-2 outline-none focus:border-gold text-sm"
            >
              <option value="">Semua Tingkat Risiko</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Debitur / No. Pengajuan..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="bg-navy-light border border-navy-border text-slate-200 pl-9 pr-4 py-2 rounded-lg outline-none focus:border-gold text-sm w-full md:w-64"
            />
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
              <p className="text-slate-400 text-sm">Memuat data alert EWS...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-16">
              <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Tidak ada alert EWS ditemukan.</p>
              <p className="text-slate-600 text-xs mt-1">Scan ulang portofolio untuk memastikan data terbaru.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-navy-light border-b border-navy-border text-slate-400 font-medium">
                  <th className="p-4">No. Pengajuan</th>
                  <th className="p-4">Debitur</th>
                  <th className="p-4">Trigger</th>
                  <th className="p-4 text-center">DPD</th>
                  <th className="p-4 text-center">Kol</th>
                  <th className="p-4 text-center">Tunggakan</th>
                  <th className="p-4 text-center">Tingkat Risiko</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-border">
                {data.map((alert) => {
                  const theme = RISK_THEMES[alert.risk_score] || RISK_THEMES.LOW;
                  return (
                    <tr key={alert.id} className="hover:bg-navy-light/50 transition">
                      <td className="p-4 font-bold text-white">{alert.nomor_pengajuan}</td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-200">{alert.debitur_nama}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{alert.jenis_kredit}</div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-slate-300 font-medium bg-navy-light border border-navy-border px-2.5 py-1 rounded-md">
                          {TRIGGER_LABELS[alert.trigger_type] || alert.trigger_type}
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-300">{alert.dpd} hari</td>
                      <td className="p-4 text-center">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          Kol {alert.kolektibilitas}
                        </span>
                      </td>
                      <td className="p-4 text-center font-semibold text-slate-300">
                        {alert.jumlah_tunggakan > 0 ? formatRupiah(alert.jumlah_tunggakan) : '-'}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${theme.badge}`}>
                          {alert.risk_score}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => navigate(`/ews/${alert.id}`)}
                          className="p-2 rounded-lg bg-navy-light border border-navy-border hover:border-gold hover:text-gold transition text-slate-400"
                          title="Lihat Detail Alert"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
