import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { intlLocaleFor, localizeText } from '../../i18n/localize';
import { Home, X, Check, Building, User, Phone, FileText, AlertCircle } from 'lucide-react';
import { ApartmentStatus, UnitType } from '../../types';
import { CurrencyAmountInput } from '../CurrencyAmountInput';

interface AddApartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SECTION_OPTIONS = [
  { value: 'رخ سرک عمومی (رو به سرک)', en: 'Street-facing', fa: 'رخ سرک عمومی (رو به سرک)', ps: 'د سړک مخامخ لوری' },
  { value: 'آفتاب‌رخ (رو به جنوب)', en: 'South-facing', fa: 'آفتاب‌رخ (رو به جنوب)', ps: 'سویل ته مخامخ' },
  { value: 'شمالی (پشت به سرک)', en: 'North-facing', fa: 'شمالی (پشت به سرک)', ps: 'شمال ته مخامخ' },
  { value: 'بلاک شرقی (Block A)', en: 'East block (Block A)', fa: 'بلاک شرقی (Block A)', ps: 'ختیځ بلاک (Block A)' },
  { value: 'بلاک غربی (Block B)', en: 'West block (Block B)', fa: 'بلاک غربی (Block B)', ps: 'لوېدیځ بلاک (Block B)' },
] as const;

export const AddApartmentModal: React.FC<AddApartmentModalProps> = ({ isOpen, onClose }) => {
  const { currentProject, addApartment, apartments, language } = useApp();
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });
  const formatNumber = (value: number) => value.toLocaleString(intlLocaleFor(language));
  const [unitNumber, setUnitNumber] = useState('');
  const [floor, setFloor] = useState('3');
  const [buildingSection, setBuildingSection] = useState<string>(SECTION_OPTIONS[0].value);
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
      setFormError(tx('Unit or apartment number is required.', 'شمارهٔ واحد یا آپارتمان الزامی است.', 'د اپارتمان یا واحد شمېره اړینه ده.'));
      return;
    }
    if (isNaN(parsedArea) || parsedArea <= 0) {
      setFormError(tx('Unit area must be greater than zero.', 'مساحت واحد باید بیشتر از صفر باشد.', 'د واحد مساحت باید تر صفر لوړه وي.'));
      return;
    }
    if (finalTotalPriceUSD <= 0) {
      setFormError(tx('The sale price is invalid.', 'قیمت فروش واحد نامعتبر است.', 'د پلور بیه ناسمه ده.'));
      return;
    }

    const isDuplicate = apartments.some(
      a => a.projectId === currentProject.id &&
           a.unitNumber.trim().toLowerCase() === unitNumber.trim().toLowerCase()
    );
    if (isDuplicate) {
      setFormError(tx(`Unit ${unitNumber.trim()} is already registered for this project.`, `واحد شمارهٔ «${unitNumber.trim()}» پیش‌تر در این پروژه ثبت شده است.`, `د ${unitNumber.trim()} شمېرې واحد په دې پروژه کې مخکې ثبت شوی دی.`));
      return;
    }

    const initialDown = parseFloat(downPayment) || 0;
    if (initialDown < 0) {
      setFormError(tx('The down payment cannot be negative.', 'پیش‌پرداخت نمی‌تواند منفی باشد.', 'مخکېنۍ ورکړه منفي کېدای نه شي.'));
      return;
    }
    const initialDownUSD = currency === 'USD'
      ? initialDown
      : (exchangeRate > 0 ? parseFloat((initialDown / exchangeRate).toFixed(2)) : initialDown);

    if (initialDownUSD > finalTotalPriceUSD) {
      setFormError(tx('The down payment cannot exceed the unit price.', 'مبلغ پیش‌پرداخت نمی‌تواند بیشتر از قیمت کل واحد باشد.', 'مخکېنۍ ورکړه د واحد له ټولې بیې لوړه کېدای نه شي.'));
      return;
    }

    if (status !== 'available' && !buyerName.trim()) {
      setFormError(tx('A buyer name is required for sold or reserved units.', 'برای واحد فروخته‌شده یا رزروشده نام خریدار الزامی است.', 'د پلورل شوي یا ساتل شوي واحد لپاره د پېرودونکي نوم اړین دی.'));
      return;
    }

    if (status !== 'available' && (!contractDate || isNaN(new Date(contractDate).getTime()))) {
      setFormError(tx('The contract date is invalid.', 'تاریخ قرارداد نامعتبر است.', 'د تړون نېټه ناسمه ده.'));
      return;
    }

    setIsSubmitting(true);

    const actualSection = buildingSection === 'custom' && customSection.trim()
      ? customSection.trim()
      : buildingSection;

    const installments = initialDownUSD > 0 && status !== 'available' ? [
      {
        id: `inst_${Date.now()}`,
        installmentNumber: 1,
        date: contractDate,
        dueDate: contractDate,
        amount: initialDownUSD,
        paidAmount: initialDownUSD,
        remainingAmount: 0,
        currency: 'USD',
        status: 'Paid' as const,
        paymentHistory: [{
          id: `payhist_${Date.now()}`,
          paymentNumber: 1,
          amount: initialDownUSD,
          currency: 'USD',
          date: contractDate,
          notes: tx(`Initial purchase down payment (${currency === 'AFN' ? `${formatNumber(initialDown)} AFN` : `$${formatNumber(initialDown)}`})`, `پیش‌پرداخت اولیهٔ خرید (${currency === 'AFN' ? `${formatNumber(initialDown)} AFN` : `$${formatNumber(initialDown)}`})`, `د پېرلو لومړنۍ مخکېنۍ ورکړه (${currency === 'AFN' ? `${formatNumber(initialDown)} AFN` : `$${formatNumber(initialDown)}`})`),
        }],
        received: true,
        receivedDate: contractDate,
        notes: tx(`Initial purchase down payment (${currency === 'AFN' ? `${formatNumber(initialDown)} AFN` : `$${formatNumber(initialDown)}`})`, `پیش‌پرداخت اولیهٔ خرید (${currency === 'AFN' ? `${formatNumber(initialDown)} AFN` : `$${formatNumber(initialDown)}`})`, `د پېرلو لومړنۍ مخکېنۍ ورکړه (${currency === 'AFN' ? `${formatNumber(initialDown)} AFN` : `$${formatNumber(initialDown)}`})`),
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
      <div className="bg-surface rounded-t-3xl sm:rounded-3xl safe-bottom-only shadow-2xl max-w-xl w-full max-h-[92dvh] flex flex-col overflow-hidden border border-line my-0 sm:my-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">{tx('Register apartment / sale', 'ثبت آپارتمان / فروش', 'اپارتمان ثبت / پلور')}</h3>
              <p className="text-[11px] text-slate-400">{currentProject.name}</p>
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

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs max-h-[80dvh] overflow-y-auto">

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-bold">{formError}</span>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-line space-y-3">
            <div className="font-bold text-ink text-xs flex items-center gap-1.5 border-b border-slate-200/80 dark:border-slate-700 pb-2">
              <Building className="w-4 h-4 text-amber-600" />
              <span>{tx('Unit details', 'مشخصات ساختمانی واحد', 'د واحد معلومات')}</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {tx('Unit number', 'شمارهٔ واحد', 'د واحد شمېره')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={tx('e.g. 301 or A-4', 'مثال: ۳۰۱ یا A-4', 'لکه: ۳۰۱ یا A-4')}
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-mono font-bold text-ink focus:ring-2 focus:ring-amber-500/20 text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {tx('Floor', 'منزل', 'پوړ')} <span className="text-rose-500">*</span>
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
                  {tx('Area (m²)', 'مساحت (m²)', 'مساحت (m²)')} <span className="text-rose-500">*</span>
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
                  {tx('Orientation / section', 'جهت / موقعیت واحد', 'لوری / برخه')}
                </label>
                <select
                  value={buildingSection}
                  onChange={(e) => setBuildingSection(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-xs font-semibold text-ink"
                >
                  {SECTION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{localizeText(language, { en: opt.en, fa: opt.fa, ps: opt.ps })}</option>
                  ))}
                  <option value="custom">{tx('Other (custom)', 'موقعیت دیگر (دلخواه)', 'بل (ځانګړی)')}</option>
                </select>
                {buildingSection === 'custom' && (
                  <input
                    type="text"
                    placeholder={tx('Custom section...', 'موقعیت دلخواه...', 'ځانګړې برخه...')}
                    value={customSection}
                    onChange={(e) => setCustomSection(e.target.value)}
                    className="w-full mt-1.5 px-3 py-1.5 border border-amber-300 rounded-lg text-xs"
                  />
                )}
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {tx('Unit type', 'نوعیت کاربری', 'د واحد ډول')}
                </label>
                <select
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value as UnitType)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-xs font-semibold text-ink"
                >
                  <option value="apartment">{tx('Apartment', 'آپارتمان رهایشی', 'استوګنیز اپارتمان')}</option>
                  <option value="penthouse">{tx('Penthouse (top floor)', 'پنت‌هاوس (طبقهٔ آخر)', 'پېنټ‌هاوس (وروستی پوړ)')}</option>
                  <option value="shop">{tx('Retail shop', 'دکان تجارتی', 'سوداګریز دوکان')}</option>
                  <option value="office">{tx('Office', 'دفتر کار', 'دفتر')}</option>
                  <option value="parking">{tx('Private parking', 'پارکینگ اختصاصی', 'ځانګړی پارکینګ')}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-line space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700 pb-2">
              <span className="font-bold text-ink text-xs">{tx('Sale status and pricing', 'وضعیت فروش و قیمت‌گذاری', 'د پلور حالت او بیه ټاکل')}</span>
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
                    {st === 'sold' ? tx('Sold', 'فروخته شد', 'پلورل شوی') : st === 'reserved' ? tx('Reserved', 'رزرو', 'ساتل شوی') : tx('Available', 'آزاد', 'شته')}
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
              label={tx('Total sale price', 'قیمت کل فروش واحد', 'د پلور ټولیزه بیه')}
              required={true}
              placeholder="75000"
            />

            <div className="flex justify-between items-center text-[11px] px-2 text-slate-600 dark:text-slate-400">
              <span>{tx('Price per square metre:', 'قیمت هر متر مربع:', 'د هر مربع متر بیه:')}</span>
              <span className="font-mono font-bold text-ink">
                ${formatNumber(finalPricePerM2USD)} / m²
              </span>
            </div>
          </div>

          {(status === 'sold' || status === 'reserved') && (
            <div className="bg-amber-50/60 dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-200/90 dark:border-amber-800 space-y-3 animate-in fade-in">
              <div className="font-bold text-ink text-xs flex items-center gap-1.5 border-b border-amber-200 dark:border-amber-800 pb-2">
                <User className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span>{tx('Buyer details and down payment', 'مشخصات خریدار و پیش‌پرداخت', 'د پېرودونکي معلومات او مخکېنۍ ورکړه')}</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {tx('Buyer name', 'نام و تخلص خریدار', 'د پېرودونکي نوم')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={tx('e.g. Ahmad Khan', 'مثال: حاجی عبدالهادی', 'لکه: احمد خان')}
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-bold text-ink text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {tx('Buyer phone', 'شماره تماس خریدار', 'د پېرودونکي ټیلیفون')}
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
                    {tx('Buyer ID number', 'شماره تذکره خریدار', 'د پېرودونکي د تذکرې شمېره')}
                  </label>
                  <input
                    type="text"
                    placeholder={tx('Book/page or electronic ID', 'جلد و صفحه یا تذکرهٔ الکترونیکی', 'د تذکرې کتاب او پاڼه یا برېښنايي تذکره')}
                    value={buyerTazkira}
                    onChange={(e) => setBuyerTazkira(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-xs text-ink"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {tx('Contract date', 'تاریخ عقد قرارداد', 'د تړون نېټه')}
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
                  {tx(`Down payment received (${currency})`, `پیش‌پرداخت دریافت‌شده (${currency === 'USD' ? 'دالر $' : 'افغانی'})`, `ترلاسه شوې مخکېنۍ ورکړه (${currency})`) }
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
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Notes', 'یادداشت', 'یادښتونه')}</label>
            <textarea
              rows={2}
              placeholder={tx('Contract or installment notes...', 'توضیحات قرارداد یا شیوهٔ پرداخت اقساط...', 'د تړون یا قسطونو په اړه یادښتونه...')}
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
              <span>{tx('Cancel', 'لغو', 'لغوه کول')}</span>
              <span className="hidden sm:inline-block text-[10px] text-slate-400 ms-1">(Esc)</span>
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 text-amber-400 dark:text-white font-black rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? tx('Saving...', 'در حال ثبت...', 'ثبتېږي...') : (status === 'available' ? tx('Register unit', 'ثبت واحد جدید', 'واحد ثبت کړئ') : tx('Record sale', 'ثبت فروش واحد', 'پلور ثبت کړئ'))}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
