import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CircleDot, 
  Plus, 
  Search, 
  Trash2, 
  Printer, 
  Calendar, 
  Truck, 
  Activity 
} from 'lucide-react';

interface ConcreteViewProps {
  onOpenAddConcrete: () => void;
}

export const ConcreteView: React.FC<ConcreteViewProps> = ({ onOpenAddConcrete }) => {
  const { 
    currentProject, 
    concreteRecords, 
    deleteConcreteRecord, 
    formatCurrency, 
    formatNumber, 
    t, 
    language 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');

  const projectConcrete = useMemo(() => {
    return concreteRecords.filter(c => c.projectId === currentProject?.id);
  }, [concreteRecords, currentProject]);

  const filteredConcrete = useMemo(() => {
    return projectConcrete.filter(c => {
      return (
        (c.structurePart || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [projectConcrete, searchTerm]);

  const totalVolumeM3 = filteredConcrete.reduce((sum, c) => sum + (c.volumeM3 || 0), 0);
  const totalCostUSD = filteredConcrete.reduce((sum, c) => sum + (c.totalCostUSD || 0), 0);

  const handleDelete = (id: string) => {
    if (confirm(t('confirmDeleteConcrete') || 'Are you sure you want to delete this concrete record?')) {
      deleteConcreteRecord(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <CircleDot className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <span>{t('concretePours') || 'Concrete & Casting Records'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {currentProject?.name} • {t('totalConcrete')}: <strong>{formatNumber(totalVolumeM3, 1)} m³</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4" />
            <span>{t('print') || 'Print'}</span>
          </button>

          <button
            onClick={onOpenAddConcrete}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-teal-500/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addConcrete') || 'Record Concrete Pour'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">{t('totalVolumeM3') || 'Total Volume (m³)'}</span>
          <p className="text-xl font-black text-teal-600 dark:text-teal-400 mt-1">{formatNumber(totalVolumeM3, 1)} m³</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">{t('poursCount') || 'Number of Pours'}</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{filteredConcrete.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">{t('totalConcreteCost') || 'Total Cost (USD)'}</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(totalCostUSD, 'USD')}</p>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchConcrete') || 'Search structure part, supplier...'}
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
                <th className="py-3.5 px-4">{t('date') || 'Date'}</th>
                <th className="py-3.5 px-4">{t('structurePart') || 'Building Section / Floor'}</th>
                <th className="py-3.5 px-4">{t('supplier') || 'Ready-Mix Supplier'}</th>
                <th className="py-3.5 px-4">{t('volumeM3') || 'Volume (m³)'}</th>
                <th className="py-3.5 px-4">{t('pricePerM3') || 'Rate / m³'}</th>
                <th className="py-3.5 px-4">{t('pumpFee') || 'Pump Fee'}</th>
                <th className="py-3.5 px-4 text-right">{t('totalCostUSD') || 'Total (USD)'}</th>
                <th className="py-3.5 px-4 text-center">{t('actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredConcrete.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{c.date}</td>
                  <td className="py-3.5 px-4 font-bold text-teal-600 dark:text-teal-400">{c.structurePart || 'Slab / Columns'}</td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{c.supplierName || '—'}</td>
                  <td className="py-3.5 px-4 font-mono font-bold">{formatNumber(c.volumeM3, 1)} m³</td>
                  <td className="py-3.5 px-4 font-mono">{c.pricePerM3 ? formatCurrency(c.pricePerM3, c.currency || 'USD') : '—'}</td>
                  <td className="py-3.5 px-4 font-mono">{c.pumpCost ? formatCurrency(c.pumpCost, c.currency || 'USD') : '—'}</td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                    {formatCurrency(c.totalCostUSD, 'USD')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                      title={t('delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredConcrete.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    {t('noConcreteRecords') || 'No concrete records for this project'}
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
