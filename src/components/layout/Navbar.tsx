import { useState } from 'react';
import { 
  Menu, ShieldCheck, RefreshCw, LogIn, LogOut, 
  Bell, ChevronDown, Check, AlertCircle, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';
import { UserRole, DepartmentId } from '../../types';

interface NavbarProps {
  currentTab: string;
  onOpenMobileMenu: () => void;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Tổng quan', subtitle: 'Theo dõi tổng thể các hoạt động 3 tiểu ban' },
  news: { title: 'Bản tin & Phân công', subtitle: 'Đầu việc tuần và điều phối nhân sự' },
  tasks: { title: 'Nhiệm vụ & Tiến độ', subtitle: 'Tiến độ thực hiện và bàn giao sản phẩm' },
  calendar: { title: 'Lịch làm việc', subtitle: 'Lịch sự kiện, nhiệm vụ và lịch học' },
  events: { title: 'Sự kiện CLB', subtitle: 'Danh sách sự kiện, thời gian và địa điểm' },
  plans: { title: 'Kế hoạch truyền thông', subtitle: 'Kế hoạch Trước - Trong - Sau sự kiện' },
  members: { title: 'Thành viên & Lịch học', subtitle: 'Hồ sơ nhân sự và lịch học tuần' },
  evaluation: { title: 'Đánh giá đóng góp', subtitle: 'Đánh giá đóng góp theo 6 tiêu chí' },
  reports: { title: 'Báo cáo & Thống kê', subtitle: 'Tổng hợp số liệu và xuất dữ liệu' },
  audit: { title: 'Nhật ký hoạt động', subtitle: 'Lịch sử thao tác hệ thống' },
  settings: { title: 'Quản trị hệ thống', subtitle: 'Cấu hình hệ thống và phân quyền' },
};

export function Navbar({ currentTab, onOpenMobileMenu }: NavbarProps) {
  const { currentUser, switchDemoRole, loginWithGoogle, logout, firebaseUser, isSuperAdmin } = useAuth();
  const { seedInitialData, tasks, newsItems } = useWorkspace();
  const { showToast } = useToast();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const overdueTasks = tasks.filter(t => t.status === 'overdue');
  const urgentNews = newsItems.filter(n => n.priority === 'urgent' && n.status !== 'completed');

  const pageInfo = TAB_TITLES[currentTab] || { title: 'CLUB WORKSPACE', subtitle: '' };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedInitialData();
      showToast('Đã nạp lại dữ liệu mẫu thành công.', 'success');
    } catch {
      showToast('Không thể nạp dữ liệu mẫu.', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const roleOptions: { label: string; role: UserRole; deptId?: DepartmentId; memberId?: string; badge: string }[] = [
    { label: 'Nguyễn Tuấn Phong', role: 'super_admin', badge: 'Super Admin' },
    { label: 'Lê Hoàng Anh', role: 'dept_admin', deptId: 'btv-mc', badge: 'Admin BTV MC' },
    { label: 'Phạm Minh Đức', role: 'dept_admin', deptId: 'truyen-thong', badge: 'Admin Truyền thông' },
    { label: 'Bùi Gia Huy', role: 'dept_admin', deptId: 'ky-thuat', badge: 'Admin Kỹ thuật' },
    { label: 'Trần Thảo Linh', role: 'member', deptId: 'btv-mc', memberId: 'mem-mc-02', badge: 'Thành viên MC' },
    { label: 'Ngô Ngọc Mai', role: 'member', deptId: 'truyen-thong', memberId: 'mem-media-02', badge: 'Thành viên Media' },
    { label: 'Hoàng Quốc Bảo', role: 'member', deptId: 'ky-thuat', memberId: 'mem-tech-02', badge: 'Thành viên Tech' },
    { label: 'Vương Thu Trang', role: 'viewer', memberId: 'mem-view-01', badge: 'Người xem' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-6 h-14 flex items-center justify-between">
      {/* Left: Mobile trigger & Page Info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Mở menu"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-sm font-semibold text-slate-900 leading-tight">
            {pageInfo.title}
          </h1>
          <p className="hidden sm:block text-[11px] text-slate-500 leading-tight">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right Actions: Role Switcher, Seed button, Notification, User */}
      <div className="flex items-center gap-2">
        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
            title="Đổi vai trò để kiểm thử phân quyền"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline text-slate-500">Vai trò:</span>
            <span className="font-semibold text-slate-800 max-w-[100px] truncate">
              {currentUser?.fullName?.split(' ')[0]}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setRoleMenuOpen(false)} />
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-lg shadow-md border border-slate-200 py-1.5 z-50 text-xs">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Chuyển đổi vai trò người dùng (RBAC)
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {roleOptions.map((opt, idx) => {
                    const isCurrent = currentUser?.role === opt.role && (!opt.deptId || currentUser?.departmentId === opt.deptId);
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          switchDemoRole(opt.role, opt.deptId, opt.memberId);
                          setRoleMenuOpen(false);
                          showToast(`Đã chuyển sang vai trò: ${opt.label}`, 'info');
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          isCurrent ? 'bg-blue-50/70 text-blue-700 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {opt.badge}
                          </span>
                          {isCurrent && <Check className="w-3 h-3 text-blue-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Nạp mẫu data button */}
        {isSuperAdmin && (
          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors"
            title="Nạp lại dữ liệu mẫu cho cả 3 tiểu ban"
          >
            <RefreshCw className={`w-3 h-3 text-slate-400 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>Nạp mẫu</span>
          </button>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setNotifyOpen(!notifyOpen)}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors relative"
            title="Thông báo công việc"
            aria-label="Thông báo"
          >
            <Bell className="w-4 h-4" />
            {(overdueTasks.length > 0 || urgentNews.length > 0) && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

          {notifyOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifyOpen(false)} />
              <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-lg shadow-md border border-slate-200 py-2 z-50 text-xs">
                <div className="px-3 pb-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Thông báo</span>
                  <span className="text-[10px] text-rose-600 font-semibold">
                    {overdueTasks.length + urgentNews.length} việc cần chú ý
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto px-2 py-1 space-y-1">
                  {overdueTasks.map(t => (
                    <div key={t.id} className="p-2 rounded bg-rose-50/70 border border-rose-100 text-rose-900">
                      <p className="font-semibold text-[11px] truncate">{t.title}</p>
                      <p className="text-[10px] text-rose-600">Quá hạn: {t.dueDate}</p>
                    </div>
                  ))}
                  {urgentNews.map(n => (
                    <div key={n.id} className="p-2 rounded bg-amber-50/70 border border-amber-100 text-amber-900">
                      <p className="font-semibold text-[11px] truncate">{n.title}</p>
                      <p className="text-[10px] text-amber-600">Khẩn cấp • Ngày {n.eventDate}</p>
                    </div>
                  ))}
                  {overdueTasks.length === 0 && urgentNews.length === 0 && (
                    <div className="p-4 text-center text-slate-400">
                      Không có công việc nào bị quá hạn.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Google Authentication */}
        {firebaseUser ? (
          <button
            onClick={() => {
              logout();
              showToast('Đã đăng xuất tài khoản Google.', 'info');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
            title="Đăng xuất tài khoản Google"
          >
            <LogOut className="w-3 h-3 text-slate-400" />
            <span className="hidden sm:inline">Thoát</span>
          </button>
        ) : (
          <button
            onClick={() => {
              loginWithGoogle();
              showToast('Đang kết nối đăng nhập Google...', 'info');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
            title="Đăng nhập tài khoản Google"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đăng nhập</span>
          </button>
        )}
      </div>
    </header>
  );
}
