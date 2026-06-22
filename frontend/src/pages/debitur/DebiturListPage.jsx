import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit, FileText, ChevronRight, Trash2 } from 'lucide-react';
import { debiturService } from '../../services';
import { formatDate, maskNik } from '../../utils/formatters';
import useAuthStore from '../../store/authStore';

export default function DebiturListPage() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await debiturService.getAll({ page, limit: 10, search });
      setData(res.data.data);
      setTotal(res.data.meta?.total || 0);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page, search]);

  const handleDelete = async (id, nama) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus debitur ${nama}?`)) {
      try {
        await debiturService.delete(id);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Gagal menghapus debitur');
      }
    }
  };

  const Pagination = () => total > 10 ? (
    <div className="flex items-center justify-between px-4 py-3 border-t border-navy-border">
      <p className="text-xs text-slate-500">Menampilkan {(page-1)*10+1}-{Math.min(page*10, total)} dari {total}</p>
      <div className="flex gap-1">
        <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-ghost px-3 py-1 text-xs disabled:opacity-30">Prev</button>
        <button onClick={() => setPage(p => p+1)} disabled={page*10 >= total} className="btn-ghost px-3 py-1 text-xs disabled:opacity-30">Next</button>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Data Debitur</h1>
          <p className="text-sm text-slate-400">{total} debitur terdaftar</p>
        </div>
        {['ADMIN', 'AO'].includes(user?.role) && (
          <button onClick={() => navigate('/debitur/tambah')} className="btn-primary w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Tambah Debitur
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari nama atau NIK..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="sm:hidden card p-0 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">Belum ada data debitur</div>
        ) : data.map((d) => (
          <div key={d.id} className="flex items-start justify-between gap-3 px-4 py-4 border-b border-navy-border last:border-0">
            <div className="flex-1 min-w-0" onClick={() => navigate(`/debitur/${d.id}`)}>
              <p className="font-semibold text-white truncate">{d.nama}</p>
              <p className="text-xs font-mono text-slate-400 mt-0.5">{d.nik_display || maskNik(d.nik)}</p>
              <p className="text-xs text-slate-500 mt-1">{d.no_hp} · {d.kecamatan}</p>
              <p className="text-xs text-slate-500 mt-0.5">AO: {d.ao_nama} &nbsp;
                <span className="badge-info text-[10px]">{d.jumlah_pengajuan} Pengajuan</span>
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => navigate(`/debitur/${d.id}`)} className="btn-ghost p-2"><Eye className="w-4 h-4" /></button>
              <button onClick={() => navigate(`/debitur/${d.id}/edit`)} className="btn-ghost p-2"><Edit className="w-4 h-4" /></button>
              <button onClick={() => navigate(`/pengajuan/tambah?debiturId=${d.id}`)} className="btn-ghost p-2 text-gold"><FileText className="w-4 h-4" /></button>
              {['ADMIN', 'AO'].includes(user?.role) && (
                <button onClick={() => handleDelete(d.id, d.nama)} className="btn-ghost p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
          </div>
        ))}
        <Pagination />
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-lighter/50">
              <tr>
                <th className="table-header">No</th>
                <th className="table-header">Nama</th>
                <th className="table-header">NIK</th>
                <th className="table-header">No HP</th>
                <th className="table-header">Kecamatan</th>
                <th className="table-header">AO</th>
                <th className="table-header">Pengajuan</th>
                <th className="table-header">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="table-cell text-center py-12">
                  <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="8" className="table-cell text-center py-12 text-slate-500">Belum ada data debitur</td></tr>
              ) : data.map((d, i) => (
                <tr key={d.id} className="hover:bg-white/5 transition-colors">
                  <td className="table-cell">{(page - 1) * 10 + i + 1}</td>
                  <td className="table-cell font-medium text-white">{d.nama}</td>
                  <td className="table-cell font-mono text-xs">{d.nik_display || maskNik(d.nik)}</td>
                  <td className="table-cell">{d.no_hp}</td>
                  <td className="table-cell">{d.kecamatan}</td>
                  <td className="table-cell">{d.ao_nama}</td>
                  <td className="table-cell"><span className="badge-info">{d.jumlah_pengajuan}</span></td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`/debitur/${d.id}`)} className="btn-ghost p-1.5" title="Detail"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => navigate(`/debitur/${d.id}/edit`)} className="btn-ghost p-1.5" title="Edit"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => navigate(`/pengajuan/tambah?debiturId=${d.id}`)} className="btn-ghost p-1.5 text-gold" title="Buat Pengajuan"><FileText className="w-4 h-4" /></button>
                      {['ADMIN', 'AO'].includes(user?.role) && (
                        <button onClick={() => handleDelete(d.id, d.nama)} className="btn-ghost p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination />
      </div>
    </div>
  );
}
