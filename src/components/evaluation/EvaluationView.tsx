import { useState, useMemo } from 'react';
import { 
  Award, Sliders, Download, Edit3, Info
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DEPARTMENTS } from '../../data/departments';
import { Member } from '../../types';
import { exportToCsv } from '../../lib/utils';

export function EvaluationView() {
  const { members, tasks, events, settings, updateSettings, updateMember } = useWorkspace();
  const { isSuperAdmin } = useAuth();
  const { showToast } = useToast();

  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [editingWeights, setEditingWeights] = useState(false);
  const [weights, setWeights] = useState(settings.evaluationWeights);
  const [adjustingMember, setAdjustingMember] = useState<Member | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');

  const handleSaveWeights = async () => {
    await updateSettings({ evaluationWeights: weights });
    setEditingWeights(false);
    showToast('Đã lưu cấu hình trọng số đánh giá.', 'success');
  };

  const evaluatedMembers = useMemo(() => {
    return members.filter(m => !m.isDeleted && m.status === 'active').map(member => {
      const memberTasks = tasks.filter(t => t.assigneeIds.includes(member.id));
      const totalAssigned = memberTasks.length;
      const completed = memberTasks.filter(t => t.status === 'completed' || t.status === 'approved').length;
      
      const onTime = memberTasks.filter(t => {
        if (t.status !== 'completed' && t.status !== 'approved') return false;
        if (!t.milestones?.completedAt) return true;
        return t.milestones.completedAt.split('T')[0] <= t.dueDate;
      }).length;

      const onTimeRate = totalAssigned > 0 ? (onTime / totalAssigned) * 100 : 85;
      const completionRate = totalAssigned > 0 ? (completed / totalAssigned) * 100 : 80;
      const qualityScore = member.contributionScore > 0 ? member.contributionScore : 85;
      const eventParticipation = events.filter(e => e.leadMemberId === member.id).length;
      const attendanceScore = Math.min(100, 75 + eventParticipation * 10);
      const coordinationScore = 90;
      const initiativeScore = totalAssigned >= 10 ? 90 : 80;

      const w = settings.evaluationWeights;
      const totalWeight = (w.onTime + w.completion + w.quality + w.attendance + w.coordination + w.initiative) || 100;
      
      const calculatedScore = Math.round(
        (onTimeRate * w.onTime +
         completionRate * w.completion +
         qualityScore * w.quality +
         attendanceScore * w.attendance +
         coordinationScore * w.coordination +
         initiativeScore * w.initiative) / totalWeight
      );

      return {
        ...member,
        totalAssigned,
        completed,
        calculatedScore: Math.min(100, Math.max(0, calculatedScore)),
        criteria: {
          onTimeRate: Math.round(onTimeRate),
          completionRate: Math.round(completionRate),
          qualityScore: Math.round(qualityScore),
          attendanceScore: Math.round(attendanceScore),
        }
      };
    });
  }, [members, tasks, events, settings.evaluationWeights]);

  const filteredRankings = useMemo(() => {
    return evaluatedMembers
      .filter(m => selectedDept === 'all' || m.departmentId === selectedDept)
      .sort((a, b) => b.calculatedScore - a.calculatedScore);
  }, [evaluatedMembers, selectedDept]);

  const handleApplyAdjustment = async () => {
    if (!adjustingMember) return;
    const newScore = Math.min(100, Math.max(0, (adjustingMember.contributionScore || 80) + adjustmentValue));
    await updateMember(adjustingMember.id, {
      contributionScore: newScore,
      notes: `${adjustingMember.notes ? adjustingMember.notes + '\n' : ''}[Điều chỉnh ${adjustmentValue > 0 ? '+' : ''}${adjustmentValue}]: ${adjustmentReason}`
    });
    setAdjustingMember(null);
    setAdjustmentValue(0);
    setAdjustmentReason('');
    showToast('Đã điều chỉnh điểm đóng góp.', 'success');
  };

  const handleExportCsv = () => {
    const headers = ['Hạng', 'Họ tên', 'Tiểu ban', 'Tổng việc', 'Hoàn thành', 'Đúng hạn', 'Điểm tổng'];
    const rows = filteredRankings.map((m, idx) => [
      idx + 1, m.fullName, DEPARTMENTS[m.departmentId]?.name, m.totalAssigned, m.completed, `${m.criteria.onTimeRate}%`, m.calculatedScore
    ]);
    exportToCsv(`Bao_cao_danh_gia_${new Date().toISOString().split('T')[0]}`, headers, rows);
    showToast('Đã xuất báo cáo đánh giá.', 'success');
  };

  return (
    <div className="space-y-4">
      {/* Notice header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Đánh giá mức độ đóng góp thành viên</h3>
          <p className="text-slate-500 mt-0.5">
            Tính toán tự động theo 6 tiêu chí có trọng số (Đúng hạn 30%, Hoàn thành 20%, Chất lượng 20%, Tham gia 15%, Phối hợp 10%, Chủ động 5%).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <button
              onClick={() => setEditingWeights(!editingWeights)}
              className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium"
            >
              Cấu hình trọng số
            </button>
          )}
          <button
            onClick={handleExportCsv}
            className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Weights edit panel */}
      {editingWeights && (
        <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs space-y-3">
          <span className="font-semibold text-slate-800 block">Cấu hình trọng số % (Tổng = 100%)</span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <div>
              <span className="text-slate-500 block mb-1">Đúng hạn (%)</span>
              <input type="number" value={weights.onTime} onChange={(e) => setWeights({ ...weights, onTime: Number(e.target.value) })} className="w-full px-2 py-1 rounded border border-slate-200" />
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Hoàn thành (%)</span>
              <input type="number" value={weights.completion} onChange={(e) => setWeights({ ...weights, completion: Number(e.target.value) })} className="w-full px-2 py-1 rounded border border-slate-200" />
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Chất lượng (%)</span>
              <input type="number" value={weights.quality} onChange={(e) => setWeights({ ...weights, quality: Number(e.target.value) })} className="w-full px-2 py-1 rounded border border-slate-200" />
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Tham gia (%)</span>
              <input type="number" value={weights.attendance} onChange={(e) => setWeights({ ...weights, attendance: Number(e.target.value) })} className="w-full px-2 py-1 rounded border border-slate-200" />
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Phối hợp (%)</span>
              <input type="number" value={weights.coordination} onChange={(e) => setWeights({ ...weights, coordination: Number(e.target.value) })} className="w-full px-2 py-1 rounded border border-slate-200" />
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Chủ động (%)</span>
              <input type="number" value={weights.initiative} onChange={(e) => setWeights({ ...weights, initiative: Number(e.target.value) })} className="w-full px-2 py-1 rounded border border-slate-200" />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSaveWeights} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium">
              Lưu trọng số
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard Table (Minimal) */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
              <tr>
                <th className="px-3 py-2 text-center w-12">Hạng</th>
                <th className="px-3 py-2">Thành viên</th>
                <th className="px-3 py-2">Tiểu ban</th>
                <th className="px-3 py-2 text-center">Hoàn thành</th>
                <th className="px-3 py-2 text-center">Đúng hạn</th>
                <th className="px-3 py-2 text-center">Chất lượng</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-900">Điểm tổng</th>
                {isSuperAdmin && <th className="px-3 py-2 text-right w-16">Chỉnh</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRankings.map((m, idx) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3 py-2 text-center font-medium text-slate-500">{idx + 1}</td>
                  <td className="px-3 py-2 font-semibold text-slate-900">{m.fullName}</td>
                  <td className="px-3 py-2 text-slate-600">{DEPARTMENTS[m.departmentId]?.shortName}</td>
                  <td className="px-3 py-2 text-center text-slate-600">{m.completed} / {m.totalAssigned}</td>
                  <td className="px-3 py-2 text-center text-slate-600">{m.criteria.onTimeRate}%</td>
                  <td className="px-3 py-2 text-center text-slate-600">{m.criteria.qualityScore}</td>
                  <td className="px-3 py-2 text-right font-semibold text-blue-600 text-sm">{m.calculatedScore}</td>
                  {isSuperAdmin && (
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => {
                          setAdjustingMember(m);
                          setAdjustmentValue(0);
                          setAdjustmentReason('');
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600"
                        title="Điều chỉnh điểm"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Adjustment Modal */}
      {adjustingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-4 space-y-3 border border-slate-200 text-xs shadow-md">
            <h4 className="font-semibold text-slate-900">Điều chỉnh điểm: {adjustingMember.fullName}</h4>
            <div>
              <label className="text-slate-600 block mb-1">Điểm cộng / trừ (+ hoặc -)</label>
              <input
                type="number"
                value={adjustmentValue}
                onChange={(e) => setAdjustmentValue(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded border border-slate-200"
              />
            </div>
            <div>
              <label className="text-slate-600 block mb-1">Lý do điều chỉnh *</label>
              <textarea
                rows={2}
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Ghi chú khen thưởng hoặc hỗ trợ..."
                className="w-full px-2.5 py-1.5 rounded border border-slate-200"
              />
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setAdjustingMember(null)} className="px-3 py-1 rounded border border-slate-200 text-slate-600">
                Hủy
              </button>
              <button onClick={handleApplyAdjustment} disabled={!adjustmentReason.trim()} className="px-3 py-1 rounded bg-blue-600 text-white font-medium">
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
