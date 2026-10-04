import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Home, X, Check, Building, User, Phone, FileText, AlertCircle } from 'lucide-react';
import { ApartmentStatus, UnitType } from '../../types';
import { CurrencyAmountInput } from '../CurrencyAmountInput';

interface AddApartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SECTION_OPTIONS = [
  'رخ سرک عمومی (رو به سرک)',
  'آفتاب‌رخ (رو به جنوب)',
  'شمالی (پشت به سرک)',
  'بلاک شرقی (Block A)',
  'بلاک غربی (Block B)',
];

export const AddApartmentModal: React.FC<AddApartmentModalProps> = ({ isOpen, onClose }) => {
  const { currentProject, addApartment, apartments, t } = useApp();
  const [unitNumber, setUnitNumber] = useState('');
  const [floor, setFloor] = useState('3');
  const [buildingSection, setBuildingSection] = useState('رخ سرک عمومی (رو به سرک)');
  const [customSection, setCustomSection] = useState('');
  const [unitType, setUnitType] = useState<UnitType>('apartment');
  const [areaM2, setAreaM2] = useState('120');

  // Pricing and Currency
  const [pricingMode, setPricingMode] = useState<'total' | 'perM2'>('total');
  const [totalPriceInput, setTotalPriceInput] = useState('75000');
  const [pricePerM2Input, setPricePerM2Input] = useState('625');
  const [currency, setCurrency] = useState<'USD' | 'AFN'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(currentProject?.defaultExchangeRate || 70);

  // Status & Buyer Details
  const [status, setStatus] = useState<ApartmentStatus>('sold');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerTazkira, setBuyerTazkira] = useState('');
  const [buyerDetails, setBuyerDetails] = useState('');
  const [contractDate, setContractDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [downPayment, setDownPayment] = useState('20000');
  const [notes, setNotes] = useState('');

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

  const parsedArea = parseFloat(areaM2) || 0;
  let finalTotalPriceUSD = 0;
  let finalPricePerM2USD = 0;

  if (pricingMode === 'perM2') {
    const rawPerM2 = parseFloat(pricePerM2Input) || 0;
    const perM2USD = currency === 'USD' ? rawPerM2 : (exchangeRate > 0 ? rawPerM2 / exchangeRate : rawPerM2);
    finalPricePerM2USD = Math.round(perM2USD);
    finalTotalPriceUSD = Math.round(perM2USD * parsedArea);
  } else {
    const rawTotal = parseFloat(totalPriceInput) || 0;
    const totalUSD = currency === 'USD' ? rawTotal : (exchangeRate > 0 ? rawTotal / exchangeRate : rawTotal);
    finalTotalPriceUSD = Math.round(totalUSD);
    finalPricePerM2USD = parsedArea > 0 ? Math.round(totalUSD / parsedArea) : 0;
  }
  const finalTotalPriceAFN = Math.round(finalTotalPriceUSD * exchangeRate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!unitNumber.trim()) {
      setFormError('شماره واحد یا آپارتمان الزامی است.');
      return;
    }
    if (isNaN(parsedArea) || parsedArea <= 0) {
      setFormError('مساحت واحد باید بزرگتر از صفر باشد.');
      return;
    }
    if (finalTotalPriceUSD <= 0) {
      setFormError('قیمت فروش واحد نامعتبر است.');
      return;
    }

    const isDuplicate = apartments.some(
      a => a.projectId === currentProject.id && 
           a.unitNumber.trim().toLowerCase() === unitNumber.trim().toLowerCase()
    );
    if (isDuplicate) {
      setFormError(`واحدی با شماره "${unitNumber.trim()}" قبلاً در این پروژه ثبت شده است.`);
      return;
    }

    const initialDown = parseFloat(downPayment) || 0;
    if (initialDown < 0) {
      setFormError('پیش‌پرداخت نمی‌تواند منفی باشد.');
      return;
    }
    const initialDownUSD = currency === 'USD' 
      ? initialDown 
      : (exchangeRate > 0 ? parseFloat((initialDown / exchangeRate).toFixed(2)) : initialDown);

    if (initialDownUSD > finalTotalPriceUSD) {
      setFormError('مبلغ پیش‌پرداخت نمی‌تواند بیشتر از کل قیمت واحد باشد.');
      return;
    }

    if (status !== 'available' && !buyerName.trim()) {
      setFormError('نام خریدار برای واحدهای فروخته‌شده یا رزرو الزامی است.');
      return;
    }

    if (status !== 'available' && (!contractDate || isNaN(new Date(contractDate).getTime()))) {
      setFormError('تاریخ قرارداد معتبر نیست.');
      return;
    }

    setIsSubmitting(true);

    const actualSection = buildingSection === 'سایر' && customSection.trim() 
      ? customSection.trim() 
      : buildingSection;

    const installments = initialDownUSD > 0 && status !== 'available' ? [
      {
        id: `inst_${Date.now()}`,
        date: contractDate,
        amount: initialDownUSD,
        currency: 'USD',
        received: true,
        receivedDate: contractDate,
        notes: `پیش‌پرداخت اولیه خرید (${currency === 'AFN' ? `${initialDown.toLocaleString()} AFN` : `$${initialDown.toLocaleString()}`})`,
      }
    ] : [];

    addApartment({
      projectId: currentProject.id,
      unitNumber: unitNumber.trim(),
      floor: parseInt(floor) || 1,
      buildingSection: actualSection,
      unitType,
      type: unitType,
      areaM2: parsedArea,
      pricePerM2: finalPricePerM2USD,
      totalPrice: finalTotalPriceUSD,
      salePrice: finalTotalPriceUSD,
      currency,
      exchangeRate,
      salePriceInAFN: finalTotalPriceAFN,
      salePriceInUSD: finalTotalPriceUSD,
      status,
      buyerName: status !== 'available' ? buyerName.trim() : undefined,
      buyerPhone: status !== 'available' ? buyerPhone.trim() : undefined,
      buyerTazkira: status !== 'available' ? buyerTazkira.trim() : undefined,
      buyerDetails: status !== 'available' ? buyerDetails.trim() : undefined,
      contractDate: status !== 'available' ? contractDate : undefined,
      saleDate: status !== 'available' ? contractDate : undefined,
      downPayment: initialDownUSD,
      amountReceived: initialDownUSD,
      totalReceived: initialDownUSD,
      installments,
      notes: notes.trim() || undefined,
    });

    setIsSubmitting(false);
    onClose();
  };

  const initialDown = parseFloat(downPayment) || 0;
  const initialDownUSD = currency === 'USD' 
    ? initialDown 
    : (exchangeRate > 0 ? parseFloat((initialDown / exchangeRate).toFixed(2)) : initialDown);
  const remainingInstallmentsUSD = Math.max(0, finalTotalPriceUSD - initialDownUSD);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/75 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-line my-0 sm:my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">{t.addApartment || 'ثبت آپارتمان / فروش'}</h3>
              <p className="text-[11px] text-slate-400">{currentProject.name}</p>
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

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-bold">{formError}</span>
            </div>
          )}
          
          <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-line space-y-3">
            <div className="font-bold text-ink text-xs flex items-center gap-1.5 border-b border-slate-200/80 dark:border-slate-700 pb-2">
              <Building className="w-4 h-4 text-amber-600" />
              <span>مشخصات ساختمانی واحد</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شماره واحد <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 301 یا A-4"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-mono font-bold text-ink focus:ring-2 focus:ring-amber-500/20 text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  منزل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  required
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-mono font-bold text-ink focus:ring-2 focus:ring-amber-500/20 text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مساحت (m²) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="120"
                  value={areaM2}
                  onChange={(e) => setAreaM2(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-mono font-bold text-ink focus:ring-2 focus:ring-amber-500/20 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  جهت / موقعیت واحد
                </label>
                <select
                  value={buildingSection}
                  onChange={(e) => setBuildingSection(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-xs font-semibold text-ink"
                >
                  {SECTION_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  <option value="سایر">موقعیت دیگر (دلخواه)</option>
                </select>
                {buildingSection === 'سایر' && (
                  <input
                    type="text"
                    placeholder="موقعیت دلخواه..."
                    value={customSection}
                    onChange={(e) => setCustomSection(e.target.value)}
                    className="w-full mt-1.5 px-3 py-1.5 border border-amber-300 rounded-lg text-xs"
                  />
                )}
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نوعیت کاربری
                </label>
                <select
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value as UnitType)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-xs font-semibold text-ink"
                >
                  <option value="apartment">آپارتمان رهایشی</option>
                  <option value="penthouse">پنت‌هاوس (طبقه آخر)</option>
                  <option value="shop">دکان تجارتی</option>
                  <option value="office">دفتر کار</option>
                  <option value="parking">پارکینگ اختصاصی</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-line space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700 pb-2">
              <span className="font-bold text-ink text-xs">وضعیت فروش و قیمت‌گذاری</span>
              <div className="flex items-center gap-1">
                {(['sold', 'available', 'reserved'] as ApartmentStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      status === st
                        ? st === 'sold'
                          ? 'bg-slate-900 text-white'
                          : st === 'reserved'
                          ? 'bg-blue-600 text-white'
                          : 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    {st === 'sold' ? 'فروخته شد' : st === 'reserved' ? 'رزرو' : 'آزاد'}
                  </button>
                ))}
              </div>
            </div>

            <CurrencyAmountInput
              amount={totalPriceInput}
              onChangeAmount={setTotalPriceInput}
              currency={currency}
              onChangeCurrency={setCurrency}
              exchangeRate={exchangeRate}
              onChangeExchangeRate={setExchangeRate}
              label="قیمت کل فروش واحد"
              required={true}
              placeholder="75000"
            />

            <div className="flex justify-between items-center text-[11px] px-2 text-slate-600 dark:text-slate-400">
              <span>قیمت فی متر مربع:</span>
              <span className="font-mono font-bold text-ink">
                ${finalPricePerM2USD.toLocaleString()} / m²
              </span>
            </div>
          </div>

          {(status === 'sold' || status === 'reserved') && (
            <div className="bg-amber-50/60 dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-200/90 dark:border-amber-800 space-y-3 animate-in fade-in">
              <div className="font-bold text-ink text-xs flex items-center gap-1.5 border-b border-amber-200 dark:border-amber-800 pb-2">
                <User className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span>مشخصات خریدار و پیش‌پرداخت</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    نام و تخلص خریدار <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: حاجی عبدالهادی"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-bold text-ink text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    شماره تماس خریدار
                  </label>
                  <input
                    type="tel"
                    placeholder="0799123456"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-xs font-mono text-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    شماره تذکره خریدار
                  </label>
                  <input
                    type="text"
                    placeholder="جلد و صفحه یا الکترونیکی"
                    value={buyerTazkira}
                    onChange={(e) => setBuyerTazkira(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-xs text-ink"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    تاریخ عقد قرارداد
                  </label>
                  <input
                    type="date"
                    value={contractDate}
                    onChange={(e) => setContractDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-xs font-mono text-ink"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-surface rounded-xl border border-amber-300 dark:border-amber-700 space-y-1.5">
                <label className="block font-bold text-ink">
                  پیش‌پرداخت دریافت شده ({currency === 'USD' ? 'دالر $' : 'افغانی'})
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="20000"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-emerald-800 dark:text-emerald-400 bg-surface"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">یادداشت</label>
            <textarea
              rows={2}
              placeholder="توضیحات قرارداد یا نحوه اقساط..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-surface text-ink"
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
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? t.loading : (status === 'available' ? 'ثبت واحد جدید' : 'ثبت فروش واحد')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
