import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { 
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, writeBatch 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Member, NewsItem, ClubEvent, CommunicationPlan, Task, AuditLog, 
  SystemSettings, ScheduleConflict, TaskStatus, DayOfWeek, StudySlotStatus 
} from '../types';
import { 
  SEED_MEMBERS, SEED_EVENTS, SEED_NEWS, SEED_PLANS, SEED_TASKS, INITIAL_SETTINGS 
} from '../data/seedData';
import { useAuth } from './AuthContext';

interface WorkspaceContextType {
  members: Member[];
  newsItems: NewsItem[];
  events: ClubEvent[];
  plans: CommunicationPlan[];
  tasks: Task[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
  loading: boolean;
  
  // Member actions
  addMember: (member: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
  softDeleteMember: (id: string) => Promise<void>;
  restoreMember: (id: string) => Promise<void>;
  
  // News items actions
  addNewsItem: (news: Omit<NewsItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateNewsItem: (id: string, updates: Partial<NewsItem>) => Promise<void>;
  deleteNewsItem: (id: string) => Promise<void>;
  
  // Events actions
  addEvent: (event: Omit<ClubEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateEvent: (id: string, updates: Partial<ClubEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  
  // Plans actions
  addPlan: (plan: Omit<CommunicationPlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updatePlan: (id: string, updates: Partial<CommunicationPlan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  
  // Tasks actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'milestones'>) => Promise<string>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  updateTaskStatus: (id: string, newStatus: TaskStatus, note?: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // Audit log action
  logActivity: (action: string, entityType: AuditLog['entityType'], entityId: string, details: string) => Promise<void>;
  
  // Conflict checker
  checkMemberConflicts: (memberId: string, dateStr: string, timeSlot?: 'morning' | 'afternoon' | 'evening', excludeTaskId?: string) => ScheduleConflict[];
  
  // Settings & Reset
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  seedInitialData: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  members: 'club_members_cache',
  news: 'club_news_cache',
  events: 'club_events_cache',
  plans: 'club_plans_cache',
  tasks: 'club_tasks_cache',
  logs: 'club_logs_cache',
  settings: 'club_settings_cache',
};

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();

  // Local state with localStorage fallback
  const [members, setMembers] = useState<Member[]>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.members);
    return cached ? JSON.parse(cached) : SEED_MEMBERS;
  });

  const [newsItems, setNewsItems] = useState<NewsItem[]>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.news);
    return cached ? JSON.parse(cached) : SEED_NEWS;
  });

  const [events, setEvents] = useState<ClubEvent[]>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.events);
    return cached ? JSON.parse(cached) : SEED_EVENTS;
  });

  const [plans, setPlans] = useState<CommunicationPlan[]>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.plans);
    return cached ? JSON.parse(cached) : SEED_PLANS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.tasks);
    return cached ? JSON.parse(cached) : SEED_TASKS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.logs);
    return cached ? JSON.parse(cached) : [
      {
        id: 'log-01',
        userId: 'mem-admin-01',
        userName: 'Nguyễn Tuấn Phong',
        userRole: 'super_admin',
        action: 'Khởi tạo hệ thống',
        entityType: 'system',
        details: 'Hệ thống CLUB WORKSPACE đã được kích hoạt thành công.',
        timestamp: new Date().toISOString(),
      }
    ];
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.settings);
    return cached ? JSON.parse(cached) : INITIAL_SETTINGS;
  });

  const [loading, setLoading] = useState(false);

  // Sync state to local storage for offline resilience
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.members, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.news, JSON.stringify(newsItems));
  }, [newsItems]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.events, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.plans, JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.tasks, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.logs, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [settings]);

  // Firestore Sync Listeners
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    try {
      const membersRef = collection(db, 'members');
      unsubs.push(
        onSnapshot(membersRef, (snap) => {
          if (!snap.empty) {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Member));
            setMembers(data);
          }
        }, (error) => {
          console.warn('Firestore members listener notice:', error.message);
        })
      );

      const tasksRef = collection(db, 'tasks');
      unsubs.push(
        onSnapshot(tasksRef, (snap) => {
          if (!snap.empty) {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Task));
            setTasks(data);
          }
        }, (error) => {
          console.warn('Firestore tasks listener notice:', error.message);
        })
      );
    } catch (err) {
      console.warn('Firestore initialization notice:', err);
    }

    return () => {
      unsubs.forEach(u => u());
    };
  }, []);

  // Helper for logging activity
  const logActivity = async (action: string, entityType: AuditLog['entityType'], entityId: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      userId: currentUser?.id || 'anonymous',
      userName: currentUser?.fullName || 'Người dùng',
      userRole: currentUser?.role || 'member',
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    };

    setAuditLogs(prev => [newLog, ...prev]);

    try {
      await setDoc(doc(db, 'auditLogs', newLog.id), newLog);
    } catch {
      // Local log preserved
    }
  };

  // Member CRUD
  const addMember = async (data: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `mem-${Date.now()}`;
    const newMember: Member = {
      ...data,
      id,
      completedTasksCount: 0,
      overdueTasksCount: 0,
      contributionScore: 80,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMembers(prev => [newMember, ...prev]);
    await logActivity('Thêm thành viên', 'member', id, `Thêm thành viên ${newMember.fullName} vào ${newMember.departmentId}`);

    try {
      await setDoc(doc(db, 'members', id), newMember);
    } catch (err) {
      console.warn('Saved member to local state:', err);
    }
    return id;
  };

  const updateMember = async (id: string, updates: Partial<Member>) => {
    const updatedMember = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updatedMember } : m));
    await logActivity('Cập nhật thành viên', 'member', id, `Cập nhật thông tin thành viên ID ${id}`);

    try {
      await updateDoc(doc(db, 'members', id), updatedMember);
    } catch (err) {
      console.warn('Updated member in local state:', err);
    }
  };

  const softDeleteMember = async (id: string) => {
    const mem = members.find(m => m.id === id);
    setMembers(prev => prev.map(m => m.id === id ? { ...m, isDeleted: true, status: 'alumni' } : m));
    await logActivity('Xóa mềm thành viên', 'member', id, `Chuyển thành viên ${mem?.fullName || id} sang trạng thái lưu trữ`);

    try {
      await updateDoc(doc(db, 'members', id), { isDeleted: true, status: 'alumni' });
    } catch (err) {
      console.warn('Soft deleted member in local state:', err);
    }
  };

  const restoreMember = async (id: string) => {
    const mem = members.find(m => m.id === id);
    setMembers(prev => prev.map(m => m.id === id ? { ...m, isDeleted: false, status: 'active' } : m));
    await logActivity('Khôi phục thành viên', 'member', id, `Khôi phục thành viên ${mem?.fullName || id}`);

    try {
      await updateDoc(doc(db, 'members', id), { isDeleted: false, status: 'active' });
    } catch (err) {
      console.warn('Restored member in local state:', err);
    }
  };

  // News Items CRUD
  const addNewsItem = async (data: Omit<NewsItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `news-${Date.now()}`;
    const newItem: NewsItem = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNewsItems(prev => [newItem, ...prev]);
    await logActivity('Tạo bản tin', 'news', id, `Tạo bản tin [${newItem.code}] ${newItem.title}`);

    try {
      await setDoc(doc(db, 'newsItems', id), newItem);
    } catch (err) {
      console.warn('Saved news to local state:', err);
    }
    return id;
  };

  const updateNewsItem = async (id: string, updates: Partial<NewsItem>) => {
    const item = { ...updates, updatedAt: new Date().toISOString() };
    setNewsItems(prev => prev.map(n => n.id === id ? { ...n, ...item } : n));
    await logActivity('Cập nhật bản tin', 'news', id, `Cập nhật thông tin bản tin ID ${id}`);

    try {
      await updateDoc(doc(db, 'newsItems', id), item);
    } catch (err) {
      console.warn('Updated news in local state:', err);
    }
  };

  const deleteNewsItem = async (id: string) => {
    setNewsItems(prev => prev.filter(n => n.id !== id));
    await logActivity('Xóa bản tin', 'news', id, `Xóa bản tin ID ${id}`);

    try {
      await deleteDoc(doc(db, 'newsItems', id));
    } catch (err) {
      console.warn('Deleted news in local state:', err);
    }
  };

  // Events CRUD
  const addEvent = async (data: Omit<ClubEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `evt-${Date.now()}`;
    const newEvent: ClubEvent = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEvents(prev => [newEvent, ...prev]);
    await logActivity('Tạo sự kiện', 'event', id, `Tạo sự kiện: ${newEvent.title}`);

    try {
      await setDoc(doc(db, 'events', id), newEvent);
    } catch (err) {
      console.warn('Saved event to local state:', err);
    }
    return id;
  };

  const updateEvent = async (id: string, updates: Partial<ClubEvent>) => {
    const item = { ...updates, updatedAt: new Date().toISOString() };
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...item } : e));
    await logActivity('Cập nhật sự kiện', 'event', id, `Cập nhật sự kiện ID ${id}`);

    try {
      await updateDoc(doc(db, 'events', id), item);
    } catch (err) {
      console.warn('Updated event in local state:', err);
    }
  };

  const deleteEvent = async (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    await logActivity('Xóa sự kiện', 'event', id, `Xóa sự kiện ID ${id}`);

    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (err) {
      console.warn('Deleted event in local state:', err);
    }
  };

  // Plans CRUD
  const addPlan = async (data: Omit<CommunicationPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `plan-${Date.now()}`;
    const newPlan: CommunicationPlan = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPlans(prev => [newPlan, ...prev]);
    await logActivity('Tạo kế hoạch truyền thông', 'plan', id, `Tạo kế hoạch: ${newPlan.title}`);

    try {
      await setDoc(doc(db, 'communicationPlans', id), newPlan);
    } catch (err) {
      console.warn('Saved plan to local state:', err);
    }
    return id;
  };

  const updatePlan = async (id: string, updates: Partial<CommunicationPlan>) => {
    const item = { ...updates, updatedAt: new Date().toISOString() };
    setPlans(prev => prev.map(p => p.id === id ? { ...p, ...item } : p));
    await logActivity('Cập nhật kế hoạch truyền thông', 'plan', id, `Cập nhật kế hoạch ID ${id}`);

    try {
      await updateDoc(doc(db, 'communicationPlans', id), item);
    } catch (err) {
      console.warn('Updated plan in local state:', err);
    }
  };

  const deletePlan = async (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
    await logActivity('Xóa kế hoạch truyền thông', 'plan', id, `Xóa kế hoạch ID ${id}`);

    try {
      await deleteDoc(doc(db, 'communicationPlans', id));
    } catch (err) {
      console.warn('Deleted plan in local state:', err);
    }
  };

  // Tasks CRUD with Automated Milestones Tracking
  const addTask = async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'milestones'>) => {
    const id = `task-${Date.now()}`;
    const now = new Date().toISOString();
    const newTask: Task = {
      ...data,
      id,
      milestones: {
        receivedAt: now,
        assignedAt: data.assigneeIds?.length ? now : undefined,
      },
      createdAt: now,
      updatedAt: now,
    };

    setTasks(prev => [newTask, ...prev]);
    await logActivity('Tạo nhiệm vụ', 'task', id, `Tạo nhiệm vụ: ${newTask.title} (${newTask.departmentId})`);

    try {
      await setDoc(doc(db, 'tasks', id), newTask);
    } catch (err) {
      console.warn('Saved task to local state:', err);
    }
    return id;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const now = new Date().toISOString();
    const item = { ...updates, updatedAt: now };

    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...item } : t));
    await logActivity('Cập nhật nhiệm vụ', 'task', id, `Cập nhật thông tin nhiệm vụ ID ${id}`);

    try {
      await updateDoc(doc(db, 'tasks', id), item);
    } catch (err) {
      console.warn('Updated task in local state:', err);
    }
  };

  const updateTaskStatus = async (id: string, newStatus: TaskStatus, note?: string) => {
    const now = new Date().toISOString();
    const existingTask = tasks.find(t => t.id === id);
    if (!existingTask) return;

    const milestones = { ...existingTask.milestones };

    // Automatic milestones timestamp recorded based on state changes (Req 10 & 21)
    if (newStatus === 'in_progress' && !milestones.startedAt) {
      milestones.startedAt = now;
    } else if (newStatus === 'draft_submitted' && !milestones.draftSubmittedAt) {
      milestones.draftSubmittedAt = now;
    } else if (newStatus === 'approved' && !milestones.approvedAt) {
      milestones.approvedAt = now;
    } else if (newStatus === 'completed') {
      milestones.completedAt = now;
      if (!milestones.finalSubmittedAt) milestones.finalSubmittedAt = now;
    }

    const updates: Partial<Task> = {
      status: newStatus,
      milestones,
      notes: note ? `${existingTask.notes ? existingTask.notes + '\n' : ''}[${new Date().toLocaleDateString('vi-VN')}]: ${note}` : existingTask.notes,
      updatedAt: now,
    };

    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    await logActivity(
      'Đổi trạng thái nhiệm vụ',
      'task',
      id,
      `Chuyển nhiệm vụ "${existingTask.title}" sang trạng thái "${newStatus}"`
    );

    try {
      await updateDoc(doc(db, 'tasks', id), updates);
    } catch (err) {
      console.warn('Updated task status in local state:', err);
    }
  };

  const deleteTask = async (id: string) => {
    const existing = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    await logActivity('Xóa nhiệm vụ', 'task', id, `Xóa nhiệm vụ "${existing?.title || id}"`);

    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (err) {
      console.warn('Deleted task in local state:', err);
    }
  };

  // Schedule Conflict Engine (Req 8 & 21)
  const checkMemberConflicts = (
    memberId: string, 
    dateStr: string, 
    timeSlot?: 'morning' | 'afternoon' | 'evening',
    excludeTaskId?: string
  ): ScheduleConflict[] => {
    const conflicts: ScheduleConflict[] = [];
    const member = members.find(m => m.id === memberId);
    if (!member) return conflicts;

    // 1. Check study schedule conflict
    if (dateStr) {
      try {
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
          const daysMap: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const dayName = daysMap[dateObj.getDay()];
          const daySchedule = member.studySchedule?.[dayName];

          if (daySchedule) {
            if (timeSlot) {
              const slotStatus = daySchedule[timeSlot];
              if (slotStatus === 'busy') {
                conflicts.push({
                  type: 'class_conflict',
                  memberId,
                  memberName: member.fullName,
                  message: `${member.fullName} có lịch học vào buổi ${timeSlot === 'morning' ? 'Sáng' : timeSlot === 'afternoon' ? 'Chiều' : 'Tối'} ngày ${dateStr}${daySchedule.note ? ` (${daySchedule.note})` : ''}`,
                  severity: 'error'
                });
              }
            } else {
              // Check morning & afternoon
              if (daySchedule.morning === 'busy' || daySchedule.afternoon === 'busy') {
                conflicts.push({
                  type: 'class_conflict',
                  memberId,
                  memberName: member.fullName,
                  message: `${member.fullName} có lịch học trong ngày ${dateStr} (${daySchedule.morning === 'busy' ? 'Sáng' : ''} ${daySchedule.afternoon === 'busy' ? 'Chiều' : ''})`,
                  severity: 'warning'
                });
              }
            }
          }
        }
      } catch {
        // Date parse fallback
      }
    }

    // 2. Check task overlap on the same date
    const sameDayTasks = tasks.filter(t => 
      t.id !== excludeTaskId &&
      t.assigneeIds.includes(memberId) &&
      t.status !== 'completed' &&
      t.status !== 'cancelled' &&
      (t.dueDate === dateStr || t.startDate === dateStr)
    );

    if (sameDayTasks.length > 0) {
      conflicts.push({
        type: 'task_overlap',
        memberId,
        memberName: member.fullName,
        message: `${member.fullName} đã được phân công ${sameDayTasks.length} nhiệm vụ khác cùng hạn ngày: "${sameDayTasks[0].title}"`,
        severity: 'warning'
      });
    }

    // 3. Check overdue load
    const overdueTasks = tasks.filter(t => 
      t.assigneeIds.includes(memberId) && 
      (t.status === 'overdue' || (t.dueDate < new Date().toISOString().split('T')[0] && t.status !== 'completed' && t.status !== 'cancelled'))
    );

    if (overdueTasks.length > 0) {
      conflicts.push({
        type: 'overdue_load',
        memberId,
        memberName: member.fullName,
        message: `${member.fullName} hiện đang có ${overdueTasks.length} nhiệm vụ quá hạn chưa hoàn thành. Cân nhắc trước khi giao thêm việc!`,
        severity: 'warning'
      });
    }

    return conflicts;
  };

  // Settings update
  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await logActivity('Cập nhật cấu hình hệ thống', 'system', 'global', 'Thay đổi cấu hình hệ thống và trọng số đánh giá');

    try {
      await setDoc(doc(db, 'systemSettings', 'global'), updated);
    } catch (err) {
      console.warn('Saved settings to local state:', err);
    }
  };

  // Seed / Reset functions
  const seedInitialData = async () => {
    setLoading(true);
    try {
      setMembers(SEED_MEMBERS);
      setNewsItems(SEED_NEWS);
      setEvents(SEED_EVENTS);
      setPlans(SEED_PLANS);
      setTasks(SEED_TASKS);
      setSettings(INITIAL_SETTINGS);

      // Attempt batch write to Firestore
      try {
        const batch = writeBatch(db);
        SEED_MEMBERS.forEach(m => batch.set(doc(db, 'members', m.id), m));
        SEED_NEWS.forEach(n => batch.set(doc(db, 'newsItems', n.id), n));
        SEED_EVENTS.forEach(e => batch.set(doc(db, 'events', e.id), e));
        SEED_PLANS.forEach(p => batch.set(doc(db, 'communicationPlans', p.id), p));
        SEED_TASKS.forEach(t => batch.set(doc(db, 'tasks', t.id), t));
        batch.set(doc(db, 'systemSettings', 'global'), INITIAL_SETTINGS);
        await batch.commit();
      } catch (err) {
        console.warn('Seeded data to local memory (Firebase offline or rules enforced):', err);
      }

      await logActivity('Nạp dữ liệu mẫu', 'system', 'seed', 'Đã nạp toàn bộ dữ liệu mẫu ban đầu cho 3 tiểu ban');
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = async () => {
    localStorage.clear();
    setMembers(SEED_MEMBERS);
    setNewsItems(SEED_NEWS);
    setEvents(SEED_EVENTS);
    setPlans(SEED_PLANS);
    setTasks(SEED_TASKS);
    setSettings(INITIAL_SETTINGS);
    await logActivity('Làm mới dữ liệu', 'system', 'reset', 'Khôi phục toàn bộ dữ liệu về trạng thái tiêu chuẩn ban đầu');
  };

  return (
    <WorkspaceContext.Provider
      value={{
        members,
        newsItems,
        events,
        plans,
        tasks,
        auditLogs,
        settings,
        loading,
        addMember,
        updateMember,
        softDeleteMember,
        restoreMember,
        addNewsItem,
        updateNewsItem,
        deleteNewsItem,
        addEvent,
        updateEvent,
        deleteEvent,
        addPlan,
        updatePlan,
        deletePlan,
        addTask,
        updateTask,
        updateTaskStatus,
        deleteTask,
        logActivity,
        checkMemberConflicts,
        updateSettings,
        seedInitialData,
        resetToDefaults,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
