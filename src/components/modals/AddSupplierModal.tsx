import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { localizeText } from '../../i18n/localize';
import { Truck, X, AlertCircle } from 'lucide-react';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddSupplierModal: React.FC<AddSupplierModalProps> = ({ isOpen, onClose }) => {
  const { currentProject, addSupplier, suppliers, t, language } = useApp();
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });
  const [name, setName] = useState('');
  const [materialsSupplied, setMaterialsSupplied] = useState(() => tx('Rebar and steel products', 'سیخ‌گول و آهن‌آلات', 'سیخ‌ګول او اوسپنیز توکي'));
  const [materialsEdited, setMaterialsEdited] = useState(false);
  const [phone, setPhone] = useState('');
  const [bankOrSarafiDetails, setBankOrSarafiDetails] = useState('');
  const [initialPurchases, setInitialPurchases] = useState('0');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'AFN'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(currentProject?.defaultExchangeRate || 70);
  const [showRateInput, setShowRateInput] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
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

  React.useEffect(() => {
    if (!materialsEdited) setMaterialsSupplied(tx('Rebar and steel products', 'سیخ‌گول و آهن‌آلات', 'سیخ‌ګول او اوسپنیز توکي'));
  }, [language, materialsEdited]);

  if (!isOpen || !currentProject) return null;

  const purchases = parseFloat(initialPurchases) || 0;
  const purchasesUSD = currency === 'USD' 
    ? purchases 
    : (exchangeRate > 0 ? parseFloat((purchases / exchangeRate).toFixed(2)) : purchases);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError(tx('Supplier name is required.', 'نام عرضه‌کننده الزامی است.', 'د عرضه‌کوونکي نوم اړین دی.'));
      return;
    }

    const isDuplicate = suppliers.some(
      s => s.projectId === currentProject.id && 
           s.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (isDuplicate) {
      setFormError(tx(`Supplier ${name.trim()} is already registered.`, `عرضه‌کننده‌ای با نام «${name.trim()}» پیش‌تر ثبت شده است.`, `د ${name.trim()} عرضه‌کوونکی مخکې ثبت شوی دی.`));
      return;
    }

    if (purchases < 0) {
      setFormError(tx('The initial amount cannot be negative.', 'مبلغ اولیه نمی‌تواند منفی باشد.', 'لومړنۍ اندازه منفي کېدای نه شي.'));
      return;
    }

    setIsSubmitting(true);
    addSupplier({
      projectId: currentProject.id,
      name: name.trim(),
      materialsSupplied: materialsSupplied.trim(),
      phone: phone.trim(),
      bankOrSarafiDetails: bankOrSarafiDetails.trim() || undefined,
      totalPurchases: purchasesUSD,
      totalPaid: 0,
      remainingBalance: purchasesUSD,
      notes: notes.trim() || undefined,
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/75 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-surface rounded-t-3xl sm:rounded-3xl safe-bottom-only shadow-2xl max-w-xl w-full max-h-[92dvh] flex flex-col overflow-hidden border border-line my-0 sm:my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Truck className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm">{t.addSupplier}</h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
            title={tx('Close (Esc)', 'بستن (Esc)', 'بندول (Esc)')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-bold">{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.supplierName} *</label>
              <input
                type="text"
                required
                placeholder={tx('e.g. Pamir Steel Company', 'مثلاً: شرکت سیخ‌گول پامیر', 'لکه: د پامیر سیخ‌ګول شرکت')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.materialsSupplied} *</label>
              <input
                type="text"
                required
                placeholder={tx('e.g. cement, sand, gravel, rebar', 'مثلاً: سمنت، ریگ، جغل و سیخ‌گول', 'لکه: سمنټ، شګه، جغل او سیخ‌ګول')}
                value={materialsSupplied}
                onChange={(e) => { setMaterialsSupplied(e.target.value); setMaterialsEdited(true); }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.phone}</label>
              <input
                type="text"
                placeholder="+93 78 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">{tx('Initial order or purchase', 'سفارش یا خرید اولیه', 'لومړنی فرمایش یا پېرود')}</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1 p-0.5 bg-slate-200/80 dark:bg-slate-700 rounded-md">
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={`px-2 py-0.5 rounded text-[10px] font-black ${currency === 'USD' ? 'bg-amber-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                      {tx('US dollars ($)', 'دالر ($)', 'امریکايي ډالر ($)')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('AFN')}
                      className={`px-2 py-0.5 rounded text-[10px] font-black ${currency === 'AFN' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                      {tx('Afghan afghani', 'افغانی', 'افغانۍ')}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRateInput(!showRateInput)}
                    className="px-1.5 py-0.5 text-[10px] font-bold border border-slate-300 dark:border-slate-600 rounded bg-surface text-slate-700 dark:text-slate-200"
                  >
                    ۱$={exchangeRate}
                  </button>
                </div>
              </div>

              {showRateInput && (
                <div className="mb-2 p-2 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded-lg flex items-center gap-2 text-xs">
                  <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">{tx('Exchange rate:', 'نرخ تبادله:', 'د تبادلې نرخ:')}</span>
                  <input
                    type="number"
                    step="any"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 70)}
                    className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold bg-surface border border-amber-400 rounded text-center text-ink"
                  />
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">{tx('AFN', 'افغانی', 'افغانۍ')}</span>
                  <button
                    type="button"
                    onClick={() => setShowRateInput(false)}
                    className="px-2 py-0.5 bg-amber-600 text-white rounded text-[10px] font-bold"
                  >
                    {tx('Apply', 'تأیید', 'تایید')}
                  </button>
                </div>
              )}

              <input
                type="number"
                step="any"
                min="0"
                value={initialPurchases}
                onChange={(e) => setInitialPurchases(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{tx('Bank or exchange account details', 'مشخصات حساب بانکی یا صرافی', 'د بانک یا صرافۍ حساب معلومات')}</label>
            <input
              type="text"
              placeholder={tx('e.g. bank account or Sarai Shahzada exchange', 'مثلاً: شمارهٔ حساب بانک ملی یا صرافی حاجی برات', 'لکه: د بانک حساب شمېره یا د حاجي برات صرافي')}
              value={bankOrSarafiDetails}
              onChange={(e) => setBankOrSarafiDetails(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.notes}</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2 rtl:space-x-reverse border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-colors text-center"
            >
              <span>{t.cancel}</span>
              <span className="hidden sm:inline-block text-[10px] text-slate-400 ms-1">(Esc)</span>
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 text-amber-400 dark:text-white font-black rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Truck className="w-4 h-4 text-amber-400 dark:text-white" />
              <span>{isSubmitting ? t.loading : t.save}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
