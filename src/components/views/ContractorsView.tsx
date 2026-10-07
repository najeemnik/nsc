import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  HardHat, 
  Plus, 
  Search, 
  Phone, 
  Trash2, 
  UserCheck, 
  CreditCard, 
  DollarSign, 
  Calendar,
  FileText,
  Printer,
  X,
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Contractor } from '../../types';

interface ContractorsViewProps {
  onOpenAddContractor: () => void;
  onOpenAddPayment?: (contractorId: string, name: string) => void;
}

export const ContractorsView: React.FC<ContractorsViewProps> = ({ 
  onOpenAddContractor,
  onOpenAddPayment 
}) => {
  const { 
    contractors, 
    expenses, 
    payments, 
    currentProject, 
    deleteContractor, 
    formatCurrency, 
    t,
    language 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);

  const filteredContractors = contractors.filter(c => {
    return (
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.trade || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getContractorStats = (contractorId: string) => {
    const contractorExpenses = expenses.filter(e => e.recipientId === contractorId && e.projectId === currentProject?.id);
    const contractorPayments = payments.filter(p => p.recipientId === contractorId && p.projectId === currentProject?.id);

    const totalWorkUSD = contractorExpenses.reduce((sum, e) => sum + (e.totalAmountUSD || 0), 0);
    const totalPaidUSD = contractorPayments.reduce((sum, p) => sum + (p.amountUSD || 0), 0);
    
    // MBA Construction Accounting Formulas
    const retentionRate = 0.10; // 10% تضمین حسن نیت اجرای کار
    const taxRate = 0.02; // 2% مالیات موضوعی قرارداد
    const retentionAmountUSD = totalWorkUSD * retentionRate;
    const taxWithheldUSD = totalWorkUSD * taxRate;
    const netCertifiedPayableUSD = Math.max(0, totalWorkUSD - retentionAmountUSD - taxWithheldUSD);
    const debtUSD = Math.max(0, netCertifiedPayableUSD - totalPaidUSD);

    return { 
      totalWorkUSD, 
      totalPaidUSD, 
      debtUSD, 
      retentionAmountUSD,
      taxWithheldUSD,
      netCertifiedPayableUSD,
      billsCount: contractorExpenses.length,
      contractorExpenses,
      contractorPayments
    };
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(t('confirmDeleteContractor') || `Are you sure you want to remove contractor "${name}"?`)) {
      deleteContractor(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink flex items-center gap-2.5">
            <HardHat className="w-6 h-6 text-orange-500" />
            <span>{t('contractors') || 'Contractors & Subcontractors'}</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            {t('manageContractorsDesc') || 'Track trade contractors, master masons, plumbers, electricians, agreements, and payments'}
          </p>
        </div>

        <button
          onClick={onOpenAddContractor}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-orange-500/25 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addContractor') || 'New Contractor'}</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 rounded-2xl bg-surface border border-line">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchContractor') || 'Search contractor name, specialty, phone...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-2/80 border border-line rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
      </div>

      {/* Contractors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContractors.map(c => {
          const stats = getContractorStats(c.id);
          return (
            <div 
              key={c.id}
              className="p-6 rounded-3xl bg-surface border border-line shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 rounded-2xl">
                      <HardHat className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-ink">{c.name}</h3>
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">{c.trade}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(c.id, c.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {c.phone && (
                  <div className="flex items-center gap-2 text-xs text-ink-muted mb-4">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a href={`tel:${c.phone}`} className="hover:underline font-mono">{c.phone}</a>
                  </div>
                )}

                {/* Financial Summary */}
                <div className="p-3.5 rounded-2xl bg-surface-2/50 border border-line space-y-2 text-xs mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{t('totalWork') || 'Total Work / Bills'}:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(stats.totalWorkUSD, 'USD')}</span>
                  </div>
                  <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
                    <span>کسر ۱۰٪ حسن نیت (Retention):</span>
                    <span className="font-mono">-{formatCurrency(stats.retentionAmountUSD, 'USD')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{t('totalPaid') || 'Paid'}:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.totalPaidUSD, 'USD')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-line/60 font-bold">
                    <span className="text-amber-600 dark:text-amber-400">{t('remainingBalance') || 'Remaining Balance'}:</span>
                    <span className="text-amber-600 dark:text-amber-400">{formatCurrency(stats.debtUSD, 'USD')}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedContractor(c)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-surface-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
                >
                  <FileText className="w-3.5 h-3.5 text-orange-500" />
                  <span>صورت‌وضعیت</span>
                </button>

                {onOpenAddPayment && (
                  <button
                    type="button"
                    onClick={() => onOpenAddPayment(c.id, c.name)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{t('payContractor') || 'پرداخت'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subcontractor Detailed Statement Modal */}
      {selectedContractor && (() => {
        const stats = getContractorStats(selectedContractor.id);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-4xl bg-surface border border-line rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-line bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-600 flex items-center justify-center font-bold">
                    <HardHat className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-ink flex items-center gap-2">
                      <span>صورت‌وضعیت جامع پیمانکار: {selectedContractor.name}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-600 font-bold">
                        {selectedContractor.trade}
                      </span>
                    </h2>
                    <p className="text-xs text-ink-muted">
                      {currentProject?.name} • محاسبه حسن نیت ۱۰٪ و تراز مالی معین
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    <span className="hidden sm:inline">چاپ رسمی</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedContractor(null)}
                    className="p-2 text-slate-400 hover:text-ink rounded-xl hover:bg-surface-2 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs">
                {/* 4 Financial Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-surface-2/60 border border-line">
                    <span className="text-slate-400 font-semibold block mb-1">کارکرد کل ناخالص:</span>
                    <span className="text-base font-black font-mono text-ink">
                      {formatCurrency(stats.totalWorkUSD, 'USD')}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{stats.billsCount} صورت‌وضعیت</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-amber-700 dark:text-amber-400 font-semibold block mb-1">سپرده حسن نیت (۱۰٪):</span>
                    <span className="text-base font-black font-mono text-amber-700 dark:text-amber-300">
                      {formatCurrency(stats.retentionAmountUSD, 'USD')}
                    </span>
                    <span className="block text-[10px] text-amber-600/80 mt-0.5">نزد شرکت تا تحویل قطعی</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold block mb-1">پرداخت‌های نقدی:</span>
                    <span className="text-base font-black font-mono text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(stats.totalPaidUSD, 'USD')}
                    </span>
                    <span className="block text-[10px] text-emerald-600/80 mt-0.5">تسویه‌شده تا کنون</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-2/60 border border-line">
                    <span className="text-rose-600 font-semibold block mb-1">مانده طلب جاری:</span>
                    <span className="text-base font-black font-mono text-rose-600">
                      {formatCurrency(stats.debtUSD, 'USD')}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">خالص قابل پرداخت</span>
                  </div>
                </div>

                {/* Bills Table */}
                <div className="border border-line rounded-2xl overflow-hidden">
                  <div className="p-3 bg-surface-2 font-black text-xs text-ink flex items-center justify-between">
                    <span>ریز صورت‌وضعیت‌ها و فاکتورهای کارکرد</span>
                    <span className="text-[11px] font-mono text-slate-400">{stats.contractorExpenses.length} سند</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead className="bg-surface-2/40 border-b border-line text-slate-500 font-bold">
                        <tr>
                          <th className="p-2.5">تاریخ</th>
                          <th className="p-2.5">شرح عملیات ساختمانی</th>
                          <th className="p-2.5">شماره بل</th>
                          <th className="p-2.5 text-left">مبلغ ناخالص (USD)</th>
                          <th className="p-2.5 text-left">کسر ۱۰٪ حسن نیت</th>
                          <th className="p-2.5 text-left">خالص سند (USD)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {stats.contractorExpenses.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-slate-400">سندی برای این پیمانکار ثبت نشده است.</td>
                          </tr>
                        ) : (
                          stats.contractorExpenses.map(exp => {
                            const gross = exp.totalAmountUSD || 0;
                            const ret = gross * 0.10;
                            const net = gross - ret;
                            return (
                              <tr key={exp.id} className="hover:bg-surface-2/30">
                                <td className="p-2.5 font-mono text-slate-400">{exp.date}</td>
                                <td className="p-2.5 font-semibold text-ink">{exp.description || exp.category}</td>
                                <td className="p-2.5 font-mono">{exp.invoiceNumber || '-'}</td>
                                <td className="p-2.5 text-left font-mono font-bold">{formatCurrency(gross, 'USD')}</td>
                                <td className="p-2.5 text-left font-mono text-amber-600">-{formatCurrency(ret, 'USD')}</td>
                                <td className="p-2.5 text-left font-mono font-bold text-emerald-600">{formatCurrency(net, 'USD')}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payments Table */}
                <div className="border border-line rounded-2xl overflow-hidden">
                  <div className="p-3 bg-surface-2 font-black text-xs text-ink flex items-center justify-between">
                    <span>پرداخت‌های انجام‌شده به پیمانکار</span>
                    <span className="text-[11px] font-mono text-slate-400">{stats.contractorPayments.length} واچر</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead className="bg-surface-2/40 border-b border-line text-slate-500 font-bold">
                        <tr>
                          <th className="p-2.5">تاریخ</th>
                          <th className="p-2.5">روش پرداخت</th>
                          <th className="p-2.5">شماره سند / واچر</th>
                          <th className="p-2.5 text-left">مبلغ پرداختی (USD)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {stats.contractorPayments.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-400">پرداختی ثبت نشده است.</td>
                          </tr>
                        ) : (
                          stats.contractorPayments.map(pay => (
                            <tr key={pay.id} className="hover:bg-surface-2/30">
                              <td className="p-2.5 font-mono text-slate-400">{pay.date}</td>
                              <td className="p-2.5 font-semibold text-ink">{pay.method || 'نقدی'}</td>
                              <td className="p-2.5 font-mono">{pay.referenceNumber || pay.id.slice(-6)}</td>
                              <td className="p-2.5 text-left font-mono font-bold text-emerald-600">
                                {formatCurrency(pay.amountUSD || 0, 'USD')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-line bg-surface-2 flex items-center justify-between shrink-0">
                <span className="text-slate-400 text-[11px]">
                  وضعیت نهایی: {stats.debtUSD <= 0 ? 'کاملاً تسویه شده' : 'دارای مانده طلب جاری'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedContractor(null)}
                  className="px-5 py-2 rounded-xl bg-surface hover:bg-slate-200 dark:hover:bg-slate-700 text-ink font-bold"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
