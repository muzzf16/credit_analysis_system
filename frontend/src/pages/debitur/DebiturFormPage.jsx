import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Save, Loader2, ArrowLeft, Camera } from 'lucide-react';
import { debiturService, ocrService } from '../../services';
import { GENDER, STATUS_NIKAH, PENDIDIKAN, JENIS_PEKERJAAN } from '../../utils/constants';

const TABS = ['Data Pribadi', 'Pasangan', 'Pekerjaan', 'Usaha'];

export default function DebiturFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [pribadi, setPribadi] = useState({ nik: '', nama: '', tempatLahir: '', tanggalLahir: '', gender: 'L', statusNikah: 'BELUM_KAWIN', pendidikan: 'SMA', agama: 'Islam', alamat: '', kelurahan: '', kecamatan: '', kabupaten: 'Batang', kodePos: '', noHp: '', email: '', ibuKandung: '', hubunganBank: 'Nasabah Baru', kreditAktif: 'Tidak Ada' });
  const [pasangan, setPasangan] = useState({ nama: '', nik: '', tempatLahir: '', tanggalLahir: '', pendidikan: 'SMA', pekerjaan: '', noHp: '' });
  const [pekerjaan, setPekerjaan] = useState({ jenisPekerjaan: 'SWASTA', namaInstansi: '', jabatan: '', masaKerjaTahun: 0, alamatKantor: '', noTelpKantor: '', gajiPokok: 0, tunjangan: 0, penghasilanLain: 0 });
  const [usaha, setUsaha] = useState({ namaUsaha: '', jenisUsaha: '', lamaUsahaTahun: 0, alamatUsaha: '', omsetBulanan: 0, jumlahKaryawan: 0, statusTempatUsaha: 'MILIK' });

  const updateField = (setter) => (field, value) => setter(prev => ({ ...prev, [field]: value }));
  const [ocrLoading, setOcrLoading] = useState(false);

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

  const handleOcrScan = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const res = await ocrService.process(formData);
      const extracted = res.data.data.data;
      
      if (type === 'ktp') {
        setPribadi(prev => ({
          ...prev,
          nik: extracted.nik || prev.nik,
          nama: extracted.nama || prev.nama,
          tempatLahir: extracted.tempatLahir || prev.tempatLahir,
          tanggalLahir: extracted.tanggalLahir || prev.tanggalLahir,
          gender: extracted.gender || prev.gender,
          statusNikah: extracted.statusNikah || prev.statusNikah,
          alamat: extracted.alamat || prev.alamat,
          kelurahan: extracted.kelurahan || prev.kelurahan,
          kecamatan: extracted.kecamatan || prev.kecamatan,
          kabupaten: extracted.kabupaten || prev.kabupaten,
        }));
      } else if (type === 'surat_nikah') {
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
      setError(err.response?.data?.message || 'Gagal memproses OCR dokumen.');
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

  const renderInput = (label, value, onChange, type = 'text', options = null) => (
    <div>
      <label className="label">{label}</label>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} className="input-field">
          {options.map(o => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)} className="input-field" />
      )}
    </div>
  );

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
                <h3 className="text-sm font-semibold text-gold">Scan KTP Otomatis (OCR)</h3>
                <p className="text-xs text-slate-400">Unggah foto KTP debitur untuk mengisi formulir secara otomatis</p>
              </div>
              <label className="btn-primary flex items-center gap-2 cursor-pointer">
                {ocrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {ocrLoading ? 'Memproses OCR...' : 'Unggah KTP'}
                <input type="file" accept="image/*,application/pdf" onChange={(e) => handleOcrScan(e, 'ktp')} className="hidden" disabled={ocrLoading} />
              </label>
            </div>

            {renderInput('NIK *', pribadi.nik, v => updateField(setPribadi)('nik', v))}
            {renderInput('Nama Lengkap *', pribadi.nama, v => updateField(setPribadi)('nama', v))}
            {renderInput('Tempat Lahir', pribadi.tempatLahir, v => updateField(setPribadi)('tempatLahir', v))}
            {renderInput('Tanggal Lahir', pribadi.tanggalLahir, v => updateField(setPribadi)('tanggalLahir', v), 'date')}
            {renderInput('Jenis Kelamin', pribadi.gender, v => updateField(setPribadi)('gender', v), 'text', GENDER)}
            {renderInput('Status Nikah', pribadi.statusNikah, v => updateField(setPribadi)('statusNikah', v), 'text', STATUS_NIKAH)}
            {renderInput('Pendidikan', pribadi.pendidikan, v => updateField(setPribadi)('pendidikan', v), 'text', PENDIDIKAN)}
            {renderInput('No HP *', pribadi.noHp, v => updateField(setPribadi)('noHp', v))}
            <div className="md:col-span-2">{renderInput('Alamat', pribadi.alamat, v => updateField(setPribadi)('alamat', v))}</div>
            {renderInput('Kelurahan', pribadi.kelurahan, v => updateField(setPribadi)('kelurahan', v))}
            {renderInput('Kecamatan', pribadi.kecamatan, v => updateField(setPribadi)('kecamatan', v))}
            {renderInput('Kabupaten', pribadi.kabupaten, v => updateField(setPribadi)('kabupaten', v))}
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
                <input type="file" accept="image/*,application/pdf" onChange={(e) => handleOcrScan(e, 'surat_nikah')} className="hidden" disabled={ocrLoading} />
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
