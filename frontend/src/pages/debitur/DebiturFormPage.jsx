import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Save, Loader2, ArrowLeft, Camera, Sparkles } from 'lucide-react';
import { debiturService, ocrService, documentService } from '../../services';
import { GENDER, STATUS_NIKAH, PENDIDIKAN, JENIS_PEKERJAAN } from '../../utils/constants';

const TABS = ['Data Pribadi', 'Pasangan', 'Pekerjaan', 'Usaha'];

export default function DebiturFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [pribadi, setPribadi] = useState({ nik: '', nama: '', tempatLahir: '', tanggalLahir: '', gender: 'L', statusNikah: 'BELUM_KAWIN', pendidikan: 'SMA', agama: 'ISLAM', pekerjaan: '', kewarganegaraan: 'WNI', berlakuHingga: 'SEUMUR HIDUP', alamat: '', rt: '', rw: '', kelurahan: '', kecamatan: '', kabupaten: 'Batang', kodePos: '', noHp: '', email: '', ibuKandung: '', hubunganBank: 'Nasabah Baru', kreditAktif: 'Tidak Ada' });
  const [pasangan, setPasangan] = useState({ nama: '', nik: '', tempatLahir: '', tanggalLahir: '', pendidikan: 'SMA', pekerjaan: '', noHp: '' });
  const [pekerjaan, setPekerjaan] = useState({ jenisPekerjaan: 'SWASTA', namaInstansi: '', jabatan: '', masaKerjaTahun: 0, alamatKantor: '', noTelpKantor: '', gajiPokok: 0, tunjangan: 0, penghasilanLain: 0 });
  const [usaha, setUsaha] = useState({ namaUsaha: '', jenisUsaha: '', lamaUsahaTahun: 0, alamatUsaha: '', omsetBulanan: 0, jumlahKaryawan: 0, statusTempatUsaha: 'MILIK' });

  const updateField = (setter) => (field, value) => setter(prev => ({ ...prev, [field]: value }));
  const [ocrLoading, setOcrLoading] = useState(false);
  const [vlmEngine, setVlmEngine] = useState(null); // 'lfm' | 'tesseract' | null
  const [confidences, setConfidences] = useState({});

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      setLoading(true);
      debiturService.getById(id).then(res => {
        const d = res.data.data;
        setPribadi({
          nik: d.nik || '', nama: d.nama || '', tempatLahir: d.tempat_lahir || '',
          tanggalLahir: d.tanggal_lahir ? d.tanggal_lahir.split('T')[0] : '',
          gender: d.gender || 'L', statusNikah: d.status_nikah || 'BELUM_KAWIN',
          pendidikan: d.pendidikan || 'SMA', agama: d.agama || 'Islam',
          alamat: d.alamat || '', kelurahan: d.kelurahan || '', kecamatan: d.kecamatan || '',
          kabupaten: d.kabupaten || 'Batang', kodePos: d.kode_pos || '', noHp: d.no_hp || '', email: d.email || '',
          ibuKandung: d.ibu_kandung || '', hubunganBank: d.hubungan_bank || 'Nasabah Baru', kreditAktif: d.kredit_aktif || 'Tidak Ada'
        });
        if (d.pasangan) {
          setPasangan({
            nama: d.pasangan.nama || '', nik: d.pasangan.nik || '', tempatLahir: d.pasangan.tempat_lahir || '',
            tanggalLahir: d.pasangan.tanggal_lahir ? d.pasangan.tanggal_lahir.split('T')[0] : '',
            pendidikan: d.pasangan.pendidikan || 'SMA', pekerjaan: d.pasangan.pekerjaan || '', noHp: d.pasangan.no_hp || ''
          });
        }
        if (d.pekerjaan) {
          setPekerjaan({
            jenisPekerjaan: d.pekerjaan.jenis_pekerjaan || 'SWASTA', namaInstansi: d.pekerjaan.nama_instansi || '',
            jabatan: d.pekerjaan.jabatan || '', masaKerjaTahun: d.pekerjaan.masa_kerja_tahun || 0,
            alamatKantor: d.pekerjaan.alamat_kantor || '', noTelpKantor: d.pekerjaan.no_telp_kantor || '',
            gajiPokok: d.pekerjaan.gaji_pokok || 0, tunjangan: d.pekerjaan.tunjangan || 0, penghasilanLain: d.pekerjaan.penghasilan_lain || 0
          });
        }
        if (d.usaha) {
          setUsaha({
            namaUsaha: d.usaha.nama_usaha || '', jenisUsaha: d.usaha.jenis_usaha || '',
            lamaUsahaTahun: d.usaha.lama_usaha_tahun || 0, alamatUsaha: d.usaha.alamat_usaha || '',
            omsetBulanan: d.usaha.omset_bulanan || 0, jumlahKaryawan: d.usaha.jumlah_karyawan || 0, statusTempatUsaha: d.usaha.status_tempat_usaha || 'MILIK'
          });
        }
      }).catch(err => setError('Gagal memuat data debitur.'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Normalisasi nilai jenis_kelamin dari VLM (LAKI-LAKI/PEREMPUAN) ke state gender (L/P)
  const normalizeGender = (val) => {
    if (!val) return '';
    const v = val.toUpperCase();
    if (v === 'LAKI-LAKI' || v === 'LAKI' || v === 'L') return 'L';
    if (v === 'PEREMPUAN' || v === 'P') return 'P';
    return val;
  };

  // Normalisasi status_perkawinan dari VLM ke statusNikah state
  const normalizeStatus = (val) => {
    if (!val) return '';
    const v = val.toUpperCase();
    if (v.includes('BELUM')) return 'BELUM_KAWIN';
    if (v === 'KAWIN' || v.includes('KAWIN')) return 'KAWIN';
    if (v.includes('CERAI HIDUP')) return 'CERAI_HIDUP';
    if (v.includes('CERAI MATI')) return 'CERAI_MATI';
    return val;
  };

  // Normalisasi tanggal lahir ke YYYY-MM-DD untuk input type="date"
  const normalizeDate = (val) => {
    if (!val) return '';
    const cleanVal = val.trim();
    // Cari pola DD-MM-YYYY atau DD/MM/YYYY di dalam string (non-anchored)
    const dmyMatch = cleanVal.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
    if (dmyMatch) {
      const [, d, m, y] = dmyMatch;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    // Jika VLM mengembalikan format YYYY-MM-DD
    const ymdMatch = cleanVal.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (ymdMatch) {
      const [, y, m, d] = ymdMatch;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    // Fallback original value
    return cleanVal;
  };

  const extractTempatLahir = (d) => {
    return d.tempat_lahir || d.tempatLahir || d.tempat_tgl_lahir?.split(',')?.[0]?.trim() || '';
  };

  const extractTanggalLahir = (d, fallback = '') => {
    return normalizeDate(
      d.tanggal_lahir ||
      d.tanggalLahir ||
      d.tempat_tgl_lahir?.split(',')?.slice(1).join(',') ||
      fallback
    );
  };

  const extractRt = (d) => {
    if (d.rt) return d.rt;
    if (d.rt_rw && d.rt_rw.includes('/')) return d.rt_rw.split('/')[0]?.trim() || '';
    return '';
  };

  const extractRw = (d) => {
    if (d.rw) return d.rw;
    if (d.rt_rw && d.rt_rw.includes('/')) return d.rt_rw.split('/')[1]?.trim() || '';
    return '';
  };

  const extractKelurahan = (d) => d.kel_desa || d.kelurahan || d.desa || d.desa_kelurahan || '';

  const extractKtpData = (payload) => {
    if (!payload || typeof payload !== 'object') return {};

    const candidates = [
      payload?.data?.data,
      payload?.data,
      payload?.result?.data,
      payload?.result,
      payload
    ];

    for (const candidate of candidates) {
      if (candidate && typeof candidate === 'object') {
        if (candidate.nik || candidate.nama || candidate.tempat_lahir || candidate.tempatLahir || candidate.tempat_tgl_lahir) {
          return candidate;
        }
      }
    }

    return {};
  };

  const handleOcrScan = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrLoading(true);
    setError('');
    setVlmEngine(null);
    setConfidences({});
    const formData = new FormData();
    formData.append('file', file);

    try {
      if (type === 'ktp') {
        const res = await documentService.extractKtp(formData);
        const result = res.data?.data || {};
        const d = extractKtpData(result);
        const resultEngine = result.engineUsed || res.data?.engineUsed || 'lfm';
        const resultConfidences = result.confidences || res.data?.confidences || {};

        console.log('[OCR KTP] Raw response:', res.data);
        console.log('[OCR KTP] Normalized payload:', d);

        setVlmEngine(resultEngine);
        setConfidences(resultConfidences);

        setPribadi(prev => ({
          ...prev,
          nik:          d.nik          || prev.nik,
          nama:         d.nama         || prev.nama,
          tempatLahir:  extractTempatLahir(d) || prev.tempatLahir,
          tanggalLahir: extractTanggalLahir(d, prev.tanggalLahir) || prev.tanggalLahir,
          gender:       d.gender       || (d.jenis_kelamin === 'PEREMPUAN' ? 'P' : d.jenis_kelamin === 'LAKI-LAKI' ? 'L' : prev.gender),
          statusNikah:  d.statusNikah  || d.status_nikah?.replace('_', ' ') || prev.statusNikah,
          alamat:       d.alamat       || prev.alamat,
          rt:           extractRt(d)   || prev.rt,
          rw:           extractRw(d)   || prev.rw,
          kelurahan:    extractKelurahan(d) || prev.kelurahan,
          kecamatan:    d.kecamatan    || prev.kecamatan,
          agama:        d.agama        || prev.agama,
          pekerjaan:    d.pekerjaan    || prev.pekerjaan,
          kewarganegaraan: d.kewarganegaraan || prev.kewarganegaraan,
          berlakuHingga: d.berlakuHingga || d.berlaku_hingga || prev.berlakuHingga,
        }));
      } else if (type === 'surat_nikah') {
        const res = await documentService.extractSuratNikah(formData);
        const result = res.data.data;
        const extracted = result.data || {};
        setVlmEngine(result.engineUsed || 'lfm');

        const suamiMatches = extracted.suamiNama && pribadi.nama &&
          (extracted.suamiNama.includes(pribadi.nama) || pribadi.nama.includes(extracted.suamiNama));

        if (suamiMatches) {
          setPasangan(prev => ({
            ...prev,
            nama: extracted.istriNama || prev.nama,
            nik: extracted.istriNik || prev.nik,
            tanggalLahir: extracted.tanggalNikah || prev.tanggalLahir,
          }));
        } else {
          setPasangan(prev => ({
            ...prev,
            nama: extracted.suamiNama || prev.nama,
            nik: extracted.suamiNik || prev.nik,
            tanggalLahir: extracted.tanggalNikah || prev.tanggalLahir,
          }));
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memproses dokumen. Pastikan file foto jelas dan tidak terlalu besar.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const body = { pribadi, pekerjaan };
      if (pribadi.statusNikah === 'KAWIN') body.pasangan = pasangan;
      if (usaha.namaUsaha) body.usaha = usaha;
      
      if (isEditing) {
        await debiturService.update(id, body);
      } else {
        await debiturService.create(body);
      }
      navigate('/debitur');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data debitur.');
    }
    setLoading(false);
  };

  const renderInput = (label, value, onChange, type = 'text', options = null, fieldKey = null) => {
    const confidence = fieldKey ? confidences[fieldKey] : null;
    const isLowConfidence = confidence !== null && confidence !== undefined && confidence < 0.85;

    return (
      <div className="relative">
        <div className="flex justify-between items-center mb-1">
          <label className="label m-0">{label}</label>
          {isLowConfidence && (
            <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded animate-pulse">
              Fuzzy ({Math.round(confidence * 100)}%)
            </span>
          )}
        </div>
        {options ? (
          <select 
            value={value} 
            onChange={e => {
              onChange(e.target.value);
              if (fieldKey) setConfidences(prev => ({ ...prev, [fieldKey]: null }));
            }} 
            className={`input-field transition-all duration-300 ${isLowConfidence ? 'border-amber-500/60 focus:border-amber-500 focus:ring-amber-500/20 bg-amber-500/5' : ''}`}
          >
            {options.map(o => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <input 
            type={type} 
            value={value} 
            onChange={e => {
              onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value);
              if (fieldKey) setConfidences(prev => ({ ...prev, [fieldKey]: null }));
            }} 
            className={`input-field transition-all duration-300 ${isLowConfidence ? 'border-amber-500/60 focus:border-amber-500 focus:ring-amber-500/20 bg-amber-500/5' : ''}`}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/debitur')} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Edit Debitur' : 'Tambah Debitur'}</h1>
          <p className="text-sm text-slate-400">{isEditing ? 'Perbarui data debitur' : 'Lengkapi data debitur baru'}</p>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-1 bg-navy-lighter/50 p-1 rounded-xl">
        {TABS.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === i ? 'bg-navy-light text-gold shadow' : 'text-slate-400 hover:text-white'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card animate-fade-in">
        {activeTab === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex items-center justify-between bg-navy-light/30 border border-navy-border p-4 rounded-xl">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gold">Scan KTP Otomatis</h3>
                  {vlmEngine === 'lfm' && (
                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-2 py-0.5">
                      <Sparkles className="w-3 h-3" /> VLM AI
                    </span>
                  )}
                  {vlmEngine === 'tesseract' && (
                    <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full px-2 py-0.5">OCR</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {ocrLoading
                    ? 'Model AI sedang menganalisa gambar KTP...'
                    : vlmEngine
                    ? `✓ Berhasil diekstrak via ${vlmEngine === 'lfm' ? 'VLM AI' : 'OCR Tesseract'}. Periksa dan lengkapi field di bawah.`
                    : 'Unggah foto KTP debitur untuk mengisi formulir secara otomatis'}
                </p>
              </div>
              <label className={`btn-primary flex items-center gap-2 cursor-pointer ${ocrLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                {ocrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {ocrLoading ? 'Menganalisa...' : 'Scan KTP'}
                <input type="file" accept="image/*,.pdf,application/pdf" onChange={(e) => handleOcrScan(e, 'ktp')} className="hidden" disabled={ocrLoading} />
              </label>
            </div>

            {renderInput('NIK *', pribadi.nik, v => updateField(setPribadi)('nik', v), 'text', null, 'nik')}
            {renderInput('Nama Lengkap *', pribadi.nama, v => updateField(setPribadi)('nama', v), 'text', null, 'nama')}
            {renderInput('Tempat Lahir', pribadi.tempatLahir, v => updateField(setPribadi)('tempatLahir', v), 'text', null, 'tempatLahir')}
            {renderInput('Tanggal Lahir', pribadi.tanggalLahir, v => updateField(setPribadi)('tanggalLahir', v), 'date', null, 'tanggalLahir')}
            {renderInput('Jenis Kelamin', pribadi.gender, v => updateField(setPribadi)('gender', v), 'text', GENDER, 'gender')}
            {renderInput('Agama', pribadi.agama, v => updateField(setPribadi)('agama', v), 'text', ['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU'], 'agama')}
            {renderInput('Status Nikah', pribadi.statusNikah, v => updateField(setPribadi)('statusNikah', v), 'text', STATUS_NIKAH, 'statusNikah')}
            {renderInput('Pekerjaan', pribadi.pekerjaan, v => updateField(setPribadi)('pekerjaan', v), 'text', null, 'pekerjaan')}
            {renderInput('Kewarganegaraan', pribadi.kewarganegaraan, v => updateField(setPribadi)('kewarganegaraan', v), 'text', ['WNI', 'WNA'], 'kewarganegaraan')}
            {renderInput('Berlaku Hingga', pribadi.berlakuHingga, v => updateField(setPribadi)('berlakuHingga', v), 'text', null, 'berlakuHingga')}
            <div className="md:col-span-2 flex gap-4">
               <div className="flex-[3]">{renderInput('Alamat', pribadi.alamat, v => updateField(setPribadi)('alamat', v), 'text', null, 'alamat')}</div>
               <div className="flex-1">{renderInput('RT', pribadi.rt, v => updateField(setPribadi)('rt', v), 'text', null, 'rt')}</div>
               <div className="flex-1">{renderInput('RW', pribadi.rw, v => updateField(setPribadi)('rw', v), 'text', null, 'rw')}</div>
            </div>
            {renderInput('Kelurahan/Desa', pribadi.kelurahan, v => updateField(setPribadi)('kelurahan', v), 'text', null, 'kelurahan')}
            {renderInput('Kecamatan', pribadi.kecamatan, v => updateField(setPribadi)('kecamatan', v), 'text', null, 'kecamatan')}
            {renderInput('Kabupaten/Kota', pribadi.kabupaten, v => updateField(setPribadi)('kabupaten', v), 'text', null, 'kabupaten')}
            {renderInput('Pendidikan', pribadi.pendidikan, v => updateField(setPribadi)('pendidikan', v), 'text', PENDIDIKAN)}
            {renderInput('No HP *', pribadi.noHp, v => updateField(setPribadi)('noHp', v))}
            {renderInput('Kode Pos', pribadi.kodePos, v => updateField(setPribadi)('kodePos', v))}
            {renderInput('Ibu Kandung', pribadi.ibuKandung, v => updateField(setPribadi)('ibuKandung', v))}
            {renderInput('Hubungan dengan Bank', pribadi.hubunganBank, v => updateField(setPribadi)('hubunganBank', v), 'text', ['Nasabah Lama', 'Nasabah Baru'])}
            {renderInput('Kredit yang sedang dinikmati', pribadi.kreditAktif, v => updateField(setPribadi)('kreditAktif', v), 'text', ['Ada', 'Tidak Ada'])}
          </div>
        )}

        {activeTab === 1 && pribadi.statusNikah === 'KAWIN' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex items-center justify-between bg-navy-light/30 border border-navy-border p-4 rounded-xl mb-2">
              <div>
                <h3 className="text-sm font-semibold text-gold">Scan Buku/Surat Nikah (OCR)</h3>
                <p className="text-xs text-slate-400">Unggah foto Surat Nikah untuk mengisi data pasangan otomatis</p>
              </div>
              <label className="btn-primary flex items-center gap-2 cursor-pointer">
                {ocrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {ocrLoading ? 'Memproses OCR...' : 'Unggah Surat Nikah'}
                <input type="file" accept="image/*,.pdf,application/pdf" onChange={(e) => handleOcrScan(e, 'surat_nikah')} className="hidden" disabled={ocrLoading} />
              </label>
            </div>

            {renderInput('Nama Pasangan', pasangan.nama, v => updateField(setPasangan)('nama', v))}
            {renderInput('NIK Pasangan', pasangan.nik, v => updateField(setPasangan)('nik', v))}
            {renderInput('Tempat Lahir', pasangan.tempatLahir, v => updateField(setPasangan)('tempatLahir', v))}
            {renderInput('Tanggal Lahir', pasangan.tanggalLahir, v => updateField(setPasangan)('tanggalLahir', v), 'date')}
            {renderInput('Pendidikan', pasangan.pendidikan, v => updateField(setPasangan)('pendidikan', v), 'text', PENDIDIKAN)}
            {renderInput('Pekerjaan', pasangan.pekerjaan, v => updateField(setPasangan)('pekerjaan', v))}
            {renderInput('No HP', pasangan.noHp, v => updateField(setPasangan)('noHp', v))}
          </div>
        )}
        {activeTab === 1 && pribadi.statusNikah !== 'KAWIN' && (
          <p className="text-slate-500 text-center py-12">Data pasangan hanya diisi jika status nikah = Kawin</p>
        )}

        {activeTab === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput('Jenis Pekerjaan', pekerjaan.jenisPekerjaan, v => updateField(setPekerjaan)('jenisPekerjaan', v), 'text', JENIS_PEKERJAAN)}
            {renderInput('Nama Instansi', pekerjaan.namaInstansi, v => updateField(setPekerjaan)('namaInstansi', v))}
            {renderInput('Jabatan', pekerjaan.jabatan, v => updateField(setPekerjaan)('jabatan', v))}
            {renderInput('Masa Kerja (tahun)', pekerjaan.masaKerjaTahun, v => updateField(setPekerjaan)('masaKerjaTahun', v), 'number')}
            {renderInput('Gaji Pokok', pekerjaan.gajiPokok, v => updateField(setPekerjaan)('gajiPokok', v), 'number')}
            {renderInput('Tunjangan', pekerjaan.tunjangan, v => updateField(setPekerjaan)('tunjangan', v), 'number')}
            {renderInput('Penghasilan Lain', pekerjaan.penghasilanLain, v => updateField(setPekerjaan)('penghasilanLain', v), 'number')}
            <div className="md:col-span-2">{renderInput('Alamat Kantor', pekerjaan.alamatKantor, v => updateField(setPekerjaan)('alamatKantor', v))}</div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput('Nama Usaha', usaha.namaUsaha, v => updateField(setUsaha)('namaUsaha', v))}
            {renderInput('Jenis Usaha', usaha.jenisUsaha, v => updateField(setUsaha)('jenisUsaha', v))}
            {renderInput('Lama Usaha (tahun)', usaha.lamaUsahaTahun, v => updateField(setUsaha)('lamaUsahaTahun', v), 'number')}
            {renderInput('Omset Bulanan', usaha.omsetBulanan, v => updateField(setUsaha)('omsetBulanan', v), 'number')}
            {renderInput('Jumlah Karyawan', usaha.jumlahKaryawan, v => updateField(setUsaha)('jumlahKaryawan', v), 'number')}
            {renderInput('Status Tempat Usaha', usaha.statusTempatUsaha, v => updateField(setUsaha)('statusTempatUsaha', v), 'text', ['MILIK', 'SEWA', 'PINJAM'])}
            <div className="md:col-span-2">{renderInput('Alamat Usaha', usaha.alamatUsaha, v => updateField(setUsaha)('alamatUsaha', v))}</div>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button onClick={() => navigate('/debitur')} className="btn-secondary">Batal</button>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? 'Menyimpan...' : 'Simpan Debitur'}
        </button>
      </div>
    </div>
  );
}
