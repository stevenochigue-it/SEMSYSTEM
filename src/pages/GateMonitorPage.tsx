import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/Button';
import type { ScanResult } from '../types';
import { format } from '../utils/dateTime';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  ShieldCheck,
  ScanLine,
  ArrowUpRight,
  ArrowDownLeft,
  User,
  Plus,
  Clock,
} from 'lucide-react';

export interface ActivityItem {
  id: string;
  result: ScanResult;
  scannedAtTime: string;
  scannedAtDate: string;
  gateName: string;
  isNew: boolean;
}

export const GateMonitorPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { scanQR } = useData();

  const [scanValue, setScanValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Live display slots — cards disappear after 3 seconds
  const [activityLogs, setActivityLogs] = useState<ActivityItem[]>([]);

  // Persistent session counters — only ever go up
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalExits, setTotalExits] = useState(0);

  const [currentTime, setCurrentTime] = useState(new Date());
  const inputRef = useRef<HTMLInputElement>(null);
  const highlightTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    return () => { highlightTimers.current.forEach(t => clearTimeout(t)); };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    focusInput();
    const focusInterval = setInterval(focusInput, 3000);
    return () => clearInterval(focusInterval);
  }, []);

  const focusInput = () => { if (inputRef.current) inputRef.current.focus(); };

  const processScanPayload = async (payload: string) => {
    setIsSubmitting(true);
    try {
      const now = new Date();
      const timeStr = format(now, 'hh:mm A');
      const dateStr = format(now, 'MMM DD, YYYY');
      const response = await scanQR(payload);

      const newItemId = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newActivity: ActivityItem = {
        id: newItemId,
        result: response,
        scannedAtTime: timeStr,
        scannedAtDate: dateStr,
        gateName: 'Main Gate',
        isNew: true,
      };

      const isEntry = response.action === 'time_in' ||
        response.message?.toLowerCase().includes('entry') ||
        response.message?.toLowerCase().includes('in');
      if (isEntry) setTotalEntries(prev => prev + 1);
      else setTotalExits(prev => prev + 1);

      setActivityLogs(prev => [newActivity, ...prev].slice(0, 6));

      // Remove card after 3 seconds — slot goes back to empty [+]
      const timer = setTimeout(() => {
        setActivityLogs(prev => prev.filter(item => item.id !== newItemId));
        highlightTimers.current.delete(newItemId);
      }, 3000);
      highlightTimers.current.set(newItemId, timer);

      return response;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanValue = scanValue.trim();
    if (!cleanValue || isSubmitting) return;
    try {
      await processScanPayload(cleanValue);
    } catch (error) {
      console.error('Scan processing failed:', error);
    } finally {
      setScanValue('');
    }
  };

  const totalSlots = 6;
  const slots = Array.from({ length: totalSlots }).map((_, i) => activityLogs[i] || null);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    month: 'long', day: '2-digit', year: 'numeric'
  });
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true
  });

  return (
    <div
      className="min-h-screen bg-slate-100 p-4 sm:p-6 font-sans"
      onClick={focusInput}
    >
      {/* Hidden scanner input — always focused */}
      <form onSubmit={handleScanSubmit} className="sr-only" aria-hidden="true">
        <input
          ref={inputRef}
          type="text"
          value={scanValue}
          onChange={(e) => setScanValue(e.target.value)}
          tabIndex={-1}
        />
        <button type="submit" />
      </form>

      {/* ===== MAIN CARD WRAPPER ===== */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden max-w-6xl mx-auto">

        {/* ── TOP HEADER ── */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
          {/* School Logo + Name */}
          <div className="flex items-center gap-4">
            <img
              src="/school-logo.jpg"
              alt="San Isidro NHS Logo"
              className="w-14 h-14 rounded-full object-cover border-2 border-blue-600 shadow-sm shrink-0"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                San Isidro National High School
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                Gate Attendance Dashboard
              </p>
            </div>
          </div>

          {/* Date + Time */}
          <div className="text-right shrink-0">
            <p className="text-sm text-slate-500 font-medium">{formattedDate}</p>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight font-mono tracking-tight">
              {formattedTime}
            </p>
          </div>
        </div>

        {/* ── Guard Banner (only for guard role) ── */}
        {user?.role === 'guard' && (
          <div className="flex items-center justify-between bg-slate-900 text-white px-7 py-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0" />
              <span className="text-sm font-semibold text-slate-300">
                Security Officer: <span className="text-white font-bold">{user.full_name}</span>
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-emerald-500/30 ml-1">
                Shift Active
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 text-xs font-bold bg-red-600/90 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-all"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}

        {/* ── SCANNER BAR ── */}
        <div className="px-7 py-4 border-b border-slate-100 bg-slate-50">
          <form onSubmit={handleScanSubmit} className="flex items-center gap-3">
            <div className="relative flex-1">
              <ScanLine className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600 animate-pulse" />
              <input
                type="text"
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
                placeholder="Scan QR Code or type Student ID and press Enter..."
                className="w-full rounded-xl border-2 border-slate-200 pl-11 pr-4 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white transition-all"
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || !scanValue.trim()}
              className="shrink-0 px-6 py-2.5 rounded-xl font-extrabold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
            >
              {isSubmitting ? 'Processing...' : 'Record Scan'}
            </Button>
          </form>
        </div>

        {/* ── MAIN BODY ── */}
        <div className="flex gap-0 divide-x divide-slate-100">

          {/* ── LEFT: Daily Attendance Summary ── */}
          <div className="w-64 shrink-0 p-6 space-y-4 bg-white">
            <h2 className="text-base font-black text-slate-800 leading-snug">
              Daily Attendance<br />Summary
            </h2>

            {/* Total Entries */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-500 font-medium">Total Entries Today</p>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <ArrowUpRight className="h-4 w-4 text-emerald-600 stroke-[3]" />
                </div>
              </div>
              <p className="text-4xl font-black text-slate-900">{totalEntries}</p>
            </div>

            {/* Total Exits */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-500 font-medium">Total Exits Today</p>
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <ArrowDownLeft className="h-4 w-4 text-blue-600 stroke-[3]" />
                </div>
              </div>
              <p className="text-4xl font-black text-slate-900">{totalExits}</p>
            </div>
          </div>

          {/* ── RIGHT: Real-time Attendance Stream ── */}
          <div className="flex-1 p-6 bg-slate-50/60">
            <h2 className="text-base font-black text-slate-800 mb-4">
              Real-time Attendance Stream
            </h2>

            {/* 3×2 Slot Grid */}
            <div className="grid grid-cols-3 gap-4">
              {slots.map((item, idx) => {
                /* ── EMPTY SLOT ── */
                if (!item) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="aspect-[4/3] rounded-2xl bg-blue-50/80 border border-blue-100 flex flex-col items-center justify-center gap-2 text-slate-400"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-blue-400 stroke-[3]" />
                      </div>
                    </div>
                  );
                }

                /* ── FILLED STUDENT SLOT ── */
                const res = item.result;
                const student = res.student;
                const isEntry = res.action === 'time_in' ||
                  res.message?.toLowerCase().includes('entry') ||
                  res.message?.toLowerCase().includes('in');
                const fullName = student
                  ? `${student.first_name} ${student.last_name}`
                  : 'Unknown';

                return (
                  <div
                    key={item.id}
                    className={`aspect-[4/3] rounded-2xl border flex flex-col items-center justify-center gap-2 p-4 text-center relative transition-all duration-500 ${
                      item.isNew
                        ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200 shadow-md'
                        : res.success
                          ? 'bg-blue-50/70 border-blue-100'
                          : 'bg-red-50 border-red-200'
                    }`}
                  >
                    {/* Late badge */}
                    {!isEntry && res.success && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200">
                        <Clock className="h-3 w-3" />
                        Exit
                      </div>
                    )}

                    {/* Online dot */}
                    {res.success && (
                      <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-300" />
                    )}

                    {/* Photo */}
                    <div className="relative">
                      {student?.photo ? (
                        <img
                          src={student.photo}
                          alt={fullName}
                          className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-white shadow-md flex items-center justify-center">
                          <User className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* Name, Grade & Section, Time In/Out */}
                    <div className="space-y-0.5">
                      <p className="text-sm font-black text-slate-900 leading-tight line-clamp-1">
                        {fullName}
                      </p>
                      {student?.grade_name && (
                        <p className="text-[10px] text-blue-600 font-extrabold uppercase">
                          {student.grade_name} — {student.section_name}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                        <span className={`inline-block font-extrabold px-1.5 py-0.5 rounded text-[10px] mr-1 ${isEntry ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>
                          {isEntry ? 'TIME IN' : 'TIME OUT'}
                        </span>
                        {item.scannedAtTime}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Guard Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 border border-red-200">
              <LogOut className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1">Confirm Logout</h2>
            <p className="text-sm text-slate-500 font-medium mb-6">Are you sure you want to log out of the Gate Terminal?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl border-2 border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { setShowLogoutConfirm(false); logout(); }}
                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 shadow-md shadow-red-600/20 transition-all"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
