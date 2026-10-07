import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Truck, 
  Plus, 
  Search, 
  Trash2, 
  Printer, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingDown
} from 'lucide-react';
import { FixedAsset } from '../../types';

interface AssetsViewProps {
  onOpenAddAsset: () => void;
}

export const AssetsView: React.FC<AssetsViewProps> = ({ onOpenAddAsset }) => {
  const { 
    currentProject, 
    assets, 
    updateAsset, 
    deleteAsset, 
    formatNumber, 
    t, 
    language 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchesSearch = 
        (a.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.assetTag || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.assignedPerson || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = categoryFilter === 'all' || a.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [assets, searchTerm, categoryFilter, statusFilter]);

  const totalOriginalCost = filteredAssets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
  const totalDepreciation = filteredAssets.reduce((sum, a) => sum + (a.accumulatedDepreciation || 0), 0);
  const totalBookValue = filteredAssets.reduce((sum, a) => sum + (a.currentBookValue || 0), 0);
  const totalHours = filteredAssets.reduce((sum, a) => sum + (a.runningHours || 0), 0);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'machinery': return 'ماشین‌آلات سنگین';
      case 'vehicle': return 'وسایط نقلیه و ترانسپورت';
      case 'equipment': return 'تجهیزات و قالب‌ها';
      case 'building': return 'تأسیسات کارگاهی';
      case 'it': return 'تجهیزات IT و نظارتی';
      default: return cat;
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`آیا از حذف دارایی "${name}" از دفاتر اموال ثابت اطمینان دارید؟`)) {
      deleteAsset(id);
    }
  };

  const handleToggleStatus = (asset: FixedAsset) => {
    const nextStatus = asset.status === 'active' ? 'maintenance' : asset.status === 'maintenance' ? 'idle' : 'active';
    updateAsset(asset.id, { status: nextStatus });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Printable Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h1 className="text-xl font-black text-slate-900">
          دفتر اموال ثابت، ماشین‌آلات ساختمانی و استهلاک انباشته (Fixed Assets & Machinery Register)
        </h1>
        <p className="text-xs font-bold text-slate-700 mt-1">
          پروژه: {currentProject?.name} ({currentProject?.code}) • تاریخ چاپ: {new Date().toISOString().split('T')[0]}
        </p>
      </div>

      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-ink flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <span>اموال ثابت و ماشین‌آلات (Fixed Assets & Machinery)</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            مدیریت کرین، پمپ، ژنراتور، قالب‌های فلزی، استهلاک خطی و تخصیص ساعت‌کارکرد به پروژه
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ کاردکس اموال (ممیزی سالانه)</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddAsset}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-amber-500/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت دارایی / ماشین‌آلات جدید</span>
          </button>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-xs">
          <span className="text-slate-400 font-bold block mb-1 text-[11px]">بهای اولیه تمام‌شده:</span>
          <span className="text-lg font-black font-mono text-ink">
            ${formatNumber(totalOriginalCost, 0)}
          </span>
          <span className="block text-[10px] text-slate-400 mt-0.5">قیمت خرید تاریخی تجهیزات</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
          <span className="text-rose-700 dark:text-rose-400 font-bold block mb-1 text-[11px]">استهلاک انباشته (Depreciation):</span>
          <span className="text-lg font-black font-mono text-rose-700 dark:text-rose-300">
            -${formatNumber(totalDepreciation, 0)}
          </span>
          <span className="block text-[10px] text-rose-600/80 mt-0.5">استهلاک خط مستقیم مستهلک‌شده</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-emerald-700 dark:text-emerald-400 font-bold block mb-1 text-[11px]">ارزش دفتری خالص (Book Value):</span>
          <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300">
            ${formatNumber(totalBookValue, 0)}
          </span>
          <span className="block text-[10px] text-emerald-600/80 mt-0.5">ارزش دارایی در ترازنامه فعلی</span>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-line shadow-xs">
          <span className="text-slate-400 font-bold block mb-1 text-[11px]">ساعت‌کارکرد کل در ساحه:</span>
          <span className="text-lg font-black font-mono text-amber-600">
            {formatNumber(totalHours, 0)} ساعت
          </span>
          <span className="block text-[10px] text-slate-400 mt-0.5">{filteredAssets.length} قلم دستگاه و تجهیز</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-line flex flex-col sm:flex-row gap-3 items-center justify-between print:hidden">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجوی پلاک، مدل دستگاه، سریال نامبر، راننده..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-2/80 border border-line rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-surface-2/80 border border-line rounded-xl text-xs focus:outline-none"
          >
            <option value="all">همه دسته‌ها</option>
            <option value="machinery">ماشین‌آلات سنگین</option>
            <option value="vehicle">وسایط نقلیه</option>
            <option value="equipment">تجهیزات و قالب‌ها</option>
            <option value="it">تجهیزات IT و اداری</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-surface-2/80 border border-line rounded-xl text-xs focus:outline-none"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="active">فعال در ساحه</option>
            <option value="maintenance">تحت سرویس و تعمیر</option>
            <option value="idle">آماده‌به‌کار در انبار</option>
          </select>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-surface rounded-3xl border border-line shadow-sm overflow-hidden p-5 sm:p-6 print:border-none print:p-0">
        <div className="overflow-x-auto scroll-touch">
          <table className="w-full text-xs text-right border-collapse">
            <thead className="bg-surface-2/60 text-slate-500 font-bold border-b border-line print:bg-slate-100">
              <tr>
                <th className="py-3 px-3">کد دارایی</th>
                <th className="py-3 px-3">نام و مدل ماشین‌آلات</th>
                <th className="py-3 px-3">دسته‌بندی</th>
                <th className="py-3 px-3 text-left">بهای خرید ($)</th>
                <th className="py-3 px-3 text-center">عمر مفید</th>
                <th className="py-3 px-3 text-left">استهلاک ماهانه</th>
                <th className="py-3 px-3 text-left text-emerald-600">ارزش دفتری خالص</th>
                <th className="py-3 px-3 text-center">ساعت‌کارکرد</th>
                <th className="py-3 px-3">اپراتور / مسئول</th>
                <th className="py-3 px-3 text-center">وضعیت فنی</th>
                <th className="py-3 px-3 text-center print:hidden">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    هیچ دارایی یا ماشین‌آلاتی ثبت نشده است. از دکمه «ثبت دارایی / ماشین‌آلات جدید» استفاده کنید.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-surface-2/30 transition">
                    <td className="py-3 px-3 font-mono font-bold text-amber-600">
                      {asset.assetTag}
                    </td>
                    <td className="py-3 px-3 font-bold text-ink">
                      <div>{asset.name}</div>
                      {asset.serialNumber && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          SN: {asset.serialNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      <span className="px-2 py-0.5 rounded-lg bg-surface-2 font-semibold">
                        {getCategoryLabel(asset.category)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-left font-mono font-bold">
                      ${formatNumber(asset.purchaseCost, 0)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {asset.usefulLifeYears} سال
                    </td>
                    <td className="py-3 px-3 text-left font-mono text-rose-600 font-bold">
                      -${formatNumber(asset.monthlyDepreciation, 0)}/ماه
                    </td>
                    <td className="py-3 px-3 text-left font-mono font-black text-emerald-600">
                      ${formatNumber(asset.currentBookValue, 0)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 font-bold">
                        {asset.runningHours || 0} h
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {asset.assignedPerson || '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(asset)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition ${
                          asset.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : asset.status === 'maintenance'
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20'
                            : 'bg-slate-500/10 text-slate-600 border border-slate-500/20 hover:bg-slate-500/20'
                        }`}
                        title="برای تغییر وضعیت کلیک کنید"
                      >
                        {asset.status === 'active' ? 'آماده در ساحه' : asset.status === 'maintenance' ? 'تحت سرویس' : 'غیرفعال / انبار'}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center print:hidden">
                      <button
                        type="button"
                        onClick={() => handleDelete(asset.id, asset.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                        title="حذف از دفاتر"
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
