import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { localizeText } from '../../i18n/localize';
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

const DEFAULT_GENERAL_EXPENSES = [
  { en: 'Excavation and truck hire (debris removal)', fa: 'خاک‌برداری و کرایهٔ موتر (انتقال نخاله)', ps: 'کیندنه او د موټر کرایه (د کثافاتو لېږد)' },
  { en: 'Municipal fees and building permit', fa: 'فیس ناحیه و شاروالی (جواز اعمار)', ps: 'د ناحیې او ښاروالۍ فیس (د ودانۍ جواز)' },
  { en: 'Meals and food for workers', fa: 'نان، غذا و مصارف کارگران', ps: 'د کارګرانو ډوډۍ او خواړه' },
] as const;

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose }) => {
  const { projects, addProject, t, language } = useApp();
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });
  const [activeStep, setActiveStep] = useState<'info' | 'expenses' | 'partners'>('info');

  // Basic Information
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState(() => tx('Kabul', 'کابل', 'کابل'));
  const [cityEdited, setCityEdited] = useState(false);
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
  const [generalExpenses, setGeneralExpenses] = useState<GeneralExpenseItem[]>(() => DEFAULT_GENERAL_EXPENSES.map((title, index) => ({
    id: String(index + 1),
    title: localizeText(language, title),
    amount: 0,
    currency: 'USD',
    notes: '',
  })));
  const [editedExpenseIds, setEditedExpenseIds] = useState<Set<string>>(() => new Set());

  React.useEffect(() => {
    if (!cityEdited) setCity(tx('Kabul', 'کابل', 'کابل'));
    setGeneralExpenses(current => current.map(expense => {
      const defaultTitle = DEFAULT_GENERAL_EXPENSES[Number(expense.id) - 1];
      if (!defaultTitle || editedExpenseIds.has(expense.id)) return expense;
      const title = localizeText(language, defaultTitle);
      return expense.title === title ? expense : { ...expense, title };
    }));
  }, [language, cityEdited, editedExpenseIds]);

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
    if (field === 'title') setEditedExpenseIds(previous => new Set(previous).add(id));
    setGeneralExpenses(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError(tx('Project name is required.', 'نام پروژهٔ ساختمانی الزامی است.', 'د ودانیزې پروژې نوم اړین دی.')) ;
      setActiveStep('info');
      return;
    }

    const isDuplicate = projects.some(p => p.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (isDuplicate) {
      setFormError(tx(`A project named ${name.trim()} already exists.`, `پروژه‌ای با نام «${name.trim()}» پیش‌تر ثبت شده است.`, `د ${name.trim()} په نوم پروژه مخکې ثبت شوې ده.`));
      setActiveStep('info');
      return;
    }

    const parsedFloors = parseInt(floors);
    if (isNaN(parsedFloors) || parsedFloors <= 0) {
      setFormError(tx('The number of floors must be a valid number greater than zero.', 'تعداد منزل‌ها باید عدد معتبر و بیشتر از صفر باشد.', 'د پوړونو شمېر باید له صفر څخه لوی معتبر عدد وي.'));
      setActiveStep('info');
      return;
    }

    if (isNaN(exchangeRate) || exchangeRate <= 0) {
      setFormError(tx('The exchange rate must be a valid number greater than zero.', 'نرخ تبادله باید عدد معتبر و بیشتر از صفر باشد.', 'د تبادلې نرخ باید له صفر څخه لوی معتبر عدد وي.'));
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
        name: p.name.trim() || tx('Partner', 'شریک', 'شریک'),
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
      address: address.trim() || tx('Kabul', 'کابل', 'کابل'),
      city: city.trim() || tx('Kabul', 'کابل', 'کابل'),
      floors: parsedFloors,
      units: parseInt(units) || 1,
      buildingArea: parseFloat(buildingArea) || 100,
      clientOwner: tx('Project owner', 'صاحب پروژه', 'د پروژې خاوند'),
      startDate: new Date().toISOString().split('T')[0],
      expectedCompletionDate: new Date(Date.now() + 365*24*3600*1000).toISOString().split('T')[0],
      projectImage: projectImage || 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800&auto=format&fit=crop&q=80',
      landInfo: landInfo.trim() || tx('Project-owned land', 'زمین ملکیت پروژه', 'د پروژې ملکیت ځمکه'),
      description: tx('New construction project', 'پروژهٔ ساختمانی جدید', 'نوې ودانیزه پروژه'),
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
              <h3 className="font-extrabold text-sm">{tx('Create a new construction project', 'ثبت پروژهٔ ساختمانی جدید', 'نوې ودانیزه پروژه جوړه کړئ')}</h3>
              <p className="text-[11px] text-slate-400">{tx('Project details, initial costs, and partners', 'مشخصات ساختمان، مصارف ابتدایی و شرکا', 'د ودانۍ معلومات، لومړني لګښتونه او شریکان')}</p>
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
            {tx('Project details', 'مشخصات ساختمان', 'د پروژې معلومات')}
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
            <span>{tx('Initial expenses', 'مصارف عمومی اولیه', 'لومړني لګښتونه')}</span>
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
            <span>{tx('Partners (optional)', 'شرکا (اختیاری)', 'شریکان (اختیاري)')}</span>
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
                    {t.projectName || tx('Project / building name', 'نام پروژه / ساختمان', 'د پروژې / ودانۍ نوم')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder={tx('e.g. Kabul Plaza', 'مثال: کابل پلازا', 'لکه: کابل پلازا')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-bold text-ink focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t.projectCode || tx('Project code', 'کد اختصاصی', 'د پروژې کوډ')}
                  </label>
                  <input
                    type="text"
                    placeholder={tx('e.g. KP-18', 'مثال: KP-18', 'لکه: KP-18')}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t.city || tx('City / province', 'شهر / ولایت', 'ښار / ولایت')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={tx('Kabul / Herat / Mazar', 'کابل / هرات / مزار', 'کابل / هرات / مزار')}
                    value={city}
                    onChange={(e) => { setCity(e.target.value); setCityEdited(true); }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t.address || tx('Address / district', 'آدرس و ناحیه', 'پته / ناحیه')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={tx('e.g. Shahr-e Naw, Ansari crossroads', 'مثال: شهر نو، چهارراهی انصاری', 'لکه: شهر نو، انصاري څلورلارې')}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t.floors || tx('Number of floors', 'تعداد منزل‌ها', 'د پوړونو شمېر')} <span className="text-rose-500">*</span>
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
                    {t.units || tx('Number of units', 'تعداد واحدها', 'د واحدونو شمېر')} <span className="text-rose-500">*</span>
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
                    {tx('Building area (m²)', 'مساحت زیربنا (m²)', 'د ودانۍ مساحت (m²)')}
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
                <span className="font-bold text-slate-800 dark:text-slate-200 block">{tx('Project default currency:', 'واحد پول پیش‌فرض پروژه:', 'د پروژې اصلي پولي واحد:')}</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">{tx('Base accounting currency', 'واحد پول پایهٔ حسابداری', 'د حسابدارۍ بنسټیز پولي واحد')}</label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setCurrency('USD')}
                        className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                          currency === 'USD' ? 'bg-amber-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {tx('US dollar ($)', 'دالر ($)', 'امریکايي ډالر ($)')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrency('AFN')}
                        className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                          currency === 'AFN' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {tx('Afghan afghani (AFN)', 'افغانی (AFN)', 'افغانۍ (AFN)')}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">{tx('Exchange rate (1 USD to AFN)', 'نرخ تبادله (۱ دالر به افغانی)', 'د تبادلې نرخ (۱ ډالر پر افغانۍ)')}</label>
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
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">{t.landInfo || tx('Land details', 'مشخصات زمین', 'د ځمکې معلومات')}</label>
                <input
                  type="text"
                  placeholder={tx('e.g. title deed and land area...', 'مثلاً: قبالهٔ شرعی و مساحت زمین...', 'لکه: شرعي قباله او د ځمکې مساحت...')}
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
                  <span>{tx('Next: initial expenses', 'مرحلهٔ بعدی (مصارف اولیه)', 'بل پړاو: لومړني لګښتونه')}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: General Expenses Form */}
          {activeStep === 'expenses' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-3 text-amber-900 dark:text-amber-200 leading-relaxed">
                <p className="font-bold mb-1">{tx('Initial project expenses:', 'مصارف عمومی اولیهٔ پروژه:', 'د پروژې لومړني لګښتونه:')}</p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  {tx('Enter truck hire, excavation, municipal fees, or worker meals in USD or AFN using the exchange rate.', 'می‌توانید کرایهٔ موتر، خاک‌برداری، فیس شاروالی یا غذای کارگران را به دالر یا افغانی وارد کنید.', 'د موټر کرایه، کیندنه، د ښاروالۍ فیس یا د کارګرانو خواړه په ډالرو یا افغانۍ ثبت کړئ.')}
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
                        <span>{tx('Expense description:', 'شرح مصرف:', 'د لګښت تشریح:')}</span>
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
                      placeholder={tx('Expense title (e.g. excavation truck hire...)', 'عنوان مصرف (مثلاً کرایهٔ موتر خاک‌برداری...)', 'د لګښت سرلیک (لکه د کیندنې موټر کرایه...)')}
                      value={expense.title}
                      onChange={(e) => handleUpdateExpenseRow(expense.id, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-bold text-ink text-xs"
                    />

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">{tx('Amount', 'مبلغ', 'اندازه')}</label>
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
                            {expense.currency === 'USD' ? tx('US dollars ($)', 'دالر ($)', 'امریکايي ډالر ($)') : tx('Afghan afghani', 'افغانی', 'افغانۍ')}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">{tx('Notes', 'یادداشت', 'یادښتونه')}</label>
                        <input
                          type="text"
                          placeholder={tx('Optional description...', 'توضیح اختیاری...', 'اختیاري تشریح...')}
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
                <span>+ {tx('Add another expense', 'افزودن ردیف مصرف دیگر', 'بل لګښت زیات کړئ')}</span>
              </button>

              <div className="pt-3 border-t border-line flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep('info')}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  {tx('Back', 'بازگشت', 'شاته')}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep('partners')}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <span>{tx('Partners (optional)', 'مرحلهٔ شرکا (اختیاری)', 'شریکان (اختیاري)')}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{tx('Create project', 'ثبت نهایی پروژه', 'پروژه ثبت کړئ')}</span>
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
                    {tx('Optional project partners and ownership shares:', 'تعریف شرکای پروژه و سهم سرمایه (اختیاری):', 'د پروژې اختیاري شریکان او د ونډو سلنه:')}
                  </h4>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    {tx('Add partner names, ownership shares, and investments now or later from the dashboard.', 'اگر پروژه شریک یا سهامدار دارد، نام، درصد سهم و سرمایه‌گذاری را اکنون یا بعداً در داشبورد ثبت کنید.', 'که پروژه شریک یا ونډه‌وال لري، نومونه، د ونډو سلنه او پانګونه اوس یا وروسته له ډشبورډ څخه ثبت کړئ.')}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {initialPartners.map((partner, index) => (
                  <div key={partner.id} className="p-3 bg-white dark:bg-slate-800 border border-line rounded-2xl space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-600" />
                        <span>{tx('Partner', 'شریک', 'شریک')} #{index + 1}</span>
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
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">{tx('Partner name (optional)', 'نام شریک (اختیاری)', 'د شریک نوم (اختیاري)')}</label>
                        <input
                          type="text"
                          placeholder={tx('e.g. Zahir Khan', 'مثلاً: حاجی ظاهر', 'لکه: حاجي ظاهر')}
                          value={partner.name}
                          onChange={(e) => handleUpdatePartnerRow(partner.id, 'name', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-xs font-bold text-ink"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">{tx('Phone number', 'شماره تماس', 'د ټیلیفون شمېره')}</label>
                        <input
                          type="text"
                          placeholder={tx('e.g. 0799 123 456', 'مثال: ۰۷۹۹۱۲۳۴۵۶', 'لکه: ۰۷۹۹۱۲۳۴۵۶')}
                          value={partner.phone}
                          onChange={(e) => handleUpdatePartnerRow(partner.id, 'phone', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-xs font-mono text-ink"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">{tx('Initial investment', 'مبلغ سرمایهٔ اولیه', 'لومړنۍ پانګونه')}</label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder={tx('e.g. 100,000', 'مثال: ۱۰۰٬۰۰۰', 'لکه: ۱۰۰٬۰۰۰')}
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
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">{tx('Ownership share (%)', 'درصد سهم (%)', 'د ونډې سلنه (%)')}</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          placeholder={tx('e.g. 50', 'مثلاً: ۵۰', 'لکه: ۵۰')}
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
                <span>+ {tx('Add another partner', 'افزودن شریک دیگر', 'بل شریک زیات کړئ')}</span>
              </button>

              <div className="pt-3 border-t border-line flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep('expenses')}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  {tx('Back', 'بازگشت', 'شاته')}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 font-bold"
                  >
                    {tx('Cancel', 'انصراف', 'لغوه کول')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 text-amber-400 dark:text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmitting ? tx('Saving...', 'در حال ثبت...', 'ثبتېږي...') : tx('Confirm and create project', 'تأیید و ثبت نهایی پروژه', 'تایید او پروژه ثبت کړئ')}</span>
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
