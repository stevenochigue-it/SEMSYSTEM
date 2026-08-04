import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Student, AttendanceRecord } from '../types';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { 
  GraduationCap, 
  Search, 
  RefreshCw, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  Link as LinkIcon, 
  ArrowLeftRight,
  LogOut,
  User,
  Phone,
  BookOpen
} from 'lucide-react';

export const ParentDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  
  const [isLinked, setIsLinked] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  
  const [studentNumber, setStudentNumber] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchStatus = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getChildStatus();
      if (data.linked && data.student) {
        setIsLinked(true);
        setStudent(data.student);
        setLogs(data.logs || []);
      } else {
        setIsLinked(false);
        setStudent(null);
        setLogs([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve child logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentNumber.trim()) {
      setError('Please enter a student number');
      return;
    }
    
    setError(null);
    setSuccessMsg(null);
    setIsActionLoading(true);
    
    try {
      const result = await apiService.linkChild(studentNumber.trim());
      if (result.success) {
        setSuccessMsg(result.message);
        setStudentNumber('');
        // Reload status
        await fetchStatus(false);
      } else {
        setError(result.message || 'Failed to link account.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid Student ID or link request failed.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!window.confirm('Are you sure you want to unlink this student from your parent account?')) {
      return;
    }
    
    setError(null);
    setSuccessMsg(null);
    setIsActionLoading(true);
    
    try {
      // Unlink is essentially linking an empty student number
      const result = await apiService.linkChild('');
      if (result.success) {
        setSuccessMsg('Account unlinked successfully.');
        setIsLinked(false);
        setStudent(null);
        setLogs([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to unlink account.');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500">Retrieving student logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 to-emerald-800 p-6 rounded-2xl text-white shadow-lg border border-emerald-700/30">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-emerald-350" />
            <h1 className="text-2xl font-extrabold tracking-tight">Parent Monitor Portal</h1>
          </div>
          <p className="text-emerald-200 text-xs mt-1 font-medium">
            Welcome, <span className="font-bold text-white">{user?.full_name}</span>. Check your child's gate scans and current campus status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isLinked && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchStatus(true)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-2 font-bold"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="border-red-400/30 text-red-200 hover:bg-red-950/20 hover:text-red-100 gap-2 font-bold bg-transparent"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Container */}
      {!isLinked ? (
        /* Setup / Link Student Form */
        <div className="max-w-md mx-auto py-8">
          <Card className="shadow-xl border border-slate-200/60 rounded-2xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto rounded-2xl bg-emerald-50 p-4 inline-flex border border-emerald-100 text-emerald-600 mb-2">
                <LinkIcon className="h-10 w-10 animate-bounce" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-800">Link Child Account</CardTitle>
              <p className="text-xs text-slate-450 mt-1.5">
                Please register your child's official student ID number to monitor their school entry and exit logs in real-time.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              
              {/* Notifications */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-700 animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-100 p-3 text-xs text-green-700 animate-fade-in">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                  <span className="font-medium">{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleLink} className="space-y-4">
                <div>
                  <label htmlFor="studentNumber" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Student ID Number
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      id="studentNumber"
                      type="text"
                      required
                      placeholder="e.g. 2026-000101"
                      value={studentNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStudentNumber(e.target.value)}
                      className="w-full h-11 pl-9 pr-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-700 font-semibold text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full justify-center h-11 text-sm font-semibold tracking-wide"
                  isLoading={isActionLoading}
                >
                  Link Student Record
                </Button>
              </form>

              {/* Demo Helper box */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/40 p-3 text-xs">
                <p className="font-bold text-slate-600 mb-1">💡 Sandbox Student IDs to test:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                  <li><span className="font-semibold text-slate-700">2026-000101</span> (Maria Santos)</li>
                  <li><span className="font-semibold text-slate-700">2026-000102</span> (Jose Reyes)</li>
                  <li><span className="font-semibold text-slate-700">2026-000103</span> (Ana Cruz)</li>
                </ul>
              </div>

            </CardContent>
          </Card>
        </div>
      ) : (
        /* Parent Dashboard Monitor View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Student Details & Status Badges */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Status Display Card */}
            <Card className="border border-slate-250 shadow-md overflow-hidden rounded-2xl">
              <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campus Access Monitor</span>
                <Badge variant={student?.status === 'inside' ? 'emerald' : 'secondary'} className="px-2 py-0.5 text-[10px] uppercase font-bold animate-pulse">
                  Live Stream
                </Badge>
              </div>
              <CardContent className="p-6 text-center space-y-4">
                
                {/* Glowing Pulse status ring */}
                <div className="flex justify-center my-4">
                  <div className={`relative rounded-full p-6 ${
                    student?.status === 'inside' 
                      ? 'bg-green-50 text-green-600 border border-green-200' 
                      : 'bg-amber-50 text-amber-600 border border-amber-200'
                  }`}>
                    <Building2 className="h-16 w-16" />
                    
                    {/* Pulsing ring overlay */}
                    <span className={`absolute inset-0 rounded-full animate-ping opacity-25 border-4 ${
                      student?.status === 'inside' ? 'border-green-400' : 'border-amber-400'
                    }`} />
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Current Status</h3>
                  <h2 className={`text-2xl font-black mt-2 tracking-wide uppercase ${
                    student?.status === 'inside' ? 'text-green-700' : 'text-amber-700'
                  }`}>
                    {student?.status === 'inside' ? 'INSIDE CAMPUS' : 'OUTSIDE CAMPUS'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-2.5 max-w-[200px] mx-auto leading-relaxed">
                    {student?.status === 'inside' 
                      ? 'Your child entered the school campus and is logged present.' 
                      : 'Your child is currently outside of school campus bounds.'
                    }
                  </p>
                </div>

                {logs.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-650 font-medium">
                    <Clock className="h-4 w-4 text-slate-450" />
                    <span>Last event logged: <strong className="text-slate-800">{logs[0].time_out ? logs[0].time_out + ' (Out)' : logs[0].time_in + ' (In)'}</strong></span>
                  </div>
                )}

              </CardContent>
            </Card>

            {/* Child Profile Info Card */}
            <Card className="border border-slate-200 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-slate-50 p-4 border-b border-slate-100">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Linked Student Profile</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                
                {/* Photo & Name */}
                <div className="flex items-center gap-4">
                  {student?.photo ? (
                    <img 
                      src={student.photo} 
                      alt={student.first_name} 
                      className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-inner"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <User className="h-7 w-7" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 leading-tight">
                      {student?.first_name} {student?.last_name}
                    </h3>
                    <p className="text-[11px] text-slate-450 font-bold tracking-wide mt-1 uppercase">ID: {student?.student_number}</p>
                  </div>
                </div>

                {/* Attributes list */}
                <div className="space-y-2.5 pt-2 text-xs border-t border-slate-100/70">
                  <div className="flex justify-between">
                    <span className="text-slate-400 flex items-center gap-1 font-semibold"><BookOpen className="h-3.5 w-3.5" /> Course</span>
                    <strong className="text-slate-700 font-bold">{student?.course} — {student?.section}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 flex items-center gap-1 font-semibold"><User className="h-3.5 w-3.5" /> Year Level</span>
                    <strong className="text-slate-700 font-bold">{student?.year_level}</strong>
                  </div>
                  {student?.guardian_name && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 flex items-center gap-1 font-semibold"><User className="h-3.5 w-3.5" /> Parent/Guardian</span>
                      <strong className="text-slate-700 font-bold">{student.guardian_name}</strong>
                    </div>
                  )}
                  {student?.contact_number && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 flex items-center gap-1 font-semibold"><Phone className="h-3.5 w-3.5" /> Emergency Contact</span>
                      <strong className="text-slate-700 font-bold">{student.contact_number}</strong>
                    </div>
                  )}
                </div>

                {/* Reset / Unlink Button */}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUnlink}
                    className="w-full justify-center text-xs font-bold border-slate-200 text-slate-650 hover:bg-slate-55 gap-1.5"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                    Link Different Student
                  </Button>
                </div>

              </CardContent>
            </Card>

          </div>

          {/* Right Column: Attendance Scan Logs History */}
          <div className="lg:col-span-2 space-y-6">
            
            <Card className="border border-slate-200 shadow-md rounded-2xl overflow-hidden h-full flex flex-col justify-between">
              
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Child Attendance Logs</h3>
                    <p className="text-[11px] text-slate-400">Complete historical card scans for your child.</p>
                  </div>
                </div>
                <Badge variant="info" className="px-2.5 py-0.5 text-xs font-bold">
                  {logs.length} Scans Logged
                </Badge>
              </div>

              {/* Table / Logs List */}
              <div className="flex-1 overflow-x-auto min-h-[350px]">
                {logs.length > 0 ? (
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase font-bold text-slate-450 tracking-wider">
                        <th className="py-3 px-5">Date</th>
                        <th className="py-3 px-5">Time In</th>
                        <th className="py-3 px-5">Time Out</th>
                        <th className="py-3 px-5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-3.5 px-5 font-bold text-slate-800">
                            {new Date(log.date || Date.now()).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="py-3.5 px-5 text-slate-600 font-semibold">
                            {log.time_in ? (
                              <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md text-[11px] font-bold border border-green-100">
                                {log.time_in}
                              </span>
                            ) : (
                              <span className="text-slate-350">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-slate-600 font-semibold">
                            {log.time_out ? (
                              <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-md text-[11px] font-bold border border-amber-100">
                                {log.time_out}
                              </span>
                            ) : (
                              <span className="text-slate-350 font-bold italic">Inside Campus</span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <Badge variant={log.status === 'inside' ? 'success' : 'secondary'} className="px-2 py-0.5 text-[10px] font-bold uppercase">
                              {log.status === 'inside' ? 'Entered' : 'Exited'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400">
                    <Clock className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700">No logs found</p>
                    <p className="text-xs mt-1">There are no gate scans logged for this student yet.</p>
                  </div>
                )}
              </div>

            </Card>

          </div>

        </div>
      )}

    </div>
  );
};
