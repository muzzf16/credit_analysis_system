import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, FileText, MapPin, Shield, Calculator, BarChart3,
  CheckCircle, XCircle, Clock, ChevronRight, Building2, CreditCard,
  AlertTriangle, ThumbsUp, ThumbsDown, Pencil, Sparkles
} from 'lucide-react';
import { pengajuanService, approvalService } from '../../services';
import { formatRupiah, formatDate, formatPercent } from '../../utils/formatters';
import { STATUS_PENGAJUAN, GRADE_COLORS } from '../../utils/constants';
import useAuthStore from '../../store/authStore';

const PIPELINE_STEPS = [
  { key: 'DIAJUKAN', label: 'Diajukan', icon: FileText },
  { key: 'SURVEY', label: 'Survey', icon: MapPin },
  { key: 'ANALISA', label: 'Analisa', icon: Calculator },
  { key: 'SCORING', label: 'Scoring', icon: BarChart3 },
  { key: 'REVIEW_KABID', label: 'Kabid', icon: Shield },
  { key: 'DISETUJUI', label: 'Disetujui', icon: CheckCircle },
];

const STATUS_ORDER = ['DRAFT','DIAJUKAN','SURVEY','ANALISA','SCORING','REVIEW_KABID','KOMITE','DIREKSI','DISETUJUI','DITOLAK'];

export default function PengajuanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('info');
  const [approving, setApproving] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');

  useEffect(() => {
    pengajuanService.getById(id)
      .then(res => setData(res.data.data))
      .catch(() => navigate('/pengajuan'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return null;

  const statusInfo = STATUS_PENGAJUAN[data.status] || { label: data.status, color: 'badge-gray' };
  const currentStep = STATUS_ORDER.indexOf(data.status);

  const handleApproval = async (status) => {
    setApproving(true);
    try {
      const level = data.status === 'SCORING' || data.status === 'REVIEW_KABID' ? 1
        : data.status === 'KOMITE' ? 2 : 3;
      await approvalService.submit({
        pengajuanId: id, level, status,
        plafonDisetujui: data.plafon_diajukan,
        jangkaWaktuDisetujui: data.jangka_waktu_bulan,
        catatan: approvalNote,
      });
      // Reload
      const res = await pengajuanService.getById(id);
      setData(res.data.data);
      setApprovalNote('');
    } catch (err) { alert(err.response?.data?.message || 'Gagal'); }
    setApproving(false);
  };

  const SECTIONS = [
    { key: 'info', label: 'Info Kredit', icon: CreditCard },
    { key: 'debitur', label: 'Debitur', icon: User },
    { key: 'survey', label: 'Survey', icon: MapPin, disabled: !data.survey },
    { key: 'agunan', label: 'Agunan', icon: Building2, disabled: !data.agunan?.length },
    { key: 'slik', label: 'SLIK', icon: Shield, disabled: !data.slik },
    { key: 'analisa', label: 'Analisa', icon: Calculator, disabled: !data.analisaKonsumtif && !data.analisaProduktif },
    { key: 'scoring', label: 'Scoring', icon: BarChart3, disabled: !data.scoring },
    { key: 'approval', label: 'Approval', icon: CheckCircle },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pengajuan')} className="btn-ghost p-2 shrink-0"><ArrowLeft className="w-5 h-5" /></button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-bold font-mono text-gold">{data.nomor_pengajuan}</h1>
              <span className={statusInfo.color}>{statusInfo.label}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 truncate">{data.debitur_nama} • {data.jenis_kredit} • {formatRupiah(data.plafon_diajukan)}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {(!data.slik || data.status === 'DIAJUKAN') && (
            <button onClick={() => navigate(`/slik?pengajuanId=${id}&debiturId=${data.debitur_id}`)} className="btn-secondary text-xs sm:text-sm px-3">
              <Shield className="w-4 h-4 text-gold" /> <span className="hidden xs:inline">Input </span>SLIK
            </button>
          )}
          {['DIAJUKAN', 'SURVEY'].includes(data.status) && ['AO', 'ADMIN'].includes(user?.role) && (
            <button onClick={() => navigate(`/survey/tambah?pengajuanId=${id}`)} className="btn-primary text-xs sm:text-sm px-3"><MapPin className="w-4 h-4" /> Survey</button>
          )}
          {['DIAJUKAN', 'SURVEY'].includes(data.status) && ['AO','ADMIN'].includes(user?.role) && (
            <button onClick={() => navigate(`/agunan?pengajuanId=${id}`)} className="btn-primary text-xs sm:text-sm px-3"><Building2 className="w-4 h-4" /> Agunan</button>
          )}
          {['DIAJUKAN', 'SURVEY', 'ANALISA'].includes(data.status) && ['ANALIS','ADMIN'].includes(user?.role) && (
            <button onClick={() => navigate(`/analisa/${data.jenis_kredit === 'KONSUMTIF' ? 'konsumtif' : 'produktif'}?pengajuanId=${id}`)} className="btn-primary text-xs sm:text-sm px-3"><Calculator className="w-4 h-4" /> Analisa</button>
          )}
          {data.status === 'ANALISA' && ['ANALIS','ADMIN'].includes(user?.role) && (
            <button onClick={() => navigate(`/scoring?pengajuanId=${id}`)} className="btn-primary text-xs sm:text-sm px-3"><BarChart3 className="w-4 h-4" /> Scoring</button>
          )}
          {data.status !== 'DRAFT' && (
            <button onClick={() => navigate(`/mak/${id}`)} className="btn-secondary text-xs sm:text-sm px-3">
              <FileText className="w-4 h-4 text-gold" /> <span className="hidden sm:inline">Cetak / Preview </span>MAK
            </button>
          )}
        </div>
      </div>

      {/* Pipeline Progress */}
      <div className="card">
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {PIPELINE_STEPS.map((step, i) => {
            const stepIdx = STATUS_ORDER.indexOf(step.key);
            const isCompleted = currentStep > stepIdx || data.status === 'DISETUJUI';
            const isCurrent = data.status === step.key || (step.key === 'DISETUJUI' && data.status === 'DISETUJUI');
            const isRejected = data.status === 'DITOLAK';
            return (
              <div key={step.key} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isRejected ? 'bg-red-500/20 border-2 border-red-500' :
                    isCompleted ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' :
                    isCurrent ? 'bg-gold shadow-lg shadow-gold/30 animate-pulse' :
                    'bg-navy-lighter border-2 border-navy-border'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-5 h-5 text-white" /> :
                     isRejected ? <XCircle className="w-5 h-5 text-red-400" /> :
                     <step.icon className={`w-5 h-5 ${isCurrent ? 'text-navy' : 'text-slate-500'}`} />}
                  </div>
                  <span className={`text-[10px] mt-1 font-medium ${isCompleted ? 'text-emerald-400' : isCurrent ? 'text-gold' : 'text-slate-600'}`}>
                    {step.label}
                  </span>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-emerald-500' : 'bg-navy-border'}`} />
                )}
              </div>
            );
          })}
        </div>
        {data.status === 'DITOLAK' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mt-3 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-red-400 font-medium">Pengajuan Ditolak</span>
          </div>
        )}
      </div>

      {/* Section Tabs — scrollable on mobile */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => !s.disabled && setActiveSection(s.key)}
            disabled={s.disabled}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0
              ${activeSection === s.key ? 'bg-navy-light text-gold border border-gold/30' :
                s.disabled ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-navy-lighter'}`}>
            <s.icon className="w-3.5 h-3.5" /> {s.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className="animate-fade-in">
        {activeSection === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-sm font-semibold text-gold mb-4">Detail Kredit</h3>
              <div className="space-y-3">
                <InfoRow label="Nomor Pengajuan" value={data.nomor_pengajuan} mono />
                <InfoRow label="Jenis Kredit" value={data.jenis_kredit} badge />
                <InfoRow label="Tujuan Kredit" value={data.tujuan_kredit} />
                <InfoRow label="Plafon Diajukan" value={formatRupiah(data.plafon_diajukan)} highlight />
                <InfoRow label="Jangka Waktu" value={`${data.jangka_waktu_bulan} bulan`} />
                <InfoRow label="Suku Bunga" value={`${data.suku_bunga}% / tahun`} />
                <InfoRow label="Angsuran/bulan" value={formatRupiah(data.angsuran_perbulan)} highlight />
              </div>
            </div>
            <div className="card">
              <h3 className="text-sm font-semibold text-gold mb-4">Timeline</h3>
              <div className="space-y-3">
                <InfoRow label="AO" value={data.ao_nama} />
                <InfoRow label="Analis" value={data.analis_nama || '-'} />
                <InfoRow label="Tanggal Pengajuan" value={formatDate(data.created_at)} />
                <InfoRow label="Terakhir Update" value={formatDate(data.updated_at)} />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'debitur' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gold">Data Debitur</h3>
              <button onClick={() => navigate(`/debitur/${data.debitur_id}`)} className="btn-ghost text-xs text-gold">Lihat Detail <ChevronRight className="w-3 h-3 inline" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="Nama" value={data.debitur_nama} />
              <InfoRow label="No HP" value={data.debitur_hp} />
            </div>
          </div>
        )}

        {activeSection === 'survey' && data.survey && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-sm font-semibold text-gold mb-4">Hasil Survey</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Tanggal Survey" value={formatDate(data.survey.tanggal_survey)} />
                <InfoRow label="Status" value={data.survey.status} badge />
                <div className="md:col-span-2"><InfoRow label="Kesimpulan" value={data.survey.kesimpulan} /></div>
                <div className="md:col-span-2"><InfoRow label="Rekomendasi" value={data.survey.rekomendasi} /></div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'agunan' && data.agunan?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.agunan.map((a, i) => (
              <div key={a.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <span className="badge-info">{a.jenis_agunan}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Agunan #{i+1}</span>
                    <button
                      onClick={() => navigate(`/agunan/${a.id}/edit`)}
                      className="btn-ghost text-xs text-gold flex items-center gap-1 border border-gold/30 px-2 py-1 rounded-lg hover:bg-gold/10"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <InfoRow label="No. Sertifikat" value={a.nomor_sertifikat} mono />
                  <InfoRow label="Atas Nama" value={a.atas_nama} />
                  <InfoRow label="Luas Tanah" value={a.luas_tanah ? `${a.luas_tanah} m²` : '-'} />
                  <InfoRow label="Nilai Pasar" value={formatRupiah(a.nilai_pasar)} />
                  <InfoRow label="Nilai Taksasi" value={formatRupiah(a.nilai_taksasi)} highlight />
                  <InfoRow label="LTV" value={formatPercent(a.ltv)} />
                  <InfoRow label="Coverage Ratio" value={Number(a.coverage_ratio || 0).toFixed(2) + 'x'} />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'slik' && data.slik && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gold mb-4">Data SLIK</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <MetricBox label="Kolektibilitas Tertinggi" value={data.slik.kolektibilitas_tertinggi} color={data.slik.kolektibilitas_tertinggi <= 2 ? 'emerald' : 'red'} />
                <MetricBox label="Total Fasilitas" value={data.slik.total_fasilitas} />
                <MetricBox label="Total Plafon" value={formatRupiah(data.slik.total_plafon)} />
                <MetricBox label="Baki Debet" value={formatRupiah(data.slik.total_baki_debet)} />
              </div>
              {data.slik.catatan && <InfoRow label="Catatan" value={data.slik.catatan} />}
            </div>

            {/* Detail Fasilitas Table */}
            {data.slik.detail_slik?.length > 0 && (
              <div className="card p-0 overflow-hidden">
                <div className="px-4 py-3 border-b border-navy-border">
                  <h3 className="text-sm font-semibold text-gold">📋 Tabel Fasilitas & Kolektibilitas</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Rincian fasilitas kredit berdasarkan data SLIK OJK</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-navy-light/50 border-b border-navy-border">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">No</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Bank / Lembaga</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Jenis Fasilitas</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Plafon</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Baki Debet</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Mulai</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Jatuh Tempo</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tenor</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Bunga</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Angsuran (Anuitas)</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Kolektibilitas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-border">
                      {(() => {
                        let totalAngsuran = 0;
                        const rows = data.slik.detail_slik.map((f, idx) => {
                          const kol = Number(f.kolektibilitas || 0);
                          const kolColor = kol === 1 ? 'text-emerald-400 bg-emerald-500/10' :
                                           kol === 2 ? 'text-amber-400 bg-amber-500/10' :
                                           kol === 3 ? 'text-orange-400 bg-orange-500/10' :
                                           kol >= 4  ? 'text-red-400 bg-red-500/10' : 'text-slate-400 bg-slate-500/10';
                          const kolLabel = kol === 1 ? 'Lancar' : kol === 2 ? 'DPK' : kol === 3 ? 'Kurang Lancar' : kol === 4 ? 'Diragukan' : kol === 5 ? 'Macet' : '-';
                          const jenisBersih = (f.jenisFasilitas || '-').replace(/^\/PEMBIAYAAN\s+/i, '').replace(/\t/g, ' ').trim();
                          
                          // Calculate tenor in months
                          let tenorBulan = 0;
                          if (f.tanggalMulai && f.jatuhTempo) {
                            const start = new Date(f.tanggalMulai);
                            const end = new Date(f.jatuhTempo);
                            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                              tenorBulan = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                            }
                          }
                          if (tenorBulan <= 0) tenorBulan = 0;

                          // Annuity monthly installment calculation
                          let angsuranAnuitas = 0;
                          const plafon = Number(f.plafon || 0);
                          const rateTahunan = Number(f.sukuBunga || 0);
                          if (plafon > 0 && rateTahunan > 0 && tenorBulan > 0) {
                            const rateBulanan = (rateTahunan / 100) / 12;
                            angsuranAnuitas = (plafon * rateBulanan * Math.pow(1 + rateBulanan, tenorBulan)) / (Math.pow(1 + rateBulanan, tenorBulan) - 1);
                            if (isNaN(angsuranAnuitas) || !isFinite(angsuranAnuitas)) {
                              angsuranAnuitas = 0;
                            }
                          }
                          totalAngsuran += angsuranAnuitas;

                          return (
                            <tr key={idx} className="hover:bg-navy-light/20 transition-colors">
                              <td className="px-4 py-3 text-slate-500 text-xs">{idx + 1}</td>
                              <td className="px-4 py-3 font-medium text-white text-xs">{f.bank || '-'}</td>
                              <td className="px-4 py-3 text-slate-300 text-xs max-w-48">
                                <span className="line-clamp-2">{jenisBersih}</span>
                              </td>
                              <td className="px-4 py-3 text-right text-xs font-mono text-slate-200">{formatRupiah(f.plafon)}</td>
                              <td className="px-4 py-3 text-right text-xs font-mono font-semibold text-gold">{formatRupiah(f.bakiDebet)}</td>
                              <td className="px-4 py-3 text-center text-xs text-slate-300">
                                {f.tanggalMulai ? new Date(f.tanggalMulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                              </td>
                              <td className="px-4 py-3 text-center text-xs text-slate-300">
                                {f.jatuhTempo ? new Date(f.jatuhTempo).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                              </td>
                              <td className="px-4 py-3 text-center text-xs text-slate-300">
                                {tenorBulan ? `${tenorBulan} bln` : '-'}
                              </td>
                              <td className="px-4 py-3 text-center text-xs text-slate-300">
                                {rateTahunan ? `${rateTahunan}%` : '-'}
                              </td>
                              <td className="px-4 py-3 text-right text-xs font-mono font-semibold text-emerald-400">
                                {angsuranAnuitas ? formatRupiah(angsuranAnuitas) : '-'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${kolColor}`}>
                                  {kol} - {kolLabel}
                                </span>
                              </td>
                            </tr>
                          );
                        });

                        return (
                          <>
                            {rows}
                            <tr className="bg-navy-light/40 border-t border-navy-border font-bold text-white">
                              <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-slate-400">TOTAL</td>
                              <td className="px-4 py-3 text-right text-xs font-mono">{formatRupiah(data.slik.total_plafon)}</td>
                              <td className="px-4 py-3 text-right text-xs font-mono text-gold">{formatRupiah(data.slik.total_baki_debet)}</td>
                              <td colSpan={4}></td>
                              <td className="px-4 py-3 text-right text-xs font-mono text-emerald-400">{formatRupiah(totalAngsuran)}</td>
                              <td></td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!data.slik.detail_slik || data.slik.detail_slik.length === 0) && (
              <div className="card text-center py-8 text-slate-500 text-sm">
                Tidak ada detail fasilitas SLIK yang tersedia.
              </div>
            )}
          </div>
        )}


        {activeSection === 'analisa' && (
          <div className="space-y-4">
            {data.analisaKonsumtif && (
              <div className="card">
                <h3 className="text-sm font-semibold text-gold mb-4">Analisa Konsumtif</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricBox label="Total Penghasilan" value={formatRupiah(data.analisaKonsumtif.total_penghasilan)} />
                  <MetricBox label="Disposable Income" value={formatRupiah(data.analisaKonsumtif.disposable_income)} />
                  <MetricBox label="DSR" value={formatPercent(data.analisaKonsumtif.dsr)} color={data.analisaKonsumtif.dsr <= 40 ? 'emerald' : 'red'} />
                  <MetricBox label="RPC" value={formatPercent(data.analisaKonsumtif.rpc)} color={data.analisaKonsumtif.rpc >= 110 ? 'emerald' : 'red'} />
                </div>
                <div className={`mt-4 text-center py-2 rounded-lg font-semibold text-sm ${data.analisaKonsumtif.status_kelayakan === 'LAYAK' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {data.analisaKonsumtif.status_kelayakan}
                </div>
              </div>
            )}
            {data.analisaProduktif && (
              <div className="card">
                <h3 className="text-sm font-semibold text-gold mb-4">Analisa Produktif</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricBox label="Rata-rata Omset" value={formatRupiah(data.analisaProduktif.rata_omset)} />
                  <MetricBox label="Laba Bersih" value={formatRupiah(data.analisaProduktif.laba_bersih)} />
                  <MetricBox label="DSCR" value={Number(data.analisaProduktif.dscr || 0).toFixed(2)} color={Number(data.analisaProduktif.dscr || 0) >= 1.2 ? 'emerald' : 'red'} />
                  <MetricBox label="NPM" value={formatPercent(data.analisaProduktif.net_profit_margin)} />
                </div>
                <div className={`mt-4 text-center py-2 rounded-lg font-semibold text-sm ${data.analisaProduktif.status_kelayakan === 'LAYAK' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {data.analisaProduktif.status_kelayakan}
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'scoring' && data.scoring && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-gold">Credit Scoring 5C</h3>
              <div className="flex items-center gap-3">
                <span className={`text-4xl font-bold ${GRADE_COLORS[data.scoring.grade]}`}>{data.scoring.grade}</span>
                <div>
                  <p className="text-2xl font-bold">{data.scoring.total_score}</p>
                  <p className="text-xs text-slate-500">{data.scoring.rekomendasi?.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <ScoreBar label="Character" score={data.scoring.char_score} bobot={data.scoring.char_bobot} />
              <ScoreBar label="Capacity" score={data.scoring.cap_score} bobot={data.scoring.cap_bobot} />
              <ScoreBar label="Capital" score={data.scoring.capital_score} bobot={data.scoring.capital_bobot} />
              <ScoreBar label="Collateral" score={data.scoring.coll_score} bobot={data.scoring.coll_bobot} />
              <ScoreBar label="Condition" score={data.scoring.cond_score} bobot={data.scoring.cond_bobot} />
            </div>
          </div>
        )}

        {activeSection === 'approval' && (
          <div className="space-y-4">
            {/* AI Credit Analyst Recommendation */}
            {data.aiNarrative && (
              <div className="card border-purple-500/20 bg-purple-950/10">
                <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" /> Hasil Rekomendasi AI Credit Analyst
                </h3>
                <div className="space-y-2 text-sm text-slate-300">
                  <p><strong>Executive Summary:</strong> {data.aiNarrative.narrative_data?.executiveSummary || '-'}</p>
                  <p><strong>Rekomendasi AI:</strong> <span className="font-semibold text-purple-300">{data.aiNarrative.narrative_data?.recommendation || '-'}</span></p>
                  {data.aiNarrative.narrative_data?.riskAssessment && (
                    <p><strong>Aspek Risiko:</strong> {data.aiNarrative.narrative_data?.riskAssessment}</p>
                  )}
                  {data.aiNarrative.narrative_data?.mitigation && (
                    <p><strong>Mitigasi Risiko:</strong> {data.aiNarrative.narrative_data?.mitigation}</p>
                  )}
                  <div className="pt-2">
                    <button 
                      onClick={() => navigate(`/mak/${id}`)}
                      className="text-xs text-purple-400 hover:text-purple-300 underline font-semibold flex items-center gap-1"
                    >
                      Lihat Selengkapnya di Memorandum Analisa Kredit (MAK)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Existing Approvals */}
            {data.approvals?.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-semibold text-gold mb-4">Riwayat Approval</h3>
                <div className="space-y-3">
                  {data.approvals.map(a => (
                    <div key={a.id} className={`bg-navy-lighter/50 rounded-lg p-4 border ${
                      a.status === 'APPROVED' ? 'border-emerald-500/30' : a.status === 'REJECTED' ? 'border-red-500/30' : 'border-navy-border'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {a.status === 'APPROVED' ? <ThumbsUp className="w-4 h-4 text-emerald-400" /> :
                           a.status === 'REJECTED' ? <ThumbsDown className="w-4 h-4 text-red-400" /> :
                           <Clock className="w-4 h-4 text-amber-400" />}
                          <span className="font-medium">{a.approver_nama || `Level ${a.level}`}</span>
                          <span className="text-xs text-slate-500">({a.approver_role})</span>
                        </div>
                        <span className={a.status === 'APPROVED' ? 'badge-success' : a.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}>
                          {a.status}
                        </span>
                      </div>
                      {a.catatan && <p className="text-sm text-slate-400">{a.catatan}</p>}
                      {a.plafon_disetujui && <p className="text-xs text-slate-500 mt-1">Plafon disetujui: {formatRupiah(a.plafon_disetujui)}</p>}
                      <p className="text-xs text-slate-600 mt-1">{formatDate(a.approved_at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approval Action */}
            {['SCORING', 'REVIEW_KABID', 'KOMITE', 'DIREKSI'].includes(data.status) &&
             ['KABID', 'DIREKSI', 'ADMIN'].includes(user?.role) && (
              <div className="card border-gold/20">
                <h3 className="text-sm font-semibold text-gold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Tindakan Approval
                </h3>
                <div className="mb-4">
                  <label className="label">Catatan</label>
                  <textarea value={approvalNote} onChange={e => setApprovalNote(e.target.value)} rows={3} className="input-field" placeholder="Catatan approval..." />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleApproval('REJECTED')} disabled={approving}
                    className="btn-danger flex-1"><ThumbsDown className="w-4 h-4" /> Tolak</button>
                  <button onClick={() => handleApproval('APPROVED')} disabled={approving}
                    className="btn-primary flex-1"><ThumbsUp className="w-4 h-4" /> Setujui</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, highlight, badge }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-medium ${mono ? 'font-mono text-gold' : highlight ? 'text-gold font-semibold' : badge ? 'badge-info' : 'text-white'}`}>
        {value || '-'}
      </span>
    </div>
  );
}

function MetricBox({ label, value, color = 'white' }) {
  const colors = { emerald: 'text-emerald-400', red: 'text-red-400', white: 'text-white' };
  return (
    <div className="bg-navy-lighter/50 rounded-lg p-3 text-center">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
}

function ScoreBar({ label, score, bobot }) {
  const percentage = score || 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-20">{label} ({bobot}%)</span>
      <div className="flex-1 h-3 bg-navy-lighter rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${
          percentage >= 80 ? 'bg-emerald-500' : percentage >= 60 ? 'bg-gold' : 'bg-red-500'
        }`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-sm font-bold w-10 text-right">{Number(percentage || 0).toFixed(0)}</span>
    </div>
  );
}
