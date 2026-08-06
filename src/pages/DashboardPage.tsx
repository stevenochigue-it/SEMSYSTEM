import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
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
  ShieldAlert
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from '../utils/dateTime';

export const DashboardPage: React.FC = () => {
  const { stats, chartData, attendance, refreshData, resetStats } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    await refreshData();
  };

  // Filter today's recent attendance records matching search
  const today = format(currentTime, 'YYYY-MM-DD');
  const filteredAttendance = attendance
    .filter(r => r.date === today)
    .filter(r => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        r.student_name?.toLowerCase().includes(search) ||
        r.student_number.toLowerCase().includes(search) ||
        (r.section_name && r.section_name.toLowerCase().includes(search)) ||
        (r.course && r.course.toLowerCase().includes(search))
      );
    })
    .slice(-7) // Take last 7 for feed
    .reverse(); // Newest first

  const formattedDateStr = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 pb-6">
      
      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
            Gate Access Terminal Overview
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Main Access Gate Monitoring System — Live Analytics & Diagnostics
          </p>
        </div>
        
        {/* Date & Live Clock Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2.5 rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2 text-xs font-semibold text-slate-600">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span>{formattedDateStr}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-100 px-4 py-2 text-xs shadow-xs font-bold text-blue-700">
            <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
            <span className="font-mono text-sm tracking-wide">{format(currentTime, 'hh:mm:ss A')}</span>
          </div>

          <Button variant="outline" size="sm" onClick={handleRefresh} className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Top Stat Cards Section - 4 Column Layout like reference */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* 1. Students Inside */}
        <div className="group rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Students Inside</p>
                <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-0.5">
                  {(stats?.studentsInside || 0).toLocaleString()}
                </h3>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Currently in campus</span>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 2. Today's Entries */}
        <div className="group rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <LogIn className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Entries</p>
                <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-0.5">
                  {(stats?.todayEntries || 0).toLocaleString()}
                </h3>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Total entries today</span>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 3. Today's Exits */}
        <div className="group rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
                <LogOut className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Exits</p>
                <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-0.5">
                  {(stats?.todayExits || 0).toLocaleString()}
                </h3>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Total exits today</span>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 4. Blocked / Invalid Scans */}
        <div className="group rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Blocked Attempts</p>
                <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-0.5">
                  {(stats?.invalidScans || 0).toLocaleString()}
                </h3>
              </div>
            </div>
            <button
              onClick={resetStats}
              title="Reset invalid scan counter"
              className="rounded-lg p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
            >
              <AlertTriangle className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Invalid or unknown IDs</span>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

      </div>

      {/* Main Content Grid: Attendance Chart (2 cols) & Live Feed / System Status (1 col) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Left 2 Cols: Attendance Trends Chart */}
        <Card className="lg:col-span-2 rounded-2xl border-slate-200/80 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-extrabold text-slate-800">Gate Traffic Trends</CardTitle>
                <CardDescription className="text-xs text-slate-500">Real-time daily entries vs exits statistics for active days</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  />
                  <Area type="monotone" dataKey="entries" name="Entries" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEntries)" />
                  <Area type="monotone" dataKey="exits" name="Exits" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorExits)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Legend Footer */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-8 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Gate Entries</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-slate-600">Gate Exits</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right 1 Col: Live Activity Feed & System Health */}
        <div className="space-y-6 flex flex-col justify-between">
          
          {/* Live Activity Stream */}
          <Card className="rounded-2xl border-slate-200/80 shadow-sm flex-1 flex flex-col">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Today's Activity Logs
                </CardTitle>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Live</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col justify-between">
              {/* Search Bar */}
              <div className="relative mb-3">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter logs by name or LRN..."
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                />
              </div>

              {/* Feed Stream */}
              <div className="space-y-2.5 overflow-y-auto max-h-[220px] pr-1 scrollbar-thin flex-1">
                {filteredAttendance.length > 0 ? (
                  filteredAttendance.map((record) => {
                    const isEntry = !record.time_out;
                    return (
                      <div
                        key={record.id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50/80 transition-colors shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-white font-bold text-[10px] ${isEntry ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                            {isEntry ? 'IN' : 'OUT'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-tight">{record.student_name}</p>
                            <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                              {record.student_number} • {record.section_name || record.course}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isEntry ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {isEntry ? 'ENTRY' : 'EXIT'}
                          </span>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 flex items-center justify-end gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {record.time_out || record.time_in}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Search className="h-6 w-6 text-slate-300 mb-2" />
                    <p className="text-xs font-medium text-slate-400">No activity logs recorded for today yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Status Hardware Panel */}
          <Card className="rounded-2xl border-slate-200/80 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3">
              <CardTitle className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Monitor className="h-3.5 w-3.5 text-blue-600" />
                System Hardware Health
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              {[
                { label: 'Barcode Scanner',   icon: ScanLine,  status: 'Online',    ok: true },
                { label: 'Camera System',     icon: Monitor,   status: 'Active',    ok: true },
                { label: 'Database',          icon: Database,  status: 'Connected', ok: true },
                { label: 'Internet Network',  icon: Wifi,      status: 'Online',    ok: true },
              ].map(({ label, icon: Icon, status, ok }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700">{label}</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    {status}
                  </span>
                </div>
              ))}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2 text-emerald-700 text-[11px] font-bold">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                All hardware systems operational
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
};


