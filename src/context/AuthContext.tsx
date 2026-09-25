import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { UserRole, DepartmentId, UserAccount, Member } from '../types';
import { SEED_MEMBERS } from '../data/seedData';

interface AuthContextType {
  currentUser: UserAccount | null;
  firebaseUser: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole, departmentId?: DepartmentId, memberId?: string) => void;
  canManageDepartment: (deptId?: DepartmentId) => boolean;
  canEditTasks: (deptId?: DepartmentId) => boolean;
  isSuperAdmin: boolean;
  isDeptAdmin: boolean;
  isMember: boolean;
  isViewer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<string, UserAccount> = {
  super_admin: {
    id: 'mem-admin-01',
    email: 'tuanphong.workcontact@gmail.com',
    fullName: 'Nguyễn Tuấn Phong (Super Admin)',
    role: 'super_admin',
    departmentId: 'btv-mc',
    memberId: 'mem-admin-01',
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2025-03-01T00:00:00Z',
  },
  dept_admin_mc: {
    id: 'mem-mc-01',
    email: 'hoanganh.mc@club.edu.vn',
    fullName: 'Lê Hoàng Anh (Admin BTV MC)',
    role: 'dept_admin',
    departmentId: 'btv-mc',
    memberId: 'mem-mc-01',
    isActive: true,
    createdAt: '2023-09-10T00:00:00Z',
    updatedAt: '2025-03-10T00:00:00Z',
  },
  dept_admin_media: {
    id: 'mem-media-01',
    email: 'minhduc.media@club.edu.vn',
    fullName: 'Phạm Minh Đức (Admin Truyền thông)',
    role: 'dept_admin',
    departmentId: 'truyen-thong',
    memberId: 'mem-media-01',
    isActive: true,
    createdAt: '2023-09-10T00:00:00Z',
    updatedAt: '2025-03-12T00:00:00Z',
  },
  dept_admin_tech: {
    id: 'mem-tech-01',
    email: 'giahuy.tech@club.edu.vn',
    fullName: 'Bùi Gia Huy (Admin Kỹ thuật)',
    role: 'dept_admin',
    departmentId: 'ky-thuat',
    memberId: 'mem-tech-01',
    isActive: true,
    createdAt: '2023-09-10T00:00:00Z',
    updatedAt: '2025-03-12T00:00:00Z',
  },
  member_mc: {
    id: 'mem-mc-02',
    email: 'thaolinh.mc@club.edu.vn',
    fullName: 'Trần Thảo Linh (Thành viên MC)',
    role: 'member',
    departmentId: 'btv-mc',
    memberId: 'mem-mc-02',
    isActive: true,
    createdAt: '2024-09-15T00:00:00Z',
    updatedAt: '2025-03-12T00:00:00Z',
  },
  member_media: {
    id: 'mem-media-02',
    email: 'ngocmai.design@club.edu.vn',
    fullName: 'Ngô Ngọc Mai (Thành viên Media Designer)',
    role: 'member',
    departmentId: 'truyen-thong',
    memberId: 'mem-media-02',
    isActive: true,
    createdAt: '2024-09-15T00:00:00Z',
    updatedAt: '2025-03-12T00:00:00Z',
  },
  member_tech: {
    id: 'mem-tech-02',
    email: 'quocbao.tech@club.edu.vn',
    fullName: 'Hoàng Quốc Bảo (Thành viên Kỹ thuật LED/Live)',
    role: 'member',
    departmentId: 'ky-thuat',
    memberId: 'mem-tech-02',
    isActive: true,
    createdAt: '2024-09-15T00:00:00Z',
    updatedAt: '2025-03-12T00:00:00Z',
  },
  viewer: {
    id: 'mem-view-01',
    email: 'thutrang.observer@club.edu.vn',
    fullName: 'Vương Thu Trang (Người xem / Quan sát)',
    role: 'viewer',
    departmentId: 'truyen-thong',
    memberId: 'mem-view-01',
    isActive: true,
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-03-10T00:00:00Z',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('club_workspace_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEMO_USERS.super_admin;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        // If Google user matches bootstrapped admin or known member
        const email = user.email || '';
        const isDefaultSuper = email === 'tuanphong.workcontact@gmail.com';
        const matchedMember = SEED_MEMBERS.find(m => m.email.toLowerCase() === email.toLowerCase());

        const account: UserAccount = {
          id: user.uid,
          email,
          fullName: user.displayName || matchedMember?.fullName || 'Người dùng Google',
          role: isDefaultSuper ? 'super_admin' : (matchedMember?.systemRole || 'member'),
          departmentId: matchedMember?.departmentId || 'btv-mc',
          memberId: matchedMember?.id,
          avatarUrl: user.photoURL || undefined,
          isActive: true,
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setCurrentUser(account);
        localStorage.setItem('club_workspace_active_user', JSON.stringify(account));
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google Sign In error:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fbSignOut(auth);
      // Revert to demo super_admin or null
      setCurrentUser(DEMO_USERS.super_admin);
      localStorage.setItem('club_workspace_active_user', JSON.stringify(DEMO_USERS.super_admin));
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const switchDemoRole = (role: UserRole, departmentId?: DepartmentId, memberId?: string) => {
    let selectedUser = DEMO_USERS.super_admin;

    if (role === 'super_admin') {
      selectedUser = DEMO_USERS.super_admin;
    } else if (role === 'dept_admin') {
      if (departmentId === 'truyen-thong') selectedUser = DEMO_USERS.dept_admin_media;
      else if (departmentId === 'ky-thuat') selectedUser = DEMO_USERS.dept_admin_tech;
      else selectedUser = DEMO_USERS.dept_admin_mc;
    } else if (role === 'member') {
      if (departmentId === 'truyen-thong') selectedUser = DEMO_USERS.member_media;
      else if (departmentId === 'ky-thuat') selectedUser = DEMO_USERS.member_tech;
      else selectedUser = DEMO_USERS.member_mc;
    } else if (role === 'viewer') {
      selectedUser = DEMO_USERS.viewer;
    }

    if (memberId) {
      const mem = SEED_MEMBERS.find(m => m.id === memberId);
      if (mem) {
        selectedUser = {
          ...selectedUser,
          id: mem.id,
          fullName: `${mem.fullName} (${role})`,
          email: mem.email,
          role,
          departmentId: mem.departmentId,
          memberId: mem.id,
        };
      }
    }

    setCurrentUser(selectedUser);
    localStorage.setItem('club_workspace_active_user', JSON.stringify(selectedUser));
  };

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isDeptAdmin = currentUser?.role === 'dept_admin';
  const isMember = currentUser?.role === 'member';
  const isViewer = currentUser?.role === 'viewer';

  const canManageDepartment = (deptId?: DepartmentId) => {
    if (isSuperAdmin) return true;
    if (isDeptAdmin && (!deptId || currentUser?.departmentId === deptId)) return true;
    return false;
  };

  const canEditTasks = (deptId?: DepartmentId) => {
    if (isSuperAdmin) return true;
    if (isDeptAdmin && (!deptId || currentUser?.departmentId === deptId)) return true;
    if (isMember) return true; // members can update tasks assigned to them
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        loading,
        loginWithGoogle,
        logout,
        switchDemoRole,
        canManageDepartment,
        canEditTasks,
        isSuperAdmin,
        isDeptAdmin,
        isMember,
        isViewer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
