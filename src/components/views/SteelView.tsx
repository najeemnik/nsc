import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Layers, 
  Plus, 
  Search, 
  Trash2, 
  Printer, 
  Scale, 
  TrendingUp, 
  Calendar, 
  Truck 
} from 'lucide-react';
import { SteelRecord } from '../../types';

interface SteelViewProps {
  onOpenAddSteel: () => void;
}

export const SteelView: React.FC<SteelViewProps> = ({ onOpenAddSteel }) => {
  const { 
    currentProject, 
    steelRecords, 
    deleteSteelRecord, 
    formatCurrency, 
    formatNumber, 
    t, 
    language 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [sizeFilter, setSizeFilter] = useState('all');

  const projectSteel = useMemo(() => {
    return steelRecords.filter(s => s.projectId === currentProject?.id);
  }, [steelRecords, currentProject]);

  const filteredSteel = useMemo(() => {
    return projectSteel.filter(s => {
      const matchesSearch = 
        (s.size || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSize = sizeFilter === 'all' || s.size === sizeFilter;
      return matchesSearch && matchesSize;
    });
  }, [projectSteel, searchTerm, sizeFilter]);

  const totalKG = filteredSteel.reduce((sum, s) => sum + (s.totalKg || 0), 0);
  const totalTons = totalKG / 1000;
  const totalCostUSD = filteredSteel.reduce((sum, s) => sum + (s.totalCostUSD || 0), 0);

  const sizes = Array.from(new Set(projectSteel.map(s => s.size).filter(Boolean)));

  const handleDelete = (id: string) => {
    if (confirm(t('confirmDeleteSteel') || 'Are you sure you want to delete this steel record?')) {
      deleteSteelRecord(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-amber-500" />
            <span>{t('steelRebar') || 'Steel & Rebar Accounting'}</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            {currentProject?.name} • {t('totalSteel')}: <strong>{formatNumber(totalTons, 2)} {t('ton')}</strong>
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
            onClick={onOpenAddSteel}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-amber-500/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addSteel') || 'Record Steel Purchase'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-sm">
          <span className="text-xs text-slate-400 font-medium">{t('totalWeightTon') || 'Total Weight (Tons)'}</span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{formatNumber(totalTons, 2)} {t('ton')}</p>
        </div>
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-sm">
          <span className="text-xs text-slate-400 font-medium">{t('totalWeightKg') || 'Total Weight (KG)'}</span>
          <p className="text-xl font-black text-ink mt-1">{formatNumber(totalKG, 0)} KG</p>
        </div>
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-sm">
          <span className="text-xs text-slate-400 font-medium">{t('totalSteelCost') || 'Total Investment (USD)'}</span>
          <p className="text-xl font-black text-ink mt-1">{formatCurrency(totalCostUSD, 'USD')}</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-surface border border-line flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchSteel') || 'Search steel size, supplier, brand...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-2/80 border border-line rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <select
          value={sizeFilter}
          onChange={(e) => setSizeFilter(e.target.value)}
          className="px-3 py-2 bg-surface-2/80 border border-line rounded-xl text-xs focus:outline-none"
        >
          <option value="all">{t('allSizes') || 'All Mill Sizes'}</option>
          {sizes.map(sz => (
            <option key={sz} value={sz}>{sz}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-3xl border border-line shadow-sm overflow-hidden">
        <div className="overflow-x-auto scroll-touch">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-2/60 text-ink-muted font-bold border-b border-line">
              <tr>
                <th className="py-3.5 px-4">{t('date') || 'Date'}</th>
                <th className="py-3.5 px-4">{t('size') || 'Mill Size'}</th>
                <th className="py-3.5 px-4">{t('brand') || 'Brand / Origin'}</th>
                <th className="py-3.5 px-4">{t('supplier') || 'Supplier'}</th>
                <th className="py-3.5 px-4">{t('bundles') || 'Bundles / Branch'}</th>
                <th className="py-3.5 px-4">{t('weightKg') || 'Weight (KG)'}</th>
                <th className="py-3.5 px-4">{t('weightTon') || 'Weight (Ton)'}</th>
                <th className="py-3.5 px-4 text-right">{t('costUSD') || 'Total Cost (USD)'}</th>
                <th className="py-3.5 px-4 text-center">{t('actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSteel.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 text-ink-muted whitespace-nowrap">{s.date}</td>
                  <td className="py-3.5 px-4 font-bold text-amber-600 dark:text-amber-400">{s.size}</td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{s.brand || '—'}</td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{s.supplierName || '—'}</td>
                  <td className="py-3.5 px-4 text-ink-muted">{s.bundles || s.branches || '—'}</td>
                  <td className="py-3.5 px-4 font-mono">{formatNumber(s.totalKg, 0)}</td>
                  <td className="py-3.5 px-4 font-mono font-bold">{formatNumber((s.totalKg || 0) / 1000, 2)}</td>
                  <td className="py-3.5 px-4 text-right font-black text-ink whitespace-nowrap">
                    {formatCurrency(s.totalCostUSD, 'USD')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                      title={t('delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredSteel.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    {t('noSteelRecords') || 'No steel purchases recorded for this project'}
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
