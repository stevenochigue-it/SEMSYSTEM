import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  FileText,
  Calendar,
  Layers,
  Search,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Award,
  AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

type ReportTab = 'daily' | 'weekly' | 'monthly' | 'student';

export const ReportsPage: React.FC = () => {
  const { attendance, students } = useData();
  const [activeTab, setActiveTab] = useState<ReportTab>('daily');

  // Student specific history state
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentNumber, setSelectedStudentNumber] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper date calculations
  const getPastDateStr = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  // Filter lists based on tab
  const getReportRecords = () => {
    switch (activeTab) {
      case 'daily':
        return attendance.filter(r => r.date === todayStr);
      case 'weekly':
        const pastWeek = getPastDateStr(7);
        return attendance.filter(r => (r.date ?? '') >= pastWeek);
      case 'monthly':
        const pastMonth = getPastDateStr(30);
        return attendance.filter(r => (r.date ?? '') >= pastMonth);
      case 'student':
        return attendance.filter(r => r.student_number === selectedStudentNumber);
      default:
        return [];
    }
  };

  const currentRecords = getReportRecords();

  // Aggregate stats
  const uniqueStudents = Array.from(new Set(currentRecords.map(r => r.student_number))).length;
  const totalEntries = currentRecords.filter(r => r.time_in).length;
  const totalExits = currentRecords.filter(r => r.time_out).length;

  // Search filtered student selection list
  const filteredStudentList = students.filter(s => {
    if (!studentSearch) return false;
    const q = studentSearch.toLowerCase();
    return (
      s.first_name.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q) ||
      s.student_number.toLowerCase().includes(q)
    );
  }).slice(0, 5);

  const selectedStudentObj = students.find(s => s.student_number === selectedStudentNumber);

  // Recharts aggregation helper
  const getAggregatedChartData = () => {
    const map: Record<string, { date: string; entries: number; exits: number }> = {};
    currentRecords.forEach(r => {
      const d = r.date || 'Unknown';
      if (!map[d]) {
        map[d] = { date: d, entries: 0, exits: 0 };
      }
      if (r.time_in) map[d].entries++;
      if (r.time_out) map[d].exits++;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  };

  const chartData = getAggregatedChartData();

  // Export to Excel function
  const exportExcel = () => {
    const data = currentRecords.map(r => ({
      'Student No.': r.student_number,
      'Student Name': r.student_name || '',
      'Course': r.course || '',
      'Year Level': r.year_level || '',
      'Date': r.date,
      'Time In': r.time_in || 'N/A',
      'Time Out': r.time_out || 'N/A',
      'Status': r.status === 'inside' ? 'Inside' : 'Outside',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `${activeTab}_attendance_report_${todayStr}.xlsx`);
  };

  // Export to PDF function
  const exportPDF = () => {
    const doc = new jsPDF() as any;
    doc.text(`San Isidro National High School - ${activeTab.toUpperCase()} Attendance Report`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Period / Selected: ${activeTab === 'student' && selectedStudentObj ? selectedStudentObj.first_name + ' ' + selectedStudentObj.last_name : activeTab.toUpperCase()}`, 14, 21);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);

    const headers = [['Student ID', 'Student Name', 'Course & Year', 'Date', 'Time In', 'Time Out', 'Status']];
    const rows = currentRecords.map(r => [
      r.student_number,
      r.student_name || '',
      `${r.course} - ${r.year_level}`,
      r.date,
      r.time_in || 'N/A',
      r.time_out || 'N/A',
      r.status === 'inside' ? 'Inside' : 'Outside',
    ]);

    doc.autoTable({
      head: headers,
      body: rows,
      startY: 33,
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74] }, // green header
    });

    doc.save(`${activeTab}_attendance_report_${todayStr}.pdf`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Attendance Reports</h1>
          <p className="text-sm text-slate-500">Generate, print, and export gate entrance analytics summaries.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportExcel} disabled={currentRecords.length === 0} className="flex items-center gap-1.5 font-bold text-slate-700">
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={currentRecords.length === 0} className="flex items-center gap-1.5 font-bold text-slate-700">
            <FileText className="h-4 w-4 text-red-500" />
            PDF
          </Button>
          <Button size="sm" onClick={() => window.print()} disabled={currentRecords.length === 0} className="flex items-center gap-1.5">
            <Printer className="h-4 w-4" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Tabs list navigation */}
      <div className="flex border-b border-slate-200 gap-2 no-print">
        {(['daily', 'weekly', 'monthly', 'student'] as ReportTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-600 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-650'
            }`}
          >
            {tab === 'student' ? 'Student History' : `${tab} Report`}
          </button>
        ))}
      </div>

      {/* Student history search bar panel */}
      {activeTab === 'student' && (
        <Card className="p-4 no-print space-y-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Search student name or number..."
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Matches dropdown list */}
          {filteredStudentList.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100 shadow-md">
              {filteredStudentList.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedStudentNumber(s.student_number);
                    setStudentSearch('');
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span>{s.first_name} {s.last_name} ({s.student_number})</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              ))}
            </div>
          )}

          {/* Selected Student profile info */}
          {selectedStudentObj && (
            <div className="flex items-center gap-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 text-xs text-slate-700">
              <Award className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-extrabold text-slate-800 uppercase">{selectedStudentObj.first_name} {selectedStudentObj.last_name}</p>
                <p className="mt-1">ID: {selectedStudentObj.student_number} • Course: {selectedStudentObj.course} • Section: {selectedStudentObj.section}</p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Grid: Overview Stats */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Card className="bg-emerald-50/20 border border-emerald-100/50">
          <div className="flex items-center justify-between p-2">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unique Students Scanned</p>
              <h3 className="text-2xl font-extrabold text-slate-850 mt-1">{uniqueStudents}</h3>
            </div>
            <FileText className="h-6 w-6 text-emerald-600" />
          </div>
        </Card>

        <Card className="bg-blue-55/20 border border-blue-100/50">
          <div className="flex items-center justify-between p-2">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Entry Scans</p>
              <h3 className="text-2xl font-extrabold text-slate-850 mt-1">{totalEntries}</h3>
            </div>
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
        </Card>

        <Card className="bg-indigo-55/20 border border-indigo-100/50">
          <div className="flex items-center justify-between p-2">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Exit Scans</p>
              <h3 className="text-2xl font-extrabold text-slate-850 mt-1">{totalExits}</h3>
            </div>
            <Layers className="h-6 w-6 text-indigo-600" />
          </div>
        </Card>
      </div>

      {/* Main Graphs & Logs Table */}
      {currentRecords.length > 0 ? (
        <div className="space-y-6">
          {/* Aggregated charts for Daily/Weekly/Monthly */}
          {activeTab !== 'student' && chartData.length > 0 && (
            <Card className="no-print">
              <CardHeader>
                <CardTitle>Attendance Distribution</CardTitle>
                <CardDescription>Graphic analysis of student gate scanner actions over time.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 550 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 550 }} />
                      <Tooltip />
                      <Bar dataKey="entries" name="Entries" fill="#16a34a" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="exits" name="Exits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table list */}
          <Table headers={['Student ID', 'Student Name', 'Course & Year', 'Date', 'Time In', 'Time Out', 'Status']}>
            {currentRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-semibold text-slate-805">{record.student_number}</TableCell>
                <TableCell className="font-bold text-slate-700">{record.student_name}</TableCell>
                <TableCell className="text-xs text-slate-550">{record.course} — {record.year_level}</TableCell>
                <TableCell className="text-xs text-slate-500">{record.date}</TableCell>
                <TableCell className="font-semibold">{record.time_in || 'N/A'}</TableCell>
                <TableCell className="font-semibold">{record.time_out || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={record.status === 'inside' ? 'success' : 'secondary'}>
                    {record.status === 'inside' ? 'Inside' : 'Outside'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 rounded-2xl text-center text-slate-400">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p className="text-sm font-bold text-slate-700">No records found</p>
          <p className="text-xs mt-1">Please configure your filter criteria or search query.</p>
        </div>
      )}

    </div>
  );
};
