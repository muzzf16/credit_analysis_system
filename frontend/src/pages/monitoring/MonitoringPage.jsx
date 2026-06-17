import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Search, Eye, ChevronDown, ChevronUp, TrendingUp, AlertTriangle,
  DollarSign, PieChart as PieChartIcon, Filter, CreditCard, Loader2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { monitoringService } from '../../services';
import { formatRupiah } from '../../utils/formatters';

const KOLEKTIBILITAS_COLORS = {
  1: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', fill: '#10B981', label: 'Lancar' },
  2: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', fill: '#3B82F6', label: 'DPK' },
  3: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', fill: '#EAB308', label: 'Kurang Lancar' },
  4: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', fill: '#F97316', label: 'Diragukan' },
  5: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', fill: '#EF4444', label: 'Macet' },
};

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'AKTIF', label: 'Aktif' },
  { value: 'LUNAS', label: 'Lunas' },
  { value: 'MACET', label: 'Macet' },
];

export default function MonitoringPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [filters, setFilters] = useState({ status: '', kolektibilitas: '', search: '' });
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ tanggal_bayar: '', jumlah_dibayar: '', denda: 0, catatan: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    loadSummary();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.kolektibilitas) params.kolektibilitas = filters.kolektibilitas;
      if (filters.search) params.search = filters.search;
      const res = await monitoringService.getAll(params);
      setData(res.data.data || []);
    } catch { setData([]); }
    setLoading(false);
  };

  const loadSummary = async () => {
    try {
      const res = await monitoringService.getSummary();
      setSummary(res.data.data);
    } catch { setSummary(null); }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadData(), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const nplRatio = summary?.npl_ratio || 0;
  const nplColor = nplRatio < 5 ? 'text-emerald-400' : nplRatio <= 8 ? 'text-yellow-400' : 'text-red-400';
  const nplBg = nplRatio < 5 ? 'from-emerald-500/20' : nplRatio <= 8 ? 'from-yellow-500/20' : 'from-red-500/20';

  const kolektibilitasData = summary?.kolektibilitas_distribution
    ? Object.entries(summary.kolektibilitas_distribution).map(([k, v]) => ({
        name: `Kol ${k} - ${KOLEKTIBILITAS_COLORS[k]?.label || ''}`,
        value: v,
        fill: KOLEKTIBILITAS_COLORS[k]?.fill || '#64748B',
      }))
    : [];

  const handlePayment = async () => {
    setSubmitting(true);
    try {
      await monitoringService.recordPayment(showPaymentModal, paymentForm);
      setShowPaymentModal(null);
      setPaymentForm({ tanggal_bayar: '', jumlah_dibayar: '', denda: 0, catatan: '' });
      loadData();
      loadSummary();
      alert('Pembayaran berhasil dicatat!');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mencatat pembayaran');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="w-6 h-6 text-gold" /> Monitoring Kredit
        </h1>
        <p className="text-sm text-slate-400">Monitoring pasca pencairan kredit</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-500/10 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Kredit Aktif</span>
            <CreditCard className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">{summary?.total_aktif || 0}</p>
          <p className="text-xs text-slate-500 mt-1">debitur aktif</p>
        </div>

        <div className="card bg-gradient-to-br from-gold/10 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Outstanding</span>
            <DollarSign className="w-5 h-5 text-gold" />
          </div>
          <p className="text-2xl font-bold text-white">{formatRupiah(summary?.total_outstanding || 0)}</p>
          <p className="text-xs text-slate-500 mt-1">sisa pokok pinjaman</p>
        </div>

        <div className={`card bg-gradient-to-br ${nplBg} to-transparent`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">NPL Ratio</span>
            <AlertTriangle className={`w-5 h-5 ${nplColor}`} />
          </div>
          <p className={`text-3xl font-bold ${nplColor}`}>{nplRatio.toFixed(2)}%</p>
          <p className="text-xs text-slate-500 mt-1">{nplRatio < 5 ? 'Sehat' : nplRatio <= 8 ? 'Perhatian' : 'Bahaya'}</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-500/10 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Distribusi Kolektibilitas</span>
            <PieChartIcon className="w-5 h-5 text-purple-400" />
          </div>
          {kolektibilitasData.length > 0 ? (
            <div className="h-32 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={kolektibilitasData} cx="50%" cy="50%" innerRadius={25} outerRadius={50}
                    paddingAngle={2} dataKey="value">
                    {kolektibilitasData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                    formatter={(value) => [value, 'Debitur']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-500 mt-2">Tidak ada data</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Cari debitur..." className="input-field"
              value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <select className="input-field" value={filters.status}
              onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select className="input-field" value={filters.kolektibilitas}
              onChange={e => setFilters(p => ({ ...p, kolektibilitas: e.target.value }))}>
              <option value="">Semua Kol</option>
              {[1,2,3,4,5].map(k => <option key={k} value={k}>Kol {k}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header w-12">No</th>
                <th className="table-header">Debitur</th>
                <th className="table-header text-right">Plafon</th>
                <th className="table-header text-right">Angsuran</th>
                <th className="table-header text-center">Sisa Bulan</th>
                <th className="table-header text-right">Tunggakan</th>
                <th className="table-header text-center">Kol</th>
                <th className="table-header text-center">Status</th>
                <th className="table-header text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="table-cell text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" /> Memuat data...
                  </div>
                </td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={9} className="table-cell text-center py-12 text-slate-500">Tidak ada data monitoring</td></tr>
              ) : data.map((item, i) => {
                const kol = KOLEKTIBILITAS_COLORS[item.kolektibilitas] || KOLEKTIBILITAS_COLORS[1];
                const isExpanded = expandedRow === item.id;
                return (
                  <tbody key={item.id}>
                    <tr className="hover:bg-navy-lighter/50 transition-colors cursor-pointer"
                      onClick={() => setExpandedRow(isExpanded ? null : item.id)}>
                      <td className="table-cell text-center text-slate-500">{i + 1}</td>
                      <td className="table-cell">
                        <div>
                          <p className="font-medium text-white">{item.debitur_nama}</p>
                          <p className="text-xs text-slate-500">{item.nomor_pengajuan}</p>
                        </div>
                      </td>
                      <td className="table-cell text-right font-mono text-sm">{formatRupiah(item.plafon)}</td>
                      <td className="table-cell text-right font-mono text-sm">{formatRupiah(item.angsuran)}</td>
                      <td className="table-cell text-center">{item.sisa_bulan}</td>
                      <td className="table-cell text-right">
                        {item.tunggakan > 0 ? (
                          <span className="font-mono text-sm text-red-400">{formatRupiah(item.tunggakan)}</span>
                        ) : (
                          <span className="text-sm text-slate-500">-</span>
                        )}
                      </td>
                      <td className="table-cell text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${kol.bg} ${kol.text} border ${kol.border}`}>
                          {item.kolektibilitas}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <span className={item.status === 'AKTIF' ? 'badge-success' : item.status === 'LUNAS' ? 'badge-info' : 'badge-danger'}>
                          {item.status}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={e => { e.stopPropagation(); navigate(`/monitoring/${item.id}`); }}
                            className="btn-ghost p-1.5" title="Detail">
                            <Eye className="w-4 h-4" />
                          </button>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </td>
                    </tr>
                    {/* Expanded Payment History */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="px-6 py-4 bg-navy-lighter/30 border-t border-navy-border animate-fade-in">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gold">Riwayat Pembayaran</h4>
                            {item.status === 'AKTIF' && (
                              <button onClick={e => { e.stopPropagation(); setShowPaymentModal(item.id); }}
                                className="btn-primary text-xs py-1.5 px-3">
                                <DollarSign className="w-3.5 h-3.5" /> Catat Bayar
                              </button>
                            )}
                          </div>
                          {item.pembayaran?.length > 0 ? (
                            <div className="space-y-2">
                              {item.pembayaran.slice(-5).map((p, j) => (
                                <div key={j} className="flex items-center gap-3 text-sm">
                                  <div className={`w-2 h-2 rounded-full ${
                                    p.status === 'TEPAT_WAKTU' ? 'bg-emerald-500' :
                                    p.status === 'TERLAMBAT' ? 'bg-yellow-500' : 'bg-red-500'
                                  }`} />
                                  <span className="text-slate-400 w-28">{p.tanggal_bayar}</span>
                                  <span className="font-mono text-white">{formatRupiah(p.jumlah)}</span>
                                  <span className={`text-xs ${
                                    p.status === 'TEPAT_WAKTU' ? 'text-emerald-400' :
                                    p.status === 'TERLAMBAT' ? 'text-yellow-400' : 'text-red-400'
                                  }`}>{p.status?.replace(/_/g, ' ')}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">Belum ada riwayat pembayaran</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowPaymentModal(null)}>
          <div className="card w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> Catat Pembayaran
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">Tanggal Bayar</label>
                <input type="date" className="input-field" value={paymentForm.tanggal_bayar}
                  onChange={e => setPaymentForm(p => ({ ...p, tanggal_bayar: e.target.value }))} />
              </div>
              <div>
                <label className="label">Jumlah Dibayar</label>
                <input type="number" className="input-field" placeholder="0" value={paymentForm.jumlah_dibayar}
                  onChange={e => setPaymentForm(p => ({ ...p, jumlah_dibayar: e.target.value }))} />
              </div>
              <div>
                <label className="label">Denda</label>
                <input type="number" className="input-field" placeholder="0" value={paymentForm.denda}
                  onChange={e => setPaymentForm(p => ({ ...p, denda: e.target.value }))} />
              </div>
              <div>
                <label className="label">Catatan</label>
                <textarea className="input-field" rows={2} placeholder="Catatan pembayaran..."
                  value={paymentForm.catatan} onChange={e => setPaymentForm(p => ({ ...p, catatan: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPaymentModal(null)} className="btn-ghost flex-1">Batal</button>
              <button onClick={handlePayment} disabled={submitting || !paymentForm.tanggal_bayar || !paymentForm.jumlah_dibayar}
                className="btn-primary flex-1">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
