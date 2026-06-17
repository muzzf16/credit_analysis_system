import { useEffect, useState } from 'react';
import {
  Shield, Search, ChevronDown, ChevronUp, Clock, AlertTriangle, Trash2,
  LogIn, Activity, Filter, Eye, Loader2, UserX
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { auditService } from '../../services';
import { formatDateTime } from '../../utils/formatters';

const ACTION_COLORS = {
  CREATE: '#10B981',
  UPDATE: '#3B82F6',
  DELETE: '#EF4444',
  APPROVE: '#F59E0B',
  REJECT: '#F97316',
  LOGIN: '#8B5CF6',
};

const ACTION_BADGES = {
  CREATE: 'badge-success',
  UPDATE: 'badge-info',
  DELETE: 'badge-danger',
  APPROVE: 'badge-warning',
  REJECT: 'badge-danger',
  LOGIN: 'badge-purple',
};

const MODULE_COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F97316', '#06B6D4', '#EF4444'];

export default function AuditDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [filters, setFilters] = useState({
    action: '', module: '', user: '', date_from: '', date_to: '',
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [filters, page]);

  const loadSummary = async () => {
    try {
      const res = await auditService.getSummary();
      setSummary(res.data.data);
    } catch { setSummary(null); }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filters.action) params.action = filters.action;
      if (filters.module) params.module = filters.module;
      if (filters.user) params.user = filters.user;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      const res = await auditService.getAll(params);
      setLogs(res.data.data || []);
    } catch { setLogs([]); }
    setLoading(false);
  };

  const moduleChartData = summary?.activity_by_module
    ? Object.entries(summary.activity_by_module).map(([name, value]) => ({ name, value }))
    : [];

  const actionChartData = summary?.activity_by_action
    ? Object.entries(summary.activity_by_action).map(([name, value]) => ({
        name, value, fill: ACTION_COLORS[name] || '#64748B',
      }))
    : [];

  const anomalies = summary?.anomalies || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-gold" /> Audit Trail Dashboard
        </h1>
        <p className="text-sm text-slate-400">Pemantauan aktivitas dan kepatuhan — SPI</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Aktivitas Hari Ini"
          value={summary?.total_activity_today || 0}
          icon={Activity}
          gradient="from-blue-500/20"
          iconColor="text-blue-400"
        />
        <SummaryCard
          label="Login Hari Ini"
          value={summary?.login_today || 0}
          icon={LogIn}
          gradient="from-purple-500/20"
          iconColor="text-purple-400"
        />
        <SummaryCard
          label="Perubahan Data"
          value={summary?.data_changes_today || 0}
          icon={Eye}
          gradient="from-gold/20"
          iconColor="text-gold"
        />
        <SummaryCard
          label="Potensi Anomali"
          value={summary?.anomaly_count || 0}
          icon={AlertTriangle}
          gradient="from-red-500/20"
          iconColor="text-red-400"
          alert={summary?.anomaly_count > 0}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity by Module Bar Chart */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Aktivitas per Modul
          </h3>
          {moduleChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {moduleChartData.map((_, i) => (
                      <Cell key={i} fill={MODULE_COLORS[i % MODULE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">Tidak ada data</div>
          )}
        </div>

        {/* Activity by Action Pie Chart */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gold mb-4 flex items-center gap-2">
            <Filter className="w-4 h-4" /> Aktivitas per Jenis Aksi
          </h3>
          {actionChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={actionChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={80}
                    paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {actionChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend
                    formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">Tidak ada data</div>
          )}
        </div>
      </div>

      {/* Anomaly Alerts */}
      {anomalies.length > 0 && (
        <div className="card border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
          <h3 className="text-sm font-semibold text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Peringatan Anomali
          </h3>
          <div className="space-y-3">
            {anomalies.map((a, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
                a.type === 'DELETE' ? 'bg-red-500/10 border-red-500/30' :
                a.type === 'AFTER_HOURS' ? 'bg-amber-500/10 border-amber-500/30' :
                'bg-orange-500/10 border-orange-500/30'
              }`}>
                <div className="mt-0.5">
                  {a.type === 'DELETE' ? <Trash2 className="w-4 h-4 text-red-400" /> :
                   a.type === 'AFTER_HOURS' ? <Clock className="w-4 h-4 text-amber-400" /> :
                   <UserX className="w-4 h-4 text-orange-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{a.title || a.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{a.detail}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatDateTime(a.waktu)} • {a.user}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                  a.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                  a.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>{a.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="card p-0 overflow-hidden">
        {/* Filters */}
        <div className="px-6 py-4 border-b border-navy-border">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input type="text" placeholder="Cari user..." className="input-field"
                value={filters.user} onChange={e => setFilters(p => ({ ...p, user: e.target.value }))} />
            </div>
            <div className="flex flex-wrap gap-2">
              <select className="input-field" value={filters.action}
                onChange={e => setFilters(p => ({ ...p, action: e.target.value }))}>
                <option value="">Semua Aksi</option>
                {Object.keys(ACTION_COLORS).map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select className="input-field" value={filters.module}
                onChange={e => setFilters(p => ({ ...p, module: e.target.value }))}>
                <option value="">Semua Modul</option>
                {['debitur','pengajuan','approval','scoring','survey','agunan','slik','analisa','user','auth'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <input type="date" className="input-field" placeholder="Dari" value={filters.date_from}
                onChange={e => setFilters(p => ({ ...p, date_from: e.target.value }))} />
              <input type="date" className="input-field" placeholder="Sampai" value={filters.date_to}
                onChange={e => setFilters(p => ({ ...p, date_to: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Waktu</th>
                <th className="table-header">User</th>
                <th className="table-header text-center">Aksi</th>
                <th className="table-header">Modul</th>
                <th className="table-header">Detail</th>
                <th className="table-header text-center w-12"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="table-cell text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" /> Memuat audit log...
                  </div>
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="table-cell text-center py-12 text-slate-500">Tidak ada data audit</td></tr>
              ) : logs.map(log => {
                const isExpanded = expandedRow === log.id;
                const isDelete = log.action === 'DELETE';
                const badge = ACTION_BADGES[log.action] || 'badge-gray';
                return (
                  <tbody key={log.id}>
                    <tr className={`hover:bg-navy-lighter/50 transition-colors cursor-pointer ${isDelete ? 'bg-red-500/5' : ''}`}
                      onClick={() => setExpandedRow(isExpanded ? null : log.id)}>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span className="text-xs whitespace-nowrap">{formatDateTime(log.waktu)}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div>
                          <p className="text-sm font-medium text-white">{log.user_nama}</p>
                          <p className="text-xs text-slate-500">{log.user_role}</p>
                        </div>
                      </td>
                      <td className="table-cell text-center">
                        <span className={badge}>{log.action}</span>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm capitalize">{log.module}</span>
                      </td>
                      <td className="table-cell">
                        <p className="text-sm text-slate-300 truncate max-w-xs">{log.detail || log.description}</p>
                      </td>
                      <td className="table-cell text-center">
                        {(log.old_data || log.new_data) && (
                          isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </td>
                    </tr>
                    {/* Expanded diff */}
                    {isExpanded && (log.old_data || log.new_data) && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-navy-lighter/30 border-t border-navy-border animate-fade-in">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {log.old_data && (
                              <div>
                                <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Data Lama</h4>
                                <pre className="bg-navy-lighter rounded-lg p-3 text-xs text-slate-300 overflow-x-auto max-h-48 overflow-y-auto">
                                  {typeof log.old_data === 'string' ? log.old_data : JSON.stringify(log.old_data, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.new_data && (
                              <div>
                                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Data Baru</h4>
                                <pre className="bg-navy-lighter rounded-lg p-3 text-xs text-slate-300 overflow-x-auto max-h-48 overflow-y-auto">
                                  {typeof log.new_data === 'string' ? log.new_data : JSON.stringify(log.new_data, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-navy-border flex items-center justify-between">
          <p className="text-xs text-slate-500">{logs.length} data ditampilkan</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-30">← Prev</button>
            <span className="text-sm text-slate-400 px-3 py-1.5">Hal {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={logs.length < 20}
              className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-30">Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, gradient, iconColor, alert }) {
  return (
    <div className={`card bg-gradient-to-br ${gradient} to-transparent ${alert ? 'border-red-500/30 animate-pulse' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{label}</span>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <p className={`text-3xl font-bold ${alert ? 'text-red-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}
