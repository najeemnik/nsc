import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { localizeText } from '../../i18n/localize';
import { HardHat, X, Calculator, CheckCircle, UserCheck, DollarSign, MinusCircle } from 'lucide-react';

interface AddLaborModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultWorkerName?: string;
}

export const AddLaborModal: React.FC<AddLaborModalProps> = ({
  isOpen,
  onClose,
  defaultWorkerName,
}) => {
  const { currentProject, projects, formatCurrency, t, language, addLaborRecord } = useApp();
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });
  const [projectId, setProjectId] = useState<string>(currentProject?.id || (projects[0]?.id || ''));
  const [workerName, setWorkerName] = useState(defaultWorkerName || '');
  const [workType, setWorkType] = useState('خشت‌کاری و دیوارچینی');
  const [daysOrUnits, setDaysOrUnits] = useState('15');
  const [ratePerUnit, setRatePerUnit] = useState('1400');
  const [advanceDeduction, setAdvanceDeduction] = useState('3000');
  const [payrollDate, setPayrollDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [approvedBy, setApprovedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const numDays = parseFloat(daysOrUnits) || 0;
  const numRate = parseFloat(ratePerUnit) || 0;
  const grossAmount = numDays * numRate;
  const numAdvance = parseFloat(advanceDeduction) || 0;
  const netPaid = Math.max(0, grossAmount - numAdvance);

  useEffect(() => {
    if (currentProject) setProjectId(currentProject.id);
    if (defaultWorkerName) setWorkerName(defaultWorkerName);
    setPayrollDate(new Date().toISOString().split('T')[0]);
  }, [isOpen, currentProject, defaultWorkerName]);

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
    if (!workerName.trim()) {
      setFormError(tx('Worker or team name is required.', 'نام استادکار یا سرتیم کارگری الزامی است.', 'د کارګر یا ډلې نوم اړین دی.'));
      return;
    }
    if (numDays <= 0 || numRate <= 0) {
      setFormError(tx('Days/units and rate must be greater than zero.', 'تعداد روز/واحد و نرخ روزانه باید بزرگتر از صفر باشد.', 'ورځې یا واحدونه او نرخ باید تر صفر ډېر وي.'));
      return;
    }

    setIsSubmitting(true);
    try {
      addLaborRecord({
        projectId,
        workerName: workerName.trim(),
        role: workType,
        workPeriod: payrollDate.slice(0, 7),
        daysWorked: numDays,
        dailyRate: numRate,
        grossWage: grossAmount,
        advanceDeduction: numAdvance,
        netPayable: netPaid,
        paymentStatus: 'paid',
        paidDate: payrollDate,
        approvedBy: approvedBy.trim(),
        notes: notes.trim() || undefined,
      });

      setSuccessNotice(true);
      setTimeout(() => {
        setSuccessNotice(false);
        setIsSubmitting(false);
        onClose();
      }, 1000);
    } catch {
      setFormError(tx('Could not save the payroll record.', 'ثبت معاش انجام نشد.', 'د مزد ثبتول ناکام شول.'));
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
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-line bg-gradient-to-r from-purple-600/10 via-indigo-600/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-600 flex items-center justify-center font-bold">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-ink">
                {tx('Worker Payroll & Wages', 'محاسبه کارکرد و معاشات کارگران (Labor Wages)', 'د کارګرانو د مزد او معاش ثبت')}
              </h2>
              <p className="text-xs text-ink-muted">
                {tx('Auto Gross calculation, advance deduction and net payment', 'روزکار × نرخ = ناخالص، کسر اتوماتیک مساعده‌ها و تسویه خالص', 'د ناخالص مزد اتومات محاسبه، د پیشکي کسر او خالصه ورکړه')}
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
              <span>{tx('Labor wages and advance settled successfully!', 'کارکرد و تسویه معاش کارگر با موفقیت ثبت شد!', 'د کارګر مزد او پیشکي په بریالیتوب تصفیه شول!')}</span>
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
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            {/* Work Type */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tx('Trade Scope', 'نوع فعالیت کارگری', 'د کار ډول')}
              </label>
              <select
                value={workType}
                onChange={e => setWorkType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              >
                <option value="خشت‌کاری و دیوارچینی">{tx('Masonry', 'خشت‌کاری و دیوارچینی', 'خښتو ایښودل او دېوال جوړول')}</option>
                <option value="قالب‌بندی و نجاری کارگاه">{tx('Shuttering', 'قالب‌بندی و نجاری کارگاه', 'قالب‌بندي او ترکاڼي')}</option>
                <option value="سیخ‌بندی و آرماتوربندی">{tx('Steel Fixing', 'سیخ‌بندی و آرماتوربندی', 'د سیخونو تړل او آرماتوربندي')}</option>
                <option value="کانکریت‌ریزی و ویبراتور">{tx('Concrete Casting', 'کانکریت‌ریزی و ویبراتور', 'د کانکریټو اچول او ویبرېټر کارول')}</option>
                <option value="پلسترکاری و سیمان‌کاری">{tx('Plastering', 'پلسترکاری و سیمان‌کاری', 'پلستر او سمنټ‌کاري')}</option>
                <option value="رنگ‌مالی و نقاشی ساختمان">{tx('Painting', 'رنگ‌مالی و نقاشی ساختمان', 'رنګ‌مالي او نقاشي')}</option>
                <option value="کارگری روزمزد و پاک‌کاری ساحه">{tx('Site Helpers / Cleaning', 'کارگری روزمزد و پاک‌کاری ساحه', 'د ساحې مرسته او پاک‌کاري')}</option>
              </select>
            </div>
          </div>

          {/* Worker Name */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {tx('Worker or Team Name', 'نام استادکار یا سرتیم کارگری', 'د کارګر یا ډلې نوم')}
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={workerName}
                onChange={e => setWorkerName(e.target.value)}
                placeholder={tx('e.g. Master Rahim team', 'مثلاً: استاد رحیم و گروه ۴ نفره خشت‌کار', 'لکه: د رحیم استاد ډله')}
                className="w-full ps-9 pe-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>
          </div>

          {/* Days, Rate & Advance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tx('Days / Units', 'کارکرد (روز / واحد)', 'ورځې / واحدونه')}
              </label>
              <input
                type="number"
                step="any"
                required
                value={daysOrUnits}
                onChange={e => setDaysOrUnits(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tx('Daily Rate (AFN)', 'نرخ روزانه (AFN)', 'ورځنی نرخ (AFN)')}
              </label>
              <input
                type="number"
                step="any"
                required
                value={ratePerUnit}
                onChange={e => setRatePerUnit(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-mono font-bold text-purple-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tx('Advance Deduction', 'کسر مساعده‌ها (AFN)', 'د پیشکي کسر')}
              </label>
              <input
                type="number"
                step="any"
                value={advanceDeduction}
                onChange={e => setAdvanceDeduction(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-mono font-bold text-rose-600"
              />
            </div>
          </div>

          {/* MBA Formula Banner (Days × Rate = Gross; Gross - Advance = Net Paid) */}
          <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-bold">
                {tx(
                  `Gross wages: ${numDays} days × ${numRate.toLocaleString()} AFN`,
                  `مجموع دستمزد ناخالص: ${numDays} روز × ${numRate.toLocaleString()} AFN`,
                  `ناخالص مزد: ${numDays} ورځې × ${numRate.toLocaleString()} AFN`,
                )}
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {grossAmount.toLocaleString()} AFN
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-rose-600">
              <span className="font-bold flex items-center gap-1">
                <MinusCircle className="w-3.5 h-3.5" />
                <span>{tx('Advance Deducted:', 'کسر مساعده دریافت شده قبلی:', 'کسر شوی پیشکي:')}</span>
              </span>
              <span className="font-mono font-bold">
                - {numAdvance.toLocaleString()} AFN
              </span>
            </div>

            <div className="border-t border-purple-500/30 pt-1.5 flex items-center justify-between">
              <span className="font-black text-xs text-purple-700 dark:text-purple-300">
                {tx('Net Paid to Worker:', 'خالص پرداختی نقدی نهایی:', 'کارګر ته خالصه ورکړه:')}
              </span>
              <span className="text-base font-black text-purple-600 dark:text-purple-400 font-mono">
                {netPaid.toLocaleString()} AFN
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tx('Approved By', 'تأییدکننده کارکرد', 'تأییدوونکی')}
              </label>
              <input
                type="text"
                value={approvedBy}
                onChange={e => setApprovedBy(e.target.value)}
                placeholder={tx('Name of supervisor', 'نام انجینر ناظر یا مسئول', 'د څارونکي نوم')}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('date') || 'Payroll Date'}
              </label>
              <input
                type="date"
                value={payrollDate}
                onChange={e => setPayrollDate(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('notes') || t("notes")}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={tx('Additional notes, work quality, overtime, or exact site location...', 'توضیحات تکمیلی، کیفیت کار، اضافه‌کاری یا محل دقیق فعالیت در کارگاه...', 'نور یادښتونه، د کار کیفیت، اضافي کار یا د ساحې کره ځای...')}
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
              {t('cancel') || t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black shadow-lg shadow-purple-500/25 transition active:scale-95 disabled:opacity-50"
            >
              <HardHat className="w-4 h-4" />
              <span>{isSubmitting ? tx('Saving...', 'در حال ثبت...', 'ثبتېږي...') : tx('Settle and pay wages', 'تسویه و پرداخت معاشات', 'مزد تصفیه او ورکړئ')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
