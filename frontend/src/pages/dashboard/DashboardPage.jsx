import { useEffect, useState } from 'react';
import { Users, FileText, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardService } from '../../services';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { STATUS_PENGAJUAN } from '../../utils/constants';
import useAuthStore from '../../store/authStore';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#6B7280'];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.get().then(res => { setData(res.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return <div className="text-center text-slate-400 py-20">Gagal memuat dashboard</div>;

  const s = data.summary || {};
  const metrics = [
    { label: 'Total Debitur', value: s.totalDebitur || 0, icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'Total Pengajuan', value: s.totalPengajuan || 0, icon: FileText, color: 'from-purple-500 to-purple-600' },
    { label: 'Disetujui', value: s.totalDisetujui || 0, icon: CreditCard, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Outstanding', value: formatRupiah(s.outstanding), icon: TrendingUp, color: 'from-gold to-gold-dark', isRupiah: true },
  ];

  if (user?.role === 'AO') {
    metrics[0] = { label: 'Debitur Saya', value: s.totalDebitur || 0, icon: Users, color: 'from-blue-500 to-blue-600' };
    metrics[2] = { label: 'Survey Pending', value: s.pendingSurvey || 0, icon: Clock, color: 'from-amber-500 to-amber-600' };
    metrics.pop();
  }

  if (user?.role === 'ANALIS') {
    metrics[0] = { label: 'Pending Analisa', value: s.pendingAnalisa || 0, icon: FileText, color: 'from-amber-500 to-amber-600' };
    metrics[1] = { label: 'Selesai Analisa', value: s.completedAnalisa || 0, icon: CreditCard, color: 'from-emerald-500 to-emerald-600' };
    metrics.splice(2);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Selamat datang, {user?.fullName}!</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="card-hover animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">{m.label}</p>
                <p className="text-2xl font-bold mt-1">{m.isRupiah ? m.value : m.value.toLocaleString()}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center shadow-lg`}>
                <m.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      {data.perBulan && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <div className="card lg:col-span-2">
            <h3 className="text-sm font-semibold mb-4">Pengajuan per Bulan</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.perBulan}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="bulan" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #475569', borderRadius: 8 }} />
                <Bar dataKey="total" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4">Status Pengajuan</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.pengajuanByStatus} dataKey="total" nameKey="status" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                  {data.pengajuanByStatus?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #475569', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {data.pengajuanByStatus?.slice(0, 6).map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-400">{item.status}</span>
                  <span className="font-medium ml-auto">{item.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Pengajuan Table */}
      {data.recentPengajuan && (
        <div className="card">
          <h3 className="text-sm font-semibold mb-4">Pengajuan Terbaru</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">No. Pengajuan</th>
                  <th className="table-header">Debitur</th>
                  <th className="table-header">Jenis</th>
                  <th className="table-header">Plafon</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {data.recentPengajuan.map((p) => {
                  const statusInfo = STATUS_PENGAJUAN[p.status] || { label: p.status, color: 'badge-gray' };
                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="table-cell font-mono text-xs">{p.nomor_pengajuan}</td>
                      <td className="table-cell font-medium text-white">{p.debitur_nama}</td>
                      <td className="table-cell">{p.jenis_kredit}</td>
                      <td className="table-cell">{formatRupiah(p.plafon_diajukan)}</td>
                      <td className="table-cell"><span className={statusInfo.color}>{statusInfo.label}</span></td>
                      <td className="table-cell text-xs">{formatDate(p.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
