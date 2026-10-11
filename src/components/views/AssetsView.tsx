import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { localizeText } from '../../i18n/localize';
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
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });

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
      case 'machinery': return tx('Heavy machinery', 'ماشین‌آلات سنگین', 'درانه ماشینونه');
      case 'vehicle': return tx('Vehicles and transport', 'وسایط نقلیه و ترانسپورت', 'وسایط او لېږد رالېږد');
      case 'equipment': return tx('Equipment and formwork', 'تجهیزات و قالب‌ها', 'تجهیزات او قالبونه');
      case 'building': return tx('Site facilities', 'تأسیسات کارگاهی', 'د ساحې تاسیسات');
      case 'it': return tx('IT and monitoring equipment', 'تجهیزات IT و نظارتی', 'د معلوماتي ټکنالوژۍ او څارنې تجهیزات');
      default: return cat;
    }
  };

  const handleDelete = (id: string, name: string) => {
    const confirmation = tx('Are you sure you want to remove asset "{name}" from the fixed-assets register?', 'آیا از حذف دارایی "{name}" از دفاتر اموال ثابت اطمینان دارید؟', 'ایا ډاډه یاست چې "{name}" شتمني د ثابتو شتمنیو له ثبت څخه لرې کړئ؟').replace('{name}', name);
    if (confirm(confirmation)) {
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
          {tx('Fixed assets, construction machinery and accumulated depreciation register', 'دفتر اموال ثابت، ماشین‌آلات ساختمانی و استهلاک انباشته', 'د ثابتو شتمنیو، ساختماني ماشینونو او راټول شوي استهلاک ثبت')}
        </h1>
        <p className="text-xs font-bold text-slate-700 mt-1">
          {tx('Project:', 'پروژه:', 'پروژه:')} {currentProject?.name} ({currentProject?.code}) • {tx('Print date:', 'تاریخ چاپ:', 'د چاپ نېټه:')} {new Date().toISOString().split('T')[0]}
        </p>
      </div>

      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-ink flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <span>{tx('Fixed assets and machinery', 'اموال ثابت و ماشین‌آلات', 'ثابتې شتمنۍ او ماشینونه')}</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            {tx('Manage cranes, pumps, generators, metal formwork, straight-line depreciation and project equipment hours.', 'مدیریت کرین، پمپ، ژنراتور، قالب‌های فلزی، استهلاک خطی و تخصیص ساعت‌کارکرد به پروژه', 'کرېنونه، پمپونه، جنراتورونه، فلزي قالبونه، مستقیم استهلاک او پروژې ته د تجهیزاتو کاري ساعتونه اداره کړئ.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4" />
            <span>{tx('Print asset register (annual audit)', 'چاپ کاردکس اموال (ممیزی سالانه)', 'د شتمنیو ثبت چاپول (کلنۍ پلټنه)')}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddAsset}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-amber-500/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{tx('Add asset / machinery', 'ثبت دارایی / ماشین‌آلات جدید', 'شتمني / ماشین ورزیاتول')}</span>
          </button>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-xs">
          <span className="text-slate-400 font-bold block mb-1 text-[11px]">{tx('Original cost:', 'بهای اولیه تمام‌شده:', 'لومړنی لګښت:')}</span>
          <span className="text-lg font-black font-mono text-ink">
            ${formatNumber(totalOriginalCost, 0)}
          </span>
          <span className="block text-[10px] text-slate-400 mt-0.5">{tx('Historical equipment purchase cost', 'قیمت خرید تاریخی تجهیزات', 'د تجهیزاتو د پېرلو تاریخي بیه')}</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
          <span className="text-rose-700 dark:text-rose-400 font-bold block mb-1 text-[11px]">{tx('Accumulated depreciation:', 'استهلاک انباشته:', 'راټول شوی استهلاک:')}</span>
          <span className="text-lg font-black font-mono text-rose-700 dark:text-rose-300">
            -${formatNumber(totalDepreciation, 0)}
          </span>
          <span className="block text-[10px] text-rose-600/80 mt-0.5">{tx('Depreciation calculated using the straight-line method', 'استهلاک خط مستقیم مستهلک‌شده', 'د مستقیمې کرښې د طریقې له مخې محاسبه شوی استهلاک')}</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-emerald-700 dark:text-emerald-400 font-bold block mb-1 text-[11px]">{tx('Net book value:', 'ارزش دفتری خالص:', 'خالص دفتري ارزښت:')}</span>
          <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300">
            ${formatNumber(totalBookValue, 0)}
          </span>
          <span className="block text-[10px] text-emerald-600/80 mt-0.5">{tx('Asset value on the current balance sheet', 'ارزش دارایی در ترازنامه فعلی', 'په اوسني بیلانس پاڼه کې د شتمنۍ ارزښت')}</span>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-line shadow-xs">
          <span className="text-slate-400 font-bold block mb-1 text-[11px]">{tx('Total site operating hours:', 'ساعت‌کارکرد کل در ساحه:', 'په ساحه کې ټول کاري ساعتونه:')}</span>
          <span className="text-lg font-black font-mono text-amber-600">
            {formatNumber(totalHours, 0)}{t("time")}</span>
          <span className="block text-[10px] text-slate-400 mt-0.5">{filteredAssets.length} {tx('assets and equipment', 'قلم دستگاه و تجهیز', 'شتمنۍ او تجهیزات')}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-line flex flex-col sm:flex-row gap-3 items-center justify-between print:hidden">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={tx('Search asset tag, model, serial number or assigned operator...', 'جستجوی پلاک، مدل دستگاه، سریال نامبر، راننده...', 'د شتمنۍ نښه، ماډل، سریال شمېره یا مسئول ولټوئ...')}
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
            <option value="all">{tx('All categories', 'همه دسته‌ها', 'ټولې کټګورۍ')}</option>
            <option value="machinery">{tx('Heavy machinery', 'ماشین‌آلات سنگین', 'درانه ماشینونه')}</option>
            <option value="vehicle">{tx('Vehicles', 'وسایط نقلیه', 'وسایط')}</option>
            <option value="equipment">{tx('Equipment and formwork', 'تجهیزات و قالب‌ها', 'تجهیزات او قالبونه')}</option>
            <option value="it">{tx('IT and office equipment', 'تجهیزات IT و اداری', 'د معلوماتي ټکنالوژۍ او دفتر تجهیزات')}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-surface-2/80 border border-line rounded-xl text-xs focus:outline-none"
          >
            <option value="all">{tx('All statuses', 'همه وضعیت‌ها', 'ټول حالتونه')}</option>
            <option value="active">{tx('Active on site', 'فعال در ساحه', 'په ساحه کې فعال')}</option>
            <option value="maintenance">{tx('Under maintenance', 'تحت سرویس و تعمیر', 'ترمیم لاندې')}</option>
            <option value="idle">{tx('Idle / in storage', 'آماده‌به‌کار در انبار', 'زېرمه / بې‌کاره')}</option>
          </select>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-surface rounded-3xl border border-line shadow-sm overflow-hidden p-5 sm:p-6 print:border-none print:p-0">
        <div className="overflow-x-auto scroll-touch">
          <table className="w-full text-xs text-right border-collapse">
            <thead className="bg-surface-2/60 text-slate-500 font-bold border-b border-line print:bg-slate-100">
              <tr>
                <th className="py-3 px-3">{tx('Asset tag', 'کد دارایی', 'د شتمنۍ نښه')}</th>
                <th className="py-3 px-3">{tx('Machinery name and model', 'نام و مدل ماشین‌آلات', 'د ماشین نوم او ماډل')}</th>
                <th className="py-3 px-3">{t("category")}</th>
                <th className="py-3 px-3 text-left">{tx('Purchase cost ($)', 'بهای خرید ($)', 'د پېرلو بیه ($)')}</th>
                <th className="py-3 px-3 text-center">{tx('Useful life', 'عمر مفید', 'ګټور عمر')}</th>
                <th className="py-3 px-3 text-left">{tx('Monthly depreciation', 'استهلاک ماهانه', 'میاشتنی استهلاک')}</th>
                <th className="py-3 px-3 text-left text-emerald-600">{tx('Net book value', 'ارزش دفتری خالص', 'خالص دفتري ارزښت')}</th>
                <th className="py-3 px-3 text-center">{tx('Operating hours', 'ساعت‌کارکرد', 'کاري ساعتونه')}</th>
                <th className="py-3 px-3">{tx('Operator / custodian', 'اپراتور / مسئول', 'چلوونکی / مسئول')}</th>
                <th className="py-3 px-3 text-center">{tx('Technical status', 'وضعیت فنی', 'تخنیکي حالت')}</th>
                <th className="py-3 px-3 text-center print:hidden">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    {tx('No assets or machinery are recorded. Use “Add asset / machinery” to create one.', 'هیچ دارایی یا ماشین‌آلاتی ثبت نشده است. از دکمه «ثبت دارایی / ماشین‌آلات جدید» استفاده کنید.', 'هېڅ شتمني یا ماشین نه دی ثبت شوی. د «شتمني / ماشین ورزیاتول» تڼۍ وکاروئ.')}
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
                          {tx('SN:', 'سریال:', 'سریال:')} {asset.serialNumber}
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
                      {asset.usefulLifeYears} {tx('years', 'سال', 'کاله')}
                    </td>
                    <td className="py-3 px-3 text-left font-mono text-rose-600 font-bold">
                      -${formatNumber(asset.monthlyDepreciation, 0)}/{tx('month', 'ماه', 'میاشت')}
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
                        title={tx('Click to change status', 'برای تغییر وضعیت کلیک کنید', 'د حالت بدلولو لپاره کلیک وکړئ')}
                      >
                        {asset.status === 'active' ? tx('Available on site', 'آماده در ساحه', 'په ساحه کې چمتو') : asset.status === 'maintenance' ? tx('Under maintenance', 'تحت سرویس', 'ترمیم لاندې') : tx('Inactive / stored', 'غیرفعال / انبار', 'غیرفعال / زېرمه شوی')}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center print:hidden">
                      <button
                        type="button"
                        onClick={() => handleDelete(asset.id, asset.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                        title={tx('Remove from register', 'حذف از دفاتر', 'له ثبت څخه لرې کول')}
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
