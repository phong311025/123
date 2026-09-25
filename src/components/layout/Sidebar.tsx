import { 
  LayoutDashboard, Calendar, FileText, CalendarCheck, Megaphone, 
  CheckSquare, Users, Award, BarChart3, History, Settings,
  PanelLeftClose, PanelLeftOpen, Radio, Camera, Cpu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  isOpen, 
  setIsOpen,
  isCollapsed,
  setIsCollapsed
}: SidebarProps) {
  const { isSuperAdmin, isDeptAdmin, isMember, currentUser } = useAuth();
  const { tasks, newsItems } = useWorkspace();

  const overdueCount = tasks.filter(t => t.status === 'overdue').length;
  const pendingNewsCount = newsItems.filter(n => n.status === 'assigning' || n.status === 'draft').length;

  // Filter menu items by permission (Req 19)
  const allNavItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, badge: null, roles: ['super_admin', 'dept_admin', 'member', 'viewer'] },
    { id: 'news', label: 'Bản tin & Phân công', icon: FileText, badge: pendingNewsCount || null, roles: ['super_admin', 'dept_admin', 'member', 'viewer'] },
    { id: 'tasks', label: 'Nhiệm vụ & Tiến độ', icon: CheckSquare, badge: overdueCount || null, badgeRose: true, roles: ['super_admin', 'dept_admin', 'member'] },
    { id: 'calendar', label: 'Lịch làm việc', icon: Calendar, badge: null, roles: ['super_admin', 'dept_admin', 'member', 'viewer'] },
    { id: 'events', label: 'Sự kiện CLB', icon: CalendarCheck, badge: null, roles: ['super_admin', 'dept_admin', 'member', 'viewer'] },
    { id: 'plans', label: 'Kế hoạch truyền thông', icon: Megaphone, badge: null, roles: ['super_admin', 'dept_admin', 'member', 'viewer'] },
    { id: 'members', label: 'Thành viên & Lịch học', icon: Users, badge: null, roles: ['super_admin', 'dept_admin', 'member', 'viewer'] },
    { id: 'evaluation', label: 'Đánh giá đóng góp', icon: Award, badge: null, roles: ['super_admin', 'dept_admin'] },
    { id: 'reports', label: 'Báo cáo & Thống kê', icon: BarChart3, badge: null, roles: ['super_admin', 'dept_admin'] },
    { id: 'audit', label: 'Nhật ký hoạt động', icon: History, badge: null, roles: ['super_admin'] },
    { id: 'settings', label: 'Quản trị hệ thống', icon: Settings, badge: null, roles: ['super_admin'] },
  ];

  const userRole = currentUser?.role || 'member';
  const visibleNavItems = allNavItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col transition-all duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-16 w-60' : 'w-60'}
      `}>
        {/* Brand header */}
        <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
                CW
              </div>
              <div className="truncate">
                <span className="font-semibold text-sm text-slate-800 tracking-tight block truncate">
                  CLUB WORKSPACE
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
              CW
            </div>
          )}

          {/* Collapse button on desktop */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Subcommittees Indicator (Clean & Minimal) */}
        {!isCollapsed && (
          <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>3 Tiểu ban:</span>
            <div className="flex items-center gap-1 font-semibold text-slate-600">
              <span>MC</span>
              <span>•</span>
              <span>Media</span>
              <span>•</span>
              <span>Kỹ thuật</span>
            </div>
          </div>
        )}

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsOpen(false);
                }}
                title={isCollapsed ? item.label : undefined}
                className={`
                  w-full flex items-center ${isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-3 py-2'} rounded-md text-xs font-medium transition-colors relative
                  ${isActive 
                    ? 'bg-blue-50/80 text-blue-700 font-semibold' 
                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'}
                `}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 rounded-r-full" />
                )}

                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                    item.badgeRose ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
              {currentUser?.fullName?.charAt(0) || 'U'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 truncate">{currentUser?.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate">
                  {currentUser?.role === 'super_admin' ? 'Super Admin' :
                   currentUser?.role === 'dept_admin' ? 'Admin Tiểu ban' :
                   currentUser?.role === 'member' ? 'Thành viên' : 'Người xem'}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
