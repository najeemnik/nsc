import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { localizeText } from '../../i18n/localize';
import { Truck, X, CheckCircle, Calculator, ShieldCheck } from 'lucide-react';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentProject, projects, formatCurrency, t, language, addAsset } = useApp();
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });
  const [projectId, setProjectId] = useState<string>(currentProject?.id || (projects[0]?.id || ''));
  const [assetName, setAssetName] = useState('');
  const [assetCode, setAssetCode] = useState(`AST-${Date.now().toString().slice(-4)}`);
  const [category, setCategory] = useState<'machinery' | 'vehicle' | 'equipment' | 'building' | 'it'>('machinery');
  const [purchasePrice, setPurchasePrice] = useState('250000');
  const [salvageValue, setSalvageValue] = useState('25000');
  const [usefulLifeYears, setUsefulLifeYears] = useState('5');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [serialNumber, setSerialNumber] = useState('');
  const assignedTo = '';
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (currentProject) setProjectId(currentProject.id);
    setAssetCode(`AST-${Date.now().toString().slice(-4)}`);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
  }, [isOpen, currentProject]);

  // Auto-calculated monthly depreciation: (Purchase Price - Salvage) / (Useful Life Years * 12)
  const monthlyDepreciation = useMemo(() => {
    const cost = parseFloat(purchasePrice) || 0;
    const salvage = parseFloat(salvageValue) || 0;
    const years = parseFloat(usefulLifeYears) || 1;
    if (years <= 0) return 0;
    const depreciable = Math.max(0, cost - salvage);
    return depreciable / (years * 12);
  }, [purchasePrice, salvageValue, usefulLifeYears]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!assetName.trim()) {
      setFormError(tx('Please enter asset name.', 'لطفاً نام دارایی یا تجهیز را وارد کنید.', 'مهرباني وکړئ د شتمنۍ نوم ولیکئ.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const cost = parseFloat(purchasePrice) || 0;
      const salvage = parseFloat(salvageValue) || 0;
      const life = parseFloat(usefulLifeYears) || 5;
      const mDeprec = life > 0 ? (cost - salvage) / (life * 12) : 0;

      addAsset({
        assetTag: assetCode.trim(),
        name: assetName.trim(),
        category,
        assignedProjectId: projectId || undefined,
        purchaseDate,
        purchaseCost: cost,
        salvageValue: salvage,
        usefulLifeYears: life,
        monthlyDepreciation: Math.round(mDeprec),
        accumulatedDepreciation: 0,
        currentBookValue: cost,
        runningHours: 0,
        hourlyOperatingRate: 20,
        serialNumber: serialNumber.trim() || undefined,
        assignedPerson: assignedTo.trim() || undefined,
        status: 'active',
        notes: notes.trim() || undefined,
      });

      setSuccessNotice(true);
      setTimeout(() => {
        setSuccessNotice(false);
        setIsSubmitting(false);
        onClose();
      }, 1000);
    } catch {
      setFormError(tx('Could not save the asset.', 'ثبت دارایی انجام نشد.', 'شتمني ثبت نه شوه.'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-surface border border-line rounded-3xl shadow-2xl overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-line bg-gradient-to-r from-amber-600/10 via-orange-600/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-ink">
                {tx('Register Fixed Asset & Equipment', 'ثبت دارایی و تجهیزات کارگاه (Fixed Assets)', 'د ثابتو شتمنیو او تجهیزاتو ثبت')}
              </h2>
              <p className="text-xs text-ink-muted">
                {tx('Straight-line monthly depreciation and site assignment', 'محاسبه استهلاک ماهانه به روش خط مستقیم و انتساب به پروژه', 'د مستقیم استهلاک میاشتنی حساب او پروژې ته تړل')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-ink rounded-xl hover:bg-surface-2 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold">
              {formError}
            </div>
          )}

          {successNotice && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{tx('Asset registered successfully with auto depreciation schedule!', 'دارایی جدید با جدول استهلاک خودکار با موفقیت ثبت شد!', 'شتمني او د استهلاک مهالوېش په بریالیتوب ثبت شول!')}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Asset Name */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tx('Asset / Equipment Name *', 'نام دستگاه یا دارایی *', 'د شتمنۍ یا تجهیز نوم *')}
              </label>
              <input
                type="text"
                required
                placeholder={tx('e.g. 500 L concrete mixer, 50 kW generator', 'مثلاً میکسر بتن ۵۰۰ لیتری، جنراتور ۵۰ کیلووات', 'لکه: ۵۰۰ لیټره کانکریټ مکسر، ۵۰ کیلوواټه جنراتور')}
                value={assetName}
                onChange={e => setAssetName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-ink font-semibold"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tx('Category', 'دسته‌بندی دارایی', 'ډول')}
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-ink font-semibold"
              >
                <option value="machinery">{tx('Heavy Machinery', 'ماشین‌آلات سنگین کارگاهی', 'درانه ماشینونه')}</option>
                <option value="vehicle">{tx('Vehicles', 'موتر و وسایل نقلیه', 'موټرونه')}</option>
                <option value="equipment">{tx('Technical Equipment', 'ابزارآلات و تجهیزات فنی', 'تخنیکي تجهیزات')}</option>
                <option value="it">{tx('Office & IT', 'تجهیزات دفتری و IT', 'د دفتر او معلوماتي ټکنالوژۍ وسایل')}</option>
                <option value="building">{tx('Site Cabins & Structs', 'کانکس و ساختمان ساحوی', 'د ساحې کانتینرونه او جوړښتونه')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Purchase Price */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tx('Purchase Cost (AFN)', 'بهای تمام‌شده خرید (AFN)', 'د پېرلو بیه (AFN)')}
              </label>
              <input
                type="number"
                step="any"
                required
                value={purchasePrice}
                onChange={e => setPurchasePrice(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-mono font-bold"
              />
            </div>

            {/* Useful Life */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tx('Useful Life (Years)', 'عمر مفید (سال)', 'د کارونې موده (کلونه)')}
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={usefulLifeYears}
                onChange={e => setUsefulLifeYears(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-mono"
              />
            </div>

            {/* Salvage Value */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tx('Salvage Value', 'ارزش اسقاطی پایانی', 'پاتې ارزښت')}
              </label>
              <input
                type="number"
                step="any"
                value={salvageValue}
                onChange={e => setSalvageValue(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-mono"
              />
            </div>
          </div>

          {/* Auto Depreciation Preview Box */}
          <div className="p-3.5 rounded-2xl bg-surface-2 border border-line flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Calculator className="w-5 h-5 text-amber-500" />
              <div>
                <span className="font-bold text-ink block">
                  {tx('Estimated Monthly Depreciation:', 'استهلاک ماهانه تخمینی (روش مستقیم):', 'اټکلی میاشتنی استهلاک:')}
                </span>
                <span className="text-[11px] text-ink-muted">
                  {tx(
                    `(purchase price − salvage value) ÷ ${parseFloat(usefulLifeYears) * 12 || 12} months`,
                    `(بهای خرید − ارزش اسقاط) تقسیم بر ${parseFloat(usefulLifeYears) * 12 || 12} ماه`,
                    `(د پېرلو بیه − پاتې ارزښت) ÷ ${parseFloat(usefulLifeYears) * 12 || 12} میاشتې`,
                  )}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-black font-mono text-amber-600">
                {formatCurrency(monthlyDepreciation)}
              </span>
              <span className="block text-[10px] text-ink-muted">{tx('/ month', '/ ماه', '/ میاشت')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Project Assigned */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tx('Assigned Project', 'پروژه مستقر', 'ټاکل شوې پروژه')}
              </label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-semibold"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Serial / Plate */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tx('Serial / Plate No', 'شماره سریال / پلاک', 'د سریال یا نمبر پلیټ شمېره')}
              </label>
              <input
                type="text"
                placeholder="SN-98231..."
                value={serialNumber}
                onChange={e => setSerialNumber(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-mono"
              />
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tx('Purchase Date', 'تاریخ خرید / بهره‌برداری', 'د پېرلو نېټه')}
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-mono"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-surface-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition"
            >
              {t('cancel') || t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black shadow-lg shadow-amber-500/25 transition active:scale-95 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? tx('Saving...', 'در حال ثبت...', 'ثبتېږي...') : tx('Save asset', 'ثبت دارایی در دفتر اموال', 'شتمني ثبت کړئ')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
