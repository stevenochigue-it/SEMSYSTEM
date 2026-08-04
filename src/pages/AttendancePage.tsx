import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Search, Calendar, Filter, FileSpreadsheet, FileText, Printer, RefreshCw, LogIn, LogOut } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const STATUSES = ['All Statuses', 'ENTRY', 'EXIT'];

export const AttendancePage: React.FC = () => {
  const { attendance, sections, refreshData } = useData();

  const [searchTerm, setSearchTerm]     = useState('');
  const [filterDate, setFilterDate]     = useState('');
  const [filterGrade, setFilterGrade]   = useState('All Grades');
  const [filterSection, setFilterSection] = useState('All Sections');
  const [filterStatus, setFilterStatus] = useState('All Statuses');

  // Unique grade names from sections
  const gradeNames = ['All Grades', ...Array.from(new Set(sections.map(s => s.grade_name)))];
  const availableSections = filterGrade === 'All Grades'
    ? sections : sections.filter(s => s.grade_name === filterGrade);
  const sectionNames = ['All Sections', ...availableSections.map(s => s.section_name)];

  const filteredRecords = attendance.filter((r) => {
    const fullName = `${r.first_name ?? ''} ${r.last_name ?? ''}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      (r.student_number ?? '').toLowerCase().includes(searchTerm.toLowerCase());

    const logDate = r.scan_time ? r.scan_time.split('T')[0].split(' ')[0] : '';
    const matchesDate    = !filterDate || logDate === filterDate;
    const matchesGrade   = filterGrade === 'All Grades'     || r.grade_name   === filterGrade;
    const matchesSection = filterSection === 'All Sections' || r.section_name === filterSection;
    const matchesStatus  = filterStatus === 'All Statuses'  || r.status       === filterStatus;

    return matchesSearch && matchesDate && matchesGrade && matchesSection && matchesStatus;
  });

  const formatDateTime = (scanTime: string | undefined) => {
    if (!scanTime) return { date: '—', time: '—' };
    const d = new Date(scanTime);
    return {
      date: d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const exportToExcel = () => {
    const data = filteredRecords.map(r => {
      const { date, time } = formatDateTime(r.scan_time);
      return {
        'Student No.':  r.student_number,
        'Name':         `${r.last_name}, ${r.first_name}`,
        'Grade':        r.grade_name,
        'Section':      r.section_name,
        'Date':         date,
        'Time':         time,
        'Event':        r.status,
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gate Logs');
    XLSX.writeFile(wb, `gate_logs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF() as any;
    doc.text("Student Gate Monitoring — Gate Logs", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    doc.autoTable({
      head: [['Student No.', 'Name', 'Grade & Section', 'Date', 'Time', 'Event']],
      body: filteredRecords.map(r => {
        const { date, time } = formatDateTime(r.scan_time);
        return [
          r.student_number,
          `${r.last_name}, ${r.first_name}`,
          `${r.grade_name} — ${r.section_name}`,
          date, time, r.status,
        ];
      }),
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74] },
      styles: { fontSize: 8 },
    });
    doc.save(`gate_logs_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Gate Logs</h1>
          <p className="text-sm text-slate-500">View and export historical student gate entry & exit events.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refreshData()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel} className="font-bold text-slate-700">
            <FileSpreadsheet className="h-4 w-4 text-green-600" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF} className="font-bold text-slate-750">
            <FileText className="h-4 w-4 text-red-500" /> PDF
          </Button>
          <Button size="sm" onClick={() => window.print()} className="flex items-center gap-1.5">
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 no-print">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search ID or name..."
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>

          {/* Date */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Calendar className="h-4 w-4 text-slate-400" />
            </span>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>

          {/* Grade */}
          <div className="relative flex items-center">
            <Filter className="h-4 w-4 text-slate-400 absolute left-3 pointer-events-none" />
            <select value={filterGrade}
              onChange={e => { setFilterGrade(e.target.value); setFilterSection('All Sections'); }}
              className="block w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              {gradeNames.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Section */}
          <div className="relative flex items-center">
            <Filter className="h-4 w-4 text-slate-400 absolute left-3 pointer-events-none" />
            <select value={filterSection} onChange={e => setFilterSection(e.target.value)}
              className="block w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              {sectionNames.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Status */}
          <div className="relative flex items-center">
            <Filter className="h-4 w-4 text-slate-400 absolute left-3 pointer-events-none" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="block w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Print Header */}
      <div className="hidden print-only text-center my-6 space-y-1">
        <h1 className="text-xl font-bold text-slate-800">Student Gate Monitoring System</h1>
        <p className="text-sm font-bold text-slate-600 uppercase">Gate Logs Report</p>
        <p className="text-xs text-slate-500">Total records: {filteredRecords.length}</p>
      </div>

      {/* Table */}
      <Table headers={['Student No.', 'Name', 'Grade & Section', 'Date', 'Time', 'Event']}>
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => {
            const { date, time } = formatDateTime(record.scan_time);
            const isEntry = record.status === 'ENTRY';
            return (
              <TableRow key={record.log_id}>
                <TableCell className="font-semibold text-slate-800 font-mono">{record.student_number}</TableCell>
                <TableCell className="font-bold text-slate-700">
                  {record.last_name}, {record.first_name}
                  {record.middle_name ? ` ${record.middle_name}` : ''}
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  <span className="flex flex-col gap-0.5">
                    <span className="font-semibold">{record.grade_name}</span>
                    <span className="text-slate-400">{record.section_name}</span>
                  </span>
                </TableCell>
                <TableCell className="text-xs text-slate-500">{date}</TableCell>
                <TableCell className="font-semibold text-slate-700">{time}</TableCell>
                <TableCell>
                  <Badge variant={isEntry ? 'success' : 'secondary'} className="flex items-center gap-1 w-fit">
                    {isEntry ? <LogIn className="h-3 w-3" /> : <LogOut className="h-3 w-3" />}
                    {record.status}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-10 text-slate-400">
              No gate log records found.
            </TableCell>
          </TableRow>
        )}
      </Table>
    </div>
  );
};
