import { useState, useMemo } from 'react';
import { 
  Plus, Search, Calendar, MapPin, User, Edit3, Trash2, X
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DEPARTMENTS } from '../../data/departments';
import { ClubEvent, DepartmentId } from '../../types';
import { formatDateVi } from '../../lib/utils';

export function EventsView({ onNavigateToPlan }: { onNavigateToPlan?: () => void }) {
  const { events, members, plans, addEvent, updateEvent, deleteEvent } = useWorkspace();
  const { isSuperAdmin, isDeptAdmin } = useAuth();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ClubEvent | null>(null);

  const initialForm = {
    title: '',
    description: '',
    location: '',
    startDate: new Date().toISOString().split('T')[0] + 'T08:00',
    endDate: new Date().toISOString().split('T')[0] + 'T12:00',
    departmentId: 'btv-mc' as DepartmentId,
    status: 'upcoming' as ClubEvent['status'],
    leadMemberId: members[0]?.id || '',
  };

  const [formData, setFormData] = useState(initialForm);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        if (!e.title.toLowerCase().includes(q) && !e.location.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [events, statusFilter, searchTerm]);

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e: ClubEvent) => {
    setEditingEvent(e);
    setFormData({
      title: e.title,
      description: e.description,
      location: e.location,
      startDate: e.startDate.substring(0, 16),
      endDate: e.endDate.substring(0, 16),
      departmentId: e.departmentId || 'btv-mc',
      status: e.status,
      leadMemberId: e.leadMemberId || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.location.trim()) {
      showToast('Vui lòng nhập tên sự kiện và địa điểm.', 'error');
      return;
    }

    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, {
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        });
        showToast('Đã lưu thay đổi sự kiện.', 'success');
      } else {
        await addEvent({
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        });
        showToast('Đã tạo sự kiện mới.', 'success');
      }
      setIsModalOpen(false);
    } catch {
      showToast('Không thể lưu sự kiện.', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top search & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên sự kiện, địa điểm..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="upcoming">Sắp diễn ra</option>
            <option value="ongoing">Đang diễn ra</option>
            <option value="completed">Đã hoàn thành</option>
          </select>

          {(isSuperAdmin || isDeptAdmin) && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tạo sự kiện</span>
            </button>
          )}
        </div>
      </div>

      {/* Events Clean List / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvents.map(event => {
          const lead = members.find(m => m.id === event.leadMemberId);

          return (
            <div key={event.id} className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col justify-between hover:border-slate-300 transition-colors text-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                    event.status === 'upcoming' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    event.status === 'ongoing' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {event.status === 'upcoming' ? 'Sắp diễn ra' : event.status === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {formatDateVi(event.startDate)}
                  </span>
                </div>

                <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">{event.title}</h3>
                <p className="text-slate-500 line-clamp-2 text-[11px]">{event.description}</p>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <p>📍 {event.location}</p>
                  <p>👤 Trưởng ban: <strong>{lead?.fullName || 'Chưa phân công'}</strong></p>
                </div>
              </div>

              {(isSuperAdmin || isDeptAdmin) && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1 mt-3">
                  <button
                    onClick={() => handleOpenEdit(event)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    title="Sửa"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={async () => {
                      await deleteEvent(event.id);
                      showToast('Đã xóa sự kiện.', 'info');
                    }}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Xóa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Event */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 space-y-4 border border-slate-200 shadow-md text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">
                {editingEvent ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Tên sự kiện *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Gala Chào Tân Sinh Viên..."
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Mô tả sự kiện</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Bắt đầu</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Kết thúc</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Địa điểm *</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Hội trường A5..."
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Trưởng ban tổ chức</label>
                <select
                  value={formData.leadMemberId}
                  onChange={(e) => setFormData({ ...formData, leadMemberId: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs"
                >
                  {members.filter(m => !m.isDeleted).map(m => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Lưu sự kiện
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
