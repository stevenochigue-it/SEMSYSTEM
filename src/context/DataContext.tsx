import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Student, GateLog, SystemAdmin, Section, DashboardStats, ChartDataPoint, ScanResult } from '../types';
import { apiService } from '../services/api';

interface DataContextType {
  students: Student[];
  attendance: GateLog[];   // gate_logs
  sections: Section[];
  users: SystemAdmin[];
  stats: DashboardStats | null;
  chartData: ChartDataPoint[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  addStudent: (student: Omit<Student, 'student_id' | 'created_at' | 'qr_value' | 'qr_id'>) => Promise<void>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  scanQR: (qrValue: string) => Promise<ScanResult>;
  addUser: (user: Omit<SystemAdmin, 'id'>) => Promise<void>;
  updateUser: (id: string, user: Partial<SystemAdmin>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  resetStats: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents]   = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<GateLog[]>([]);
  const [sections, setSections]   = useState<Section[]>([]);
  const [users, setUsers]         = useState<SystemAdmin[]>([]);
  const [stats, setStats]         = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      apiService.init();
      const [sData, aData, sectData, uData, statsData, chartPoints] = await Promise.all([
        apiService.getStudents(),
        apiService.getAttendance(),
        apiService.getSections(),
        apiService.getUsers(),
        apiService.getDashboardStats(),
        apiService.getChartData(),
      ]);

      setStudents(sData);
      setAttendance(aData);
      setSections(sectData);
      setUsers(uData);
      setStats(statsData);
      setChartData(chartPoints);
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

  const addUser = async (_userData: Omit<SystemAdmin, 'id'>) => { await refreshData(); };
  const updateUser = async (_id: string, _userData: Partial<SystemAdmin>) => { await refreshData(); };
  const deleteUser = async (_id: string) => { await refreshData(); };
  const resetStats = async () => { await apiService.resetInvalidScans(); await refreshData(); };

  return (
    <DataContext.Provider value={{
      students, attendance, sections, users,
      stats, chartData, isLoading, refreshData,
      addStudent, updateStudent, deleteStudent,
      scanQR, addUser, updateUser, deleteUser, resetStats,
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


