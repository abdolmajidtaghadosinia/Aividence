
export enum FileStatus {
  Pending = 'در انتظار تایید',
  Processing = 'در حال پردازش هوشمند',
  Processed = 'محتوای تولید شده',
  Approved = 'تایید شده',
  ServiceUnavailable = 'سرویس پردازش در دسترس نیست',
  Rejected = 'رد شده',
}

export interface FileData {
  id: string;
  name: string;
  uploadDate: string;
  type: string;
  subCollection: string;
  status: FileStatus;
  statusDisplay?: string;
  task_id?: string | null;
  progress?: number;
  progressLabel?: string;
  duration?: number;
  uploader?: string;
  uploadedAt?: string;
  lastUpdatedLabel?: string;
  summary?: string;
  originalText?: string;
  processedText?: string;
  editedText?: string;
  audioSrc?: string;
  extractedPhrases?: string[];
  upload_uuid?: string;
}

export interface User {
  name: string;
  role: string;
  employeeId: string;
  department: string;
}

export interface DictionaryTerm {
  id: number | string;
  Keyword: string;
  description: string;
  subset: string;
}

// API Response Types
export interface AudioFileItem {
  id: number;
  file_name: string;
  uploaded_at: string;
  file_type: string;
  file_type_display: string;
  status: string;
  status_display: string;
  subset_title: string;
  upload_uuid: string;
  task_id?: string | null;
}

export interface DashboardResponse {
  items: AudioFileItem[];
  counts: {
    AP: number;
    P: number;
    PD: number;
    SU: number;
    A: number;
    E: number;
    R: number;
  };
  total: number;
}