import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
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
    t, 
    language 
  } = useApp();

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
        setMessage({ text: t('googleDriveConnectedSuccess') || 'Connected to Google Drive successfully!', type: 'success' });
        await fetchFiles();
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to connect Google Drive', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectGoogleDrive();
      setDriveFiles([]);
      setMessage({ text: t('googleDriveDisconnected') || 'Disconnected from Google Drive', type: 'info' });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await backupToGoogleDrive();
      setMessage({ 
        text: `${t('googleDriveBackupSuccess') || 'Database backed up to Google Drive successfully!'} (${res.name})`, 
        type: 'success' 
      });
      await fetchFiles();
    } catch (err: any) {
      setMessage({ text: err.message || 'Backup failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (file: GoogleDriveFile) => {
    if (!confirm(t('confirmRestore') || `Are you sure you want to restore database from "${file.name}"? Current unsaved changes will be replaced.`)) {
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await restoreFromGoogleDrive(file.id);
      setMessage({ 
        text: t('restoreSuccess') || 'Database successfully restored from Google Drive!', 
        type: 'success' 
      });
    } catch (err: any) {
      setMessage({ text: err.message || 'Restore failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm(t('confirmDelete') || 'Are you sure you want to delete this file from Google Drive?')) {
      return;
    }
    try {
      await deleteDriveFile(fileId);
      setDriveFiles(prev => prev.filter(f => f.id !== fileId));
      setMessage({ text: 'File deleted from Google Drive', type: 'info' });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-surface rounded-3xl shadow-2xl border border-line overflow-hidden flex flex-col max-h-[90vh]"
        dir={language === 'en' ? 'ltr' : 'rtl'}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t('googleDriveIntegration') || 'Google Drive Cloud Storage'}</h2>
              <p className="text-xs text-blue-100">
                {t('googleDriveSubtitle') || 'Backup construction data, receipts & bills to your Google Drive'}
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
                      ? (t('connectedAs') || 'Connected to Google Drive')
                      : (t('notConnected') || 'Not connected to Google Drive')}
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
                    <span>{loading ? 'Connecting...' : (t('signInWithGoogle') || 'Sign in with Google')}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleDisconnect}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline px-3 py-1.5 font-medium"
                  >
                    {t('disconnect') || 'Disconnect'}
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
                    <span>{t('backupDatabase') || 'Backup Database to Google Drive'}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {t('backupDatabaseDesc') || 'Export all projects, expenses, steel, concrete, payments, and users into a secure JSON backup in Google Drive.'}
                  </p>
                </div>
                <button
                  onClick={handleBackup}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{loading ? 'Backing up...' : (t('createBackupNow') || 'Create Backup in Drive')}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200 dark:border-emerald-900/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold mb-1 text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t('cloudSafety') || 'Permanent Cloud Security'}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {t('cloudSafetyDesc') || 'Your data is saved in your own private Google Drive folder ("NIK_SMART_COUNT_BACKUPS") and can be restored at any time.'}
                  </p>
                </div>
                <div className="text-[11px] text-ink-muted flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Folder: <strong>NIK_SMART_COUNT_BACKUPS</strong></span>
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
                  <span>{t('filesInDrive') || 'Files in Google Drive Project Folder'}</span>
                  <span className="text-xs font-normal text-slate-400">({driveFiles.length})</span>
                </h4>
                <button
                  onClick={fetchFiles}
                  disabled={fetchingFiles}
                  className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Refresh files"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${fetchingFiles ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {driveFiles.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-xs text-ink-muted">
                  {fetchingFiles ? 'Searching Google Drive...' : (t('noFilesYet') || 'No backup files found yet in Google Drive. Click "Create Backup in Drive" above!')}
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
                            {file.createdTime ? new Date(file.createdTime).toLocaleString(language === 'en' ? 'en-US' : 'fa-AF') : ''}
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
                            title="Restore database from this backup"
                          >
                            <Download className="w-3 h-3" />
                            <span>{t('restore') || 'Restore'}</span>
                          </button>
                        )}
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                            title="Open in Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                          title="Delete from Google Drive"
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
            {t('close') || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
