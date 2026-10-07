import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Coins, X, Calendar, CheckCircle, Landmark, Wallet, ArrowDownRight, User } from 'lucide-react';
import { CurrencyAmountInput } from '../CurrencyAmountInput';
import { backendApi } from '../../services/backendApi';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPayerName?: string;
  defaultAmount?: number;
}

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({
  isOpen,
  onClose,
  defaultPayerName,
  defaultAmount
}) => {
  const { currentProject, projects, formatCurrency, t, language } = useApp();
  const [projectId, setProjectId] = useState<string>(currentProject?.id || (projects[0]?.id || ''));
  const [payerName, setPayerName] = useState(defaultPayerName || '');
  const [incomeType, setIncomeType] = useState<string>('client_installment');
  const [amount, setAmount] = useState(defaultAmount ? defaultAmount.toString() : '');
  const [currency, setCurrency] = useState<'USD' | 'AFN'>('AFN');
  const [exchangeRate, setExchangeRate] = useState<number>(currentProject?.defaultExchangeRate || 70);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'cheque' | 'hawala'>('bank_transfer');
  const [targetAccount, setTargetAccount] = useState('حساب د افغانستان بانک');
  const [referenceNo, setReferenceNo] = useState(`RV-${Date.now().toString().slice(-5)}`);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (currentProject) setProjectId(currentProject.id);
    if (defaultPayerName) setPayerName(defaultPayerName);
    if (defaultAmount) setAmount(defaultAmount.toString());
    setReferenceNo(`RV-${Date.now().toString().slice(-5)}`);
    setDate(new Date().toISOString().split('T')[0]);
  }, [isOpen, currentProject, defaultPayerName, defaultAmount]);

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
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError(language === 'fa' ? 'لطفاً مبلغ دریافتی معتبر وارد کنید.' : 'Please enter a valid amount.');
      return;
    }
    if (!payerName.trim()) {
      setFormError(language === 'fa' ? 'نام پرداخت‌کننده / مشتری الزامی است.' : 'Payer name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await backendApi.createIncome({
        projectId,
        receivedFrom: payerName.trim(),
        incomeType,
        amount: numAmount,
        currency,
        exchangeRate,
        paymentMethod,
        targetAccountId: targetAccount,
        referenceDoc: referenceNo,
        date,
        notes: notes.trim() || undefined,
      });

      setSuccessNotice(true);
      setTimeout(() => {
        setSuccessNotice(false);
        setIsSubmitting(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'خطا در ثبت عواید');
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
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-line bg-gradient-to-r from-emerald-600/10 via-teal-600/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-ink">
                {language === 'fa' ? 'ثبت عواید و دریافت وجه (Receipt Voucher)' : 'Record Income / Revenue Receipt'}
              </h2>
              <p className="text-xs text-ink-muted">
                {language === 'fa' ? 'شارژ نقدینگی صندوق/بانک و افزایش درآمد پروژه در P&L' : 'Direct credit to treasury and revenue calculation'}
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
              <span>{language === 'fa' ? 'عواید با موفقیت ثبت شد و به حساب واریز گردید!' : 'Income voucher recorded successfully!'}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Project */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('project') || 'Project'}
              </label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            {/* Income Type */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'fa' ? 'نوع عاید / منبع' : 'Income Category'}
              </label>
              <select
                value={incomeType}
                onChange={e => setIncomeType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="client_installment">{language === 'fa' ? 'قسط پیش‌فروش آپارتمان / مشتری' : 'Apartment Installment'}</option>
                <option value="partner_equity">{language === 'fa' ? 'سرمایه‌گذاری شریک / افزایش سرمایه' : 'Partner Equity'}</option>
                <option value="advance_payment">{language === 'fa' ? 'پیش‌پرداخت قرارداد کارفرما' : 'Client Advance'}</option>
                <option value="scrap_material_sale">{language === 'fa' ? 'فروش ضایعات آهن و مصالح مازاد' : 'Scrap / Material Sale'}</option>
                <option value="miscellaneous">{language === 'fa' ? 'عواید متفرقه' : 'Other Income'}</option>
              </select>
            </div>
          </div>

          {/* Payer Name */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === 'fa' ? 'دریافت شده از (نام مشتری / سرمایه‌گذار)' : 'Received From (Customer / Investor)'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={payerName}
                onChange={e => setPayerName(e.target.value)}
                placeholder={language === 'fa' ? 'مثلاً: حاجی احمد مسعود، خریدار واحد ۳۰۲' : 'e.g. Ahmad Khan'}
                className="w-full ps-9 pe-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('amount') || 'Amount'}
              </label>
              <CurrencyAmountInput
                amount={amount}
                currency={currency}
                exchangeRate={exchangeRate}
                onAmountChange={setAmount}
                onCurrencyChange={setCurrency}
                onExchangeRateChange={setExchangeRate}
              />
            </div>

            {/* Target Account */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'fa' ? 'حساب واریزی (صندوق / بانک)' : 'Deposit Account'}
              </label>
              <select
                value={targetAccount}
                onChange={e => setTargetAccount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="حساب د افغانستان بانک">حساب جاری د افغانستان بانک (AFN)</option>
                <option value="صندوق مرکزی کابل پلازا">صندوق مرکزی پول نقد کابل پلازا</option>
                <option value="حساب عزیزی بانک">حساب ارزی عزیزی بانک (USD)</option>
                <option value="صرافی سرای شهزاده">حواله / صرافی معتمد سرای شهزاده</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Payment Method */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'fa' ? 'طریقه پرداخت' : 'Payment Method'}
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-semibold"
              >
                <option value="bank_transfer">{language === 'fa' ? 'انتقال بانکی' : 'Bank'}</option>
                <option value="cash">{language === 'fa' ? 'نقد' : 'Cash'}</option>
                <option value="hawala">{language === 'fa' ? 'حواله صرافی' : 'Hawala'}</option>
                <option value="cheque">{language === 'fa' ? 'چک' : 'Cheque'}</option>
              </select>
            </div>

            {/* Reference No */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'fa' ? 'شماره سند / رسید' : 'Receipt No'}
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={e => setReferenceNo(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-mono font-bold"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('date') || 'Date'}
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('notes') || 'Notes'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={language === 'fa' ? 'توضیحات و جزئیات بیشتر...' : 'Additional notes...'}
              className="w-full px-3.5 py-2 bg-surface-2 border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-surface-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition"
            >
              {t('cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-500/25 transition active:scale-95 disabled:opacity-50"
            >
              <Coins className="w-4 h-4" />
              <span>{isSubmitting ? (language === 'fa' ? 'در حال ثبت...' : 'Saving...') : (language === 'fa' ? 'ثبت و صدور رسید دریافتی' : 'Save & Issue Receipt')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
