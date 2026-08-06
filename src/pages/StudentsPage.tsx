import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { StudentTable } from '../components/students/StudentTable';
import { StudentForm } from '../components/students/StudentForm';
import { StudentProfile } from '../components/students/StudentProfile';
import { QRCard } from '../components/students/QRCard';
import { ExcelImportModal } from '../components/students/ExcelImportModal';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Search, Plus, Filter, RefreshCw, FileUp } from 'lucide-react';
import type { Student } from '../types';

export const StudentsPage: React.FC = () => {
  const { students, attendance, sections, addStudent, updateStudent, deleteStudent, refreshData } = useData();

  // Search & Filter state
  const [searchTerm, setSearchTerm]       = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All Grades');
  const [selectedSection, setSelectedSection] = useState('All Sections');

  // Modal states
  const [formOpen, setFormOpen]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [qrOpen, setQrOpen]         = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

  const handleFormSubmit = async (data: any) => {
    if (currentStudent) {
      await updateStudent(currentStudent.id || currentStudent.student_id || '', data);
    } else {
      await addStudent(data);
    }
    setFormOpen(false);
    setCurrentStudent(null);
  };

  const handleDelete = async (student: Student) => {
    if (window.confirm(`Are you sure you want to delete ${student.first_name} ${student.last_name}? This action cannot be undone.`)) {
      await deleteStudent(student.id || student.student_id || '');
    }
  };

  // Unique grade names for filter
  const gradeNames = ['All Grades', ...Array.from(new Set(sections.map(s => s.grade_name)))];

  // Sections filtered by selected grade (for section filter dropdown)
  const availableSections = selectedGrade === 'All Grades'
    ? sections
    : sections.filter(s => s.grade_name === selectedGrade);

  const sectionNames = ['All Sections', ...availableSections.map(s => s.section_name)];

  // Filter students
  const filteredStudents = students.filter((s) => {
    const fullName = `${s.first_name} ${s.middle_name ?? ''} ${s.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      s.student_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGrade   = selectedGrade === 'All Grades'   || s.grade_name   === selectedGrade;
    const matchesSection = selectedSection === 'All Sections' || s.section_name === selectedSection;

    return matchesSearch && matchesGrade && matchesSection;
  });

  return (
    <div className="space-y-6">

      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Student Records</h1>
          <p className="text-sm text-slate-500">Manage student profiles, view gate status, and generate QR entry codes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" onClick={() => refreshData()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline" size="md"
            onClick={() => setImportOpen(true)}
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <FileUp className="h-4 w-4" />
            Import Excel
          </Button>
          <Button
            onClick={() => { setCurrentStudent(null); setFormOpen(true); }}
            className="shadow-md"
          >
            <Plus className="h-4 w-4" />
            Add New Student
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by LRN or name..."
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Grade filter */}
          <div className="relative flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={selectedGrade}
              onChange={e => { setSelectedGrade(e.target.value); setSelectedSection('All Sections'); }}
              className="block w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {gradeNames.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Section filter */}
          <div className="relative flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="block w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {sectionNames.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Count */}
          <div className="flex items-center justify-end text-xs font-bold text-slate-500 pr-2">
            Showing {filteredStudents.length} of {students.length} students
          </div>
        </div>
      </Card>

      {/* Table */}
      <StudentTable
        students={filteredStudents}
        onViewProfile={student => { setCurrentStudent(student); setProfileOpen(true); }}
        onViewQR={student => { setCurrentStudent(student); setQrOpen(true); }}
        onEdit={student => { setCurrentStudent(student); setFormOpen(true); }}
        onDelete={handleDelete}
      />

      {/* â”€â”€ Modals â”€â”€ */}

      {/* 1. Register / Edit Student */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)}
        title={currentStudent ? 'Edit Student Details' : 'Register New Student'} size="md">
        <StudentForm
          student={currentStudent}
          sections={sections}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      {/* 2. Student Profile */}
      <Modal isOpen={profileOpen} onClose={() => setProfileOpen(false)}
        title="Student Information Profile" size="lg">
        {currentStudent && (
          <StudentProfile student={currentStudent} attendanceHistory={attendance} />
        )}
      </Modal>

      {/* 3. QR Code Card */}
      <Modal isOpen={qrOpen} onClose={() => setQrOpen(false)}
        title="Printable QR Code Card" size="sm">
        {currentStudent && <QRCard student={currentStudent} />}
      </Modal>

      {/* 4. Excel Bulk Import */}
      <Modal isOpen={importOpen} onClose={() => setImportOpen(false)}
        title="Import Students from Excel" size="xl">
        <ExcelImportModal
          sections={sections}
          onClose={() => setImportOpen(false)}
          onSuccess={() => refreshData()}
        />
      </Modal>

    </div>
  );
};


