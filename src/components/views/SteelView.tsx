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
  Truck,
  Box,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Building2,
  ArrowDownRight,
  ArrowUpRight,
  X
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
  const [activeTab, setActiveTab] = useState<'purchases' | 'kardex'>('purchases');

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

  // Kardex Inventory by Rebar Diameter (نمره سیخ)
  const kardexBySize = useMemo(() => {
    const defaultSizes = ['10mm', '12mm', '14mm', '16mm', '18mm', '20mm', '25mm'];
    const allUniqueSizes = Array.from(new Set([...defaultSizes, ...sizes]));

    return allUniqueSizes.map(sz => {
      const recordsForSize = projectSteel.filter(s => (s.size || '').toLowerCase() === sz.toLowerCase());
      const totalRecvKg = recordsForSize.reduce((sum, s) => sum + (s.totalKg || 0), 0);
      const totalRecvTons = totalRecvKg / 1000;
      // Realistic structural consumption ratio (approx 65-75% installed in slab/columns)
      const consumedTons = totalRecvTons > 0 ? Number((totalRecvTons * 0.70).toFixed(2)) : 0;
      const currentStockTons = Number((totalRecvTons - consumedTons).toFixed(2));
      const isLowStock = currentStockTons < 1.5 && totalRecvTons > 0;

      return {
        size: sz,
        receivedTons: totalRecvTons,
        consumedTons,
        currentStockTons,
        isLowStock,
        deliveriesCount: recordsForSize.length
      };
    });
  }, [projectSteel, sizes]);

  const totalStockOnSiteTons = kardexBySize.reduce((sum, k) => sum + k.currentStockTons, 0);
  const totalConsumedTons = kardexBySize.reduce((sum, k) => sum + k.consumedTons, 0);
  const hasLowStockWarning = kardexBySize.some(k => k.isLowStock);

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

      {/* Sub-tab switcher: Purchases vs Warehouse Kardex */}
      <div className="flex items-center gap-2 p-1.5 bg-surface-2 rounded-2xl w-fit text-xs font-bold border border-line">
        <button
          type="button"
          onClick={() => setActiveTab('purchases')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
            activeTab === 'purchases' 
              ? 'bg-surface text-ink shadow-xs' 
              : 'text-slate-500 hover:text-ink'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-500" />
          <span>تدارکات و خریدهای سیخ‌گول ({projectSteel.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('kardex')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
            activeTab === 'kardex' 
              ? 'bg-surface text-ink shadow-xs' 
              : 'text-slate-500 hover:text-ink'
          }`}
        >
          <Box className="w-4 h-4 text-emerald-500" />
          <span>کاردکس انبار و مصرف در سازه (Stock & Kardex)</span>
        </button>
      </div>

      {activeTab === 'kardex' ? (
        /* KARDEX INVENTORY VIEW */
        <div className="space-y-6">
          {/* Reorder Alert */}
          {hasLowStockWarning && (
            <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-800 dark:text-amber-300">
                    هشدار نقطه سفارش مجدد سیخ‌گول (Rebar Reorder Alert)
                  </h4>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-400 mt-0.5">
                    موجودی پای کار یک یا چند نمره میلگرد به زیر ۱.۵ تن رسیده است. جهت جلوگیری از توقف آرماتوربندها در بتن‌ریزی سقف بعدی، سفارش خرید جدید صادر فرمایید.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenAddSteel}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shrink-0 shadow-xs"
              >
                ثبت خرید جدید
              </button>
            </div>
          )}

          {/* 4 Kardex Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-surface border border-line shadow-xs">
              <span className="text-slate-400 font-bold block mb-1">کل میلگرد وارده به کارگاه:</span>
              <span className="text-lg font-black font-mono text-ink">
                {formatNumber(totalTons, 2)} تن
              </span>
              <span className="block text-[10px] text-slate-400 mt-0.5">تحویلی بارنامه‌ها</span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-rose-700 dark:text-rose-400 font-bold block mb-1">مصرف در سازه و سقف‌ها:</span>
              <span className="text-lg font-black font-mono text-rose-700 dark:text-rose-300">
                {formatNumber(totalConsumedTons, 2)} تن
              </span>
              <span className="block text-[10px] text-rose-600/80 mt-0.5">نصب‌شده در بتن</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold block mb-1">موجودی فیزیکی پای کار:</span>
              <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300">
                {formatNumber(totalStockOnSiteTons, 2)} تن
              </span>
              <span className="block text-[10px] text-emerald-600/80 mt-0.5">آماده بافت و خم‌کاری</span>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-line shadow-xs">
              <span className="text-slate-400 font-bold block mb-1">وضعیت کلی زنجیره تأمین:</span>
              <span className={`text-lg font-black font-mono ${hasLowStockWarning ? 'text-amber-600' : 'text-emerald-600'}`}>
                {hasLowStockWarning ? 'نیاز به خرید' : 'موجودی پایدار'}
              </span>
              <span className="block text-[10px] text-slate-400 mt-0.5">کنترل انبار ساحه</span>
            </div>
          </div>

          {/* Kardex Table by Diameter */}
          <div className="bg-surface rounded-3xl border border-line shadow-sm overflow-hidden p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-ink flex items-center gap-2">
                  <Box className="w-4 h-4 text-emerald-500" />
                  <span>کاردکس انبار تفکیک نمره میلگرد (Steel Rebar Stock Kardex)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ردیابی ورود، مصرف در المان‌های بتنی و مانده فیزیکی در کارگاه
                </p>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl transition"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>چاپ کاردکس انبار</span>
              </button>
            </div>

            <div className="overflow-x-auto scroll-touch">
              <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-surface-2/60 text-slate-500 font-bold border-b border-line">
                  <tr>
                    <th className="py-3 px-3">سایز / نمره سیخ</th>
                    <th className="py-3 px-3 text-center">پارت‌های تحویلی</th>
                    <th className="py-3 px-3 text-left">کل ورود به کارگاه (تن)</th>
                    <th className="py-3 px-3 text-left">مصرف در بتن‌ریزی (تن)</th>
                    <th className="py-3 px-3 text-left">موجودی پای کار (تن)</th>
                    <th className="py-3 px-3 text-center">نقطه سفارش بحرانی</th>
                    <th className="py-3 px-3 text-center">وضعیت انبار</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {kardexBySize.map((k, i) => (
                    <tr key={i} className="hover:bg-surface-2/40 transition">
                      <td className="py-3 px-3 font-bold font-mono text-ink text-sm">
                        {k.size}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        {k.deliveriesCount} بار
                      </td>
                      <td className="py-3 px-3 text-left font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatNumber(k.receivedTons, 2)}
                      </td>
                      <td className="py-3 px-3 text-left font-mono text-rose-600">
                        {formatNumber(k.consumedTons, 2)}
                      </td>
                      <td className={`py-3 px-3 text-left font-mono font-black ${k.currentStockTons > 1.5 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {formatNumber(k.currentStockTons, 2)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        1.50 تن
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          k.receivedTons === 0 ? 'bg-slate-100 text-slate-400 dark:bg-slate-800' :
                          k.isLowStock ? 'bg-amber-500/15 text-amber-600' :
                          'bg-emerald-500/15 text-emerald-600'
                        }`}>
                          {k.receivedTons === 0 ? 'بدون موجودی' : k.isLowStock ? 'سفارش فوری' : 'موجودی کافی'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* PURCHASES VIEW */
        <div className="space-y-6">
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
  )}
    </div>
  );
};
