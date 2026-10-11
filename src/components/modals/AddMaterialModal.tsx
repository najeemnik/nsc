import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { localizeText } from '../../i18n/localize';
import { MATERIAL_PURCHASE_CATEGORIES, MATERIAL_PURCHASE_GROUPS } from '../../data/chartOfAccounts';
import { Truck, X, Calculator, Building2, CheckCircle, Package } from 'lucide-react';

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMaterialName?: string;
  defaultSupplierId?: string;
}

export const AddMaterialModal: React.FC<AddMaterialModalProps> = ({
  isOpen,
  onClose,
  defaultMaterialName,
  defaultSupplierId,
}) => {
  const { currentProject, projects, suppliers, t, language, addMaterialProcurement } = useApp();
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });
  const [projectId, setProjectId] = useState<string>(currentProject?.id || (projects[0]?.id || ''));
  const selectedProject = projects.find(project => project.id === projectId) || currentProject;
  const procurementCurrency = selectedProject?.currency || 'AFN';
  const [materialName, setMaterialName] = useState(defaultMaterialName || '');
  const [category, setCategory] = useState('mat_other');
  const [quantity, setQuantity] = useState('1');
  const [unitOfMeasure, setUnitOfMeasure] = useState('بوجی (کیسه)');
  const [unitPrice, setUnitPrice] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierId, setSupplierId] = useState(defaultSupplierId || '');
  const [isPaid, setIsPaid] = useState(true);
  const [invoiceNo, setInvoiceNo] = useState(`INV-${Date.now().toString().slice(-5)}`);
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const numQty = parseFloat(quantity) || 0;
  const numUnitPrice = parseFloat(unitPrice) || 0;
  const totalCost = numQty * numUnitPrice;
  const formatProcurementAmount = (amount: number) =>
    `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${procurementCurrency}`;

  useEffect(() => {
    if (currentProject) setProjectId(currentProject.id);
    if (defaultMaterialName) setMaterialName(defaultMaterialName);
    setInvoiceNo(`INV-${Date.now().toString().slice(-5)}`);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
  }, [isOpen, currentProject, defaultMaterialName]);

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
    if (!materialName.trim()) {
      setFormError(tx('Material name is required.', 'نام جنس/ماده ساختمانی الزامی است.', 'د توکي نوم اړین دی.'));
      return;
    }
    if (numQty <= 0 || numUnitPrice <= 0) {
      setFormError(tx('Quantity and price must be greater than zero.', 'تعداد و قیمت فی واحد باید بیشتر از صفر باشد.', 'مقدار او بیه باید تر صفر ډېر وي.'));
      return;
    }

    setIsSubmitting(true);
    try {
      addMaterialProcurement({
        projectId,
        materialName: materialName.trim(),
        materialCategory: category,
        quantity: numQty,
        unitOfMeasure,
        unitPrice: numUnitPrice,
        currency: procurementCurrency,
        exchangeRate: selectedProject?.defaultExchangeRate || 70,
        supplierName: supplierName.trim(),
        supplierId: supplierId || undefined,
        isPaid,
        invoiceNo,
        purchaseDate,
        notes: notes.trim() || undefined,
      });

      setSuccessNotice(true);
      setTimeout(() => {
        setSuccessNotice(false);
        setIsSubmitting(false);
        onClose();
      }, 1000);
    } catch {
      setFormError(tx('Could not save the material purchase.', 'ثبت خرید مصالح انجام نشد.', 'د توکو پېرل ثبت نه شول.'));
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
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-line bg-gradient-to-r from-amber-600/10 via-orange-600/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-ink">
                {tx('Material Purchase & Procurement', 'ثبت و تدارکات خرید مصالح (تعداد × فی)', 'د ودانیزو توکو پېرل او تدارک')}
              </h2>
              <p className="text-xs text-ink-muted">
                {tx('Auto-calculated Total Cost connected to Actual Cost', 'محاسبه خودکار سرجمع و اتصال مستقیم به مصارف و تأمین‌کننده', 'د ټول لګښت اتومات محاسبه او د واقعي لګښت سره تړل')}
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
              <span>{tx('Material purchase logged successfully!', 'خرید مصالح با موفقیت ثبت و در مصارف پروژه اعمال گردید!', 'د توکو پېرل په بریالیتوب ثبت شول!')}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Project */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tx('Project', 'پروژه', 'پروژه')}
              </label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tx('Category', 'دسته‌بندی مواد', 'ډول')}
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                {MATERIAL_PURCHASE_GROUPS.map(group => (
                  <optgroup key={group.id} label={localizeText(language, group.labels)}>
                    {MATERIAL_PURCHASE_CATEGORIES
                      .filter(materialCategory => materialCategory.group === group.id)
                      .map(materialCategory => (
                        <option key={materialCategory.id} value={materialCategory.id}>
                          {localizeText(language, materialCategory.labels)}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Material Name */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {tx('Material Description', 'نام مشخص جنس / مواد', 'د توکي جزیات')}
            </label>
            <div className="relative">
              <Package className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={materialName}
                onChange={e => setMaterialName(e.target.value)}
                placeholder={tx('e.g. Portland Cement Grade 1', 'مثلاً: سیمان پرتلند غوری درجه یک', 'لکه: د لومړۍ درجې پورټلنډ سمنټ')}
                className="w-full ps-9 pe-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>

          {/* Quantity, Unit & Unit Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tx('Quantity', 'تعداد / مقدار (Qty)', 'مقدار')}
              </label>
              <input
                type="number"
                step="any"
                required
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tx('Unit', 'واحد اندازه‌گیری', 'واحد')}
              </label>
              <select
                value={unitOfMeasure}
                onChange={e => setUnitOfMeasure(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-semibold"
              >
                <option value="بوجی (کیسه)">{tx('Bag', 'بوجی / کیسه', 'بوجۍ')}</option>
                <option value="تن (Tons)">{tx('Tons', 'تن', 'ټنه')}</option>
                <option value="متر مکعب (m³)">{tx('Cubic metres (m³)', 'متر مکعب (m³)', 'مکعب متره (m³)')}</option>
                <option value="عدد (Pieces)">{tx('Pieces', 'عدد', 'دانې')}</option>
                <option value="متر طول (Meters)">{tx('Linear metres', 'متر طول', 'اوږده متره')}</option>
                <option value="موتر / لاری (Trucks)">{tx('Truckloads', 'موتر / لاری', 'لارۍ')}</option>
                <option value="کیلوگرم (Kg)">{tx('Kilograms (kg)', 'کیلوگرام (kg)', 'کیلوګرام (kg)')}</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tx('Unit Price', 'قیمت فی واحد', 'د هر واحد بیه')} ({procurementCurrency})
              </label>
              <input
                type="number"
                step="any"
                required
                value={unitPrice}
                onChange={e => setUnitPrice(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-mono font-bold text-emerald-600"
              />
            </div>
          </div>

          {/* Auto-Calculated Formula Banner (MBA spec: Qty × Unit Cost = Total Cost) */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <Calculator className="w-4 h-4 shrink-0" />
              <span className="font-bold">
                {tx('Formula: ', 'فرمول محاسبه سرجمع: ', 'محاسبه: ')}
                <span className="font-mono">{numQty} {unitOfMeasure} × {formatProcurementAmount(numUnitPrice)}</span>
              </span>
            </div>
            <div className="text-end">
              <span className="text-[10px] text-slate-400 block">{tx('Total Cost:', 'مجموع بهای کل:', 'ټول لګښت:')}</span>
              <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                {formatProcurementAmount(totalCost)}
              </span>
            </div>
          </div>

          {/* Supplier & Settlement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tx('Supplier', 'تأمین‌کننده / فروشنده', 'عرضه‌کوونکی')}
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  placeholder={tx('Supplier or shop name', 'نام شرکت یا دکان فروشنده', 'د عرضه‌کوونکي یا هټۍ نوم')}
                  className="w-full ps-9 pe-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-ink font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tx('Settlement Status', 'وضعیت تسویه مالی', 'د تصفیې حالت')}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaid(true)}
                  className={`flex-1 py-2 rounded-xl font-bold transition ${
                    isPaid ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface-2 text-slate-500'
                  }`}
                >
                  {tx('Paid (Cash)', 'پرداخت نقدی (کسر از صندوق)', 'ورکړل شوي (نغدې)')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaid(false)}
                  className={`flex-1 py-2 rounded-xl font-bold transition ${
                    !isPaid ? 'bg-amber-600 text-white shadow-xs' : 'bg-surface-2 text-slate-500'
                  }`}
                >
                  {tx('Credit / Payable', 'نسیه (طلب تأمین‌کننده)', 'پور / ورکړې ته پاتې')}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tx('Invoice Number', 'شماره بل فاکتور', 'د بل شمېره')}
              </label>
              <input
                type="text"
                value={invoiceNo}
                onChange={e => setInvoiceNo(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tx('Purchase Date', 'تاریخ خرید', 'د پېرلو نېټه')}
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
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
              placeholder={tx('Additional notes, delivery point, or truck number...', 'توضیحات تکمیلی، محل تخلیه بار در کارگاه یا شماره موتر...', 'نور یادښتونه، د توکو د ښکته کولو ځای یا د لارۍ شمېره...')}
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black shadow-lg shadow-amber-500/25 transition active:scale-95 disabled:opacity-50"
            >
              <Truck className="w-4 h-4" />
              <span>{isSubmitting ? tx('Saving...', 'در حال ثبت...', 'ثبتېږي...') : tx('Save purchase and issue voucher', 'ثبت خرید و صدور سند مصالح', 'پېرل ثبت او سند صادر کړئ')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
