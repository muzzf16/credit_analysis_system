import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Briefcase, Heart, Building2, FileText, Phone, Mail, MapPin, Calendar, Edit } from 'lucide-react';
import { debiturService } from '../../services';
import { formatDate, formatRupiah } from '../../utils/formatters';
import useAuthStore from '../../store/authStore';

export default function DebiturDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    debiturService.getById(id)
      .then(res => setData(res.data.data))
      .catch(() => navigate('/debitur'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return null;

  const TABS = ['Data Pribadi', 'Pasangan', 'Pekerjaan', 'Usaha', 'Dokumen'];

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-white break-words">{value || '-'}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/debitur')} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-2xl font-bold">{data.nama}</h1>
            <p className="text-sm text-slate-400">NIK: {data.nik}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {['ADMIN', 'AO'].includes(user?.role) && (
            <>
              <button onClick={() => navigate(`/debitur/${id}/edit`)} className="btn-secondary"><Edit className="w-4 h-4" /> Edit</button>
              <button onClick={() => navigate(`/pengajuan/tambah?debiturId=${id}`)} className="btn-primary"><FileText className="w-4 h-4" /> Buat Pengajuan</button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-navy-lighter/50 p-1 rounded-xl overflow-x-auto">
        {TABS.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === i ? 'bg-navy-light text-gold shadow' : 'text-slate-400 hover:text-white'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="card animate-fade-in">
        {activeTab === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <InfoRow icon={User} label="Nama Lengkap" value={data.nama} />
            <InfoRow icon={Calendar} label="Tempat, Tanggal Lahir" value={`${data.tempat_lahir || '-'}, ${formatDate(data.tanggal_lahir)}`} />
            <InfoRow label="Jenis Kelamin" value={data.gender === 'L' ? 'Laki-laki' : 'Perempuan'} />
            <InfoRow label="Status Nikah" value={data.status_nikah} />
            <InfoRow label="Pendidikan" value={data.pendidikan} />
            <InfoRow label="Agama" value={data.agama} />
            <InfoRow icon={Phone} label="No HP" value={data.no_hp} />
            <InfoRow icon={Mail} label="Email" value={data.email} />
            <InfoRow label="Kode Pos" value={data.kode_pos} />
            <div className="md:col-span-2 lg:col-span-3">
              <InfoRow icon={MapPin} label="Alamat" value={`${data.alamat || '-'}, ${data.kelurahan || ''}, ${data.kecamatan || ''}, ${data.kabupaten || ''}`} />
            </div>
          </div>
        )}

        {activeTab === 1 && (
          data.pasangan ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
              <InfoRow icon={Heart} label="Nama Pasangan" value={data.pasangan.nama} />
              <InfoRow label="NIK" value={data.pasangan.nik} />
              <InfoRow label="Tempat, Tanggal Lahir" value={`${data.pasangan.tempat_lahir || '-'}, ${formatDate(data.pasangan.tanggal_lahir)}`} />
              <InfoRow label="Pendidikan" value={data.pasangan.pendidikan} />
              <InfoRow label="Pekerjaan" value={data.pasangan.pekerjaan} />
              <InfoRow icon={Phone} label="No HP" value={data.pasangan.no_hp} />
            </div>
          ) : <p className="text-slate-500 text-center py-12">Data pasangan tidak tersedia</p>
        )}

        {activeTab === 2 && (
          data.pekerjaan ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
              <InfoRow icon={Briefcase} label="Jenis Pekerjaan" value={data.pekerjaan.jenis_pekerjaan} />
              <InfoRow label="Nama Instansi" value={data.pekerjaan.nama_instansi} />
              <InfoRow label="Jabatan" value={data.pekerjaan.jabatan} />
              <InfoRow label="Masa Kerja" value={`${data.pekerjaan.masa_kerja_tahun} tahun`} />
              <InfoRow label="Gaji Pokok" value={formatRupiah(data.pekerjaan.gaji_pokok)} />
              <InfoRow label="Tunjangan" value={formatRupiah(data.pekerjaan.tunjangan)} />
              <InfoRow label="Penghasilan Lain" value={formatRupiah(data.pekerjaan.penghasilan_lain)} />
              <InfoRow label="Total Penghasilan" value={formatRupiah((parseFloat(data.pekerjaan.gaji_pokok)||0) + (parseFloat(data.pekerjaan.tunjangan)||0) + (parseFloat(data.pekerjaan.penghasilan_lain)||0))} />
              <div className="md:col-span-2"><InfoRow icon={MapPin} label="Alamat Kantor" value={data.pekerjaan.alamat_kantor} /></div>
            </div>
          ) : <p className="text-slate-500 text-center py-12">Data pekerjaan tidak tersedia</p>
        )}

        {activeTab === 3 && (
          data.usaha ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
              <InfoRow icon={Building2} label="Nama Usaha" value={data.usaha.nama_usaha} />
              <InfoRow label="Jenis Usaha" value={data.usaha.jenis_usaha} />
              <InfoRow label="Lama Usaha" value={`${data.usaha.lama_usaha_tahun} tahun`} />
              <InfoRow label="Jumlah Karyawan" value={data.usaha.jumlah_karyawan} />
              <InfoRow label="Omset Bulanan" value={formatRupiah(data.usaha.omset_bulanan)} />
              <InfoRow label="Omset Tahunan" value={formatRupiah(data.usaha.omset_tahunan)} />
              <InfoRow label="Status Tempat" value={data.usaha.status_tempat_usaha} />
              <div className="md:col-span-2"><InfoRow icon={MapPin} label="Alamat Usaha" value={data.usaha.alamat_usaha} /></div>
            </div>
          ) : <p className="text-slate-500 text-center py-12">Data usaha tidak tersedia</p>
        )}

        {activeTab === 4 && (
          data.dokumen && data.dokumen.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.dokumen.map(d => (
                <div key={d.id} className="bg-navy-lighter/50 rounded-lg p-4 border border-navy-border hover:border-gold/20 transition-all">
                  <p className="text-sm font-medium truncate">{d.file_name}</p>
                  <p className="text-xs text-slate-500 mt-1">{d.jenis_dokumen} • {(d.file_size / 1024).toFixed(0)} KB</p>
                  <p className="text-xs text-slate-600 mt-1">{formatDate(d.created_at)}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-slate-500 text-center py-12">Belum ada dokumen</p>
        )}
      </div>
    </div>
  );
}
