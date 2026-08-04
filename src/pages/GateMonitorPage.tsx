import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import type { ScanResult } from '../types';
import { format } from '../utils/dateTime';
import { Html5Qrcode } from 'html5-qrcode';
import {
  GraduationCap,
  Clock,
  Camera,
  Keyboard,
  CheckCircle,
  XCircle,
  HelpCircle,
  Volume2,
  VolumeX,
  History
} from 'lucide-react';

// Web Audio API helper to synthesize feedback sound effects
const playSound = (type: 'success' | 'error') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'success') {
      // High-pitched double beep
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
      // Low-pitched buzz beep
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
  const { scanQR, attendance } = useData();

  // Input & scan states
  const [scanMode, setScanMode] = useState<'usb' | 'camera'>('usb');
  const [scanValue, setScanValue] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [lastScannedTime, setLastScannedTime] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Camera & Webcam states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Time & Timer states
  const [currentTime, setCurrentTime] = useState(new Date());
  const autoClearTimerRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Start scanner function
  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(false);

    // Short timeout to ensure React renders the container element in DOM
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
            // Stop scanning immediately to prevent loops while showing results
            await stopCamera();

            const nowStr = format(new Date(), 'hh:mm:ss A');
            const response = await scanQR(decodedText);
            setScanResult(response);
            setLastScannedTime(nowStr);

            if (response.success) {
              if (soundEnabled) playSound('success');
            } else {
              if (soundEnabled) playSound('error');
            }

            // Auto-clear & restart camera after 5 seconds
            if (autoClearTimerRef.current) {
              clearTimeout(autoClearTimerRef.current);
            }
            autoClearTimerRef.current = setTimeout(() => {
              handleClearDisplay();
            }, 5000);
          },
          (_errorMessage) => {
            // Ignore normal scanning debug output
          }
        );
        setCameraActive(true);
      } catch (err: any) {
        console.error('Failed to start camera:', err);
        setCameraError(err.message || 'Could not access the laptop camera. Check camera permissions.');
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
      // Clean up camera scanner on unmount
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error('Cleanup failed:', err));
      }
    };
  }, [scanMode]);

  const handleClearDisplay = async () => {
    if (autoClearTimerRef.current) {
      clearTimeout(autoClearTimerRef.current);
    }
    setScanResult(null);
    if (scanMode === 'camera') {
      await startCamera();
    }
  };

  // Scan processor for manual/USB submission
  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanValue = scanValue.trim();
    if (!cleanValue) return;

    if (autoClearTimerRef.current) {
      clearTimeout(autoClearTimerRef.current);
    }

    try {
      const nowStr = format(new Date(), 'hh:mm:ss A');

      const response = await scanQR(cleanValue);
      setScanResult(response);
      setLastScannedTime(nowStr);

      if (response.success) {
        if (soundEnabled) playSound('success');
      } else {
        if (soundEnabled) playSound('error');
      }

      // Auto-clear after 5 seconds
      autoClearTimerRef.current = setTimeout(() => {
        handleClearDisplay();
      }, 5000);

    } catch (error) {
      console.error('Scan processing failed:', error);
    } finally {
      setScanValue('');
    }
  };

  // Get last 5 today scans
  const todayDateStr = format(new Date(), 'YYYY-MM-DD');
  const todayScans = attendance
    .filter(r => r.date === todayDateStr)
    .slice(-4)
    .reverse();

  return (
    <div className="space-y-6" onClick={focusInput}>
      
      {/* Page Title & Sound Toggle & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Gate Access Terminal</h1>
          <p className="text-sm text-slate-500">
            {scanMode === 'usb'
              ? 'Auto-captures scan inputs from USB barcode scanners.'
              : 'Uses your laptop webcam to scan student QR codes.'}
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
                  ? 'bg-white text-emerald-800 shadow-sm'
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
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Webcam Scanner</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setSoundEnabled(!soundEnabled);
            }}
            className="flex items-center gap-1.5"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-650" /> : <VolumeX className="h-4 w-4 text-slate-450" />}
            <span>{soundEnabled ? 'Audio Feedback On' : 'Muted'}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Main Scanner Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-2 border-emerald-600 shadow-lg relative overflow-hidden bg-white">
            
            {/* School Brand Accent Header */}
            <div className="bg-emerald-950 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-800 p-2 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wider uppercase">St. Mary's Academy</h3>
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest leading-none mt-1">MAIN ACCESS GATE</p>
                </div>
              </div>

              {/* Large Clock Display */}
              <div className="text-right">
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">{format(currentTime, 'YYYY-MM-DD')}</p>
                <p className="text-base font-extrabold tracking-tight mt-0.5">{format(currentTime, 'hh:mm:ss A')}</p>
              </div>
            </div>

            {/* Manual/USB Input Form (hidden in camera mode) */}
            {scanMode === 'usb' && (
              <form onSubmit={handleScanSubmit} className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-3 animate-fade-in">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Keyboard className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={scanValue}
                    onChange={(e) => setScanValue(e.target.value)}
                    placeholder="Focusing for USB scanner. Or type manually and press Enter..."
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-inner"
                  />
                </div>
                <Button type="submit" size="sm" className="shrink-0">Submit</Button>
              </form>
            )}

            <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px]">
              
              {scanMode === 'camera' && !scanResult ? (
                /* Webcam Camera Scanning Mode */
                <div className="flex flex-col items-center justify-center space-y-4 w-full py-4 animate-fade-in">
                  <div className="relative w-full max-w-sm aspect-video overflow-hidden rounded-2xl border-4 border-emerald-600 bg-slate-950 shadow-2xl flex items-center justify-center">
                    
                    {/* HTML5 QR Code video element Target */}
                    <div id="qr-reader" className="w-full h-full object-cover"></div>
                    
                    {/* Custom Glowing Laser Target Overlay */}
                    {cameraActive && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
                        <div className="flex justify-between">
                          <div className="w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-md"></div>
                          <div className="w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-md"></div>
                        </div>
                        
                        {/* Scanning Laser Line */}
                        <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-scan"></div>
                        
                        <div className="flex justify-between">
                          <div className="w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-md"></div>
                          <div className="w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-md"></div>
                        </div>
                      </div>
                    )}

                    {/* Loading/Error state screen */}
                    {!cameraActive && (
                      <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-center p-6 text-white z-20">
                        {cameraError ? (
                          <div className="space-y-4">
                            <XCircle className="h-10 w-10 text-red-500 mx-auto" />
                            <h4 className="font-bold text-sm">Camera Connection Failed</h4>
                            <p className="text-xs text-slate-400 max-w-xs">{cameraError}</p>
                            <Button size="sm" variant="secondary" onClick={startCamera}>
                              Try Again
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3 animate-pulse">
                            <Camera className="h-10 w-10 text-emerald-400 mx-auto" />
                            <h4 className="font-bold text-sm">Starting Web Camera...</h4>
                            <p className="text-[11px] text-slate-400">Please grant camera permissions if prompted by your browser.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-emerald-750 animate-pulse uppercase tracking-wider">
                      ● Camera Scan Feed Active
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                      Hold a student QR code (printed card or phone screen) in front of your laptop's front camera.
                    </p>
                  </div>
                </div>
              ) : !scanResult ? (
                /* USB / Manual Mode Waiting State */
                <div className="text-center py-8 space-y-4 animate-pulse">
                  <div className="rounded-full bg-emerald-50 p-6 inline-flex border border-emerald-100 text-emerald-600">
                    <Camera className="h-12 w-12" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-700">Scan QR Code Card</h4>
                    <p className="text-xs text-slate-450 mt-1 max-w-sm mx-auto">
                      Place the student's printed QR card in front of the scanner. Access status will automatically show.
                    </p>
                  </div>
                </div>
              ) : (
                /* Scan Results Card */
                <div className="w-full space-y-6 animate-fade-in">
                  
                  {/* Status Banner */}
                  <div
                    className={`w-full py-4 px-6 rounded-2xl flex items-center justify-between border ${
                      scanResult.success
                        ? 'bg-green-50 border-green-200 text-green-800 animate-pulse-green'
                        : 'bg-red-50 border-red-200 text-red-800 animate-pulse-red'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {scanResult.success ? (
                        <CheckCircle className="h-8 w-8 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="h-8 w-8 text-red-650 shrink-0" />
                      )}
                      <div>
                        <h2 className="text-xl font-extrabold tracking-wider uppercase leading-none">
                          {scanResult.success ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                        </h2>
                        <p className="text-xs font-semibold mt-1">
                          {scanResult.message}
                        </p>
                      </div>
                    </div>
                    {scanResult.action && (
                      <Badge variant={scanResult.action === 'time_in' ? 'emerald' : 'info'} className="text-sm px-3 py-1 uppercase">
                        {scanResult.action === 'time_in' ? 'Time In' : 'Time Out'}
                      </Badge>
                    )}
                  </div>

                  {/* Student Details Card */}
                  {scanResult.success && scanResult.student && (
                    <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                      
                      {/* Photo */}
                      {scanResult.student.photo ? (
                        <img
                          src={scanResult.student.photo}
                          alt={scanResult.student.first_name}
                          className="w-28 h-28 object-cover rounded-2xl border-2 border-emerald-600 shadow-md shrink-0"
                        />
                      ) : (
                        <div className="w-28 h-28 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-400 shrink-0 shadow-inner">
                          <Keyboard className="w-10 h-10" />
                          <span className="text-[10px] font-bold uppercase mt-1">No Photo</span>
                        </div>
                      )}

                      {/* Data Columns */}
                      <div className="flex-1 w-full grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div className="col-span-2 border-b border-slate-200/60 pb-1.5">
                          <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider leading-none">Student Full Name</p>
                          <h3 className="text-base font-extrabold text-slate-800 uppercase mt-1">
                            {scanResult.student.first_name} {scanResult.student.last_name}
                          </h3>
                        </div>

                        <div>
                          <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Student Number</p>
                          <p className="text-slate-800 font-bold mt-0.5">{scanResult.student.student_number}</p>
                        </div>

                        <div>
                          <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Course / Section</p>
                          <p className="text-slate-800 font-bold mt-0.5">{scanResult.student.course} — {scanResult.student.section}</p>
                        </div>

                        <div>
                          <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Year Level</p>
                          <p className="text-slate-800 font-bold mt-0.5">{scanResult.student.year_level}</p>
                        </div>

                        <div>
                          <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Scan Timestamp</p>
                          <p className="text-slate-800 font-bold mt-0.5">{lastScannedTime}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Invalid Student details message */}
                  {!scanResult.success && (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
                      <HelpCircle className="h-10 h-10 mb-2" />
                      <p className="text-sm font-bold text-slate-700">Invalid QR Payload Scan</p>
                      <p className="text-xs mt-1">Please check if the printed code matches a registered Student ID in the system database.</p>
                    </div>
                  )}

                  {/* Manual Clear / Resume Scanner trigger */}
                  <div className="flex justify-end">
                    <Button
                      variant={scanMode === 'camera' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={handleClearDisplay}
                    >
                      {scanMode === 'camera' ? 'Scan Next Student' : 'Clear Display'}
                    </Button>
                  </div>

                </div>
              )}

            </CardContent>
          </Card>
        </div>

        {/* Scan Log History Sidebar */}
        <div className="space-y-6">
          <Card className="h-full flex flex-col justify-between">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <History className="h-5 w-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Today's Scans History</h3>
                <p className="text-[11px] text-slate-400">Latest card scans processed today.</p>
              </div>
            </div>

            <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-[360px] scrollbar-thin px-5">
              {todayScans.length > 0 ? (
                todayScans.map((scan) => (
                  <div key={scan.id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800 leading-tight">{scan.student_name}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{scan.student_number} • {scan.course}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={scan.time_out ? 'secondary' : 'success'} className="px-1.5 py-0.5 text-[9px] uppercase">
                        {scan.time_out ? 'Time Out' : 'Time In'}
                      </Badge>
                      <p className="text-[10px] font-bold text-slate-500 mt-1">
                        {scan.time_out || scan.time_in}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                  <Clock className="h-7 w-7 text-slate-300 mb-1" />
                  <p className="text-xs font-semibold">No scans logged yet today</p>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
