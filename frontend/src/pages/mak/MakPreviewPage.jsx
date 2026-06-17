import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, FileCheck, Loader2, Building2 } from 'lucide-react';
import { makService } from '../../services';
import { formatRupiah, formatDate, formatPercent } from '../../utils/formatters';
import { GRADE_COLORS } from '../../utils/constants';

const FIVE_C = [
  { key: 'character', label: 'Character', color: '#10B981' },
  { key: 'capacity', label: 'Capacity', color: '#F59E0B' },
  { key: 'capital', label: 'Capital', color: '#3B82F6' },
  { key: 'collateral', label: 'Collateral', color: '#8B5CF6' },
  { key: 'condition', label: 'Condition', color: '#EC4899' },
];

export default function MakPreviewPage() {
  const { pengajuanId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    makService.getData(pengajuanId)
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pengajuanId]);

  const handlePrint = () => window.print();

  const handleGenerate = async () => {
    if (!confirm('Finalisasi MAK? Dokumen tidak dapat diubah setelah digenerate.')) return;
    setGenerating(true);
    try {
      await makService.generate(pengajuanId);
      const res = await makService.getData(pengajuanId);
      setData(res.data.data);
      alert('MAK berhasil digenerate!');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal generate MAK');
    }
    setGenerating(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Mock data structure if API returns null
  const mak = data || {};
  const debitur = mak.debitur || {};
  const kredit = mak.kredit || {};
  const survey = mak.survey || {};
  const agunan = mak.agunan || [];
  const slik = mak.slik || {};
  const analisa = mak.analisa || {};
  const scoring = mak.scoring || {};
  const approvals = mak.approvals || [];

  return (
    <div className="space-y-6">
      {/* Header actions - hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileCheck className="w-6 h-6 text-gold" /> Memorandum Analisa Kredit
            </h1>
            <p className="text-sm text-slate-400">Preview dokumen MAK</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-secondary text-sm">
            <Printer className="w-4 h-4" /> Cetak
          </button>
          {!mak.is_finalized && (
            <button onClick={handleGenerate} disabled={generating} className="btn-primary text-sm">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
              Generate MAK
            </button>
          )}
        </div>
      </div>

      {/* MAK Document */}
      <div className="card p-0 overflow-hidden">
        <div id="mak-document" className="bg-white text-gray-900 p-8 md:p-12 max-w-4xl mx-auto print:p-6 print:max-w-none">

          {/* Document Header */}
          <div className="text-center border-b-4 border-double border-gray-800 pb-4 mb-6">
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center border-2 border-amber-500">
                <Building2 className="w-8 h-8 text-amber-700" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-wide text-gray-900">BPR BAPERA</h1>
                <p className="text-xs text-gray-600 tracking-widest">BANK PERKREDITAN RAKYAT</p>
              </div>
            </div>
            <div className="border-t-2 border-gray-400 mt-3 pt-3">
              <h2 className="text-lg font-bold tracking-wider text-gray-900">MEMORANDUM ANALISA KREDIT</h2>
              <p className="text-sm text-gray-600 mt-1">
                Nomor: <span className="font-semibold">{mak.nomor_mak || '-'}</span>
              </p>
              <p className="text-sm text-gray-600">
                Tanggal: <span className="font-semibold">{formatDate(mak.tanggal || new Date())}</span>
              </p>
            </div>
          </div>

          {/* I. Data Debitur */}
          <MakSection number="I" title="DATA DEBITUR">
            <MakTable rows={[
              ['Nama Lengkap', debitur.nama],
              ['NIK', debitur.nik],
              ['Tempat, Tanggal Lahir', `${debitur.tempat_lahir || '-'}, ${formatDate(debitur.tanggal_lahir)}`],
              ['Alamat', debitur.alamat],
              ['Pekerjaan', debitur.pekerjaan],
              ['No. HP', debitur.no_hp],
              ['Status Pernikahan', debitur.status_nikah],
            ]} />
          </MakSection>

          {/* II. Data Kredit */}
          <MakSection number="II" title="DATA KREDIT">
            <MakTable rows={[
              ['Nomor Pengajuan', kredit.nomor_pengajuan],
              ['Jenis Kredit', kredit.jenis_kredit],
              ['Tujuan Kredit', kredit.tujuan_kredit],
              ['Plafon Diajukan', formatRupiah(kredit.plafon_diajukan)],
              ['Plafon Disetujui', formatRupiah(kredit.plafon_disetujui)],
              ['Jangka Waktu', `${kredit.jangka_waktu || '-'} bulan`],
              ['Suku Bunga', `${kredit.suku_bunga || '-'}% / tahun`],
              ['Angsuran per Bulan', formatRupiah(kredit.angsuran_perbulan)],
            ]} />
          </MakSection>

          {/* III. Hasil Survey */}
          <MakSection number="III" title="HASIL SURVEY">
            <MakTable rows={[
              ['Tanggal Survey', formatDate(survey.tanggal_survey)],
              ['Petugas Survey', survey.petugas],
              ['Kondisi Tempat Tinggal', survey.kondisi_rumah],
              ['Status Kepemilikan', survey.status_kepemilikan_rumah],
              ['Kondisi Usaha', survey.kondisi_usaha],
              ['Kesimpulan', survey.kesimpulan],
              ['Rekomendasi', survey.rekomendasi],
            ]} />
          </MakSection>

          {/* IV. Agunan */}
          <MakSection number="IV" title="DATA AGUNAN">
            {agunan.length > 0 ? (
              <table className="w-full text-sm border border-gray-400">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 px-3 py-2 text-left font-semibold">No</th>
                    <th className="border border-gray-400 px-3 py-2 text-left font-semibold">Jenis</th>
                    <th className="border border-gray-400 px-3 py-2 text-left font-semibold">No. Sertifikat</th>
                    <th className="border border-gray-400 px-3 py-2 text-left font-semibold">Atas Nama</th>
                    <th className="border border-gray-400 px-3 py-2 text-right font-semibold">Nilai Pasar</th>
                    <th className="border border-gray-400 px-3 py-2 text-right font-semibold">Nilai Taksasi</th>
                  </tr>
                </thead>
                <tbody>
                  {agunan.map((a, i) => (
                    <tr key={a.id || i}>
                      <td className="border border-gray-400 px-3 py-2">{i + 1}</td>
                      <td className="border border-gray-400 px-3 py-2">{a.jenis_agunan}</td>
                      <td className="border border-gray-400 px-3 py-2 font-mono text-xs">{a.nomor_sertifikat}</td>
                      <td className="border border-gray-400 px-3 py-2">{a.atas_nama}</td>
                      <td className="border border-gray-400 px-3 py-2 text-right">{formatRupiah(a.nilai_pasar)}</td>
                      <td className="border border-gray-400 px-3 py-2 text-right">{formatRupiah(a.nilai_taksasi)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500 italic">Tidak ada data agunan</p>
            )}
          </MakSection>

          {/* V. SLIK */}
          <MakSection number="V" title="DATA SLIK">
            <MakTable rows={[
              ['Kolektibilitas Tertinggi', slik.kolektibilitas_tertinggi],
              ['Total Fasilitas', slik.total_fasilitas],
              ['Total Plafon', formatRupiah(slik.total_plafon)],
              ['Total Baki Debet', formatRupiah(slik.total_baki_debet)],
              ['Catatan', slik.catatan],
            ]} />
          </MakSection>

          {/* VI. Analisa Keuangan */}
          <MakSection number="VI" title="ANALISA KEUANGAN">
            {analisa.jenis === 'KONSUMTIF' ? (
              <MakTable rows={[
                ['Jenis Analisa', 'Konsumtif'],
                ['Total Penghasilan', formatRupiah(analisa.total_penghasilan)],
                ['Total Pengeluaran', formatRupiah(analisa.total_pengeluaran)],
                ['Disposable Income', formatRupiah(analisa.disposable_income)],
                ['DSR', formatPercent(analisa.dsr)],
                ['RPC', formatPercent(analisa.rpc)],
                ['Status Kelayakan', analisa.status_kelayakan],
              ]} />
            ) : (
              <MakTable rows={[
                ['Jenis Analisa', 'Produktif'],
                ['Rata-rata Omset', formatRupiah(analisa.rata_omset)],
                ['Laba Bersih', formatRupiah(analisa.laba_bersih)],
                ['DSCR', analisa.dscr?.toFixed(2)],
                ['NPM', formatPercent(analisa.net_profit_margin)],
                ['ROA', formatPercent(analisa.roa)],
                ['Status Kelayakan', analisa.status_kelayakan],
              ]} />
            )}
          </MakSection>

          {/* VII. Credit Scoring */}
          <MakSection number="VII" title="CREDIT SCORING (5C)">
            <div className="flex items-center gap-6 mb-6">
              <div className="text-center">
                <div className={`text-5xl font-bold ${scoring.grade ? '' : 'text-gray-400'}`}
                  style={{ color: scoring.grade === 'A' ? '#10B981' : scoring.grade === 'B' ? '#22C55E' : scoring.grade === 'C' ? '#EAB308' : scoring.grade === 'D' ? '#F97316' : '#EF4444' }}>
                  {scoring.grade || '-'}
                </div>
                <div className="text-2xl font-bold text-gray-800 mt-1">{scoring.total_score?.toFixed(1) || '-'}</div>
                <div className="text-xs text-gray-500">{scoring.label || ''}</div>
              </div>
              <div className="flex-1 space-y-3">
                {FIVE_C.map(c => {
                  const score = scoring[c.key] || 0;
                  return (
                    <div key={c.key} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-20 font-medium">{c.label}</span>
                      <div className="flex-1 h-5 bg-gray-200 rounded overflow-hidden">
                        <div className="h-full rounded transition-all" style={{ width: `${score}%`, backgroundColor: c.color }} />
                      </div>
                      <span className="text-xs font-bold text-gray-700 w-8 text-right">{score?.toFixed(0)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <MakTable rows={[
              ['Rekomendasi Scoring', scoring.rekomendasi?.replace(/_/g, ' ')],
              ['Keterangan', scoring.keterangan],
            ]} />
          </MakSection>

          {/* VIII. Rekomendasi */}
          <MakSection number="VIII" title="REKOMENDASI">
            <div className="border border-gray-400 rounded p-4">
              <p className="text-sm leading-relaxed">{mak.rekomendasi || 'Berdasarkan analisa yang telah dilakukan terhadap seluruh aspek penilaian kredit, maka pengajuan kredit ini:'}</p>
              <div className={`text-center py-3 mt-3 rounded font-bold text-lg ${
                mak.status_rekomendasi === 'DISETUJUI' ? 'bg-green-100 text-green-800 border border-green-300' :
                mak.status_rekomendasi === 'DITOLAK' ? 'bg-red-100 text-red-800 border border-red-300' :
                'bg-yellow-100 text-yellow-800 border border-yellow-300'
              }`}>
                {mak.status_rekomendasi === 'DISETUJUI' ? '✅ DIREKOMENDASIKAN UNTUK DISETUJUI' :
                 mak.status_rekomendasi === 'DITOLAK' ? '❌ TIDAK DIREKOMENDASIKAN' :
                 '⚠️ DIREKOMENDASIKAN BERSYARAT'}
              </div>
            </div>
          </MakSection>

          {/* IX. Tanda Tangan */}
          <MakSection number="IX" title="TANDA TANGAN">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
              {[
                { role: 'Account Officer', name: mak.ao_nama },
                { role: 'Analis Kredit', name: mak.analis_nama },
                { role: 'Kabid Kredit', name: mak.kabid_nama },
                { role: 'Direksi', name: mak.direksi_nama },
              ].map((signer, i) => (
                <div key={i} className="text-center">
                  <p className="text-xs text-gray-600 font-medium mb-16">{signer.role}</p>
                  <div className="border-b border-gray-800 mb-1" />
                  <p className="text-sm font-semibold">{signer.name || '(......................)'}</p>
                </div>
              ))}
            </div>
            <div className="text-right mt-8">
              <p className="text-sm text-gray-600">Tanggal: {formatDate(mak.tanggal || new Date())}</p>
            </div>
          </MakSection>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden, nav, aside, header, .sidebar, [class*="btn-"], button { display: none !important; }
          .card { border: none !important; box-shadow: none !important; background: white !important; }
          #mak-document { padding: 0 !important; max-width: none !important; }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>
    </div>
  );
}

function MakSection({ number, title, children }) {
  return (
    <div className="mb-6 page-break-inside-avoid">
      <h3 className="text-sm font-bold text-gray-900 border-b-2 border-gray-300 pb-1 mb-3 uppercase tracking-wide">
        {number}. {title}
      </h3>
      {children}
    </div>
  );
}

function MakTable({ rows }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(([label, value], i) => (
          <tr key={i} className="border-b border-gray-200">
            <td className="py-1.5 pr-4 text-gray-600 font-medium w-2/5 align-top">{label}</td>
            <td className="py-1.5 pr-2 text-gray-600 w-2 align-top">:</td>
            <td className="py-1.5 text-gray-900 font-medium align-top">{value || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
