import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
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
  'سیخ‌گول (Steel Rebar)',
  'سمنت (Cement)',
  'کانکریت آماده (Ready Mix Concrete)',
  'ریگ شسته (Washed Sand)',
  'جغله (Gravel)',
  'خشت پخته (Red Brick)',
  'بلاک کانکریتی (Concrete Block)',
  'پلی‌وود / تخته (Plywood)',
  'سیم سیاه (Tie Wire)',
  'رنگ و پلاستیک (Paint)',
  'گچ کاری (Gypsum / Plaster)',
  'پایپ برق (Electrical Pipe)',
  'پایپ پی‌وی‌سی (PVC Pipe)',
  'کرایه باربری (Truck Fare)',
  'کرین / بالابر (Crane / Mixer)',
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, defaultCategory }) => {
  const { currentProject, addExpense, expenses, suppliers, t, openCameraForCapture, language } = useApp();
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
  const conversionResult = calculateUnitConversion(numQuantity, unit);

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

  const getCategoryLabel = (cat: typeof COMMON_CATEGORIES[0]) => {
    if (language === 'ps') return cat.labelPs;
    if (language === 'fa') return cat.labelFa;
    return cat.labelEn;
  };

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
      setFormError('مبلغ مصرف باید بزرگتر از صفر باشد.');
      return;
    }
    if (rawPaid < 0) {
      setFormError('مبلغ پرداختی نامعتبر است.');
      return;
    }
    if (rawPaid > parsedAmount) {
      setFormError('مبلغ پرداختی نمی‌تواند بیشتر از کل فاکتور باشد.');
      return;
    }
    if (!date || isNaN(new Date(date).getTime())) {
      setFormError('تاریخ نامعتبر است.');
      return;
    }

    if (billNumber.trim()) {
      const isDuplicate = expenses.some(
        exp => exp.projectId === currentProject.id && 
               exp.billNumber && 
               exp.billNumber.trim().toLowerCase() === billNumber.trim().toLowerCase()
      );
      if (isDuplicate) {
        setFormError(`فاکتور با شماره "${billNumber.trim()}" قبلاً در این پروژه ثبت شده است.`);
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
      <div className="bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-full sm:max-w-2xl max-h-[94vh] flex flex-col overflow-hidden border border-line my-0 sm:my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">{t.addExpense} / ثبت خرید و مصرف</h3>
              <p className="text-[10px] text-slate-400">{currentProject.name}</p>
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
                <span>مشخصات جنس و واحد (Item & Unit)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">سیخ، سمنت، چوب، ریگ و...</span>
            </div>

            {/* Item Name Input */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                نام جنس یا خدمت خریداری‌شده <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثلاً: ۱۰ تن سیخ ۱۶، ۵۰۰ بوجی سمنت، ۱۰۰ موتر خاک..."
                value={item}
                onChange={(e) => setItem(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-bold text-ink focus:ring-2 focus:ring-amber-500/20"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {QUICK_ITEM_SUGGESTIONS.slice(0, 5).map((sugg) => (
                  <button
                    key={sugg}
                    type="button"
                    onClick={() => {
                      setItem(sugg.split(' ')[0]);
                      if (sugg.includes('Steel') || sugg.includes('سیخ')) setUnit('Ton');
                      if (sugg.includes('Cement') || sugg.includes('سمنت')) setUnit('bag');
                      if (sugg.includes('Concrete') || sugg.includes('کانکریت')) setUnit('m3');
                    }}
                    className="px-2 py-0.5 rounded-lg bg-surface border border-line hover:border-amber-400 text-slate-600 dark:text-slate-300 text-[10px] transition-colors"
                  >
                    + {sugg.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity, Unit & Unit Price Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مقدار (Quantity)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="مثال: 10 یا 500"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-mono font-bold text-ink focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  واحد شمارش (Unit)
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500/20"
                >
                  {AVAILABLE_UNITS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nameFa} {u.symbol ? `(${u.symbol})` : ''}
                    </option>
                  ))}
                </select>
                {unit === 'other' && (
                  <input
                    type="text"
                    placeholder="واحد دلخواه..."
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    className="mt-1.5 w-full px-3 py-1.5 border border-amber-300 dark:border-amber-600 rounded-xl text-xs bg-surface text-ink font-bold"
                  />
                )}
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  قیمت فی واحد (Unit Price)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="فی واحد"
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
                  <span>تبدیل خودکار استاندارد:</span>
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
            label="مجموع کل فاکتور (تعداد × قیمت فی واحد)"
            required={true}
            placeholder="0"
          />

          {/* Date, Time & Invoice / Bill Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                <span>{t.time || 'ساعت'}</span>
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
                {t.billNumber || 'شماره فاکتور / بل'}
              </label>
              <input
                type="text"
                placeholder="بل نمبر #401"
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
                <span>طرف حساب / فروشنده (Supplier)</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomParty(!isCustomParty)}
                className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800"
              >
                {isCustomParty ? 'انتخاب از لیست' : '+ فروشنده جدید'}
              </button>
            </div>

            {isCustomParty || projectSuppliers.length === 0 ? (
              <input
                type="text"
                placeholder="نام فروشنده یا شرکت..."
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
                <option value="">-- انتخاب فروشنده ({projectSuppliers.length}) --</option>
                {projectSuppliers.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.materialsSupplied || 'تأمین‌کننده'})
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
                  دسته‌بندی مصارف
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800"
                >
                  {isCustomCategory ? 'انتخاب از لیست' : '+ دسته جدید'}
                </button>
              </div>

              {isCustomCategory ? (
                <input
                  type="text"
                  placeholder="نام دسته دلخواه..."
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
                توضیحات و شرح خرید
              </label>
              <input
                type="text"
                placeholder="توضیحات فاکتور..."
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
                وضعیت تسویه فاکتور با فروشنده
              </label>
              <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold">
                پیش‌فرض: خرید قرضی (باقی‌داری کامل)
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
                قرضداری کامل
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
                نقدی کامل
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
                مقداری نقدی و باقیمانده قرض
              </button>
            </div>

            {settlementMode !== 'credit' && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    مبلغ نقدی پرداخت‌شده ({currency === 'USD' ? '$' : 'افغانی'})
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
                    روش پرداخت
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="Cash">نقد (Cash)</option>
                    <option value="Bank">انتقال بانکی (Bank)</option>
                    <option value="Hawala">صرافی / حواله (Sarafi)</option>
                    <option value="Personal">حساب شخصی</option>
                  </select>
                </div>
              </div>
            )}

            <div className="pt-1 flex items-center justify-between text-xs font-medium">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-slate-400" />
                <span>باقی‌داری قرض:</span>
              </span>
              <span className={`font-mono font-bold ${remainingDebtUSD > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                ${remainingDebtUSD.toLocaleString()} {remainingDebtUSD > 0 && `(${(remainingDebtUSD * exchangeRate).toLocaleString()} افغانی)`}
              </span>
            </div>
          </div>

          {/* Section 5: Receipt Image Upload & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>عکس فاکتور / بل فیزیکی</span>
                {documentUrl && (
                  <button
                    type="button"
                    onClick={() => setDocumentUrl('')}
                    className="text-[10px] text-rose-600 font-bold hover:underline"
                  >
                    حذف عکس
                  </button>
                )}
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer flex items-center justify-center space-x-1.5 rtl:space-x-reverse px-3 py-2 border border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-xl bg-surface-2 transition-colors text-xs text-slate-600 dark:text-slate-300 font-bold">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>{documentUrl ? 'عکس انتخاب شد' : 'انتخاب فایل از دستگاه'}</span>
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
                    title: `بل خرید: ${item || category}`,
                    amount: parsedAmount || undefined,
                  })}
                  className="px-3 py-2 bg-surface-2 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center gap-1 text-xs"
                  title="کمره زنده"
                >
                  <Camera className="w-4 h-4 text-amber-600" />
                  <span className="hidden sm:inline">کمره</span>
                </button>
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.notes}
              </label>
              <input
                type="text"
                placeholder="توضیحات و شرایط..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Actions & Submit */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-t border-line">
            <div className="text-[11px] text-ink-muted font-medium">
              وضعیت در سیستم: <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{settlementMode === 'credit' ? 'قرضداری کامل' : settlementMode === 'installment' ? 'پرداخت قسمی' : 'تسویه شده'}</span>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse w-full sm:w-auto">
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
                className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 text-amber-400 dark:text-white font-black rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? t.loading : 'ثبت فاکتور در سیستم'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
