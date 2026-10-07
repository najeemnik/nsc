import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, X, Plus, Trash2, Receipt, ArrowRight, Check, AlertCircle, Users, Coins, PieChart } from 'lucide-react';
import { GeneralExpenseItem, ProjectPartner } from '../../types';

interface InitialPartnerRow {
  id: string;
  name: string;
  phone: string;
  initialInvestment: number | '';
  currency: 'AFN' | 'USD';
  sharePercentage: number | '';
  notes: string;
}

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose }) => {
  const { projects, addProject, t } = useApp();
  const [activeStep, setActiveStep] = useState<'info' | 'expenses' | 'partners'>('info');

  // Basic Information
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('کابل');
  const [floors, setFloors] = useState('8');
  const [units, setUnits] = useState('32');
  const [buildingArea, setBuildingArea] = useState('4500');
  const [landInfo, setLandInfo] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'AFN'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(70);
  const [projectImage, setProjectImage] = useState<string>('https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800&auto=format&fit=crop&q=80');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Optional Initial Partners & Capital
  const [initialPartners, setInitialPartners] = useState<InitialPartnerRow[]>([
    { id: '1', name: '', phone: '', initialInvestment: '', currency: 'AFN', sharePercentage: '', notes: '' },
  ]);

  const handleAddPartnerRow = () => {
    setInitialPartners(prev => [
      ...prev,
      {
        id: `row-${Date.now()}`,
        name: '',
        phone: '',
        initialInvestment: '',
        currency: 'AFN',
        sharePercentage: '',
        notes: '',
      }
    ]);
  };

  const handleRemovePartnerRow = (id: string) => {
    setInitialPartners(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdatePartnerRow = (id: string, field: keyof InitialPartnerRow, value: any) => {
    setInitialPartners(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setProjectImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // General Expenses for this project
  const [generalExpenses, setGeneralExpenses] = useState<GeneralExpenseItem[]>([
    { id: '1', title: 'خاکبرداری و کرایه موتر (حمل آوار)', amount: 0, currency: 'USD', notes: '' },
    { id: '2', title: 'تعرفه ناحیه و شاروالی (جواز اعمار)', amount: 0, currency: 'USD', notes: '' },
    { id: '3', title: 'نان، غذا و مصارف کارگران', amount: 0, currency: 'USD', notes: '' },
  ]);

  if (!isOpen) return null;

  const handleAddGeneralExpenseRow = () => {
    setGeneralExpenses(prev => [
      ...prev,
      {
        id: `gen-${Date.now()}`,
        title: '',
        amount: 0,
        currency,
        notes: '',
      }
    ]);
  };

  const handleRemoveExpenseRow = (id: string) => {
    setGeneralExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleUpdateExpenseRow = (id: string, field: keyof GeneralExpenseItem, value: any) => {
    setGeneralExpenses(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('نام پروژه ساختمانی الزامی است.');
      setActiveStep('info');
      return;
    }

    const isDuplicate = projects.some(p => p.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (isDuplicate) {
      setFormError(`پروژه‌ای با نام "${name.trim()}" قبلاً ثبت شده است.`);
      setActiveStep('info');
      return;
    }

    const parsedFloors = parseInt(floors);
    if (isNaN(parsedFloors) || parsedFloors <= 0) {
      setFormError('تعداد منازل باید عددی معتبر و بزرگتر از صفر باشد.');
      setActiveStep('info');
      return;
    }

    if (isNaN(exchangeRate) || exchangeRate <= 0) {
      setFormError('نرخ تبدیل اسعار باید عددی بزرگتر از صفر باشد.');
      setActiveStep('info');
      return;
    }

    setIsSubmitting(true);

    const validExpenses = generalExpenses
      .filter(item => item.title.trim() && item.amount > 0)
      .map(item => ({
        ...item,
        exchangeRate,
        equivalentAmount: item.currency === 'USD' 
          ? Math.round(item.amount * exchangeRate) 
          : (exchangeRate > 0 ? parseFloat((item.amount / exchangeRate).toFixed(2)) : item.amount),
      }));

    const validPartners: ProjectPartner[] = initialPartners
      .filter(p => p.name.trim() || (typeof p.initialInvestment === 'number' && p.initialInvestment > 0) || (typeof p.sharePercentage === 'number' && p.sharePercentage > 0))
      .map(p => ({
        id: `part-init-${Date.now()}-${p.id}`,
        projectId: '',
        name: p.name.trim() || 'شریک',
        phone: p.phone.trim() || undefined,
        initialInvestment: typeof p.initialInvestment === 'number' ? p.initialInvestment : undefined,
        sharePercentage: typeof p.sharePercentage === 'number' ? p.sharePercentage : undefined,
        currency: p.currency,
        investmentDate: new Date().toISOString().split('T')[0],
        notes: p.notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      }));

    addProject({
      name: name.trim(),
      code: code.trim() || `PRJ-${Date.now().toString().slice(-4)}`,
      address: address.trim() || 'کابل',
      city: city.trim() || 'کابل',
      floors: parsedFloors,
      units: parseInt(units) || 1,
      buildingArea: parseFloat(buildingArea) || 100,
      clientOwner: 'صاحب پروژه',
      startDate: new Date().toISOString().split('T')[0],
      expectedCompletionDate: new Date(Date.now() + 365*24*3600*1000).toISOString().split('T')[0],
      projectImage: projectImage || 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800&auto=format&fit=crop&q=80',
      landInfo: landInfo.trim() || 'زمین ملکیت پروژه',
      description: 'پروژه ساختمانی جدید',
      status: 'in_construction',
      currency,
      defaultExchangeRate: exchangeRate,
      initialGeneralExpenses: validExpenses,
      partners: validPartners,
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-surface rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-line my-auto animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-slate-900 text-white">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">{t.newProject || 'ثبت پروژه ساختمانی جدید'}</h3>
              <p className="text-[11px] text-slate-400">مشخصات تعمیر، مصارف ابتدایی و شرکا</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step tabs */}
        <div className="flex border-b border-line bg-slate-50 dark:bg-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveStep('info')}
            className={`flex-1 py-3 px-4 text-center font-bold border-b-2 transition-all ${
              activeStep === 'info'
                ? 'border-amber-500 text-amber-800 dark:text-amber-300 bg-surface'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            مشخصات تعمیر
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('expenses')}
            className={`flex-1 py-3 px-4 text-center font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeStep === 'expenses'
                ? 'border-amber-500 text-amber-800 dark:text-amber-300 bg-surface'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-amber-600" />
            <span>مصارف عمومی اولیه</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('partners')}
            className={`flex-1 py-3 px-4 text-center font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeStep === 'partners'
                ? 'border-amber-500 text-amber-800 dark:text-amber-300 bg-surface'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-600" />
            <span>شرکا (اختیاری)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 text-xs max-h-[75dvh] overflow-y-auto">
          
          {/* Error Banner */}
          {formError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-bold">{formError}</span>
            </div>
          )}
          
          {/* STEP 1: Basic Information */}
          {activeStep === 'info' && (
            <div className="space-y-3.5 animate-in fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t.projectName || 'نام پروژه / ساختمان'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="مثال: کابل پلازا"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-bold text-ink focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t.projectCode || 'کد اختصاصی'}
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: KP-18"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t.city || 'شهر / ولایت'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="کابل / هرات / مزار"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t.address || 'آدرس و ناحیه'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: شهر نو، چهارراهی انصاری"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t.floors || 'تعداد منازل'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={floors}
                    onChange={(e) => setFloors(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-mono font-bold text-ink focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t.units || 'تعداد واحدها'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-mono font-bold text-ink focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    مساحت زیربنا (m²)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={buildingArea}
                    onChange={(e) => setBuildingArea(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-mono focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Currency & Exchange Rate Default */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-line rounded-2xl space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">واحد اسعار پیش‌فرض پروژه:</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">اسعار پایه حسابداری</label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setCurrency('USD')}
                        className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                          currency === 'USD' ? 'bg-amber-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        دالر ($)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrency('AFN')}
                        className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                          currency === 'AFN' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        افغانی (AFN)
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">نرخ برابری (۱ دالر به افغانی)</label>
                    <input
                      type="number"
                      step="any"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 70)}
                      className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-surface text-ink font-mono font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">{t.landInfo || 'مشخصات زمین'}</label>
                <input
                  type="text"
                  placeholder="سند شرعی قباله، متراژ زمین..."
                  value={landInfo}
                  onChange={(e) => setLandInfo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveStep('expenses')}
                  className="px-5 py-2.5 bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 text-amber-400 dark:text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <span>مرحله بعدی (مصارف اولیه)</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: General Expenses Form */}
          {activeStep === 'expenses' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-3 text-amber-900 dark:text-amber-200 leading-relaxed">
                <p className="font-bold mb-1">مصارف عمومی اولیه پروژه:</p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  می‌توانید کرایه موتر، خاکبرداری، فیس شاروالی یا نان و غذا را به دالر یا افغانی با نرخ صرافی وارد کنید.
                </p>
              </div>

              <div className="space-y-3">
                {generalExpenses.map((expense, idx) => (
                  <div key={expense.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-line space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span>شرح مصرف:</span>
                      </span>
                      {generalExpenses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveExpenseRow(expense.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="عنوان مصرف (مثلاً کرایه موتر خاکبرداری...)"
                      value={expense.title}
                      onChange={(e) => handleUpdateExpenseRow(expense.id, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-bold text-ink text-xs"
                    />

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">مبلغ</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            placeholder="0"
                            value={expense.amount || ''}
                            onChange={(e) => handleUpdateExpenseRow(expense.id, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-full ps-3 pe-12 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-mono font-bold text-xs text-ink"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateExpenseRow(expense.id, 'currency', expense.currency === 'USD' ? 'AFN' : 'USD')}
                            className="absolute end-1.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-black bg-surface-2 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border"
                          >
                            {expense.currency === 'USD' ? 'دالر ($)' : 'افغانی'}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">یادداشت</label>
                        <input
                          type="text"
                          placeholder="توضیح اختیاری..."
                          value={expense.notes || ''}
                          onChange={(e) => handleUpdateExpenseRow(expense.id, 'notes', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-xs text-ink"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddGeneralExpenseRow}
                className="w-full py-2.5 border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 rounded-2xl font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4 text-amber-700" />
                <span>+ افزودن ردیف مصرف دیگر</span>
              </button>

              <div className="pt-3 border-t border-line flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep('info')}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  بازگشت
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep('partners')}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <span>مرحله شرکا (اختیاری)</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>ثبت نهایی پروژه</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Initial Partners & Investment */}
          {activeStep === 'partners' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-start gap-2.5">
                <Users className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-xs text-amber-900 dark:text-amber-200">
                    تعریف اختیاری شرکای پروژه و سهم سرمایه:
                  </h4>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    در صورتی که پروژه شریک یا سهامدار دارد، می‌توانید نام و درصد سهم و سرمایه‌گذاری را همین حالا یا بعداً در داشبورد ثبت کنید.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {initialPartners.map((partner, index) => (
                  <div key={partner.id} className="p-3 bg-white dark:bg-slate-800 border border-line rounded-2xl space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-600" />
                        <span>شریک #{index + 1}</span>
                      </span>
                      {initialPartners.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePartnerRow(partner.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">نام شریک (اختیاری)</label>
                        <input
                          type="text"
                          placeholder="مثلاً: حاجی ظاهر"
                          value={partner.name}
                          onChange={(e) => handleUpdatePartnerRow(partner.id, 'name', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-xs font-bold text-ink"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">شماره تماس</label>
                        <input
                          type="text"
                          placeholder="مثال: 0799123456"
                          value={partner.phone}
                          onChange={(e) => handleUpdatePartnerRow(partner.id, 'phone', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-xs font-mono text-ink"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">مبلغ سرمایه اولیه</label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="مثال: 100000"
                            value={partner.initialInvestment}
                            onChange={(e) => handleUpdatePartnerRow(partner.id, 'initialInvestment', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-xs font-mono font-bold text-ink"
                          />
                          <select
                            value={partner.currency}
                            onChange={(e) => handleUpdatePartnerRow(partner.id, 'currency', e.target.value)}
                            className="border border-slate-300 dark:border-slate-700 rounded-xl bg-surface-2 text-[10px] font-bold px-1.5 text-ink"
                          >
                            <option value="AFN">AFN</option>
                            <option value="USD">USD</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">درصد سهم (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          placeholder="مثلاً: 50"
                          value={partner.sharePercentage}
                          onChange={(e) => handleUpdatePartnerRow(partner.id, 'sharePercentage', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-xs font-mono font-bold text-ink"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddPartnerRow}
                className="w-full py-2.5 border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 rounded-2xl font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4 text-amber-700" />
                <span>+ افزودن شریک دیگر</span>
              </button>

              <div className="pt-3 border-t border-line flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep('expenses')}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  بازگشت
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 font-bold"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 text-amber-400 dark:text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmitting ? 'در حال ثبت...' : 'تایید و ثبت نهایی پروژه'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};
