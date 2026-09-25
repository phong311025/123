import { useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';
import { DEPARTMENTS } from '../../data/departments';
import { exportToCsv, formatDateVi } from '../../lib/utils';

export function ReportsView() {
  const { members, tasks, newsItems } = useWorkspace();
  const { showToast } = useToast();

  const [reportType, setReportType] = useState<string>('personnel');
  const activeMembers = members.filter(m => !m.isDeleted && m.status === 'active');

  const handleExportCsv = () => {
    let filename = `Bao_cao_${reportType}_${new Date().toISOString().split('T')[0]}`;
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (reportType === 'personnel') {
      headers = ['Họ tên', 'Email', 'SĐT', 'Tiểu ban', 'Chức vụ', 'Lớp', 'Khóa', 'Điểm'];
      rows = activeMembers.map(m => [
        m.fullName, m.email, m.phone, DEPARTMENTS[m.departmentId]?.name, m.position, m.className, m.course, m.contributionScore || 0
      ]);
    } else if (reportType === 'overdue') {
      headers = ['Nhiệm vụ', 'Tiểu ban', 'Hạn chót', 'Người phụ trách', 'Trạng thái'];
      rows = tasks
        .filter(t => t.status === 'overdue' || (t.dueDate < new Date().toISOString().split('T')[0] && t.status !== 'completed'))
        .map(t => [
          t.title,
          DEPARTMENTS[t.departmentId]?.name,
          t.dueDate,
          members.filter(m => t.assigneeIds.includes(m.id)).map(m => m.fullName).join(', '),
          t.status
        ]);
    } else {
      headers = ['Mã', 'Tiêu đề', 'Ngày diễn ra', 'Địa điểm', 'Đơn vị tổ chức'];
      rows = newsItems.map(n => [n.code, n.title, n.eventDate, n.location, n.organizer]);
    }

    exportToCsv(filename, headers, rows);
    showToast('Đã xuất báo cáo ra CSV.', 'success');
  };

  return (
    <div className="space-y-4">
      {/* Report Controls */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Báo cáo & Xuất dữ liệu</h3>
          <p className="text-slate-500 mt-0.5">Xuất dữ liệu phục vụ báo cáo tuần, tháng hoặc học kỳ</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>In báo cáo</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1">
        {[
          { id: 'personnel', label: '1. Nhân sự 3 tiểu ban' },
          { id: 'news_weekly', label: '2. Bản tin tác nghiệp' },
          { id: 'overdue', label: '3. Việc quá hạn' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setReportType(t.id)}
            className={`px-3 py-1.5 rounded-md border text-xs font-medium whitespace-nowrap transition-colors ${
              reportType === t.id ? 'bg-slate-100 border-slate-300 text-slate-900 font-semibold' : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
              {reportType === 'personnel' && (
                <tr>
                  <th className="px-3 py-2">Họ và tên</th>
                  <th className="px-3 py-2">Tiểu ban</th>
                  <th className="px-3 py-2">Chức vụ</th>
                  <th className="px-3 py-2">Lớp</th>
                  <th className="px-3 py-2 text-center">Hoàn thành</th>
                  <th className="px-3 py-2 text-right">Điểm đóng góp</th>
                </tr>
              )}
              {reportType === 'news_weekly' && (
                <tr>
                  <th className="px-3 py-2">Mã</th>
                  <th className="px-3 py-2">Tiêu đề</th>
                  <th className="px-3 py-2">Ngày diễn ra</th>
                  <th className="px-3 py-2">Địa điểm</th>
                  <th className="px-3 py-2">Đơn vị</th>
                </tr>
              )}
              {reportType === 'overdue' && (
                <tr>
                  <th className="px-3 py-2">Nhiệm vụ</th>
                  <th className="px-3 py-2">Tiểu ban</th>
                  <th className="px-3 py-2">Hạn chót</th>
                  <th className="px-3 py-2">Người phụ trách</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportType === 'personnel' && activeMembers.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2 font-medium text-slate-900">{m.fullName}</td>
                  <td className="px-3 py-2 text-slate-600">{DEPARTMENTS[m.departmentId]?.shortName}</td>
                  <td className="px-3 py-2 text-slate-600">{m.position}</td>
                  <td className="px-3 py-2 text-slate-600">{m.className} ({m.course})</td>
                  <td className="px-3 py-2 text-center text-slate-700 font-medium">{m.completedTasksCount || 0}</td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-900">{m.contributionScore || 0}</td>
                </tr>
              ))}

              {reportType === 'news_weekly' && newsItems.map(n => (
                <tr key={n.id} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2 font-mono font-medium text-slate-600">{n.code}</td>
                  <td className="px-3 py-2 font-semibold text-slate-900">{n.title}</td>
                  <td className="px-3 py-2 text-slate-600">{formatDateVi(n.eventDate)} ({n.startTime} - {n.endTime})</td>
                  <td className="px-3 py-2 text-slate-500">{n.location}</td>
                  <td className="px-3 py-2 text-slate-600">{n.organizer}</td>
                </tr>
              ))}

              {reportType === 'overdue' && tasks.filter(t => t.status === 'overdue' || (t.dueDate < new Date().toISOString().split('T')[0] && t.status !== 'completed')).map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2 font-medium text-rose-700">{t.title}</td>
                  <td className="px-3 py-2 text-slate-600">{DEPARTMENTS[t.departmentId]?.shortName}</td>
                  <td className="px-3 py-2 text-rose-600 font-medium">{formatDateVi(t.dueDate)}</td>
                  <td className="px-3 py-2 text-slate-700">
                    {members.filter(m => t.assigneeIds.includes(m.id)).map(m => m.fullName).join(', ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
