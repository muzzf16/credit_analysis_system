import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, AlertTriangle, Save, Play, Trash2, ShieldAlert,
  Loader2, RefreshCw, Eye, Sparkles, FileText, ChevronRight, FileSpreadsheet, MapPin
} from 'lucide-react';
import { documentIntelligenceService } from '../../services';
import { toast } from 'react-toastify';

const TABS = ['Data Ekstraksi', 'Validasi AI', 'Perbandingan Data', 'Log Proses'];

export default function DocumentReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mapping, setMapping] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Form State
  const [formData, setFormData] = useState({});

  // Image controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const fetchJobDetails = async () => {
    setLoading(true);
    try {
      const res = await documentIntelligenceService.getJobById(id);
      setJob(res.data.data);
      setFormData(res.data.data.extracted_data || {});
    } catch (err) {
      toast.error('Gagal mengambil detail dokumen.');
      navigate('/document-intelligence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedFieldChange = (field, index, subfield, value) => {
    setFormData(prev => {
      const list = [...(prev[field] || [])];
      list[index] = { ...list[index], [subfield]: value };
      return { ...prev, [field]: list };
    });
  };

  const handleAddRow = (field, template) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), template]
    }));
  };

  const handleRemoveRow = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index)
    }));
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const res = await documentIntelligenceService.updateJobData(id, formData);
      setJob(res.data.data);
      toast.success('Draf perubahan berhasil disimpan.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan draf.');
    } finally {
      setSaving(false);
    }
  };

  const handleMapToSystem = async () => {
    if (!window.confirm('Apakah Anda yakin ingin memetakan data ini ke dalam sistem database? Data yang ada akan disinkronkan.')) return;
    setMapping(true);
    try {
      await documentIntelligenceService.mapJob(id);
      toast.success(`Data berhasil dipetakan ke record ${job.document_type} di database.`);
      navigate('/document-intelligence');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memetakan data dokumen.');
    } finally {
      setMapping(false);
    }
  };

  const handleReProcess = async () => {
    setLoading(true);
    try {
      const res = await documentIntelligenceService.processJob(id);
      setJob(res.data.data);
      setFormData(res.data.data.extracted_data || {});
      toast.success('Proses ekstraksi ulang selesai.');
    } catch (err) {
      toast.error('Gagal menjalankan proses ekstraksi.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
        <p className="text-slate-400 text-sm">Mengunduh file & menjalankan kalkulasi...</p>
      </div>
    );
  }

  const isPdf = job.mime_type === 'application/pdf' || job.file_name.toLowerCase().endsWith('.pdf');

  // Render KTP Form Fields
  const renderKtpForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="label">NIK</label>
        <input 
          type="text" 
          value={formData.nik || ''} 
          onChange={(e) => handleFieldChange('nik', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">Nama Lengkap</label>
        <input 
          type="text" 
          value={formData.nama || ''} 
          onChange={(e) => handleFieldChange('nama', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">Tempat & Tanggal Lahir</label>
        <input 
          type="text" 
          value={formData.tempat_tgl_lahir || ''} 
          onChange={(e) => handleFieldChange('tempat_tgl_lahir', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">Jenis Kelamin</label>
        <select 
          value={formData.jenis_kelamin || ''} 
          onChange={(e) => handleFieldChange('jenis_kelamin', e.target.value)} 
          className="input-field"
        >
          <option value="">Pilih</option>
          <option value="LAKI-LAKI">LAKI-LAKI</option>
          <option value="PEREMPUAN">PEREMPUAN</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="label">Alamat</label>
        <textarea 
          value={formData.alamat || ''} 
          onChange={(e) => handleFieldChange('alamat', e.target.value)} 
          className="input-field h-20"
        />
      </div>
      <div>
        <label className="label">RT/RW</label>
        <input 
          type="text" 
          value={formData.rt_rw || ''} 
          onChange={(e) => handleFieldChange('rt_rw', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">Kel/Desa</label>
        <input 
          type="text" 
          value={formData.kel_desa || formData.kelurahan || ''} 
          onChange={(e) => handleFieldChange('kel_desa', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">Kecamatan</label>
        <input 
          type="text" 
          value={formData.kecamatan || ''} 
          onChange={(e) => handleFieldChange('kecamatan', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">Agama</label>
        <input 
          type="text" 
          value={formData.agama || ''} 
          onChange={(e) => handleFieldChange('agama', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">Status Perkawinan</label>
        <input 
          type="text" 
          value={formData.status_perkawinan || ''} 
          onChange={(e) => handleFieldChange('status_perkawinan', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">Pekerjaan</label>
        <input 
          type="text" 
          value={formData.pekerjaan || ''} 
          onChange={(e) => handleFieldChange('pekerjaan', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">Kewarganegaraan</label>
        <input 
          type="text" 
          value={formData.kewarganegaraan || ''} 
          onChange={(e) => handleFieldChange('kewarganegaraan', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">Berlaku Hingga</label>
        <input 
          type="text" 
          value={formData.berlaku_hingga || ''} 
          onChange={(e) => handleFieldChange('berlaku_hingga', e.target.value)} 
          className="input-field"
        />
      </div>
    </div>
  );

  // Render Kartu Keluarga (KK) Fields
  const renderKkForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Nomor KK</label>
          <input 
            type="text" 
            value={formData.nomor_kk || ''} 
            onChange={(e) => handleFieldChange('nomor_kk', e.target.value)} 
            className="input-field"
          />
        </div>
        <div>
          <label className="label">Kepala Keluarga</label>
          <input 
            type="text" 
            value={formData.kepala_keluarga || ''} 
            onChange={(e) => handleFieldChange('kepala_keluarga', e.target.value)} 
            className="input-field"
          />
        </div>
        <div className="md:col-span-2">
          <label className="label">Alamat Lengkap</label>
          <textarea 
            value={formData.alamat || ''} 
            onChange={(e) => handleFieldChange('alamat', e.target.value)} 
            className="input-field h-20"
          />
        </div>
      </div>

      <div className="border-t border-navy-border pt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gold">Daftar Anggota Keluarga</h4>
          <button 
            type="button" 
            onClick={() => handleAddRow('anggota', { nama: '', nik: '' })}
            className="btn btn-secondary py-1 px-2.5 text-xs"
          >
            + Tambah Anggota
          </button>
        </div>

        <div className="space-y-2">
          {(formData.anggota || []).map((member, index) => (
            <div key={index} className="flex gap-2 items-center bg-navy/55 p-2 rounded-lg border border-navy-border">
              <span className="text-xs text-slate-500 font-bold w-6">{index + 1}.</span>
              <div className="flex-1">
                <input 
                  type="text" 
                  placeholder="Nama Anggota"
                  value={member.nama || ''} 
                  onChange={(e) => handleNestedFieldChange('anggota', index, 'nama', e.target.value)} 
                  className="input-field text-xs py-1"
                />
              </div>
              <div className="flex-1">
                <input 
                  type="text" 
                  placeholder="NIK Anggota"
                  value={member.nik || ''} 
                  onChange={(e) => handleNestedFieldChange('anggota', index, 'nik', e.target.value)} 
                  className="input-field text-xs py-1"
                />
              </div>
              <button 
                type="button" 
                onClick={() => handleRemoveRow('anggota', index)} 
                className="text-red-400 hover:text-red-300 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render NPWP Fields
  const renderNpwpForm = () => (
    <div className="grid grid-cols-1 gap-4">
      <div>
        <label className="label">Nomor NPWP</label>
        <input 
          type="text" 
          value={formData.nomor_npwp || ''} 
          onChange={(e) => handleFieldChange('nomor_npwp', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">Nama Pemegang NPWP</label>
        <input 
          type="text" 
          value={formData.nama || ''} 
          onChange={(e) => handleFieldChange('nama', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label font-medium text-slate-300">Alamat NPWP</label>
        <textarea 
          value={formData.alamat || ''} 
          onChange={(e) => handleFieldChange('alamat', e.target.value)} 
          className="input-field h-24"
        />
      </div>
    </div>
  );

  // Render Surat Nikah Fields
  const renderSuratNikahForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="label">Nama Suami</label>
        <input 
          type="text" 
          value={formData.suamiNama || ''} 
          onChange={(e) => handleFieldChange('suamiNama', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">NIK Suami</label>
        <input 
          type="text" 
          value={formData.suamiNik || ''} 
          onChange={(e) => handleFieldChange('suamiNik', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">Nama Istri</label>
        <input 
          type="text" 
          value={formData.istriNama || ''} 
          onChange={(e) => handleFieldChange('istriNama', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">NIK Istri</label>
        <input 
          type="text" 
          value={formData.istriNik || ''} 
          onChange={(e) => handleFieldChange('istriNik', e.target.value)} 
          className="input-field"
        />
      </div>
      <div className="md:col-span-2">
        <label className="label">Tanggal Pernikahan</label>
        <input 
          type="text" 
          value={formData.tanggalNikah || ''} 
          onChange={(e) => handleFieldChange('tanggalNikah', e.target.value)} 
          className="input-field"
        />
      </div>
    </div>
  );

  // Render SHM Fields
  const renderShmForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="label">Nomor Sertifikat (Hak Milik)</label>
        <input 
          type="text" 
          value={formData.nomor_sertifikat || ''} 
          onChange={(e) => handleFieldChange('nomor_sertifikat', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">NIB</label>
        <input 
          type="text" 
          value={formData.nib || ''} 
          onChange={(e) => handleFieldChange('nib', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">Pemegang Hak</label>
        <input 
          type="text" 
          value={formData.nama_pemegang_hak || formData.atas_nama || ''} 
          onChange={(e) => handleFieldChange('nama_pemegang_hak', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">Luas (m2)</label>
        <input 
          type="number" 
          value={formData.luas_m2 || formData.luas_tanah || 0} 
          onChange={(e) => handleFieldChange('luas_m2', parseInt(e.target.value, 10))} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">Desa / Kelurahan</label>
        <input 
          type="text" 
          value={formData.desa_kelurahan || formData.desa || ''} 
          onChange={(e) => handleFieldChange('desa_kelurahan', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">Kecamatan</label>
        <input 
          type="text" 
          value={formData.kecamatan || ''} 
          onChange={(e) => handleFieldChange('kecamatan', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">Kabupaten / Kota</label>
        <input 
          type="text" 
          value={formData.kabupaten_kota || formData.kabupaten || ''} 
          onChange={(e) => handleFieldChange('kabupaten_kota', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label font-medium text-slate-300">Provinsi</label>
        <input 
          type="text" 
          value={formData.provinsi || ''} 
          onChange={(e) => handleFieldChange('provinsi', e.target.value)} 
          className="input-field"
        />
      </div>
      <div className="md:col-span-2">
        <label className="label">Keadaan Tanah / Deskripsi</label>
        <textarea 
          value={formData.keadaan_tanah || ''} 
          onChange={(e) => handleFieldChange('keadaan_tanah', e.target.value)} 
          className="input-field h-16"
        />
      </div>
    </div>
  );

  // Render BPKB Fields
  const renderBpkbForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="label">Nomor BPKB</label>
        <input 
          type="text" 
          value={formData.nomor_bpkb || ''} 
          onChange={(e) => handleFieldChange('nomor_bpkb', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label font-medium text-slate-300">Nomor Polisi (Plat)</label>
        <input 
          type="text" 
          value={formData.nomor_polisi || ''} 
          onChange={(e) => handleFieldChange('nomor_polisi', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">Merk Kendaraan</label>
        <input 
          type="text" 
          value={formData.merk || ''} 
          onChange={(e) => handleFieldChange('merk', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">Tipe / Model</label>
        <input 
          type="text" 
          value={formData.tipe || ''} 
          onChange={(e) => handleFieldChange('tipe', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label">Tahun Pembuatan</label>
        <input 
          type="text" 
          value={formData.tahun || ''} 
          onChange={(e) => handleFieldChange('tahun', e.target.value)} 
          className="input-field"
        />
      </div>
      <div>
        <label className="label font-medium text-slate-300">Atas Nama Pemilik BPKB</label>
        <input 
          type="text" 
          value={formData.atas_nama || ''} 
          onChange={(e) => handleFieldChange('atas_nama', e.target.value)} 
          className="input-field"
        />
      </div>
    </div>
  );

  // Render SLIK Form
  const renderSlikForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="label">Total Fasilitas</label>
          <input 
            type="number" 
            value={formData.totalFasilitas || 0} 
            onChange={(e) => handleFieldChange('totalFasilitas', parseInt(e.target.value, 10))} 
            className="input-field"
          />
        </div>
        <div>
          <label className="label">Total Plafon</label>
          <input 
            type="number" 
            value={formData.totalPlafon || 0} 
            onChange={(e) => handleFieldChange('totalPlafon', parseFloat(e.target.value))} 
            className="input-field"
          />
        </div>
        <div>
          <label className="label">Total Baki Debet</label>
          <input 
            type="number" 
            value={formData.totalBakiDebet || 0} 
            onChange={(e) => handleFieldChange('totalBakiDebet', parseFloat(e.target.value))} 
            className="input-field"
          />
        </div>
        <div>
          <label className="label text-slate-300">Kolektibilitas Tertinggi</label>
          <input 
            type="number" 
            value={formData.kolektibilitasTertinggi || 1} 
            onChange={(e) => handleFieldChange('kolektibilitasTertinggi', parseInt(e.target.value, 10))} 
            className="input-field"
          />
        </div>
      </div>

      <div className="border-t border-navy-border pt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gold">Detail Fasilitas Kredit</h4>
          <button 
            type="button" 
            onClick={() => handleAddRow('detailSlik', { bank: '', plafon: 0, bakiDebet: 0, kolektibilitas: 1, jatuhTempo: '' })}
            className="btn btn-secondary py-1 px-2.5 text-xs"
          >
            + Tambah Fasilitas
          </button>
        </div>

        <div className="space-y-2">
          {(formData.detailSlik || []).map((fac, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center bg-navy/55 p-3 rounded-lg border border-navy-border relative">
              <div>
                <input 
                  type="text" 
                  placeholder="Nama Bank/Lembaga"
                  value={fac.bank || ''} 
                  onChange={(e) => handleNestedFieldChange('detailSlik', index, 'bank', e.target.value)} 
                  className="input-field text-xs py-1"
                />
              </div>
              <div>
                <input 
                  type="number" 
                  placeholder="Plafon"
                  value={fac.plafon || 0} 
                  onChange={(e) => handleNestedFieldChange('detailSlik', index, 'plafon', parseFloat(e.target.value))} 
                  className="input-field text-xs py-1"
                />
              </div>
              <div>
                <input 
                  type="number" 
                  placeholder="Baki Debet"
                  value={fac.bakiDebet || 0} 
                  onChange={(e) => handleNestedFieldChange('detailSlik', index, 'bakiDebet', parseFloat(e.target.value))} 
                  className="input-field text-xs py-1"
                />
              </div>
              <div>
                <input 
                  type="number" 
                  placeholder="Kol"
                  value={fac.kolektibilitas || 1} 
                  onChange={(e) => handleNestedFieldChange('detailSlik', index, 'kolektibilitas', parseInt(e.target.value, 10))} 
                  className="input-field text-xs py-1"
                />
              </div>
              <div className="flex items-center gap-1">
                <input 
                  type="text" 
                  placeholder="Tgl Jt Tempo"
                  value={fac.jatuhTempo || ''} 
                  onChange={(e) => handleNestedFieldChange('detailSlik', index, 'jatuhTempo', e.target.value)} 
                  className="input-field text-xs py-1"
                />
                <button 
                  type="button" 
                  onClick={() => handleRemoveRow('detailSlik', index)} 
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top control bar */}
      <div className="flex items-center justify-between border-b border-navy-border pb-4">
        <button 
          onClick={() => navigate('/document-intelligence')}
          className="btn btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        <div className="flex gap-2">
          {job.status === 'REVIEW_REQUIRED' && (
            <>
              <button 
                onClick={handleSaveDraft}
                disabled={saving}
                className="btn btn-secondary px-3.5 py-2 text-xs flex items-center gap-1.5"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-gold" />}
                Simpan Perubahan
              </button>

              <button 
                onClick={handleMapToSystem}
                disabled={mapping}
                className="btn btn-primary px-3.5 py-2 text-xs flex items-center gap-1.5 font-bold"
              >
                {mapping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Approve & Map ke Sistem
              </button>
            </>
          )}

          <button 
            onClick={handleReProcess}
            className="btn btn-secondary px-3.5 py-2 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-Proses AI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-210px)] overflow-hidden">
        {/* Left Side: Document Viewer */}
        <div className="flex flex-col bg-navy-light border border-navy-border rounded-xl overflow-hidden h-full">
          <div className="px-4 py-3 bg-navy border-b border-navy-border flex items-center justify-between">
            <span className="text-sm font-semibold text-white truncate max-w-[280px]">
              {job.file_name}
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                className="btn btn-secondary px-2.5 py-1 text-xs"
              >
                Zoom -
              </button>
              <button 
                onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
                className="btn btn-secondary px-2.5 py-1 text-xs"
              >
                Zoom +
              </button>
              <button 
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                className="btn btn-secondary px-2.5 py-1 text-xs"
              >
                Putar ↻
              </button>
            </div>
          </div>

          <div className="flex-1 bg-navy/80 overflow-auto flex justify-center items-center p-4 relative">
            {isPdf ? (
              <iframe
                src={`${job.file_url}#toolbar=0`}
                className="w-full h-full border-0 rounded-lg"
                title="Document PDF Viewer"
              />
            ) : (
              <div 
                className="transition-transform duration-200 origin-center"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`
                }}
              >
                <img 
                  src={job.file_url} 
                  alt="Credit Document File" 
                  className="max-h-[70vh] rounded border border-navy-border object-contain shadow-2xl"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Tab Panels */}
        <div className="flex flex-col bg-navy-light border border-navy-border rounded-xl overflow-hidden h-full">
          {/* Tab Headers */}
          <div className="bg-navy border-b border-navy-border flex">
            {TABS.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 outline-none ${
                  activeTab === idx 
                    ? 'border-gold text-gold bg-navy-light/10' 
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* TAB 0: Data Extraction */}
            {activeTab === 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-navy-border">
                  <div>
                    <h3 className="font-bold text-white text-base">Metadata AI</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Tipe terdeteksi & engine pemrosesan</p>
                  </div>
                  <span className="badge bg-gold/15 text-gold-light font-bold text-xs px-2.5 py-1 border border-gold/30">
                    Tipe: {job.document_type}
                  </span>
                </div>

                {job.document_type === 'KTP' && renderKtpForm()}
                {job.document_type === 'KK' && renderKkForm()}
                {job.document_type === 'NPWP' && renderNpwpForm()}
                {job.document_type === 'SURAT_NIKAH' && renderSuratNikahForm()}
                {job.document_type === 'SHM' && renderShmForm()}
                {job.document_type === 'BPKB' && renderBpkbForm()}
                {job.document_type === 'SLIK' && renderSlikForm()}

                {job.document_type === 'UNKNOWN' && (
                  <div className="flex flex-col items-center justify-center py-10 bg-navy/20 border border-dashed border-navy-border rounded-lg text-center p-4">
                    <ShieldAlert className="w-10 h-10 text-amber-500 mb-2" />
                    <h4 className="text-white font-semibold">Tipe Dokumen Tidak Teridentifikasi</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      AI tidak dapat mengklasifikasikan tipe dokumen ini secara otomatis. Silakan jalankan ekstraksi ulang atau upload file yang didukung.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: Validation */}
            {activeTab === 1 && (
              <div className="space-y-4">
                <div className="pb-2 border-b border-navy-border">
                  <h3 className="font-bold text-white text-base">Status Kelengkapan & Validitas</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Hasil validasi skema input dokumen</p>
                </div>

                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  job.validation_results?.is_valid 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  {job.validation_results?.is_valid ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm">
                      {job.validation_results?.is_valid ? 'Dokumen Valid & Lengkap' : 'Dokumen Butuh Perbaikan / Tidak Lengkap'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {job.validation_results?.is_valid 
                        ? 'Semua data wajib yang diperlukan berhasil terbaca dengan format yang tepat.' 
                        : 'Ada beberapa parameter wajib yang gagal terbaca atau bernilai kosong.'}
                    </p>
                  </div>
                </div>

                {/* Errors */}
                {(job.validation_results?.errors || []).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">Kesalahan Kritis</h4>
                    <ul className="space-y-1.5">
                      {(job.validation_results.errors).map((err, i) => (
                        <li key={i} className="text-xs flex items-center gap-1.5 text-slate-300 bg-red-500/5 p-2 rounded border border-red-500/20">
                          <X className="w-3.5 h-3.5 text-red-500 flex-shrink-0" /> {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {(job.validation_results?.warnings || []).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Peringatan (Warnings)</h4>
                    <ul className="space-y-1.5">
                      {(job.validation_results.warnings).map((warn, i) => (
                        <li key={i} className="text-xs flex items-center gap-1.5 text-slate-300 bg-amber-500/5 p-2 rounded border border-amber-500/20">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" /> {warn}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(!job.validation_results?.errors?.length && !job.validation_results?.warnings?.length) && (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    Tidak ada peringatan atau kesalahan untuk dokumen ini.
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Comparison (Fraud Checker) */}
            {activeTab === 2 && (
              <div className="space-y-4">
                <div className="pb-2 border-b border-navy-border">
                  <h3 className="font-bold text-white text-base">Fraud & Consistency Checker</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Mencocokkan data OCR dengan data yang terdaftar di Sistem Kredit BPR</p>
                </div>

                {!job.debitur_id && !job.pengajuan_id ? (
                  <div className="text-center py-10 bg-navy/20 border border-dashed border-navy-border rounded-lg text-slate-500 text-xs p-4">
                    <Link className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    Dokumen ini tidak terhubung dengan debitur atau pengajuan kredit terdaftar.
                    Perbandingan data tidak dapat dijalankan.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                      job.comparison_results?.is_matching 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    }`}>
                      {job.comparison_results?.is_matching ? (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      )}
                      <div>
                        <h4 className="font-bold text-sm">
                          {job.comparison_results?.is_matching ? 'Data Konsisten (Match)' : 'Ditemukan Ketidaksesuaian Data (Discrepancy)'}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {job.comparison_results?.is_matching 
                            ? 'Seluruh data field OCR cocok 100% dengan database perbankan.' 
                            : 'Waspada! Beberapa nilai field OCR berbeda dari data yang dimasukkan AO di database.'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daftar Kecocokan Field</h4>
                      <div className="divide-y divide-navy-border bg-navy/35 rounded-xl border border-navy-border overflow-hidden">
                        {Object.entries(job.comparison_results?.fields || {}).map(([key, val]) => (
                          <div key={key} className="p-3 grid grid-cols-3 gap-2 text-xs">
                            <div className="font-semibold text-slate-300 capitalize">{key.replace(/_/g, ' ')}</div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-500 block uppercase font-bold">Di DB</span>
                              <span className="text-white font-medium">{val.db_value}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-500 block uppercase font-bold flex justify-between">
                                Hasil OCR
                                <span className={val.is_match ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                  {val.is_match ? '✓ Match' : '✗ Beda'}
                                </span>
                              </span>
                              <span className="text-white font-medium">{val.ocr_value}</span>
                              {val.similarity_score > 0 && val.similarity_score < 100 && (
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  Skor Kemiripan: {val.similarity_score}%
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Timeline & Logs */}
            {activeTab === 3 && (
              <div className="space-y-4">
                <div className="pb-2 border-b border-navy-border">
                  <h3 className="font-bold text-white text-base">Log & Audit Trail</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Riwayat proses perubahan status dokumen</p>
                </div>

                <div className="relative border-l border-navy-border ml-3 pl-6 space-y-5">
                  {(job.logs || []).map((log, i) => (
                    <div key={i} className="relative">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[30px] top-1.5 w-3.5 h-3.5 rounded-full border-2 ${
                        log.status === 'COMPLETED' ? 'bg-emerald-500 border-navy-light' :
                        log.status === 'FAILED' ? 'bg-rose-500 border-navy-light' :
                        log.status === 'REVIEW_REQUIRED' ? 'bg-amber-500 border-navy-light' :
                        'bg-gold border-navy-light'
                      }`} />
                      
                      <div className="text-xs text-slate-500 font-bold">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </div>
                      <div className="text-sm font-semibold text-white mt-0.5">
                        {log.status}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {log.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
