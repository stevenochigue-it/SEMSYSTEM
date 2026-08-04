import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import type { ScanResult } from '../types';
import { format } from '../utils/dateTime';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Clock,
  Camera,
  Keyboard,
  CheckCircle,
  XCircle,
  Volume2,
  VolumeX,
  History,
  LogOut,
  ShieldCheck,
  Trash2,
  Sparkles,
  UserCheck
} from 'lucide-react';

interface ScannedCardItem {
  id: string;
  result: ScanResult;
  scannedAt: string;
}

// Web Audio API helper to synthesize feedback sound effects
const playSound = (type: 'success' | 'error') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'success') {
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);

      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gainNode2 = audioCtx.createGain();
        osc2.connect(gainNode2);
        gainNode2.connect(audioCtx.destination);
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gainNode2.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.15);
      }, 100);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, audioCtx.currentTime); // low buzz
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    }
  } catch (err) {
    console.error('Audio synthesis failed:', err);
  }
};

export const GateMonitorPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { scanQR, attendance } = useData();

  // Input & scan states
  const [scanMode, setScanMode] = useState<'usb' | 'camera'>('usb');
  const [scanValue, setScanValue] = useState('');
  
  // Real-time array of scanned student cards
  const [scannedCards, setScannedCards] = useState<ScannedCardItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isProcessingCameraScan, setIsProcessingCameraScan] = useState(false);

  // Camera & Webcam states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Time & Timer states
  const [currentTime, setCurrentTime] = useState(new Date());
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-dismiss card timeouts tracker
  const dismissTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Clear all dismiss timers on unmount
  useEffect(() => {
    return () => {
      dismissTimeouts.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // Live clock interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-focus barcode scan text input on render and after clicks (only in USB mode)
  useEffect(() => {
    if (scanMode === 'usb') {
      focusInput();
      const focusInterval = setInterval(focusInput, 3000);
      return () => clearInterval(focusInterval);
    }
  }, [scanMode]);

  const focusInput = () => {
    if (inputRef.current && scanMode === 'usb') {
      inputRef.current.focus();
    }
  };

  // Process a QR code payload scan and add card to live feed
  const processScanPayload = async (payload: string) => {
    const nowStr = format(new Date(), 'hh:mm:ss A');
    const response = await scanQR(payload);

    const newCardItem: ScannedCardItem = {
      id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      result: response,
      scannedAt: nowStr,
    };

    // Prepend new card to the live cards array (keep up to last 6 slots)
    setScannedCards(prev => [newCardItem, ...prev].slice(0, 6));

    // Auto-dismiss card after 3 seconds
    const dismissTimer = setTimeout(() => {
      setScannedCards(prev => prev.filter(c => c.id !== newCardItem.id));
      dismissTimeouts.current.delete(newCardItem.id);
    }, 3000);
    dismissTimeouts.current.set(newCardItem.id, dismissTimer);

    if (response.success) {
      if (soundEnabled) playSound('success');
    } else {
      if (soundEnabled) playSound('error');
    }

    return response;
  };

  // Start camera scanner function
  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(false);

    setTimeout(async () => {
      const element = document.getElementById('qr-reader');
      if (!element) return;

      try {
        const html5QrCode = new Html5Qrcode('qr-reader');
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'user' }, // laptop front camera
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            }
          },
          async (decodedText) => {
            // Prevent duplicate triggers while processing a scan
            if (isProcessingCameraScan) return;
            setIsProcessingCameraScan(true);

            await processScanPayload(decodedText);

            // Pause for 1.5s then resume continuous scanning
            setTimeout(() => {
              setIsProcessingCameraScan(false);
            }, 1500);
          },
          (_errorMessage) => {
            // Ignore normal scanning debug output
          }
        );
        setCameraActive(true);
      } catch (err: any) {
        console.error('Failed to start camera:', err);
        setCameraError(err.message || 'Could not access laptop camera. Check camera permissions.');
        setCameraActive(false);
      }
    }, 300);
  };

  // Stop scanner function
  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error('Failed to stop camera:', err);
      }
    }
    html5QrCodeRef.current = null;
    setCameraActive(false);
  };

  // Handle scanMode switching and component unmounting
  useEffect(() => {
    if (scanMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error('Cleanup failed:', err));
      }
    };
  }, [scanMode]);

  // Scan processor for manual/USB submission
  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanValue = scanValue.trim();
    if (!cleanValue) return;

    try {
      await processScanPayload(cleanValue);
    } catch (error) {
      console.error('Scan processing failed:', error);
    } finally {
      setScanValue('');
    }
  };

  // Clear live active cards feed
  const handleClearFeed = () => {
    setScannedCards([]);
  };

  // Get today's recent logs for history sidebar
  const todayDateStr = format(new Date(), 'YYYY-MM-DD');
  const todayScans = attendance
    .filter(r => r.date === todayDateStr)
    .slice(-6)
    .reverse();

  return (
    <div className="space-y-6" onClick={focusInput}>
      
      {/* Standalone Guard Officer Header (Visible when logged in as guard) */}
      {user?.role === 'guard' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-blue-800/80 animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-600/30 text-white shrink-0">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold tracking-wide uppercase">Gate Access Terminal Portal</h2>
                <span className="bg-blue-500/20 text-blue-300 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-blue-500/30">
                  Duty Guard Shift
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

      {/* Page Title Bar & Scanner Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Gate Access Terminal</h1>
          <p className="text-sm text-slate-500">
            {scanMode === 'usb'
              ? 'Auto-captures scan inputs from USB barcode scanners into student cards feed.'
              : 'Continuous webcam scanning mode â€” scan student QR cards one after another.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setScanMode('usb');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                scanMode === 'usb'
                  ? 'bg-white text-blue-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Keyboard className="h-3.5 w-3.5" />
              <span>USB / Manual</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setScanMode('camera');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                scanMode === 'camera'
                  ? 'bg-white text-blue-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Webcam Scanner</span>
            </button>
          </div>

          {/* Sound Feedback Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setSoundEnabled(!soundEnabled);
            }}
            className="flex items-center gap-1.5"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-blue-600" /> : <VolumeX className="h-4 w-4 text-slate-450" />}
            <span>{soundEnabled ? 'Audio On' : 'Muted'}</span>
          </Button>

          {/* Clear Active Feed Button */}
          {scannedCards.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearFeed}
              className="flex items-center gap-1.5 text-red-700 bg-red-50 hover:bg-red-100 border-red-200"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Feed ({scannedCards.length})</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Main Terminal Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Scanner Input Header Box */}
          <Card className="border-2 border-blue-600 shadow-lg relative overflow-hidden bg-white">
            
            {/* School Brand Accent Header */}
            <div className="bg-blue-950 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="bg-blue-800 p-2 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wider uppercase">San Isidro National High School</h3>
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest leading-none mt-1">MAIN ACCESS GATE TERMINAL</p>
                </div>
              </div>

              {/* Live Clock Display */}
              <div className="text-right">
                <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">{format(currentTime, 'YYYY-MM-DD')}</p>
                <p className="text-base font-extrabold tracking-tight mt-0.5">{format(currentTime, 'hh:mm:ss A')}</p>
              </div>
            </div>

            {/* Manual/USB Input Form */}
            {scanMode === 'usb' ? (
              <form onSubmit={handleScanSubmit} className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Keyboard className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={scanValue}
                    onChange={(e) => setScanValue(e.target.value)}
                    placeholder="Auto-focusing for USB barcode scanner... (or type QR value & press Enter)"
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner"
                  />
                </div>
                <Button type="submit" size="sm" className="shrink-0">Submit Scan</Button>
              </form>
            ) : (
              /* Webcam Camera Scanning Box */
              <div className="p-6 flex flex-col items-center justify-center bg-slate-900 text-white">
                <div className="relative w-full max-w-sm aspect-video overflow-hidden rounded-2xl border-4 border-blue-500 bg-slate-950 shadow-2xl flex items-center justify-center">
                  
                  {/* HTML5 QR Code video element Target */}
                  <div id="qr-reader" className="w-full h-full object-cover"></div>
                  
                  {/* Laser Target Overlay */}
                  {cameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
                      <div className="flex justify-between">
                        <div className="w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-md"></div>
                        <div className="w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-md"></div>
                      </div>
                      
                      {/* Scanning Laser Line */}
                      <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-blue-400 shadow-[0_0_8px_#5aaee8] animate-scan"></div>
                      
                      <div className="flex justify-between">
                        <div className="w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-md"></div>
                        <div className="w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-md"></div>
                      </div>
                    </div>
                  )}

                  {!cameraActive && (
                    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-center p-6 text-white z-20">
                      {cameraError ? (
                        <div className="space-y-3">
                          <XCircle className="h-10 w-10 text-red-500 mx-auto" />
                          <h4 className="font-bold text-sm">Camera Error</h4>
                          <p className="text-xs text-slate-400">{cameraError}</p>
                          <Button size="sm" variant="secondary" onClick={startCamera}>Retry Camera</Button>
                        </div>
                      ) : (
                        <div className="space-y-3 animate-pulse">
                          <Camera className="h-10 w-10 text-blue-400 mx-auto" />
                          <h4 className="font-bold text-sm">Initializing Laptop Camera...</h4>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mt-3 animate-pulse flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  {isProcessingCameraScan ? 'Scan Captured! Next Student Ready...' : 'â— Camera Scanner Ready â€” Hold Student QR Code'}
                </p>
              </div>
            )}
          </Card>

          {/* Live Gate Monitor Feed â€” Fixed 6-Slot Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                <span>Live Gate Monitor Feed</span>
                <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                  scannedCards.length > 0
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {scannedCards.length}/6 Slots
                </span>
              </h2>
            </div>

            {/* 6-Slot Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, slotIndex) => {
                const item = scannedCards[slotIndex];
                const isLatest = slotIndex === 0 && item !== undefined;

                if (!item) {
                  // Empty Slot Placeholder â€” plain box with + in center
                  return (
                    <div
                      key={`slot-${slotIndex}`}
                      className="relative rounded-2xl min-h-[180px] transition-all overflow-hidden"
                      style={{ border: '2px solid #e2e8f0', background: '#f8fafc' }}
                    >
                      {/* Corner borders */}
                      <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-slate-300 rounded-tl-xl" />
                      <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-slate-300 rounded-tr-xl" />
                      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-slate-300 rounded-bl-xl" />
                      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-slate-300 rounded-br-xl" />
                      {/* + Center */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-slate-300 text-4xl font-thin leading-none select-none">+</span>
                      </div>
                    </div>
                  );
                }

                // Filled Slot â€” Student Card
                const res = item.result;
                const student = res.student;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border overflow-hidden bg-white shadow-md transition-all duration-300 ${
                      isLatest
                        ? res.success
                          ? 'border-2 border-green-500 ring-4 ring-green-100 animate-fade-in'
                          : 'border-2 border-red-500 ring-4 ring-red-100 animate-fade-in'
                        : res.success
                          ? 'border border-green-200'
                          : 'border border-red-200'
                    }`}
                  >
                    {/* Card Status Banner */}
                    <div className={`px-3 py-2 flex items-center justify-between border-b ${
                      res.success
                        ? 'bg-green-50 border-green-200 text-green-900'
                        : 'bg-red-50 border-red-200 text-red-900'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        {res.success
                          ? <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                          : <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                        }
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold tracking-wider uppercase leading-none">
                              {res.success ? 'GRANTED' : 'DENIED'}
                            </span>
                            {isLatest && (
                              <span className="bg-blue-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full animate-pulse">
                                NEW
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {res.action && (
                          <Badge variant={res.action === 'time_in' ? 'emerald' : 'info'} className="text-[9px] px-1.5 py-0.5 uppercase">
                            {res.action === 'time_in' ? 'In' : 'Out'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    {res.success && student ? (
                      <div className="p-3 flex flex-col items-center text-center gap-2">
                        {/* Photo */}
                        {student.photo ? (
                          <img
                            src={student.photo}
                            alt={student.first_name}
                            className="w-16 h-16 object-cover rounded-xl border-2 border-blue-500 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 shrink-0">
                            <Keyboard className="w-6 h-6" />
                            <span className="text-[8px] font-bold uppercase mt-0.5">No Photo</span>
                          </div>
                        )}

                        {/* Info */}
                        <div className="w-full text-left space-y-1">
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none">Full Name</p>
                          <p className="text-xs font-extrabold text-slate-800 uppercase leading-tight line-clamp-2">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-semibold">
                            #{student.student_number}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium leading-tight">
                            {student.grade_name || student.year_level || ''}{' '}
                            {student.section_name || student.section || ''}
                          </p>
                        </div>

                        {/* Time */}
                        <div className="w-full text-left">
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                            {item.scannedAt}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 text-center">
                        <p className="text-[10px] font-bold text-red-600">Unknown QR</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Not in database</p>
                        <p className="text-[9px] text-slate-400 mt-1">{item.scannedAt}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Scan Log History Sidebar Column */}
        <div className="space-y-6">
          <Card className="h-full flex flex-col justify-between bg-white shadow-md">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Today's Database Logs</h3>
                <p className="text-[11px] text-slate-400">All recorded entry/exit scans today.</p>
              </div>
            </div>

            <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-[420px] scrollbar-thin px-4">
              {todayScans.length > 0 ? (
                todayScans.map((scan) => (
                  <div key={scan.id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800 leading-tight">{scan.student_name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{scan.student_number} â€¢ {scan.section_name || scan.course || 'Student'}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={scan.time_out ? 'secondary' : 'success'} className="px-1.5 py-0.5 text-[9px] uppercase">
                        {scan.time_out ? 'Time Out' : 'Time In'}
                      </Badge>
                      <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                        {scan.time_out || scan.time_in}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                  <Clock className="h-7 w-7 text-slate-300 mb-1" />
                  <p className="text-xs font-semibold">No scans recorded today yet</p>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};


