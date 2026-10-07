import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Layers, X, Calendar, Clock, Check, Banknote, AlertCircle } from 'lucide-react';
import { CurrencyAmountInput } from '../CurrencyAmountInput';

interface AddSteelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddSteelModal: React.FC<AddSteelModalProps> = ({ isOpen, onClose }) => {
  const { currentProject, addSteelRecord, steelRecords, t } = useApp();
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [billNumber, setBillNumber] = useState(`STL-${Date.now().toString().slice(-4)}`);
  const [supplierName, setSupplierName] = useState('');
  const [tons, setTons] = useState('10');
  const [sizeMm, setSizeMm] = useState('16mm');
  const [originCountry, setOriginCountry] = useState('');

  // Pricing with Currency
  const [pricePerTonInput, setPricePerTonInput] = useState('780');
  const [settlementMode, setSettlementMode] = useState<'cash' | 'credit' | 'installment'>('credit');
  const [paidAmountInput, setPaidAmountInput] = useState('0');
  const [currency, setCurrency] = useState<'USD' | 'AFN'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(currentProject?.defaultExchangeRate || 70);

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [scaleWeightKg, setScaleWeightKg] = useState('');
  const [unloadingLocation, setUnloadingLocation] = useState('');
  const [notes, setNotes] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormError(null);
  }, [isOpen]);

  const parsedTons = parseFloat(tons) || 0;
  const rawPrice = parseFloat(pricePerTonInput) || 0;
  const pricePerTonUSD = currency === 'USD' ? rawPrice : (exchangeRate > 0 ? parseFloat((rawPrice / exchangeRate).toFixed(2)) : rawPrice);
  const totalAmountUSD = Math.round(parsedTons * pricePerTonUSD);
  const totalAmountInCurrentCurrency = currency === 'USD' ? totalAmountUSD : Math.round(totalAmountUSD * exchangeRate);

  useEffect(() => {
    if (settlementMode === 'cash') {
      setPaidAmountInput(totalAmountInCurrentCurrency.toString());
    } else if (settlementMode === 'credit') {
      setPaidAmountInput('0');
    }
  }, [settlementMode, totalAmountInCurrentCurrency]);

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

  if (!isOpen || !currentProject) return null;

  const rawPaid = parseFloat(paidAmountInput) || 0;
  const paidUSD = currency === 'USD' ? rawPaid : (exchangeRate > 0 ? parseFloat((rawPaid / exchangeRate).toFixed(2)) : rawPaid);
  const remainingDebtUSD = Math.max(0, totalAmountUSD - paidUSD);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isNaN(parsedTons) || parsedTons <= 0) {
      setFormError('مقدار وزن (تن) باید بزرگتر از صفر باشد.');
      return;
    }
    if (isNaN(rawPrice) || rawPrice <= 0) {
      setFormError('قیمت فی تن باید بزرگتر از صفر باشد.');
      return;
    }
    if (!supplierName.trim()) {
      setFormError('نام فروشنده یا شرکت سیخ‌گول الزامی است.');
      return;
    }
    if (rawPaid < 0) {
      setFormError('مبلغ پرداختی نامعتبر است.');
      return;
    }
    if (rawPaid > totalAmountInCurrentCurrency) {
      setFormError('مبلغ پرداختی نمی‌تواند بیشتر از کل فاکتور باشد.');
      return;
    }
    if (!date || isNaN(new Date(date).getTime())) {
      setFormError('تاریخ نامعتبر است.');
      return;
    }

    if (billNumber.trim()) {
      const isDuplicate = steelRecords.some(
        s => s.projectId === currentProject.id && 
             s.billNumber && 
             s.billNumber.trim().toLowerCase() === billNumber.trim().toLowerCase()
      );
      if (isDuplicate) {
        setFormError(`بل با شماره "${billNumber.trim()}" قبلاً در این پروژه ثبت شده است.`);
        return;
      }
    }

    setIsSubmitting(true);
    addSteelRecord({
      projectId: currentProject.id,
      date,
      time,
      billNumber: billNumber.trim() || `STL-${Date.now().toString().slice(-4)}`,
      supplierName: supplierName.trim(),
      kg: parsedTons * 1000,
      sizeMm,
      originCountry: originCountry.trim() || undefined,
      pricePerTon: pricePerTonUSD,
      paidAmount: paidUSD,
      vehicleNumber: vehicleNumber.trim() || undefined,
      scaleWeightKg: parseFloat(scaleWeightKg) || undefined,
      unloadingLocation: unloadingLocation.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/75 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-surface rounded-t-3xl sm:rounded-3xl safe-bottom-only shadow-2xl w-full max-w-full sm:max-w-xl max-h-[92dvh] flex flex-col overflow-hidden border border-line my-0 sm:my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">{t.addSteel}</h3>
              <p className="text-[10px] text-slate-400">{currentProject.name}</p>
            </div>
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

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-3.5 text-xs max-h-[80dvh] overflow-y-auto">
          
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-bold">{formError}</span>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t.billNumber}</label>
              <input
                type="text"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.date}</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t.supplier} <span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              placeholder="مثلاً: کابل استیل / افغان پولاد"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20 font-bold"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t.tons} <span className="text-rose-500">*</span></label>
              <input
                type="number"
                step="any"
                required
                value={tons}
                onChange={(e) => setTons(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t.sizeMm || 'سایز'}</label>
              <input
                type="text"
                placeholder="16mm / 20mm"
                value={sizeMm}
                onChange={(e) => setSizeMm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t.originCountry || 'کشور سازنده'}</label>
              <input
                type="text"
                placeholder="ازبکستان / روسیه"
                value={originCountry}
                onChange={(e) => setOriginCountry(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink"
              />
            </div>
          </div>

          <CurrencyAmountInput
            amount={pricePerTonInput}
            onChangeAmount={setPricePerTonInput}
            currency={currency}
            onChangeCurrency={setCurrency}
            exchangeRate={exchangeRate}
            onChangeExchangeRate={setExchangeRate}
            label={t.pricePerTon}
            required={true}
            placeholder="780"
          />

          <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-line rounded-2xl flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-300">{t.totalAmount}:</span>
            <div className="text-end font-mono">
              <span className="text-sm font-extrabold text-ink block">
                ${totalAmountUSD.toLocaleString()}
              </span>
              <span className="text-[11px] text-ink-muted">
                معادل: {(totalAmountUSD * exchangeRate).toLocaleString()} افغانی
              </span>
            </div>
          </div>

          <div className="space-y-1.5 p-3 rounded-2xl border border-amber-200/80 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-800/40">
            <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs">
              {t.settlementType}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setSettlementMode('cash')}
                className={`py-2 px-2 rounded-xl font-bold text-xs transition-all ${
                  settlementMode === 'cash'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-surface border border-line text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.settlementCash}
              </button>
              <button
                type="button"
                onClick={() => setSettlementMode('credit')}
                className={`py-2 px-2 rounded-xl font-bold text-xs transition-all ${
                  settlementMode === 'credit'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-surface border border-line text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.settlementCredit}
              </button>
              <button
                type="button"
                onClick={() => setSettlementMode('installment')}
                className={`py-2 px-2 rounded-xl font-bold text-xs transition-all ${
                  settlementMode === 'installment'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-surface border border-line text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.settlementInstallment}
              </button>
            </div>

            {settlementMode !== 'credit' && (
              <div className="pt-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.cashPaidNow} ({currency === 'USD' ? '$' : 'افغانی'})
                </label>
                <input
                  type="number"
                  step="any"
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-mono text-emerald-800 dark:text-emerald-400 font-bold"
                />
              </div>
            )}

            <div className="pt-1 flex items-center justify-between text-xs font-medium">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.unpaidDebtBalance}:</span>
              </span>
              <span className={`font-mono font-bold ${remainingDebtUSD > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                ${remainingDebtUSD.toLocaleString()} {remainingDebtUSD > 0 && `(${(remainingDebtUSD * exchangeRate).toLocaleString()} افغانی)`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t.vehicleNumber || 'پلیت موتر'}</label>
              <input
                type="text"
                placeholder="مثلاً: کابل ۴-۸۲۹۱"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t.notes}</label>
              <input
                type="text"
                placeholder="..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink"
              />
            </div>
          </div>

          {/* Action buttons */}
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
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? t.loading : t.addSteel}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
