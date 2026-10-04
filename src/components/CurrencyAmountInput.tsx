import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowRightLeft } from 'lucide-react';

interface CurrencyAmountInputProps {
  amount: string;
  onChangeAmount: (value: string) => void;
  currency: 'USD' | 'AFN' | string;
  onChangeCurrency: (currency: 'USD' | 'AFN') => void;
  exchangeRate?: number;
  onChangeExchangeRate?: (rate: number) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
}

export const CurrencyAmountInput: React.FC<CurrencyAmountInputProps> = ({
  amount,
  onChangeAmount,
  currency,
  onChangeCurrency,
  exchangeRate = 70,
  onChangeExchangeRate,
  label = 'مبلغ مالی',
  required = true,
  placeholder = '0',
}) => {
  const [rate, setRate] = useState<number>(exchangeRate);
  const [showRateInput, setShowRateInput] = useState<boolean>(false);

  useEffect(() => {
    if (exchangeRate) setRate(exchangeRate);
  }, [exchangeRate]);

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    if (onChangeExchangeRate) {
      onChangeExchangeRate(newRate);
    }
  };

  const numAmount = parseFloat(amount) || 0;
  // Calculate equivalent in the other currency
  const equivalentInAFN = currency === 'USD' ? Math.round(numAmount * rate) : numAmount;
  const equivalentInUSD = currency === 'AFN' ? (rate > 0 ? parseFloat((numAmount / rate).toFixed(2)) : 0) : numAmount;

  return (
    <div className="space-y-2 p-3 bg-surface-2/60 rounded-xl border border-line">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        
        {/* Currency Switcher Buttons & Dedicated Rate Button */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 p-0.5 bg-slate-200/90 dark:bg-slate-700 rounded-lg">
            <button
              type="button"
              onClick={() => onChangeCurrency('USD')}
              title="دالر آمریکایی ($)"
              className={`px-2.5 py-1 text-xs font-black rounded-md transition-all ${
                currency === 'USD'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              دالر ($)
            </button>
            <button
              type="button"
              onClick={() => onChangeCurrency('AFN')}
              title="افغانی"
              className={`px-2.5 py-1 text-xs font-black rounded-md transition-all ${
                currency === 'AFN'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              افغانی (AFN)
            </button>
          </div>

          {/* Small button beside USD/AFN to open rate textbox */}
          <button
            type="button"
            onClick={() => setShowRateInput(!showRateInput)}
            title="تغییر نرخ تبدیل اسعار"
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-lg border transition-all ${
              showRateInput
                ? 'bg-amber-100 text-amber-900 border-amber-400 ring-2 ring-amber-400/30 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-600'
                : 'bg-surface text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-amber-400 hover:text-amber-800 shadow-2xs'
            }`}
          >
            <ArrowRightLeft className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-mono text-xs">۱$={rate} افغانی</span>
            <span className="text-[10px] text-slate-400">✎</span>
          </button>
        </div>
      </div>

      {/* Instant Inline Rate Input Drawer */}
      {showRateInput && (
        <div className="flex items-center gap-2 p-2 bg-amber-50/95 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded-xl text-xs shadow-xs animate-in fade-in duration-200">
          <label className="text-[11px] font-bold text-amber-900 dark:text-amber-200 shrink-0">
            نرخ فعلی صرافی (۱ دالر به افغانی):
          </label>
          <div className="relative flex-1 max-w-[130px]">
            <input
              type="number"
              step="any"
              min="1"
              autoFocus
              value={rate}
              onChange={(e) => handleRateChange(parseFloat(e.target.value) || 0)}
              placeholder="مثلا ۷۰"
              className="w-full px-2.5 py-1 text-xs font-mono font-bold bg-surface border border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-500 text-ink text-center"
            />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">افغانی</span>
          <button
            type="button"
            onClick={() => setShowRateInput(false)}
            title="تایید نرخ"
            className="px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-2xs"
          >
            تایید
          </button>
        </div>
      )}

      {/* Amount Input with Currency Symbol & Formatted Preview */}
      <div className="relative">
        <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400 select-none">
          {currency === 'USD' ? '$' : '؋'}
        </span>
        <input
          type="number"
          step="any"
          min="0"
          required={required}
          value={amount}
          onChange={(e) => onChangeAmount(e.target.value)}
          placeholder={placeholder}
          className="w-full ps-8 pe-3 py-2 text-sm font-mono font-bold border border-slate-300 dark:border-slate-600 rounded-xl bg-surface focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-ink transition-all"
        />
      </div>

      {/* Real-time Thousand Separator Live Formatted Display */}
      {numAmount > 0 && (
        <div className="flex items-center justify-between px-2.5 py-1.5 bg-surface rounded-lg border border-line text-xs">
          <span className="text-ink-muted text-[11px] font-medium">مبلغ خوانا:</span>
          <span className="font-mono font-black text-ink text-xs">
            {currency === 'USD' ? `$${numAmount.toLocaleString()}` : `${numAmount.toLocaleString()} افغانی`}
          </span>
        </div>
      )}

      {/* Real-time Exchange Rate & Equivalent Display */}
      {numAmount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              {currency === 'USD' ? (
                <>معادل: <strong className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400">{equivalentInAFN.toLocaleString()} افغانی</strong></>
              ) : (
                <>معادل: <strong className="font-mono font-extrabold text-blue-700 dark:text-blue-400">${equivalentInUSD.toLocaleString()}</strong></>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowRateInput(!showRateInput)}
            className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400 font-semibold underline decoration-dotted"
          >
            با نرخ ۱$ = {rate} افغانی {showRateInput ? '▲' : '▼'}
          </button>
        </div>
      )}
    </div>
  );
};
