import { useState, useMemo } from 'react';
import { 
  Megaphone, Plus, Download, ExternalLink, X, Check
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DEPARTMENTS, TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '../../data/departments';
import { CommunicationPlan, TaskPhase, DepartmentId, TaskStatus, TaskPriority } from '../../types';
import { exportToCsv, formatDateVi } from '../../lib/utils';

export function CommunicationPlanView() {
  const { plans, tasks, events, members, addPlan, addTask, updateTaskStatus, updateTask } = useWorkspace();
  const { isSuperAdmin, isDeptAdmin } = useAuth();
  const { showToast } = useToast();

  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || '');
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'before' | 'during' | 'after'>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [isNewRowOpen, setIsNewRowOpen] = useState(false);
  const [isNewPlanModal, setIsNewPlanModal] = useState(false);

  const currentPlan = useMemo(() => {
    return plans.find(p => p.id === selectedPlanId) || plans[0];
  }, [plans, selectedPlanId]);

  const planTasks = useMemo(() => {
    if (!currentPlan) return [];
    return tasks.filter(t => t.planId === currentPlan.id).filter(t => {
      if (phaseFilter !== 'all' && t.phase !== phaseFilter) return false;
      if (deptFilter !== 'all' && t.departmentId !== deptFilter) return false;
      return true;
    });
  }, [tasks, currentPlan, phaseFilter, deptFilter]);

  const totalTasks = tasks.filter(t => t.planId === currentPlan?.id).length;
  const completedTasks = tasks.filter(t => t.planId === currentPlan?.id && (t.status === 'completed' || t.status === 'approved')).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // New row form
  const [newRow, setNewRow] = useState({
    title: '',
    phase: 'before' as TaskPhase,
    departmentId: 'truyen-thong' as DepartmentId,
    assigneeIds: [] as string[],
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'normal' as TaskPriority,
    outputUrl: '',
  });

  const handleAddRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRow.title.trim() || !currentPlan) return;

    await addTask({
      title: newRow.title,
      planId: currentPlan.id,
      eventId: currentPlan.eventId,
      phase: newRow.phase,
      departmentId: newRow.departmentId,
      assigneeIds: newRow.assigneeIds,
      dueDate: newRow.dueDate,
      priority: newRow.priority,
      status: 'assigned',
      outputLinks: newRow.outputUrl ? [{ title: 'Sản phẩm', url: newRow.outputUrl }] : [],
      createdBy: 'currentUser',
    });

    setNewRow({
      title: '',
      phase: 'before',
      departmentId: 'truyen-thong',
      assigneeIds: [],
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'normal',
      outputUrl: '',
    });
    setIsNewRowOpen(false);
    showToast('Đã thêm dòng nhiệm vụ vào kế hoạch.', 'success');
  };

  const handleExportCsv = () => {
    if (!currentPlan) return;
    const headers = ['STT', 'Giai đoạn', 'Nhiệm vụ', 'Tiểu ban', 'Người phụ trách', 'Hạn chót', 'Trạng thái'];
    const rows = planTasks.map((t, idx) => [
      idx + 1,
      t.phase === 'before' ? 'Trước sự kiện' : t.phase === 'during' ? 'Trong sự kiện' : 'Sau sự kiện',
      t.title,
      DEPARTMENTS[t.departmentId]?.name,
      members.filter(m => t.assigneeIds.includes(m.id)).map(m => m.fullName).join(', '),
      t.dueDate,
      t.status
    ]);
    exportToCsv(`Ke_hoach_${currentPlan.title}`, headers, rows);
    showToast('Đã xuất kế hoạch truyền thông ra CSV.', 'success');
  };

  return (
    <div className="space-y-4">
      {/* Plan selection & brief toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {plans.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPlanId(p.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors border ${
                selectedPlanId === p.id 
                  ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Xuất CSV</span>
          </button>

          {(isSuperAdmin || isDeptAdmin) && (
            <button
              onClick={() => setIsNewRowOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm dòng</span>
            </button>
          )}
        </div>
      </div>

      {/* Plan Overview Card */}
      {currentPlan && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{currentPlan.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Mục tiêu: {currentPlan.target} • Ngân sách: {currentPlan.budget ? `${currentPlan.budget.toLocaleString('vi-VN')} đ` : 'Chưa có'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Tiến độ: {progressPercent}%</span>
              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div style={{ width: `${progressPercent}%` }} className="bg-blue-600 h-full rounded-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase filter pills (Req 8) */}
      <div className="flex items-center gap-1.5 text-xs">
        <button
          onClick={() => setPhaseFilter('all')}
          className={`px-2.5 py-1 rounded-md border transition-colors ${phaseFilter === 'all' ? 'bg-slate-100 border-slate-300 font-semibold text-slate-900' : 'bg-white border-slate-200 text-slate-600'}`}
        >
          Tất cả giai đoạn ({planTasks.length})
        </button>
        <button
          onClick={() => setPhaseFilter('before')}
          className={`px-2.5 py-1 rounded-md border transition-colors ${phaseFilter === 'before' ? 'bg-blue-50 border-blue-200 font-semibold text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
        >
          Trước sự kiện
        </button>
        <button
          onClick={() => setPhaseFilter('during')}
          className={`px-2.5 py-1 rounded-md border transition-colors ${phaseFilter === 'during' ? 'bg-blue-50 border-blue-200 font-semibold text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
        >
          Trong sự kiện
        </button>
        <button
          onClick={() => setPhaseFilter('after')}
          className={`px-2.5 py-1 rounded-md border transition-colors ${phaseFilter === 'after' ? 'bg-blue-50 border-blue-200 font-semibold text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
        >
          Sau sự kiện
        </button>
      </div>

      {/* Spreadsheet-like Table (Req 8) */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px] sticky top-0">
              <tr>
                <th className="px-3 py-2 text-center w-10">STT</th>
                <th className="px-3 py-2 w-28">Giai đoạn</th>
                <th className="px-3 py-2 min-w-[200px]">Nhiệm vụ</th>
                <th className="px-3 py-2 w-24">Tiểu ban</th>
                <th className="px-3 py-2">Người phụ trách</th>
                <th className="px-3 py-2 w-28">Hạn chót</th>
                <th className="px-3 py-2 w-32">Trạng thái</th>
                <th className="px-3 py-2">Sản phẩm đầu ra</th>
                <th className="px-3 py-2 text-right w-20">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {planTasks.map((t, idx) => {
                const statusCfg = TASK_STATUS_CONFIG[t.status] || { label: t.status, badge: 'bg-slate-100 text-slate-700' };
                const assignees = members.filter(m => t.assigneeIds.includes(m.id));

                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 py-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="px-3 py-2 text-slate-600 text-[11px]">
                      {t.phase === 'before' ? 'Trước sự kiện' : t.phase === 'during' ? 'Trong sự kiện' : 'Sau sự kiện'}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-900">{t.title}</td>
                    <td className="px-3 py-2 text-slate-600">{DEPARTMENTS[t.departmentId]?.shortName}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {assignees.map(a => a.fullName).join(', ') || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{formatDateVi(t.dueDate)}</td>
                    <td className="px-3 py-2">
                      <select
                        value={t.status}
                        onChange={async (e) => {
                          await updateTaskStatus(t.id, e.target.value as TaskStatus);
                          showToast('Đã cập nhật trạng thái nhiệm vụ.', 'success');
                        }}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border cursor-pointer ${statusCfg.badge}`}
                      >
                        {Object.entries(TASK_STATUS_CONFIG).map(([k, c]) => (
                          <option key={k} value={k}>{c.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      {t.outputLinks?.map((l, i) => (
                        <a key={i} href={l.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-[11px] truncate max-w-[120px]">
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">{l.title || 'Link'}</span>
                        </a>
                      ))}
                      {(!t.outputLinks || t.outputLinks.length === 0) && <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {t.status !== 'completed' && (
                        <button
                          onClick={async () => {
                            await updateTaskStatus(t.id, 'completed');
                            showToast('Đã nghiệm thu nhiệm vụ.', 'success');
                          }}
                          className="text-[10px] text-emerald-700 hover:text-emerald-900 font-medium"
                        >
                          Nghiệm thu
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Row directly */}
      {isNewRowOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 space-y-4 border border-slate-200 shadow-md text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">Thêm dòng nhiệm vụ</h3>
              <button onClick={() => setIsNewRowOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRow} className="space-y-3">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Nhiệm vụ *</label>
                <input
                  type="text"
                  required
                  value={newRow.title}
                  onChange={(e) => setNewRow({ ...newRow, title: e.target.value })}
                  placeholder="Ví dụ: Thiết kế poster A0..."
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Giai đoạn</label>
                  <select
                    value={newRow.phase}
                    onChange={(e) => setNewRow({ ...newRow, phase: e.target.value as TaskPhase })}
                    className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-xs"
                  >
                    <option value="before">Trước sự kiện</option>
                    <option value="during">Trong sự kiện</option>
                    <option value="after">Sau sự kiện</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Tiểu ban</label>
                  <select
                    value={newRow.departmentId}
                    onChange={(e) => setNewRow({ ...newRow, departmentId: e.target.value as DepartmentId })}
                    className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-xs"
                  >
                    <option value="btv-mc">BTV MC</option>
                    <option value="truyen-thong">Truyền thông</option>
                    <option value="ky-thuat">Kỹ thuật</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Hạn chót</label>
                <input
                  type="date"
                  value={newRow.dueDate}
                  onChange={(e) => setNewRow({ ...newRow, dueDate: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Người phụ trách</label>
                <select
                  onChange={(e) => {
                    if (e.target.value && !newRow.assigneeIds.includes(e.target.value)) {
                      setNewRow({ ...newRow, assigneeIds: [...newRow.assigneeIds, e.target.value] });
                    }
                  }}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs"
                >
                  <option value="">Chọn thành viên...</option>
                  {members.filter(m => m.departmentId === newRow.departmentId && !m.isDeleted).map(m => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewRowOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
