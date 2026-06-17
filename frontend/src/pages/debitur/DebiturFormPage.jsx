import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import { debiturService } from '../../services';
import { GENDER, STATUS_NIKAH, PENDIDIKAN, JENIS_PEKERJAAN } from '../../utils/constants';

const TABS = ['Data Pribadi', 'Pasangan', 'Pekerjaan', 'Usaha'];

export default function DebiturFormPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [pribadi, setPribadi] = useState({ nik: '', nama: '', tempatLahir: '', tanggalLahir: '', gender: 'L', statusNikah: 'BELUM_KAWIN', pendidikan: 'SMA', agama: 'Islam', alamat: '', kelurahan: '', kecamatan: '', kabupaten: 'Batang', kodePos: '', noHp: '', email: '' });
  const [pasangan, setPasangan] = useState({ nama: '', nik: '', tempatLahir: '', tanggalLahir: '', pendidikan: 'SMA', pekerjaan: '', noHp: '' });
  const [pekerjaan, setPekerjaan] = useState({ jenisPekerjaan: 'SWASTA', namaInstansi: '', jabatan: '', masaKerjaTahun: 0, alamatKantor: '', noTelpKantor: '', gajiPokok: 0, tunjangan: 0, penghasilanLain: 0 });
  const [usaha, setUsaha] = useState({ namaUsaha: '', jenisUsaha: '', lamaUsahaTahun: 0, alamatUsaha: '', omsetBulanan: 0, jumlahKaryawan: 0, statusTempatUsaha: 'MILIK' });

  const updateField = (setter) => (field, value) => setter(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const body = { pribadi, pekerjaan };
      if (pribadi.statusNikah === 'KAWIN') body.pasangan = pasangan;
      if (usaha.namaUsaha) body.usaha = usaha;
      await debiturService.create(body);
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
          <h1 className="text-2xl font-bold">Tambah Debitur</h1>
          <p className="text-sm text-slate-400">Lengkapi data debitur baru</p>
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
          </div>
        )}

        {activeTab === 1 && pribadi.statusNikah === 'KAWIN' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
