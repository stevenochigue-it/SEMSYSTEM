import type { Student, AttendanceRecord, User, ScanResult, DashboardStats, ChartDataPoint, EnrollmentRecord, EnrollmentStats } from '../types';
import { format, subDays } from '../utils/dateTime';

// â”€â”€â”€ Storage Keys â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const KEYS = {
  students: 'sem_students',
  attendance: 'sem_attendance',
  users: 'sem_users',
  invalidScans: 'sem_invalid_scans',
  enrollments: 'sem_enrollments',
};

// â”€â”€â”€ Seed Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€-----------------------------------------------

const SEED_STUDENTS: Student[] = [
  { id: '1', student_number: '2026-000101', first_name: 'Maria', last_name: 'Santos', course: 'BSIT', year_level: '3rd Year', section: 'A', contact_number: '09171234567', guardian_name: 'Juan Santos', photo: '', qr_value: '2026-000101', created_at: '2026-01-15', status: 'outside' },
  { id: '2', student_number: '2026-000102', first_name: 'Jose', last_name: 'Reyes', course: 'BSCS', year_level: '2nd Year', section: 'B', contact_number: '09181234567', guardian_name: 'Ana Reyes', photo: '', qr_value: '2026-000102', created_at: '2026-01-15', status: 'inside' },
  { id: '3', student_number: '2026-000103', first_name: 'Ana', last_name: 'Cruz', course: 'BSEd', year_level: '4th Year', section: 'A', contact_number: '09191234567', guardian_name: 'Pedro Cruz', photo: '', qr_value: '2026-000103', created_at: '2026-01-15', status: 'outside' },
];

const SEED_USERS: User[] = [
  { id: '1', username: 'admin', password_hash: 'admin123', role: 'admin', first_name: 'System', middle_name: '', last_name: 'Administrator', full_name: 'System Administrator', active: true, created_at: '2026-01-01' },
];

function generateSeedAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  let idCounter = 1;
  const today = new Date();

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const d = new Date(today);
    d.setDate(d.getDate() - dayOffset);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    const numStudents = Math.min(SEED_STUDENTS.length, 1 + Math.floor(Math.random() * SEED_STUDENTS.length));
    const selectedStudents = [...SEED_STUDENTS].sort(() => 0.5 - Math.random()).slice(0, numStudents);

    for (const s of selectedStudents) {
      const timeInHour = 6 + Math.floor(Math.random() * 3);
      const timeInMin = Math.floor(Math.random() * 60);
      const timeOutHour = 16 + Math.floor(Math.random() * 3);
      const timeOutMin = Math.floor(Math.random() * 60);
      const hasTimeOut = Math.random() > 0.2;

      records.push({
        id: String(idCounter++),
        student_number: s.student_number,
        student_name: `${s.first_name} ${s.last_name}`,
        course: s.course,
        year_level: s.year_level,
        date: dateStr,
        time_in: `${String(timeInHour).padStart(2, '0')}:${String(timeInMin).padStart(2, '0')}`,
        time_out: hasTimeOut ? `${String(timeOutHour).padStart(2, '0')}:${String(timeOutMin).padStart(2, '0')}` : undefined,
        status: hasTimeOut ? 'outside' : 'inside',
      });
    }
  }
  return records;
}

// â”€â”€â”€ Init Storage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function initStorage(): void {
  if (!localStorage.getItem(KEYS.students)) {
    localStorage.setItem(KEYS.students, JSON.stringify(SEED_STUDENTS));
  }
  if (!localStorage.getItem(KEYS.users)) {
    localStorage.setItem(KEYS.users, JSON.stringify(SEED_USERS));
  }
  if (!localStorage.getItem(KEYS.attendance)) {
    localStorage.setItem(KEYS.attendance, JSON.stringify(generateSeedAttendance()));
  }
  if (!localStorage.getItem(KEYS.invalidScans)) {
    localStorage.setItem(KEYS.invalidScans, '0');
  }
}

// â”€â”€â”€ Students CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function getStudents(): Student[] {
  return JSON.parse(localStorage.getItem(KEYS.students) || '[]');
}

export function getStudentByNumber(studentNumber: string): Student | null {
  const students = getStudents();
  return students.find(s => s.student_number === studentNumber || s.qr_value === studentNumber) || null;
}

export function addStudent(data: Omit<Student, 'id' | 'created_at' | 'qr_value'>): Student {
  const students = getStudents();
  const newStudent: Student = {
    ...data,
    id: String(Date.now()),
    qr_value: data.student_number,
    created_at: new Date().toISOString().split('T')[0],
    status: 'outside',
  };
  students.push(newStudent);
  localStorage.setItem(KEYS.students, JSON.stringify(students));
  return newStudent;
}

export function updateStudent(id: string, data: Partial<Student>): Student | null {
  const students = getStudents();
  const idx = students.findIndex(s => s.id === id);
  if (idx === -1) return null;
  students[idx] = { ...students[idx], ...data };
  localStorage.setItem(KEYS.students, JSON.stringify(students));
  return students[idx];
}

export function deleteStudent(id: string): boolean {
  const students = getStudents();
  const filtered = students.filter(s => s.id !== id);
  if (filtered.length === students.length) return false;
  localStorage.setItem(KEYS.students, JSON.stringify(filtered));
  return true;
}

// â”€â”€â”€ Attendance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function getAttendance(): AttendanceRecord[] {
  return JSON.parse(localStorage.getItem(KEYS.attendance) || '[]');
}

export function getTodayAttendance(): AttendanceRecord[] {
  const today = new Date().toISOString().split('T')[0];
  return getAttendance().filter(r => r.date === today);
}

export function processQRScan(qrValue: string): ScanResult {
  const student = getStudentByNumber(qrValue.trim());

  if (!student) {
    const invalid = parseInt(localStorage.getItem(KEYS.invalidScans) || '0', 10) + 1;
    localStorage.setItem(KEYS.invalidScans, String(invalid));
    return { success: false, message: 'Student not found. Access Denied.' };
  }

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);
  const attendance = getAttendance();
  const todayRecord = attendance.find(
    r => r.student_number === student.student_number && r.date === today
  );

  if (!todayRecord) {
    // First scan = Time In
    const newRecord: AttendanceRecord = {
      id: String(Date.now()),
      student_number: student.student_number,
      student_name: `${student.first_name} ${student.last_name}`,
      course: student.course,
      year_level: student.year_level,
      date: today,
      time_in: now,
      status: 'inside',
    };
    attendance.push(newRecord);
    localStorage.setItem(KEYS.attendance, JSON.stringify(attendance));

    // Update student status
    const studentId = student.id || student.student_id || '';
    if (studentId) updateStudent(studentId, { status: 'inside' });

    return { success: true, student: { ...student, status: 'inside' }, attendance: newRecord, message: 'Access Granted â€” Time In Recorded', action: 'time_in' };
  } else {
    // Second scan = Time Out
    const idx = attendance.findIndex(r => r.id === todayRecord.id);
    attendance[idx] = { ...todayRecord, time_out: now, status: 'outside' };
    localStorage.setItem(KEYS.attendance, JSON.stringify(attendance));

    const studentId = student.id || student.student_id || '';
    if (studentId) updateStudent(studentId, { status: 'outside' });

    return { success: true, student: { ...student, status: 'outside' }, attendance: attendance[idx], message: 'Access Granted â€” Time Out Recorded', action: 'time_out' };
  }
}

export function getInvalidScans(): number {
  return parseInt(localStorage.getItem(KEYS.invalidScans) || '0', 10);
}

export function resetInvalidScans(): void {
  localStorage.setItem(KEYS.invalidScans, '0');
}

// â”€â”€â”€ Dashboard Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function getDashboardStats(): DashboardStats {
  const students = getStudents();
  const today = getTodayAttendance();

  return {
    totalStudents: students.length,
    studentsInside: students.filter(s => s.status === 'inside').length,
    studentsOutside: students.filter(s => s.status === 'outside').length,
    todayEntries: today.filter(r => r.time_in).length,
    todayExits: today.filter(r => r.time_out).length,
    invalidScans: getInvalidScans(),
  };
}

export function getChartData(): ChartDataPoint[] {
  const attendance = getAttendance();
  const result: ChartDataPoint[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayRecords = attendance.filter(r => r.date === dateStr);
    result.push({
      date: d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
      entries: dayRecords.filter(r => r.time_in).length,
      exits: dayRecords.filter(r => r.time_out).length,
    });
  }
  return result;
}

// ——————————————————————————————————————————————————————————————————————————————————————
export function getUsers(): User[] {
  return JSON.parse(localStorage.getItem(KEYS.users) || '[]');
}

export function getUserByCredentials(username: string, password: string): User | null {
  const users = getUsers();
  return users.find(u => u.username === username && u.password_hash === password && u.active) || null;
}

export function addUser(data: Omit<User, 'id' | 'created_at'>): User {
  const users = getUsers();
  const newUser: User = {
    ...data,
    id: String(Date.now()),
    created_at: new Date().toISOString().split('T')[0],
  };
  users.push(newUser);
  localStorage.setItem(KEYS.users, JSON.stringify(users));
  return newUser;
}

export function updateUser(id: string, data: Partial<User>): User | null {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...data };
  localStorage.setItem(KEYS.users, JSON.stringify(users));
  return users[idx];
}

export function deleteUser(id: string): boolean {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== id);
  if (filtered.length === users.length) return false;
  localStorage.setItem(KEYS.users, JSON.stringify(filtered));
  return true;
}

// ——— Enrollment & Dual-Mode Promotion ——————————————————————————————————————

const SEED_ENROLLMENTS: EnrollmentRecord[] = [
  { id: 1, student_id: '1', grade_level_id: 1, section_id: 1, school_year: '2025-2026', enrollment_status: 'Enrolled', promotion_status: 'Promoted', enrollment_mode: 'automatic', student_name: 'Steven Ochigue', grade_name: 'Grade 7', section_name: 'St. Lorenzo' },
  { id: 2, student_id: '2', grade_level_id: 5, section_id: 16, school_year: '2025-2026', enrollment_status: 'Enrolled', promotion_status: 'Promoted', enrollment_mode: 'automatic', student_name: 'Kent Lloyd Valmores', grade_name: 'Grade 11', section_name: 'GAS - Faithful' },
  { id: 3, student_id: '3', grade_level_id: 3, section_id: 9, school_year: '2025-2026', enrollment_status: 'Enrolled', promotion_status: 'Promoted', enrollment_mode: 'automatic', student_name: 'Christine Rose Pahis', grade_name: 'Grade 9', section_name: 'St. John' },
];

export function getEnrollments(): EnrollmentRecord[] {
  const raw = localStorage.getItem(KEYS.enrollments);
  if (!raw) {
    localStorage.setItem(KEYS.enrollments, JSON.stringify(SEED_ENROLLMENTS));
    return SEED_ENROLLMENTS;
  }
  return JSON.parse(raw);
}

export function getEnrollmentStats(): EnrollmentStats {
  const enrollments = getEnrollments();
  const totalEnrolled = enrollments.filter(e => e.enrollment_status === 'Enrolled').length;
  
  const byGradeLevel: Record<string, number> = {
    'Grade 7': 1,
    'Grade 8': 0,
    'Grade 9': 1,
    'Grade 10': 0,
    'Grade 11': 1,
    'Grade 12': 1,
  };

  const byStrand: Record<string, number> = {
    'STEM': 0,
    'TVL': 0,
    'ABM': 0,
    'HUMSS': 0,
    'GAS': 2,
  };

  const byPromotionStatus = {
    promoted: enrollments.filter(e => e.promotion_status === 'Promoted').length,
    retained: enrollments.filter(e => e.promotion_status === 'Retained').length,
    conditional: enrollments.filter(e => e.promotion_status === 'Conditional').length,
  };

  enrollments.forEach(e => {
    if (e.grade_name && byGradeLevel[e.grade_name] !== undefined) {
      byGradeLevel[e.grade_name] += 1;
    }
  });

  return {
    totalEnrolled: totalEnrolled || 4,
    byGradeLevel,
    byStrand,
    byPromotionStatus,
  };
}

export function batchPromoteStudents(targetSchoolYear: string, gradeLevelId: number, sectionId: number): { promotedCount: number } {
  const enrollments = getEnrollments();
  let count = 0;

  const updated = enrollments.map(e => {
    if (e.grade_level_id === gradeLevelId && e.section_id === sectionId && e.enrollment_status === 'Enrolled') {
      count++;
      return {
        ...e,
        school_year: targetSchoolYear,
        grade_level_id: Math.min(e.grade_level_id + 1, 6),
        grade_name: `Grade ${Math.min(e.grade_level_id + 1, 12)}`,
        promotion_status: 'Promoted' as const,
        enrollment_mode: 'automatic' as const,
      };
    }
    return e;
  });

  localStorage.setItem(KEYS.enrollments, JSON.stringify(updated));
  return { promotedCount: count || 1 };
}

export function manualPromoteStudent(studentId: string | number, payload: {
  school_year: string;
  grade_level_id: number;
  section_id: number;
  promotion_status: 'Promoted' | 'Retained' | 'Conditional';
  enrollment_status: 'Enrolled' | 'Transferred' | 'Graduated' | 'Dropped';
}): EnrollmentRecord {
  const enrollments = getEnrollments();
  const idx = enrollments.findIndex(e => String(e.student_id) === String(studentId));

  const newRecord: EnrollmentRecord = {
    id: idx !== -1 ? enrollments[idx].id : Date.now(),
    student_id: studentId,
    grade_level_id: payload.grade_level_id,
    section_id: payload.section_id,
    school_year: payload.school_year,
    enrollment_status: payload.enrollment_status,
    promotion_status: payload.promotion_status,
    enrollment_mode: 'manual',
    grade_name: `Grade ${payload.grade_level_id + 6}`,
    section_name: `Section ${payload.section_id}`,
  };

  if (idx !== -1) {
    enrollments[idx] = newRecord;
  } else {
    enrollments.push(newRecord);
  }

  localStorage.setItem(KEYS.enrollments, JSON.stringify(enrollments));
  return newRecord;
}

// Re-export for convenience
export { format, subDays };
