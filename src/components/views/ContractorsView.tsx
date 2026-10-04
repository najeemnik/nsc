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
  Calendar 
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
    t 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');

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
    const debtUSD = Math.max(0, totalWorkUSD - totalPaidUSD);

    return { totalWorkUSD, totalPaidUSD, debtUSD, billsCount: contractorExpenses.length };
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
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <HardHat className="w-6 h-6 text-orange-500" />
            <span>{t('contractors') || 'Contractors & Subcontractors'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchContractor') || 'Search contractor name, specialty, phone...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
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
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 rounded-2xl">
                      <HardHat className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{c.name}</h3>
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
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a href={`tel:${c.phone}`} className="hover:underline font-mono">{c.phone}</a>
                  </div>
                )}

                {/* Financial Summary */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2 text-xs mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{t('totalWork') || 'Total Work / Bills'}:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(stats.totalWorkUSD, 'USD')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{t('totalPaid') || 'Paid'}:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.totalPaidUSD, 'USD')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700/60 font-bold">
                    <span className="text-amber-600 dark:text-amber-400">{t('remainingBalance') || 'Remaining Balance'}:</span>
                    <span className="text-amber-600 dark:text-amber-400">{formatCurrency(stats.debtUSD, 'USD')}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {onOpenAddPayment && (
                <button
                  onClick={() => onOpenAddPayment(c.id, c.name)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 text-slate-700 hover:text-emerald-700 dark:text-slate-200 dark:hover:text-emerald-300 rounded-xl text-xs font-semibold transition"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{t('payContractor') || 'Record Payment'}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
