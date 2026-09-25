import { useState, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Download, Trash2, Edit3, 
  RotateCcw, Eye, X, Phone, Mail, BookOpen, ExternalLink, 
  Check, MoreHorizontal, ArrowUpDown
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DEPARTMENTS } from '../../data/departments';
import { Member, DepartmentId, UserRole, MemberStatus, DayOfWeek, StudySlotStatus } from '../../types';
import { exportToCsv, formatDateVi } from '../../lib/utils';

const DAYS_OF_WEEK: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'T2' },
  { key: 'tuesday', label: 'T3' },
  { key: 'wednesday', label: 'T4' },
  { key: 'thursday', label: 'T5' },
  { key: 'friday', label: 'T6' },
  { key: 'saturday', label: 'T7' },
  { key: 'sunday', label: 'CN' },
];

export function MembersView() {
  const { members, addMember, updateMember, softDeleteMember, restoreMember, tasks } = useWorkspace();
  const { isSuperAdmin, isDeptAdmin, canManageDepartment, currentUser } = useAuth();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  // Form Drawer & Detail Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);

  // Form State grouped into clear sections (Req 7)
  const initialFormData = {
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    className: '',
    major: '',
    course: 'K20',
    departmentId: (isDeptAdmin ? currentUser?.departmentId || 'btv-mc' : 'btv-mc') as DepartmentId,
    position: 'Thành viên',
    systemRole: 'member' as UserRole,
    status: 'active' as MemberStatus,
    skills: '',
    facebookUrl: '',
    notes: '',
  };

  const [formData, setFormData] = useState(initialFormData);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      if (selectedStatus === 'active' && (m.isDeleted || m.status !== 'active')) return false;
      if (selectedStatus === 'leave' && m.status !== 'leave') return false;
      if (selectedStatus === 'alumni' && !m.isDeleted && m.status !== 'alumni') return false;
      if (selectedDept !== 'all' && m.departmentId !== selectedDept) return false;
      if (selectedCourse !== 'all' && m.course !== selectedCourse) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = m.fullName.toLowerCase().includes(q);
        const matchClass = m.className.toLowerCase().includes(q);
        const matchMajor = m.major.toLowerCase().includes(q);
        const matchEmail = m.email.toLowerCase().includes(q);
        if (!matchName && !matchClass && !matchMajor && !matchEmail) return false;
      }

      return true;
    });
  }, [members, selectedDept, selectedStatus, selectedCourse, searchTerm]);

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData(initialFormData);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setFormData({
      fullName: m.fullName,
      email: m.email,
      phone: m.phone,
      dateOfBirth: m.dateOfBirth || '',
      className: m.className,
      major: m.major,
      course: m.course,
      departmentId: m.departmentId,
      position: m.position,
      systemRole: m.systemRole,
      status: m.status,
      skills: m.skills?.join(', ') || '',
      facebookUrl: m.facebookUrl || '',
      notes: m.notes || '',
    });
    setIsDrawerOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      showToast('Vui lòng điền đầy đủ họ tên và email.', 'error');
      return;
    }

    const skillsArray = formData.skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      if (editingMember) {
        await updateMember(editingMember.id, {
          ...formData,
          skills: skillsArray,
        });
        showToast('Đã cập nhật thông tin thành viên.', 'success');
      } else {
        await addMember({
          ...formData,
          joinedAt: new Date().toISOString().split('T')[0],
          skills: skillsArray,
          studySchedule: {
            monday: { morning: 'free', afternoon: 'free', evening: 'free' },
            tuesday: { morning: 'free', afternoon: 'free', evening: 'free' },
            wednesday: { morning: 'free', afternoon: 'free', evening: 'free' },
            thursday: { morning: 'free', afternoon: 'free', evening: 'free' },
            friday: { morning: 'free', afternoon: 'free', evening: 'free' },
            saturday: { morning: 'free', afternoon: 'free', evening: 'free' },
            sunday: { morning: 'free', afternoon: 'free', evening: 'free' },
          },
          completedTasksCount: 0,
          overdueTasksCount: 0,
          contributionScore: 80,
        });
        showToast('Đã thêm thành viên mới.', 'success');
      }
      setIsDrawerOpen(false);
    } catch {
      showToast('Không thể lưu thông tin thành viên.', 'error');
    }
  };

  const handleToggleSlot = async (day: DayOfWeek, slot: 'morning' | 'afternoon' | 'evening') => {
    if (!viewingMember) return;
    const current = viewingMember.studySchedule?.[day]?.[slot] || 'free';
    const next: StudySlotStatus = current === 'free' ? 'busy' : current === 'busy' ? 'available' : 'free';

    const updated = {
      ...viewingMember.studySchedule,
      [day]: {
        ...viewingMember.studySchedule[day],
        [slot]: next,
      }
    };

    await updateMember(viewingMember.id, { studySchedule: updated });
    setViewingMember(prev => prev ? { ...prev, studySchedule: updated } : null);
    showToast('Đã cập nhật lịch học.', 'info');
  };

  const handleExportCsv = () => {
    const headers = ['Họ tên', 'Email', 'SĐT', 'Tiểu ban', 'Chức vụ', 'Lớp', 'Ngành', 'Khóa', 'Trạng thái', 'Điểm'];
    const rows = filteredMembers.map(m => [
      m.fullName, m.email, m.phone, DEPARTMENTS[m.departmentId]?.name, m.position, m.className, m.major, m.course,
      m.status === 'active' ? 'Hoạt động' : m.status === 'leave' ? 'Tạm nghỉ' : 'Lưu trữ',
      m.contributionScore || 0
    ]);
    exportToCsv(`Danh_sach_thanh_vien_${new Date().toISOString().split('T')[0]}`, headers, rows);
    showToast('Đã xuất file CSV thành công.', 'success');
  };

  const coursesList = useMemo(() => {
    return Array.from(new Set(members.map(m => m.course).filter(Boolean))).sort();
  }, [members]);

  return (
    <div className="space-y-4">
      {/* Top search & action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, lớp, ngành..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Xuất CSV</span>
          </button>

          {(isSuperAdmin || isDeptAdmin) && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Thêm thành viên</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Dept filter */}
        <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5">
          <button
            onClick={() => setSelectedDept('all')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${selectedDept === 'all' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Tất cả ({members.filter(m => !m.isDeleted).length})
          </button>
          <button
            onClick={() => setSelectedDept('btv-mc')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${selectedDept === 'btv-mc' ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:text-blue-700'}`}
          >
            BTV MC
          </button>
          <button
            onClick={() => setSelectedDept('truyen-thong')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${selectedDept === 'truyen-thong' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Truyền thông
          </button>
          <button
            onClick={() => setSelectedDept('ky-thuat')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${selectedDept === 'ky-thuat' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Kỹ thuật
          </button>
        </div>

        {/* Status */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-700"
        >
          <option value="active">Đang hoạt động</option>
          <option value="leave">Tạm nghỉ</option>
          <option value="alumni">Lưu trữ</option>
        </select>

        {/* Course */}
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-700"
        >
          <option value="all">Tất cả khóa</option>
          {coursesList.map(c => (
            <option key={c} value={c}>Khóa {c}</option>
          ))}
        </select>
      </div>

      {/* Clean Minimalist Data Table (Req 6) */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px] sticky top-0">
              <tr>
                <th className="px-4 py-2.5">Họ và tên</th>
                <th className="px-4 py-2.5">Tiểu ban</th>
                <th className="px-4 py-2.5">Chức vụ</th>
                <th className="px-4 py-2.5">Lớp & Ngành</th>
                <th className="px-4 py-2.5">Khóa</th>
                <th className="px-4 py-2.5 text-center">Đóng góp</th>
                <th className="px-4 py-2.5 text-right w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((m) => {
                const dept = DEPARTMENTS[m.departmentId];
                const canManage = canManageDepartment(m.departmentId);

                return (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Full Name & Email */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-slate-700 text-xs shrink-0">
                          {m.fullName.charAt(0)}
                        </div>
                        <div>
                          <p 
                            className="font-semibold text-slate-900 hover:text-blue-600 cursor-pointer"
                            onClick={() => setViewingMember(m)}
                          >
                            {m.fullName}
                          </p>
                          <p className="text-[11px] text-slate-400">{m.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-4 py-2.5">
                      <span className="text-slate-700 font-medium">{dept?.shortName || m.departmentId}</span>
                    </td>

                    {/* Position */}
                    <td className="px-4 py-2.5 text-slate-600">
                      {m.position}
                    </td>

                    {/* Class & Major */}
                    <td className="px-4 py-2.5 text-slate-600">
                      <span className="font-medium text-slate-800">{m.className}</span>
                      <span className="text-slate-400 ml-1">({m.major})</span>
                    </td>

                    {/* Course */}
                    <td className="px-4 py-2.5 text-slate-600 font-medium">
                      {m.course}
                    </td>

                    {/* Score */}
                    <td className="px-4 py-2.5 text-center font-semibold text-slate-800">
                      {m.contributionScore || 0}
                    </td>

                    {/* Clean Action Buttons */}
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingMember(m)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title="Xem hồ sơ & lịch học"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canManage && (
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="Sửa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                    Không tìm thấy thành viên nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Details Modal / View */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-5 space-y-4 border border-slate-200 shadow-md text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                  {viewingMember.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{viewingMember.fullName}</h3>
                  <p className="text-[11px] text-slate-500">
                    {DEPARTMENTS[viewingMember.departmentId]?.name} • {viewingMember.position} • {viewingMember.className}
                  </p>
                </div>
              </div>
              <button onClick={() => setViewingMember(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contact info grid */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-md bg-slate-50 text-[11px] text-slate-600">
              <div>Email: <strong>{viewingMember.email}</strong></div>
              <div>Điện thoại: <strong>{viewingMember.phone || 'Chưa cập nhật'}</strong></div>
              <div>Chuyên ngành: <strong>{viewingMember.major}</strong></div>
              <div>Điểm đóng góp: <strong>{viewingMember.contributionScore || 0} điểm</strong></div>
            </div>

            {/* Weekly Study Schedule Matrix (Minimalist) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-800 text-xs">Lịch học tuần (Bấm ô để đổi trạng thái)</span>
                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Bận học
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Sẵn sàng
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-200 inline-block" /> Trống lịch
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-md overflow-hidden">
                <table className="w-full text-center text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <tr>
                      <th className="py-1.5 px-2 text-left">Buổi</th>
                      {DAYS_OF_WEEK.map(d => (
                        <th key={d.key} className="py-1.5 px-2">{d.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(['morning', 'afternoon', 'evening'] as const).map(slot => (
                      <tr key={slot}>
                        <td className="py-1 px-2 font-medium text-slate-600 text-left bg-slate-50/50 text-[11px]">
                          {slot === 'morning' ? 'Sáng' : slot === 'afternoon' ? 'Chiều' : 'Tối'}
                        </td>
                        {DAYS_OF_WEEK.map(d => {
                          const status = viewingMember.studySchedule?.[d.key]?.[slot] || 'free';
                          return (
                            <td key={d.key} className="p-1">
                              <button
                                onClick={() => handleToggleSlot(d.key, slot)}
                                className={`w-full py-1 rounded text-[10px] font-medium transition-colors ${
                                  status === 'busy' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                  status === 'available' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                }`}
                              >
                                {status === 'busy' ? 'Bận' : status === 'available' ? 'Rảnh' : '—'}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingMember(null)}
                className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Drawer (Slide from Right - Req 7) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-2xs flex justify-end">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto p-6 shadow-xl border-l border-slate-200 space-y-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">
                {editingMember ? 'Chỉnh sửa thông tin thành viên' : 'Thêm thành viên mới'}
              </h3>
              <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4">
              {/* Group 1: Thông tin cơ bản */}
              <div className="space-y-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                  1. Thông tin cơ bản
                </span>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 focus:outline-hidden focus:border-blue-600"
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-medium block mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-200 focus:outline-hidden focus:border-blue-600"
                      placeholder="name@club.edu.vn"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-medium block mb-1">Số điện thoại</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-200 focus:outline-hidden focus:border-blue-600"
                      placeholder="0912345678"
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Thông tin học tập */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                  2. Thông tin học tập
                </span>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-700 font-medium block mb-1">Lớp</label>
                    <input
                      type="text"
                      value={formData.className}
                      onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-200"
                      placeholder="BC-K19"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-medium block mb-1">Ngành</label>
                    <input
                      type="text"
                      value={formData.major}
                      onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-200"
                      placeholder="Báo chí"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-medium block mb-1">Khóa</label>
                    <input
                      type="text"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-200"
                      placeholder="K19"
                    />
                  </div>
                </div>
              </div>

              {/* Group 3: Thông tin CLB */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                  3. Thông tin câu lạc bộ
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-medium block mb-1">Tiểu ban *</label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value as DepartmentId })}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-200"
                    >
                      <option value="btv-mc">BTV MC</option>
                      <option value="truyen-thong">Truyền thông</option>
                      <option value="ky-thuat">Kỹ thuật</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-700 font-medium block mb-1">Chức vụ</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-200"
                      placeholder="Thành viên, Trưởng ban"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Kỹ năng (cách nhau dấu phẩy)</label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200"
                    placeholder="MC, Photoshop, Livestream..."
                  />
                </div>
              </div>

              {/* Drawer Action buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-2xs"
                >
                  {editingMember ? 'Lưu thay đổi' : 'Thêm thành viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
