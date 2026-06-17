import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Eye, ChevronRight } from 'lucide-react';
import { approvalService } from '../../services';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { STATUS_PENGAJUAN, GRADE_COLORS } from '../../utils/constants';

export default function ApprovalListPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    approvalService.getPending()
      .then(res => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Workflow Approval</h1>
        <p className="text-sm text-slate-400">{data.length} pengajuan menunggu approval</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>
      ) : data.length === 0 ? (
        <div className="card text-center py-16">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-400">Tidak ada pengajuan yang menunggu approval.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map(p => {
            const st = STATUS_PENGAJUAN[p.status] || { label: p.status, color: 'badge-gray' };
            return (
              <div key={p.id} className="card-hover cursor-pointer" onClick={() => navigate(`/pengajuan/${p.id}`)}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-gold">{p.nomor_pengajuan}</span>
                  <span className={st.color}>{st.label}</span>
                </div>
                <h3 className="font-semibold text-lg mb-1">{p.debitur_nama}</h3>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span>{formatRupiah(p.plafon_diajukan)}</span>
                  <span>{p.jangka_waktu_bulan} bulan</span>
                </div>
                {p.total_score && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-navy-border">
                    <span className="text-xs text-slate-500">Score:</span>
                    <span className={`font-bold ${GRADE_COLORS[p.grade]}`}>{p.grade}</span>
                    <span className="text-sm font-semibold">{p.total_score}</span>
                    <span className="text-xs text-slate-500 ml-auto">{p.rekomendasi?.replace('_', ' ')}</span>
                  </div>
                )}
                <div className="flex items-center justify-end mt-3">
                  <span className="text-xs text-gold flex items-center gap-1">Review <ChevronRight className="w-3 h-3" /></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
