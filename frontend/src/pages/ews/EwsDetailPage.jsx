import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldAlert, ArrowLeft, Loader2, Calendar, DollarSign,
  AlertTriangle, CheckCircle, FileText, User, MapPin, BarChart3
} from 'lucide-react';
import { ewsService } from '../../services';
import { formatRupiah } from '../../utils/formatters';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/authStore';

const STATUS_THEMES = {
  AKTIF: 'bg-red-500/20 text-red-300 border-red-500/30',
  RESOLVED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  DISMISSED: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

const PAYMENT_STATUS_THEMES = {
  TEPAT_WAKTU: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  TERLAMBAT: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  TUNGGAK: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  BELUM: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function EwsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Resolution Form State
  const [resolution, setResolution] = useState({ statusAlert: 'RESOLVED', rekomendasi: '', catatan: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDetails();
  }, [id]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const res = await ewsService.getById(id);
      setData(res.data.data);
    } catch (err) {
      toast.error('Gagal memuat detail alert EWS.');
      navigate('/ews');
    }
    setLoading(false);
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ewsService.resolve(id, resolution);
      toast.success(`Alert EWS berhasil di-set ke ${resolution.statusAlert}.`);
      loadDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyelesaikan/mengabaikan alert.');
    }
    setSubmitting(false);
  };

  // Authorize only SPI, DIREKSI, KABID, ADMIN to resolve alerts
  const canResolve = ['ADMIN', 'DIREKSI', 'KABID', 'SPI'].includes(user?.role);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
        <p>Memuat rincian alert EWS...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 text-slate-100 pb-12">
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
            Rincian EWS: {data.nomor_pengajuan}
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Dibuat pada {new Date(data.created_at).toLocaleDateString('id-ID')} {new Date(data.created_at).toLocaleTimeString('id-ID')}
          </p>
        </div>
      </div>

      {/* Main Info Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Financial / Debitur info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Risk Overview */}
          <div className="bg-navy border border-navy-border rounded-xl p-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUS_THEMES[data.status_alert]}`}>
                  EWS ALERT {data.status_alert}
                </span>
                <h2 className="text-lg font-bold text-white mt-3">Detail Pelanggaran Kredit</h2>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs">Tingkat Risiko</p>
                <span className={`text-sm font-bold block mt-1 uppercase ${data.risk_score === 'HIGH' ? 'text-red-400' : data.risk_score === 'MEDIUM' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                  {data.risk_score} RISK
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-navy-border/60">
              <div>
                <p className="text-slate-500 text-xs">Days Past Due (DPD)</p>
                <p className="text-xl font-bold text-white mt-1">{data.dpd} Hari</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Kolektibilitas</p>
                <p className="text-xl font-bold text-white mt-1">Kol {data.kolektibilitas}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Tunggakan</p>
                <p className="text-xl font-bold text-red-400 mt-1">{formatRupiah(data.jumlah_tunggakan)}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Jatuh Tempo</p>
                <p className="text-base font-bold text-white mt-1.5">
                  {data.tanggal_jatuh_tempo ? new Date(data.tanggal_jatuh_tempo).toLocaleDateString('id-ID') : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Debitur Profile */}
          <div className="bg-navy border border-navy-border rounded-xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white border-b border-navy-border/60 pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-gold" /> Profil Debitur & Fasilitas Kredit
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
              <div className="space-y-3">
                <div>
                  <p className="text-slate-500 text-xs">Nama Debitur</p>
                  <p className="text-sm font-semibold text-slate-200 mt-0.5">{data.debitur_nama}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Nomor HP</p>
                  <p className="text-sm font-semibold text-slate-200 mt-0.5">{data.debitur_hp || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Alamat</p>
                  <p className="text-sm font-semibold text-slate-200 mt-0.5 flex items-start gap-1">
                    <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" /> {data.alamat}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-slate-500 text-xs">Jenis Kredit</p>
                  <p className="text-sm font-semibold text-slate-200 mt-0.5">{data.jenis_kredit}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Plafon Diajukan/Disetujui</p>
                  <p className="text-sm font-semibold text-gold mt-0.5">{formatRupiah(data.plafon_diajukan)}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Account Officer (AO)</p>
                  <p className="text-sm font-semibold text-slate-200 mt-0.5">{data.ao_nama || 'Belum di-assign'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Qualitative Indicators */}
          <div className="bg-navy border border-navy-border rounded-xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white border-b border-navy-border/60 pb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gold" /> Faktor Risiko Kualitatif (Visit AO)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-navy-light border border-navy-border">
                  <span className="text-sm text-slate-300">Penurunan Omzet Bisnis</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${data.penurunan_omzet ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                    {data.penurunan_omzet ? 'YA' : 'TIDAK'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-navy-light border border-navy-border">
                  <span className="text-sm text-slate-300">Penurunan Cashflow Utama</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${data.penurunan_cashflow ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                    {data.penurunan_cashflow ? 'YA' : 'TIDAK'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-slate-500 text-xs">Kondisi Agunan Jaminan</p>
                  <p className="text-sm text-slate-200 font-semibold mt-1 p-2.5 rounded-lg bg-navy-light border border-navy-border">
                    {data.kondisi_agunan || 'Normal / Tidak ada masalah dilaporkan'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Kunjungan AO Terakhir</p>
                  <p className="text-sm font-semibold text-slate-300 mt-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    {data.kunjungan_ao_terakhir ? new Date(data.kunjungan_ao_terakhir).toLocaleDateString('id-ID') : 'Belum pernah dikunjungi'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Installment & Payment Schedule */}
          <div className="bg-navy border border-navy-border rounded-xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-navy-border/60">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gold" /> Jadwal & Riwayat Pembayaran Angsuran
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-navy-light text-slate-400 font-medium border-b border-navy-border">
                    <th className="p-4 text-center">Angsuran Ke</th>
                    <th className="p-4">Jatuh Tempo</th>
                    <th className="p-4">Tanggal Bayar</th>
                    <th className="p-4 text-right">Jumlah Angsuran</th>
                    <th className="p-4 text-right">Jumlah Dibayar</th>
                    <th className="p-4 text-right">Denda</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-border/50">
                  {data.pembayaran.map((pay) => (
                    <tr key={pay.id} className="hover:bg-navy-light/35 transition">
                      <td className="p-4 text-center font-bold text-slate-300">{pay.angsuran_ke}</td>
                      <td className="p-4 text-slate-300">{new Date(pay.tanggal_jatuh_tempo).toLocaleDateString('id-ID')}</td>
                      <td className="p-4 text-slate-400">
                        {pay.tanggal_bayar ? new Date(pay.tanggal_bayar).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="p-4 text-right font-semibold text-slate-300">{formatRupiah(pay.jumlah_angsuran)}</td>
                      <td className="p-4 text-right text-slate-300">
                        {pay.jumlah_dibayar ? formatRupiah(pay.jumlah_dibayar) : '-'}
                      </td>
                      <td className="p-4 text-right text-amber-500">
                        {pay.denda > 0 ? formatRupiah(pay.denda) : '-'}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PAYMENT_STATUS_THEMES[pay.status]}`}>
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column - Resolution / Audit Logs */}
        <div className="space-y-6">
          
          {/* Card: Resolve Alert Form */}
          {data.status_alert === 'AKTIF' && (
            <div className="bg-navy border border-navy-border rounded-xl p-6 shadow-xl relative">
              <h2 className="text-base font-bold text-white border-b border-navy-border/60 pb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" /> Resolusi / Tanggapan Komite
              </h2>
              
              {canResolve ? (
                <form onSubmit={handleResolve} className="space-y-4 mt-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Tindakan</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setResolution({ ...resolution, statusAlert: 'RESOLVED' })}
                        className={`py-2 rounded-lg font-semibold border text-sm transition ${
                          resolution.statusAlert === 'RESOLVED'
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/10'
                            : 'bg-navy-light border-navy-border text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        RESOLVE (Selesai)
                      </button>
                      <button
                        type="button"
                        onClick={() => setResolution({ ...resolution, statusAlert: 'DISMISSED' })}
                        className={`py-2 rounded-lg font-semibold border text-sm transition ${
                          resolution.statusAlert === 'DISMISSED'
                            ? 'bg-slate-600 border-slate-500 text-white shadow-lg shadow-slate-900/10'
                            : 'bg-navy-light border-navy-border text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        DISMISS (Abaikan)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1.5">Rekomendasi Tindakan</label>
                    <textarea
                      placeholder="Masukkan rekomendasi (misal: restrukturisasi kredit, penarikan jaminan, pembinaan debitur)..."
                      value={resolution.rekomendasi}
                      onChange={(e) => setResolution({ ...resolution, rekomendasi: e.target.value })}
                      required
                      rows={3}
                      className="w-full bg-navy-light border border-navy-border text-slate-200 rounded-lg p-3 outline-none focus:border-gold text-sm resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1.5">Catatan Evaluasi</label>
                    <textarea
                      placeholder="Catatan tambahan hasil evaluasi komite kredit..."
                      value={resolution.catatan}
                      onChange={(e) => setResolution({ ...resolution, catatan: e.target.value })}
                      rows={3}
                      className="w-full bg-navy-light border border-navy-border text-slate-200 rounded-lg p-3 outline-none focus:border-gold text-sm resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-navy font-bold py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-1.5 text-sm"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Simpan Resolusi
                  </button>
                </form>
              ) : (
                <div className="mt-4 p-4 bg-navy-light border border-navy-border rounded-lg text-slate-500 text-xs text-center">
                  Anda tidak memiliki kewenangan (role) untuk memutus resolusi alert EWS ini. Hanya SPI, Direksi, dan Kabid yang diperbolehkan.
                </div>
              )}
            </div>
          )}

          {/* Card: Resolved Details */}
          {data.status_alert !== 'AKTIF' && (
            <div className="bg-navy border border-navy-border rounded-xl p-6 shadow-xl">
              <h2 className="text-base font-bold text-white border-b border-navy-border/60 pb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" /> Hasil Penyelesaian Alert
              </h2>
              
              <div className="space-y-4 mt-4 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">Status Resolusi</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border inline-block mt-1 ${STATUS_THEMES[data.status_alert]}`}>
                    {data.status_alert}
                  </span>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Diselesaikan oleh</p>
                  <p className="text-slate-200 font-semibold mt-0.5">{data.resolved_by_nama || 'System / Auto-Resolve'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Waktu Penyelesaian</p>
                  <p className="text-slate-200 font-semibold mt-0.5">
                    {data.resolved_at ? new Date(data.resolved_at).toLocaleDateString('id-ID') : '-'} {data.resolved_at ? new Date(data.resolved_at).toLocaleTimeString('id-ID') : ''}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Rekomendasi Komite</p>
                  <p className="text-slate-300 italic p-3 rounded-lg bg-navy-light border border-navy-border mt-1">
                    "{data.rekomendasi || 'Tidak ada rekomendasi tertulis'}"
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Catatan Tambahan</p>
                  <p className="text-slate-300 italic p-3 rounded-lg bg-navy-light border border-navy-border mt-1">
                    "{data.catatan || 'Tidak ada catatan tambahan'}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Audit Alert Trigger log */}
          <div className="bg-navy border border-navy-border rounded-xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white border-b border-navy-border/60 pb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold" /> Log Kejadian Alert
            </h2>
            <div className="relative border-l-2 border-navy-border pl-4 space-y-5 mt-4 text-xs">
              <div className="relative">
                <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-4 ring-red-500/20" />
                <p className="text-slate-500 font-medium">
                  {new Date(data.created_at).toLocaleDateString('id-ID')}
                </p>
                <p className="text-slate-200 font-semibold mt-1">Alert EWS Dipicu: {data.trigger_type}</p>
                <p className="text-slate-400 mt-0.5">Sistem mendeteksi tunggakan / DPD sebesar {data.dpd} hari.</p>
              </div>

              {data.alert_sent_at && (
                <div className="relative">
                  <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 bg-blue-500 rounded-full ring-4 ring-blue-500/20" />
                  <p className="text-slate-500 font-medium">
                    {new Date(data.alert_sent_at).toLocaleDateString('id-ID')}
                  </p>
                  <p className="text-slate-200 font-semibold mt-1">Notifikasi Terkirim</p>
                  <p className="text-slate-400 mt-0.5">WhatsApp dikirim ke AO dan log in-app alert diterbitkan.</p>
                </div>
              )}

              {data.resolved_at && (
                <div className="relative">
                  <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-4 ring-emerald-500/20" />
                  <p className="text-slate-500 font-medium">
                    {new Date(data.resolved_at).toLocaleDateString('id-ID')}
                  </p>
                  <p className="text-slate-200 font-semibold mt-1">Alert Ditutup: {data.status_alert}</p>
                  <p className="text-slate-400 mt-0.5">Tanggapan dicatat dan alert dinonaktifkan.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
