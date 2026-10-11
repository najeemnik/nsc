import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { intlLocaleFor, localizeText } from '../../i18n/localize';
import { CreditCard, X, Clock, Calendar, CheckCircle, Users, AlertCircle } from 'lucide-react';
import { PaymentMethod } from '../../types';
import { CurrencyAmountInput } from '../CurrencyAmountInput';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPartyName?: string;
  defaultRelatedId?: string;
  defaultRelatedType?: 'contractor' | 'supplier' | 'expense' | 'steel' | 'concrete' | 'material_steel' | 'material_concrete';
  defaultAmount?: number;
  outstandingDebt?: number;
  title?: string;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ 
  isOpen, 
  onClose,
  defaultPartyName,
  defaultRelatedId,
  defaultRelatedType,
  defaultAmount,
  outstandingDebt,
  title,
}) => {
  const { currentProject, addPayment, payments, debtorParties, t, language, formatNumber } = useApp();
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => new Date().toLocaleTimeString(intlLocaleFor(language), { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [receiptNumber, setReceiptNumber] = useState(`VCH-${Date.now().toString().slice(-5)}`);
  const [selectedDebtorId, setSelectedDebtorId] = useState<string>('');
  const [partyName, setPartyName] = useState(defaultPartyName || '');
  const [relatedType, setRelatedType] = useState<string>(defaultRelatedType || 'contractor');
  const [relatedId, setRelatedId] = useState<string | undefined>(defaultRelatedId);
  const [activeDebt, setActiveDebt] = useState<number | undefined>(outstandingDebt);
  const [amount, setAmount] = useState(defaultAmount ? defaultAmount.toString() : '');
  const [currency, setCurrency] = useState<'USD' | 'AFN'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(currentProject?.defaultExchangeRate || 70);
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [bankOrSarafiName, setBankOrSarafiName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormError(null);
    if (defaultPartyName) setPartyName(defaultPartyName);
    if (defaultRelatedType) setRelatedType(defaultRelatedType);
    if (defaultRelatedId) setRelatedId(defaultRelatedId);
    if (defaultAmount) setAmount(defaultAmount.toString());
    else if (outstandingDebt) setAmount(outstandingDebt.toString());
    if (outstandingDebt !== undefined) setActiveDebt(outstandingDebt);
    setDate(new Date().toISOString().split('T')[0]);
    setTime(new Date().toLocaleTimeString(intlLocaleFor(language), { hour: '2-digit', minute: '2-digit', hour12: false }));
  }, [defaultPartyName, defaultRelatedType, defaultRelatedId, defaultAmount, outstandingDebt, isOpen]);

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

  const handleSelectDebtor = (debtorKey: string) => {
    setSelectedDebtorId(debtorKey);
    setFormError(null);
    if (!debtorKey || debtorKey === 'custom') {
      setActiveDebt(undefined);
      return;
    }
    const debtor = debtorParties.find(d => `${d.relatedType}-${d.relatedId}` === debtorKey);
    if (debtor) {
      setPartyName(debtor.partyName);
      setRelatedType(debtor.relatedType);
      setRelatedId(debtor.relatedId);
      setActiveDebt(debtor.debtAmount);
      
      const convertedAmount = currency === 'USD' ? debtor.debtAmount : Math.round(debtor.debtAmount * exchangeRate);
      setAmount(convertedAmount.toString());
      setDescription(tx(`Payment to ${debtor.partyName}`, `پرداخت به ${debtor.partyName}`, `د ${debtor.partyName} تادیه`));
    }
  };

  if (!isOpen || !currentProject) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError(tx('The payment amount is invalid.', 'مبلغ پرداختی نامعتبر است.', 'د تادیې اندازه ناسمه ده.'));
      return;
    }
    if (!partyName.trim()) {
      setFormError(tx('The payee name is required.', 'نام طرف حساب الزامی است.', 'د ترلاسه کوونکي نوم اړین دی.'));
      return;
    }
    if (!date || isNaN(new Date(date).getTime())) {
      setFormError(tx('The date is invalid.', 'تاریخ نامعتبر است.', 'نېټه ناسمه ده.'));
      return;
    }

    if (receiptNumber.trim()) {
      const isDuplicate = payments.some(
        p => p.projectId === currentProject.id && 
             p.receiptNumber && 
             p.receiptNumber.trim().toLowerCase() === receiptNumber.trim().toLowerCase()
      );
      if (isDuplicate) {
        setFormError(tx(`Receipt ${receiptNumber.trim()} is already registered for this project.`, `رسید شمارهٔ «${receiptNumber.trim()}» پیش‌تر در این پروژه ثبت شده است.`, `د ${receiptNumber.trim()} شمېرې رسید په دې پروژه کې مخکې ثبت شوی دی.`));
        return;
      }
    }

    setIsSubmitting(true);
    const amountInUSD = currency === 'USD' 
      ? parsedAmount 
      : (exchangeRate > 0 ? parseFloat((parsedAmount / exchangeRate).toFixed(2)) : parsedAmount);
    const amountInAFN = currency === 'AFN'
      ? parsedAmount
      : Math.round(parsedAmount * exchangeRate);

    addPayment({
      projectId: currentProject.id,
      date,
      time,
      receiptNumber: receiptNumber.trim() || `VCH-${Date.now().toString().slice(-5)}`,
      partyName: partyName.trim(),
      amount: amountInUSD,
      currency,
      exchangeRate,
      amountInUSD,
      amountInAFN,
      method,
      bankOrSarafiName: bankOrSarafiName.trim() || undefined,
      description: description.trim() || `${t.dashboardAddPayment} - ${partyName}`,
      notes: notes.trim() || undefined,
      relatedId: relatedId,
      relatedType: (relatedType as any) || undefined,
    });
    setIsSubmitting(false);
    onClose();
  };

  const parsedAmount = parseFloat(amount) || 0;
  const amountInUSD = currency === 'USD' 
    ? parsedAmount 
    : (exchangeRate > 0 ? parseFloat((parsedAmount / exchangeRate).toFixed(2)) : parsedAmount);
  const remainingBalanceAfterPayment = activeDebt !== undefined ? Math.max(0, activeDebt - amountInUSD) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/75 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-surface rounded-t-3xl sm:rounded-3xl safe-bottom-only shadow-2xl w-full max-w-full sm:max-w-xl max-h-[92dvh] flex flex-col overflow-hidden border border-line my-0 sm:my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">{title || t.addPayment}</h3>
              <p className="text-[10px] text-slate-400">{currentProject.name}</p>
            </div>
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

        {/* Debtor Selection Menu */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200/80 dark:border-slate-700 space-y-2">
          <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-600" />
            <span>{t.selectDebtorParty}</span>
          </label>
          <select
            value={selectedDebtorId}
            onChange={(e) => handleSelectDebtor(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-semibold text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="">
              {debtorParties.length > 0 ? `-- ${t.selectDebtorParty} (${debtorParties.length}) --` : `-- ${t.noDebtorsFound} --`}
            </option>
            {debtorParties.filter(d => d.relatedType === 'expense').length > 0 && (
              <optgroup label={tx('Credit purchases / invoices', 'خریدها / فاکتورهای قرضی', 'پور اخیستل شوي توکي / بلونه')}>
                {debtorParties.filter(d => d.relatedType === 'expense').map((debtor) => (
                  <option 
                    key={`${debtor.relatedType}-${debtor.relatedId}`} 
                    value={`${debtor.relatedType}-${debtor.relatedId}`}
                  >
                    {debtor.title}
                  </option>
                ))}
              </optgroup>
            )}
            {debtorParties.filter(d => d.relatedType === 'supplier').length > 0 && (
              <optgroup label={tx('Suppliers', 'عرضه‌کنندگان', 'عرضه‌کوونکي')}>
                {debtorParties.filter(d => d.relatedType === 'supplier').map((debtor) => (
                  <option 
                    key={`${debtor.relatedType}-${debtor.relatedId}`} 
                    value={`${debtor.relatedType}-${debtor.relatedId}`}
                  >
                    {debtor.partyName} - {tx('Outstanding:', 'طلب:', 'پاتې پور:')} ${formatNumber(debtor.debtAmount, 0)}
                  </option>
                ))}
              </optgroup>
            )}
            {debtorParties.filter(d => d.relatedType === 'contractor').length > 0 && (
              <optgroup label={tx('Contractors', 'قراردادی‌ها', 'قراردادیان')}>
                {debtorParties.filter(d => d.relatedType === 'contractor').map((debtor) => (
                  <option 
                    key={`${debtor.relatedType}-${debtor.relatedId}`} 
                    value={`${debtor.relatedType}-${debtor.relatedId}`}
                  >
                    {debtor.partyName} - {tx('Outstanding:', 'طلب:', 'پاتې پور:')} ${formatNumber(debtor.debtAmount, 0)}
                  </option>
                ))}
              </optgroup>
            )}
            {debtorParties.filter(d => d.relatedType === 'material_steel' || d.relatedType === 'material_concrete').length > 0 && (
              <optgroup label={tx('Steel and concrete', 'سیخ‌گول و کانکریت', 'سیخ‌ګول او کانکریټ')}>
                {debtorParties.filter(d => d.relatedType === 'material_steel' || d.relatedType === 'material_concrete').map((debtor) => (
                  <option 
                    key={`${debtor.relatedType}-${debtor.relatedId}`} 
                    value={`${debtor.relatedType}-${debtor.relatedId}`}
                  >
                    {debtor.title}
                  </option>
                ))}
              </optgroup>
            )}
            <option value="custom">-- {t.customPartyOption || tx('Other person or company', 'شخص یا شرکت متفرقه', 'بل شخص یا شرکت')} --</option>
          </select>
        </div>

        {activeDebt !== undefined && activeDebt > 0 && (
          <div className="bg-amber-500/10 dark:bg-amber-950/30 border-b border-amber-500/20 px-5 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-amber-900 dark:text-amber-200 font-semibold">
              <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{tx('Total outstanding:', 'کل طلبکاری:', 'ټول پاتې پور:')} <strong className="text-rose-700 dark:text-rose-400 text-sm font-mono">${formatNumber(activeDebt, 0)}</strong></span>
            </div>
            <span className="text-[11px] text-amber-800 dark:text-amber-300 font-bold bg-amber-200/50 dark:bg-amber-900/50 px-2 py-0.5 rounded">
              {tx('Deducted from the outstanding balance', 'کسر مستقیم از باقیماندهٔ طلب', 'له پاتې پور څخه کسرېږي')}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs max-h-[75dvh] overflow-y-auto">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-bold">{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t.receiptNumber || tx('Document / receipt number', 'شمارهٔ سند / رسید', 'د سند / رسید شمېره')}</label>
              <input
                type="text"
                required
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-canvas focus:bg-white text-xs font-mono font-bold text-ink"
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
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-canvas focus:bg-white text-xs font-mono text-ink"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.time || tx('Time', 'ساعت', 'وخت')}</span>
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-canvas focus:bg-white text-xs font-mono text-ink"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t.paidTo || tx('Paid to', 'پرداخت به طرف حساب', 'ورکړه د')} <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                placeholder={tx('Name of the person or company receiving payment', 'نام شخص یا شرکت دریافت‌کننده', 'د پیسو ترلاسه کوونکي کس یا شرکت نوم')}
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t.category}</label>
              <select
                value={relatedType}
                onChange={(e) => setRelatedType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20 font-bold"
              >
                <option value="contractor">{t.navContractors}</option>
                <option value="supplier">{t.navSuppliers}</option>
                <option value="steel">{t.navSteel}</option>
                <option value="concrete">{t.navConcrete}</option>
                <option value="expense">{t.navExpenses}</option>
              </select>
            </div>
          </div>

          <CurrencyAmountInput
            amount={amount}
            onChangeAmount={setAmount}
            currency={currency}
            onChangeCurrency={setCurrency}
            exchangeRate={exchangeRate}
            onChangeExchangeRate={setExchangeRate}
            label={t.amount}
            required={true}
            placeholder="0"
          />

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t.paymentMethod || tx('Payment method', 'روش پرداخت', 'د تادیې لاره')}</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20 font-medium"
              >
                <option value="Cash">{tx('Cash', 'نقدی', 'نغدې')}</option>
                <option value="Bank Transfer">{tx('Bank transfer', 'انتقال بانکی', 'بانکي لېږد')}</option>
                <option value="Hawala / Sarafi">{tx('Hawala / exchange', 'حواله / صرافی', 'حواله / صرافي')}</option>
                <option value="Cheque">{tx('Bank cheque', 'چک بانکی', 'بانکي چک')}</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Bank or exchange name', 'نام بانک یا صرافی', 'د بانک یا صرافۍ نوم')}</label>
              <input
                type="text"
                placeholder={tx('e.g. Sarai Shahzada Exchange / DAB', 'مثلاً: صرافی شهزاده / DAB', 'لکه: د سرای شهزاده صرافي / DAB')}
                value={bankOrSarafiName}
                onChange={(e) => setBankOrSarafiName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t.description}</label>
            <input
              type="text"
              placeholder={tx('e.g. Payment for foundation rebar...', 'مثلاً: بابت تسویهٔ سیخ تهداب...', 'لکه: د تهداب د سیخونو تادیه...')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20"
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
              <CreditCard className="w-4 h-4" />
              <span>{isSubmitting ? t.loading : t.addPayment}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
