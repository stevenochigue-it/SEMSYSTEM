import React, { useState, useEffect } from 'react';
import type { Student, Section } from '../../types';
import { Button } from '../ui/Button';
import { Upload, X, User } from 'lucide-react';

interface StudentFormProps {
  student?: Student | null;
  sections: Section[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const StudentForm: React.FC<StudentFormProps> = ({ student, sections, onSubmit, onCancel }) => {
  const [studentNumber, setStudentNumber] = useState('');
  const [firstName, setFirstName]         = useState('');
  const [middleName, setMiddleName]       = useState('');
  const [lastName, setLastName]           = useState('');
  const [sectionId, setSectionId]         = useState<number>(sections[0]?.section_id ?? 0);
  const [photo, setPhoto]                 = useState('');
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setStudentNumber(student.student_number);
      setFirstName(student.first_name);
      setMiddleName(student.middle_name || '');
      setLastName(student.last_name);
      setSectionId(student.section_id ?? sections[0]?.section_id ?? 0);
      setPhoto(student.photo || '');
    } else {
      const yr = new Date().getFullYear();
      const rand = String(Math.floor(1000 + Math.random() * 9000));
      setStudentNumber(`${yr}${rand}`);
      if (sections.length > 0) setSectionId(sections[0].section_id);
    }
  }, [student, sections]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!studentNumber.trim() || !firstName.trim() || !lastName.trim() || !sectionId) {
      setError('Please fill in all required fields (Student Number, First Name, Last Name, Section).');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        student_number: studentNumber.trim(),
        first_name:     firstName.trim(),
        middle_name:    middleName.trim() || undefined,
        last_name:      lastName.trim(),
        section_id:     sectionId,
        photo:          photo || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group sections by grade level for <optgroup>
  const grouped: Record<string, Section[]> = {};
  sections.forEach(s => {
    if (!grouped[s.grade_name]) grouped[s.grade_name] = [];
    grouped[s.grade_name].push(s);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700">{error}</div>
      )}

      {/* Photo upload */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          {photo ? (
            <div className="relative">
              <img src={photo} alt="Preview" className="w-24 h-24 object-cover rounded-full border border-slate-200 shadow-sm" />
              <button type="button" onClick={() => setPhoto('')}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
              <User className="w-8 h-8" />
              <span className="text-[10px] font-bold mt-1 uppercase">Photo</span>
            </div>
          )}
        </div>
        <label className="cursor-pointer rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5" /> Upload Photo
          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Student Number */}
        <div className="col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Student Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text" required value={studentNumber}
            onChange={e => setStudentNumber(e.target.value)}
            placeholder="e.g. 2025001"
            className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* First Name */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text" required value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="e.g. Juan"
            className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text" required value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="e.g. Dela Cruz"
            className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Middle Name */}
        <div className="col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Middle Name / Initial <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text" value={middleName}
            onChange={e => setMiddleName(e.target.value)}
            placeholder="e.g. G. or Gomez"
            className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Section dropdown (grouped by grade level) */}
        <div className="col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Grade Level & Section <span className="text-red-500">*</span>
          </label>
          <select
            value={sectionId}
            onChange={e => setSectionId(Number(e.target.value))}
            className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {Object.entries(grouped).map(([gradeName, sects]) => (
              <optgroup key={gradeName} label={gradeName}>
                {sects.map(s => (
                  <option key={s.section_id} value={s.section_id}>
                    {gradeName} â€” {s.section_name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting}>
          {student ? 'Save Changes' : 'Register Student'}
        </Button>
      </div>
    </form>
  );
};


