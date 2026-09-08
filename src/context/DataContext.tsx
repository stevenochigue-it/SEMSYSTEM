import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Student, GateLog, SystemAdmin, Section, DashboardStats, ChartDataPoint, ScanResult, Teacher } from '../types';
import { apiService } from '../services/api';

interface DataContextType {
  students: Student[];
  attendance: GateLog[];   // gate_logs
  sections: Section[];
  users: SystemAdmin[];
  teachers: Teacher[];
  stats: DashboardStats | null;
  chartData: ChartDataPoint[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  seedMockAttendance: () => Promise<void>;
  clearMockAttendance: () => Promise<void>;
  seedMockEnrollment: () => void;
  clearMockEnrollment: () => void;
  addStudent: (student: Omit<Student, 'student_id' | 'created_at' | 'qr_value' | 'qr_id'>) => Promise<void>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  scanQR: (qrValue: string) => Promise<ScanResult>;
  addUser: (user: Omit<SystemAdmin, 'id'>) => Promise<void>;
  updateUser: (id: string, user: Partial<SystemAdmin>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  resetStats: () => Promise<void>;
  updateSection: (id: number | string, section: Partial<Section>) => Promise<void>;
  addTeacher: (teacher: Omit<Teacher, 'id' | 'created_at' | 'full_name'>) => Promise<void>;
  updateTeacher: (id: number, teacher: Partial<Teacher>) => Promise<void>;
  deleteTeacher: (id: number) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents]   = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<GateLog[]>([]);
  const [sections, setSections]   = useState<Section[]>([]);
  const [users, setUsers]         = useState<SystemAdmin[]>([]);
  const [teachers, setTeachers]   = useState<Teacher[]>([]);
  const [stats, setStats]         = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      apiService.init();
      const [sData, aData, sectData, uData, statsData, chartPoints, teacherData] = await Promise.all([
        apiService.getStudents(),
        apiService.getAttendance(),
        apiService.getSections(),
        apiService.getUsers(),
        apiService.getDashboardStats(),
        apiService.getChartData(),
        apiService.getTeachers().catch(() => [] as Teacher[]),
      ]);

      setStudents(sData);
      setAttendance(aData);
      setSections(sectData);
      setUsers(uData);
      setStats(statsData);
      setChartData(chartPoints);
      setTeachers(teacherData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refreshData(); }, [refreshData]);

  const addStudent = async (studentData: Omit<Student, 'student_id' | 'created_at' | 'qr_value' | 'qr_id'>) => {
    await apiService.addStudent(studentData);
    await refreshData();
  };

  const updateStudent = async (id: string, studentData: Partial<Student>) => {
    await apiService.updateStudent(id, studentData);
    await refreshData();
  };

  const deleteStudent = async (id: string) => {
    await apiService.deleteStudent(id);
    await refreshData();
  };

  const scanQR = async (qrValue: string): Promise<ScanResult> => {
    const result = await apiService.scanQRCode(qrValue);
    await refreshData();
    return result;
  };

  const seedMockAttendance = async () => {
    await apiService.seedMockAttendance();
    await refreshData();
  };

  const clearMockAttendance = async () => {
    await apiService.clearMockAttendance();
    await refreshData();
  };

  // ── Enrollment Mock Data (localStorage-only, no backend needed) ──────────
  const ENROLLMENT_MOCK_KEY = 'sem_mock_enrollment';

  const seedMockEnrollment = async () => {
    const mockStats = {
      totalEnrolled: 960,
      byGradeLevel: {
        'Grade 7': 185, 'Grade 8': 168, 'Grade 9': 175,
        'Grade 10': 160, 'Grade 11': 142, 'Grade 12': 130,
      },
      byStrand: { 'GAS - Grade 11': 142, 'GAS - Grade 12': 130 },
      byPromotionStatus: { promoted: 780, conditional: 42, retained: 18 },
    };
    localStorage.setItem(ENROLLMENT_MOCK_KEY, JSON.stringify(mockStats));

    // 1. Seed 20 mock teachers into database
    const mockTeacherList = [
      { employee_id: 'TCH-2026-001', first_name: 'Maria', last_name: 'Santos', subject: 'Mathematics', grade_level: 'Grade 7', section_advisory: 'Diamond', contact_number: '09171234567', status: 'active' },
      { employee_id: 'TCH-2026-002', first_name: 'Roberto', last_name: 'Reyes', subject: 'Science', grade_level: 'Grade 7', section_advisory: 'Pearl', contact_number: '09182345678', status: 'active' },
      { employee_id: 'TCH-2026-003', first_name: 'Elena', last_name: 'Dela Cruz', subject: 'English', grade_level: 'Grade 7', section_advisory: 'Ruby', contact_number: '09193456789', status: 'active' },
      { employee_id: 'TCH-2026-004', first_name: 'Mark Anthony', last_name: 'Ramos', subject: 'Filipino', grade_level: 'Grade 8', section_advisory: 'Emerald', contact_number: '09204567890', status: 'active' },
      { employee_id: 'TCH-2026-005', first_name: 'Grace', last_name: 'Gonzales', subject: 'Araling Panlipunan (AP)', grade_level: 'Grade 8', section_advisory: 'Sapphire', contact_number: '09215678901', status: 'active' },
      { employee_id: 'TCH-2026-006', first_name: 'Jose Luis', last_name: 'Aquino', subject: 'MAPEH', grade_level: 'Grade 8', section_advisory: 'Topaz', contact_number: '09226789012', status: 'active' },
      { employee_id: 'TCH-2026-007', first_name: 'Patricia', last_name: 'Mendoza', subject: 'Technology and Livelihood Education (TLE)', grade_level: 'Grade 9', section_advisory: 'Garnet', contact_number: '09237890123', status: 'active' },
      { employee_id: 'TCH-2026-008', first_name: 'Gabriel', last_name: 'Mercado', subject: 'Research / ICT', grade_level: 'Grade 9', section_advisory: 'Amethyst', contact_number: '09248901234', status: 'active' },
      { employee_id: 'TCH-2026-009', first_name: 'Teresa', last_name: 'Villanueva', subject: 'Edukasyon sa Pagpapakakatao (EsP)', grade_level: 'Grade 9', section_advisory: 'Opal', contact_number: '09259012345', status: 'active' },
      { employee_id: 'TCH-2026-010', first_name: 'Francis', last_name: 'Castillo', subject: 'Mathematics', grade_level: 'Grade 10', section_advisory: 'Aquamarine', contact_number: '09260123456', status: 'active' },
      { employee_id: 'TCH-2026-011', first_name: 'Janice', last_name: 'Cruz', subject: 'Science', grade_level: 'Grade 10', section_advisory: 'Turquoise', contact_number: '09271234567', status: 'active' },
      { employee_id: 'TCH-2026-012', first_name: 'Ricardo', last_name: 'Fernandez', subject: 'English', grade_level: 'Grade 10', section_advisory: 'Jade', contact_number: '09282345678', status: 'active' },
      { employee_id: 'TCH-2026-013', first_name: 'Carmen', last_name: 'Alcantara', subject: 'General Academic Strand (GAS)', grade_level: 'Grade 11', section_advisory: 'GAS 11-A', contact_number: '09293456789', status: 'active' },
      { employee_id: 'TCH-2026-014', first_name: 'Antonio', last_name: 'Bautista', subject: 'General Academic Strand (GAS)', grade_level: 'Grade 11', section_advisory: 'GAS 11-B', contact_number: '09304567890', status: 'active' },
      { employee_id: 'TCH-2026-015', first_name: 'Sofia', last_name: 'Laurel', subject: 'General Academic Strand (GAS)', grade_level: 'Grade 11', section_advisory: 'GAS 11-C', contact_number: '09315678901', status: 'active' },
      { employee_id: 'TCH-2026-016', first_name: 'Emmanuel', last_name: 'Navarro', subject: 'General Academic Strand (GAS)', grade_level: 'Grade 11', section_advisory: 'GAS 11-D', contact_number: '09326789012', status: 'active' },
      { employee_id: 'TCH-2026-017', first_name: 'Rosalinda', last_name: 'Soriano', subject: 'General Academic Strand (GAS)', grade_level: 'Grade 12', section_advisory: 'GAS 12-A', contact_number: '09337890123', status: 'active' },
      { employee_id: 'TCH-2026-018', first_name: 'Leonardo', last_name: 'Garcia', subject: 'General Academic Strand (GAS)', grade_level: 'Grade 12', section_advisory: 'GAS 12-B', contact_number: '09348901234', status: 'active' },
      { employee_id: 'TCH-2026-019', first_name: 'Beatrice', last_name: 'Pascual', subject: 'General Academic Strand (GAS)', grade_level: 'Grade 12', section_advisory: 'GAS 12-C', contact_number: '09359012345', status: 'active' },
      { employee_id: 'TCH-2026-020', first_name: 'Dominic', last_name: 'Ocampo', subject: 'General Academic Strand (GAS)', grade_level: 'Grade 12', section_advisory: 'GAS 12-D', contact_number: '09360123456', status: 'active' },
    ];

    try {
      for (const t of mockTeacherList) {
        await apiService.addTeacher(t as any);
      }
    } catch (e) {
      console.warn('Teacher seeding skipped or API offline:', e);
    }

    // 2. Link teacher advisers to section capacity matrix
    try {
      for (const sec of sections) {
        const matchingTeacher = mockTeacherList.find(t => t.section_advisory === sec.section_name);
        if (matchingTeacher) {
          const secId = sec.section_id ?? sec.id;
          if (secId) {
            await apiService.updateSection(secId, {
              teacher_adviser_name: `Prof. ${matchingTeacher.first_name} ${matchingTeacher.last_name}`,
              capacity: 45,
            });
          }
        }
      }
    } catch (e) {
      console.warn('Section adviser update skipped:', e);
    }

    // 3. Seed sample class roster students if student registry is empty
    if (students.length < 5) {
      const sampleStudents = [
        { student_number: 'STU-2026-701', first_name: 'Angelo', last_name: 'Dela Cruz', section_id: sections[0]?.section_id ?? 1, guardian_name: 'Rosa Dela Cruz', contact_number: '09171112233' },
        { student_number: 'STU-2026-702', first_name: 'Sophia', last_name: 'Reyes', section_id: sections[0]?.section_id ?? 1, guardian_name: 'Marco Reyes', contact_number: '09182223344' },
        { student_number: 'STU-2026-703', first_name: 'Ethan', last_name: 'Santos', section_id: sections[0]?.section_id ?? 1, guardian_name: 'Liza Santos', contact_number: '09193334455' },
        { student_number: 'STU-2026-704', first_name: 'Chloe', last_name: 'Garcia', section_id: sections[0]?.section_id ?? 1, guardian_name: 'Felipe Garcia', contact_number: '09204445566' },
        { student_number: 'STU-2026-705', first_name: 'Liam', last_name: 'Gonzales', section_id: sections[1]?.section_id ?? 2, guardian_name: 'Elena Gonzales', contact_number: '09215556677' },
        { student_number: 'STU-2026-706', first_name: 'Isabella', last_name: 'Aquino', section_id: sections[1]?.section_id ?? 2, guardian_name: 'Victor Aquino', contact_number: '09226667788' },
        { student_number: 'STU-2026-801', first_name: 'Mark', last_name: 'Ramos', section_id: sections[3]?.section_id ?? 4, guardian_name: 'Teresa Ramos', contact_number: '09248889900' },
        { student_number: 'STU-2026-802', first_name: 'Olivia', last_name: 'Mendoza', section_id: sections[3]?.section_id ?? 4, guardian_name: 'Ramon Mendoza', contact_number: '09259990011' },
      ];
      for (const std of sampleStudents) {
        try {
          await apiService.addStudent(std as any);
        } catch (e) {
          console.warn('Student seeding error:', e);
        }
      }
    }

    await refreshData();
  };

  const clearMockEnrollment = async () => {
    localStorage.removeItem(ENROLLMENT_MOCK_KEY);
    try {
      for (const t of teachers) {
        if (t.id && t.employee_id && t.employee_id.startsWith('TCH-2026-')) {
          await apiService.deleteTeacher(t.id);
        }
      }
    } catch (e) {
      console.warn('Clearing mock teachers error:', e);
    }
    await refreshData();
  };
  // ────────────────────────────────────────────────────────────────────────

  const addUser = async (_userData: Omit<SystemAdmin, 'id'>) => { await refreshData(); };
  const updateUser = async (_id: string, _userData: Partial<SystemAdmin>) => { await refreshData(); };
  const deleteUser = async (_id: string) => { await refreshData(); };
  const resetStats = async () => { await apiService.resetInvalidScans(); await refreshData(); };
  const updateSection = async (id: number | string, sectionData: Partial<Section>) => {
    await apiService.updateSection(id, sectionData);
    await refreshData();
  };

  const addTeacher = async (teacherData: Omit<Teacher, 'id' | 'created_at' | 'full_name'>) => {
    await apiService.addTeacher(teacherData);
    await refreshData();
  };
  const updateTeacher = async (id: number, teacherData: Partial<Teacher>) => {
    await apiService.updateTeacher(id, teacherData);
    await refreshData();
  };
  const deleteTeacher = async (id: number) => {
    await apiService.deleteTeacher(id);
    await refreshData();
  };

  return (
    <DataContext.Provider value={{
      students, attendance, sections, users, teachers,
      stats, chartData, isLoading, refreshData, seedMockAttendance, clearMockAttendance,
      seedMockEnrollment, clearMockEnrollment,
      addStudent, updateStudent, deleteStudent,
      scanQR, addUser, updateUser, deleteUser, resetStats, updateSection,
      addTeacher, updateTeacher, deleteTeacher,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};


