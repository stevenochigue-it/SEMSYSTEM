import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload, Download, FileSpreadsheet, CheckCircle,
  XCircle, AlertTriangle, Loader2, X, ChevronRight,
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { Section } from '../../types';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ParsedStudent {
  student_number: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  section_id: number;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
  message: string;
}

type Step = 'upload' | 'preview' | 'result';

interface Props {
  sections: Section[];
  onClose: () => void;
  onSuccess: () => void;
}

// â”€â”€â”€ Column aliases â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const COL_MAP: Record<string, keyof ParsedStudent | 'section_name' | 'grade_name'> = {
  'student_number': 'student_number', 'student number': 'student_number', 'id': 'student_number',
  'lrn': 'student_number', 'learner reference number': 'student_number',
  'first_name':    'first_name',  'first name':    'first_name',  'firstname':  'first_name',
  'middle_name':   'middle_name', 'middle name':   'middle_name', 'middlename': 'middle_name', 'mi': 'middle_name',
  'last_name':     'last_name',   'last name':     'last_name',   'lastname':   'last_name', 'surname': 'last_name',
  'section_id':    'section_id',  'section id':    'section_id',
  'section_name':  'section_name','section name':  'section_name','section':    'section_name',
  'grade_name':    'grade_name',  'grade name':    'grade_name',  'grade level':'grade_name', 'grade': 'grade_name',
};

const REQUIRED: Array<keyof ParsedStudent> = ['student_number', 'first_name', 'last_name', 'section_id'];

const API_URL = '/api';

// â”€â”€â”€ Template download â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function downloadTemplate(sections: Section[]) {
  const headers = ['lrn', 'first_name', 'middle_name', 'last_name', 'section_id'];
  const sectionRef = sections.slice(0, 3).map(s =>
    `[${s.section_id}] ${s.grade_name} - ${s.section_name}`
  ).join(' | ');

  const sample = [
    ['109283746501', 'Maria', 'C.', 'Santos', sections[0]?.section_id ?? 1],
    ['109283746502', 'Jose',  '',  'Reyes',   sections[1]?.section_id ?? 2],
  ];

  const ws = XLSX.utils.aoa_to_sheet([
    headers,
    ...sample,
    [],
    [`Section IDs in this system: ${sectionRef}`],
  ]);
  ws['!cols'] = headers.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  XLSX.writeFile(wb, 'student_import_template.xlsx');
}

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const ExcelImportModal: React.FC<Props> = ({ sections, onClose, onSuccess }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep]               = useState<Step>('upload');
  const [fileName, setFileName]       = useState('');
  const [students, setStudents]       = useState<ParsedStudent[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [result, setResult]           = useState<ImportResult | null>(null);

  // Build a lookup: "Grade 12 - Einstein" â†’ section_id
  const sectionLookup = new Map<string, number>();
  sections.forEach(s => {
    sectionLookup.set(`${s.grade_name} - ${s.section_name}`.toLowerCase(), s.section_id);
    sectionLookup.set(s.section_name.toLowerCase(), s.section_id);
    sectionLookup.set(String(s.section_id), s.section_id);
  });

  function resolveSection(raw: any): number {
    const key = String(raw ?? '').trim().toLowerCase();
    return sectionLookup.get(key) ?? 0;
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseErrors([]);
    setStudents([]);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb   = XLSX.read(ev.target?.result, { type: 'binary' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

        if (!rows.length) { setParseErrors(['The spreadsheet is empty.']); return; }

        const parsed: ParsedStudent[] = [];
        const errors: string[]        = [];

        rows.forEach((row, i) => {
          const rn = i + 2;
          const norm: any = {};

          for (const [rawKey, val] of Object.entries(row)) {
            const mapped = COL_MAP[rawKey.toLowerCase().trim()];
            if (mapped) norm[mapped] = String(val).trim();
          }

          // Resolve section_id from section_id / section_name / grade+section combo
          if (!norm.section_id && (norm.section_name || norm.grade_name)) {
            const key = norm.grade_name && norm.section_name
              ? `${norm.grade_name} - ${norm.section_name}`
              : norm.section_name ?? '';
            norm.section_id = resolveSection(key);
          } else if (norm.section_id) {
            norm.section_id = resolveSection(norm.section_id);
          }

          const missing = REQUIRED.filter(f => !norm[f]);
          if (missing.length) { errors.push(`Row ${rn}: Missing â€” ${missing.join(', ')}`); return; }
          if (!norm.section_id) { errors.push(`Row ${rn}: Could not resolve section. Use a valid section_id.`); return; }

          parsed.push(norm as ParsedStudent);
        });

        setStudents(parsed);
        setParseErrors(errors);
        if (parsed.length || errors.length) setStep('preview');
      } catch {
        setParseErrors(['Could not read file. Please use a valid .xlsx or .csv.']);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    setIsLoading(true);
    try {
      const res  = await fetch(`${API_URL}/students/import.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ students }),
      });
      const json: ImportResult = await res.json();
      setResult(json);
      setStep('result');
      if (json.imported > 0) onSuccess();
    } catch {
      setResult({ imported: 0, skipped: students.length, errors: ['Network error.'], message: 'Import failed.' });
      setStep('result');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('upload'); setFileName(''); setStudents([]);
    setParseErrors([]); setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // Section map for preview labels
  const sectionMap = new Map(sections.map(s => [s.section_id, `${s.grade_name} — ${s.section_name}`]));

  return (
    <div className="flex flex-col gap-5 relative">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs font-semibold">
        {(['upload', 'preview', 'result'] as Step[]).map((s, idx) => {
          const labels: Record<Step, string> = { upload: 'Upload', preview: 'Preview', result: 'Result' };
          const active = step === s;
          const done   = ['upload', 'preview', 'result'].indexOf(step) > idx;
          return (
            <React.Fragment key={s}>
              <span className={`rounded-full px-3 py-1 ${active ? 'bg-blue-600 text-white' : done ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                {labels[s]}
              </span>
              {idx < 2 && <ChevronRight className="h-3 w-3 text-slate-300" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* â”€â”€â”€ STEP 1: UPLOAD â”€â”€â”€ */}
      {step === 'upload' && (
        <div className="flex flex-col gap-4">
          <label htmlFor="excel-upload"
            className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
              <FileSpreadsheet className="h-7 w-7" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Click to upload or drag & drop</p>
              <p className="mt-1 text-xs text-slate-400">Supports <strong>.xlsx</strong> and <strong>.csv</strong></p>
            </div>
            <input id="excel-upload" ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
          </label>

          {parseErrors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="mb-2 text-xs font-bold text-red-700 flex items-center gap-1"><XCircle className="h-4 w-4" /> Errors</p>
              {parseErrors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
            </div>
          )}

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="flex-1 text-xs text-blue-700">
              <p className="font-semibold mb-1">Required columns: <code>lrn, first_name, last_name, section_id</code></p>
              <p>You can also use <code>section_name</code> and <code>grade_name</code> instead of <code>section_id</code>. Both <code>lrn</code> and <code>student_number</code> are accepted as the LRN column header.</p>
              <button onClick={() => downloadTemplate(sections)}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 underline">
                <Download className="h-3.5 w-3.5" /> Download Template (.xlsx)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€â”€ STEP 2: PREVIEW â”€â”€â”€ */}
      {step === 'preview' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <CheckCircle className="h-3.5 w-3.5" /> {students.length} valid row{students.length !== 1 ? 's' : ''}
            </span>
            {parseErrors.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" /> {parseErrors.length} skipped
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
              <FileSpreadsheet className="h-3.5 w-3.5" /> {fileName}
            </span>
          </div>

          {parseErrors.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="mb-1.5 text-xs font-bold text-amber-700">Skipped rows:</p>
              {parseErrors.map((e, i) => <p key={i} className="text-xs text-amber-700">â€¢ {e}</p>)}
            </div>
          )}

          {students.length > 0 ? (
            <div className="max-h-72 overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-xs">
                <thead className="sticky top-0 bg-slate-100 z-10">
                  <tr>
                    {['#', 'LRN', 'First Name', 'M.I.', 'Last Name', 'Section'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {students.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-400 font-mono">{i + 1}</td>
                      <td className="px-3 py-2 font-mono text-slate-700">{s.student_number}</td>
                      <td className="px-3 py-2 text-slate-700">{s.first_name}</td>
                      <td className="px-3 py-2 text-slate-500">{s.middle_name || 'â€”'}</td>
                      <td className="px-3 py-2 text-slate-700">{s.last_name}</td>
                      <td className="px-3 py-2">
                        <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          {sectionMap.get(s.section_id) ?? `ID: ${s.section_id}`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
              <XCircle className="mx-auto h-8 w-8 text-red-400 mb-2" />
              <p className="text-sm font-semibold text-red-700">No valid rows found.</p>
            </div>
          )}

          <div className="flex justify-between gap-3 pt-1 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={handleReset}><Upload className="h-3.5 w-3.5" /> Re-upload</Button>
            <Button size="sm" onClick={handleImport} disabled={!students.length || isLoading} isLoading={isLoading}>
              {!isLoading && <CheckCircle className="h-3.5 w-3.5" />}
              Import {students.length} Student{students.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}

      {/* â”€â”€â”€ STEP 3: RESULT â”€â”€â”€ */}
      {step === 'result' && result && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center rounded-xl bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-100 py-7 gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-200">
              <CheckCircle className="h-7 w-7 text-white" />
            </div>
            <p className="text-2xl font-extrabold text-blue-700">{result.imported}</p>
            <p className="text-sm text-slate-500">Student{result.imported !== 1 ? 's' : ''} successfully imported</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
              <p className="text-xl font-bold text-slate-700">{result.imported}</p>
              <p className="text-xs text-slate-400 mt-1">Imported</p>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-center">
              <p className="text-xl font-bold text-amber-600">{result.skipped}</p>
              <p className="text-xs text-amber-400 mt-1">Skipped</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 max-h-40 overflow-auto">
              <p className="mb-1.5 text-xs font-bold text-red-700 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Skipped rows:
              </p>
              {result.errors.map((e, i) => <p key={i} className="text-xs text-red-600">â€¢ {e}</p>)}
            </div>
          )}

          <div className="flex gap-3 pt-1 border-t border-slate-100">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleReset}>Import Another File</Button>
            <Button size="sm" className="flex-1" onClick={onClose}><X className="h-3.5 w-3.5" /> Done</Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/80 backdrop-blur-sm z-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-600">Importing studentsâ€¦</p>
        </div>
      )}
    </div>
  );
};


