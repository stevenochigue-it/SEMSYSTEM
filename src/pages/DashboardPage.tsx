import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Users,
  LogIn,
  LogOut,
  AlertTriangle,
  Search,
  Clock,
  RefreshCw,
  TrendingUp,
  Monitor,
  Wifi,
  Database,
  ScanLine,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Info,
  Download,
  Sparkles,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from '../utils/dateTime';

export const DashboardPage: React.FC = () => {
  const { stats, chartData, attendance, refreshData, resetStats } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'all' | 'inside' | 'outside'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    await refreshData();
  };

  // Filter today's attendance records matching tab & search term
  const today = format(currentTime, 'YYYY-MM-DD');
  const todayRecords = attendance.filter(r => r.date === today);

  const filteredAttendance = todayRecords.filter(r => {
    // Tab filter
    if (activeTab === 'inside' && r.time_out) return false;
    if (activeTab === 'outside' && !r.time_out) return false;

    // Search filter
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      r.student_name?.toLowerCase().includes(search) ||
      r.student_number.toLowerCase().includes(search) ||
      (r.section_name && r.section_name.toLowerCase().includes(search)) ||
      (r.course && r.course.toLowerCase().includes(search))
    );
  }).reverse();

  // Pagination logic
  const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage) || 1;
  const paginatedAttendance = filteredAttendance.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formattedDateStr = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 pb-8 bg-[#f8fafc] -m-6 p-6 min-h-screen">
      
      {/* Top Header & Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Pages</span>
            <span>/</span>
            <span className="text-slate-700 font-bold">Dashboard</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Overview</h1>
        </div>
        
        {/* Right Search & Controls */}
        <div className="flex items-center gap-3">
          <div className="relative w-64 sm:w-72">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search students, LRN, sections..."
              className="w-full rounded-xl border border-slate-200/90 bg-white pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200/90 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs">
            <Clock className="h-4 w-4 text-indigo-600 animate-pulse" />
            <span className="font-mono text-xs">{format(currentTime, 'hh:mm:ss A')}</span>
          </div>

          <button
            onClick={handleRefresh}
            title="Refresh Data"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Top Premium Purple Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 p-6 text-white shadow-lg shadow-indigo-600/15">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-indigo-100 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Live Gate Monitoring System</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              San Isidro National High School Access Terminal
            </h2>
            <p className="text-xs text-indigo-100/90 max-w-xl font-medium">
              Real-time automated entrance monitoring, RFID/QR barcode validation, and daily campus traffic diagnostics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md border border-white/20 shadow-xs">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>System Online 100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards Row (4 Cards Grid) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Card 1: Total Students */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Users className="h-5 w-5" />
            </div>
            <button title="Total active enrollment in system" className="text-slate-300 hover:text-slate-500">
              <Info className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500">Total Enrolled</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              {(stats?.totalStudents || 0).toLocaleString()}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
              <span>100% Registered</span>
            </div>
          </div>
        </div>

        {/* Card 2: Inside Campus */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <LogIn className="h-5 w-5" />
            </div>
            <button title="Students currently inside campus bounds" className="text-slate-300 hover:text-slate-500">
              <Info className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500">Students Inside</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              {(stats?.studentsInside || 0).toLocaleString()}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
              <span>Currently in campus</span>
            </div>
          </div>
        </div>

        {/* Card 3: Today Entries */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Activity className="h-5 w-5" />
            </div>
            <button title="Total gate entries recorded today" className="text-slate-300 hover:text-slate-500">
              <Info className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500">Today's Entries</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              {(stats?.todayEntries || 0).toLocaleString()}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-indigo-600">
              <ArrowUpRight className="h-4 w-4" />
              <span>Total entry scans</span>
            </div>
          </div>
        </div>

        {/* Card 4: Today Exits */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <LogOut className="h-5 w-5" />
            </div>
            <button title="Total gate exits recorded today" className="text-slate-300 hover:text-slate-500">
              <Info className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500">Today's Exits</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              {(stats?.todayExits || 0).toLocaleString()}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-blue-600">
              <ArrowDownRight className="h-4 w-4 text-blue-500" />
              <span>Total exit scans</span>
            </div>
          </div>
        </div>

      </div>

      {/* Middle Dual Charts Grid: Left Bar Chart (2/3) + Right Curve Sparkline (1/3) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Left 2 Cols: Main Bar Chart (Shopall Style Rounded Bar Chart) */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <p className="text-xs font-semibold text-slate-500">Gate Traffic Volume</p>
              <div className="flex items-baseline gap-3 mt-0.5">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {((stats?.todayEntries || 0) + (stats?.todayExits || 0)).toLocaleString()}
                </h3>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  +20.1% peak efficiency
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-semibold text-slate-600">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Last 7 Days</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9', radius: 8 }}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                />
                <Bar dataKey="entries" name="Entries" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={32} />
                <Bar dataKey="exits" name="Exits" fill="#cbd5e1" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Sparkline Curve Chart (Total Revenue / Activity Style) */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Live Campus Density</p>
            <div className="flex items-baseline gap-3 mt-0.5">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {stats?.studentsInside || 0}
              </h3>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <ArrowUpRight className="h-3.5 w-3.5" />
                Active Occupancy
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Real-time inside vs outside distribution</p>
          </div>

          <div className="h-52 w-full my-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="entries" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#purpleGradient)" dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Hardware Quick Indicators */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 flex items-center gap-2">
                <ScanLine className="h-3.5 w-3.5 text-indigo-500" /> RFID Barcode Scanner
              </span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Online
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 flex items-center gap-2">
                <Database className="h-3.5 w-3.5 text-indigo-500" /> Database (MySQL)
              </span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Connected
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 flex items-center gap-2">
                <Wifi className="h-3.5 w-3.5 text-indigo-500" /> LAN Network
              </span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Connected
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Table Section: "Recent Gate Logs" Shopall Tabular Style */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Table Controls Header */}
        <div className="flex flex-col gap-4 p-5 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">Recent Gate Logs</h3>
            <p className="text-xs text-slate-500 font-medium">Live gate entrance & exit records stream</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Today ({formattedDateStr})</span>
            </div>
            <button
              onClick={() => {
                const csvContent = "data:text/csv;charset=utf-8," 
                  + ["LRN,Name,Grade,Time,Status"].join(",") + "\n"
                  + filteredAttendance.map(r => `${r.student_number},"${r.student_name}",${r.section_name || r.course},${r.time_out || r.time_in},${r.time_out ? 'Exit' : 'Entry'}`).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `gate_logs_${today}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-100 px-5 pt-3 overflow-x-auto">
          {[
            { id: 'all', label: 'All Logs', count: todayRecords.length },
            { id: 'inside', label: 'Currently Inside', count: todayRecords.filter(r => !r.time_out).length },
            { id: 'outside', label: 'Exited Campus', count: todayRecords.filter(r => r.time_out).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setCurrentPage(1); }}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafc] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-5">Student Name</th>
                <th className="py-3.5 px-5">LRN / Student No.</th>
                <th className="py-3.5 px-5">Grade & Section</th>
                <th className="py-3.5 px-5">Scan Time</th>
                <th className="py-3.5 px-5 text-right">Status Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedAttendance.length > 0 ? (
                paginatedAttendance.map((record) => {
                  const isEntry = !record.time_out;
                  return (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900">
                        {record.student_name}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-500 font-semibold">
                        {record.student_number}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 font-medium">
                        {record.section_name || record.course || '—'}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-500 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {record.time_out || record.time_in}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border ${
                          isEntry
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isEntry ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                          {isEntry ? 'Inside Campus' : 'Exited Campus'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    No matching gate log records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-white text-xs text-slate-500 font-semibold">
          <span>
            Showing {filteredAttendance.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredAttendance.length)} of {filteredAttendance.length} entries
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-100 text-xs">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};


