// â”€â”€â”€ Core Entities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface GradeLevel {
  grade_level_id: number;
  grade_name: string;
}

export interface Section {
  section_id: number;
  section_name: string;
  grade_level_id: number;
  grade_name: string;
}

export interface Student {
  id?: string;
  student_id?: string;
  student_number: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  photo?: string;
  section_id?: number;
  section_name?: string;
  section?: string;
  grade_level_id?: number;
  grade_name?: string;
  course?: string;
  year_level?: string;
  guardian_name?: string;
  contact_number?: string;
  qr_id?: string;
  qr_value?: string;
  created_at?: string;
  status?: 'inside' | 'outside' | 'ENTRY' | 'EXIT' | string | null;
  last_status?: 'ENTRY' | 'EXIT' | 'inside' | 'outside' | null;
}

export interface GateLog {
  id?: string;
  log_id?: string;
  qr_id?: string;
  scan_time?: string;
  date?: string;
  time_in?: string;
  time_out?: string;
  status?: 'ENTRY' | 'EXIT' | 'inside' | 'outside' | string;
  student_id?: string;
  student_number: string;
  student_name?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  photo?: string;
  course?: string;
  year_level?: string;
  section_name?: string;
  grade_name?: string;
}

export interface SystemAdmin {
  id: string;
  username: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  full_name: string;
  role: 'admin' | 'guard' | string;
  position?: string;
  email?: string;
  password_hash?: string;
  active?: boolean;
  created_at?: string;
  google_id?: string;
  google_email?: string;

}

// ─── Scan Result ─────────────────────────────────────────────────────────────

export interface ScanResult {
  success: boolean;
  student?: Student;
  attendance?: GateLog;
  message: string;
  action?: 'entry' | 'exit' | 'time_in' | 'time_out' | string;
  status?: 'ENTRY' | 'EXIT' | 'inside' | 'outside' | string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalStudents: number;
  studentsInside: number;
  studentsOutside: number;
  todayEntries: number;
  todayExits: number;
  invalidScans: number;
  totalLogs?: number;
}

export interface ChartDataPoint {
  date: string;
  entries: number;
  exits: number;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  username: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  full_name: string;
  role: 'admin' | 'guard' | string;
  position?: string;
  email?: string;
}

export interface LoginCredentials {
  username: string;
  password?: string;
}

// â”€â”€â”€ Report â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type ReportType = 'daily' | 'weekly' | 'monthly';

export interface ReportData {
  type: ReportType;
  period: string;
  records: GateLog[];
  summary: {
    total_entries: number;
    total_exits: number;
    unique_students: number;
  };
}

// â”€â”€â”€ Filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface AttendanceFilters {
  search: string;
  date: string;
  grade_name: string;
  section_name: string;
  status: string;
}

// â”€â”€â”€ Legacy aliases â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type AttendanceRecord = GateLog;
export type User = SystemAdmin;


