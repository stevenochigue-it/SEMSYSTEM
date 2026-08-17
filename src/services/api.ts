import type {
  Student, GateLog, SystemAdmin, Section,
  ScanResult, DashboardStats, ChartDataPoint,
  LoginCredentials,
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
    return fetchJson<GateLog[]>('/attendance/index.php');
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
};
