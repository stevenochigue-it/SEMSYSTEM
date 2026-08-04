import React, { useRef } from 'react';
import type { Student } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { UserCheck, ShieldCheck, Printer } from 'lucide-react';
import { Button } from '../ui/Button';
import { useReactToPrint } from 'react-to-print';

interface QRCardProps {
  student: Student;
}

export const QRCard: React.FC<QRCardProps> = ({ student }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: cardRef,
  });

  return (
    <div className="flex flex-col items-center gap-5">
      
      {/* Printable ID Card Container */}
      <div className="border border-slate-200 bg-slate-55 p-3 rounded-2xl shadow-sm">
        <div
          ref={cardRef}
          className="relative w-[340px] h-[480px] bg-white border border-slate-350 shadow-lg rounded-2xl flex flex-col justify-between overflow-hidden p-6 font-sans text-slate-800"
          style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
        >
          {/* Card Header branding */}
          <div className="flex items-center gap-2.5 pb-3 border-b-2 border-blue-600">
            <img
              src="/school-logo.jpg"
              alt="SINHS Logo"
              className="h-11 w-11 shrink-0 rounded-xl object-cover border-2 border-blue-500"
            />
            <div>
              <h2 className="text-[11px] font-extrabold tracking-wider text-blue-800 uppercase leading-tight">
                San Isidro National High School
              </h2>
              <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mt-1">
                Student Access Card
              </p>
            </div>
          </div>

          {/* Student Info Details */}
          <div className="flex-1 flex flex-col items-center justify-center my-4 gap-4">
            
            {/* Student Photo */}
            <div className="relative">
              {student.photo ? (
                <img
                  src={student.photo}
                  alt={student.first_name}
                  className="w-28 h-28 object-cover rounded-xl border-2 border-blue-500 shadow-md"
                />
              ) : (
                <div className="w-28 h-28 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                  <UserCheck className="w-10 h-10" />
                  <span className="text-[9px] font-bold uppercase mt-1">No Photo</span>
                </div>
              )}
              {/* Active Gate Access Indicator */}
              <div className="absolute -bottom-1.5 -right-1.5 bg-blue-500 text-white rounded-full p-1 shadow-md border border-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            {/* Student metadata */}
            <div className="text-center">
              <h3 className="text-base font-extrabold tracking-tight text-slate-850 uppercase">
                {student.first_name} {student.last_name}
              </h3>
              <p className="text-xs font-bold text-blue-600 mt-0.5">
                ID: {student.student_number}
              </p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase mt-1">
                {student.grade_name} â€” {student.section_name}
              </p>
            </div>

            {/* QR Code Container */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-inner flex items-center justify-center">
              <QRCodeSVG
                value={student.qr_value ?? `STU-${student.student_number}`}
                size={110}
                bgColor="#F8FAFC"
                fgColor="#0F2418"
                level="Q"
                includeMargin={false}
              />
            </div>

          </div>

          {/* Card Footer notice */}
          <div className="pt-2.5 border-t border-slate-150 text-center flex flex-col items-center gap-0.5">
            <p className="text-[8px] text-slate-400 font-semibold leading-none uppercase">
              Property of San Isidro National High School
            </p>
            <p className="text-[7px] text-slate-400 leading-none">
              If found, return to school safety office.
            </p>
          </div>

        </div>
      </div>

      {/* Control Actions */}
      <div className="flex gap-3">
        <Button variant="primary" size="md" onClick={handlePrint}>
          <Printer className="w-4 h-4" />
          Print ID Card
        </Button>
      </div>

    </div>
  );
};


