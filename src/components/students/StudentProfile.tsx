import React from 'react';
import type { Student, GateLog } from '../../types';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { User, ShieldAlert, GraduationCap, Clock, Calendar, LogIn, LogOut } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface StudentProfileProps {
  student: Student;
  attendanceHistory: GateLog[];
}

export const StudentProfile: React.FC<StudentProfileProps> = ({ student, attendanceHistory }) => {
  // Get most recent gate logs for this student's QR
  const recentLogs = attendanceHistory
    .filter(r => r.qr_id === student.qr_id || r.student_number === student.student_number)
    .slice(0, 5);

  const qrValue = student.qr_value ?? `STU-${student.student_number}`;

  return (
    <div className="space-y-6">
      {/* Bio Information */}
      <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left md:items-start md:gap-6 border-b border-slate-100 pb-6">
        {student.photo ? (
          <img
            src={student.photo}
            alt={`${student.first_name} ${student.last_name}`}
            className="w-24 h-24 object-cover rounded-2xl border border-slate-200 shadow-sm"
          />
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-slate-400">
            <User className="w-8 h-8" />
            <span className="text-[10px] font-bold uppercase mt-1">Photo</span>
          </div>
        )}
        <div className="flex-1 space-y-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <h2 className="text-xl font-extrabold text-slate-800">
              {student.first_name} {student.middle_name ? `${student.middle_name} ` : ''}{student.last_name}
            </h2>
            <Badge variant={student.last_status === 'ENTRY' ? 'success' : 'secondary'} className="self-center md:self-auto">
              {student.last_status === 'ENTRY' ? 'Currently Inside' : 'Outside School'}
            </Badge>
          </div>
          <p className="text-sm font-bold text-blue-600 font-mono">LRN: {student.student_number}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-550 font-medium">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-slate-400" />
              <span>{student.grade_name} — {student.section_name}</span>
            </div>
            {student.created_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Enrolled: {student.created_at?.split('T')[0] ?? student.created_at}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code & Recent History */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* QR Display */}
        <div className="md:col-span-2 flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Student QR Code</p>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <QRCodeSVG value={qrValue} size={120} level="M" includeMargin={false} />
          </div>
          <p className="text-[10px] text-slate-400 font-bold tracking-wider mt-3 uppercase">
            {qrValue}
          </p>
        </div>

        {/* History Log */}
        <div className="md:col-span-3 space-y-3.5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Gate Logs</h3>
          <div className="space-y-2">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => {
                const isEntry = log.status === 'ENTRY';
                const dateStr = log.scan_time ? new Date(log.scan_time).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : '—';
                const timeStr = log.scan_time ? new Date(log.scan_time).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '—';
                return (
                  <Card key={log.log_id} className="p-3.5 border-slate-100 hover:border-slate-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isEntry
                          ? <LogIn className="h-4 w-4 text-blue-500" />
                          : <LogOut className="h-4 w-4 text-orange-400" />}
                        <Badge variant={isEntry ? 'success' : 'secondary'} className="text-[10px]">
                          {log.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{dateStr}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{timeStr}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400">
                <ShieldAlert className="h-6 w-6 text-slate-400 mb-1" />
                <p className="text-xs font-semibold">No gate logs recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


