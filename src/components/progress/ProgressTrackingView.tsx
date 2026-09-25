import { useState, useMemo } from 'react';
import { 
  CheckSquare, Search, Clock, CheckCircle2, AlertTriangle, 
  ExternalLink, ChevronRight, X, User
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DEPARTMENTS, TASK_STATUS_CONFIG } from '../../data/departments';
import { Task, TaskStatus } from '../../types';
import { formatDateVi, formatDateTimeVi, calculateHoursBetween } from '../../lib/utils';

export function ProgressTrackingView() {
  const { tasks, members, updateTaskStatus, updateTask } = useWorkspace();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(tasks[0] || null);

  const [outputTitle, setOutputTitle] = useState('');
  const [outputUrl, setOutputUrl] = useState('');

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (selectedDept !== 'all' && t.departmentId !== selectedDept) return false;
      if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        if (!t.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tasks, selectedDept, selectedStatus, searchTerm]);

  const handleAddLink = async () => {
    if (!selectedTask || !outputUrl.trim()) return;

    const newLinks = [
      ...(selectedTask.outputLinks || []),
      { title: outputTitle.trim() || 'Link sản phẩm', url: outputUrl.trim() }
    ];

    await updateTask(selectedTask.id, { outputLinks: newLinks });
    setSelectedTask(prev => prev ? { ...prev, outputLinks: newLinks } : null);
    setOutputTitle('');
    setOutputUrl('');
    showToast('Đã lưu link sản phẩm bàn giao.', 'success');
  };

  const handleAdvanceStatus = async (task: Task, nextStatus: TaskStatus) => {
    await updateTaskStatus(task.id, nextStatus);
    if (selectedTask?.id === task.id) {
      setSelectedTask(prev => prev ? { ...prev, status: nextStatus } : null);
    }
    showToast(`Đã chuyển trạng thái sang: ${TASK_STATUS_CONFIG[nextStatus]?.label}`, 'success');
  };

  return (
    <div className="space-y-4">
      {/* Top filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên nhiệm vụ..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700"
          >
            <option value="all">Tất cả tiểu ban</option>
            <option value="btv-mc">BTV MC</option>
            <option value="truyen-thong">Truyền thông</option>
            <option value="ky-thuat">Kỹ thuật</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700"
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(TASK_STATUS_CONFIG).map(([k, cfg]) => (
              <option key={k} value={k}>{cfg.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Clean Task Table / List */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px] sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Nhiệm vụ</th>
                  <th className="px-4 py-2.5">Tiểu ban</th>
                  <th className="px-4 py-2.5">Hạn chót</th>
                  <th className="px-4 py-2.5">Trạng thái</th>
                  <th className="px-4 py-2.5 text-center">Xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map(task => {
                  const statusCfg = TASK_STATUS_CONFIG[task.status] || { label: task.status, badge: 'bg-slate-100 text-slate-700' };
                  const isSelected = selectedTask?.id === task.id;
                  const turnaroundHours = calculateHoursBetween(task.milestones?.startedAt, task.milestones?.completedAt || new Date().toISOString());

                  return (
                    <tr 
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-slate-900">{task.title}</p>
                        <p className="text-[11px] text-slate-400">
                          {members.filter(m => task.assigneeIds.includes(m.id)).map(m => m.fullName).join(', ') || 'Chưa giao'}
                        </p>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {DEPARTMENTS[task.departmentId]?.shortName}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {formatDateVi(task.dueDate)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusCfg.badge}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center text-slate-500 font-medium">
                        {turnaroundHours > 0 ? `${turnaroundHours}h` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Minimal Milestones & Deliverables Panel */}
        <div className="lg:col-span-5">
          {selectedTask ? (
            <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-5 sticky top-20 text-xs">
              <div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${TASK_STATUS_CONFIG[selectedTask.status]?.badge}`}>
                  {TASK_STATUS_CONFIG[selectedTask.status]?.label}
                </span>
                <h3 className="font-semibold text-slate-900 text-sm mt-1.5">{selectedTask.title}</h3>
                {selectedTask.description && (
                  <p className="text-slate-500 mt-0.5 text-[11px]">{selectedTask.description}</p>
                )}
              </div>

              {/* Milestones timeline (Minimalist) */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                  Tiến trình mốc thời gian
                </span>

                <div className="relative pl-5 border-l border-slate-200 space-y-3 ml-1 text-slate-600">
                  <div>
                    <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-400" />
                    <p className="font-medium text-slate-800">1. Nhận tin: <span className="text-slate-500 font-normal">{formatDateTimeVi(selectedTask.milestones?.receivedAt)}</span></p>
                  </div>
                  <div>
                    <span className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ${selectedTask.milestones?.startedAt ? 'bg-blue-600' : 'bg-slate-300'}`} />
                    <p className="font-medium text-slate-800">2. Bắt đầu: <span className="text-slate-500 font-normal">{formatDateTimeVi(selectedTask.milestones?.startedAt)}</span></p>
                  </div>
                  <div>
                    <span className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ${selectedTask.milestones?.draftSubmittedAt ? 'bg-blue-600' : 'bg-slate-300'}`} />
                    <p className="font-medium text-slate-800">3. Nộp bản nháp: <span className="text-slate-500 font-normal">{formatDateTimeVi(selectedTask.milestones?.draftSubmittedAt)}</span></p>
                  </div>
                  <div>
                    <span className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ${selectedTask.milestones?.completedAt ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                    <p className="font-medium text-slate-800">4. Hoàn tất nghiệm thu: <span className="text-slate-500 font-normal">{formatDateTimeVi(selectedTask.milestones?.completedAt)}</span></p>
                  </div>
                </div>
              </div>

              {/* Deliverables links */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                  Sản phẩm bàn giao
                </span>

                <div className="space-y-1.5">
                  {selectedTask.outputLinks?.map((l, idx) => (
                    <a
                      key={idx}
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded border border-slate-200 bg-slate-50/50 hover:bg-slate-100 flex items-center justify-between text-blue-600"
                    >
                      <span className="truncate">{l.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  ))}
                </div>

                <div className="pt-2 space-y-1.5">
                  <input
                    type="url"
                    value={outputUrl}
                    onChange={(e) => setOutputUrl(e.target.value)}
                    placeholder="Link Google Drive, Figma, Canva..."
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 text-xs"
                  />
                  <button
                    onClick={handleAddLink}
                    disabled={!outputUrl.trim()}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 text-white font-medium rounded text-xs transition-colors"
                  >
                    Bàn giao sản phẩm
                  </button>
                </div>
              </div>

              {/* Status advancement actions */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleAdvanceStatus(selectedTask, 'in_progress')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                >
                  Bắt đầu làm
                </button>
                <button
                  onClick={() => handleAdvanceStatus(selectedTask, 'draft_submitted')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                >
                  Nộp nháp
                </button>
                <button
                  onClick={() => handleAdvanceStatus(selectedTask, 'completed')}
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                >
                  Nghiệm thu
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-lg border border-slate-200 text-slate-400 text-xs">
              Chọn nhiệm vụ bên trái để xem chi tiết tiến độ.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
