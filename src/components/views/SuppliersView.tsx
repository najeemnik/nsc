import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  Trash2, 
  MapPin, 
  CreditCard, 
  Layers,
  FileText,
  Printer,
  X,
  Building2,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { Supplier } from '../../types';

interface SuppliersViewProps {
  onOpenAddSupplier: () => void;
  onOpenAddPayment?: (supplierId: string, name: string) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({ 
  onOpenAddSupplier,
  onOpenAddPayment 
}) => {
  const { 
    suppliers, 
    expenses, 
    payments, 
    currentProject, 
    deleteSupplier, 
    formatCurrency, 
    t,
    language 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const filteredSuppliers = suppliers.filter(s => {
    return (
      (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getSupplierStats = (supplierId: string) => {
    const supplierExpenses = expenses.filter(e => e.recipientId === supplierId && e.projectId === currentProject?.id);
    const supplierPayments = payments.filter(p => p.recipientId === supplierId && p.projectId === currentProject?.id);

    const totalSuppliedUSD = supplierExpenses.reduce((sum, e) => sum + (e.totalAmountUSD || 0), 0);
    const totalPaidUSD = supplierPayments.reduce((sum, p) => sum + (p.amountUSD || 0), 0);
    const debtUSD = Math.max(0, totalSuppliedUSD - totalPaidUSD);

    // Build unified chronological ledger (Purchases = Debit, Payments = Credit)
    const ledgerItems = [
      ...supplierExpenses.map(e => ({
        id: e.id,
        date: e.date || '',
        type: 'purchase' as const,
        description: e.description || e.category,
        reference: e.invoiceNumber || '-',
        amountUSD: e.totalAmountUSD || 0,
      })),
      ...supplierPayments.map(p => ({
        id: p.id,
        date: p.date || '',
        type: 'payment' as const,
        description: `پرداخت وجه (${p.method || 'نقدی'})`,
        reference: p.referenceNumber || p.id.slice(-6),
        amountUSD: p.amountUSD || 0,
      }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = 0;
    const ledgerWithBalances = ledgerItems.map(item => {
      if (item.type === 'purchase') {
        running += item.amountUSD;
      } else {
        running -= item.amountUSD;
      }
      return { ...item, balance: running };
    });

    return { 
      totalSuppliedUSD, 
      totalPaidUSD, 
      debtUSD, 
      billsCount: supplierExpenses.length,
      paymentsCount: supplierPayments.length,
      ledger: ledgerWithBalances
    };
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(t('confirmDeleteSupplier') || `Are you sure you want to delete supplier "${name}"?`)) {
      deleteSupplier(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>{t('materialSuppliers') || 'Material Suppliers & Vendors'}</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            {t('manageSuppliersDesc') || 'Track vendors for steel, cement, gravel, bricks, concrete, and finishing materials'}
          </p>
        </div>

        <button
          onClick={onOpenAddSupplier}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-500/25 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addSupplier') || 'New Supplier'}</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 rounded-2xl bg-surface border border-line">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchSuppliers') || 'Search supplier name, materials, phone...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-2/80 border border-line rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map(s => {
          const stats = getSupplierStats(s.id);
          return (
            <div 
              key={s.id}
              className="p-6 rounded-3xl bg-surface border border-line shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-ink">{s.name}</h3>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{s.category}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(s.id, s.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {s.phone && (
                  <div className="flex items-center gap-2 text-xs text-ink-muted mb-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a href={`tel:${s.phone}`} className="hover:underline font-mono">{s.phone}</a>
                  </div>
                )}

                {s.address && (
                  <div className="flex items-center gap-2 text-xs text-ink-muted mb-4">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{s.address}</span>
                  </div>
                )}

                {/* Financial Balances */}
                <div className="p-3.5 rounded-2xl bg-surface-2/50 border border-line space-y-2 text-xs mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{t('totalMaterialsSupplied') || 'Materials Supplied'}:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(stats.totalSuppliedUSD, 'USD')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{t('totalPaid') || 'Paid'}:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.totalPaidUSD, 'USD')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-line/60 font-bold">
                    <span className="text-rose-600 dark:text-rose-400">{t('payableBalance') || 'Payable Balance'}:</span>
                    <span className="text-rose-600 dark:text-rose-400">{formatCurrency(stats.debtUSD, 'USD')}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSupplier(s)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-surface-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>دفتر معین</span>
                </button>

                {onOpenAddPayment && (
                  <button
                    type="button"
                    onClick={() => onOpenAddPayment(s.id, s.name)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{t('paySupplier') || 'پرداخت'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Supplier Subledger Modal */}
      {selectedSupplier && (() => {
        const stats = getSupplierStats(selectedSupplier.id);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-4xl bg-surface border border-line rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-line bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-600 flex items-center justify-center font-bold">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-ink flex items-center gap-2">
                      <span>دفتر معین تأمین‌کننده: {selectedSupplier.name}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 font-bold">
                        {selectedSupplier.category}
                      </span>
                    </h2>
                    <p className="text-xs text-ink-muted">
                      {currentProject?.name} • کاردکس خرید و گردش مانده لحظه‌ای (Running Balance)
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
                    <span className="hidden sm:inline">چاپ معین</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSupplier(null)}
                    className="p-2 text-slate-400 hover:text-ink rounded-xl hover:bg-surface-2 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs">
                {/* 3 Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-surface-2/60 border border-line">
                    <span className="text-slate-400 font-semibold block mb-1">مجموع خرید مصالح (بدهکار):</span>
                    <span className="text-lg font-black font-mono text-ink">
                      {formatCurrency(stats.totalSuppliedUSD, 'USD')}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{stats.billsCount} فاکتور خرید</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold block mb-1">مجموع پرداختی‌ها (بستانکار):</span>
                    <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(stats.totalPaidUSD, 'USD')}
                    </span>
                    <span className="block text-[10px] text-emerald-600/80 mt-0.5">{stats.paymentsCount} پرداخت نقدی/بانکی</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-2/60 border border-line">
                    <span className="text-rose-600 font-semibold block mb-1">مانده بدهکاری شرکت (تراز جاری):</span>
                    <span className="text-lg font-black font-mono text-rose-600">
                      {formatCurrency(stats.debtUSD, 'USD')}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">طلب باقیمانده تأمین‌کننده</span>
                  </div>
                </div>

                {/* Unified Ledger Table */}
                <div className="border border-line rounded-2xl overflow-hidden">
                  <div className="p-3 bg-surface-2 font-black text-xs text-ink flex items-center justify-between">
                    <span>گردش حساب و کاردکس زمانی (Chronological Subledger)</span>
                    <span className="text-[11px] font-mono text-slate-400">{stats.ledger.length} ردیف</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead className="bg-surface-2/40 border-b border-line text-slate-500 font-bold">
                        <tr>
                          <th className="p-2.5">تاریخ</th>
                          <th className="p-2.5">شرح کالا / عملیات مالی</th>
                          <th className="p-2.5">شماره سند</th>
                          <th className="p-2.5 text-left">خرید / بدهکار (USD)</th>
                          <th className="p-2.5 text-left">پرداخت / بستانکار (USD)</th>
                          <th className="p-2.5 text-left">مانده حساب (USD)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {stats.ledger.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-slate-400">گردش حسابی برای این تأمین‌کننده یافت نشد.</td>
                          </tr>
                        ) : (
                          stats.ledger.map(row => (
                            <tr key={row.id} className="hover:bg-surface-2/30">
                              <td className="p-2.5 font-mono text-slate-400">{row.date}</td>
                              <td className="p-2.5 font-semibold text-ink flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${row.type === 'purchase' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                                <span>{row.description}</span>
                              </td>
                              <td className="p-2.5 font-mono">{row.reference}</td>
                              <td className="p-2.5 text-left font-mono font-bold text-slate-800 dark:text-slate-200">
                                {row.type === 'purchase' ? formatCurrency(row.amountUSD, 'USD') : '-'}
                              </td>
                              <td className="p-2.5 text-left font-mono font-bold text-emerald-600">
                                {row.type === 'payment' ? formatCurrency(row.amountUSD, 'USD') : '-'}
                              </td>
                              <td className={`p-2.5 text-left font-mono font-black ${row.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {formatCurrency(row.balance, 'USD')}
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
                  وضعیت حساب: {stats.debtUSD <= 0 ? 'کاملاً تسویه شده (تراز صفر)' : 'بدهکار به فروشنده'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSupplier(null)}
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
