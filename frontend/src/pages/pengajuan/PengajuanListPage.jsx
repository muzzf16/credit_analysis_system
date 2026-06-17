import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, ChevronRight } from 'lucide-react';
import { pengajuanService } from '../../services';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { STATUS_PENGAJUAN, JENIS_KREDIT } from '../../utils/constants';
import useAuthStore from '../../store/authStore';

export default function PengajuanListPage() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    setLoading(true);
    pengajuanService.getAll({ page, limit: 10, search, status: statusFilter || undefined })
      .then(res => { setData(res.data.data); setTotal(res.data.meta?.total || 0); })
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pengajuan Kredit</h1>
          <p className="text-sm text-slate-400">{total} pengajuan</p>
        </div>
        {['ADMIN', 'AO'].includes(user?.role) && (
          <button onClick={() => navigate('/pengajuan/tambah')} className="btn-primary">
            <Plus className="w-4 h-4" /> Buat Pengajuan
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari nama debitur atau no. pengajuan..." className="input-field pl-10" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-auto">
          <option value="">Semua Status</option>
          {Object.entries(STATUS_PENGAJUAN).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-lighter/50">
              <tr>
                <th className="table-header">No. Pengajuan</th>
                <th className="table-header">Debitur</th>
                <th className="table-header">Jenis</th>
                <th className="table-header">Plafon</th>
                <th className="table-header">Tenor</th>
                <th className="table-header">Status</th>
                <th className="table-header">AO</th>
                <th className="table-header">Tanggal</th>
                <th className="table-header">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="table-cell text-center py-12"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="9" className="table-cell text-center py-12 text-slate-500">Belum ada pengajuan</td></tr>
              ) : data.map((p) => {
                const st = STATUS_PENGAJUAN[p.status] || { label: p.status, color: 'badge-gray' };
                return (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => navigate(`/pengajuan/${p.id}`)}>
                    <td className="table-cell font-mono text-xs text-gold">{p.nomor_pengajuan}</td>
                    <td className="table-cell font-medium text-white">{p.debitur_nama}</td>
                    <td className="table-cell"><span className={p.jenis_kredit === 'KONSUMTIF' ? 'badge-info' : 'badge-purple'}>{p.jenis_kredit}</span></td>
                    <td className="table-cell">{formatRupiah(p.plafon_diajukan)}</td>
                    <td className="table-cell">{p.jangka_waktu_bulan} bln</td>
                    <td className="table-cell"><span className={st.color}>{st.label}</span></td>
                    <td className="table-cell text-xs">{p.ao_nama}</td>
                    <td className="table-cell text-xs">{formatDate(p.created_at)}</td>
                    <td className="table-cell"><ChevronRight className="w-4 h-4 text-slate-500" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {total > 10 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-navy-border">
            <p className="text-xs text-slate-500">{(page-1)*10+1}-{Math.min(page*10, total)} dari {total}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-ghost px-3 py-1 text-xs disabled:opacity-30">Prev</button>
              <button onClick={() => setPage(p => p+1)} disabled={page*10 >= total} className="btn-ghost px-3 py-1 text-xs disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
