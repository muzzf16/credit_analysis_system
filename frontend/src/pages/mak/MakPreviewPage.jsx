import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, FileCheck, Loader2, Building2 } from 'lucide-react';
import { makService } from '../../services';
import { formatRupiah, formatDate, formatPercent } from '../../utils/formatters';

// Helper for Indonesian Terbilang (number to words conversion)
function terbilang(angka) {
  const bil = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  let temp = "";
  const n = parseInt(angka) || 0;
  if (n < 12) {
    temp = " " + bil[n];
  } else if (n < 20) {
    temp = terbilang(n - 10) + " belas";
  } else if (n < 100) {
    temp = terbilang(Math.floor(n / 10)) + " puluh" + terbilang(n % 10);
  } else if (n < 200) {
    temp = " seratus" + terbilang(n - 100);
  } else if (n < 1000) {
    temp = terbilang(Math.floor(n / 100)) + " ratus" + terbilang(n % 100);
  } else if (n < 2000) {
    temp = " seribu" + terbilang(n - 1000);
  } else if (n < 1000000) {
    temp = terbilang(Math.floor(n / 1000)) + " ribu" + terbilang(n % 1000);
  } else if (n < 1000000000) {
    temp = terbilang(Math.floor(n / 1000000)) + " juta" + terbilang(n % 1000000);
  } else if (n < 1000000000000) {
    temp = terbilang(Math.floor(n / 1000000000)) + " milyar" + terbilang(n % 1000000000);
  }
  return temp.trim();
}

function formatTerbilangRupiah(angka) {
  if (!angka) return '-';
  const kata = terbilang(angka);
  return (kata.charAt(0).toUpperCase() + kata.slice(1) + " Rupiah").trim();
}

// Helper to calculate age in Years & Months
function hitungUmur(tanggalLahir) {
  if (!tanggalLahir) return '-';
  const birthDate = new Date(tanggalLahir);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    years--;
    months = 12 + months;
  }
  return `${years} TAHUN ${months} BULAN`;
}

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

  const mak = data || {};
  const pengajuan = mak.pengajuan || {};
  const pasangan = mak.pasangan || {};
  const pekerjaan = mak.pekerjaan || {};
  const usaha = mak.usaha || {};
  const survey = mak.survey || {};
  const surveyLingkungan = mak.surveyLingkungan || {};
  const surveyUsaha = mak.surveyUsaha || {};
  const agunanList = mak.agunan || [];
  const slik = mak.slik || {};
  const creditScoring = mak.creditScoring || {};
  const approvalList = mak.approval || [];

  const mainAgunan = agunanList[0] || {};

  // Financial analysis variables mapping
  const isKonsumtif = pengajuan.jenis_kredit === 'KONSUMTIF' || (!mak.analisaProduktif && mak.analisaKonsumtif);
  const financialAnalisa = isKonsumtif ? (mak.analisaKonsumtif || {}) : (mak.analisaProduktif || {});
  
  // SLIK Mapping
  const slikDetail = Array.isArray(slik.detail_slik) ? slik.detail_slik : [];
  const totalPlafonSlik = slikDetail.reduce((sum, item) => sum + (parseFloat(item.plafon) || 0), 0);
  const totalBakiSlik = slikDetail.reduce((sum, item) => sum + (parseFloat(item.bakiDebet) || 0), 0);
  const totalAngsuranSlik = slikDetail.reduce((sum, item) => sum + (parseFloat(item.angsuran) || 0), 0);

  // Aspek Keuangan Mapping
  const pendapatanPemohon = isKonsumtif ? (parseFloat(financialAnalisa.gaji_pokok || 0) + parseFloat(financialAnalisa.tunjangan || 0)) : parseFloat(financialAnalisa.rata_omset || 0);
  const labelPendapatanPemohon = isKonsumtif ? "- GAJI & TUNJANGAN" : "- RATA-RATA OMSET";
  
  const pendapatanPasangan = isKonsumtif ? parseFloat(financialAnalisa.pendapatan_pasangan || 0) : 0;
  const labelPendapatanPasangan = isKonsumtif ? "- PENDAPATAN PASANGAN" : "-";

  const pendapatanLain = isKonsumtif ? (parseFloat(financialAnalisa.bonus_rata || 0) + parseFloat(financialAnalisa.usaha_sampingan || 0)) : 0;
  const labelPendapatanLain = isKonsumtif ? "- PENDAPATAN LAINNYA" : "-";

  const totalPenghasilan = isKonsumtif ? parseFloat(financialAnalisa.total_penghasilan || 0) : parseFloat(financialAnalisa.laba_bersih || 0);
  const rpcPercent = isKonsumtif ? (parseFloat(financialAnalisa.rpc) || 90) : 90;
  const rpcAmount = (totalPenghasilan * rpcPercent) / 100;
  const angsuranEksisting = isKonsumtif ? parseFloat(financialAnalisa.cicilan_existing || 0) : 0;
  const sisaPendapatan = totalPenghasilan - angsuranEksisting;
  
  const angsuranDiajukan = isKonsumtif ? parseFloat(financialAnalisa.angsuran_diajukan || 0) : parseFloat(pengajuan.angsuran_perbulan || 0);
  const prosentaseAngsuran = totalPenghasilan > 0 ? (angsuranDiajukan / totalPenghasilan) * 100 : 0;
  const statusLayak = isKonsumtif ? financialAnalisa.status_kelayakan : financialAnalisa.status_kelayakan;

  // Signature names based on roles
  const pengusulName = pengajuan.ao_nama || "DIAN WICAKSANA ADI";
  const kabidName = "EVI NOVIANTI, SE";
  const peKepatuhanName = "DINA SAPTARIANI, SE";
  const direkturName = "IFAN ARDANA, S.E., M.Si.";
  const komiteName3 = "SAPTO NUGROHO, S.E, M.Si";

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
            <p className="text-sm text-slate-400">Preview dokumen cetak MAK BPR BAPERA</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-secondary text-sm">
            <Printer className="w-4 h-4" /> Cetak Laporan
          </button>
          {!mak.mak && (
            <button onClick={handleGenerate} disabled={generating} className="btn-primary text-sm">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
              Generate MAK
            </button>
          )}
        </div>
      </div>

      {/* MAK Printable Document container */}
      <div className="card p-0 overflow-hidden border-0 shadow-none bg-transparent">
        <div id="mak-document" className="bg-white text-gray-900 mx-auto max-w-4xl print:max-w-none print:p-0">
          
          {/* ============================================================ */}
          {/* PAGE 1: OPINI KEPATUHAN */}
          {/* ============================================================ */}
          <div className="print-page border-2 border-gray-800 p-8 mb-8 bg-white relative">
            <div className="text-center mb-6">
              <h1 className="text-lg font-bold underline tracking-wider uppercase">OPINI KEPATUHAN</h1>
            </div>

            <div className="space-y-4 text-xs">
              <h3 className="font-bold underline">Data Debitur</h3>
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="w-1/4 py-1 font-semibold">Nama Debitur</td>
                    <td className="w-2 py-1">:</td>
                    <td className="py-1 uppercase font-semibold">{pengajuan.debitur_nama || '-'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 font-semibold">Plafond (Rp)</td>
                    <td>:</td>
                    <td className="py-1">
                      <span className="font-semibold">Rp {parseFloat(pengajuan.plafon_diajukan || 0).toLocaleString('id-ID')}</span>
                      <span className="ml-4 text-gray-600 font-medium">({formatTerbilangRupiah(pengajuan.plafon_diajukan)})</span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 font-semibold">Jangka Waktu</td>
                    <td>:</td>
                    <td className="py-1">
                      <span className="border border-gray-800 px-3 py-0.5 inline-block font-semibold bg-gray-50">{pengajuan.jangka_waktu_bulan || '-'} Bulan</span>
                      <span className="ml-8 mr-2 font-semibold">Angsuran/bulan :</span>
                      <span className="border border-gray-800 px-3 py-0.5 inline-block font-semibold bg-gray-50">Rp {parseFloat(pengajuan.angsuran_perbulan || 0).toLocaleString('id-ID')}</span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 font-semibold">Alamat Debitur</td>
                    <td>:</td>
                    <td className="py-1 uppercase">{pengajuan.alamat || '-'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 font-semibold">Jenis Kredit</td>
                    <td>:</td>
                    <td className="py-1">
                      <span className="border border-gray-800 px-3 py-0.5 inline-block font-semibold bg-gray-50 uppercase">{pengajuan.jenis_kredit || '-'}</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-4">
                <div className="border border-gray-800 bg-gray-50 py-1.5 text-center font-bold uppercase tracking-wider">
                  Catatan Kepatuhan
                </div>
                <table className="w-full text-[10px] border border-gray-800 border-t-0 border-collapse">
                  <tbody>
                    {[
                      ["1.", "Pemberian kredit kepada calon debitur besar...", "Ya / Tidak", false],
                      ["2.", "Keterkaitan dengan BPR...", "terkait / tidak terkait", false],
                      ["3.", "Kredit kepada PEP...", "ya / tidak", false],
                      ["4.", "Histori pinjaman bermasalah pada bank lain...", "ada / tidak", true], // check 'tidak'
                      ["5.", "Kredit restrukturisasi yang bernilai besar...", "Ya / Tidak", false],
                      ["6.", "Kredit Sindikasi...", "Ya / Tidak", false],
                      ["7.", "Kredit melebihi batas BMPK baik untuk perorangan, kelompok maupun pihak terkait...", "Ya / Tidak", false],
                      ["8.", "Kredit ber-resiko lain yang memerlukan pertimbangan untuk memitigasi potensi resiko yang akan diambil...", "Ya / Tidak", false]
                    ].map(([no, q, opt, checked], idx) => (
                      <tr key={idx} className="border-b border-gray-400">
                        <td className="px-2 py-1 w-6 text-center align-top">{no}</td>
                        <td className="px-2 py-1 align-top">{q}</td>
                        <td className="px-2 py-1 w-32 text-right font-semibold whitespace-nowrap align-top">
                          {idx === 3 ? (
                            <span>ada / <span className="underline relative font-bold text-gray-950">tidak ✔</span></span>
                          ) : idx === 1 ? (
                            <span>terkait / <span className="underline">tidak terkait</span></span>
                          ) : (
                            <span>Ya / <span className="underline">Tidak</span></span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Dynamic handwritten opinion simulation */}
              <div className="border border-gray-800 p-4 min-h-[220px] rounded-sm font-serif italic text-blue-900 bg-blue-50/20 leading-relaxed text-[11px] whitespace-pre-line">
                {`# Pengajuan pinjaman a.n ${pengajuan.debitur_nama || '-'}
                - plafon Rp ${(parseFloat(pengajuan.plafon_diajukan || 0)).toLocaleString('id-ID')}.-   - jangka waktu ${pengajuan.jangka_waktu_bulan || '-'} Bulan
                - suku bunga ${parseFloat(pengajuan.suku_bunga || 0).toFixed(2)}%   - provisi ${parseFloat(pengajuan.provisi || 0).toFixed(2)}%   - jenis kredit ${pengajuan.jenis_kredit || '-'}
                
                Telah sesuai dengan ketentuan dalam SK DIR No. 581/573.1/KPTS/DIR/IV/2025 dan SE No. 09/SE/III/2026. ✔
                
                # Agunan ${mainAgunan.jenis_agunan || 'SHM'} a.n ${mainAgunan.atas_nama || pengajuan.debitur_nama || '-'} pastikan untuk dapat dilakukan pengikatan sesuai SK DIR No. 581/582/KPTS/DIR/V/2025 ✔
                
                # Pengajuan pinjaman a.n ${pengajuan.debitur_nama || '-'} ${totalBakiSlik > 0 ? 'terdapat pinjaman' : 'tidak terdapat pinjaman bermasalah'} di bank lain, pantau kelancaran pembayaran angsuran ✔`}
              </div>

              <div className="text-right mt-6">
                <p>Batang, {formatDate(new Date())}</p>
              </div>

              <div className="grid grid-cols-2 gap-12 mt-6">
                <div className="text-center">
                  <p className="font-semibold mb-16">PE Kepatuhan</p>
                  <div className="font-semibold underline uppercase">{peKepatuhanName}</div>
                </div>
                <div className="text-center">
                  <p className="font-semibold mb-16">Direktur</p>
                  <div className="font-semibold underline uppercase">{direkturName}</div>
                </div>
              </div>

            </div>
          </div>

          {/* ============================================================ */}
          {/* PAGE 2: MEMORANDUM ANALISA KREDIT KONSUMTIF */}
          {/* ============================================================ */}
          <div className="print-page border-2 border-gray-800 p-8 mb-8 bg-white relative page-break-before">
            <div className="text-center mb-6">
              <h1 className="text-sm font-bold tracking-wider uppercase underline">MEMORANDUM ANALISA KREDIT KONSUMTIF</h1>
              <p className="text-[10px] text-gray-600 mt-1">Kepada: Yth. Direktur Utama PT. BPR BAPERA BATANG<br />Perihal: Permohonan Persetujuan Kredit</p>
            </div>

            <div className="space-y-4 text-xs">
              <h3 className="font-bold uppercase text-gray-950">A. DATA UMUM PEMOHON</h3>
              <table className="w-full text-[11px] border border-gray-400 border-collapse">
                <tbody>
                  {[
                    ['Nama Pemohon', pengajuan.debitur_nama],
                    ['Tempat, tanggal lahir', `${pengajuan.tempat_lahir || '-'}, ${formatDate(pengajuan.tanggal_lahir)}`],
                    ['Umur', hitungUmur(pengajuan.tanggal_lahir)],
                    ['Kewarganegaraan', 'WNI'],
                    ['Alamat', pengajuan.alamat],
                    ['Perusahaan / Instansi', pekerjaan.nama_instansi || '-'],
                    ['Jabatan', pekerjaan.jabatan || '-'],
                    ['NIP', pekerjaan.nip || '-'],
                    ['Nama gadis ibu kandung', 'TURAH'],
                    ['Usaha diluar instansi', '-'],
                    ['Klasifikasi usaha', 'KECIL/SEDANG/BESAR'],
                    ['N P W P (plafond 100 jt keatas)', '-'],
                    ['Hubungan dengan Bank', 'NASABAH LAMA'],
                    ['Kredit yang sedang dinikmati', slik.total_fasilitas || '0']
                  ].map(([label, value], idx) => (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="w-2/5 px-2 py-1 font-semibold text-gray-700 bg-gray-50">{label}</td>
                      <td className="w-2 text-center">:</td>
                      <td className="px-2 py-1 uppercase">{value || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4">
                <h4 className="font-bold mb-1 text-[11px]">Catatan SLIK</h4>
                <table className="w-full text-[10px] border border-gray-500 border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-500">
                      <th className="border-r border-gray-500 px-1.5 py-1 text-left">NAMA BANK</th>
                      <th className="border-r border-gray-500 px-1.5 py-1 text-right">PLAFOND</th>
                      <th className="border-r border-gray-500 px-1.5 py-1 text-right">BAKI DEBET</th>
                      <th className="border-r border-gray-500 px-1.5 py-1 text-center">JW</th>
                      <th className="border-r border-gray-500 px-1.5 py-1 text-center">BUNGA</th>
                      <th className="border-r border-gray-500 px-1.5 py-1 text-center">KOL</th>
                      <th className="px-1.5 py-1 text-right">ANGSURAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slikDetail.length > 0 ? slikDetail.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-400">
                        <td className="border-r border-gray-400 px-1.5 py-0.5">{item.bank || '-'}</td>
                        <td className="border-r border-gray-400 px-1.5 py-0.5 text-right">{(parseFloat(item.plafon)||0).toLocaleString('id-ID')}</td>
                        <td className="border-r border-gray-400 px-1.5 py-0.5 text-right">{(parseFloat(item.bakiDebet)||0).toLocaleString('id-ID')}</td>
                        <td className="border-r border-gray-400 px-1.5 py-0.5 text-center">{item.jatuhTempo || '-'}</td>
                        <td className="border-r border-gray-400 px-1.5 py-0.5 text-center">-</td>
                        <td className="border-r border-gray-400 px-1.5 py-0.5 text-center">{item.kolektibilitas || 1}</td>
                        <td className="px-1.5 py-0.5 text-right">{(parseFloat(item.angsuran)||0).toLocaleString('id-ID')}</td>
                      </tr>
                    )) : (
                      <tr className="border-b border-gray-400">
                        <td colSpan="7" className="px-1.5 py-2 text-center text-gray-500 italic">Data fasilitas kredit (SLIK) kosong atau tidak ada.</td>
                      </tr>
                    )}
                    <tr className="font-bold bg-gray-50 border-t border-gray-500">
                      <td className="border-r border-gray-400 px-1.5 py-0.5">TOTAL</td>
                      <td className="border-r border-gray-400 px-1.5 py-0.5 text-right">{totalPlafonSlik.toLocaleString('id-ID')}</td>
                      <td className="border-r border-gray-400 px-1.5 py-0.5 text-right">{totalBakiSlik.toLocaleString('id-ID')} ✔</td>
                      <td className="border-r border-gray-400 px-1.5 py-0.5 text-center">-</td>
                      <td className="border-r border-gray-400 px-1.5 py-0.5 text-center">-</td>
                      <td className="border-r border-gray-400 px-1.5 py-0.5 text-center">-</td>
                      <td className="px-1.5 py-0.5 text-right">{totalAngsuranSlik.toLocaleString('id-ID')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <h3 className="font-bold uppercase text-gray-950">B. ASPEK KEUANGAN</h3>
                
                <div className="pl-4">
                  <h4 className="font-semibold text-gray-900">B.1. Data Pendapatan dan Pengeluaran per Bulan</h4>
                  <table className="w-full text-[10px] mt-1">
                    <tbody>
                      <tr>
                        <td className="py-0.5">A. Penghasilan per bulan yang diterima Pemohon</td>
                        <td className="py-0.5 text-right uppercase">{labelPendapatanPemohon}</td>
                        <td className="py-0.5 text-right w-24">Rp {pendapatanPemohon.toLocaleString('id-ID')}</td>
                      </tr>
                      <tr>
                        <td>&nbsp;&nbsp;&nbsp;Penghasilan bersih istri / suami Pemohon</td>
                        <td className="text-right uppercase">{labelPendapatanPasangan}</td>
                        <td className="text-right">Rp {pendapatanPasangan.toLocaleString('id-ID')}</td>
                      </tr>
                      <tr>
                        <td>&nbsp;&nbsp;&nbsp;Pendapatan lain (yang dapat diverifikasi)</td>
                        <td className="text-right uppercase">{labelPendapatanLain}</td>
                        <td className="text-right">Rp {pendapatanLain.toLocaleString('id-ID')}</td>
                      </tr>
                      <tr className="font-bold border-t border-gray-300">
                        <td className="py-1">C. Penghasilan bersih/ Take Home Pay (THP)</td>
                        <td></td>
                        <td className="text-right py-1">Rp {totalPenghasilan.toLocaleString('id-ID')}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">D. Repayment Capacity (RPC) -&gt; {rpcPercent}%</td>
                        <td></td>
                        <td className="text-right py-0.5">Rp {rpcAmount.toLocaleString('id-ID')}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">G. Total Angsuran Kredit eksisting (apabila ada)</td>
                        <td></td>
                        <td className="text-right py-0.5">Rp {angsuranEksisting.toLocaleString('id-ID')}</td>
                      </tr>
                      <tr className="font-bold border-t border-gray-300">
                        <td className="py-1">H. Sisa pendapatan per bulan</td>
                        <td></td>
                        <td className="text-right py-1">Rp {sisaPendapatan.toLocaleString('id-ID')}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h4 className="font-semibold text-gray-900 mt-4">B.2. Analisa kebutuhan Kredit</h4>
                  <table className="w-full text-[10px] mt-1 border-t border-gray-400">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="py-0.5">- Penghasilan bersih debitur per bulan sebesar</td>
                        <td className="text-right">Rp {totalPenghasilan.toLocaleString('id-ID')}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-0.5">- Repayment Capacity (RPC) = {rpcPercent}% x Penghasilan bersih debitur</td>
                        <td className="text-right">Rp {rpcAmount.toLocaleString('id-ID')}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-0.5">- Sisa pendapatan</td>
                        <td className="text-right">Rp {sisaPendapatan.toLocaleString('id-ID')}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-0.5">- Status Kelayakan Angsuran</td>
                        <td className="text-right uppercase">{statusLayak || 'BELUM DIANALISA'} ✔</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-0.5">&gt; diusulkan jangka waktu kredit ( n ) = <span className="font-semibold ml-6">{pengajuan.jangka_waktu_bulan || 0} bulan</span></td>
                        <td className="text-right"></td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-0.5">- Suku bunga kredit ( i ) =</td>
                        <td className="text-right">{parseFloat(pengajuan.suku_bunga || 0).toFixed(2)}%</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-0.5">- Diusulkan Kredit sebesar</td>
                        <td className="text-right">Rp {parseFloat(pengajuan.plafon_diajukan || 0).toLocaleString('id-ID')}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-0.5">- Angsuran Kredit/bulan =</td>
                        <td className="text-right">Rp {angsuranDiajukan.toLocaleString('id-ID')}</td>
                      </tr>
                      <tr className="font-bold border-b-2 border-gray-800 bg-gray-50">
                        <td className="py-1">- Prosentase Angsuran Kredit terhadap penghasilan per bulan</td>
                        <td className="text-right py-1">{prosentaseAngsuran.toFixed(2)}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>

          {/* ============================================================ */}
          {/* PAGE 3: LAPORAN PENILAIAN JAMINAN */}
          {/* ============================================================ */}
          <div className="print-page border-2 border-gray-800 p-8 mb-8 bg-white relative page-break-before">
            <div className="text-center mb-6">
              <h1 className="text-sm font-bold tracking-wider uppercase underline">LAPORAN PENILAIAN JAMINAN</h1>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 text-[11px] mb-2">
                <div>
                  <p><span className="font-semibold w-24 inline-block">Nama</span>: {pengajuan.debitur_nama || '-'}</p>
                  <p><span className="font-semibold w-24 inline-block">Alamat</span>: {pengajuan.alamat || '-'}</p>
                  <p><span className="font-semibold w-24 inline-block">Usaha</span>: {pekerjaan.nama_instansi || '-'}</p>
                </div>
                <div>
                  <p><span className="font-semibold w-36 inline-block">Sertifikat No Hak Milik</span>: {mainAgunan.nomor_sertifikat || '-'}</p>
                </div>
              </div>

              <div className="border border-gray-800 bg-gray-100 py-1 text-center font-bold uppercase tracking-wider text-[10px]">
                IDENTIFIKASI TANAH DI LAPANGAN
              </div>

              <div className="space-y-3 pl-2 text-[11px]">
                <div>
                  <h4 className="font-bold">1. LOKASI TANAH</h4>
                  <div className="pl-4 space-y-1">
                    <p><span className="w-40 inline-block">a. Lokasi / Letak Jaminan</span></p>
                    <p className="pl-4"><span className="w-36 inline-block">Rt / Rw</span>: {mainAgunan.rt_rw || surveyLingkungan.rt_rw || '-'}</p>
                    <p className="pl-4"><span className="w-36 inline-block">Kelurahan/Kecamatan</span>: {mainAgunan.kelurahan || '-'} / {mainAgunan.kecamatan || '-'}</p>
                    <p className="pl-4"><span className="w-36 inline-block">Kabupaten/Kota</span>: {mainAgunan.kabupaten || pengajuan.kabupaten || '-'}</p>
                    <p><span className="w-40 inline-block">b. Batas-batas tanah</span></p>
                    <p className="pl-4"><span className="w-36 inline-block">Utara</span>: {mainAgunan.batas_utara || '-'}</p>
                    <p className="pl-4"><span className="w-36 inline-block">Timur</span>: {mainAgunan.batas_timur || '-'}</p>
                    <p className="pl-4"><span className="w-36 inline-block">Selatan</span>: {mainAgunan.batas_selatan || '-'}</p>
                    <p className="pl-4"><span className="w-36 inline-block">Barat</span>: {mainAgunan.batas_barat || '-'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold">2. BENTUK DAN UKURAN TANAH</h4>
                  <div className="pl-4 space-y-1">
                    <p>a. Bentuk tanah: {mainAgunan.bentuk_tanah || '-'}</p>
                    <p>b. Permukaan tanah: {mainAgunan.permukaan_tanah || '-'}</p>
                    <p>c. Akses jalan masuk: {mainAgunan.akses_jalan || '-'}</p>
                    <p>d. Jenis jalan: {mainAgunan.jenis_jalan || '-'}</p>
                    <p>e. Luas tanah: <span className="border-b border-gray-800 px-4 font-semibold">{mainAgunan.luas_tanah || '-'} m²</span></p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold">3. STRUKTUR BANGUNAN</h4>
                  <table className="w-full ml-4 text-[10px]">
                    <tbody>
                      <tr>
                        <td className="w-44 py-0.5">- Lantai Bangunan</td>
                        <td className="w-2">:</td>
                        <td className="py-0.5">{mainAgunan.lantai_bangunan || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">- Luas Tanah</td>
                        <td>:</td>
                        <td className="py-0.5 font-semibold">{mainAgunan.luas_tanah || '-'} m²</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">- Luas Bangunan</td>
                        <td>:</td>
                        <td className="py-0.5 font-semibold">{mainAgunan.luas_bangunan || '-'} m²</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">- Rangka atap</td>
                        <td>:</td>
                        <td className="py-0.5">{mainAgunan.rangka_atap || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">- Penutup Atap</td>
                        <td>:</td>
                        <td className="py-0.5">{mainAgunan.penutup_atap || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">- Dinding</td>
                        <td>:</td>
                        <td className="py-0.5">{mainAgunan.dinding || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">- Fasilitas Listrik</td>
                        <td>:</td>
                        <td className="py-0.5">{mainAgunan.fasilitas_listrik || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">- Fasilitas Air</td>
                        <td>:</td>
                        <td className="py-0.5">{mainAgunan.fasilitas_air || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 className="font-bold">4. PENILAIAN</h4>
                  <div className="pl-4 space-y-2">
                    <p><strong>a. NILAI PASAR</strong></p>
                    <p className="pl-2 leading-relaxed">
                      Berdasarkan metode pendekatan pasar maka kami berpendapat bahwa Nilai Pasar Wajar (NPW) agunan tersebut pada tanggal {formatDate(new Date())} adalah sebesar <strong>Rp {parseFloat(mainAgunan.nilai_pasar || 0).toLocaleString('id-ID')}</strong> ({formatTerbilangRupiah(mainAgunan.nilai_pasar || 0)}).
                    </p>
                    <p><strong>b. NILAI TAKSASI</strong></p>
                    <p className="pl-2 leading-relaxed">
                      Dengan mempertimbangkan kondisi, letak, dan sarana pelengkap setelah dikurangi penyusutan, maka kami berpendapat bahwa Nilai Taksasi dari agunan tersebut adalah sebesar <strong>Rp {parseFloat(mainAgunan.nilai_taksasi || 0).toLocaleString('id-ID')}</strong> ({formatTerbilangRupiah(mainAgunan.nilai_taksasi || 0)}).
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ============================================================ */}
          {/* PAGE 4: JAMINAN KREDIT, ASURANSI, USULAN & SIGNATURES */}
          {/* ============================================================ */}
          <div className="print-page border-2 border-gray-800 p-8 mb-8 bg-white relative page-break-before">
            <div className="space-y-6 text-xs">
              <div>
                <h3 className="font-bold uppercase text-gray-950 text-[11px] mb-2">C. JAMINAN KREDIT</h3>
                <table className="w-full text-[9px] border border-gray-500 border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-500">
                      <th className="border-r border-gray-500 p-1 text-center">Jenis Jaminan</th>
                      <th className="border-r border-gray-500 p-1 text-left">Alamat Jaminan</th>
                      <th className="border-r border-gray-500 p-1 text-center">LT / LB (m2)</th>
                      <th className="border-r border-gray-500 p-1 text-center">Jenis</th>
                      <th className="border-r border-gray-500 p-1 text-center">Jenis & No Dok</th>
                      <th className="p-1 text-left">Atas Nama</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-400">
                      <td className="border-r border-gray-400 p-1 text-center font-semibold">{mainAgunan.jenis_agunan || 'SHM'}</td>
                      <td className="border-r border-gray-400 p-1 uppercase">{mainAgunan.alamat_agunan || '-'}</td>
                      <td className="border-r border-gray-400 p-1 text-center">{mainAgunan.luas_tanah || '-'}</td>
                      <td className="border-r border-gray-400 p-1 text-center">TANAH DAN BANGUNAN</td>
                      <td className="border-r border-gray-400 p-1 text-center font-mono text-[8px]">SHM {mainAgunan.nomor_sertifikat || '-'}</td>
                      <td className="p-1 uppercase">{mainAgunan.atas_nama || '-'}</td>
                    </tr>
                  </tbody>
                </table>

                <table className="w-full text-[9px] border border-gray-500 border-t-0 border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-500">
                      <th className="border-r border-gray-500 p-1 text-right">Nilai Pasar</th>
                      <th className="border-r border-gray-500 p-1 text-right">NJOP</th>
                      <th className="border-r border-gray-500 p-1 text-right">Nilai Taksasi</th>
                      <th className="border-r border-gray-500 p-1 text-center">Jenis Notariil</th>
                      <th className="border-r border-gray-500 p-1 text-right">Nilai Pengikatan</th>
                      <th className="p-1 text-center">LTV</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border-r border-gray-400 p-1 text-right font-semibold">Rp {parseFloat(mainAgunan.nilai_pasar || 0).toLocaleString('id-ID')}</td>
                      <td className="border-r border-gray-400 p-1 text-right">Rp {parseFloat(mainAgunan.nilai_njop || 0).toLocaleString('id-ID')}</td>
                      <td className="border-r border-gray-400 p-1 text-right">Rp {parseFloat(mainAgunan.nilai_taksasi || 0).toLocaleString('id-ID')}</td>
                      <td className="border-r border-gray-400 p-1 text-center">APHT</td>
                      <td className="border-r border-gray-400 p-1 text-right font-semibold">Rp {parseFloat(mainAgunan.nilai_likuidasi || 0).toLocaleString('id-ID')}</td>
                      <td className="p-1 text-center font-bold text-emerald-600">{parseFloat(mainAgunan.ltv || 0).toFixed(2)}% AMAN / LAYAK</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-[8px] text-gray-500 mt-1">Keterangan: Sumber pengembalian kredit berasal dari GAJI/TPP/TPG Ybs dengan kuasa potong gaji, atau debet rekening</p>
              </div>

              <div>
                <h3 className="font-bold uppercase text-gray-950 text-[11px] mb-2">D. ASURANSI</h3>
                <table className="w-full text-[10px] border border-gray-500 border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-500">
                      <th className="border-r border-gray-500 p-1 w-1/3 text-left">Poin Penilaian</th>
                      <th className="p-1 text-left">Hasil Penilaian</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border-r border-gray-400 p-1.5 align-top font-semibold">Kondisi kesehatan debitur</td>
                      <td className="p-1.5 align-top">
                        Contoh: Debitur telah mengisi Surat Pernyataan Kesehatan (SPK)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="font-bold uppercase text-gray-950 text-[11px] mb-2">E. USULAN</h3>
                <p className="text-[10px] mb-2">Berdasarkan data-data tersebut diatas, perkenankan kami usulkan permohonan kredit:</p>
                <table className="w-full text-[10px] border border-gray-400 border-collapse">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="w-2/5 p-1.5 font-semibold bg-gray-50">Atas nama</td>
                      <td className="p-1.5 uppercase font-semibold">{pengajuan.debitur_nama || '-'}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-1.5 font-semibold bg-gray-50">Alamat</td>
                      <td className="p-1.5 uppercase">{pengajuan.alamat || '-'}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-1.5 font-semibold bg-gray-50">Jenis Kredit</td>
                      <td className="p-1.5 uppercase font-semibold">{pengajuan.jenis_kredit || '-'}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-1.5 font-semibold bg-gray-50">Plafond</td>
                      <td className="p-1.5 font-semibold">
                        Rp {parseFloat(pengajuan.plafon_diajukan || 0).toLocaleString('id-ID')}
                        <span className="ml-4 text-gray-500 font-medium">({formatTerbilangRupiah(pengajuan.plafon_diajukan)})</span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-1.5 font-semibold bg-gray-50">Penggunaan</td>
                      <td className="p-1.5">BIAYA PENDIDIKAN SEKOLAH ANAK</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-1.5 font-semibold bg-gray-50">Jangka Waktu</td>
                      <td className="p-1.5">{pengajuan.jangka_waktu_bulan || '-'} Bulan</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-1.5 font-semibold bg-gray-50">Provisi / Suku Bunga</td>
                      <td className="p-1.5">2,00% / 15,00% Anuitas</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-1.5 font-semibold bg-gray-50">Jaminan Kredit</td>
                      <td className="p-1.5 uppercase">{mainAgunan.jenis_agunan || 'SHM'}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-1.5 font-semibold bg-gray-50">Pembayaran angsuran</td>
                      <td className="p-1.5">Potong gaji/TPP/TPG/SUMBER PENGHASILAN LAIN setiap bulan</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-1.5 font-semibold bg-gray-50">Akad Kredit</td>
                      <td className="p-1.5">Bawah Tangan</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-semibold bg-gray-50">Ketentuan Lain</td>
                      <td className="p-1.5 leading-relaxed">
                        Debitur wajib mengikuti Program Asuransi/Penjaminan. Debitur menyetujui dan menandatangani Surat Pernyataan Kebenaran Data terkait dokumen kuesioner kesehatan.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-12 mt-12 text-center text-[10px]">
                <div>
                  <p className="font-semibold">Kabid. Kredit</p>
                  <div className="h-16"></div>
                  <div className="font-semibold underline uppercase">{kabidName}</div>
                </div>
                <div>
                  <p>Batang, {formatDate(new Date())}</p>
                  <p className="font-semibold">Yang Mempersiapkan</p>
                  <div className="h-16"></div>
                  <div className="font-semibold underline uppercase">{pengusulName}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* PAGE 5: CATATAN / COVENANT */}
          {/* ============================================================ */}
          <div className="print-page border-2 border-gray-800 p-8 bg-white relative page-break-before">
            <div className="text-center mb-6">
              <h1 className="text-sm font-bold tracking-wider uppercase underline">CATATAN / COVENANT</h1>
            </div>

            <div className="space-y-4 text-xs">
              <table className="w-full border border-gray-800 border-collapse text-[10px]">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-800">
                    <th className="border-r border-gray-800 px-2 py-1.5 w-1/4 text-center">JABATAN</th>
                    <th className="px-2 py-1.5 text-center">CATATAN / COVENANT</th>
                  </tr>
                </thead>
                <tbody>
                  
                  {/* Row 1: Pengusul Kredit */}
                  <tr className="border-b border-gray-800">
                    <td className="border-r border-gray-800 p-2 align-top text-center">
                      <div className="font-semibold uppercase mb-1">Pengusul Kredit</div>
                      <div className="text-[9px] text-gray-500 mb-10">TTD</div>
                      <div className="font-bold underline text-[9px]">{pengusulName}</div>
                    </td>
                    <td className="p-2 align-top font-serif italic text-blue-900 bg-blue-50/10 leading-relaxed text-[11px]">
                      Setuju 75 Jt / 84 Bulan.
                    </td>
                  </tr>

                  {/* Row 2: Kabid Kredit / Komite */}
                  <tr className="border-b border-gray-800">
                    <td className="border-r border-gray-800 p-2 align-top text-center">
                      <div className="font-semibold uppercase mb-1">Komite</div>
                      <div className="text-[9px] text-gray-500 mb-10">TTD</div>
                      <div className="font-bold underline text-[9px]">{kabidName}</div>
                    </td>
                    <td className="p-2 align-top font-serif italic text-blue-900 bg-blue-50/10 leading-relaxed text-[11px]">
                      Acc 75 Juta / 84 Bulan
                    </td>
                  </tr>

                  {/* Row 3: Direksi / Komite */}
                  <tr>
                    <td className="border-r border-gray-800 p-2 align-top text-center">
                      <div className="font-semibold uppercase mb-1">Komite</div>
                      <div className="text-[9px] text-gray-500 mb-10">TTD</div>
                      <div className="font-bold underline text-[9px]">{komiteName3}</div>
                    </td>
                    <td className="p-2 align-top font-serif italic text-blue-900 bg-blue-50/10 leading-relaxed text-[11px]">
                      {`- Proses SOP\n- Prinsip Kehati-hatian\n- APHT\n- Mitigasi resiko\n- Pastikan repayment capacity/kemampuan\n- Hrs/wajib OTS sblm PK/cair\n- Tertib Adm\n- Monitoring angs`}
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        .print-page {
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        @media print {
          body { 
            background: white !important; 
            color: black !important;
          }
          .print\\:hidden, nav, aside, header, .sidebar, [class*="btn-"], button { 
            display: none !important; 
          }
          .card { 
            border: none !important; 
            box-shadow: none !important; 
            background: white !important; 
            padding: 0 !important;
          }
          #mak-document { 
            padding: 0 !important; 
            max-width: none !important; 
            width: 100% !important;
          }
          .print-page {
            box-shadow: none !important;
            border: 2px solid black !important;
            padding: 1.5cm !important;
            page-break-before: always !important;
            page-break-after: always !important;
            min-height: 297mm; /* Standard A4 height */
          }
          .print-page:first-of-type {
            page-break-before: avoid !important;
          }
          table {
            border-color: black !important;
          }
          td, th {
            border-color: black !important;
          }
          @page { 
            margin: 0; 
            size: A4; 
          }
        }
      `}</style>
    </div>
  );
}
