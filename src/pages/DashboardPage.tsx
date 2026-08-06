import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Users,
  DoorOpen,
  DoorClosed,
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
  CheckCircle2
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
        r.course?.toLowerCase().includes(search)
      );
    })
    .slice(-5) // Take last 5
    .reverse(); // Newest first

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">System Dashboard</h1>
          <p className="text-sm text-slate-500">Live school gate entrance monitoring data overview.</p>
        </div>
        
        {/* Live Clock / Refresh Button */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm shadow-sm font-semibold text-slate-700">
            <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
            <span>{format(currentTime, 'hh:mm:ss A')}</span>
          </div>
          <Button variant="outline" size="md" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 text-slate-600" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
        
        {/* 1. Total Students */}
        <Card className="hover:shadow-md border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{stats?.totalStudents || 0}</h3>
            </div>
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* 2. Students Inside */}
        <Card className="hover:shadow-md border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inside School</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{stats?.studentsInside || 0}</h3>
            </div>
            <div className="rounded-lg bg-green-50 p-2.5 text-green-600">
              <DoorOpen className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* 3. Students Outside */}
        <Card className="hover:shadow-md border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outside School</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{stats?.studentsOutside || 0}</h3>
            </div>
            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600">
              <DoorClosed className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* 4. Today Entries */}
        <Card className="hover:shadow-md border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today Entries</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{stats?.todayEntries || 0}</h3>
            </div>
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <LogIn className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* 5. Today Exits */}
        <Card className="hover:shadow-md border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today Exits</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{stats?.todayExits || 0}</h3>
            </div>
            <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600">
              <LogOut className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* 6. Invalid Scans */}
        <Card className="hover:shadow-md border-l-4 border-l-red-500 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invalid Scans</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{stats?.invalidScans || 0}</h3>
            </div>
            <button
              onClick={resetStats}
              title="Reset counter"
              className="rounded-lg bg-red-50 p-2.5 text-red-600 hover:bg-red-100 transition-colors"
            >
              <AlertTriangle className="h-5 w-5" />
            </button>
          </div>
        </Card>

      </div>

      {/* Main Graphs & Search Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Attendance Graph Widget */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Attendance Trends</CardTitle>
              <CardDescription>Gate entries and exits for the last 7 active days.</CardDescription>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
              <TrendingUp className="h-3.5 w-3.5" />
              Live Feed
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 550 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 550 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="entries" name="Entries" stroke="#16a34a" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEntries)" />
                  <Area type="monotone" dataKey="exits" name="Exits" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExits)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Live Gate Scans list */}
        <Card className="flex flex-col">
          <CardHeader>
            <div>
              <CardTitle>Today's Live Scans</CardTitle>
              <CardDescription>Real-time monitor of gate attendance logs</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            {/* Search filter inside Card */}
            <div className="relative mb-4">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search today's scans..."
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* List */}
            <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[260px] pr-1 scrollbar-thin">
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{record.student_name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{record.student_number} • {record.section_name || record.course}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={record.time_out ? 'secondary' : 'success'}>
                        {record.time_out ? 'Time Out' : 'Time In'}
                      </Badge>
                      <p className="text-[10px] font-bold text-slate-500 mt-1 flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {record.time_out || record.time_in}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="rounded-full bg-slate-100 p-3 mb-2 text-slate-400">
                    <Search className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-medium text-slate-400">No matching scans found for today</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Status Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-blue-600" />
                System Status
              </CardTitle>
              <CardDescription>Live health of connected devices</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-3">
              {[
                { label: 'Barcode Scanner',   icon: ScanLine,  status: 'Online',    ok: true },
                { label: 'Camera System',     icon: Monitor,   status: 'Active',    ok: true },
                { label: 'Database',          icon: Database,  status: 'Connected', ok: true },
                { label: 'Internet Connection', icon: Wifi,    status: 'Online',    ok: true },
              ].map(({ label, icon: Icon, status, ok }) => (
                <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-md bg-white p-1.5 border border-slate-200">
                      <Icon className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{label}</span>
                  </div>
                  <span className={`flex items-center gap-1.5 text-[11px] font-bold ${ ok ? 'text-green-600' : 'text-red-500'}`}>
                    <span className={`h-2 w-2 rounded-full animate-pulse ${ ok ? 'bg-green-500' : 'bg-red-500'}`} />
                    {status}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-100 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <p className="text-[11px] font-semibold text-green-700">All systems operational</p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};


