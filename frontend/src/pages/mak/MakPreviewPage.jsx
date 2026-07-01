import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, FileCheck, Loader2, Building2, Sparkles } from 'lucide-react';
import { makService, aiService } from '../../services';
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
  const [aiNarrative, setAiNarrative] = useState(null);
  const [loadingAi, setLoadingAi] = useState(true);
  const [generatingAi, setGeneratingAi] = useState(false);

  useEffect(() => {
    makService.getData(pengajuanId)
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    aiService.getNarrative(pengajuanId)
      .then(res => {
        if (res.data && res.data.success && res.data.data) {
          setAiNarrative(res.data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAi(false));
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

  const handleGenerateAi = async () => {
    setGeneratingAi(true);
    try {
      const res = await aiService.generateNarrative(pengajuanId);
      if (res.data && res.data.success && res.data.data) {
        setAiNarrative(res.data.data);
        alert('AI Narrative berhasil di-generate!');
      } else {
        alert('Gagal generate AI Narrative.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal generate AI Narrative.');
    } finally {
      setGeneratingAi(false);
    }
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
  const slikDetailPasangan = Array.isArray(slik.detail_slik_pasangan) ? slik.detail_slik_pasangan : [];
  
  const calculateSlikDetails = (details) => {
    return details.map(item => {
      let tenorBulan = "-";
      if (item.tanggalMulai && item.jatuhTempo) {
        const start = new Date(item.tanggalMulai);
        const end = new Date(item.jatuhTempo);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          tenorBulan = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        }
      }
      if (tenorBulan <= 0) tenorBulan = "-";

      let angsuranAnuitas = 0;
      const plafon = Number(item.plafon || 0);
      const rateTahunan = Number(item.sukuBunga || 0);
      if (plafon > 0 && rateTahunan > 0 && typeof tenorBulan === 'number' && tenorBulan > 0) {
        const rateBulanan = (rateTahunan / 100) / 12;
        const calculated = (plafon * rateBulanan * Math.pow(1 + rateBulanan, tenorBulan)) / (Math.pow(1 + rateBulanan, tenorBulan) - 1);
        angsuranAnuitas = isNaN(calculated) || !isFinite(calculated) ? 0 : Math.round(calculated);
      }

      return {
        ...item,
        tenorBulan,
        angsuranAnuitas
      };
    });
  };

  const calculatedSlikDetail = calculateSlikDetails(slikDetail);
  const calculatedSlikDetailPasangan = calculateSlikDetails(slikDetailPasangan);

  const calculateSlikTotals = (details) => {
    return {
      totalPlafon: details.reduce((sum, item) => sum + (parseFloat(item.plafon) || 0), 0),
      totalBaki: details.reduce((sum, item) => sum + (parseFloat(item.bakiDebet) || 0), 0),
      totalAngsuran: details.reduce((sum, item) => sum + (parseFloat(item.angsuranAnuitas) || 0), 0),
      isBermasalah: details.some(item => parseInt(item.kolektibilitas || 1) >= 3)
    };
  };

  const totalsSlik = calculateSlikTotals(calculatedSlikDetail);
  const totalsSlikPasangan = calculateSlikTotals(calculatedSlikDetailPasangan);
  const totalAngsuranSlikAll = totalsSlik.totalAngsuran + totalsSlikPasangan.totalAngsuran;
  const isBermasalah = totalsSlik.isBermasalah || totalsSlikPasangan.isBermasalah;

  // Aspek Keuangan Mapping
  const pendapatanPemohon = isKonsumtif ? (parseFloat(financialAnalisa.gaji_pokok || 0) + parseFloat(financialAnalisa.tunjangan || 0)) : parseFloat(financialAnalisa.rata_omset || 0);
  const labelPendapatanPemohon = isKonsumtif ? "- GAJI & TUNJANGAN" : "- RATA-RATA OMSET";
  
  const pendapatanPasangan = isKonsumtif ? parseFloat(financialAnalisa.pendapatan_pasangan || 0) : 0;
  const labelPendapatanPasangan = isKonsumtif ? "- PENDAPATAN PASANGAN" : "-";

  const pendapatanLain = isKonsumtif ? (parseFloat(financialAnalisa.bonus_rata || 0) + parseFloat(financialAnalisa.usaha_sampingan || 0)) : 0;
  const labelPendapatanLain = isKonsumtif ? "- PENDAPATAN LAINNYA" : "-";

  const totalPenghasilan = isKonsumtif ? parseFloat(financialAnalisa.total_penghasilan || 0) : parseFloat(financialAnalisa.laba_bersih || 0);
  const rpcPercent = 90;
  const rpcAmount = (totalPenghasilan * rpcPercent) / 100;
  const angsuranEksisting = isKonsumtif ? parseFloat(financialAnalisa.cicilan_existing || 0) : (totalAngsuranSlikAll || 0);
  const pengurangAngsuran = isKonsumtif ? parseFloat(financialAnalisa.pengurang_angsuran || 0) : 0;
  const biayaHidup = isKonsumtif
    ? (parseFloat(financialAnalisa.listrik || 0) +
       parseFloat(financialAnalisa.air || 0) +
       parseFloat(financialAnalisa.transportasi || 0) +
       parseFloat(financialAnalisa.pendidikan || 0) +
       parseFloat(financialAnalisa.kebutuhan_rumah_tangga || 0) +
       parseFloat(financialAnalisa.pengeluaran_lain || 0))
    : 0;
  const sisaPendapatan = rpcAmount - (angsuranEksisting + biayaHidup + pengurangAngsuran);
  
  const angsuranDiajukan = isKonsumtif ? parseFloat(financialAnalisa.angsuran_diajukan || 0) : parseFloat(pengajuan.angsuran_perbulan || 0);
  const prosentaseAngsuran = totalPenghasilan > 0 ? (angsuranDiajukan / totalPenghasilan) * 100 : 0;
  const b2RpcAmount = rpcAmount;
  const statusLayak = isKonsumtif ? financialAnalisa.status_kelayakan : financialAnalisa.status_kelayakan;

  // Signature names based on roles
  const pengusulName = pengajuan.ao_nama || "DIAN WICAKSANA ADI, ST";
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
          <button
            onClick={handleGenerateAi}
            disabled={generatingAi}
            className="btn-primary bg-purple-600 hover:bg-purple-700 text-white text-sm flex items-center gap-2 border-purple-500/20"
          >
            {generatingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate AI Analisis
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
                            <span>
                              {isBermasalah ? <span className="underline relative font-bold text-gray-950">ada ✔</span> : 'ada'} / 
                              {!isBermasalah ? <span className="underline relative font-bold text-gray-950"> tidak ✔</span> : ' tidak'}
                            </span>
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

              {/* Empty box for handwritten opinion, or display placeholder with generate button */}
              {aiNarrative ? (
                <div className="border-2 border-purple-800 bg-purple-50/10 p-4 rounded-sm space-y-4 print:border-gray-800 print:bg-white">
                  <div className="flex items-center gap-2 border-b border-purple-200 pb-2 print:border-gray-300">
                    <Sparkles className="w-5 h-5 text-purple-700 print:hidden shrink-0" />
                    <span className="font-bold text-xs text-purple-950 print:text-black uppercase tracking-wider">Hasil Analisis & Opini AI Credit Analyst</span>
                    <span className="ml-auto text-[9px] text-gray-500">Last updated: {formatDate(aiNarrative.updated_at || new Date())}</span>
                  </div>

                  <div className="space-y-3 text-[10px] text-gray-800 print:text-black">
                    <div>
                      <h4 className="font-bold text-purple-900 print:text-black uppercase">Executive Summary</h4>
                      <p className="mt-1 leading-relaxed text-justify">{aiNarrative.narrative_data?.executiveSummary || '-'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-bold text-purple-900 print:text-black uppercase">Profil Debitur</h4>
                        <p className="mt-1 leading-relaxed text-justify">{aiNarrative.narrative_data?.borrowerProfile || '-'}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-purple-900 print:text-black uppercase">Analisis Keuangan</h4>
                        <p className="mt-1 leading-relaxed text-justify">{aiNarrative.narrative_data?.financialAnalysis || '-'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-bold text-purple-900 print:text-black uppercase">Analisis Jaminan</h4>
                        <p className="mt-1 leading-relaxed text-justify">{aiNarrative.narrative_data?.collateralAnalysis || '-'}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-purple-900 print:text-black uppercase">Riwayat Kredit</h4>
                        <p className="mt-1 leading-relaxed text-justify">{aiNarrative.narrative_data?.creditHistoryAnalysis || '-'}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-purple-900 print:text-black uppercase">Penilaian Risiko (Risk Assessment)</h4>
                      <p className="mt-1 leading-relaxed text-justify">{aiNarrative.narrative_data?.riskAssessment || '-'}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <h4 className="font-bold text-emerald-800 print:text-black uppercase">Kekuatan (Strengths)</h4>
                        <p className="mt-1 leading-relaxed text-justify">{aiNarrative.narrative_data?.strengths || '-'}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-amber-800 print:text-black uppercase">Kelemahan (Weaknesses)</h4>
                        <p className="mt-1 leading-relaxed text-justify">{aiNarrative.narrative_data?.weaknesses || '-'}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-blue-800 print:text-black uppercase">Mitigasi Risiko</h4>
                        <p className="mt-1 leading-relaxed text-justify">{aiNarrative.narrative_data?.mitigation || '-'}</p>
                      </div>
                    </div>

                    <div className="border-t border-purple-200 print:border-gray-300 pt-2">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-purple-950 print:text-black uppercase">Rekomendasi Akhir AI</h4>
                          <p className="mt-1 leading-relaxed font-semibold text-purple-900 print:text-black">{aiNarrative.narrative_data?.recommendation || '-'}</p>
                        </div>
                        {aiNarrative.narrative_data?.appendix && aiNarrative.narrative_data.appendix.length > 0 && (
                          <div className="max-w-[50%]">
                            <h4 className="font-bold text-purple-950 print:text-black uppercase">Syarat / Ketentuan Lain (Covenant)</h4>
                            <ul className="list-disc list-inside mt-1 space-y-0.5 text-gray-700 print:text-black italic">
                              {aiNarrative.narrative_data.appendix.map((appItem, appIdx) => (
                                <li key={appIdx}>{appItem}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-800 p-4 min-h-[220px] rounded-sm bg-white flex flex-col justify-between">
                  <div className="text-gray-400 italic text-center my-auto print:hidden">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-400 animate-pulse" />
                    <p>AI Credit Analyst Narrative belum di-generate.</p>
                    <button 
                      onClick={handleGenerateAi} 
                      disabled={generatingAi}
                      className="mt-3 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 mx-auto animate-bounce"
                    >
                      {generatingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      Generate Analisa AI
                    </button>
                  </div>
                  <div className="hidden print:block text-gray-400 italic text-center my-auto">
                    Catatan Opini Kepatuhan (Tulis Tangan)
                  </div>
                </div>
              )}

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
          {/* PAGE 2: MEMORANDUM ANALISA KREDIT */}
          {/* ============================================================ */}
          <div className="print-page border-2 border-gray-800 p-8 mb-8 bg-white relative page-break-before">
            <div className="text-center mb-6">
              <h1 className="text-sm font-bold tracking-wider uppercase underline">MEMORANDUM ANALISA KREDIT {isKonsumtif ? 'KONSUMTIF' : 'PRODUKTIF'}</h1>
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
                    ['Nama gadis ibu kandung', pengajuan.ibu_kandung || '-'],
                    ['Usaha diluar instansi', '-'],
                    ['Klasifikasi usaha', 'KECIL/SEDANG/BESAR'],
                    ['N P W P (plafond 100 jt keatas)', '-'],
                    ['Hubungan dengan Bank', pengajuan.hubungan_bank || '-'],
                    ['Kredit yang sedang dinikmati', pengajuan.kredit_aktif || '-']
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
                    {calculatedSlikDetail.length > 0 ? calculatedSlikDetail.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-400">
                        <td className="border-r border-gray-400 px-1.5 py-0.5">{item.bank || '-'}</td>
                        <td className="border-r border-gray-400 px-1.5 py-0.5 text-right">{(parseFloat(item.plafon)||0).toLocaleString('id-ID')}</td>
                        <td className="border-r border-gray-400 px-1.5 py-0.5 text-right">{(parseFloat(item.bakiDebet)||0).toLocaleString('id-ID')}</td>
                        <td className="border-r border-gray-400 px-1.5 py-0.5 text-center">{item.tenorBulan || '-'}</td>
                        <td className="border-r border-gray-400 px-1.5 py-0.5 text-center">{item.sukuBunga ? `${item.sukuBunga}%` : '-'}</td>
                        <td className="border-r border-gray-400 px-1.5 py-0.5 text-center">{item.kolektibilitas || 1}</td>
                        <td className="px-1.5 py-0.5 text-right">{(Math.round(item.angsuranAnuitas)||0).toLocaleString('id-ID')}</td>
                      </tr>
                    )) : (
                      <tr className="border-b border-gray-400">
                        <td colSpan="7" className="px-1.5 py-2 text-center text-gray-500 italic">Data fasilitas kredit (SLIK) kosong atau tidak ada.</td>
                      </tr>
                    )}
                    <tr className="font-bold bg-gray-50 border-t border-gray-500">
                      <td className="border-r border-gray-400 px-1.5 py-0.5">TOTAL</td>
                      <td className="border-r border-gray-400 px-1.5 py-0.5 text-right">{totalsSlik.totalPlafon.toLocaleString('id-ID')}</td>
                      <td className="border-r border-gray-400 px-1.5 py-0.5 text-right">{totalsSlik.totalBaki.toLocaleString('id-ID')} ✔</td>
                      <td className="border-r border-gray-400 px-1.5 py-0.5 text-center">-</td>
                      <td className="border-r border-gray-400 px-1.5 py-0.5 text-center">-</td>
                      <td className="border-r border-gray-400 px-1.5 py-0.5 text-center">-</td>
                      <td className="px-1.5 py-0.5 text-right">{totalsSlik.totalAngsuran.toLocaleString('id-ID')}</td>
                    </tr>
                  </tbody>
                </table>
                {calculatedSlikDetailPasangan.length > 0 && (
                  <>
                    <h4 className="font-bold mb-1 mt-2 text-[11px]">Catatan SLIK Pasangan</h4>
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
                        {calculatedSlikDetailPasangan.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-400">
                            <td className="border-r border-gray-400 px-1.5 py-0.5">{item.bank || '-'}</td>
                            <td className="border-r border-gray-400 px-1.5 py-0.5 text-right">{(parseFloat(item.plafon)||0).toLocaleString('id-ID')}</td>
                            <td className="border-r border-gray-400 px-1.5 py-0.5 text-right">{(parseFloat(item.bakiDebet)||0).toLocaleString('id-ID')}</td>
                            <td className="border-r border-gray-400 px-1.5 py-0.5 text-center">{item.tenorBulan || '-'}</td>
                            <td className="border-r border-gray-400 px-1.5 py-0.5 text-center">{item.sukuBunga ? item.sukuBunga + '%' : '-'}</td>
                            <td className="border-r border-gray-400 px-1.5 py-0.5 text-center">{item.kolektibilitas || 1}</td>
                            <td className="px-1.5 py-0.5 text-right">{(Math.round(item.angsuranAnuitas)||0).toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                        <tr className="font-bold bg-gray-50 border-t border-gray-500">
                          <td className="border-r border-gray-400 px-1.5 py-0.5">TOTAL</td>
                          <td className="border-r border-gray-400 px-1.5 py-0.5 text-right">{totalsSlikPasangan.totalPlafon.toLocaleString('id-ID')}</td>
                          <td className="border-r border-gray-400 px-1.5 py-0.5 text-right">{totalsSlikPasangan.totalBaki.toLocaleString('id-ID')} ✔</td>
                          <td className="border-r border-gray-400 px-1.5 py-0.5 text-center">-</td>
                          <td className="border-r border-gray-400 px-1.5 py-0.5 text-center">-</td>
                          <td className="border-r border-gray-400 px-1.5 py-0.5 text-center">-</td>
                          <td className="px-1.5 py-0.5 text-right">{totalsSlikPasangan.totalAngsuran.toLocaleString('id-ID')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}
                <div className="flex justify-end mt-1 text-[11px] font-bold">
                  <span className="mr-8">TOTAL ANGSURAN SLIK (PEMOHON + PASANGAN):</span>
                  <span>Rp {totalAngsuranSlikAll.toLocaleString('id-ID')}</span>
                </div>
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
                      <tr>
                        <td className="py-0.5">B. Potongan Wajib/ Mandatory</td>
                        <td></td>
                        <td className="text-right">Rp -</td>
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
                        <td className="py-0.5">E. Angsuran Kredit (apabila ada)</td>
                        <td></td>
                        <td className="text-right">{angsuranEksisting > 0 ? `Rp ${angsuranEksisting.toLocaleString('id-ID')}` : 'Rp -'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">F. Biaya Hidup</td>
                        <td></td>
                        <td className="text-right">Rp {biayaHidup.toLocaleString('id-ID')}</td>
                      </tr>
                      {pengurangAngsuran > 0 && (
                        <tr>
                          <td className="py-0.5">F.2. Pengurang Angsuran</td>
                          <td></td>
                          <td className="text-right">Rp {pengurangAngsuran.toLocaleString('id-ID')}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="py-0.5">G. Total Angsuran Kredit, biaya hidup, dan pengurang</td>
                        <td></td>
                        <td className="text-right py-0.5">Rp {(angsuranEksisting + biayaHidup + pengurangAngsuran).toLocaleString('id-ID')}</td>
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
                        <td className="py-0.5">- Maksimal Angsuran</td>
                        <td className="text-right">Rp {sisaPendapatan.toLocaleString('id-ID')}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-0.5">- Sisa masa kerja =</td>
                        <td className="text-right font-semibold">{pengajuan.jangka_waktu_bulan || 0} Bulan <span className="ml-4 font-bold text-emerald-600">LAYAK</span></td>
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
                        <td className="py-0.5">- Angsuran Kredit/bulan ( Tidak lebih besar dari (H)=</td>
                        <td className="text-right">Rp {angsuranDiajukan.toLocaleString('id-ID')}</td>
                      </tr>
                      <tr className="font-bold border-b-2 border-gray-800 bg-gray-50">
                        <td className="py-1">- Prosentase Angsuran Kredit</td>
                        <td className="text-right py-1">{prosentaseAngsuran.toFixed(2)}%</td>
                      </tr>
                      <tr className="font-bold border-b-2 border-gray-800 bg-gray-50">
                        <td className="py-1">  terhadap penghasilan per bulan</td>
                        <td className={`text-right py-1 ${angsuranDiajukan <= sisaPendapatan ? 'text-emerald-600' : 'text-red-600'}`}>{angsuranDiajukan <= sisaPendapatan ? 'LAYAK' : 'TIDAK LAYAK'} ✔</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          {/* ============================================================ */}
          {/* LKD PAGES & ARUS KAS (ONLY FOR PRODUKTIF) */}
          {/* ============================================================ */}
          {!isKonsumtif && (
            <>
              {/* LKD 1 */}
              <div className="print-page border-2 border-gray-800 p-8 mb-8 bg-white relative page-break-before">
                <div className="text-center mb-6">
                  <h1 className="text-sm font-bold tracking-wider uppercase underline">LAPORAN KUNJUNGAN DEBITUR 1</h1>
                  <p className="text-[10px] text-gray-600 mt-1">Data Usaha & Analisa Keuangan</p>
                </div>
                <div className="space-y-4 text-xs">
                  <h3 className="font-bold uppercase text-gray-950">A. INFORMASI TEMPAT USAHA</h3>
                  <table className="w-full text-[11px] border border-gray-400 border-collapse">
                    <tbody>
                      <tr className="border-b border-gray-300">
                        <td className="w-2/5 px-2 py-1 font-semibold text-gray-700 bg-gray-50">Nama Usaha</td>
                        <td className="w-2 text-center">:</td>
                        <td className="px-2 py-1 uppercase">{usaha.nama_usaha || pekerjaan.nama_instansi || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="w-2/5 px-2 py-1 font-semibold text-gray-700 bg-gray-50">Bidang Usaha</td>
                        <td className="w-2 text-center">:</td>
                        <td className="px-2 py-1 uppercase">{usaha.jenis_usaha || surveyUsaha.jenis_usaha || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="w-2/5 px-2 py-1 font-semibold text-gray-700 bg-gray-50">Alamat Usaha</td>
                        <td className="w-2 text-center">:</td>
                        <td className="px-2 py-1 uppercase">{usaha.alamat_usaha || pengajuan.alamat || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="w-2/5 px-2 py-1 font-semibold text-gray-700 bg-gray-50">Lama Usaha</td>
                        <td className="w-2 text-center">:</td>
                        <td className="px-2 py-1 uppercase">{usaha.lama_usaha_tahun || surveyUsaha.lama_usaha_tahun || 0} Tahun</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="w-2/5 px-2 py-1 font-semibold text-gray-700 bg-gray-50">Status Tempat Usaha</td>
                        <td className="w-2 text-center">:</td>
                        <td className="px-2 py-1 uppercase">{usaha.status_tempat_usaha || '-'}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h3 className="font-bold uppercase text-gray-950 mt-4">B. ANALISA KEUANGAN (PER BULAN)</h3>
                  <table className="w-full text-[11px] border border-gray-400 border-collapse">
                    <tbody>
                      <tr className="border-b border-gray-300">
                        <td className="w-2/5 px-2 py-1 font-semibold text-gray-700 bg-gray-50">Pendapatan Usaha / Omset</td>
                        <td className="w-2 text-center">:</td>
                        <td className="px-2 py-1 uppercase text-right">Rp {parseFloat(financialAnalisa.rata_omset || 0).toLocaleString('id-ID')}</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="w-2/5 px-2 py-1 font-semibold text-gray-700 bg-gray-50">Harga Pokok Penjualan (HPP)</td>
                        <td className="w-2 text-center">:</td>
                        <td className="px-2 py-1 uppercase text-right">Rp {parseFloat(financialAnalisa.rata_hpp || 0).toLocaleString('id-ID')}</td>
                      </tr>
                      <tr className="border-b border-gray-300 font-bold bg-gray-100">
                        <td className="w-2/5 px-2 py-1 text-gray-900">Laba Kotor</td>
                        <td className="w-2 text-center">:</td>
                        <td className="px-2 py-1 uppercase text-right">Rp {parseFloat(financialAnalisa.laba_kotor || 0).toLocaleString('id-ID')}</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="w-2/5 px-2 py-1 font-semibold text-gray-700 bg-gray-50">Biaya Operasional</td>
                        <td className="w-2 text-center">:</td>
                        <td className="px-2 py-1 uppercase text-right">Rp {parseFloat(financialAnalisa.rata_biaya_op || 0).toLocaleString('id-ID')}</td>
                      </tr>
                      <tr className="border-b border-gray-300 font-bold bg-emerald-50">
                        <td className="w-2/5 px-2 py-1 text-gray-900">Keuntungan Usaha (Laba Bersih)</td>
                        <td className="w-2 text-center">:</td>
                        <td className="px-2 py-1 uppercase text-right">Rp {parseFloat(financialAnalisa.laba_bersih || 0).toLocaleString('id-ID')}</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <h3 className="font-bold uppercase text-gray-950 mt-4">C. KEBUTUHAN MODAL KERJA</h3>
                  <table className="w-full text-[11px] border border-gray-400 border-collapse">
                    <tbody>
                      <tr className="border-b border-gray-300">
                        <td className="w-2/5 px-2 py-1 font-semibold text-gray-700 bg-gray-50">Working Capital</td>
                        <td className="w-2 text-center">:</td>
                        <td className="px-2 py-1 uppercase text-right">Rp {parseFloat(financialAnalisa.working_capital || 0).toLocaleString('id-ID')}</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="w-2/5 px-2 py-1 font-semibold text-gray-700 bg-gray-50">Gross Profit Margin (GPM)</td>
                        <td className="w-2 text-center">:</td>
                        <td className="px-2 py-1 uppercase text-right">{parseFloat(financialAnalisa.gross_profit_margin || 0).toFixed(2)} %</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="w-2/5 px-2 py-1 font-semibold text-gray-700 bg-gray-50">Net Profit Margin (NPM)</td>
                        <td className="w-2 text-center">:</td>
                        <td className="px-2 py-1 uppercase text-right">{parseFloat(financialAnalisa.net_profit_margin || 0).toFixed(2)} %</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="w-2/5 px-2 py-1 font-semibold text-gray-700 bg-gray-50">DSCR</td>
                        <td className="w-2 text-center">:</td>
                        <td className="px-2 py-1 uppercase text-right">{parseFloat(financialAnalisa.dscr || 0).toFixed(2)} x</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* LKD 2 (Arus Kas - Cashflow Projection) */}
              <div className="print-page border-2 border-gray-800 p-8 mb-8 bg-white relative page-break-before">
                <div className="text-center mb-6">
                  <h1 className="text-sm font-bold tracking-wider uppercase underline">LAPORAN ARUS KAS (CASHFLOW)</h1>
                  <p className="text-[10px] text-gray-600 mt-1">Proyeksi 12 Bulan Kedepan</p>
                </div>
                
                <div className="overflow-x-auto text-[8px]">
                  <table className="w-full border border-gray-500 border-collapse text-right">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-500 text-center">
                        <th className="border-r border-gray-500 p-1 text-left">Komponen (Rp)</th>
                        {[...Array(12)].map((_, i) => (
                          <th key={i} className="border-r border-gray-500 p-1 w-16">Bln {i+1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-400 bg-emerald-50/50">
                        <td className="border-r border-gray-400 p-1 text-left font-bold">Pemasukan (Omset)</td>
                        {[...Array(12)].map((_, i) => {
                           const fluktuasi = 1 + (Math.sin(i) * 0.05);
                           const val = parseFloat(financialAnalisa.rata_omset || 0) * fluktuasi;
                           return <td key={i} className="border-r border-gray-400 p-1">{Math.round(val).toLocaleString('id-ID')}</td>;
                        })}
                      </tr>
                      <tr className="border-b border-gray-400">
                        <td className="border-r border-gray-400 p-1 text-left font-semibold">Harga Pokok Penjualan</td>
                        {[...Array(12)].map((_, i) => {
                           const fluktuasi = 1 + (Math.sin(i) * 0.05);
                           const val = parseFloat(financialAnalisa.rata_hpp || 0) * fluktuasi;
                           return <td key={i} className="border-r border-gray-400 p-1">{Math.round(val).toLocaleString('id-ID')}</td>;
                        })}
                      </tr>
                      <tr className="border-b border-gray-400 bg-blue-50/50">
                        <td className="border-r border-gray-400 p-1 text-left font-bold">Laba Kotor</td>
                        {[...Array(12)].map((_, i) => {
                           const fluktuasi = 1 + (Math.sin(i) * 0.05);
                           const val = (parseFloat(financialAnalisa.rata_omset || 0) - parseFloat(financialAnalisa.rata_hpp || 0)) * fluktuasi;
                           return <td key={i} className="border-r border-gray-400 p-1 font-bold">{Math.round(val).toLocaleString('id-ID')}</td>;
                        })}
                      </tr>
                      <tr className="border-b border-gray-400">
                        <td className="border-r border-gray-400 p-1 text-left font-semibold">Biaya Operasional</td>
                        {[...Array(12)].map((_, i) => (
                           <td key={i} className="border-r border-gray-400 p-1">{Math.round(parseFloat(financialAnalisa.rata_biaya_op || 0)).toLocaleString('id-ID')}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-400">
                        <td className="border-r border-gray-400 p-1 text-left font-semibold">Angsuran Existing</td>
                        {[...Array(12)].map((_, i) => (
                           <td key={i} className="border-r border-gray-400 p-1">{Math.round(angsuranEksisting).toLocaleString('id-ID')}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-400 border-t-2 border-t-gray-800 bg-gray-100">
                        <td className="border-r border-gray-400 p-1 text-left font-bold">Net Cashflow</td>
                        {[...Array(12)].map((_, i) => {
                           const fluktuasi = 1 + (Math.sin(i) * 0.05);
                           const inVal = parseFloat(financialAnalisa.rata_omset || 0) * fluktuasi;
                           const outHpp = parseFloat(financialAnalisa.rata_hpp || 0) * fluktuasi;
                           const op = parseFloat(financialAnalisa.rata_biaya_op || 0);
                           const val = inVal - outHpp - op - angsuranEksisting;
                           return <td key={i} className={`border-r border-gray-400 p-1 font-bold ${val < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{Math.round(val).toLocaleString('id-ID')}</td>;
                        })}
                      </tr>
                      <tr className="border-b border-gray-400">
                        <td className="border-r border-gray-400 p-1 text-left font-semibold">Rencana Angsuran BAPERA</td>
                        {[...Array(12)].map((_, i) => (
                           <td key={i} className="border-r border-gray-400 p-1 text-blue-800 font-bold">{Math.round(angsuranDiajukan).toLocaleString('id-ID')}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-400 bg-amber-50">
                        <td className="border-r border-gray-400 p-1 text-left font-bold">Sisa Kas (Ending Cash)</td>
                        {[...Array(12)].map((_, i) => {
                           const fluktuasi = 1 + (Math.sin(i) * 0.05);
                           const inVal = parseFloat(financialAnalisa.rata_omset || 0) * fluktuasi;
                           const outHpp = parseFloat(financialAnalisa.rata_hpp || 0) * fluktuasi;
                           const op = parseFloat(financialAnalisa.rata_biaya_op || 0);
                           const net = inVal - outHpp - op - angsuranEksisting;
                           const ending = net - angsuranDiajukan;
                           return <td key={i} className={`border-r border-gray-400 p-1 font-bold ${ending < 0 ? 'text-red-600' : ''}`}>{Math.round(ending).toLocaleString('id-ID')}</td>;
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-[10px] space-y-1">
                  <p><strong>Aturan Khusus Arus Kas (Otomatisasi):</strong></p>
                  <ul className="list-disc ml-4 text-gray-700">
                    <li>Pemasukan & HPP disimulasikan berfluktuasi secara natural (± 5%) per bulan untuk menggambarkan kondisi real.</li>
                    <li>Rencana Angsuran diuji terhadap <em>Net Cashflow</em> bulanan untuk mengukur kemampuan bayar yang riil.</li>
                    <li>Sisa Kas yang selalu positif menunjukkan kapasitas pembayaran (Capacity) yang memadai (DSCR: {parseFloat(financialAnalisa.dscr || 0).toFixed(2)}x).</li>
                  </ul>
                </div>
              </div>

              {/* LKD 3 & 4 (Denah & Survey Lingkungan) */}
              <div className="print-page border-2 border-gray-800 p-8 mb-8 bg-white relative page-break-before">
                <div className="text-center mb-6">
                  <h1 className="text-sm font-bold tracking-wider uppercase underline">LAPORAN KUNJUNGAN DEBITUR 3 & 4</h1>
                  <p className="text-[10px] text-gray-600 mt-1">Data Lingkungan & Lokasi Usaha</p>
                </div>
                <div className="space-y-4 text-xs">
                   <h3 className="font-bold uppercase text-gray-950">A. DATA LINGKUNGAN / SOSIAL</h3>
                   <table className="w-full text-[11px] border border-gray-400 border-collapse">
                    <tbody>
                      <tr className="border-b border-gray-300">
                        <td className="w-2/5 px-2 py-1 font-semibold text-gray-700 bg-gray-50">Karakter Debitur (1-5)</td>
                        <td className="w-2 text-center">:</td>
                        <td className="px-2 py-1 uppercase">{surveyLingkungan.karakter_debitur || '-'} / 5 - {surveyLingkungan.karakter_keterangan || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="w-2/5 px-2 py-1 font-semibold text-gray-700 bg-gray-50">Hubungan Sosial (1-5)</td>
                        <td className="w-2 text-center">:</td>
                        <td className="px-2 py-1 uppercase">{surveyLingkungan.hubungan_sosial || '-'} / 5 - {surveyLingkungan.hubungan_keterangan || '-'}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h3 className="font-bold uppercase text-gray-950 mt-4">B. PETA / DENAH LOKASI</h3>
                  <div className="border border-gray-400 p-2 bg-gray-50 flex items-center justify-center min-h-[300px]">
                    <div className="text-center text-gray-500">
                      {surveyUsaha.latitude && surveyUsaha.longitude ? (
                        <>
                          <div className="text-[10px] mb-2 font-mono">Koordinat GPS: {surveyUsaha.latitude}, {surveyUsaha.longitude}</div>
                          <div className="w-64 h-64 border-2 border-dashed border-gray-400 rounded-sm flex items-center justify-center bg-gray-200">
                            Peta Lokasi Tersedia di Lampiran / App Maps
                          </div>
                        </>
                      ) : (
                        "[ Tidak ada data koordinat GPS untuk dirender ]"
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* PAGE 3: JAMINAN KREDIT, ASURANSI, USULAN & SIGNATURES */}
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
                      <th className="border-r border-gray-500 p-1 text-center">Jenis/No Dok</th>
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
                      <th className="border-r border-gray-500 p-1 text-right">Nilai</th>
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
                      <td className="p-1 text-center font-bold text-emerald-600">{parseFloat(mainAgunan.ltv || 0).toFixed(2)}%<br/>AMAN / LAYAK</td>
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
          {/* PAGE 4: CATATAN / COVENANT */}
          {/* ============================================================ */}
          <div className="print-page border-2 border-gray-800 p-8 mb-8 bg-white relative page-break-before">
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
                  <tr className="border-b border-gray-800">
                    <td className="border-r border-gray-800 p-2 align-top text-center w-1/4">
                      <div className="font-semibold uppercase mb-1">Pengusul Kredit</div>
                      <div className="text-[9px] text-gray-500 mb-10">TTD</div>
                      <div className="font-bold underline text-[9px]">{pengusulName}</div>
                    </td>
                    <td className="p-2 align-top text-[11px]">
                      <div className="font-semibold text-center mb-1">SETUJU / <span className="line-through">TIDAK SETUJU</span></div>
                      {approvalList.length > 0 ? (
                         <div className="mt-8 text-center italic">Setuju {pengajuan.plafon_diajukan ? (parseFloat(pengajuan.plafon_diajukan)/1000000) + ' jt' : ''} / {pengajuan.jangka_waktu_bulan} bulan</div>
                      ) : (
                         <div className="h-16"></div>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="border-r border-gray-800 p-2 align-top text-center w-1/4">
                      <div className="font-semibold uppercase mb-1">Komite</div>
                      <div className="text-[9px] text-gray-500 mb-10">TTD</div>
                      <div className="font-bold underline text-[9px]">{kabidName}</div>
                    </td>
                    <td className="p-2 align-top text-[11px]">
                      <div className="font-semibold text-center mb-1">SETUJU / <span className="line-through">TIDAK SETUJU</span></div>
                      {approvalList.length > 0 ? (
                         <div className="mt-8 text-center italic">Setuju {pengajuan.plafon_diajukan ? (parseFloat(pengajuan.plafon_diajukan)/1000000) + ' jt' : ''} / {pengajuan.jangka_waktu_bulan} bulan</div>
                      ) : (
                         <div className="h-16"></div>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="border-r border-gray-800 p-2 align-top text-center w-1/4">
                      <div className="font-semibold uppercase mb-1">Komite</div>
                      <div className="text-[9px] text-gray-500 mb-20">TTD</div>
                      <div className="font-bold underline text-[9px]">{komiteName3}</div>
                    </td>
                    <td className="p-2 align-top text-[11px]">
                      <div className="font-semibold text-center mb-1">SETUJU / <span className="line-through">TIDAK SETUJU</span></div>
                      {approvalList.length > 0 ? (
                         <div className="mt-2 ml-4">
                           <ul className="list-disc list-inside space-y-1 italic text-blue-900">
                             <li>Cek data dgn benar</li>
                             <li>Proses SOP</li>
                             <li>Prinsip kehati-hatian</li>
                             <li>Mitigasi resiko di awal</li>
                             <li>Pastikan kemampuan bayar/angsuran</li>
                             <li>OTS usaha & jaminan</li>
                             <li>Pasang HT Sempurna</li>
                             <li>Monitor pasca pencairan & PK</li>
                             <li>Tertib Adm</li>
                           </ul>
                         </div>
                      ) : (
                         <div className="h-32"></div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================================ */}
          {/* PAGE 5: LAPORAN PENILAIAN JAMINAN */}
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
                        <td className="py-0.5">{mainAgunan.lantai_bangunan || 'lantai'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">- Luas Tanah</td>
                        <td>:</td>
                        <td className="py-0.5 font-semibold">{mainAgunan.luas_tanah || '-'} m²</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">- Luas Bangunan</td>
                        <td>:</td>
                        <td className="py-0.5 font-semibold">{mainAgunan.luas_bangunan || '0'} m²</td>
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
                        <td className="py-0.5">- Lantai</td>
                        <td>:</td>
                        <td className="py-0.5">-</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">- Dinding</td>
                        <td>:</td>
                        <td className="py-0.5">{mainAgunan.dinding || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">- Pagar</td>
                        <td>:</td>
                        <td className="py-0.5">-</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">- Jenis Plafond</td>
                        <td>:</td>
                        <td className="py-0.5">-</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">- Kusen Pintu</td>
                        <td>:</td>
                        <td className="py-0.5">-</td>
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
                    <p><strong>a. TANAH</strong></p>
                    <p className="pl-2 leading-relaxed">
                      Berdasarkan metode pendekatan pasar maka kami berpendapat bahw Nilai Pasar Wajar (NPW) tanah tersebut pada tanggal {formatDate(new Date())} adalah sebesar <strong>Rp. {parseFloat(mainAgunan.nilai_pasar || 0).toLocaleString('id-ID')}</strong> ( {formatTerbilangRupiah(mainAgunan.nilai_pasar || 0)} ) dengan harga taksiran tanah sebesar Rp. {parseFloat(mainAgunan.luas_tanah || 0) > 0 ? Math.round(parseFloat(mainAgunan.nilai_pasar || 0) / parseFloat(mainAgunan.luas_tanah)).toLocaleString('id-ID') : '-'} /M2.
                    </p>
                    <p><strong>b. BANGUNAN</strong></p>
                    <p className="pl-2 leading-relaxed">
                      Dengan mempertimbangkan biaya membangun baru dari bangunan serta sarana pelengkap setelah dikurangi penyusutan dan pendekatan pasar/dan pendekatan pendapatan, maka kami berpendapat bahwa nilai pasar wajar dari bangunan pada tanggal {formatDate(new Date())} adalah sebesar Rp. - dengan harga taksiran bangunan Rp. - /M2.
                    </p>
                    <p><strong>c. TANAH DAN BANGUNAN</strong></p>
                    <div className="pl-2">
                      <table className="w-full text-[10px] border border-gray-500 border-collapse mt-2">
                        <thead>
                          <tr className="border-b border-gray-500">
                            <th className="border-r border-gray-500 py-1"></th>
                            <th className="border-r border-gray-500 py-1">N P W</th>
                            <th className="border-r border-gray-500 py-1">NJOP</th>
                            <th className="border-r border-gray-500 py-1">NILAI TAKSASI</th>
                            <th className="py-1">NL (80%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-500 text-center">
                            <td className="border-r border-gray-500 py-1 font-semibold">Tanah</td>
                            <td className="border-r border-gray-500 py-1">{parseFloat(mainAgunan.nilai_pasar || 0).toLocaleString('id-ID')}</td>
                            <td className="border-r border-gray-500 py-1">{parseFloat(mainAgunan.nilai_njop || 0).toLocaleString('id-ID')}</td>
                            <td className="border-r border-gray-500 py-1">{parseFloat(mainAgunan.nilai_taksasi || 0).toLocaleString('id-ID')}</td>
                            <td className="py-1">{parseFloat(mainAgunan.nilai_likuidasi || (mainAgunan.nilai_pasar * 0.8)).toLocaleString('id-ID')}</td>
                          </tr>
                          <tr className="border-b border-gray-500 text-center">
                            <td className="border-r border-gray-500 py-1 font-semibold">Bangunan</td>
                            <td className="border-r border-gray-500 py-1">-</td>
                            <td className="border-r border-gray-500 py-1">-</td>
                            <td className="border-r border-gray-500 py-1">-</td>
                            <td className="py-1">-</td>
                          </tr>
                          <tr className="border-b border-gray-500 text-center">
                            <td className="border-r border-gray-500 py-1 font-semibold">Jumlah</td>
                            <td className="border-r border-gray-500 py-1">{parseFloat(mainAgunan.nilai_pasar || 0).toLocaleString('id-ID')}</td>
                            <td className="border-r border-gray-500 py-1">{parseFloat(mainAgunan.nilai_njop || 0).toLocaleString('id-ID')}</td>
                            <td className="border-r border-gray-500 py-1">{parseFloat(mainAgunan.nilai_taksasi || 0).toLocaleString('id-ID')}</td>
                            <td className="py-1">{parseFloat(mainAgunan.nilai_likuidasi || (mainAgunan.nilai_pasar * 0.8)).toLocaleString('id-ID')}</td>
                          </tr>
                          <tr className="text-center font-semibold bg-gray-50">
                            <td className="border-r border-gray-500 py-1">Dibulatkan</td>
                            <td className="border-r border-gray-500 py-1">{parseFloat(mainAgunan.nilai_pasar || 0).toLocaleString('id-ID')}</td>
                            <td className="border-r border-gray-500 py-1">{parseFloat(mainAgunan.nilai_njop || 0).toLocaleString('id-ID')}</td>
                            <td className="border-r border-gray-500 py-1">{parseFloat(mainAgunan.nilai_taksasi || 0).toLocaleString('id-ID')}</td>
                            <td className="py-1">{parseFloat(mainAgunan.nilai_likuidasi || (mainAgunan.nilai_pasar * 0.8)).toLocaleString('id-ID')}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>         </div>

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
