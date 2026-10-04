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
  Layers 
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
    t 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');

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

    return { totalSuppliedUSD, totalPaidUSD, debtUSD };
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
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>{t('materialSuppliers') || 'Material Suppliers & Vendors'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchSuppliers') || 'Search supplier name, materials, phone...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{s.name}</h3>
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
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a href={`tel:${s.phone}`} className="hover:underline font-mono">{s.phone}</a>
                  </div>
                )}

                {s.address && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{s.address}</span>
                  </div>
                )}

                {/* Financial Balances */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2 text-xs mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{t('totalMaterialsSupplied') || 'Materials Supplied'}:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(stats.totalSuppliedUSD, 'USD')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{t('totalPaid') || 'Paid'}:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.totalPaidUSD, 'USD')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700/60 font-bold">
                    <span className="text-rose-600 dark:text-rose-400">{t('payableBalance') || 'Payable Balance'}:</span>
                    <span className="text-rose-600 dark:text-rose-400">{formatCurrency(stats.debtUSD, 'USD')}</span>
                  </div>
                </div>
              </div>

              {onOpenAddPayment && (
                <button
                  onClick={() => onOpenAddPayment(s.id, s.name)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 text-slate-700 hover:text-emerald-700 dark:text-slate-200 dark:hover:text-emerald-300 rounded-xl text-xs font-semibold transition"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{t('paySupplier') || 'Pay Vendor'}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
