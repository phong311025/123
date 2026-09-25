import { useState, useMemo } from 'react';
import { 
  FileText, Plus, Search, Calendar, MapPin, User, AlertTriangle, 
  Printer, X, Eye, Edit3, Trash2
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DEPARTMENTS, NEWS_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '../../data/departments';
import { NewsItem, NewsStatus, TaskPriority, ScheduleConflict } from '../../types';
import { formatDateVi } from '../../lib/utils';

export function NewsWeeklyView() {
  const { newsItems, members, addNewsItem, updateNewsItem, deleteNewsItem, checkMemberConflicts } = useWorkspace();
  const { isSuperAdmin, isDeptAdmin } = useAuth();
  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'print'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<NewsItem | null>(null);

  const initialForm = {
    code: `BT-${new Date().getFullYear()}-W${Math.ceil(new Date().getDate() / 7)}-${String(newsItems.length + 1).padStart(2, '0')}`,
    title: '',
    summary: '',
    receivedAt: new Date().toISOString().split('T')[0],
    eventDate: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '11:30',
    location: '',
    organizer: '',
    sourceContact: '',
    priority: 'normal' as TaskPriority,
    status: 'assigning' as NewsStatus,
    leadMemberId: '',
    assignments: {
      btvMc: [] as { memberId: string; role: string }[],
      truyenThong: [] as { memberId: string; role: string }[],
      kyThuat: [] as { memberId: string; role: string }[],
    },
    links: [''],
    notes: '',
  };

  const [formData, setFormData] = useState(initialForm);
  const [activeConflicts, setActiveConflicts] = useState<ScheduleConflict[]>([]);

  const filteredNews = useMemo(() => {
    return newsItems.filter(n => {
      if (statusFilter !== 'all' && n.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        if (!n.title.toLowerCase().includes(q) && !n.code.toLowerCase().includes(q) && !n.location.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [newsItems, statusFilter, searchTerm]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      ...initialForm,
      code: `BT-${new Date().getFullYear()}-W${Math.ceil(new Date().getDate() / 7)}-${String(newsItems.length + 1).padStart(2, '0')}`,
    });
    setActiveConflicts([]);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (item: NewsItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      title: item.title,
      summary: item.summary,
      receivedAt: item.receivedAt,
      eventDate: item.eventDate,
      startTime: item.startTime,
      endTime: item.endTime,
      location: item.location,
      organizer: item.organizer,
      sourceContact: item.sourceContact,
      priority: item.priority,
      status: item.status,
      leadMemberId: item.leadMemberId || '',
      assignments: {
        btvMc: item.assignments?.btvMc || [],
        truyenThong: item.assignments?.truyenThong || [],
        kyThuat: item.assignments?.kyThuat || [],
      },
      links: item.links?.length ? item.links : [''],
      notes: item.notes || '',
    });
    recalculateConflicts(item.eventDate, item.startTime, item.assignments);
    setIsDrawerOpen(true);
  };

  const recalculateConflicts = (
    dateStr: string, 
    startTime: string,
    assignments: typeof formData.assignments
  ) => {
    const conflicts: ScheduleConflict[] = [];
    const timeSlot = startTime < '12:00' ? 'morning' : startTime < '18:00' ? 'afternoon' : 'evening';
    const allIds = [
      ...assignments.btvMc.map(a => a.memberId),
      ...assignments.truyenThong.map(a => a.memberId),
      ...assignments.kyThuat.map(a => a.memberId),
    ];

    allIds.forEach(id => {
      if (id) {
        conflicts.push(...checkMemberConflicts(id, dateStr, timeSlot));
      }
    });

    setActiveConflicts(conflicts);
  };

  const handleAddAssignment = (dept: 'btvMc' | 'truyenThong' | 'kyThuat', memberId: string, role: string) => {
    if (!memberId) return;
    const current = formData.assignments[dept];
    if (current.some(a => a.memberId === memberId)) return;

    const updated = {
      ...formData.assignments,
      [dept]: [...current, { memberId, role }]
    };
    setFormData({ ...formData, assignments: updated });
    recalculateConflicts(formData.eventDate, formData.startTime, updated);
  };

  const handleRemoveAssignment = (dept: 'btvMc' | 'truyenThong' | 'kyThuat', memberId: string) => {
    const updated = {
      ...formData.assignments,
      [dept]: formData.assignments[dept].filter(a => a.memberId !== memberId)
    };
    setFormData({ ...formData, assignments: updated });
    recalculateConflicts(formData.eventDate, formData.startTime, updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Vui lòng nhập tiêu đề bản tin.', 'error');
      return;
    }

    try {
      if (editingItem) {
        await updateNewsItem(editingItem.id, {
          ...formData,
          links: formData.links.filter(Boolean),
        });
        showToast('Đã lưu thay đổi bản tin.', 'success');
      } else {
        await addNewsItem({
          ...formData,
          links: formData.links.filter(Boolean),
        });
        showToast('Đã tạo bản tin tác nghiệp mới.', 'success');
      }
      setIsDrawerOpen(false);
    } catch {
      showToast('Không thể lưu bản tin.', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action & search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã, tiêu đề, địa điểm..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* View mode switcher */}
          <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5 text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded transition-colors ${viewMode === 'list' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-600'}`}
            >
              Danh sách
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1 rounded transition-colors ${viewMode === 'kanban' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-600'}`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('print')}
              className={`px-2.5 py-1 rounded transition-colors ${viewMode === 'print' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-600'}`}
            >
              Bản in
            </button>
          </div>

          {(isSuperAdmin || isDeptAdmin) && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Bản tin mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode 1: Clean Minimal List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-2.5 w-28">Mã bản tin</th>
                  <th className="px-4 py-2.5">Tiêu đề & Nội dung</th>
                  <th className="px-4 py-2.5">Thời gian & Địa điểm</th>
                  <th className="px-4 py-2.5">Nhân sự 3 tiểu ban</th>
                  <th className="px-4 py-2.5">Trạng thái</th>
                  <th className="px-4 py-2.5 text-right w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNews.map((item) => {
                  const statusCfg = NEWS_STATUS_CONFIG[item.status] || { label: item.status, badge: 'bg-slate-100 text-slate-700' };
                  const btvCount = item.assignments?.btvMc?.length || 0;
                  const mediaCount = item.assignments?.truyenThong?.length || 0;
                  const techCount = item.assignments?.kyThuat?.length || 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-2.5 font-mono font-medium text-slate-600">
                        {item.code}
                      </td>
                      <td className="px-4 py-2.5">
                        <p 
                          onClick={() => setSelectedDetail(item)}
                          className="font-semibold text-slate-900 hover:text-blue-600 cursor-pointer"
                        >
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{item.summary}</p>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        <p className="font-medium text-slate-800">{formatDateVi(item.eventDate)}</p>
                        <p className="text-[11px] text-slate-400">{item.startTime} - {item.endTime} • {item.location}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${btvCount > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                            MC: {btvCount}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${mediaCount > 0 ? 'bg-slate-100 text-slate-800 font-semibold' : 'bg-slate-100 text-slate-400'}`}>
                            Media: {mediaCount}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${techCount > 0 ? 'bg-slate-100 text-slate-800 font-semibold' : 'bg-slate-100 text-slate-400'}`}>
                            Tech: {techCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusCfg.badge}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedDetail(item)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {(isSuperAdmin || isDeptAdmin) && (
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              title="Phân công"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mode 2: Minimal Kanban */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {(['assigning', 'assigned', 'in_progress', 'completed'] as NewsStatus[]).map(statusKey => {
            const items = filteredNews.filter(n => n.status === statusKey);
            const cfg = NEWS_STATUS_CONFIG[statusKey];

            return (
              <div key={statusKey} className="bg-slate-100/60 p-3 rounded-lg flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 mb-2">
                  <span className="text-xs font-semibold text-slate-700">{cfg.label}</span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-white px-1.5 py-0.2 rounded">
                    {items.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto">
                  {items.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedDetail(item)}
                      className="bg-white p-3 rounded-md border border-slate-200 hover:border-slate-300 cursor-pointer space-y-1.5 transition-colors"
                    >
                      <span className="font-mono text-[10px] text-slate-400 block">{item.code}</span>
                      <h4 className="font-semibold text-xs text-slate-800 line-clamp-2">{item.title}</h4>
                      <p className="text-[11px] text-slate-500">{formatDateVi(item.eventDate)} • {item.location}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mode 3: Clean Printable Schedule */}
      {viewMode === 'print' && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-semibold text-slate-900">BẢNG PHÂN CÔNG TÁC NGHIỆP TUẦN</h2>
              <p className="text-xs text-slate-500">Tiểu ban BTV MC • Truyền thông • Kỹ thuật</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium"
            >
              In bảng phân công
            </button>
          </div>

          <table className="w-full text-left text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 text-[11px]">
                <th className="p-2 border-r border-slate-200">Thời gian</th>
                <th className="p-2 border-r border-slate-200">Bản tin & Địa điểm</th>
                <th className="p-2 border-r border-slate-200">BTV MC</th>
                <th className="p-2 border-r border-slate-200">Truyền thông</th>
                <th className="p-2">Kỹ thuật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredNews.map(n => (
                <tr key={n.id}>
                  <td className="p-2 border-r border-slate-100 font-medium">
                    {formatDateVi(n.eventDate)}<br />
                    <span className="text-[10px] text-slate-400">{n.startTime} - {n.endTime}</span>
                  </td>
                  <td className="p-2 border-r border-slate-100">
                    <span className="font-semibold text-slate-900">{n.title}</span><br />
                    <span className="text-[11px] text-slate-500">{n.location}</span>
                  </td>
                  <td className="p-2 border-r border-slate-100 text-[11px]">
                    {n.assignments?.btvMc?.map(a => members.find(m => m.id === a.memberId)?.fullName).filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="p-2 border-r border-slate-100 text-[11px]">
                    {n.assignments?.truyenThong?.map(a => members.find(m => m.id === a.memberId)?.fullName).filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="p-2 text-[11px]">
                    {n.assignments?.kyThuat?.map(a => members.find(m => m.id === a.memberId)?.fullName).filter(Boolean).join(', ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer: Add / Edit & Assign Personnel (Slide from right) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-2xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full overflow-y-auto p-6 shadow-xl border-l border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">
                  {editingItem ? 'Phân công nhân sự bản tin' : 'Tiếp nhận bản tin tuần mới'}
                </h3>
                <p className="text-[11px] text-slate-500">Điều phối nhân sự 3 tiểu ban</p>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conflict Warning Banner (Minimalist) */}
            {activeConflicts.length > 0 && (
              <div className="p-3 rounded-md bg-amber-50/70 border border-amber-200 text-amber-900 space-y-1 text-xs">
                <span className="font-semibold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Cảnh báo xung đột lịch ({activeConflicts.length}):</span>
                </span>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                  {activeConflicts.map((c, idx) => (
                    <li key={idx}>{c.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Mã bản tin *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 font-mono text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-slate-700 font-medium block mb-1">Tiêu đề *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs"
                    placeholder="Lễ Khai mạc..."
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Mô tả tóm tắt</label>
                <textarea
                  rows={2}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Ngày diễn ra *</label>
                  <input
                    type="date"
                    required
                    value={formData.eventDate}
                    onChange={(e) => {
                      setFormData({ ...formData, eventDate: e.target.value });
                      recalculateConflicts(e.target.value, formData.startTime, formData.assignments);
                    }}
                    className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Bắt đầu</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => {
                      setFormData({ ...formData, startTime: e.target.value });
                      recalculateConflicts(formData.eventDate, e.target.value, formData.assignments);
                    }}
                    className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Kết thúc</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Địa điểm</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs"
                  placeholder="Hội trường A5..."
                />
              </div>

              {/* Subcommittees Assignment Sections */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                  Phân công 3 tiểu ban
                </span>

                {/* 1. BTV MC */}
                <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">1. BTV MC</span>
                    <div className="flex items-center gap-1.5">
                      <select id="mc-pick" className="px-2 py-1 rounded border border-slate-200 bg-white text-xs">
                        <option value="">Chọn nhân sự MC...</option>
                        {members.filter(m => m.departmentId === 'btv-mc' && !m.isDeleted).map(m => (
                          <option key={m.id} value={m.id}>{m.fullName}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('mc-pick') as HTMLSelectElement;
                          if (el.value) handleAddAssignment('btvMc', el.value, 'MC chính');
                        }}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                      >
                        + Gán
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {formData.assignments.btvMc.map(a => (
                      <span key={a.memberId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px]">
                        <span>{members.find(m => m.id === a.memberId)?.fullName}</span>
                        <button type="button" onClick={() => handleRemoveAssignment('btvMc', a.memberId)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* 2. Truyền thông */}
                <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">2. Truyền thông</span>
                    <div className="flex items-center gap-1.5">
                      <select id="media-pick" className="px-2 py-1 rounded border border-slate-200 bg-white text-xs">
                        <option value="">Chọn nhân sự Media...</option>
                        {members.filter(m => m.departmentId === 'truyen-thong' && !m.isDeleted).map(m => (
                          <option key={m.id} value={m.id}>{m.fullName}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('media-pick') as HTMLSelectElement;
                          if (el.value) handleAddAssignment('truyenThong', el.value, 'Ảnh/Video');
                        }}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                      >
                        + Gán
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {formData.assignments.truyenThong.map(a => (
                      <span key={a.memberId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px]">
                        <span>{members.find(m => m.id === a.memberId)?.fullName}</span>
                        <button type="button" onClick={() => handleRemoveAssignment('truyenThong', a.memberId)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* 3. Kỹ thuật */}
                <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">3. Kỹ thuật</span>
                    <div className="flex items-center gap-1.5">
                      <select id="tech-pick" className="px-2 py-1 rounded border border-slate-200 bg-white text-xs">
                        <option value="">Chọn nhân sự Tech...</option>
                        {members.filter(m => m.departmentId === 'ky-thuat' && !m.isDeleted).map(m => (
                          <option key={m.id} value={m.id}>{m.fullName}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('tech-pick') as HTMLSelectElement;
                          if (el.value) handleAddAssignment('kyThuat', el.value, 'Âm thanh');
                        }}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                      >
                        + Gán
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {formData.assignments.kyThuat.map(a => (
                      <span key={a.memberId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px]">
                        <span>{members.find(m => m.id === a.memberId)?.fullName}</span>
                        <button type="button" onClick={() => handleRemoveAssignment('kyThuat', a.memberId)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  {editingItem ? 'Lưu bản tin' : 'Tạo bản tin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Details */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-5 space-y-3 border border-slate-200 shadow-md text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-mono text-slate-500 font-semibold">{selectedDetail.code}</span>
              <button onClick={() => setSelectedDetail(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">{selectedDetail.title}</h3>
            <p className="text-slate-600">{selectedDetail.summary}</p>
            <div className="p-3 bg-slate-50 rounded text-slate-600 space-y-1 text-[11px]">
              <p>📅 Ngày: {formatDateVi(selectedDetail.eventDate)} ({selectedDetail.startTime} - {selectedDetail.endTime})</p>
              <p>📍 Địa điểm: {selectedDetail.location}</p>
              <p>🏢 Đơn vị: {selectedDetail.organizer}</p>
            </div>
            <div className="pt-2 flex justify-end">
              <button onClick={() => setSelectedDetail(null)} className="px-3 py-1 rounded bg-slate-100 text-slate-700 font-medium">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
