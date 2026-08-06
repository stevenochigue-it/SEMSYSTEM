import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import type { ScanResult } from '../types';
import { format } from '../utils/dateTime';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Clock,
  XCircle,
  History,
  LogOut,
  ShieldCheck,
  Trash2,
  Activity,
  MapPin,
  ScanLine,
  ArrowUpRight,
  ArrowDownLeft,
  User,
  Users
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
  const { scanQR, attendance } = useData();

  // Input & submission state
  const [scanValue, setScanValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live activity logs state
  const [activityLogs, setActivityLogs] = useState<ActivityItem[]>([]);

  // Time & Timer states
  const [currentTime, setCurrentTime] = useState(new Date());
  const inputRef = useRef<HTMLInputElement>(null);
  const highlightTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      highlightTimers.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // Live clock interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-focus barcode scan text input on render and keep focused
  useEffect(() => {
    focusInput();
    const focusInterval = setInterval(focusInput, 3000);
    return () => clearInterval(focusInterval);
  }, []);

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Pre-populate activity logs from attendance state if empty on load
  useEffect(() => {
    if (attendance.length > 0 && activityLogs.length === 0) {
      const todayDateStr = format(new Date(), 'YYYY-MM-DD');
      const initialItems: ActivityItem[] = attendance
        .filter(a => a.date === todayDateStr || !a.date)
        .slice(-6)
        .reverse()
        .map((a, idx) => ({
          id: `init-${a.id || idx}-${Date.now()}`,
          result: {
            success: true,
            message: a.time_out ? 'Gate Exit Recorded' : 'Gate Entry Recorded',
            action: a.time_out ? 'time_out' : 'time_in',
            student: {
              student_id: a.student_id,
              student_number: a.student_number,
              first_name: a.student_name ? a.student_name.split(' ')[0] : 'Student',
              last_name: a.student_name ? a.student_name.split(' ').slice(1).join(' ') : '',
              photo: a.photo,
              section_name: a.section_name || a.course,
              grade_name: a.grade_name || 'Student',
            } as any,
          },
          scannedAtTime: a.time_out || a.time_in || format(new Date(), 'hh:mm:ss A'),
          scannedAtDate: a.date || format(new Date(), 'MMM DD, YYYY'),
          gateName: 'Main Gate',
          isNew: false,
        }));

      if (initialItems.length > 0) {
        setActivityLogs(initialItems);
      }
    }
  }, [attendance]);

  // Process a QR code payload scan and add card to live activity feed
  const processScanPayload = async (payload: string) => {
    setIsSubmitting(true);
    try {
      const now = new Date();
      const timeStr = format(now, 'hh:mm:ss A');
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

      // Prepend new scan record at top of feed (keep last 25 records)
      setActivityLogs(prev => [newActivity, ...prev].slice(0, 25));

      // Remove soft green highlight after 2.5 seconds (2500ms)
      const timer = setTimeout(() => {
        setActivityLogs(prev =>
          prev.map(item => (item.id === newItemId ? { ...item, isNew: false } : item))
        );
        highlightTimers.current.delete(newItemId);
      }, 2500);

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

  const handleClearFeed = () => {
    setActivityLogs([]);
  };

  // Today stats summary
  const todayDateStr = format(new Date(), 'YYYY-MM-DD');
  const todayScans = attendance.filter(r => r.date === todayDateStr);
  const totalEntriesToday = todayScans.filter(r => !r.time_out || r.status === 'ENTRY').length;
  const totalExitsToday = todayScans.filter(r => r.time_out || r.status === 'EXIT').length;

  return (
    <div className="space-y-6 font-sans" onClick={focusInput}>

      {/* Security Officer Header Banner */}
      {user?.role === 'guard' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-blue-800/80">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-600/30 text-white shrink-0">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-wide uppercase">Gate Terminal Portal</h2>
                <span className="bg-blue-500/20 text-blue-300 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-blue-500/30">
                  Guard Shift Active
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                On Duty Security Officer: <span className="font-bold text-white">{user.full_name}</span> ({user.username})
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs font-bold bg-red-600/90 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl transition-all shadow-md shrink-0 border border-red-500/40"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout Gate Terminal</span>
          </button>
        </div>
      )}

      {/* Main Barcode / QR Scanner Header Bar */}
      <Card className="border border-slate-200 shadow-md overflow-hidden bg-white rounded-2xl">
        <div className="bg-slate-900 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-md">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                San Isidro National High School
              </h1>
              <p className="text-xs text-blue-300 font-bold uppercase tracking-wider mt-0.5">
                Student Gate Entrance Monitoring System
              </p>
            </div>
          </div>

          {/* Live Date & Clock Display */}
          <div className="text-left sm:text-right bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/60">
            <p className="text-xs text-blue-300 font-bold uppercase tracking-wider">{format(currentTime, 'YYYY-MM-DD')}</p>
            <p className="text-lg font-black tracking-tight text-white mt-0.5">{format(currentTime, 'hh:mm:ss A')}</p>
          </div>
        </div>

        {/* USB Barcode / Manual Input Form */}
        <form onSubmit={handleScanSubmit} className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <ScanLine className="h-5 w-5 text-blue-600" />
            </span>
            <input
              ref={inputRef}
              type="text"
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              placeholder="Ready for USB Scanner... (or type LRN / QR & press Enter)"
              className="w-full rounded-xl border-2 border-slate-300 pl-11 pr-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-white shadow-sm transition-all"
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting || !scanValue.trim()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-extrabold text-sm uppercase tracking-wider shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all"
          >
            {isSubmitting ? 'Processing...' : 'Record Scan'}
          </Button>
        </form>
      </Card>

      {/* Main Dashboard Section: Live Gate Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Live Gate Activity Feed */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Section Title Header Bar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <span>Live Gate Activity</span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    {activityLogs.length} Records
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Real-time log of student entrance and exit scans at the gate
                </p>
              </div>
            </div>

            {/* Top-Right Badge: Real-Time Updates Indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-3 py-1.5 rounded-full text-xs font-bold shadow-xs">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>Real-Time Updates</span>
              </div>

              {activityLogs.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClearFeed}
                  className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-700 bg-slate-100 hover:bg-red-50 border-slate-200 hover:border-red-200 transition-colors"
                  title="Clear live screen log"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Clear Log</span>
                </Button>
              )}
            </div>
          </div>

          {/* Activity Cards List */}
          <div className="space-y-3">
            {activityLogs.length > 0 ? (
              activityLogs.map((item) => {
                const res = item.result;
                const student = res.student;

                const isEntry = res.action === 'time_in' || res.message?.toLowerCase().includes('entry') || res.message?.toLowerCase().includes('in');

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl p-4 sm:p-5 border transition-all duration-700 ${
                      item.isNew
                        ? 'bg-emerald-50/90 border-2 border-emerald-400 ring-4 ring-emerald-100 shadow-lg transform -translate-y-0.5'
                        : res.success
                          ? 'bg-white border-slate-200/90 hover:border-slate-300 shadow-sm'
                          : 'bg-red-50/50 border-red-200 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                      {/* Left: Student Photo + Info */}
                      <div className="flex items-center gap-4">
                        {/* Student Photo */}
                        {student?.photo ? (
                          <img
                            src={student.photo}
                            alt={student.first_name || 'Student'}
                            className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-2xl border-2 border-slate-200 shadow-xs shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <User className="w-8 h-8 text-slate-400" />
                          </div>
                        )}

                        {/* Student Details */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                              {student ? `${student.first_name} ${student.last_name}` : 'Unknown QR Code'}
                            </h3>

                            {item.isNew && (
                              <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse tracking-wider">
                                JUST SCANNED
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap font-semibold">
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-mono text-[11px]">
                              #{student?.student_number || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1 text-slate-600">
                              <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
                              {student?.grade_name || student?.year_level || 'Grade Level'}{' '}
                              {student?.section_name || student?.section ? `• ${student.section_name || student.section}` : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Status Badge + Date/Time + Gate */}
                      <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 shrink-0">
                        {/* Status Badge */}
                        {res.success ? (
                          <Badge
                            variant={isEntry ? 'emerald' : 'info'}
                            className="px-3 py-1 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs"
                          >
                            {isEntry ? (
                              <>
                                <ArrowUpRight className="h-4 w-4 stroke-[3]" />
                                ENTRY (TIME IN)
                              </>
                            ) : (
                              <>
                                <ArrowDownLeft className="h-4 w-4 stroke-[3]" />
                                EXIT (TIME OUT)
                              </>
                            )}
                          </Badge>
                        ) : (
                          <Badge variant="danger" className="px-3 py-1 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                            <XCircle className="h-4 w-4" />
                            ACCESS DENIED
                          </Badge>
                        )}

                        {/* Date, Time & Gate Name */}
                        <div className="text-left sm:text-right space-y-0.5 text-xs">
                          <p className="font-black text-slate-800 flex items-center sm:justify-end gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {item.scannedAtTime}
                          </p>
                          <p className="text-[11px] font-semibold text-slate-500 flex items-center sm:justify-end gap-1">
                            <MapPin className="h-3 w-3 text-blue-500" />
                            {item.gateName} • {item.scannedAtDate}
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })
            ) : (
              /* Empty State */
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Activity className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No Activity Recorded Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Scan a student QR code or ID card at the gate to start recording real-time entrance and exit activity.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Daily Access Summary & Log History */}
        <div className="space-y-6">

          {/* Today's Access Stat Counters */}
          <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-4 rounded-2xl">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Today's Gate Summary
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">Total Entries</p>
                <p className="text-2xl font-black text-emerald-900 mt-1">{totalEntriesToday}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-[11px] font-extrabold text-blue-800 uppercase tracking-wider">Total Exits</p>
                <p className="text-2xl font-black text-blue-900 mt-1">{totalExitsToday}</p>
              </div>
            </div>
          </Card>

          {/* Today's Log History */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Today's Database Logs</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Full attendance records today</p>
                </div>
              </div>
              <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full">
                {todayScans.length}
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[420px] scrollbar-thin px-4">
              {todayScans.length > 0 ? (
                todayScans.slice(-10).reverse().map((scan) => (
                  <div key={scan.id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                    <div className="space-y-0.5">
                      <p className="font-extrabold text-slate-800">{scan.student_name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        #{scan.student_number} • {scan.section_name || scan.course || 'Student'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={scan.time_out ? 'info' : 'emerald'} className="px-2 py-0.5 text-[9px] uppercase font-bold">
                        {scan.time_out ? 'Exit' : 'Entry'}
                      </Badge>
                      <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                        {scan.time_out || scan.time_in}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                  <Clock className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-500">No database logs recorded today yet</p>
                </div>
              )}
            </div>
          </Card>

        </div>

      </div>
    </div>
  );
};
