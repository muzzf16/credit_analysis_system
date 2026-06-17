import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Activity, User, CreditCard, Calendar, DollarSign,
  CheckCircle, Clock, AlertTriangle, XCircle, Loader2
} from 'lucide-react';
import { monitoringService } from '../../services';
import { formatRupiah, formatDate } from '../../utils/formatters';

const PAYMENT_STATUS = {
  BELUM: { label: 'Belum Bayar', color: 'badge-gray', icon: Clock, dot: 'bg-slate-400' },
  TEPAT_WAKTU: { label: 'Tepat Waktu', color: 'badge-success', icon: CheckCircle, dot: 'bg-emerald-500' },
  TERLAMBAT: { label: 'Terlambat', color: 'badge-warning', icon: AlertTriangle, dot: 'bg-yellow-500' },
  TUNGGAK: { label: 'Tunggak', color: 'badge-danger', icon: XCircle, dot: 'bg-red-500' },
};

const KOLEKTIBILITAS_COLORS = {
  1: 'text-emerald-400',
  2: 'text-blue-400',
  3: 'text-yellow-400',
  4: 'text-orange-400',
  5: 'text-red-400',
};

export default function MonitoringDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ tanggal_bayar: '', jumlah_dibayar: '', denda: 0, catatan: '' });
  const [submitting, setSubmitting] = useState(false);
  const [lateDays, setLateDays] = useState(0);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await monitoringService.getById(id);
      setData(res.data.data);
    } catch {
      navigate('/monitoring');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (paymentModal && paymentForm.tanggal_bayar) {
      const jatuhTempo = new Date(paymentModal.tanggal_jatuh_tempo);
      const bayar = new Date(paymentForm.tanggal_bayar);
      const diff = Math.ceil((bayar - jatuhTempo) / (1000 * 60 * 60 * 24));
      setLateDays(diff > 0 ? diff : 0);
    } else {
      setLateDays(0);
    }
  }, [paymentForm.tanggal_bayar, paymentModal]);

  const handlePayment = async () => {
    setSubmitting(true);
    try {
      await monitoringService.recordPayment(id, {
        angsuran_ke: paymentModal.angsuran_ke,
        ...paymentForm,
      });
      setPaymentModal(null);
      setPaymentForm({ tanggal_bayar: '', jumlah_dibayar: '', denda: 0, catatan: '' });
      loadData();
      alert('Pembayaran berhasil dicatat!');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mencatat pembayaran');
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!data) return null;

  const totalKredit = data.plafon || 0;
  const totalBayar = data.total_dibayar || 0;
  const progressPercent = totalKredit > 0 ? Math.min((totalBayar / totalKredit) * 100, 100) : 0;
  const jadwal = data.jadwal_pembayaran || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/monitoring')} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-gold" /> Detail Monitoring
          </h1>
          <p className="text-sm text-slate-400">{data.nomor_pengajuan}</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Debitur Info */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gold mb-4 flex items-center gap-2">
            <User className="w-4 h-4" /> Data Debitur
          </h3>
          <div className="space-y-3">
            <InfoRow label="Nama" value={data.debitur_nama} />
            <InfoRow label="NIK" value={data.debitur_nik} mono />
            <InfoRow label="No. HP" value={data.debitur_hp} />
            <InfoRow label="Alamat" value={data.debitur_alamat} />
            <InfoRow label="Pekerjaan" value={data.debitur_pekerjaan} />
          </div>
        </div>

        {/* Kredit Info */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gold mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Info Kredit
          </h3>
          <div className="space-y-3">
            <InfoRow label="Plafon" value={formatRupiah(data.plafon)} highlight />
            <InfoRow label="Tenor" value={`${data.tenor || '-'} bulan`} />
            <InfoRow label="Suku Bunga" value={`${data.suku_bunga || '-'}%`} />
            <InfoRow label="Angsuran/bulan" value={formatRupiah(data.angsuran)} highlight />
            <InfoRow label="Tanggal Pencairan" value={formatDate(data.tanggal_pencairan)} />
            <InfoRow label="Jatuh Tempo Akhir" value={formatDate(data.tanggal_jatuh_tempo_akhir)} />
            <InfoRow label="Kolektibilitas" value={
              <span className={`text-lg font-bold ${KOLEKTIBILITAS_COLORS[data.kolektibilitas] || 'text-white'}`}>
                {data.kolektibilitas}
              </span>
            } />
            <InfoRow label="Status" value={
              <span className={data.status === 'AKTIF' ? 'badge-success' : data.status === 'LUNAS' ? 'badge-info' : 'badge-danger'}>
                {data.status}
              </span>
            } />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gold flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Progress Pembayaran
          </h3>
          <span className="text-sm text-slate-400">
            {formatRupiah(totalBayar)} / {formatRupiah(totalKredit)}
          </span>
        </div>
        <div className="h-4 bg-navy-lighter rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-gold to-amber-500"
            style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-slate-500">0%</span>
          <span className="text-sm font-semibold text-gold">{progressPercent.toFixed(1)}%</span>
          <span className="text-xs text-slate-500">100%</span>
        </div>
      </div>

      {/* Payment Schedule Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-navy-border">
          <h3 className="text-sm font-semibold text-gold flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Jadwal Pembayaran
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-center">Ke-</th>
                <th className="table-header">Jatuh Tempo</th>
                <th className="table-header">Tanggal Bayar</th>
                <th className="table-header text-right">Jumlah</th>
                <th className="table-header text-center">Status</th>
                <th className="table-header text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {jadwal.length === 0 ? (
                <tr><td colSpan={6} className="table-cell text-center py-8 text-slate-500">Tidak ada jadwal pembayaran</td></tr>
              ) : jadwal.map(row => {
                const ps = PAYMENT_STATUS[row.status] || PAYMENT_STATUS.BELUM;
                return (
                  <tr key={row.angsuran_ke} className="hover:bg-navy-lighter/30 transition-colors">
                    <td className="table-cell text-center font-semibold">{row.angsuran_ke}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-sm">{formatDate(row.tanggal_jatuh_tempo)}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      {row.tanggal_bayar ? (
                        <span className="text-sm">{formatDate(row.tanggal_bayar)}</span>
                      ) : (
                        <span className="text-sm text-slate-600">-</span>
                      )}
                    </td>
                    <td className="table-cell text-right">
                      {row.jumlah ? (
                        <span className="font-mono text-sm">{formatRupiah(row.jumlah)}</span>
                      ) : (
                        <span className="text-sm text-slate-600">-</span>
                      )}
                    </td>
                    <td className="table-cell text-center">
                      <span className={ps.color}>{ps.label}</span>
                    </td>
                    <td className="table-cell text-center">
                      {row.status === 'BELUM' && data.status === 'AKTIF' && (
                        <button onClick={() => {
                          setPaymentModal(row);
                          setPaymentForm({ tanggal_bayar: '', jumlah_dibayar: data.angsuran || '', denda: 0, catatan: '' });
                        }} className="btn-primary text-xs py-1 px-3">
                          <DollarSign className="w-3 h-3" /> Bayar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setPaymentModal(null)}>
          <div className="card w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gold mb-1 flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> Pembayaran Angsuran #{paymentModal.angsuran_ke}
            </h3>
            <p className="text-xs text-slate-400 mb-4">Jatuh tempo: {formatDate(paymentModal.tanggal_jatuh_tempo)}</p>

            <div className="space-y-4">
              <div>
                <label className="label">Tanggal Bayar</label>
                <input type="date" className="input-field" value={paymentForm.tanggal_bayar}
                  onChange={e => setPaymentForm(p => ({ ...p, tanggal_bayar: e.target.value }))} />
                {lateDays > 0 && (
                  <div className="flex items-center gap-2 mt-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400">Terlambat <strong>{lateDays} hari</strong> dari jatuh tempo</span>
                  </div>
                )}
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
                {lateDays > 0 && (
                  <p className="text-xs text-slate-500 mt-1">* Denda keterlambatan dapat dihitung otomatis oleh sistem</p>
                )}
              </div>
              <div>
                <label className="label">Catatan</label>
                <textarea className="input-field" rows={2} placeholder="Catatan pembayaran..."
                  value={paymentForm.catatan} onChange={e => setPaymentForm(p => ({ ...p, catatan: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setPaymentModal(null)} className="btn-ghost flex-1">Batal</button>
              <button onClick={handlePayment}
                disabled={submitting || !paymentForm.tanggal_bayar || !paymentForm.jumlah_dibayar}
                className="btn-primary flex-1">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Konfirmasi Bayar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono, highlight }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-slate-500">{label}</span>
      {typeof value === 'string' || typeof value === 'number' ? (
        <span className={`text-sm font-medium ${mono ? 'font-mono text-gold' : highlight ? 'text-gold font-semibold' : 'text-white'}`}>
          {value || '-'}
        </span>
      ) : value}
    </div>
  );
}
