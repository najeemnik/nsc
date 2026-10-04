import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HardHat, X, AlertCircle } from 'lucide-react';

interface AddContractorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddContractorModal: React.FC<AddContractorModalProps> = ({ isOpen, onClose }) => {
  const { currentProject, addContractor, contractors, t } = useApp();
  const [name, setName] = useState('');
  const [contractType, setContractType] = useState('قالب‌بندی و سیخ‌بندی');
  const [phone, setPhone] = useState('');
  const [contractAmount, setContractAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('پرداخت دوره‌ای طبق پیشرفت کار و تایید انجنیر ناظر');
  const [retentionPercentage, setRetentionPercentage] = useState('5');
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

  if (!isOpen || !currentProject) return null;

  const parsedAmount = parseFloat(contractAmount) || 0;
  const retention = parseFloat(retentionPercentage) || 0;
  const contractAmountUSD = currency === 'USD' 
    ? parsedAmount 
    : (exchangeRate > 0 ? parseFloat((parsedAmount / exchangeRate).toFixed(2)) : parsedAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('نام قراردادی الزامی است.');
      return;
    }

    const isDuplicate = contractors.some(
      c => c.projectId === currentProject.id && 
           c.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (isDuplicate) {
      setFormError(`قراردادی با نام "${name.trim()}" قبلاً در این پروژه ثبت شده است.`);
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('مبلغ قرارداد باید بزرگتر از صفر باشد.');
      return;
    }

    if (retention < 0 || retention > 100) {
      setFormError('درصد ضمانت حسن نیت نامعتبر است.');
      return;
    }

    if (!startDate || isNaN(new Date(startDate).getTime())) {
      setFormError('تاریخ شروع نامعتبر است.');
      return;
    }

    setIsSubmitting(true);
    addContractor({
      projectId: currentProject.id,
      name: name.trim(),
      contractType: contractType.trim(),
      phone: phone.trim() || '+93 78 000 0000',
      contractAmount: contractAmountUSD,
      totalPaid: 0,
      remainingBalance: contractAmountUSD,
      startDate,
      endDate: endDate || undefined,
      paymentTerms,
      retentionPercentage: retention,
      status: 'active',
      notes: notes.trim() || undefined,
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/75 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 my-0 sm:my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <HardHat className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm">{t.addContractor}</h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
            title="بستن (Esc)"
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
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.contractorName} *</label>
              <input
                type="text"
                required
                placeholder="مثلاً: استاد قادر قالب‌بند"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.contractType} *</label>
              <input
                type="text"
                required
                placeholder="مثلاً: قالب‌بندی / نل‌دوانی / خشت‌کاری"
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20"
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
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 font-mono"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">{t.contractAmount} *</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1 p-0.5 bg-slate-200/80 dark:bg-slate-700 rounded-md">
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={`px-2 py-0.5 rounded text-[10px] font-black ${currency === 'USD' ? 'bg-amber-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                      دالر ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('AFN')}
                      className={`px-2 py-0.5 rounded text-[10px] font-black ${currency === 'AFN' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                      افغانی
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRateInput(!showRateInput)}
                    className="px-1.5 py-0.5 text-[10px] font-bold border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    ۱$={exchangeRate}
                  </button>
                </div>
              </div>

              {showRateInput && (
                <div className="mb-2 p-2 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded-lg flex items-center gap-2 text-xs">
                  <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">نرخ:</span>
                  <input
                    type="number"
                    step="any"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 70)}
                    className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-amber-400 rounded text-center text-slate-900 dark:text-white"
                  />
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">افغانی</span>
                  <button
                    type="button"
                    onClick={() => setShowRateInput(false)}
                    className="px-2 py-0.5 bg-amber-600 text-white rounded text-[10px] font-bold"
                  >
                    تایید
                  </button>
                </div>
              )}

              <input
                type="number"
                step="any"
                min="0"
                required
                placeholder="مثلاً: 75000"
                value={contractAmount}
                onChange={(e) => setContractAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 font-bold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.startDate} *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.retentionPercentage} (%)</label>
              <input
                type="number"
                step="any"
                min="0"
                max="100"
                value={retentionPercentage}
                onChange={(e) => setRetentionPercentage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.paymentTerms}</label>
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.notes}</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2 rtl:space-x-reverse border-t border-slate-100 dark:border-slate-800">
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
              <HardHat className="w-4 h-4 text-amber-400 dark:text-white" />
              <span>{isSubmitting ? t.loading : t.save}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
