import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  FileText, 
  DollarSign, 
  Calendar, 
  Eye, 
  Printer, 
  Image, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Wallet,
  Coins,
  AlertTriangle,
  Coffee,
  Building2
} from 'lucide-react';
import { Expense } from '../../types';

interface ExpensesViewProps {
  onOpenAddExpense: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ onOpenAddExpense }) => {
  const { 
    currentProject, 
    expenses, 
    deleteExpense, 
    formatCurrency, 
    formatNumber, 
    t, 
    language,
    contractors,
    suppliers
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'all' | 'petty_cash'>('all');

  // Filter expenses for current project
  const projectExpenses = useMemo(() => {
    return expenses.filter(e => e.projectId === currentProject?.id);
  }, [expenses, currentProject]);

  // Petty cash specific expenses
  const pettyCashExpenses = useMemo(() => {
    return projectExpenses.filter(e => 
      e.category === 'چای، نان و مهمان‌داری ساحه' || 
      e.category === 'تنخواه‌گردان' || 
      e.category === 'مصارف خرد ساحه' ||
      e.category === 'Office' ||
      e.category === 'Other' ||
      (e.notes && e.notes.toLowerCase().includes('pcv')) ||
      (e.invoiceNumber && e.invoiceNumber.toLowerCase().includes('pcv'))
    );
  }, [projectExpenses]);

  // Imprest Fund Calculations (سقف تنخواه ۱۰۰ هزار افغانی کارگاه)
  const imprestCapAFN = 100000;
  const pettyCashSpentAFN = pettyCashExpenses.reduce((sum, e) => sum + (e.totalAmountAFN || ((e.totalAmountUSD || 0) * 70)), 0);
  const pettyCashBalanceAFN = Math.max(0, imprestCapAFN - (pettyCashSpentAFN % imprestCapAFN));
  const isReplenishNeeded = pettyCashBalanceAFN < (imprestCapAFN * 0.25);

  const filteredExpenses = useMemo(() => {
    return projectExpenses.filter(e => {
      const matchesSearch = 
        (e.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [projectExpenses, searchTerm, categoryFilter]);

  const totalExpenseUSD = filteredExpenses.reduce((sum, e) => sum + (e.totalAmountUSD || 0), 0);
  const totalExpenseAFN = filteredExpenses.reduce((sum, e) => sum + (e.totalAmountAFN || 0), 0);

  const categories = Array.from(new Set(projectExpenses.map(e => e.category).filter(Boolean)));

  const handleDelete = (id: string, title: string) => {
    if (confirm(t('confirmDeleteExpense') || `Are you sure you want to delete "${title}"?`)) {
      deleteExpense(id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            <span>{t('constructionExpenses') || 'Expenses & Bills'}</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            {currentProject?.name} • {t('totalExpenses')}: <strong>{formatCurrency(totalExpenseUSD, 'USD')}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4" />
            <span>{t('print') || 'Print'}</span>
          </button>

          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-rose-500/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addExpense') || 'New Expense / Bill'}</span>
          </button>
        </div>
      </div>

      {/* View Mode Toggle: All Invoices vs Site Petty Cash */}
      <div className="flex items-center gap-2 p-1.5 bg-surface-2 rounded-2xl w-fit text-xs font-bold border border-line">
        <button
          type="button"
          onClick={() => setActiveViewMode('all')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
            activeViewMode === 'all' 
              ? 'bg-surface text-ink shadow-xs' 
              : 'text-slate-500 hover:text-ink'
          }`}
        >
          <Receipt className="w-4 h-4 text-rose-500" />
          <span>همه فاکتورها و مصارف کارگاه ({projectExpenses.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveViewMode('petty_cash')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
            activeViewMode === 'petty_cash' 
              ? 'bg-surface text-ink shadow-xs' 
              : 'text-slate-500 hover:text-ink'
          }`}
        >
          <Wallet className="w-4 h-4 text-emerald-500" />
          <span>صندوق تنخواه‌گردان کارگاه ({pettyCashExpenses.length})</span>
        </button>
      </div>

      {activeViewMode === 'petty_cash' ? (
        /* PETTY CASH IMPREST VIEW */
        <div className="space-y-6">
          {/* Warning banner if cash in box is low */}
          {isReplenishNeeded && (
            <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-800 dark:text-amber-300">
                    هشدار ضرورت شارژ مجدد تنخواه کارگاه (Replenish Imprest)
                  </h4>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-400 mt-0.5">
                    موجودی نقد صندوق ساحه به زیر ۲۵٪ سقف مجاز رسیده است. لطفاً صورت ریز ذیل را چاپ نموده و جهت دریافت وجه جدید به امور مالی دفتر مرکزی ارسال کنید.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shrink-0 shadow-xs"
              >
                چاپ صورت تسویه
              </button>
            </div>
          )}

          {/* 4 Imprest KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-surface border border-line shadow-xs">
              <span className="text-slate-400 font-bold block mb-1">سقف تنخواه مصوب کارگاه:</span>
              <span className="text-lg font-black font-mono text-ink">
                {formatNumber(imprestCapAFN, 0)} AFN
              </span>
              <span className="block text-[10px] text-slate-400 mt-0.5">تخصیص یافته دفتر مرکزی</span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-rose-700 dark:text-rose-400 font-bold block mb-1">مصارف پرداخت‌شده (PCVs):</span>
              <span className="text-lg font-black font-mono text-rose-700 dark:text-rose-300">
                {formatNumber(pettyCashSpentAFN, 0)} AFN
              </span>
              <span className="block text-[10px] text-rose-600/80 mt-0.5">{pettyCashExpenses.length} واچر تنخواه</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold block mb-1">موجودی نقد فعلی گاوصندوق:</span>
              <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300">
                {formatNumber(pettyCashBalanceAFN, 0)} AFN
              </span>
              <span className="block text-[10px] text-emerald-600/80 mt-0.5">نقدینگی در دسترس ساحه</span>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-line shadow-xs">
              <span className="text-slate-400 font-bold block mb-1">درصد نقدینگی باقیمانده:</span>
              <span className={`text-lg font-black font-mono ${pettyCashBalanceAFN > 25000 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {Math.round((pettyCashBalanceAFN / imprestCapAFN) * 100)}%
              </span>
              <span className="block text-[10px] text-slate-400 mt-0.5">شاخص استمرار مصارف خرد</span>
            </div>
          </div>

          {/* Petty Cash Vouchers Table */}
          <div className="bg-surface rounded-3xl border border-line shadow-sm overflow-hidden p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-ink flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-500" />
                  <span>دفتر ثبت واچرهای تنخواه‌گردان کارگاه (Petty Cash Book)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  خریدهای اضطراری، پذیرایی، کرایه و مصارف روزمره معتمد ساحه
                </p>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl transition"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>چاپ صورت تسویه تنخواه</span>
              </button>
            </div>

            <div className="overflow-x-auto scroll-touch">
              <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-surface-2/60 text-slate-500 font-bold border-b border-line">
                  <tr>
                    <th className="py-3 px-3">شماره واچر</th>
                    <th className="py-3 px-3">تاریخ</th>
                    <th className="py-3 px-3">بابت / دسته‌بندی</th>
                    <th className="py-3 px-3">شرح دقیق مصرف خرد</th>
                    <th className="py-3 px-3">گیرنده وجه</th>
                    <th className="py-3 px-3 text-left">مبلغ واچر (AFN)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pettyCashExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        واچر تنخواهی برای این پروژه ثبت نشده است. از منوی «ثبت سریع» دکمه تنخواه را انتخاب کنید.
                      </td>
                    </tr>
                  ) : (
                    pettyCashExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-surface-2/40 transition">
                        <td className="py-3 px-3 font-mono font-bold text-ink">
                          {exp.invoiceNumber || `PCV-${exp.id.slice(-4)}`}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400">{exp.date}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-lg bg-surface-2 text-slate-600 dark:text-slate-300 font-semibold">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-ink max-w-xs truncate">
                          {exp.title || exp.description || 'مصرف خرد ساحه'}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          {exp.recipientName || 'معتمد ساحه'}
                        </td>
                        <td className="py-3 px-3 text-left font-mono font-black text-emerald-600">
                          {formatNumber(exp.totalAmountAFN || ((exp.totalAmountUSD || 0) * 70), 0)} AFN
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ALL EXPENSES VIEW */
        <div className="space-y-6">
      <div className="bg-surface rounded-3xl border border-line shadow-sm overflow-hidden">
        <div className="overflow-x-auto scroll-touch">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-2/60 text-ink-muted font-bold border-b border-line">
              <tr>
                <th className="py-3.5 px-4">{t('date') || 'Date'}</th>
                <th className="py-3.5 px-4">{t('title') || 'Title / Description'}</th>
                <th className="py-3.5 px-4">{t('category') || 'Category'}</th>
                <th className="py-3.5 px-4">{t('vendorContractor') || 'Vendor / Contractor'}</th>
                <th className="py-3.5 px-4">{t('quantity') || 'Quantity / Unit'}</th>
                <th className="py-3.5 px-4 text-right">{t('amount') || 'Amount'}</th>
                <th className="py-3.5 px-4 text-center">{t('receipt') || 'Receipt'}</th>
                <th className="py-3.5 px-4 text-center">{t('actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 text-ink-muted whitespace-nowrap">
                    {exp.date}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    <div>{exp.title}</div>
                    {exp.invoiceNumber && (
                      <span className="text-[10px] text-slate-400 font-mono">#{exp.invoiceNumber}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 bg-surface-2 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    {exp.recipientName || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-ink-muted whitespace-nowrap">
                    {exp.quantity ? `${exp.quantity} ${exp.unit || ''}` : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-rose-600 dark:text-rose-400">
                    <div>{formatCurrency(exp.totalAmountUSD, 'USD')}</div>
                    {exp.currency !== 'USD' && (
                      <div className="text-[10px] text-slate-400 font-normal">
                        {formatNumber(exp.amount, 0)} {exp.currency}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {exp.receiptUrl || exp.attachments?.[0] ? (
                      <button
                        onClick={() => setSelectedReceipt(exp.receiptUrl || exp.attachments?.[0] || '')}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition"
                        title="View Receipt"
                      >
                        <Image className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleDelete(exp.id, exp.title || exp.description || 'Expense')}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                      title={t('delete') || 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    {t('noExpensesFound') || 'No expenses match the current filter'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

      {/* Image Preview Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-2xl w-full bg-surface rounded-3xl p-4 overflow-hidden">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black transition z-10"
            >
              ✕
            </button>
            <img 
              src={selectedReceipt} 
              alt="Receipt Preview" 
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl" 
            />
          </div>
        </div>
      )}
    </div>
  );
};
