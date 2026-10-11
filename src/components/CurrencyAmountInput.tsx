import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowRightLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { intlLocaleFor, localizeText } from '../i18n/localize';

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
  label,
  required = true,
  placeholder = '0',
}) => {
  const { language } = useApp();
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });
  const formatNumber = (value: number) => value.toLocaleString(intlLocaleFor(language));
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
          {label || tx('Amount', 'مبلغ', 'اندازه')} {required && <span className="text-rose-500">*</span>}
        </label>
        
        {/* Currency Switcher Buttons & Dedicated Rate Button */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 p-0.5 bg-slate-200/90 dark:bg-slate-700 rounded-lg">
            <button
              type="button"
              onClick={() => onChangeCurrency('USD')}
              title={tx('US dollar (USD)', 'دالر آمریکایی (USD)', 'امریکایي ډالر (USD)')}
              className={`px-2.5 py-1 text-xs font-black rounded-md transition-all ${
                currency === 'USD'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tx('US dollar ($)', 'دالر ($)', 'ډالر ($)')}
            </button>
            <button
              type="button"
              onClick={() => onChangeCurrency('AFN')}
              title={tx('Afghan afghani (AFN)', 'افغانی (AFN)', 'افغانۍ (AFN)')}
              className={`px-2.5 py-1 text-xs font-black rounded-md transition-all ${
                currency === 'AFN'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tx('Afghan afghani (AFN)', 'افغانی (AFN)', 'افغانۍ (AFN)')}
            </button>
          </div>

          {/* Small button beside USD/AFN to open rate textbox */}
          <button
            type="button"
            onClick={() => setShowRateInput(!showRateInput)}
            title={tx('Change exchange rate', 'تغییر نرخ تبادله', 'د تبادلې نرخ بدل کړئ')}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-lg border transition-all ${
              showRateInput
                ? 'bg-amber-100 text-amber-900 border-amber-400 ring-2 ring-amber-400/30 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-600'
                : 'bg-surface text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-amber-400 hover:text-amber-800 shadow-2xs'
            }`}
          >
            <ArrowRightLeft className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-mono text-xs">{tx(`1 USD = ${formatNumber(rate)} AFN`, `۱ دالر = ${formatNumber(rate)} افغانی`, `۱ ډالر = ${formatNumber(rate)} افغانۍ`)}</span>
            <span className="text-[10px] text-slate-400">✎</span>
          </button>
        </div>
      </div>

      {/* Instant Inline Rate Input Drawer */}
      {showRateInput && (
        <div className="flex items-center gap-2 p-2 bg-amber-50/95 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded-xl text-xs shadow-xs animate-in fade-in duration-200">
          <label className="text-[11px] font-bold text-amber-900 dark:text-amber-200 shrink-0">
            {tx('Current exchange rate (1 USD to AFN):', 'نرخ فعلی تبادله (۱ دالر به افغانی):', 'د تبادلې اوسنی نرخ (۱ ډالر په افغانۍ):')}
          </label>
          <div className="relative flex-1 max-w-[130px]">
            <input
              type="number"
              step="any"
              min="1"
              autoFocus
              value={rate}
              onChange={(e) => handleRateChange(parseFloat(e.target.value) || 0)}
              placeholder={tx('e.g. 70', 'مثلاً ۷۰', 'لکه: ۷۰')}
              className="w-full px-2.5 py-1 text-xs font-mono font-bold bg-surface border border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-500 text-ink text-center"
            />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">{tx('AFN', 'افغانی', 'افغانۍ')}</span>
          <button
            type="button"
            onClick={() => setShowRateInput(false)}
            title={tx('Confirm rate', 'تأیید نرخ', 'نرخ تایید کړئ')}
            className="px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-2xs"
          >
            {tx('Confirm', 'تأیید', 'تایید')}
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
          <span className="text-ink-muted text-[11px] font-medium">{tx('Formatted amount:', 'مبلغ خوانا:', 'بڼه شوې اندازه:')}</span>
          <span className="font-mono font-black text-ink text-xs">
            {currency === 'USD' ? `$${formatNumber(numAmount)}` : `${formatNumber(numAmount)} AFN`}
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
                <>{tx('Equivalent:', 'معادل:', 'معادل:')} <strong className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400">{formatNumber(equivalentInAFN)} AFN</strong></>
              ) : (
                <>{tx('Equivalent:', 'معادل:', 'معادل:')} <strong className="font-mono font-extrabold text-blue-700 dark:text-blue-400">${formatNumber(equivalentInUSD)}</strong></>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowRateInput(!showRateInput)}
            className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400 font-semibold underline decoration-dotted"
          >
            {tx(`At 1 USD = ${formatNumber(rate)} AFN`, `با نرخ ۱ دالر = ${formatNumber(rate)} افغانی`, `د ۱ ډالر = ${formatNumber(rate)} افغانۍ په نرخ`)} {showRateInput ? '▲' : '▼'}
          </button>
        </div>
      )}
    </div>
  );
};
