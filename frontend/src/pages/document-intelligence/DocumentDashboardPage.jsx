import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud, Sparkles, CheckCircle2, AlertTriangle, Clock, Trash2, Eye,
  RefreshCw, FileText, ArrowRight, Link, Search, X, Loader2, Database
} from 'lucide-react';
import { documentIntelligenceService, debiturService, pengajuanService } from '../../services';
import { toast } from 'react-toastify';

export default function DocumentDashboardPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);

  // Link selectors
  const [debiturs, setDebiturs] = useState([]);
  const [pengajuans, setPengajuans] = useState([]);
  const [selectedDebitur, setSelectedDebitur] = useState('');
  const [selectedPengajuan, setSelectedPengajuan] = useState('');
  const [filters, setFilters] = useState({ status: '', documentType: '' });

  // Pagination & limits
  const [totalJobs, setTotalJobs] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Search references
  const [searchQuery, setSearchQuery] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await documentIntelligenceService.getJobs({
        status: filters.status || undefined,
        documentType: filters.documentType || undefined,
        limit,
        offset: (page - 1) * limit
      });
      setJobs(res.data.data.jobs);
      setTotalJobs(res.data.data.total);
    } catch (err) {
      toast.error('Gagal memuat antrean dokumen.');
    } finally {
      setLoading(false);
    }
  };

  const loadSelectionData = async () => {
    try {
      const [debRes, pengRes] = await Promise.all([
        debiturService.getAll(1, 100),
        pengajuanService.getAll({ limit: 100 })
      ]);
      setDebiturs(debRes.data.data || []);
      setPengajuans(pengRes.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil data pilihan debitur/pengajuan:', err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, filters]);

  useEffect(() => {
    loadSelectionData();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.warn('Pilih file terlebih dahulu.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (selectedDebitur) formData.append('debitur_id', selectedDebitur);
    if (selectedPengajuan) formData.append('pengajuan_id', selectedPengajuan);

    try {
      await documentIntelligenceService.upload(formData);
      toast.success('Dokumen berhasil diunggah ke Queue untuk klasifikasi & ekstraksi.');
      setFile(null);
      setSelectedDebitur('');
      setSelectedPengajuan('');
      setPage(1);
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah dokumen.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Hapus dokumen ini dari riwayat?')) return;
    try {
      await documentIntelligenceService.deleteJob(id);
      toast.success('Dokumen berhasil dihapus.');
      fetchJobs();
    } catch (err) {
      toast.error('Gagal menghapus dokumen.');
    }
  };

  const handleProcessJob = async (id) => {
    try {
      toast.info('Memulai ulang proses ekstraksi...');
      await documentIntelligenceService.processJob(id);
      fetchJobs();
    } catch (err) {
      toast.error('Gagal memproses dokumen.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge badge-secondary flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> PENDING</span>;
      case 'CLASSIFYING':
        return <span className="badge bg-purple-500/20 text-purple-400 flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> MENGKLASIFIKASI</span>;
      case 'PROCESSING_OCR':
        return <span className="badge bg-blue-500/20 text-blue-400 flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> PROSES OCR</span>;
      case 'VALIDATING':
        return <span className="badge bg-cyan-500/20 text-cyan-400 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 animate-pulse" /> VALIDASI</span>;
      case 'REVIEW_REQUIRED':
        return <span className="badge bg-amber-500/20 text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> BUTUH REVIEW</span>;
      case 'COMPLETED':
        return <span className="badge bg-emerald-500/20 text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> SELESAI</span>;
      case 'FAILED':
        return <span className="badge bg-red-500/20 text-red-400 flex items-center gap-1"><X className="w-3.5 h-3.5" /> GAGAL</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-gold" />
            <h1 className="text-2xl font-bold text-white">Document Intelligence Center</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Manajemen upload, klasifikasi otomatis, ekstraksi AI VLM, validasi, dan auto-mapping dokumen kredit.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Panel */}
        <div className="lg:col-span-1">
          <div className="card bg-navy-light border-navy-border h-full flex flex-col">
            <div className="card-header border-navy-border pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-gold" /> Upload Dokumen Baru
              </h2>
            </div>
            
            <form onSubmit={handleUploadSubmit} className="p-6 flex-1 flex flex-col space-y-4">
              {/* File Dropzone */}
              <div className="flex-1 flex flex-col justify-center items-center border-2 border-dashed border-navy-border rounded-xl p-6 hover:border-gold/50 transition-colors cursor-pointer bg-navy/30 relative">
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="doc-upload-input"
                />
                <UploadCloud className="w-12 h-12 text-slate-500 mb-2" />
                <p className="text-sm font-medium text-white text-center">
                  {file ? file.name : 'Pilih / Seret Dokumen Kredit'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Mendukung PDF & Gambar (Max 50MB)
                </p>
              </div>

              {/* Linking */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-gold" /> Hubungkan Dengan Data
                </h3>
                
                <div>
                  <label className="label">Hubungkan ke Debitur (Opsional)</label>
                  <select 
                    value={selectedDebitur}
                    onChange={(e) => setSelectedDebitur(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="">-- Cari / Pilih Debitur --</option>
                    {debiturs.map(d => (
                      <option key={d.id} value={d.id}>{d.nama} ({d.kabupaten || 'Batang'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Hubungkan ke Pengajuan Kredit (Opsional)</label>
                  <select 
                    value={selectedPengajuan}
                    onChange={(e) => setSelectedPengajuan(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="">-- Cari / Pilih Pengajuan --</option>
                    {pengajuans.map(p => (
                      <option key={p.id} value={p.id}>{p.nomor_pengajuan} - {p.debitur_nama || 'Debitur'} ({p.jenis_kredit})</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading || !file}
                className="btn btn-primary w-full py-2.5 flex items-center justify-center gap-2 mt-4"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengunggah...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    Mulai Ekstraksi AI
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Queue & History Panel */}
        <div className="lg:col-span-2">
          <div className="card bg-navy-light border-navy-border h-full flex flex-col">
            <div className="card-header border-navy-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-gold" /> Antrean & Riwayat Dokumen
              </h2>
              
              {/* Filters */}
              <div className="flex gap-2">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="bg-navy border border-navy-border text-white text-xs rounded-lg px-2.5 py-1.5 focus:border-gold outline-none"
                >
                  <option value="">Semua Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="CLASSIFYING">Klasifikasi</option>
                  <option value="PROCESSING_OCR">Proses OCR</option>
                  <option value="VALIDATING">Validasi</option>
                  <option value="REVIEW_REQUIRED">Butuh Review</option>
                  <option value="COMPLETED">Selesai</option>
                  <option value="FAILED">Gagal</option>
                </select>

                <select
                  value={filters.documentType}
                  onChange={(e) => setFilters(prev => ({ ...prev, documentType: e.target.value }))}
                  className="bg-navy border border-navy-border text-white text-xs rounded-lg px-2.5 py-1.5 focus:border-gold outline-none"
                >
                  <option value="">Semua Tipe</option>
                  <option value="KTP">KTP</option>
                  <option value="KK">Kartu Keluarga</option>
                  <option value="NPWP">NPWP</option>
                  <option value="SHM">SHM (Tanah)</option>
                  <option value="BPKB">BPKB (Kendaraan)</option>
                  <option value="SURAT_NIKAH">Buku Nikah</option>
                  <option value="SLIK">SLIK</option>
                  <option value="SURVEY">Survey</option>
                  <option value="UNKNOWN">Belum Diketahui</option>
                </select>
                
                <button 
                  onClick={fetchJobs} 
                  className="btn btn-secondary px-2.5 py-1.5 text-xs flex items-center justify-center"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-x-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Loader2 className="w-8 h-8 text-gold animate-spin" />
                  <p className="text-slate-400 text-sm">Memuat daftar dokumen...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                  <FileText className="w-12 h-12 text-slate-600 mb-3" />
                  <h3 className="text-white font-medium">Antrean Dokumen Kosong</h3>
                  <p className="text-slate-500 text-sm max-w-sm mt-1">
                    Silakan upload dokumen kredit nasabah baru atau cari file lama.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-navy-border text-slate-400 font-medium">
                      <th className="p-4">Dokumen</th>
                      <th className="p-4">Tipe AI</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Mapping</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-border/50 text-white">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-navy/30 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-white max-w-[200px] truncate" title={job.file_name}>
                            {job.file_name}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {(job.file_size / 1024 / 1024).toFixed(2)} MB • {new Date(job.created_at).toLocaleDateString('id-ID')}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            job.document_type === 'UNKNOWN' ? 'bg-slate-500/20 text-slate-400' : 'bg-gold/15 text-gold-light'
                          }`}>
                            {job.document_type}
                          </span>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(job.status)}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            job.mapping_status === 'MAPPED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                          }`}>
                            {job.mapping_status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            {job.status === 'REVIEW_REQUIRED' ? (
                              <button
                                onClick={() => navigate(`/document-intelligence/${job.id}`)}
                                className="btn bg-gold text-navy hover:bg-gold-dark px-3 py-1.5 text-xs font-bold flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" /> Review <ArrowRight className="w-3 h-3" />
                              </button>
                            ) : (
                              <button
                                onClick={() => navigate(`/document-intelligence/${job.id}`)}
                                className="btn btn-secondary px-2.5 py-1.5 text-xs flex items-center justify-center"
                                title="Lihat Status"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            
                            {(job.status === 'FAILED' || job.status === 'UNKNOWN') && (
                              <button
                                onClick={() => handleProcessJob(job.id)}
                                className="btn btn-secondary px-2.5 py-1.5 text-xs flex items-center justify-center text-amber-400 hover:text-amber-300"
                                title="Proses Ulang"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              className="btn btn-secondary px-2.5 py-1.5 text-xs flex items-center justify-center text-red-400 hover:text-red-300"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer Pagination */}
            {totalJobs > limit && (
              <div className="card-footer border-navy-border flex items-center justify-between p-4">
                <span className="text-xs text-slate-500">
                  Menampilkan {jobs.length} dari {totalJobs} dokumen
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="btn btn-secondary px-2.5 py-1.5 text-xs disabled:opacity-50"
                  >
                    Sebelumnya
                  </button>
                  <button
                    disabled={page * limit >= totalJobs}
                    onClick={() => setPage(page + 1)}
                    className="btn btn-secondary px-2.5 py-1.5 text-xs disabled:opacity-50"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
