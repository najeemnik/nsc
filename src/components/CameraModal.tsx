import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Camera, RefreshCw, Check, X, Upload, AlertCircle } from 'lucide-react';

export const CameraModal: React.FC = () => {
  const { cameraModalOpen, setCameraModalOpen, saveCameraPhotoAsDocument, t, cameraTargetData } = useApp();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState<string>('');

  useEffect(() => {
    if (cameraModalOpen) {
      setBillTitle(cameraTargetData?.title || '');
      setBillAmount(cameraTargetData?.amount ? String(cameraTargetData.amount) : '');
      setCapturedImage(null);
      setCameraError(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [cameraModalOpen]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('دسترسی به کمره در این مرورگر مجاز نیست یا کمره مسدود شده است. می‌توانید عکس را از موبایل یا کامپیوتر آپلود کنید.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedImage(event.target.result as string);
          if (!billTitle) {
            setBillTitle(file.name.replace(/\.[^/.]+$/, ''));
          }
          stopCamera();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleSave = () => {
    if (!capturedImage) return;
    const finalTitle = billTitle.trim() || `بل فیزیکی ${new Date().toLocaleDateString()}`;
    const finalAmount = billAmount ? parseFloat(billAmount) : undefined;
    saveCameraPhotoAsDocument(capturedImage, finalTitle, finalAmount);
  };

  if (!cameraModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-surface rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-line">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-canvas">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">{t.captureWithCamera}</h3>
              <p className="text-xs text-slate-500">{t.appSubtitle}</p>
            </div>
          </div>
          <button
            onClick={() => setCameraModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative w-full aspect-4/3 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured Bill"
                className="w-full h-full object-contain bg-slate-950"
              />
            ) : (
              <>
                {cameraError ? (
                  <div className="p-6 text-center text-slate-300 space-y-3">
                    <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                    <p className="text-sm font-medium text-slate-200">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>انتخاب عکس از حافظه دستگاه</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-6 border-2 border-dashed border-white/60 rounded-lg pointer-events-none flex flex-col justify-between p-3">
                      <span className="text-[10px] text-white/80 bg-black/50 px-2 py-0.5 rounded self-start">رسید را داخل چارچوب قرار دهید</span>
                    </div>
                  </>
                )}
              </>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.description} / {t.billNumber}</label>
              <input
                type="text"
                value={billTitle}
                onChange={(e) => setBillTitle(e.target.value)}
                placeholder="مثال: بل سیخ‌گول کابل استیل #492"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.totalAmount} ({t.currency})</label>
              <input
                type="number"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
                placeholder="مثلاً: 35000"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        <div className="px-6 py-4 bg-canvas border-t border-line flex items-center justify-between">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 rtl:space-x-reverse text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 py-2 px-3 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>آپلود فایل</span>
          </button>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {capturedImage ? (
              <>
                <button
                  type="button"
                  onClick={retake}
                  className="flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.retakePhoto}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center space-x-1.5 rtl:space-x-reverse px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.usePhoto}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!!cameraError}
                className="flex items-center space-x-2 rtl:space-x-reverse px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>{t.snapPhoto}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
