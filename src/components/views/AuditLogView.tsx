import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  History, 
  Search, 
  Trash2, 
  Clock, 
  User, 
  ShieldAlert, 
  CheckCircle2, 
  Printer 
} from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { auditLogs, clearAuditLogs, t, language } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogs.filter(log => {
    return (
      (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entityType || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <History className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <span>{t('systemAuditLogs') || 'System Audit Trail & History'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('auditLogsDesc') || 'Immutable record of all accounting transactions, data edits, deletions and cloud backups'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4" />
            <span>{t('print') || 'Print Log'}</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Clear audit history?')) clearAuditLogs();
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl text-xs font-semibold transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('clearHistory') || 'Clear History'}</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchLogs') || 'Search action, user, or entity...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">{t('timestamp') || 'Timestamp'}</th>
                <th className="py-3.5 px-4">{t('user') || 'Operator'}</th>
                <th className="py-3.5 px-4">{t('action') || 'Action'}</th>
                <th className="py-3.5 px-4">{t('entity') || 'Module'}</th>
                <th className="py-3.5 px-4">{t('details') || 'Activity Details'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString(language === 'en' ? 'en-US' : 'fa-AF') : '—'}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 font-sans">
                    {log.userName}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      log.action.includes('delete') 
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40' 
                        : log.action.includes('create') || log.action.includes('add')
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'
                        : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-sans">{log.entityType}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-sans max-w-md truncate">
                    {log.details}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs font-sans">
                    {t('noLogsFound') || 'No audit log entries found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
