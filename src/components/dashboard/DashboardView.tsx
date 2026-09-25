import { useState, useMemo } from 'react';
import { 
  Users, Calendar, CheckSquare, AlertTriangle, Clock, 
  CheckCircle2, ArrowRight, Filter, ChevronRight
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';
import { DEPARTMENTS, TASK_STATUS_CONFIG } from '../../data/departments';
import { formatDateVi } from '../../lib/utils';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { members, newsItems, events, tasks, updateTaskStatus } = useWorkspace();
  const { showToast } = useToast();

  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (selectedDept !== 'all' && t.departmentId !== selectedDept) return false;
      return true;
    });
  }, [tasks, selectedDept]);

  // 6 Primary KPIs (Req 5)
  const activeMembersCount = members.filter(m => !m.isDeleted && m.status === 'active').length;
  const eventsCount = events.length;
  const inProgressCount = filteredTasks.filter(t => t.status === 'in_progress').length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const threeDaysLater = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0];
  
  const upcomingDueTasks = filteredTasks.filter(t => 
    t.status !== 'completed' && t.status !== 'cancelled' && t.dueDate >= todayStr && t.dueDate <= threeDaysLater
  );

  const overdueTasks = filteredTasks.filter(t => 
    t.status === 'overdue' || (t.dueDate < todayStr && t.status !== 'completed' && t.status !== 'cancelled')
  );

  const completedCount = filteredTasks.filter(t => t.status === 'completed' || t.status === 'approved').length;
  const totalTasksCount = filteredTasks.length;
  const completionRate = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;

  // Department distribution
  const deptStats = useMemo(() => {
    const btv = filteredTasks.filter(t => t.departmentId === 'btv-mc').length;
    const media = filteredTasks.filter(t => t.departmentId === 'truyen-thong').length;
    const tech = filteredTasks.filter(t => t.departmentId === 'ky-thuat').length;
    const total = btv + media + tech || 1;
    return { btv, media, tech, total };
  }, [filteredTasks]);

  const handleQuickResolve = async (taskId: string) => {
    await updateTaskStatus(taskId, 'completed', 'Nghiệm thu từ bảng tổng quan');
    showToast('Đã đánh dấu hoàn thành nhiệm vụ.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Tổng quan chỉ số</h2>
          <p className="text-xs text-slate-500">Hoạt động điều phối 3 tiểu ban BTV MC, Truyền thông & Kỹ thuật</p>
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1 text-xs">
          <button
            onClick={() => setSelectedDept('all')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${selectedDept === 'all' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setSelectedDept('btv-mc')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${selectedDept === 'btv-mc' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-blue-700'}`}
          >
            BTV MC
          </button>
          <button
            onClick={() => setSelectedDept('truyen-thong')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${selectedDept === 'truyen-thong' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Truyền thông
          </button>
          <button
            onClick={() => setSelectedDept('ky-thuat')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${selectedDept === 'ky-thuat' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Kỹ thuật
          </button>
        </div>
      </div>

      {/* 6 Essential KPI Cards (Req 5: 4-6 chỉ số quan trọng nhất) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Sự kiện */}
        <div 
          onClick={() => onNavigate('events')}
          className="bg-white p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium text-slate-600">Sự kiện CLB</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-semibold text-slate-900">{eventsCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Trong học kỳ</p>
        </div>

        {/* 2. Nhiệm vụ đang thực hiện */}
        <div 
          onClick={() => onNavigate('tasks')}
          className="bg-white p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium text-slate-600">Đang thực hiện</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-semibold text-slate-900">{inProgressCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Nhiệm vụ đang chạy</p>
        </div>

        {/* 3. Nhiệm vụ sắp đến hạn */}
        <div 
          onClick={() => onNavigate('tasks')}
          className="bg-white p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium text-slate-600">Sắp đến hạn</span>
            <CheckSquare className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-semibold text-slate-900">{upcomingDueTasks.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Trong 3 ngày tới</p>
        </div>

        {/* 4. Nhiệm vụ quá hạn */}
        <div 
          onClick={() => onNavigate('tasks')}
          className={`p-3.5 rounded-lg border transition-colors cursor-pointer ${
            overdueTasks.length > 0 ? 'bg-rose-50/40 border-rose-200' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-rose-700">Quá hạn</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-semibold text-rose-700">{overdueTasks.length}</div>
          <p className="text-[11px] text-rose-600 mt-0.5">Cần xử lý gấp</p>
        </div>

        {/* 5. Sản phẩm hoàn thành */}
        <div 
          onClick={() => onNavigate('tasks')}
          className="bg-white p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium text-slate-600">Đã hoàn thành</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-semibold text-slate-900">{completedCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Tỷ lệ: {completionRate}%</p>
        </div>

        {/* 6. Thành viên hoạt động */}
        <div 
          onClick={() => onNavigate('members')}
          className="bg-white p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium text-slate-600">Thành viên</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-semibold text-slate-900">{activeMembersCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">3 tiểu ban</p>
        </div>
      </div>

      {/* Overview Analytics (Clean single-accent progress) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Progress & Breakdown */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wide">Tiến độ công việc tổng thể</h3>
              <p className="text-[11px] text-slate-500">Tỷ lệ hoàn tất các nhiệm vụ được giao</p>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              {completedCount} / {totalTasksCount} nhiệm vụ ({completionRate}%)
            </span>
          </div>

          {/* Minimalist neutral progress bar */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              style={{ width: `${completionRate}%` }} 
              className="bg-blue-600 h-full rounded-full transition-all duration-300" 
            />
          </div>

          {/* Workload by subcommittee */}
          <div className="pt-2">
            <h4 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-2.5">
              Khối lượng nhiệm vụ theo 3 tiểu ban
            </h4>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between text-slate-700 font-medium">
                  <span>BTV MC</span>
                  <span className="font-semibold">{deptStats.btv}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                  <div style={{ width: `${(deptStats.btv / deptStats.total) * 100}%` }} className="bg-blue-600 h-full" />
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between text-slate-700 font-medium">
                  <span>Truyền thông</span>
                  <span className="font-semibold">{deptStats.media}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                  <div style={{ width: `${(deptStats.media / deptStats.total) * 100}%` }} className="bg-blue-600 h-full" />
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between text-slate-700 font-medium">
                  <span>Kỹ thuật</span>
                  <span className="font-semibold">{deptStats.tech}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                  <div style={{ width: `${(deptStats.tech / deptStats.total) * 100}%` }} className="bg-blue-600 h-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Urgent Actions Column */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wide">Việc cần xử lý ngay</h3>
              <span className="text-[10px] text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">
                {overdueTasks.length} quá hạn
              </span>
            </div>
            
            <div className="space-y-2 mt-3">
              {overdueTasks.slice(0, 3).map(task => (
                <div key={task.id} className="p-2.5 rounded-md border border-slate-100 bg-slate-50/60 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800 truncate max-w-[160px]">{task.title}</span>
                    <button
                      onClick={() => handleQuickResolve(task.id)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold shrink-0"
                    >
                      Nghiệm thu
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Hạn: {formatDateVi(task.dueDate)} • {DEPARTMENTS[task.departmentId]?.shortName}
                  </p>
                </div>
              ))}

              {overdueTasks.length === 0 && (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Không có công việc nào bị quá hạn.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('tasks')}
            className="w-full py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md font-medium text-center hover:bg-slate-50 transition-colors"
          >
            Xem tất cả nhiệm vụ →
          </button>
        </div>
      </div>

      {/* Recent Bulletins & Schedule preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wide">Bản tin tác nghiệp tuần</h3>
            <button 
              onClick={() => onNavigate('news')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Xem tất cả
            </button>
          </div>

          <div className="space-y-2">
            {newsItems.slice(0, 3).map(news => (
              <div key={news.id} className="p-3 rounded-md border border-slate-100 hover:bg-slate-50/50 transition-colors text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800">{news.title}</span>
                  <span className="text-[10px] text-slate-500">{formatDateVi(news.eventDate)}</span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{news.summary}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                  <span>📍 {news.location}</span>
                  <span>👤 {news.organizer}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wide">Sự kiện sắp diễn ra</h3>
            <button 
              onClick={() => onNavigate('events')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Xem tất cả
            </button>
          </div>

          <div className="space-y-2">
            {events.slice(0, 3).map(event => (
              <div key={event.id} className="p-3 rounded-md border border-slate-100 hover:bg-slate-50/50 transition-colors text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800">{event.title}</span>
                  <span className="text-[10px] text-slate-500">{formatDateVi(event.startDate)}</span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{event.description}</p>
                <p className="text-[10px] text-slate-500 mt-1">📍 {event.location}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
