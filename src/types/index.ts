export type DepartmentId = 'btv-mc' | 'truyen-thong' | 'ky-thuat';

export type UserRole = 'super_admin' | 'dept_admin' | 'member' | 'viewer';

export type MemberStatus = 'active' | 'leave' | 'alumni';

export type TaskStatus = 
  | 'todo' 
  | 'assigned' 
  | 'in_progress' 
  | 'draft_submitted' 
  | 'revising' 
  | 'under_review' 
  | 'approved' 
  | 'completed' 
  | 'on_hold' 
  | 'cancelled' 
  | 'overdue';

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export type TaskPhase = 'before' | 'during' | 'after';

export type NewsStatus = 
  | 'draft' 
  | 'assigning' 
  | 'assigned' 
  | 'in_progress' 
  | 'review' 
  | 'completed' 
  | 'cancelled';

export interface DepartmentInfo {
  id: DepartmentId;
  name: string;
  code: string;
  shortName: string;
  description: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  leadMemberId?: string;
  rolesList: string[];
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type StudySlotStatus = 'free' | 'busy' | 'available' | 'unknown';

export interface DayStudySchedule {
  morning: StudySlotStatus;
  afternoon: StudySlotStatus;
  evening: StudySlotStatus;
  note?: string;
}

export type WeeklyStudySchedule = Record<DayOfWeek, DayStudySchedule>;

export interface Member {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  className: string;
  major: string;
  course: string; // K18, K19, K20...
  departmentId: DepartmentId;
  position: string; // Trưởng ban, Phó ban, Thành viên, Cộng tác viên
  systemRole: UserRole;
  status: MemberStatus;
  studySchedule: WeeklyStudySchedule;
  skills: string[];
  notes?: string;
  joinedAt: string;
  facebookUrl?: string;
  avatarUrl?: string;
  completedTasksCount: number;
  overdueTasksCount: number;
  contributionScore: number;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  departmentId?: DepartmentId;
  memberId?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsItem {
  id: string;
  code: string;
  title: string;
  summary: string;
  receivedAt: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  organizer: string;
  sourceContact: string;
  priority: TaskPriority;
  status: NewsStatus;
  leadMemberId?: string;
  assignments: {
    btvMc: { memberId: string; role: string }[];
    truyenThong: { memberId: string; role: string }[];
    kyThuat: { memberId: string; role: string }[];
  };
  links: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClubEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  allDay?: boolean;
  departmentId?: DepartmentId;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  leadMemberId?: string;
  relatedNewsId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationPlan {
  id: string;
  title: string;
  eventId?: string;
  newsId?: string;
  target: string;
  audience: string;
  mainMessage: string;
  channels: string[];
  leadMemberId: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed' | 'archived';
  budget?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskTimeMilestones {
  receivedAt?: string;
  assignedAt?: string;
  startedAt?: string;
  draftSubmittedAt?: string;
  approvedAt?: string;
  finalSubmittedAt?: string;
  completedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  planId?: string;
  eventId?: string;
  newsId?: string;
  phase: TaskPhase; // before, during, after
  departmentId: DepartmentId;
  assigneeIds: string[];
  reviewerId?: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate?: string;
  dueDate: string;
  milestones: TaskTimeMilestones;
  estimatedHours?: number;
  actualHours?: number;
  qualityScore?: number; // 0 - 100
  outputLinks: { title: string; url: string }[];
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  attachments?: { name: string; url: string; size: number }[];
  createdAt: string;
}

export interface EvaluationCriteriaWeights {
  onTime: number;      // default 30
  completion: number;  // default 20
  quality: number;     // default 20
  attendance: number;  // default 15
  coordination: number;// default 10
  initiative: number;  // default 5
}

export interface MemberEvaluation {
  id: string;
  memberId: string;
  period: string; // "Tháng 3/2025" or "Tuần 12"
  onTimeScore: number;
  completionScore: number;
  qualityScore: number;
  attendanceScore: number;
  coordinationScore: number;
  initiativeScore: number;
  totalScore: number;
  manualAdjustment?: number;
  adjustmentReason?: string;
  evaluatedBy: string;
  evaluatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: 'member' | 'task' | 'news' | 'event' | 'plan' | 'auth' | 'system';
  entityId?: string;
  details: string;
  timestamp: string;
}

export interface SystemSettings {
  clubName: string;
  logoUrl?: string;
  brandColor: string;
  timezone: string;
  warningDaysBeforeDue: number;
  allowConflictOverride: boolean;
  isEvaluationEnabled: boolean;
  evaluationWeights: EvaluationCriteriaWeights;
}

export interface ScheduleConflict {
  type: 'class_conflict' | 'task_overlap' | 'overdue_load';
  memberId: string;
  memberName: string;
  message: string;
  severity: 'warning' | 'error';
}
