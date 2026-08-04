import React from 'react';
import type { Student } from '../../types';
import { Table, TableRow, TableCell } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { User, Eye, QrCode, Edit, Trash2 } from 'lucide-react';

interface StudentTableProps {
  students: Student[];
  onViewProfile: (student: Student) => void;
  onViewQR: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students, onViewProfile, onViewQR, onEdit, onDelete,
}) => {
  return (
    <Table headers={['Photo', 'Student No.', 'Full Name', 'Grade & Section', 'Status', 'Actions']}>
      {students.length > 0 ? (
        students.map((student) => (
          <TableRow key={student.student_id}>
            {/* Photo */}
            <TableCell>
              {student.photo ? (
                <img src={student.photo} alt={student.first_name}
                  className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                  <User className="w-5 h-5" />
                </div>
              )}
            </TableCell>

            {/* Student Number */}
            <TableCell className="font-semibold text-slate-800 font-mono">
              {student.student_number}
            </TableCell>

            {/* Full Name */}
            <TableCell className="font-bold text-slate-700">
              {student.last_name}, {student.first_name}
              {student.middle_name ? ` ${student.middle_name}` : ''}
            </TableCell>

            {/* Grade & Section */}
            <TableCell className="text-xs text-slate-600">
              <span className="inline-flex flex-col gap-0.5">
                <span className="font-semibold text-slate-700">{student.grade_name}</span>
                <span className="text-slate-400">{student.section_name}</span>
              </span>
            </TableCell>

            {/* Status (last gate log) */}
            <TableCell>
              <Badge variant={student.last_status === 'ENTRY' ? 'success' : 'secondary'}>
                {student.last_status === 'ENTRY' ? '🟢 Inside' : '⚪ Outside'}
              </Badge>
            </TableCell>

            {/* Actions */}
            <TableCell>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" title="View Profile" onClick={() => onViewProfile(student)}>
                  <Eye className="w-4 h-4 text-slate-500" />
                </Button>
                <Button variant="outline" size="sm" title="Generate/Print QR Code" onClick={() => onViewQR(student)}>
                  <QrCode className="w-4 h-4 text-emerald-600" />
                </Button>
                <Button variant="outline" size="sm" title="Edit Student" onClick={() => onEdit(student)}>
                  <Edit className="w-4 h-4 text-blue-600" />
                </Button>
                <Button variant="outline" size="sm" title="Delete Student" onClick={() => onDelete(student)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-10 text-slate-400">
            No student records found. Add a new student to get started.
          </TableCell>
        </TableRow>
      )}
    </Table>
  );
};
