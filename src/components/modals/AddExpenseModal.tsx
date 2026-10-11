import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { localizeText } from '../../i18n/localize';
import { Receipt, X, Camera, Clock, Calendar, PlusCircle, Check, Banknote, AlertCircle, ArrowRightLeft, Package, UserCheck, Upload, Building2 } from 'lucide-react';
import { CurrencyAmountInput } from '../CurrencyAmountInput';
import { AVAILABLE_UNITS, calculateUnitConversion } from '../../utils/unitConversion';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: string;
}

const COMMON_CATEGORIES = [
  { id: 'scaffolding', labelFa: 'اسکافولد و داربست (کرایه و بستن)', labelPs: 'پایپ او داربست', labelEn: 'Scaffolding (Rental & Fix)' },
  { id: 'formwork', labelFa: 'قالب‌بندی و نجاری (تخته و چوب)', labelPs: 'قالب بندي او تختې', labelEn: 'Formwork & Carpentry' },
  { id: 'wood_supplier', labelFa: 'فروشنده چوب، پلی‌وود و تخت', labelPs: 'د لرګیو پلورونکی', labelEn: 'Plywood & Wood Supplier' },
  { id: 'tie_wire', labelFa: 'سیم نجاری و سیخ‌بندی (سیم سیاه)', labelPs: 'د سیخ تړلو سیم', labelEn: 'Tie Wire & Steel Fixer' },
  { id: 'electrical', labelFa: 'برق‌کاری و تأسیسات برقی', labelPs: 'د برېښنا کارونه', labelEn: 'Electrical Works' },
  { id: 'steel', labelFa: 'سیخ‌گول (فولاد)', labelPs: 'سیخ ګول', labelEn: 'Steel / Rebar' },
  { id: 'concrete', labelFa: 'کانکریت و پمپ', labelPs: 'کانکریت او پمپ', labelEn: 'Concrete & Pump' },
  { id: 'materials', labelFa: 'مصالح ساختمانی (سمنت، خشت، ریگ)', labelPs: 'ودانیز توکي (سمنټ، شګه)', labelEn: 'Building Materials' },
  { id: 'transport', labelFa: 'کرایه موتر و ترانسپورت', labelPs: 'ترانسپورت او کرایه', labelEn: 'Transportation & Fares' },
  { id: 'municipality', labelFa: 'تعرفه ناحیه و شاروالی', labelPs: 'د ناحیې فیس', labelEn: 'District / Municipality Fee' },
  { id: 'worker_food', labelFa: 'نان و غذای کارگران', labelPs: 'د مزدورانو ډوډۍ', labelEn: 'Worker Meals & Food' },
  { id: 'daily_labour', labelFa: 'مزد کارگران روزمزد', labelPs: 'د ورځې مزدور مزدوري', labelEn: 'Daily Labour Wages' },
  { id: 'miscellaneous', labelFa: 'مصارف متفرقه و پیش‌بینی‌نشده', labelPs: 'متفرقه لګښتونه', labelEn: 'Miscellaneous Expenses' },
];

const QUICK_ITEM_SUGGESTIONS = [
  { en: 'Rebar', fa: 'سیخ‌گول', ps: 'سیخ‌ګول', unit: 'Ton' },
  { en: 'Cement', fa: 'سمنت', ps: 'سمنټ', unit: 'bag' },
  { en: 'Ready-mix concrete', fa: 'کانکریت آماده', ps: 'چمتو کانکریټ', unit: 'm3' },
  { en: 'Washed sand', fa: 'ریگ شسته', ps: 'مینځل شوې شګه', unit: 'truck' },
  { en: 'Gravel', fa: 'جغله', ps: 'جغل', unit: 'truck' },
  { en: 'Red brick', fa: 'خشت پخته', ps: 'سورې خښته', unit: 'piece' },
  { en: 'Concrete block', fa: 'بلاک کانکریتی', ps: 'کانکریټي بلاک', unit: 'piece' },
  { en: 'Plywood', fa: 'پلی‌وود / تخته', ps: 'پلای‌وډ / تخته', unit: 'piece' },
  { en: 'Tie wire', fa: 'سیم سیاه', ps: 'تور تړونکی سیم', unit: 'kg' },
  { en: 'Paint', fa: 'رنگ و پلاستیک', ps: 'رنګ', unit: 'other' },
  { en: 'Gypsum / plaster', fa: 'گچ کاری', ps: 'ګچ‌کاري', unit: 'bag' },
  { en: 'Electrical conduit', fa: 'پایپ برق', ps: 'برېښنايي پایپ', unit: 'meter' },
  { en: 'PVC pipe', fa: 'پایپ پی‌وی‌سی', ps: 'PVC پایپ', unit: 'meter' },
  { en: 'Truck transport', fa: 'کرایه باربری', ps: 'د لارۍ کرایه', unit: 'truck' },
  { en: 'Crane / hoist', fa: 'کرین / بالابر', ps: 'کرېن / پورته‌کوونکی', unit: 'other' },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, defaultCategory }) => {
  const { currentProject, addExpense, expenses, suppliers, t, openCameraForCapture, language } = useApp();
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [category, setCategory] = useState<string>(defaultCategory || COMMON_CATEGORIES[0].id);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryText, setCustomCategoryText] = useState('');

  const [item, setItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Ton');
  const [customUnit, setCustomUnit] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'AFN'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(currentProject?.defaultExchangeRate || 70);

  const [settlementMode, setSettlementMode] = useState<'credit' | 'cash' | 'installment'>('credit');
  const [paidAmountInput, setPaidAmountInput] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank' | 'Hawala' | 'Personal'>('Cash');
  const [partyName, setPartyName] = useState('');
  const [isCustomParty, setIsCustomParty] = useState(false);
  const [billNumber, setBillNumber] = useState('');
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const projectSuppliers = (suppliers || []).filter(s => s.projectId === currentProject?.id);

  useEffect(() => {
    if (defaultCategory) {
      setCategory(defaultCategory);
    }
    setFormError(null);
  }, [defaultCategory, isOpen]);

  const handleQuantityChange = (val: string) => {
    setQuantity(val);
    const q = parseFloat(val);
    const p = parseFloat(unitPrice);
    if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
      setAmount((q * p).toFixed(2));
    }
  };

  const handleUnitPriceChange = (val: string) => {
    setUnitPrice(val);
    const p = parseFloat(val);
    const q = parseFloat(quantity);
    if (!isNaN(p) && !isNaN(q) && p > 0 && q > 0) {
      setAmount((q * p).toFixed(2));
    }
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    const a = parseFloat(val);
    const q = parseFloat(quantity);
    if (!isNaN(a) && !isNaN(q) && q > 0) {
      setUnitPrice((a / q).toFixed(2));
    }
  };

  const parsedAmount = parseFloat(amount) || 0;
  const totalAmountUSD = currency === 'USD' 
    ? parsedAmount 
    : (exchangeRate > 0 ? parseFloat((parsedAmount / exchangeRate).toFixed(2)) : parsedAmount);

  useEffect(() => {
    if (settlementMode === 'cash') {
      setPaidAmountInput(amount);
    } else if (settlementMode === 'credit') {
      setPaidAmountInput('0');
    }
  }, [settlementMode, amount]);

  const numQuantity = parseFloat(quantity) || 0;
  const conversionResult = calculateUnitConversion(numQuantity, unit, undefined, language);

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

  if (!isOpen || !currentProject) return null;

  const rawPaid = parseFloat(paidAmountInput) || 0;
  const paidUSD = currency === 'USD' ? rawPaid : (exchangeRate > 0 ? parseFloat((rawPaid / exchangeRate).toFixed(2)) : rawPaid);
  const remainingDebtUSD = Math.max(0, totalAmountUSD - paidUSD);

  const getCategoryLabel = (cat: typeof COMMON_CATEGORIES[0]) => localizeText(language, {
    en: cat.labelEn,
    fa: cat.labelFa,
    ps: cat.labelPs,
  });

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError(tx('Expense amount must be greater than zero.', 'مبلغ مصرف باید بیشتر از صفر باشد.', 'د لګښت اندازه باید تر صفر ډېره وي.'));
      return;
    }
    if (rawPaid < 0) {
      setFormError(tx('Paid amount is invalid.', 'مبلغ پرداختی نامعتبر است.', 'د ورکړې اندازه ناسمه ده.'));
      return;
    }
    if (rawPaid > parsedAmount) {
      setFormError(tx('Paid amount cannot exceed the invoice total.', 'مبلغ پرداختی نمی‌تواند از مجموع فاکتور بیشتر باشد.', 'د ورکړې اندازه د بل له ټولیزې اندازې زیاته کېدای نه شي.'));
      return;
    }
    if (!date || isNaN(new Date(date).getTime())) {
      setFormError(tx('The date is invalid.', 'تاریخ نامعتبر است.', 'نېټه ناسمه ده.'));
      return;
    }

    if (billNumber.trim()) {
      const isDuplicate = expenses.some(
        exp => exp.projectId === currentProject.id && 
               exp.billNumber && 
               exp.billNumber.trim().toLowerCase() === billNumber.trim().toLowerCase()
      );
      if (isDuplicate) {
        setFormError(tx(
          `Invoice ${billNumber.trim()} is already recorded for this project.`,
          `فاکتور شمارهٔ «${billNumber.trim()}» پیش‌تر در این پروژه ثبت شده است.`,
          `د ${billNumber.trim()} شمېرې بل په دې پروژه کې مخکې ثبت شوی دی.`,
        ));
        return;
      }
    }

    setIsSubmitting(true);

    let finalCategory = category;
    if (isCustomCategory && customCategoryText.trim()) {
      finalCategory = customCategoryText.trim();
    } else {
      const match = COMMON_CATEGORIES.find(c => c.id === category || c.labelFa === category || c.labelEn === category);
      if (match) {
        finalCategory = getCategoryLabel(match);
      }
    }

    const finalUnit = unit === 'other' ? (customUnit.trim() || 'other') : unit;
    const finalDescription = description.trim() || (item.trim() ? `${quantity ? `${quantity} ${finalUnit} ` : ''}${item.trim()}` : finalCategory);
    const amountInUSD = totalAmountUSD;
    const amountInAFN = currency === 'AFN' 
      ? parsedAmount 
      : Math.round(parsedAmount * exchangeRate);

    const paymentStatus: 'paid' | 'partial' | 'unpaid' = 
      settlementMode === 'cash' || paidUSD >= amountInUSD 
        ? 'paid' 
        : paidUSD > 0 
        ? 'partial' 
        : 'unpaid';

    addExpense({
      projectId: currentProject.id,
      date,
      time,
      category: finalCategory,
      item: item.trim() || undefined,
      quantity: numQuantity > 0 ? numQuantity : undefined,
      unit: finalUnit,
      unitPrice: parseFloat(unitPrice) || undefined,
      convertedQuantity: conversionResult?.convertedQuantity,
      convertedUnit: conversionResult?.targetUnit,
      description: finalDescription,
      amount: amountInUSD,
      currency,
      exchangeRate,
      amountInUSD,
      amountInAFN,
      paymentMethod,
      partyName: partyName.trim() || undefined,
      billNumber: billNumber.trim() || undefined,
      paymentStatus,
      paidAmount: paidUSD,
      remainingAmount: remainingDebtUSD,
      documentUrl: documentUrl || undefined,
      notes: notes.trim() || undefined,
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/75 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-surface rounded-t-3xl sm:rounded-3xl safe-bottom-only shadow-2xl w-full max-w-full sm:max-w-2xl max-h-[94dvh] flex flex-col overflow-hidden border border-line my-0 sm:my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">{tx('Record purchase / expense', 'ثبت خرید و مصرف', 'پېرود او لګښت ثبت کړئ')}</h3>
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

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
          
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span className="font-bold">{formError}</span>
            </div>
          )}

          {/* Section 1: Item & Materials & Units */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 space-y-3">
            <div className="font-bold text-ink text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-600" />
                <span>{tx('Item and unit details', 'مشخصات جنس و واحد', 'د توکي او واحد معلومات')}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">{tx('Rebar, cement, timber, sand, and more', 'سیخ‌گول، سمنت، چوب، ریگ و موارد دیگر', 'سیخ‌ګول، سمنټ، لرګي، شګه او نور')}</span>
            </div>

            {/* Item Name Input */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {tx('Purchased item or service', 'نام جنس یا خدمت خریداری‌شده', 'د پېرل شوي توکي یا خدمت نوم')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={tx('e.g. 10 tons of 16 mm rebar, 500 cement bags, 100 truckloads of soil...', 'مثلاً: ۱۰ تن سیخ ۱۶، ۵۰۰ بوجی سمنت، ۱۰۰ موتر خاک...', 'لکه: ۱۰ ټنه ۱۶ ملي‌متر سیخ‌ګول، ۵۰۰ بوجۍ سمنټ، ۱۰۰ لارۍ خاوره...')}
                value={item}
                onChange={(e) => setItem(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-bold text-ink focus:ring-2 focus:ring-amber-500/20"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {QUICK_ITEM_SUGGESTIONS.slice(0, 5).map((sugg) => (
                  <button
                    key={sugg.en}
                    type="button"
                    onClick={() => {
                      setItem(localizeText(language, { en: sugg.en, fa: sugg.fa, ps: sugg.ps }));
                      setUnit(sugg.unit);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-surface border border-line hover:border-amber-400 text-slate-600 dark:text-slate-300 text-[10px] transition-colors"
                  >
                    + {localizeText(language, { en: sugg.en, fa: sugg.fa, ps: sugg.ps })}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity, Unit & Unit Price Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {tx('Quantity', 'مقدار', 'مقدار')}
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder={tx('e.g. 10 or 500', 'مثال: ۱۰ یا ۵۰۰', 'لکه: ۱۰ یا ۵۰۰')}
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-mono font-bold text-ink focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {tx('Unit', 'واحد شمارش', 'واحد')}
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500/20"
                >
                  {AVAILABLE_UNITS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {localizeText(language, { en: u.nameEn, fa: u.nameFa, ps: u.namePs })}
                    </option>
                  ))}
                </select>
                {unit === 'other' && (
                  <input
                    type="text"
                    placeholder={tx('Custom unit...', 'واحد دلخواه...', 'ځانګړی واحد...')}
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    className="mt-1.5 w-full px-3 py-1.5 border border-amber-300 dark:border-amber-600 rounded-xl text-xs bg-surface text-ink font-bold"
                  />
                )}
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {tx('Unit price', 'قیمت فی واحد', 'د هر واحد بیه')}
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder={tx('Price per unit', 'قیمت فی واحد', 'د هر واحد بیه')}
                  value={unitPrice}
                  onChange={(e) => handleUnitPriceChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-mono font-bold text-ink focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {conversionResult && (
              <div className="p-2 rounded-xl bg-amber-100/60 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span>{tx('Automatic standard conversion:', 'تبدیل خودکار استاندارد:', 'اتومات معیاري بدلون:')}</span>
                </span>
                <span className="font-mono font-bold text-amber-800 dark:text-amber-300 bg-surface px-2 py-0.5 rounded shadow-2xs">
                  {conversionResult.explanation}
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Currency & Total Cost Calculation */}
          <CurrencyAmountInput
            amount={amount}
            onChangeAmount={handleAmountChange}
            currency={currency}
            onChangeCurrency={setCurrency}
            exchangeRate={exchangeRate}
            onChangeExchangeRate={setExchangeRate}
            label={tx('Invoice total (quantity × unit price)', 'مجموع کل فاکتور (تعداد × قیمت فی واحد)', 'د بل ټولیز لګښت (مقدار × د واحد بیه)')}
            required={true}
            placeholder="0"
          />

          {/* Date, Time & Invoice / Bill Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{tx('Date', 'تاریخ', 'نېټه')}</span>
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
                <span>{tx('Time', 'ساعت', 'وخت')}</span>
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-canvas focus:bg-white text-xs font-mono text-ink"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {tx('Invoice / bill number', 'شماره فاکتور / بل', 'د بل شمېره')}
              </label>
              <input
                type="text"
                placeholder={tx('e.g. INV-401', 'مثال: INV-401', 'لکه: INV-401')}
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20 font-mono"
              />
            </div>
          </div>

          {/* Section 3: Supplier / Vendor Selection */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>{tx('Supplier / vendor', 'طرف حساب / فروشنده', 'عرضه‌کوونکی / پلورونکی')}</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomParty(!isCustomParty)}
                className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800"
              >
                {isCustomParty ? tx('Choose from list', 'انتخاب از فهرست', 'له لېست څخه وټاکئ') : `+ ${tx('New supplier', 'فروشندهٔ جدید', 'نوی عرضه‌کوونکی')}`}
              </button>
            </div>

            {isCustomParty || projectSuppliers.length === 0 ? (
              <input
                type="text"
                placeholder={tx('Supplier or company name...', 'نام فروشنده یا شرکت...', 'د عرضه‌کوونکي یا شرکت نوم...')}
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className="w-full px-3 py-2 border border-amber-300 dark:border-amber-600 rounded-xl bg-surface font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500/20"
              />
            ) : (
              <select
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">{tx(`-- Choose a supplier (${projectSuppliers.length}) --`, `-- انتخاب فروشنده (${projectSuppliers.length}) --`, `-- عرضه‌کوونکی وټاکئ (${projectSuppliers.length}) --`)}</option>
                {projectSuppliers.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.materialsSupplied || tx('Supplier', 'تأمین‌کننده', 'عرضه‌کوونکی')})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Category & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  {tx('Expense category', 'دسته‌بندی مصارف', 'د لګښت ډول')}
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800"
                >
                  {isCustomCategory ? tx('Choose from list', 'انتخاب از فهرست', 'له لېست څخه وټاکئ') : `+ ${tx('New category', 'دستهٔ جدید', 'نوې ډله')}`}
                </button>
              </div>

              {isCustomCategory ? (
                <input
                  type="text"
                  placeholder={tx('Custom category name...', 'نام دستهٔ دلخواه...', 'د خپلې خوښې ډلې نوم...')}
                  value={customCategoryText}
                  onChange={(e) => setCustomCategoryText(e.target.value)}
                  className="w-full px-3 py-2 border border-amber-400 dark:border-amber-600 rounded-xl bg-amber-50/30 dark:bg-slate-950 text-ink font-bold focus:ring-2 focus:ring-amber-500/20"
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500/20"
                >
                  {COMMON_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {getCategoryLabel(cat)}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {tx('Purchase description', 'توضیحات و شرح خرید', 'د پېرود توضیحات')}
              </label>
              <input
                type="text"
                placeholder={tx('Invoice details...', 'توضیحات فاکتور...', 'د بل جزیات...')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Section 4: Settlement / Payment Mode */}
          <div className="space-y-2 p-3.5 rounded-2xl border border-amber-200/80 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-800/40">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs">
                {tx('Invoice settlement status', 'وضعیت تسویه فاکتور با فروشنده', 'د بل د تصفیې حالت')}
              </label>
              <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold">
                {tx('Default: purchase on credit (full balance due)', 'پیش‌فرض: خرید قرضی (باقی‌داری کامل)', 'ډیفالټ: په پور پېرود (ټول مبلغ پاتې دی)')}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setSettlementMode('credit')}
                className={`py-2 px-2 rounded-xl font-bold text-xs transition-all ${
                  settlementMode === 'credit'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-surface border border-line text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                }`}
              >
                {tx('On credit', 'قرضداری کامل', 'په پور')}
              </button>
              <button
                type="button"
                onClick={() => setSettlementMode('cash')}
                className={`py-2 px-2 rounded-xl font-bold text-xs transition-all ${
                  settlementMode === 'cash'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-surface border border-line text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                }`}
              >
                {tx('Paid in full', 'نقدی کامل', 'بشپړ ورکړل شوی')}
              </button>
              <button
                type="button"
                onClick={() => setSettlementMode('installment')}
                className={`py-2 px-2 rounded-xl font-bold text-xs transition-all ${
                  settlementMode === 'installment'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-surface border border-line text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                }`}
              >
                {tx('Partial payment', 'مقداری نقدی و باقیمانده قرض', 'یوه برخه ورکړل شوې')}
              </button>
            </div>

            {settlementMode !== 'credit' && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {tx(`Amount paid (${currency})`, `مبلغ نقدی پرداخت‌شده (${currency})`, `ورکړل شوې اندازه (${currency})`)}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={paidAmountInput}
                    onChange={(e) => setPaidAmountInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-mono text-emerald-800 dark:text-emerald-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {tx('Payment method', 'روش پرداخت', 'د ورکړې لاره')}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="Cash">{tx('Cash', 'نقد', 'نغدې پیسې')}</option>
                    <option value="Bank">{tx('Bank transfer', 'انتقال بانکی', 'بانکي لېږد')}</option>
                    <option value="Hawala">{tx('Hawala', 'صرافی / حواله', 'حواله')}</option>
                    <option value="Personal">{tx('Personal account', 'حساب شخصی', 'شخصي حساب')}</option>
                  </select>
                </div>
              </div>
            )}

            <div className="pt-1 flex items-center justify-between text-xs font-medium">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-slate-400" />
                <span>{tx('Outstanding balance:', 'باقی‌داری قرض:', 'پاتې پور:')}</span>
              </span>
              <span className={`font-mono font-bold ${remainingDebtUSD > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                ${remainingDebtUSD.toLocaleString()} USD {remainingDebtUSD > 0 && `(${(remainingDebtUSD * exchangeRate).toLocaleString()} AFN)`}
              </span>
            </div>
          </div>

          {/* Section 5: Receipt Image Upload & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>{tx('Invoice / receipt image', 'عکس فاکتور / بل فیزیکی', 'د بل / رسید انځور')}</span>
                {documentUrl && (
                  <button
                    type="button"
                    onClick={() => setDocumentUrl('')}
                    className="text-[10px] text-rose-600 font-bold hover:underline"
                  >
                    {tx('Remove image', 'حذف عکس', 'انځور لرې کړئ')}
                  </button>
                )}
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer flex items-center justify-center space-x-1.5 rtl:space-x-reverse px-3 py-2 border border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-xl bg-surface-2 transition-colors text-xs text-slate-600 dark:text-slate-300 font-bold">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>{documentUrl ? tx('Image selected', 'عکس انتخاب شد', 'انځور وټاکل شو') : tx('Choose a file from device', 'انتخاب فایل از دستگاه', 'له وسیلې څخه فایل وټاکئ')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => openCameraForCapture({
                    title: tx(`Purchase receipt: ${item || category}`, `بل خرید: ${item || category}`, `د پېرود رسید: ${item || category}`),
                    amount: parsedAmount || undefined,
                  })}
                  className="px-3 py-2 bg-surface-2 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center gap-1 text-xs"
                  title={tx('Open camera', 'کمره زنده', 'کمره پرانیزئ')}
                >
                  <Camera className="w-4 h-4 text-amber-600" />
                  <span className="hidden sm:inline">{tx('Camera', 'کمره', 'کمره')}</span>
                </button>
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {tx('Notes', 'یادداشت‌ها', 'یادښتونه')}
              </label>
              <input
                type="text"
                placeholder={tx('Additional notes and terms...', 'توضیحات و شرایط...', 'نور یادښتونه او شرایط...')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Actions & Submit */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-t border-line">
            <div className="text-[11px] text-ink-muted font-medium">
              {tx('Status:', 'وضعیت در سیستم:', 'حالت:')} <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{settlementMode === 'credit' ? tx('On credit', 'قرضداری کامل', 'په پور') : settlementMode === 'installment' ? tx('Partially paid', 'پرداخت قسمی', 'یوه برخه ورکړل شوې') : tx('Paid in full', 'تسویه شده', 'بشپړ ورکړل شوی')}</span>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse w-full sm:w-auto">
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
                className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 text-amber-400 dark:text-white font-black rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? tx('Saving...', 'در حال ثبت...', 'ثبتېږي...') : tx('Save invoice', 'ثبت فاکتور در سیستم', 'بل ثبت کړئ')}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
