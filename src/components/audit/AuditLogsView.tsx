import { useState, useMemo } from 'react';
import { History, Search } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { formatDateTimeVi } from '../../lib/utils';

export function AuditLogsView() {
  const { auditLogs } = useWorkspace();
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (entityFilter !== 'all' && log.entityType !== entityFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          log.userName?.toLowerCase().includes(q) ||
          log.action?.toLowerCase().includes(q) ||
          log.details?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [auditLogs, entityFilter, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Top Filter */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Nhật ký hoạt động (Audit Trail)</h3>
          <p className="text-slate-500 mt-0.5">Lịch sử các thao tác thay đổi dữ liệu và phân quyền hệ thống</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700"
          >
            <option value="all">Tất cả đối tượng</option>
            <option value="member">Thành viên</option>
            <option value="task">Nhiệm vụ</option>
            <option value="news">Bản tin</option>
            <option value="event">Sự kiện</option>
            <option value="system">Hệ thống</option>
          </select>
        </div>
      </div>

      {/* Clean Timeline List */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
        {filteredLogs.map(log => (
          <div key={log.id} className="p-3.5 hover:bg-slate-50/50 transition-colors flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{log.userName}</span>
                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                  {log.userRole}
                </span>
                <span className="text-slate-400">•</span>
                <span className="font-medium text-slate-700">{log.action}</span>
              </div>
              <p className="text-slate-500 text-[11px]">{log.details}</p>
            </div>
            <span className="text-[11px] text-slate-400 shrink-0 font-medium">
              {formatDateTimeVi(log.timestamp)}
            </span>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="p-6 text-center text-slate-400 text-xs">
            Chưa có thao tác nào trong nhật ký.
          </div>
        )}
      </div>
    </div>
  );
}
