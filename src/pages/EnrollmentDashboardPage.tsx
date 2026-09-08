import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { apiService } from '../services/api';
import type { EnrollmentStats, Section } from '../types';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import {
  GraduationCap,
  Users,
  QrCode,
  School,
  Sparkles,
  RefreshCw,
  Search,
  BarChart3,
  PieChart as PieChartIcon,
  Bookmark,
  Award,
  Edit,
  UserCheck,
  Eye,
  UserPlus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StudentForm } from '../components/students/StudentForm';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const EnrollmentDashboardPage: React.FC = () => {
  const { students, sections, teachers, addStudent, updateSection, updateTeacher, refreshData } = useData();
  const [enrollmentStats, setEnrollmentStats] = useState<EnrollmentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State for editing Teacher Adviser & Section Capacity
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [adviserName, setAdviserName] = useState('');
  const [capacityLimit, setCapacityLimit] = useState(45);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Modal State for Viewing Section Roster & Enrolling Student
  const [isViewRosterModalOpen, setIsViewRosterModalOpen] = useState(false);
  const [selectedRosterSection, setSelectedRosterSection] = useState<Section | null>(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getEnrollmentStats();

      // Merge with localStorage mock if the backend has no data yet
      const mockRaw = localStorage.getItem('sem_mock_enrollment');
      if (
        mockRaw &&
        (!data || !data.totalEnrolled) &&
        (!data?.byGradeLevel || Object.keys(data.byGradeLevel).length === 0)
      ) {
        const mock = JSON.parse(mockRaw);
        setEnrollmentStats({ ...mock, ...data });
      } else {
        setEnrollmentStats(data);
      }
    } catch (err) {
      // If API fails, still try localStorage mock
      const mockRaw = localStorage.getItem('sem_mock_enrollment');
      if (mockRaw) setEnrollmentStats(JSON.parse(mockRaw));
      else console.error('Failed to load enrollment stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [students, sections]);

  const handleRefresh = async () => {
    await refreshData();
    await fetchStats();
  };

  const openEditModal = (sec: Section) => {
    setSaveError(null);
    setSelectedSection(sec);
    setAdviserName(sec.teacher_adviser_name || '');
    setCapacityLimit(sec.capacity || 45);
    setEditModalOpen(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    if (!selectedSection) return;

    try {
      const targetId = selectedSection.id || selectedSection.section_id;
      const cleanName = adviserName.trim();

      if (targetId) {
        await updateSection(targetId, {
          teacher_adviser_name: cleanName,
          capacity: Number(capacityLimit),
        });

        // Sync matched teacher's section_advisory in Teachers directory
        const matchedTeacher = teachers.find((t) => {
          const tName = `${t.first_name} ${t.middle_name ? t.middle_name + ' ' : ''}${t.last_name}`;
          return tName.toLowerCase() === cleanName.toLowerCase() || (t.employee_id && t.employee_id === cleanName);
        });

        if (matchedTeacher && matchedTeacher.id) {
          await updateTeacher(matchedTeacher.id, {
            section_advisory: selectedSection.section_name,
          });
        }
      }
      setEditModalOpen(false);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update section capacity matrix.');
    }
  };

  // Calculations — use only real data; zero when nothing is available yet
  const totalEnrolled = enrollmentStats?.totalEnrolled || students.length || 0;
  const activeQRCodes = students.filter(s => s.qr_value || s.student_number || s.student_id_number).length;
  const schoolCapacity = 1200;
  const capacityUtilizationPct = Math.round((totalEnrolled / schoolCapacity) * 100);

  // Grade 7 to 12 Breakdown — real data only, no fallback mock numbers
  const byGradeLevel = enrollmentStats?.byGradeLevel && Object.keys(enrollmentStats.byGradeLevel).length > 0
    ? enrollmentStats.byGradeLevel
    : {};

  const gradeChartData = Object.keys(byGradeLevel).map((gName) => ({
    grade: gName,
    students: byGradeLevel[gName] || 0,
  }));

  // SHS Strands — real data only
  const byStrand = enrollmentStats?.byStrand && Object.values(enrollmentStats.byStrand).reduce((a, b) => a + b, 0) > 0
    ? enrollmentStats.byStrand
    : {};

  const strandChartData = Object.keys(byStrand).map((strandKey) => ({
    name: strandKey,
    students: byStrand[strandKey] || 0,
  }));

  // Promotion status — real data only, no fallback mock numbers
  const promotionData = [
    { name: 'Promoted',    value: enrollmentStats?.byPromotionStatus?.promoted    || 0, color: '#10b981' },
    { name: 'Conditional', value: enrollmentStats?.byPromotionStatus?.conditional || 0, color: '#f59e0b' },
    { name: 'Retained',    value: enrollmentStats?.byPromotionStatus?.retained    || 0, color: '#ef4444' },
  ];
  const hasPromotionData = promotionData.some(d => d.value > 0);

  const STRAND_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  const hasGradeData  = gradeChartData.length > 0;
  const hasStrandData = strandChartData.length > 0;

  // Filter sections by search term
  const filteredSections = sections.filter(sec => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      sec.section_name.toLowerCase().includes(term) ||
      sec.grade_name.toLowerCase().includes(term) ||
      (sec.teacher_adviser_name && sec.teacher_adviser_name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 pb-8 bg-[#f8fafc] -m-6 p-6 min-h-screen">
      
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Pages</span>
            <span>/</span>
            <span className="text-slate-700 font-bold">Enrollment Dashboard</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="h-7 w-7 text-indigo-600" />
            Enrollment & Population Analytics
          </h1>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsEnrollModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 text-xs font-bold py-2.5 px-4 rounded-xl"
          >
            <UserPlus className="h-4 w-4" />
            + Enroll New Student
          </Button>

          <Link
            to="/students"
            className="flex items-center gap-2 rounded-xl bg-white border border-slate-200/90 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Users className="h-4 w-4 text-indigo-600" />
            Student Registry
          </Link>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-xl bg-white border border-slate-200/90 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-indigo-600 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 p-6 text-white shadow-lg shadow-indigo-600/15">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-indigo-100 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>San Isidro National High School</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Academic Population & Registration Overview
            </h2>
            <p className="text-xs text-indigo-100/90 max-w-xl font-medium">
              Real-time monitoring of Grade 7–12 student enrollment distribution, Senior High School strands, and QR badge issuance metrics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md border border-white/20 shadow-xs">
              <School className="h-4 w-4 text-emerald-300" />
              <span>S.Y. 2025–2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

        {/* Card 1: Total Enrolled */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Users className="h-5 w-5" />
            </div>
            {totalEnrolled > 0 ? (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                {totalEnrolled} Active
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                No data yet
              </span>
            )}
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500">Total Enrolled Population</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              {totalEnrolled.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Active student profiles registered</p>
          </div>
        </div>

        {/* Card 2: Active QR Codes */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <QrCode className="h-5 w-5" />
            </div>
            {activeQRCodes > 0 ? (
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                {activeQRCodes} Linked
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                No data yet
              </span>
            )}
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500">Active QR Gate Badges</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              {activeQRCodes.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Printable QR credentials linked</p>
          </div>
        </div>

        {/* Card 3: School Capacity */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <School className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              {capacityUtilizationPct}% Utilized
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500">Campus Student Capacity</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              {totalEnrolled} / {schoolCapacity}
            </h3>
            {/* Progress bar */}
            <div className="mt-2.5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${capacityUtilizationPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Sections & Advisers */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Bookmark className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              {sections.length} Sections
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500">Teacher Advisers Assigned</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              {sections.filter(s => s.teacher_adviser_name && s.teacher_adviser_name.trim() !== '').length}
              <span className="text-base font-bold text-slate-400"> / {sections.length}</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {sections.filter(s => s.teacher_adviser_name && s.teacher_adviser_name.trim() !== '').length === 0
                ? 'No advisers assigned yet — edit sections below'
                : 'Sections with an assigned adviser'}
            </p>
          </div>
        </div>

      </div>

      {/* Main Charts Row: Left Bar Chart (Grade 7 - 12) + Right SHS Strands Bar Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Left: Grade 7 to Grade 12 Population Breakdown */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">Grade Level Population (G7–G12)</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Total enrolled students per grade level
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            {hasGradeData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="grade" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9', radius: 8 }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  />
                  <Bar dataKey="students" name="Students" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
                <BarChart3 className="h-10 w-10 opacity-30" />
                <p className="text-sm font-bold">No enrollment data yet</p>
                <p className="text-xs font-medium text-center max-w-xs">Use the <span className="font-black text-indigo-500">Cyberboard</span> dev tool to seed sample data for preview.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Senior High School Strands (G11 & G12) */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                <h3 className="text-base font-black text-slate-900">Senior High School Strand (GAS Only)</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                General Academic Strand (GAS) Grade 11 & Grade 12 enrollment
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100">
              Exclusive SHS Strand: GAS
            </span>
          </div>

          <div className="h-72 w-full">
            {hasStrandData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={strandChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9', radius: 8 }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  />
                  <Bar dataKey="students" name="Students" radius={[6, 6, 0, 0]} maxBarSize={38}>
                    {strandChartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={STRAND_COLORS[index % STRAND_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
                <Award className="h-10 w-10 opacity-30" />
                <p className="text-sm font-bold">No strand data yet</p>
                <p className="text-xs font-medium text-center max-w-xs">Strand distribution will appear once SHS enrollment data is gathered.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Second Row: Dual-Mode Promotion Pie Chart + Section Adviser Table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Left 1 Col: Promotion Status Pie Chart */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PieChartIcon className="h-5 w-5 text-indigo-600" />
              <h3 className="text-base font-black text-slate-900">Promotion Standing</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium">Dual-mode automatic & manual promotion counts</p>
          </div>

          <div className="h-56 w-full my-2">
            {hasPromotionData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={promotionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {promotionData.map((entry, index) => (
                      <Cell key={`cell-promo-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                <PieChartIcon className="h-9 w-9 opacity-25" />
                <p className="text-xs font-bold">No promotion data yet</p>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {promotionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="text-slate-900">{item.value} students</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Cols: Teacher Adviser Roster & Section Capacity Matrix */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          
          <div>
            {/* Header & Search */}
            <div className="flex flex-col gap-4 p-5 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-indigo-600" />
                  Teacher Adviser Roster & Section Capacity Matrix
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Assigned Teacher Advisers & Section Capacity Limits (Admin Managed — No teacher login required)
                </p>
              </div>

              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search section or adviser..."
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Roster & Capacity Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-5">Grade Level</th>
                    <th className="py-3.5 px-5">Section Name</th>
                    <th className="py-3.5 px-5">Assigned Teacher Adviser</th>
                    <th className="py-3.5 px-5">Section Capacity Matrix</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredSections.length > 0 ? (
                    filteredSections.slice(0, 7).map((sec) => {
                      // Calculate section enrolled count vs capacity limit
                      const enrolledCount = students.filter(s => s.section_name === sec.section_name || s.section_id === sec.id).length || 0;
                      const maxCapacity = sec.capacity || 45;
                      const fillPct = Math.min(100, Math.round((enrolledCount / maxCapacity) * 100));

                      return (
                        <tr key={sec.id || sec.section_id || String(Math.random())} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-5 font-bold text-slate-800">
                            {sec.grade_name}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-indigo-600">
                            {sec.section_name}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-slate-800">
                            {sec.teacher_adviser_name ? (
                              <span className="flex items-center gap-1.5 text-slate-800 font-bold">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                {sec.teacher_adviser_name}
                              </span>
                            ) : (
                              <span className="text-amber-600 font-semibold italic">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="space-y-1 max-w-xs">
                              <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-slate-700">{enrolledCount} / {maxCapacity} enrolled</span>
                                <span className={fillPct >= 90 ? 'text-amber-600' : 'text-indigo-600'}>
                                  {fillPct}%
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    fillPct >= 95 ? 'bg-amber-500' : 'bg-indigo-600'
                                  }`}
                                  style={{ width: `${fillPct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            {(() => {
                              const secId = sec.section_id ?? sec.id;
                              const secStudents = students.filter(
                                (s) => s.section_id === secId || s.section_name === sec.section_name || s.section === sec.section_name
                              );
                              return (
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRosterSection(sec);
                                      setIsViewRosterModalOpen(true);
                                    }}
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs"
                                    title="View Enrolled Students in Section"
                                  >
                                    <Eye className="h-3.5 w-3.5 mr-1" /> Class Roster ({secStudents.length})
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditModal(sec)}
                                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 text-xs"
                                    title="Assign Teacher Adviser & Edit Capacity"
                                  >
                                    <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                                  </Button>
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                        No class sections found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-[#f8fafc] text-xs text-slate-500 font-semibold flex justify-between items-center">
            <span>Showing {Math.min(7, filteredSections.length)} of {sections.length} section records</span>
            <span className="text-indigo-600 font-bold">San Isidro NHS Academic Roster Matrix</span>
          </div>

        </div>

      </div>

      {/* Edit Teacher Adviser & Section Capacity Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Reassign Adviser & Capacity: ${selectedSection?.grade_name} — ${selectedSection?.section_name}`}
        size="sm"
      >
        <form onSubmit={handleSaveSection} className="space-y-4">
          {saveError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700">
              {saveError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between items-center">
              <span>Assigned Teacher Adviser Name <span className="text-red-500">*</span></span>
              {teachers.length > 0 && (
                <span className="text-[10px] text-indigo-600 font-bold">
                  {teachers.length} Registered Teachers Available
                </span>
              )}
            </label>

            {teachers.length > 0 && (
              <div className="mb-2">
                <select
                  value={adviserName}
                  onChange={(e) => {
                    if (e.target.value !== '__MANUAL__') {
                      setAdviserName(e.target.value);
                    }
                  }}
                  className="block w-full rounded-lg border border-indigo-200 bg-indigo-50/60 px-3 py-2 text-sm text-indigo-950 font-bold focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-2"
                >
                  <option value="">📋 Select Teacher from Faculty Roster...</option>
                  {teachers.map((t) => {
                    const tName = `${t.first_name} ${t.middle_name ? t.middle_name + ' ' : ''}${t.last_name}`;
                    return (
                      <option key={t.id || t.employee_id || tName} value={tName}>
                        {tName} ({t.subject || 'Faculty'}) {t.grade_level ? `• ${t.grade_level}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <input
              type="text"
              required
              value={adviserName}
              onChange={(e) => setAdviserName(e.target.value)}
              placeholder="Or type/search teacher name..."
              list="teacher_roster_list"
              className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            <datalist id="teacher_roster_list">
              {teachers.map((t) => {
                const tName = `${t.first_name} ${t.middle_name ? t.middle_name + ' ' : ''}${t.last_name}`;
                return <option key={t.id || t.employee_id || tName} value={tName} />;
              })}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Section Capacity Limit (Max Students)
            </label>
            <input
              type="number"
              min={10}
              max={60}
              value={capacityLimit}
              onChange={(e) => setCapacityLimit(Number(e.target.value))}
              className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Adviser & Capacity
            </Button>
          </div>
        </form>
      </Modal>

      {/* ENROLL NEW STUDENT MODAL */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title="Enroll New Student"
      >
        <StudentForm
          sections={sections}
          onSubmit={async (data) => {
            await addStudent(data);
            setIsEnrollModalOpen(false);
            await handleRefresh();
          }}
          onCancel={() => setIsEnrollModalOpen(false)}
        />
      </Modal>

      {/* VIEW SECTION ROSTER MODAL */}
      <Modal
        isOpen={isViewRosterModalOpen}
        onClose={() => {
          setIsViewRosterModalOpen(false);
          setSelectedRosterSection(null);
        }}
        title={`Class Section Roster: ${selectedRosterSection?.grade_name || ''} — ${selectedRosterSection?.section_name || ''}`}
      >
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Teacher Adviser</p>
              <h4 className="text-base font-bold text-slate-900 mt-0.5">
                {selectedRosterSection?.teacher_adviser_name || 'Unassigned'}
              </h4>
              <p className="text-xs text-slate-500">{selectedRosterSection?.grade_name}</p>
            </div>
            {(() => {
              const secId = selectedRosterSection?.section_id ?? selectedRosterSection?.id;
              const secStudents = students.filter(
                (s) =>
                  s.section_id === secId ||
                  s.section_name === selectedRosterSection?.section_name ||
                  s.section === selectedRosterSection?.section_name
              );
              return (
                <div className="text-right">
                  <span className="text-2xl font-black text-indigo-700">{secStudents.length}</span>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Enrolled Students</p>
                </div>
              );
            })()}
          </div>

          <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200">
            {(() => {
              const secId = selectedRosterSection?.section_id ?? selectedRosterSection?.id;
              const secStudents = students.filter(
                (s) =>
                  s.section_id === secId ||
                  s.section_name === selectedRosterSection?.section_name ||
                  s.section === selectedRosterSection?.section_name
              );

              if (secStudents.length === 0) {
                return (
                  <div className="p-8 text-center text-slate-500 text-xs font-medium">
                    No students currently enrolled in <span className="font-bold text-slate-700">{selectedRosterSection?.section_name}</span>.
                  </div>
                );
              }

              return (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Student LRN / ID</th>
                      <th className="py-2.5 px-3">Full Name</th>
                      <th className="py-2.5 px-3">Grade Level</th>
                      <th className="py-2.5 px-3 text-right">Guardian / Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {secStudents.map((std, idx) => (
                      <tr key={std.id || std.student_id || idx} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">
                          {std.student_number || std.student_id_number || std.student_id || 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {std.first_name} {std.middle_name ? std.middle_name + ' ' : ''}{std.last_name}
                        </td>
                        <td className="py-2.5 px-3">{std.grade_name || std.course || 'Basic Ed'}</td>
                        <td className="py-2.5 px-3 text-right text-slate-500">
                          {std.contact_number || std.guardian_name || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsViewRosterModalOpen(false);
                setSelectedRosterSection(null);
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

