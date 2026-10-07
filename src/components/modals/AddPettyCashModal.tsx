import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Wallet, X, CheckCircle, Receipt, Coffee } from 'lucide-react';

interface AddPettyCashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPettyCashModal: React.FC<AddPettyCashModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentProject, projects, t, language } = useApp();
  const [projectId, setProjectId] = useState<string>(currentProject?.id || (projects[0]?.id || ''));
  const [category, setCategory] = useState('چای، نان و مهمان‌داری ساحه');
  const [amount, setAmount] = useState('500');
  const [paidTo, setPaidTo] = useState('آشپز کارگاه / مسئول خرید روزمره');
  const [purpose, setPurpose] = useState('');
  const [voucherNo, setVoucherNo] = useState(`PCV-${Date.now().toString().slice(-4)}`);
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [approvedBy, setApprovedBy] = useState('معتمد تنخواه‌گردان ساحه');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (currentProject) setProjectId(currentProject.id);
    setVoucherNo(`PCV-${Date.now().toString().slice(-4)}`);
    setExpenseDate(new Date().toISOString().split('T')[0]);
  }, [isOpen, currentProject]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setFormError(language === 'fa' ? 'لطفاً مبلغ معتبر وارد کنید.' : 'Please enter a valid amount.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setSuccessNotice(true);
      setTimeout(() => {
        setSuccessNotice(false);
        setIsSubmitting(false);
        onClose();
      }, 1000);
    }, 400);
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
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-ink">
                {language === 'fa' ? 'ثبت واچر تنخواه‌گردان کارگاه (Petty Cash)' : 'Petty Cash Voucher (PCV)'}
              </h2>
              <p className="text-xs text-ink-muted">
                {language === 'fa' ? 'ثبت مصارف خرد روزمره با کسر مستقیم از صندوق تنخواه ساحه' : 'Minor daily on-site operational expenses'}
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
              <span>{language === 'fa' ? 'واچر تنخواه با موفقیت ثبت و از صندوق کسر شد!' : 'Petty cash voucher recorded successfully!'}</span>
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
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-ink font-semibold"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'fa' ? 'بابت / موضوع هزینه' : 'Expense Category'}
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-ink font-semibold"
              >
                <option value="چای، نان و مهمان‌داری ساحه">{language === 'fa' ? 'چای، شکر، نان و مهمان‌داری ساحه' : 'Tea & Refreshments'}</option>
                <option value="کرایه موتر و ترانسپورت بار">{language === 'fa' ? 'کرایه موتر و ترانسپورت شهری' : 'Transport & Logistics'}</option>
                <option value="خرید ابزار خرد و سیمان فوری">{language === 'fa' ? 'خرید ابزار خرد و وسایل فوری' : 'Minor Hardware & Tools'}</option>
                <option value="مصارف اداری، قرطاسیه و اینترنت">{language === 'fa' ? 'مصارف اداری، قرطاسیه و اینترنت ساحه' : 'Stationery & Site Admin'}</option>
                <option value="ترمیمات فوری جنراتور یا پمپ">{language === 'fa' ? 'ترمیمات فوری وسایل ساحه' : 'Urgent Site Repairs'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'fa' ? 'مبلغ واچر (AFN)' : 'Voucher Amount (AFN)'}
              </label>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-ink font-mono font-bold text-emerald-600 text-sm"
              />
            </div>

            {/* Paid To */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'fa' ? 'پرداخت شده در وجه' : 'Paid To (Person)'}
              </label>
              <input
                type="text"
                required
                value={paidTo}
                onChange={e => setPaidTo(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-ink font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'fa' ? 'شماره واچر' : 'Voucher No'}
              </label>
              <input
                type="text"
                value={voucherNo}
                onChange={e => setVoucherNo(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('date') || 'Date'}
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={e => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'fa' ? 'تأییدکننده' : 'Approved By'}
              </label>
              <input
                type="text"
                value={approvedBy}
                onChange={e => setApprovedBy(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-semibold"
              />
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === 'fa' ? 'شرح و هدف دقیق مصرف' : 'Description'}
            </label>
            <textarea
              rows={2}
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="توضیح خرید نان چاشت، کرایه لاری برای تخلیه خشت، یا خرید سیم..."
              className="w-full px-3.5 py-2 bg-surface-2 border border-line rounded-xl text-ink"
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
              <Wallet className="w-4 h-4" />
              <span>{isSubmitting ? 'در حال ثبت...' : 'ثبت واچر تنخواه'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
