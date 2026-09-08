import type {
  Student, GateLog, SystemAdmin, Section,
  ScanResult, DashboardStats, ChartDataPoint,
  LoginCredentials, EnrollmentStats, EnrollmentRecord, Teacher,
} from '../types';

const API_BASE_URL = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('sem_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error((errData as any).message || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const apiService = {
  init() {},

  // --- Auth ------------------------------------------------------------------
  async login(credentials: LoginCredentials): Promise<{ token: string; user: any }> {
    return fetchJson<{ token: string; user: any }>('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // --- Sections --------------------------------------------------------------
  async getSections(): Promise<Section[]> {
    return fetchJson<Section[]>('/sections/index.php');
  },

  async updateSection(id: number | string, section: Partial<Section>): Promise<Section> {
    return fetchJson<Section>(`/sections/index.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(section),
    });
  },

  // --- Students --------------------------------------------------------------
  async getStudents(): Promise<Student[]> {
    return fetchJson<Student[]>('/students/index.php');
  },

  async addStudent(student: Omit<Student, 'student_id' | 'created_at' | 'qr_value' | 'qr_id'>): Promise<Student> {
    return fetchJson<Student>('/students/index.php', {
      method: 'POST',
      body: JSON.stringify(student),
    });
  },

  async updateStudent(id: string, student: Partial<Student>): Promise<Student> {
    return fetchJson<Student>(`/students/index.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(student),
    });
  },

  async deleteStudent(id: string): Promise<void> {
    await fetchJson<void>(`/students/index.php?id=${id}`, { method: 'DELETE' });
  },

  // --- Bulk Import -----------------------------------------------------------
  async importStudents(students: any[]): Promise<{ success: boolean; imported: number; skipped: number; errors: string[]; message: string }> {
    return fetchJson('/students/import.php', {
      method: 'POST',
      body: JSON.stringify({ students }),
    });
  },

  // --- QR Scan ---------------------------------------------------------------
  async scanQRCode(qrValue: string): Promise<ScanResult> {
    return fetchJson<ScanResult>('/attendance/scan.php', {
      method: 'POST',
      body: JSON.stringify({ qr_value: qrValue }),
    });
  },

  // --- Gate Logs -------------------------------------------------------------
  async getAttendance(): Promise<GateLog[]> {
    const raw = await fetchJson<any[]>('/attendance/index.php');
    return raw.map((r: any) => {
      let date = r.date;
      let time_in = r.time_in;
      let time_out = r.time_out;

      if (r.scan_time) {
        const parts = r.scan_time.split(' ');
        date = parts[0];
        const timePart = parts[1] || '';
        const [hStr, mStr] = timePart.split(':');
        let h = parseInt(hStr || '0', 10);
        const m = mStr || '00';
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        const formattedTime = `${String(h).padStart(2, '0')}:${m} ${ampm}`;

        if (r.status === 'ENTRY' || r.status === 'inside') {
          time_in = formattedTime;
        } else {
          time_out = formattedTime;
        }
      }

      const sName = r.student_name || `${r.first_name || ''} ${r.last_name || ''}`.trim();
      const sNum = r.student_number || r.student_id_number || r.student_id;

      return {
        ...r,
        id: String(r.id || r.log_id || Math.random()),
        date: date,
        time_in: time_in,
        time_out: time_out,
        student_name: sName,
        student_number: sNum,
        student_id_number: sNum,
      };
    });
  },

  async seedMockAttendance(): Promise<{ success: boolean; count: number; message: string }> {
    return fetchJson('/attendance/seed.php', { method: 'POST' });
  },

  async clearMockAttendance(): Promise<{ success: boolean; count: number; message: string }> {
    return fetchJson('/attendance/clear.php', { method: 'POST' });
  },

  // --- Dashboard -------------------------------------------------------------
  async getDashboardStats(): Promise<DashboardStats> {
    return fetchJson<DashboardStats>('/dashboard/stats.php');
  },

  async getChartData(): Promise<ChartDataPoint[]> {
    return fetchJson<ChartDataPoint[]>('/dashboard/chart.php');
  },

  async resetInvalidScans(): Promise<void> {
    // No-op
  },

  // --- User Accounts (Unified Admin & Guard) ---------------------------------
  async getUsers(): Promise<SystemAdmin[]> {
    return fetchJson<SystemAdmin[]>('/users/index.php');
  },

  async addUser(user: any): Promise<SystemAdmin> {
    return fetchJson<SystemAdmin>('/users/index.php', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },

  async updateUser(id: string, user: any): Promise<SystemAdmin> {
    return fetchJson<SystemAdmin>(`/users/index.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  },

  async deleteUser(id: string): Promise<void> {
    await fetchJson<void>(`/users/index.php?id=${id}`, { method: 'DELETE' });
  },

  // --- Enrollment & Dual-Mode Promotion --------------------------------------
  async getEnrollmentStats(): Promise<EnrollmentStats> {
    return fetchJson<EnrollmentStats>('/enrollment/stats.php');
  },

  async batchPromoteStudents(payload: { school_year: string; grade_level_id: number; section_id: number }): Promise<{ success: boolean; promotedCount: number }> {
    return fetchJson('/enrollment/batch-promote.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async manualPromoteStudent(payload: {
    student_id: string | number;
    school_year: string;
    grade_level_id: number;
    section_id: number;
    promotion_status: 'Promoted' | 'Retained' | 'Conditional';
    enrollment_status: 'Enrolled' | 'Transferred' | 'Graduated' | 'Dropped';
  }): Promise<EnrollmentRecord> {
    return fetchJson<EnrollmentRecord>('/enrollment/manual-promote.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // --- Teachers / Personnel ---------------------------------------------------
  async getTeachers(): Promise<Teacher[]> {
    return fetchJson<Teacher[]>('/teachers/index.php');
  },

  async addTeacher(teacher: Omit<Teacher, 'id' | 'created_at' | 'full_name'>): Promise<{ success: boolean; teacher: Teacher }> {
    return fetchJson('/teachers/index.php', {
      method: 'POST',
      body: JSON.stringify(teacher),
    });
  },

  async updateTeacher(id: number, teacher: Partial<Teacher>): Promise<{ success: boolean }> {
    return fetchJson(`/teachers/index.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(teacher),
    });
  },

  async deleteTeacher(id: number): Promise<void> {
    await fetchJson(`/teachers/index.php?id=${id}`, { method: 'DELETE' });
  },
};
