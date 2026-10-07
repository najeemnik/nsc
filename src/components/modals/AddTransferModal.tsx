import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowLeftRight, X, CheckCircle, Building2, Wallet } from 'lucide-react';
import { backendApi } from '../../services/backendApi';

interface AddTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSourceProjectId?: string;
}

export const AddTransferModal: React.FC<AddTransferModalProps> = ({
  isOpen,
  onClose,
  defaultSourceProjectId,
}) => {
  const { currentProject, projects, formatCurrency, t, language } = useApp();
  const [fromProjectId, setFromProjectId] = useState<string>(defaultSourceProjectId || currentProject?.id || (projects[0]?.id || ''));
  const [toProjectId, setToProjectId] = useState<string>('');
  const [transferNature, setTransferNature] = useState<'funds' | 'materials' | 'equipment'>('funds');
  const [amount, setAmount] = useState('50000');
  const [fromAccount, setFromAccount] = useState('صندوق مرکزی کارگاه مبدأ');
  const [toAccount, setToAccount] = useState('حساب بانکی پروژه مقصد');
  const [approvedBy, setApprovedBy] = useState('مدیر مالی و پروژه');
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultSourceProjectId) setFromProjectId(defaultSourceProjectId);
    else if (currentProject) setFromProjectId(currentProject.id);
    const other = projects.find(p => p.id !== (defaultSourceProjectId || currentProject?.id));
    if (other) setToProjectId(other.id);
    setTransferDate(new Date().toISOString().split('T')[0]);
  }, [isOpen, defaultSourceProjectId, currentProject, projects]);

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
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setFormError(language === 'fa' ? 'لطفاً مبلغ معتبر وارد کنید.' : 'Please enter a valid transfer amount.');
      return;
    }
    if (!fromProjectId || !toProjectId || fromProjectId === toProjectId) {
      setFormError(language === 'fa' ? 'پروژه مبدأ و مقصد نباید یکسان باشند.' : 'Source and destination projects must be different.');
      return;
    }

    setIsSubmitting(true);
    try {
      await backendApi.interProjectTransfer({
        fromProjectId,
        toProjectId,
        transferNature,
        amount: numAmt,
        transferDate,
        approvedBy: approvedBy.trim(),
        description: description.trim() || undefined,
      });

      setSuccessNotice(true);
      setTimeout(() => {
        setSuccessNotice(false);
        setIsSubmitting(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'خطا در ثبت حواله بین پروژه‌ای');
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
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-line bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-600 flex items-center justify-center font-bold">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-ink">
                {language === 'fa' ? 'حواله و انتقال بین‌پروژه‌ای (Project Transfer)' : 'Inter-Project Transfer'}
              </h2>
              <p className="text-xs text-ink-muted">
                {language === 'fa' ? 'انتقال پول، مصالح یا تجهیزات با اثر حسابداری دوطرفه در هر دو کارگاه' : 'Bilateral cost & treasury impact across both sites'}
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
              <span>{language === 'fa' ? 'حواله انتقال بین دو پروژه با موفقیت صادر و اعمال شد!' : 'Inter-project transfer recorded successfully!'}</span>
            </div>
          )}

          {/* Project Source ➔ Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'fa' ? 'از پروژه (مبدأ ارسال):' : 'From Project (Source):'}
              </label>
              <select
                value={fromProjectId}
                onChange={e => setFromProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-ink font-semibold"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'fa' ? 'به پروژه (مقصد دریافت):' : 'To Project (Destination):'}
              </label>
              <select
                value={toProjectId}
                onChange={e => setToProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-ink font-semibold"
              >
                <option value="">-- انتخاب پروژه مقصد --</option>
                {projects.filter(p => p.id !== fromProjectId).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Transfer Nature */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'fa' ? 'ماهیت انتقال' : 'Transfer Type'}
              </label>
              <select
                value={transferNature}
                onChange={e => setTransferNature(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-ink font-semibold"
              >
                <option value="funds">{language === 'fa' ? 'وجوه نقدی و مالی (Funds)' : 'Cash / Funds'}</option>
                <option value="materials">{language === 'fa' ? 'مصالح ساختمانی مازاد (Materials)' : 'Materials'}</option>
                <option value="equipment">{language === 'fa' ? 'ماشین‌آلات و تجهیزات (Equipment)' : 'Machinery'}</option>
              </select>
            </div>

            {/* Amount / Value */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'fa' ? 'مبلغ یا ارزش تخمینی (AFN)' : 'Amount / Value (AFN)'}
              </label>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-ink font-mono font-bold text-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'fa' ? 'تأییدکننده انتقال' : 'Authorized By'}
              </label>
              <input
                type="text"
                value={approvedBy}
                onChange={e => setApprovedBy(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('date') || 'Date'}
              </label>
              <input
                type="date"
                value={transferDate}
                onChange={e => setTransferDate(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === 'fa' ? 'علت حواله و توضیحات' : 'Reason / Description'}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="دلیل انتقال وجه یا مصالح بین دو کارگاه ساختمانی..."
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-500/25 transition active:scale-95 disabled:opacity-50"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>{isSubmitting ? 'در حال ثبت...' : 'صدور و اجرای حواله'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
