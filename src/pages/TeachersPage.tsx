import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import type { Teacher } from '../types';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import {
  UserCheck,
  UserPlus,
  Search,
  BookOpen,
  Phone,
  Edit2,
  Trash2,
  AlertCircle,
  GraduationCap,
  Users,
  CheckCircle2,
  XCircle,
  Filter,
  Eye,
} from 'lucide-react';

export const TeachersPage: React.FC = () => {
  const { teachers, sections, students, addTeacher, updateTeacher, deleteTeacher } = useData();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewClassModalOpen, setIsViewClassModalOpen] = useState(false);

  // Active Teacher for Edit / Delete / View Class
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    employee_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    subject: 'Mathematics',
    grade_level: 'Grade 7',
    section_advisory: '',
    contact_number: '',
    email: '',
    status: 'active' as 'active' | 'on_leave' | 'inactive',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form
  const resetForm = () => {
    setFormData({
      employee_id: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      subject: 'Mathematics',
      grade_level: 'Grade 7',
      section_advisory: '',
      contact_number: '',
      email: '',
      status: 'active',
    });
    setFormError(null);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (t: Teacher) => {
    setSelectedTeacher(t);
    setFormData({
      employee_id: t.employee_id || '',
      first_name: t.first_name || '',
      middle_name: t.middle_name || '',
      last_name: t.last_name || '',
      subject: t.subject || 'Mathematics',
      grade_level: t.grade_level || 'Grade 7',
      section_advisory: t.section_advisory || '',
      contact_number: t.contact_number || '',
      email: t.email || '',
      status: (t.status as 'active' | 'on_leave' | 'inactive') || 'active',
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (t: Teacher) => {
    setSelectedTeacher(t);
    setIsDeleteModalOpen(true);
  };

  // Create
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setFormError('First Name and Last Name are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await addTeacher({
        employee_id: formData.employee_id.trim() || undefined,
        first_name: formData.first_name.trim(),
        middle_name: formData.middle_name.trim() || undefined,
        last_name: formData.last_name.trim(),
        subject: formData.subject,
        grade_level: formData.grade_level,
        section_advisory: formData.section_advisory.trim() || undefined,
        contact_number: formData.contact_number.trim() || undefined,
        email: formData.email.trim() || undefined,
        status: formData.status,
      });
      setIsAddModalOpen(false);
      resetForm();
    } catch (err) {
      setFormError('Failed to add teacher. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update
  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedTeacher || !selectedTeacher.id) return;
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setFormError('First Name and Last Name are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateTeacher(selectedTeacher.id, {
        employee_id: formData.employee_id.trim() || undefined,
        first_name: formData.first_name.trim(),
        middle_name: formData.middle_name.trim() || undefined,
        last_name: formData.last_name.trim(),
        subject: formData.subject,
        grade_level: formData.grade_level,
        section_advisory: formData.section_advisory.trim() || undefined,
        contact_number: formData.contact_number.trim() || undefined,
        email: formData.email.trim() || undefined,
        status: formData.status,
      });
      setIsEditModalOpen(false);
      setSelectedTeacher(null);
      resetForm();
    } catch (err) {
      setFormError('Failed to update teacher. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete
  const handleDeleteTeacher = async () => {
    if (!selectedTeacher || !selectedTeacher.id) return;
    try {
      setIsSubmitting(true);
      await deleteTeacher(selectedTeacher.id);
      setIsDeleteModalOpen(false);
      setSelectedTeacher(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtering
  const filteredTeachers = teachers.filter((t) => {
    const fullName = `${t.first_name} ${t.middle_name || ''} ${t.last_name}`.toLowerCase();
    const empId = (t.employee_id || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch =
      fullName.includes(query) ||
      empId.includes(query) ||
      (t.subject || '').toLowerCase().includes(query);

    // Dynamically resolve grade from matched section (same logic as table rendering)
    const tFullName = `${t.first_name} ${t.middle_name ? t.middle_name + ' ' : ''}${t.last_name}`;
    const matchedSection =
      sections.find(
        (sec) =>
          sec.teacher_adviser_name &&
          (sec.teacher_adviser_name.toLowerCase() === tFullName.toLowerCase() ||
            sec.teacher_adviser_name.toLowerCase() === `${t.first_name} ${t.last_name}`.toLowerCase() ||
            (t.employee_id &&
              sec.teacher_adviser_name.toLowerCase() === t.employee_id.toLowerCase()))
      ) ||
      // Fallback: match by the teacher's own section_advisory field against section name
      (t.section_advisory
        ? sections.find((sec) => sec.section_name === t.section_advisory)
        : undefined);
    const effectiveGrade = matchedSection ? matchedSection.grade_name : t.grade_level || '';

    const matchesGrade = gradeFilter === 'all' || effectiveGrade === gradeFilter;

    return matchesSearch && matchesGrade;
  });

  // Statistics
  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter((t) => t.status === 'active' || !t.status).length;
  const inactiveTeachers = teachers.filter((t) => t.status === 'inactive' || t.status === 'on_leave').length;
  const advisersCount = teachers.filter((t) => Boolean(t.section_advisory && t.section_advisory.trim() !== '')).length;

  const subjectOptions = [
    'Mathematics',
    'Science',
    'English',
    'Filipino',
    'Araling Panlipunan (AP)',
    'MAPEH',
    'Technology and Livelihood Education (TLE)',
    'Edukasyon sa Pagpapakakatao (EsP)',
    'Research / ICT',
    'Senior High Core / Specialized',
  ];

  const gradeOptions = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <UserCheck className="h-5 w-5" />
            </div>
            Teachers & Faculty Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage school teaching personnel, grade assignments, and advisory sections.
          </p>
        </div>

        <Button onClick={handleOpenAddModal} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
          <UserPlus className="h-4 w-4" />
          Add New Teacher
        </Button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Teachers</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{totalTeachers}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Faculty members</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Staff</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{activeTeachers}</h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Teaching currently</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inactive / On Leave</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{inactiveTeachers}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Temporarily unavailable</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Section Advisers</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{advisersCount}</h3>
            <p className="text-[11px] text-indigo-600 font-medium mt-0.5">Assigned to sections</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, employee ID, subject..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Grade Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-500 shrink-0">Filter Grade:</span>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-700 font-medium"
          >
            <option value="all">All Grade Levels</option>
            {gradeOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Teachers Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredTeachers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mx-auto mb-4">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Teachers Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {teachers.length === 0
                ? "You haven't added any teachers yet. Click 'Add New Teacher' above to start adding your faculty members."
                : 'No teachers match your search query or selected grade filter.'}
            </p>
            {teachers.length === 0 && (
              <Button onClick={handleOpenAddModal} className="mt-4 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl">
                + Add First Teacher
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Employee ID & Name</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Grade Assignment</th>
                  <th className="py-3.5 px-4">Section Advisory</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredTeachers.map((t) => {
                  const fullName = `${t.first_name} ${t.middle_name ? t.middle_name + ' ' : ''}${t.last_name}`;
                  const matchedSection =
                    sections.find(
                      (sec) =>
                        sec.teacher_adviser_name &&
                        (sec.teacher_adviser_name.toLowerCase() === fullName.toLowerCase() ||
                          sec.teacher_adviser_name.toLowerCase() === `${t.first_name} ${t.last_name}`.toLowerCase() ||
                          (t.employee_id && sec.teacher_adviser_name.toLowerCase() === t.employee_id.toLowerCase()))
                    ) ||
                    // Fallback: match by teacher's own section_advisory against section name
                    (t.section_advisory
                      ? sections.find((sec) => sec.section_name === t.section_advisory)
                      : undefined);
                  const advisoryName = t.section_advisory || matchedSection?.section_name;
                  const gradeName = matchedSection ? matchedSection.grade_name : (t.grade_level || 'Faculty');
                  return (
                    <tr key={t.id || t.employee_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold uppercase text-xs shrink-0">
                            {t.first_name[0]}
                            {t.last_name[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{fullName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {t.employee_id || 'ID Pending'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                          <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                          {t.subject || 'General'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs font-semibold text-slate-700">{gradeName}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        {advisoryName ? (() => {
                          const classStudents = students.filter(
                            (s) => (s.section_name || s.section) === advisoryName
                          );
                          return (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                                <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
                                {advisoryName} ({classStudents.length})
                              </span>
                              <button
                                onClick={() => {
                                  setViewingTeacher({ ...t, section_advisory: advisoryName });
                                  setIsViewClassModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                title="View Class List"
                              >
                                <Eye className="h-3 w-3" />
                                View Class
                              </button>
                            </div>
                          );
                        })() : (
                          <span className="text-xs text-slate-400 italic">None assigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        {t.contact_number ? (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {t.contact_number}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {t.status === 'active' || !t.status ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : t.status === 'on_leave' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            On Leave
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(t)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Teacher"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(t)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Teacher"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD TEACHER MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Teacher">
        <form onSubmit={handleCreateTeacher} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Juan"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Middle Name</label>
              <input
                type="text"
                value={formData.middle_name}
                onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                placeholder="Santos"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Dela Cruz"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Employee / Teacher ID</label>
              <input
                type="text"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                placeholder="TCH-2026-001"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Primary Subject</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {subjectOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-100 text-xs text-blue-800 flex items-center gap-2 font-medium">
            <BookOpen className="h-4 w-4 shrink-0 text-blue-600" />
            <span>Advisory Section and Grade Level are automatically linked when you assign this teacher to a section on the <strong>Enrollment Dashboard</strong>.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Number</label>
              <input
                type="text"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                placeholder="09123456789"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white hover:bg-blue-700">
              {isSubmitting ? 'Saving...' : 'Save Teacher'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT TEACHER MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Teacher Information">
        <form onSubmit={handleUpdateTeacher} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Middle Name</label>
              <input
                type="text"
                value={formData.middle_name}
                onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Employee / Teacher ID</label>
              <input
                type="text"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Primary Subject</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {subjectOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-100 text-xs text-blue-800 flex items-center gap-2 font-medium">
            <BookOpen className="h-4 w-4 shrink-0 text-blue-600" />
            <span>Advisory Section and Grade Level are automatically linked when you assign this teacher on the <strong>Enrollment Dashboard</strong>.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Number</label>
              <input
                type="text"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white hover:bg-blue-700">
              {isSubmitting ? 'Updating...' : 'Update Teacher'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <div>
              <p className="font-bold">Are you sure you want to delete this teacher?</p>
              <p className="text-[11px] text-rose-600 mt-0.5">
                {selectedTeacher?.first_name} {selectedTeacher?.last_name} ({selectedTeacher?.employee_id || 'No ID'}) will be permanently removed.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeleteTeacher} disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-700 text-white">
              {isSubmitting ? 'Deleting...' : 'Yes, Delete Teacher'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* VIEW ADVISORY CLASS LIST MODAL */}
      <Modal
        isOpen={isViewClassModalOpen}
        onClose={() => {
          setIsViewClassModalOpen(false);
          setViewingTeacher(null);
        }}
        title={`Advisory Class List: ${viewingTeacher?.section_advisory || ''}`}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Teacher Adviser</p>
              <h4 className="text-base font-bold text-slate-900 mt-0.5">
                {viewingTeacher?.first_name} {viewingTeacher?.middle_name ? viewingTeacher.middle_name + ' ' : ''}{viewingTeacher?.last_name}
              </h4>
              <p className="text-xs text-slate-500">{viewingTeacher?.subject} ({viewingTeacher?.grade_level || 'Faculty'})</p>
            </div>
            {(() => {
              const classList = students.filter(
                (s) => (s.section_name || s.section) === viewingTeacher?.section_advisory
              );
              return (
                <div className="text-right">
                  <span className="text-2xl font-black text-blue-700">{classList.length}</span>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Enrolled Students</p>
                </div>
              );
            })()}
          </div>

          <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200">
            {(() => {
              const classList = students.filter(
                (s) => (s.section_name || s.section) === viewingTeacher?.section_advisory
              );

              if (classList.length === 0) {
                return (
                  <div className="p-8 text-center text-slate-500 text-xs font-medium">
                    No students enrolled in section <span className="font-bold text-slate-700">{viewingTeacher?.section_advisory}</span> yet.
                  </div>
                );
              }

              return (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Student LRN / ID</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Grade Level</th>
                      <th className="py-2.5 px-3 text-right">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {classList.map((std, idx) => (
                      <tr key={std.id || std.student_id || idx} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
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
                setIsViewClassModalOpen(false);
                setViewingTeacher(null);
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
