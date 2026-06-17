import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, Save, Loader2, ArrowLeft } from 'lucide-react';
import { scoringService } from '../../services';
import { GRADE_COLORS } from '../../utils/constants';

const SECTIONS = [
  { key: 'character', label: 'Character', bobot: 25, icon: '👤', fields: [
    { key: 'slik', label: 'Kolektibilitas SLIK', max: 100 },
    { key: 'reputasi', label: 'Reputasi Lingkungan', max: 100 },
    { key: 'karakterAo', label: 'Penilaian Karakter AO', max: 100 },
  ]},
  { key: 'capacity', label: 'Capacity', bobot: 30, icon: '💰', fields: [
    { key: 'dsr', label: 'DSR / DSCR Score', max: 100 },
    { key: 'dscr', label: 'Kemampuan Bayar', max: 100 },
    { key: 'penghasilan', label: 'Stabilitas Penghasilan', max: 100 },
  ]},
  { key: 'capital', label: 'Capital', bobot: 15, icon: '🏦', fields: [
    { key: 'aset', label: 'Nilai Aset', max: 100 },
    { key: 'equity', label: 'Ekuitas', max: 100 },
  ]},
  { key: 'collateral', label: 'Collateral', bobot: 20, icon: '🏠', fields: [
    { key: 'coverage', label: 'Coverage Ratio', max: 100 },
    { key: 'marketability', label: 'Marketabilitas', max: 100 },
    { key: 'ltv', label: 'LTV Score', max: 100 },
  ]},
  { key: 'condition', label: 'Condition', bobot: 10, icon: '📈', fields: [
    { key: 'sektor', label: 'Prospek Sektor Usaha', max: 100 },
    { key: 'prospek', label: 'Kondisi Ekonomi', max: 100 },
  ]},
];

export default function ScoringPage() {
  const [params] = useSearchParams();
  const pengajuanId = params.get('pengajuanId') || '';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState('character');
  const [keterangan, setKeterangan] = useState('');

  const [scores, setScores] = useState(() => {
    const init = {};
    SECTIONS.forEach(s => { init[s.key] = {}; s.fields.forEach(f => { init[s.key][f.key] = 75; }); });
    return init;
  });

  const updateScore = (section, field, value) => {
    setScores(prev => ({ ...prev, [section]: { ...prev[section], [field]: parseInt(value) || 0 } }));
  };

  const calc = useMemo(() => {
    const sectionScores = {};
    SECTIONS.forEach(s => {
      const values = Object.values(scores[s.key]);
      sectionScores[s.key] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    });

    const totalBobotSum = SECTIONS.reduce((a, s) => a + s.bobot, 0);
    const totalScore = SECTIONS.reduce((a, s) => a + (sectionScores[s.key] * s.bobot), 0) / totalBobotSum;

    let grade = 'E', label = 'Tidak Layak', rekomendasi = 'REJECT';
    if (totalScore >= 90) { grade = 'A'; label = 'Sangat Baik'; rekomendasi = 'APPROVE'; }
    else if (totalScore >= 80) { grade = 'B'; label = 'Baik'; rekomendasi = 'APPROVE'; }
    else if (totalScore >= 70) { grade = 'C'; label = 'Cukup'; rekomendasi = 'CONDITIONAL_APPROVE'; }
    else if (totalScore >= 60) { grade = 'D'; label = 'Kurang'; rekomendasi = 'CONDITIONAL_APPROVE'; }

    return { sectionScores, totalScore, grade, label, rekomendasi };
  }, [scores]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const body = { pengajuanId, keterangan };
      SECTIONS.forEach(s => { body[s.key] = { ...scores[s.key], score: calc.sectionScores[s.key] }; });
      await scoringService.save(body);
      alert('Scoring berhasil disimpan!');
    } catch (err) { alert(err.response?.data?.message || 'Gagal menyimpan'); }
    setLoading(false);
  };

  const rekomColors = { APPROVE: 'bg-emerald-500/10 text-emerald-400', CONDITIONAL_APPROVE: 'bg-amber-500/10 text-amber-400', REJECT: 'bg-red-500/10 text-red-400' };
  const rekomLabels = { APPROVE: 'DISETUJUI', CONDITIONAL_APPROVE: 'DISETUJUI BERSYARAT', REJECT: 'DITOLAK' };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-gold" /> Credit Scoring 5C</h1>
          <p className="text-sm text-slate-400">Penilaian kredit berdasarkan metode 5C</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {SECTIONS.map(section => (
            <div key={section.key} className="card">
              <button onClick={() => setExpandedSection(expandedSection === section.key ? '' : section.key)}
                className="w-full flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{section.icon}</span>
                  <div className="text-left">
                    <h3 className="font-semibold">{section.label}</h3>
                    <p className="text-xs text-slate-500">Bobot: {section.bobot}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gold">{calc.sectionScores[section.key]?.toFixed(0)}</span>
                  <span className="text-xs text-slate-500">/ 100</span>
                </div>
              </button>

              {expandedSection === section.key && (
                <div className="mt-4 space-y-4 animate-fade-in">
                  {section.fields.map(field => (
                    <div key={field.key}>
                      <div className="flex justify-between mb-1">
                        <label className="text-sm text-slate-400">{field.label}</label>
                        <span className="text-sm font-semibold text-white">{scores[section.key][field.key]}</span>
                      </div>
                      <input type="range" min="0" max={field.max} value={scores[section.key][field.key]}
                        onChange={e => updateScore(section.key, field.key, e.target.value)}
                        className="w-full h-2 bg-navy-lighter rounded-lg appearance-none cursor-pointer accent-gold" />
                      <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                        <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="card">
            <label className="label">Keterangan / Catatan</label>
            <textarea value={keterangan} onChange={e => setKeterangan(e.target.value)} rows={3} className="input-field" placeholder="Tambahkan keterangan scoring..." />
          </div>
        </div>

        {/* Score Summary */}
        <div className="card sticky top-20 h-fit">
          <h3 className="text-sm font-semibold text-gold mb-4">🏆 Total Score</h3>

          {/* Circular Score Display */}
          <div className="flex justify-center mb-6">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#334155" strokeWidth="8" />
                <circle cx="60" cy="60" r="54" fill="none" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(calc.totalScore / 100) * 339.3} 339.3`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${GRADE_COLORS[calc.grade]}`}>{calc.grade}</span>
                <span className="text-xl font-semibold">{calc.totalScore.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-slate-400 mb-4">{calc.label}</p>

          {/* Per-section breakdown */}
          <div className="space-y-2 mb-4">
            {SECTIONS.map(s => (
              <div key={s.key} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-20">{s.label}</span>
                <div className="flex-1 h-2 bg-navy-lighter rounded-full overflow-hidden">
                  <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${calc.sectionScores[s.key]}%` }} />
                </div>
                <span className="text-xs font-medium w-8 text-right">{calc.sectionScores[s.key]?.toFixed(0)}</span>
              </div>
            ))}
          </div>

          {/* Recommendation */}
          <div className={`text-center py-3 rounded-lg font-bold ${rekomColors[calc.rekomendasi]}`}>
            {rekomLabels[calc.rekomendasi]}
          </div>

          <button onClick={handleSave} disabled={loading || !pengajuanId} className="btn-primary w-full mt-4">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Scoring
          </button>
        </div>
      </div>
    </div>
  );
}
