import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Trash2, 
  Printer, 
  Calendar, 
  HardHat, 
  Phone,
  Coins,
  CheckCircle2,
  Clock,
  FileText
} from 'lucide-react';
import { LaborRecord } from '../../types';

interface LaborViewProps {
  onOpenAddLabor: () => void;
}

export const LaborView: React.FC<LaborViewProps> = ({ onOpenAddLabor }) => {
  const { 
    currentProject, 
    laborRecords, 
    deleteLaborRecord, 
    formatNumber, 
    t, 
    language 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const projectLabor = useMemo(() => {
    return laborRecords.filter(l => l.projectId === currentProject?.id);
  }, [laborRecords, currentProject]);

  const filteredLabor = useMemo(() => {
    return projectLabor.filter(l => {
      const matchesSearch = 
        (l.workerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'all' || l.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [projectLabor, searchTerm, roleFilter]);

  const totalGrossAFN = filteredLabor.reduce((sum, l) => sum + (l.grossWage || 0), 0);
  const totalAdvancesAFN = filteredLabor.reduce((sum, l) => sum + (l.advanceDeduction || 0), 0);
  const totalNetAFN = filteredLabor.reduce((sum, l) => sum + (l.netPayable || 0), 0);
  const totalManDays = filteredLabor.reduce((sum, l) => sum + (l.daysWorked || 0), 0);

  const roles = Array.from(new Set(projectLabor.map(l => l.role).filter(Boolean)));

  const handleDelete = (id: string, name: string) => {
    if (confirm(`آیا از حذف رکورد کارکرد کارگر "${name}" اطمینان دارید؟`)) {
      deleteLaborRecord(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Printable Sheet Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h1 className="text-xl font-black text-slate-900">
          لیست پرداخت معاشات و تسویه کارکرد کارگران ساحه ساختمانی
        </h1>
        <p className="text-xs font-bold text-slate-700 mt-1">
          پروژه: {currentProject?.name} ({currentProject?.code}) • تاریخ چاپ: {new Date().toISOString().split('T')[0]}
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-ink flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>معاشات و کارکرد کارگران ساحه (Labor & Payroll)</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            {currentProject?.name} • تسویه روزمزدها و کارمزد با کسر خودکار مساعده‌های دریافتی
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ لیست حقوق (امضا و اثر انگشت)</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddLabor}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-purple-500/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت کارکرد و معاش جدید</span>
          </button>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-xs">
          <span className="text-slate-400 font-bold block mb-1 text-[11px]">مجموع دستمزد ناخالص:</span>
          <span className="text-lg font-black font-mono text-ink">
            {formatNumber(totalGrossAFN, 0)} AFN
          </span>
          <span className="block text-[10px] text-slate-400 mt-0.5">کارکرد کل ثبت‌شده</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
          <span className="text-rose-700 dark:text-rose-400 font-bold block mb-1 text-[11px]">کسر مساعده‌ها (Advance):</span>
          <span className="text-lg font-black font-mono text-rose-700 dark:text-rose-300">
            -{formatNumber(totalAdvancesAFN, 0)} AFN
          </span>
          <span className="block text-[10px] text-rose-600/80 mt-0.5">دریافتی‌های وسط ماه</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-emerald-700 dark:text-emerald-400 font-bold block mb-1 text-[11px]">خالص پرداختی کل:</span>
          <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300">
            {formatNumber(totalNetAFN, 0)} AFN
          </span>
          <span className="block text-[10px] text-emerald-600/80 mt-0.5">تسویه نهایی پایان دوره</span>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-line shadow-xs">
          <span className="text-slate-400 font-bold block mb-1 text-[11px]">مجموع نفر-روز کارکرد:</span>
          <span className="text-lg font-black font-mono text-purple-600">
            {totalManDays} نفر-روز
          </span>
          <span className="block text-[10px] text-slate-400 mt-0.5">{filteredLabor.length} استادکار و کارگر</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-line flex flex-col sm:flex-row gap-3 items-center justify-between print:hidden">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجوی نام کارگر، رسته کاری، شماره تماس..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-2/80 border border-line rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 bg-surface-2/80 border border-line rounded-xl text-xs focus:outline-none"
        >
          <option value="all">همه رسته‌های کاری</option>
          {roles.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Payroll Table */}
      <div className="bg-surface rounded-3xl border border-line shadow-sm overflow-hidden p-5 sm:p-6 print:border-none print:p-0">
        <div className="overflow-x-auto scroll-touch">
          <table className="w-full text-xs text-right border-collapse">
            <thead className="bg-surface-2/60 text-slate-500 font-bold border-b border-line print:bg-slate-100">
              <tr>
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">نام کارگر / استادکار</th>
                <th className="py-3 px-3">رسته و مهارت کاری</th>
                <th className="py-3 px-3 text-center">روزکار</th>
                <th className="py-3 px-3 text-left">نرخ روزانه (AFN)</th>
                <th className="py-3 px-3 text-left">مزد ناخالص (AFN)</th>
                <th className="py-3 px-3 text-left text-rose-600">کسر مساعده</th>
                <th className="py-3 px-3 text-left text-emerald-600">خالص پرداختی</th>
                <th className="py-3 px-3 text-center print:hidden">وضعیت</th>
                <th className="py-3 px-3 text-center hidden print:table-cell w-36">اثر انگشت / امضا</th>
                <th className="py-3 px-3 text-center print:hidden">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredLabor.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    رکوردی برای کارگران این پروژه ثبت نشده است. از دکمه «ثبت کارکرد و معاش جدید» استفاده کنید.
                  </td>
                </tr>
              ) : (
                filteredLabor.map((l, index) => (
                  <tr key={l.id} className="hover:bg-surface-2/30 transition">
                    <td className="py-3 px-3 font-mono text-slate-400">{index + 1}</td>
                    <td className="py-3 px-3 font-bold text-ink">
                      <div>{l.workerName}</div>
                      {l.phone && <div className="text-[10px] text-slate-400 font-mono">{l.phone}</div>}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      <span className="px-2 py-0.5 rounded-lg bg-surface-2 font-semibold">
                        {l.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      {l.daysWorked} روز
                    </td>
                    <td className="py-3 px-3 text-left font-mono">
                      {formatNumber(l.dailyRate, 0)}
                    </td>
                    <td className="py-3 px-3 text-left font-mono font-bold text-ink">
                      {formatNumber(l.grossWage, 0)}
                    </td>
                    <td className="py-3 px-3 text-left font-mono font-bold text-rose-600">
                      {l.advanceDeduction > 0 ? `-${formatNumber(l.advanceDeduction, 0)}` : '۰'}
                    </td>
                    <td className="py-3 px-3 text-left font-mono font-black text-emerald-600">
                      {formatNumber(l.netPayable, 0)} AFN
                    </td>
                    <td className="py-3 px-3 text-center print:hidden">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        l.paymentStatus === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {l.paymentStatus === 'paid' ? 'تسویه شد' : 'در انتظار'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center hidden print:table-cell border-b">
                      <div className="h-10 border border-dashed border-slate-300 rounded-lg mx-auto w-24"></div>
                    </td>
                    <td className="py-3 px-3 text-center print:hidden">
                      <button
                        type="button"
                        onClick={() => handleDelete(l.id, l.workerName)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                        title="حذف رکورد"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
