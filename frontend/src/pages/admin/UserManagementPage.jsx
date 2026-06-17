import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCog, Plus, Edit, Key, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { userService } from '../../services';
import { formatDateTime } from '../../utils/formatters';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '', roleId: 1 });
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      userService.getAll({ limit: 100, search }),
      userService.getRoles()
    ]).then(([uRes, rRes]) => {
      setUsers(uRes.data.data);
      setRoles(rRes.data.data);
    }).finally(() => setLoading(false));
  }, [search]);

  const handleCreate = async () => {
    try {
      await userService.create(form);
      setShowForm(false);
      setForm({ username: '', email: '', password: '', fullName: '', roleId: 1 });
      const res = await userService.getAll({ limit: 100 });
      setUsers(res.data.data);
    } catch (err) { alert(err.response?.data?.message || 'Gagal menambahkan user'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><UserCog className="w-6 h-6 text-gold" /> User Management</h1>
          <p className="text-sm text-slate-400">Kelola pengguna sistem</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> Tambah User</button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari user..." className="input-field pl-10" />
        </div>
      </div>

      {/* Add User Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-navy-light border border-navy-border rounded-2xl p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Tambah User Baru</h3>
            <div className="space-y-3">
              <div><label className="label">Nama Lengkap</label><input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="input-field" /></div>
              <div><label className="label">Username</label><input value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="input-field" /></div>
              <div><label className="label">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" /></div>
              <div><label className="label">Password</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input-field" /></div>
              <div><label className="label">Role</label>
                <select value={form.roleId} onChange={e => setForm({...form, roleId: parseInt(e.target.value)})} className="input-field">
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name} — {r.description}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Batal</button>
              <button onClick={handleCreate} className="btn-primary flex-1">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-navy-lighter/50">
            <tr>
              <th className="table-header">Nama</th>
              <th className="table-header">Username</th>
              <th className="table-header">Email</th>
              <th className="table-header">Role</th>
              <th className="table-header">Status</th>
              <th className="table-header">Login Terakhir</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="table-cell text-center py-12"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-white/5">
                <td className="table-cell font-medium text-white">{u.full_name}</td>
                <td className="table-cell font-mono text-xs">{u.username}</td>
                <td className="table-cell text-xs">{u.email}</td>
                <td className="table-cell"><span className="badge-info">{u.role}</span></td>
                <td className="table-cell">{u.is_active ? <span className="badge-success">Aktif</span> : <span className="badge-danger">Nonaktif</span>}</td>
                <td className="table-cell text-xs">{formatDateTime(u.last_login)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
