import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { intlLocaleFor, isRtlLanguage, localizeText } from '../../i18n/localize';
import {
  Cloud,
  X,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FileText,
  ShieldCheck,
  HardDrive,
  Database
} from 'lucide-react';
import { listProjectFiles, deleteDriveFile, GoogleDriveFile } from '../../services/googleDriveService';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({ isOpen, onClose }) => {
  const {
    isGoogleDriveConnected,
    googleUser,
    connectGoogleDrive,
    disconnectGoogleDrive,
    backupToGoogleDrive,
    restoreFromGoogleDrive,
    language
  } = useApp();
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });

  const [loading, setLoading] = useState<boolean>(false);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [fetchingFiles, setFetchingFiles] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchFiles = async () => {
    if (!isGoogleDriveConnected) return;
    setFetchingFiles(true);
    try {
      const files = await listProjectFiles();
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Failed to list files:', err);
    } finally {
      setFetchingFiles(false);
    }
  };

  useEffect(() => {
    if (isOpen && isGoogleDriveConnected) {
      fetchFiles();
    }
  }, [isOpen, isGoogleDriveConnected]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const user = await connectGoogleDrive();
      if (user) {
        setMessage({ text: tx('Connected to Google Drive successfully.', 'اتصال به Google Drive برقرار شد.', 'له Google Drive سره ونښلېدئ.'), type: 'success' });
        await fetchFiles();
      }
    } catch {
      setMessage({ text: tx('Could not connect to Google Drive.', 'اتصال به Google Drive برقرار نشد.', 'له Google Drive سره نښلول ناکام شول.'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectGoogleDrive();
      setDriveFiles([]);
      setMessage({ text: tx('Disconnected from Google Drive.', 'اتصال به Google Drive قطع شد.', 'له Google Drive څخه جلا شوئ.'), type: 'info' });
    } catch {
      setMessage({ text: tx('Could not disconnect from Google Drive.', 'قطع اتصال از Google Drive انجام نشد.', 'له Google Drive څخه جلا کېدل ناکام شول.'), type: 'error' });
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await backupToGoogleDrive();
      setMessage({
        text: `${tx('Backup saved to Google Drive.', 'نسخهٔ پشتیبان در Google Drive ذخیره شد.', 'شاتړ په Google Drive کې خوندي شو.')} (${res.name})`,
        type: 'success'
      });
      await fetchFiles();
    } catch {
      setMessage({ text: tx('Backup failed.', 'تهیهٔ نسخهٔ پشتیبان انجام نشد.', 'د شاتړ جوړول ناکام شول.'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (file: GoogleDriveFile) => {
    if (!confirm(tx(`Restore from "${file.name}"? Current unsaved changes will be replaced.`, `از «${file.name}» بازیابی شود؟ تغییرات ذخیره‌نشدهٔ فعلی جایگزین خواهند شد.`, `له «${file.name}» څخه بېرته راواړوئ؟ اوسنۍ نه‌خوندي شوې بدلونونه به ځایناستي شي.`))) {
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await restoreFromGoogleDrive(file.id);
      setMessage({
        text: tx('Restore completed from Google Drive.', 'بازیابی از Google Drive انجام شد.', 'له Google Drive څخه بېرته راګرځول بشپړ شول.'),
        type: 'success'
      });
    } catch {
      setMessage({ text: tx('Restore failed.', 'بازیابی انجام نشد.', 'بېرته راګرځول ناکام شول.'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm(tx('Delete this file from Google Drive?', 'این فایل از Google Drive حذف شود؟', 'دا فایل له Google Drive څخه ړنګ کړئ؟'))) {
      return;
    }
    try {
      await deleteDriveFile(fileId);
      setDriveFiles(prev => prev.filter(f => f.id !== fileId));
      setMessage({ text: tx('File deleted from Google Drive.', 'فایل از Google Drive حذف شد.', 'فایل له Google Drive څخه ړنګ شو.'), type: 'info' });
    } catch {
      setMessage({ text: tx('Could not delete the file from Google Drive.', 'حذف فایل از Google Drive انجام نشد.', 'فایل له Google Drive څخه ړنګ نه شو.'), type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-surface rounded-3xl shadow-2xl border border-line overflow-hidden flex flex-col max-h-[90dvh]"
        dir={isRtlLanguage(language) ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{tx('Google Drive backups', 'پشتیبان‌گیری در Google Drive', 'په Google Drive کې شاتړ')}</h2>
              <p className="text-xs text-blue-100">
                {tx('Back up construction records and documents to your connected Google Drive account.', 'از سوابق ساختمانی و اسناد در حساب متصل Google Drive پشتیبان بگیرید.', 'د ودانیزو ریکارډونو او اسنادو شاتړ خپل نښلول شوي Google Drive حساب ته واخلئ.')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Notification Message */}
          {message && (
            <div className={`p-4 rounded-2xl flex items-start gap-3 text-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : message.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            }`}>
              {message.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />}
              {message.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              {message.type === 'info' && <Cloud className="w-5 h-5 shrink-0 mt-0.5" />}
              <span className="flex-1">{message.text}</span>
              <button onClick={() => setMessage(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
            </div>
          )}

          {/* Connection Status Box */}
          <div className="p-5 rounded-2xl bg-surface-2/60 border border-line/60">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-3.5 h-3.5 rounded-full ${isGoogleDriveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    {isGoogleDriveConnected
                      ? tx('Connected to Google Drive', 'به Google Drive وصل است', 'له Google Drive سره نښتی دی')
                      : tx('Not connected to Google Drive', 'به Google Drive وصل نیست', 'له Google Drive سره نه دی نښتی')}
                  </h3>
                  {isGoogleDriveConnected && googleUser && (
                    <p className="text-xs text-ink-muted mt-0.5 font-mono">
                      {googleUser.displayName} ({googleUser.email})
                    </p>
                  )}
                </div>
              </div>

              <div>
                {!isGoogleDriveConnected ? (
                  <button
                    onClick={handleConnect}
                    disabled={loading}
                    className="flex items-center gap-2.5 px-4 py-2.5 bg-surface text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl font-medium text-xs shadow-sm hover:shadow hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>{loading ? tx('Connecting...', 'در حال اتصال...', 'نښلېږي...') : tx('Sign in with Google', 'ورود با Google', 'ګوګل ته ننوتل')}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleDisconnect}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline px-3 py-1.5 font-medium"
                  >
                    {tx('Disconnect', 'قطع اتصال', 'اړیکه پرې کړئ')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions (Backup Now) */}
          {isGoogleDriveConnected && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-200 dark:border-blue-900/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold mb-1 text-sm">
                    <Database className="w-4 h-4" />
                    <span>{tx('Create a Google Drive backup', 'تهیهٔ نسخهٔ پشتیبان در Google Drive', 'په Google Drive کې شاتړ جوړ کړئ')}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {tx('Create a JSON backup of the workspace data supported by this feature. Access to the file follows your Google Drive sharing settings.', 'از داده‌های فضای کاری که این ابزار پشتیبانی می‌کند، نسخهٔ JSON بسازید. دسترسی به فایل تابع تنظیمات اشتراک‌گذاری Google Drive شما است.', 'د کاري ځای د ملاتړ شویو معلوماتو JSON شاتړ جوړ کړئ. فایل ته لاسرسی ستاسو د Google Drive د شریکولو له امستنو سره سم دی.')}
                  </p>
                </div>
                <button
                  onClick={handleBackup}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{loading ? tx('Backing up...', 'در حال پشتیبان‌گیری...', 'شاتړ جوړېږي...') : tx('Create backup in Drive', 'تهیهٔ نسخه در Drive', 'په Drive کې شاتړ جوړ کړئ')}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200 dark:border-emerald-900/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold mb-1 text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{tx('Drive access and storage', 'ذخیره و دسترسی در Drive', 'په Drive کې زېرمه او لاسرسی')}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {tx('Backup files are stored in the connected Google Drive account. Review that account’s access and sharing settings.', 'فایل‌های پشتیبان در حساب متصل Google Drive ذخیره می‌شوند. دسترسی و تنظیمات اشتراک‌گذاری آن حساب را بررسی کنید.', 'د شاتړ فایلونه په نښلول شوي Google Drive حساب کې ساتل کېږي. د دغه حساب د لاسرسي او شریکولو امستنې وګورئ.')}
                  </p>
                </div>
                <div className="text-[11px] text-ink-muted flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{tx('Folder:', 'پوشه:', 'پوښۍ:')} <strong>NIK_SMART_COUNT_BACKUPS</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Files on Google Drive */}
          {isGoogleDriveConnected && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>{tx('Files in Google Drive', 'فایل‌های Google Drive', 'په Google Drive کې فایلونه')}</span>
                  <span className="text-xs font-normal text-slate-400">({driveFiles.length})</span>
                </h4>
                <button
                  onClick={fetchFiles}
                  disabled={fetchingFiles}
                  className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title={tx('Refresh files', 'تازه‌سازی فایل‌ها', 'فایلونه تازه کړئ')}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${fetchingFiles ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {driveFiles.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-xs text-ink-muted">
                  {fetchingFiles ? tx('Searching Google Drive...', 'در حال جستجو در Google Drive...', 'په Google Drive کې لټون کېږي...') : tx('No backup files found. Use Create backup in Drive to add one.', 'فایل پشتیبانی پیدا نشد. برای افزودن فایل از «تهیهٔ نسخه در Drive» استفاده کنید.', 'د شاتړ فایل ونه موندل شو. د فایل زیاتولو لپاره «په Drive کې شاتړ جوړ کړئ» وکاروئ.')}
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {driveFiles.map(file => (
                    <div
                      key={file.id}
                      className="p-3 bg-surface/80 rounded-xl border border-line/80 flex items-center justify-between gap-3 text-xs hover:border-blue-400 transition shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {file.createdTime ? new Date(file.createdTime).toLocaleString(intlLocaleFor(language)) : ''}
                            {file.size ? ` • ${(parseInt(file.size) / 1024).toFixed(1)} KB` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {file.name.endsWith('.json') && (
                          <button
                            onClick={() => handleRestore(file)}
                            disabled={loading}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-medium transition flex items-center gap-1"
                            title={tx('Restore from this backup', 'بازیابی از این نسخه', 'له دې شاتړ څخه بېرته راوګرځوئ')}
                          >
                            <Download className="w-3 h-3" />
                            <span>{tx('Restore', 'بازیابی', 'بېرته راګرځول')}</span>
                          </button>
                        )}
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                            title={tx('Open in Google Drive', 'بازکردن در Google Drive', 'په Google Drive کې پرانیستل')}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                          title={tx('Delete from Google Drive', 'حذف از Google Drive', 'له Google Drive څخه ړنګول')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-2/80 border-t border-line flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition"
          >
            {tx('Close', 'بستن', 'بندول')}
          </button>
        </div>
      </div>
    </div>
  );
};
