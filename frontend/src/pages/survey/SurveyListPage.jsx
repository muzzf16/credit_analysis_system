import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Eye, Clock, CheckCircle } from 'lucide-react';
import { pengajuanService } from '../../services';
import { formatRupiah, formatDate } from '../../utils/formatters';
import useAuthStore from '../../store/authStore';

export default function SurveyListPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    pengajuanService.getAll({ status: 'DIAJUKAN', limit: 50, aoId: user?.role === 'AO' ? user?.id : undefined })
      .then(res => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><MapPin className="w-6 h-6 text-gold" /> Survey AO</h1>
        <p className="text-sm text-slate-400">Pengajuan yang perlu di-survey</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>
      ) : data.length === 0 ? (
        <div className="card text-center py-16">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-400">Tidak ada pengajuan yang menunggu survey.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map(p => (
            <div key={p.id} className="card-hover cursor-pointer" onClick={() => navigate(`/survey/tambah?pengajuanId=${p.id}`)}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-gold">{p.nomor_pengajuan}</span>
                <span className="badge-warning flex items-center gap-1"><Clock className="w-3 h-3" /> Perlu Survey</span>
              </div>
              <h3 className="font-semibold text-lg mb-1">{p.debitur_nama}</h3>
              <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                <span>{p.jenis_kredit}</span>
                <span>{formatRupiah(p.plafon_diajukan)}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-navy-border">
                <span className="text-xs text-slate-500">{formatDate(p.created_at)}</span>
                <span className="text-xs text-gold flex items-center gap-1">Mulai Survey <MapPin className="w-3 h-3" /></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
