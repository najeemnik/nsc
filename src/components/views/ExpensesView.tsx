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
  AlertCircle 
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

  // Filter expenses for current project
  const projectExpenses = useMemo(() => {
    return expenses.filter(e => e.projectId === currentProject?.id);
  }, [expenses, currentProject]);

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

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-sm">
          <span className="text-xs text-slate-400 font-medium">{t('totalBillsCount') || 'Total Bills'}</span>
          <p className="text-xl font-black text-ink mt-1">{filteredExpenses.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-sm">
          <span className="text-xs text-slate-400 font-medium">{t('totalAmountUSD') || 'Total (USD)'}</span>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(totalExpenseUSD, 'USD')}</p>
        </div>
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-sm">
          <span className="text-xs text-slate-400 font-medium">{t('totalAmountAFN') || 'Total (AFN)'}</span>
          <p className="text-xl font-black text-ink mt-1">{formatNumber(totalExpenseAFN, 0)} AFN</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-line flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchExpenses') || 'Search by title, invoice #, contractor...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-2/80 border border-line rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-surface-2/80 border border-line rounded-xl text-xs focus:outline-none"
          >
            <option value="all">{t('allCategories') || 'All Categories'}</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-surface rounded-3xl border border-line shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
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
