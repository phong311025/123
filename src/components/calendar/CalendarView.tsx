import { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { DEPARTMENTS } from '../../data/departments';
import { formatDateVi } from '../../lib/utils';

export function CalendarView() {
  const { events, newsItems, tasks } = useWorkspace();

  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 1)); // Default October 2025 where events are
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [calendarMode, setCalendarMode] = useState<'month' | 'list'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());

  const calendarItems = useMemo(() => {
    const list: {
      id: string;
      title: string;
      dateStr: string;
      timeStr?: string;
      type: 'event' | 'news' | 'task';
      departmentId?: string;
      badgeText: string;
      badgeStyle: string;
    }[] = [];

    events.forEach(e => {
      const date = e.startDate?.split('T')[0] || '';
      list.push({
        id: e.id,
        title: e.title,
        dateStr: date,
        timeStr: e.startDate?.split('T')[1]?.substring(0, 5),
        type: 'event',
        departmentId: e.departmentId,
        badgeText: 'Sự kiện',
        badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      });
    });

    newsItems.forEach(n => {
      list.push({
        id: n.id,
        title: `${n.code} - ${n.title}`,
        dateStr: n.eventDate,
        timeStr: n.startTime,
        type: 'news',
        badgeText: 'Bản tin',
        badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200',
      });
    });

    tasks.forEach(t => {
      const isOverdue = t.status === 'overdue';
      const isCompleted = t.status === 'completed';
      list.push({
        id: t.id,
        title: t.title,
        dateStr: t.dueDate,
        type: 'task',
        departmentId: t.departmentId,
        badgeText: isOverdue ? 'Quá hạn' : isCompleted ? 'Xong' : DEPARTMENTS[t.departmentId]?.shortName || 'Việc',
        badgeStyle: isOverdue ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    'bg-slate-100 text-slate-700 border-slate-200',
      });
    });

    return list.filter(item => {
      if (selectedDept !== 'all' && item.departmentId && item.departmentId !== selectedDept) return false;
      return true;
    });
  }, [events, newsItems, tasks, selectedDept]);

  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const startOffset = (firstDayIndex === 0 ? 6 : firstDayIndex - 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < startOffset; i++) {
      days.push({ dayNumber: null, dateStr: null, currentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dayNumber: i, dateStr, currentMonth: true });
    }
    return days;
  }, [year, month]);

  return (
    <div className="space-y-4">
      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-200 bg-white rounded-md p-0.5">
            <button onClick={prevMonth} className="p-1 hover:bg-slate-50 text-slate-600 rounded">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={today} className="px-2.5 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded">
              Hôm nay
            </button>
            <button onClick={nextMonth} className="p-1 hover:bg-slate-50 text-slate-600 rounded">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="font-semibold text-slate-900 text-sm">
            Tháng {month + 1}, {year}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700"
          >
            <option value="all">Tất cả tiểu ban</option>
            <option value="btv-mc">BTV MC</option>
            <option value="truyen-thong">Truyền thông</option>
            <option value="ky-thuat">Kỹ thuật</option>
          </select>

          <div className="flex items-center border border-slate-200 bg-white rounded-md p-0.5">
            <button
              onClick={() => setCalendarMode('month')}
              className={`px-2.5 py-0.5 rounded transition-colors ${calendarMode === 'month' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-600'}`}
            >
              Tháng
            </button>
            <button
              onClick={() => setCalendarMode('list')}
              className={`px-2.5 py-0.5 rounded transition-colors ${calendarMode === 'list' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-600'}`}
            >
              Danh sách
            </button>
          </div>
        </div>
      </div>

      {/* Month View Grid */}
      {calendarMode === 'month' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-7 bg-slate-50/70 border-b border-slate-200 text-center text-xs font-semibold text-slate-600 py-2">
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
            <span className="text-slate-700">CN</span>
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[500px]">
            {calendarDays.map((cell, idx) => {
              const dayItems = cell.dateStr ? calendarItems.filter(item => item.dateStr === cell.dateStr) : [];

              return (
                <div 
                  key={idx} 
                  className={`p-1.5 min-h-[90px] flex flex-col ${
                    cell.currentMonth ? 'bg-white' : 'bg-slate-50/30 text-slate-300'
                  }`}
                >
                  <span className={`text-[11px] font-medium mb-1 ${cell.currentMonth ? 'text-slate-700' : 'text-slate-300'}`}>
                    {cell.dayNumber}
                  </span>

                  <div className="space-y-1 overflow-y-auto flex-1">
                    {dayItems.map(item => (
                      <div
                        key={item.id}
                        className={`px-1.5 py-0.5 rounded text-[10px] border truncate font-medium ${item.badgeStyle}`}
                        title={item.title}
                      >
                        {item.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List Mode View */}
      {calendarMode === 'list' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
          {calendarItems
            .sort((a, b) => a.dateStr.localeCompare(b.dateStr))
            .map(item => (
              <div key={item.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <span className="font-medium text-slate-700 w-24">{formatDateVi(item.dateStr)}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${item.badgeStyle}`}>
                    {item.badgeText}
                  </span>
                  <span className="font-semibold text-slate-900">{item.title}</span>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
