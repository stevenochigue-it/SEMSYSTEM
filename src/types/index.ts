// --- Core Entities -------------------------------------------------------------

export interface Teacher {
  id?: number;
  employee_id?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  full_name?: string;
  subject?: string;
  grade_level?: string;
  section_advisory?: string;
  contact_number?: string;
  email?: string;
  status?: 'active' | 'on_leave' | 'inactive';
  created_at?: string;
}

export interface GradeLevel {
  grade_level_id?: number;
  id?: number;
  grade_name: string;
}

export interface Section {
  section_id?: number;
  id?: number;
  section_name: string;
  grade_level_id: number;
  grade_name: string;
  grade_level?: string;
  teacher_adviser_name?: string;
  capacity?: number;
  enrolled_count?: number;
}

export interface Student {
  id?: string;
  student_id?: string;
  student_number?: string;
  student_id_number?: string;
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
  contact_number?: string;
  guardian_name?: string;
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
  student_number?: string;
  student_id_number?: string;
  student_name?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  photo?: string;
  section_name?: string;
  grade_name?: string;
  course?: string;
  year_level?: string;
}

export interface SystemAdmin {
  id: string;
  username: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  full_name: string;
  role: 'admin' | 'guard' | string;
  password_hash?: string;
  active?: boolean;
  created_at?: string;
}

// --- Scan Result -------------------------------------------------------------

export interface ScanResult {
  success: boolean;
  student?: Student;
  attendance?: GateLog;
  message: string;
  action?: 'entry' | 'exit' | 'time_in' | 'time_out' | string;
  status?: 'ENTRY' | 'EXIT' | 'inside' | 'outside' | string;
}

// --- Dashboard ---------------------------------------------------------------

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

// --- Auth --------------------------------------------------------------------

export interface AuthUser {
  id: string;
  username: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  full_name: string;
  role: 'admin' | 'guard' | string;
  status?: string;
}

export interface LoginCredentials {
  username: string;
  password?: string;
}

// --- Report ------------------------------------------------------------------

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'yearly';

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

// --- Filters -----------------------------------------------------------------

export interface AttendanceFilters {
  search: string;
  date: string;
  grade_name: string;
  section_name: string;
  status: string;
}

// --- Enrollment & Promotion ---------------------------------------------------

export interface EnrollmentRecord {
  id?: number;
  student_id: number | string;
  grade_level_id: number;
  section_id: number;
  school_year: string;
  enrollment_status: 'Enrolled' | 'Transferred' | 'Graduated' | 'Dropped';
  promotion_status: 'Promoted' | 'Retained' | 'Conditional';
  enrollment_mode: 'automatic' | 'manual';
  created_at?: string;
  student_name?: string;
  grade_name?: string;
  section_name?: string;
}

export interface EnrollmentStats {
  totalEnrolled: number;
  byGradeLevel: Record<string, number>;
  byStrand: Record<string, number>;
  byPromotionStatus: {
    promoted: number;
    retained: number;
    conditional: number;
  };
}

// --- Legacy aliases ----------------------------------------------------------
export type AttendanceRecord = GateLog;
export type User = SystemAdmin;

