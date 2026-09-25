import { DepartmentInfo, DepartmentId } from '../types';

export const DEPARTMENTS: Record<DepartmentId, DepartmentInfo> = {
  'btv-mc': {
    id: 'btv-mc',
    name: 'BTV MC',
    code: 'BTV-MC',
    shortName: 'BTV MC',
    description: 'Biên tập nội dung bản tin, dẫn chương trình sự kiện, kịch bản sân khấu và phỏng vấn.',
    color: '#2563EB',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    rolesList: [
      'Người dẫn chương trình (MC chính)',
      'MC hậu trường / Phỏng vấn',
      'Biên tập kịch bản',
      'Kiểm duyệt nội dung',
      'Đọc voiceover'
    ]
  },
  'truyen-thong': {
    id: 'truyen-thong',
    name: 'Truyền thông',
    code: 'MEDIA',
    shortName: 'Truyền thông',
    description: 'Nhiếp ảnh sự kiện, quay phim phóng sự, viết bài truyền thông, thiết kế đồ họa và quản trị Fanpage/TikTok.',
    color: '#475569',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
    rolesList: [
      'Nhiếp ảnh (Photographer)',
      'Quay phim (Cameraperson)',
      'Thiết kế đồ họa (Designer)',
      'Biên tập viên bài viết (Copywriter)',
      'Dựng video (Video Editor)',
      'Điều phối viên đăng bài (Social Admin)'
    ]
  },
  'ky-thuat': {
    id: 'ky-thuat',
    name: 'Kỹ thuật',
    code: 'TECH',
    shortName: 'Kỹ thuật',
    description: 'Vận hành hệ thống âm thanh, ánh sáng, máy chiếu/màn hình LED, kỹ thuật livestream và bảo quản thiết bị.',
    color: '#475569',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
    rolesList: [
      'Điều khiển âm thanh (Audio Op)',
      'Điều khiển ánh sáng (Lighting Op)',
      'Kỹ thuật máy chiếu / LED',
      'Kỹ thuật Livestream (OBS/ATEM)',
      'Quản lý và bảo quản thiết bị',
      'Hỗ trợ setup sân khấu'
    ]
  }
};

export const TASK_STATUS_CONFIG = {
  todo: { label: 'Chưa bắt đầu', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  assigned: { label: 'Đã phân công', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  in_progress: { label: 'Đang thực hiện', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  draft_submitted: { label: 'Đã gửi nháp', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  revising: { label: 'Đang chỉnh sửa', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  under_review: { label: 'Chờ duyệt', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Đã duyệt', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  completed: { label: 'Đã hoàn thành', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  on_hold: { label: 'Tạm dừng', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
  cancelled: { label: 'Đã hủy', badge: 'bg-slate-100 text-slate-500 border-slate-200' },
  overdue: { label: 'Quá hạn', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const TASK_PRIORITY_CONFIG = {
  low: { label: 'Thấp', badge: 'bg-slate-50 text-slate-600 border-slate-200' },
  normal: { label: 'Bình thường', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  high: { label: 'Cao', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  urgent: { label: 'Khẩn cấp', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const NEWS_STATUS_CONFIG = {
  draft: { label: 'Mới tạo', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  assigning: { label: 'Đang phân công', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  assigned: { label: 'Đã phân công', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress: { label: 'Đang thực hiện', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  review: { label: 'Chờ duyệt', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  completed: { label: 'Đã hoàn thành', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Đã hủy', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
};
