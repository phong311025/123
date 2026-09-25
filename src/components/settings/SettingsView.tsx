import { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DEPARTMENTS } from '../../data/departments';
import { UserRole } from '../../types';

export function SettingsView() {
  const { settings, updateSettings, members, updateMember, seedInitialData, resetToDefaults } = useWorkspace();
  const { isSuperAdmin } = useAuth();
  const { showToast } = useToast();

  const [formSettings, setFormSettings] = useState(settings);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formSettings);
    showToast('Đã lưu cấu hình hệ thống thành công.', 'success');
  };

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    await updateMember(memberId, { systemRole: newRole });
    showToast('Đã cập nhật vai trò tài khoản.', 'success');
  };

  const handleToggleStatus = async (memberId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'leave' : 'active';
    await updateMember(memberId, { status: nextStatus });
    showToast(nextStatus === 'active' ? 'Đã mở khóa tài khoản.' : 'Đã tạm khóa tài khoản.', 'info');
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Quản trị hệ thống & Cấu hình</h2>
        <p className="text-xs text-slate-500">Cấu hình tham số vận hành, phân quyền tài khoản thành viên</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        {/* General Settings */}
        <form onSubmit={handleSave} className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <h3 className="font-semibold text-slate-900 text-sm pb-2 border-b border-slate-100">
            Thông tin hệ thống & Cảnh báo
          </h3>

          <div>
            <label className="text-slate-700 font-medium block mb-1">Tên câu lạc bộ *</label>
            <input
              type="text"
              required
              value={formSettings.clubName}
              onChange={(e) => setFormSettings({ ...formSettings, clubName: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-hidden focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-medium block mb-1">Múi giờ</label>
              <input
                type="text"
                value={formSettings.timezone}
                onChange={(e) => setFormSettings({ ...formSettings, timezone: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="text-slate-700 font-medium block mb-1">Ngưỡng báo trước hạn (ngày)</label>
              <input
                type="number"
                value={formSettings.warningDaysBeforeDue}
                onChange={(e) => setFormSettings({ ...formSettings, warningDaysBeforeDue: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formSettings.allowConflictOverride}
                onChange={(e) => setFormSettings({ ...formSettings, allowConflictOverride: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span className="text-slate-700 font-medium">
                Cho phép Admin bỏ qua cảnh báo trùng lịch học khi cần thiết
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formSettings.isEvaluationEnabled}
                onChange={(e) => setFormSettings({ ...formSettings, isEvaluationEnabled: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span className="text-slate-700 font-medium">
                Bật module đánh giá đóng góp thành viên
              </span>
            </label>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-2xs"
            >
              Lưu cấu hình
            </button>
          </div>
        </form>

        {/* Account RBAC Management */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">Phân quyền tài khoản</h3>
              <span className="text-slate-400 text-[11px]">{members.length} tài khoản</span>
            </div>

            <div className="space-y-2 mt-3 max-h-72 overflow-y-auto pr-1 divide-y divide-slate-100">
              {members.filter(m => !m.isDeleted).map(m => (
                <div key={m.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{m.fullName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{DEPARTMENTS[m.departmentId]?.shortName} • {m.email}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={m.systemRole}
                      onChange={(e) => handleRoleChange(m.id, e.target.value as UserRole)}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700"
                    >
                      <option value="member">Thành viên</option>
                      <option value="dept_admin">Admin ban</option>
                      <option value="super_admin">Super Admin</option>
                      <option value="viewer">Chỉ xem</option>
                    </select>

                    <button
                      onClick={() => handleToggleStatus(m.id, m.status)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                        m.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {m.status === 'active' ? 'Mở' : 'Khóa'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Database management */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Khôi phục dữ liệu mẫu ban đầu:</span>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await seedInitialData();
                  showToast('Đã nạp lại dữ liệu mẫu.', 'success');
                }}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
              >
                Nạp lại mẫu
              </button>
              <button
                onClick={async () => {
                  await resetToDefaults();
                  showToast('Đã đặt lại dữ liệu mặc định.', 'info');
                }}
                className="px-2.5 py-1 rounded border border-rose-200 text-rose-700 hover:bg-rose-50 font-medium"
              >
                Đặt lại
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
