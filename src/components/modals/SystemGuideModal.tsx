import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Building2, 
  Receipt, 
  CreditCard, 
  HardHat, 
  BarChart3, 
  Camera, 
  ArrowRightLeft, 
  CheckCircle2, 
  Printer, 
  ChevronRight,
  ShieldCheck,
  PhoneCall,
  Search,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isRtlLanguage, localizeText } from '../../i18n/localize';

interface SystemGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemGuideModal: React.FC<SystemGuideModalProps> = ({ isOpen, onClose }) => {
  const { language } = useApp();
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });
  const [activeTopic, setActiveTopic] = useState<'project' | 'expense' | 'payment' | 'contractor' | 'report' | 'bills' | 'gdrive'>('project');

  if (!isOpen) return null;

  const isRtl = isRtlLanguage(language);

  const topics = [
    {
      id: 'project' as const,
      icon: Building2,
      color: 'text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400',
      title: tx('1. Project setup', '۱. تعریف و تنظیم پروژه', '۱. د پروژې جوړول'),
      badge: tx('Basics', 'اساسی', 'بنسټ'),
    },
    {
      id: 'expense' as const,
      icon: Receipt,
      color: 'text-blue-700 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400',
      title: tx('2. Expenses and materials', '۲. ثبت مصارف و مواد', '۲. لګښتونه او توکي'),
      badge: tx('Expenses', 'مصارف', 'لګښتونه'),
    },
    {
      id: 'payment' as const,
      icon: CreditCard,
      color: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400',
      title: tx('3. Payments and receipts', '۳. پرداخت‌ها و اسناد رسمی', '۳. تادیې او رسیدونه'),
      badge: tx('Vouchers', 'رسید A4', 'سندونه'),
    },
    {
      id: 'contractor' as const,
      icon: HardHat,
      color: 'text-purple-700 bg-purple-100 dark:bg-purple-950/60 dark:text-purple-400',
      title: tx('4. Contractors and staff', '۴. قراردادی‌ها و شرکا', '۴. قراردادیان او کارکوونکي'),
      badge: tx('Ledger', 'حسابداری', 'حساب‌کتاب'),
    },
    {
      id: 'report' as const,
      icon: BarChart3,
      color: 'text-rose-700 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400',
      title: tx('5. Financial reports', '۵. گزارشات مالی A4', '۵. مالي راپورونه'),
      badge: tx('Reports', 'حسابرسی', 'راپورونه'),
    },
    {
      id: 'bills' as const,
      icon: Camera,
      color: 'text-amber-800 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300',
      title: tx('6. Bills and photo archive', '۶. کمره و آرشیف بل‌ها', '۶. د بلونو او انځورونو زېرمتون'),
      badge: tx('Digital records', 'بدون کاغذ', 'برېښنايي اسناد'),
    },
    {
      id: 'gdrive' as const,
      icon: ExternalLink,
      color: 'text-sky-700 bg-sky-100 dark:bg-sky-950/60 dark:text-sky-400',
      title: tx('7. Google Drive connection', '۷. همگام‌سازی Google Drive', '۷. له ګوګل ډرایو سره نښلول'),
      badge: tx('Cloud', 'ابری', 'وريځ'),
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-title"
    >
      <div 
        className="bg-surface w-full max-w-4xl rounded-3xl shadow-2xl border border-line overflow-hidden my-auto max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-black shadow-inner">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="guide-title" className="text-lg sm:text-xl font-black tracking-tight">
                {tx('Nik Smart Count system guide', 'راهنمای جامع کاربری و محاسبات NIK SMART COUNT', 'د نیک سمارټ کاونټ سیسټم لارښود')}
              </h2>
              <p className="text-xs text-amber-100 font-medium mt-0.5">
                {tx('Practical guidance for building owners and site engineers', 'دستورالعمل‌های کاری روشن برای مالکین ساختمان و انجینران', 'د ودانیو مالکانو او د ساحې انجینرانو لپاره روښانه لارښوونې')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={tx('Close (Esc)', 'بستن (Esc)', 'بندول (Esc)')}
            aria-label={tx('Close', 'بستن', 'بندول')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container: Sidebar Topics + Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Navigation Topics */}
          <div className="w-full md:w-72 bg-slate-50 dark:bg-slate-900/60 p-3 sm:p-4 border-b md:border-b-0 md:border-e border-line overflow-y-auto shrink-0 space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2">
              {tx('Guide topics', 'سرفصل‌های آموزشی', 'د لارښود سرلیکونه')}
            </div>
            {topics.map((t) => {
              const Icon = t.icon;
              const isActive = activeTopic === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTopic(t.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-bold transition-all text-start ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/30'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 rtl:space-x-reverse min-w-0">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-white/20 text-white' : t.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="truncate">{t.title}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono shrink-0 ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {t.badge}
                  </span>
                </button>
              );
            })}

            {/* Quick Contact Box */}
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs space-y-1.5">
              <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>{tx('Support: Ahmad Najeem Nik', 'پشتیبانی: احمد نجیم نیک', 'ملاتړ: احمد نجیم نیک')}</span>
              </div>
              <div className="font-mono font-black text-slate-800 dark:text-slate-200 text-xs dir-ltr text-end">
                +93 783 788 278
              </div>
            </div>
          </div>

          {/* Topic Detail View */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-200 leading-relaxed text-sm">
            {activeTopic === 'project' && (
              <div className="space-y-4">
                <div className="border-b border-line pb-3">
                  <h3 className="text-base font-black text-ink flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-600" />
                    <span>{tx('Create and switch between construction projects', 'نحوه ثبت و سوئیچ بین پروژه‌های ساختمانی', 'د ودانیزو پروژو جوړول او ترمنځ یې بدلون')}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{tx('Manage multiple buildings with separate project accounts.', 'مدیریت همزمان چندین برج و ساختمان با دفاتر حسابداری تفکیک‌شده', 'څو ودانۍ د جلا پروژوي حسابونو له لارې اداره کړئ.')}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-surface-2/60 border border-line">
                    <div className="font-bold text-ink flex items-center gap-1.5 mb-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{tx('Enter project details', 'ثبت مشخصات عمرانی', 'د پروژې معلومات ولیکئ')}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{tx('Enter the building count, unit count, floor area, address, and land-document details so project metrics can be calculated.', 'تعداد منازل، تعداد واحدها، زیربنا، آدرس و مشخصات سند زمین را با دقت وارد کنید تا شاخص‌های پروژه محاسبه شوند.', 'د ودانیو شمېر، د واحدونو شمېر، د پوړونو مساحت، پته او د ځمکې د سند معلومات ولیکئ، څو د پروژې شاخصونه محاسبه شي.')}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-surface-2/60 border border-line">
                    <div className="font-bold text-ink flex items-center gap-1.5 mb-1.5">
                      <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                      <span>{tx('Exchange rate (USD / AFN)', 'نرخ برابری اسعار (دالر / افغانی)', 'د اسعارو نرخ (USD / AFN)')}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{tx('Set the project exchange rate; when an expense is recorded in AFN, its USD equivalent can then be calculated.', 'برای هر پروژه نرخ پایهٔ تبادله را تعیین کنید تا معادل دالری مصارف ثبت‌شده به افغانی محاسبه شود.', 'د هرې پروژې د تبادلې نرخ وټاکئ، څو په افغانیو ثبت شوي لګښتونه په ډالرو واړول شي.')}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTopic === 'expense' && (
              <div className="space-y-4">
                <div className="border-b border-line pb-3">
                  <h3 className="text-base font-black text-ink flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-blue-600" />
                    <span>{tx('Record purchases and daily expenses', 'ثبت خریدها، مصارف روزمره و تسویه‌حساب', 'پېرودونه او ورځني لګښتونه ثبت کړئ')}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{tx('Accounting rule: a purchase creates a payable unless it is paid immediately.', 'اصل حسابداری: هر خرید تعهد مالی (بدهی) است، مگر آنکه همان زمان نقداً پرداخت شود.', 'د حسابدارۍ اصل: هر پېرود پور رامنځته کوي، مګر دا چې سمدستي نغدې ورکړل شي.')}</p>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-2/60 border border-line">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black flex items-center justify-center shrink-0">1</span>
                    <div>
                      <strong className="block font-bold text-ink mb-0.5">{tx('Enter item and quantity (rebar, cement, timber)', 'ثبت جنس و مقدار (سیخ، سمنت، چوب):', 'توکی او اندازه ولیکئ (سیخ‌ګول، سمنټ، لرګي)')}</strong>
                      <span className="text-slate-600 dark:text-slate-400">{tx('Enter the quantity and unit price. The total is calculated automatically; standard unit conversions may also be applied.', 'مقدار و قیمت هر واحد را وارد کنید؛ سیستم مجموع را محاسبه می‌کند و تبدیل واحدهای معیار را انجام می‌دهد.', 'مقدار او د هر واحد بیه ولیکئ. ټولیز لګښت په اتومات ډول محاسبه کېږي او معیاري واحدونه بدلولای شي.')}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-black flex items-center justify-center shrink-0">2</span>
                    <div>
                      <strong className="block font-bold text-amber-900 dark:text-amber-200 mb-0.5">{tx('Currency conversion (USD to AFN)', 'تبدیل نرخ اسعار (دالر به افغانی):', 'د اسعارو بدلون (USD څخه AFN ته)')}</strong>
                      <span className="text-amber-800 dark:text-amber-300">{tx('Use the exchange-rate control to enter the rate for the day.', 'با ابزار تبدیل اسعار می‌توانید نرخ همان روز را وارد کنید.', 'د تبادلې د نرخ له برخې څخه د ورځې نرخ ولیکئ.')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTopic === 'payment' && (
              <div className="space-y-4">
                <div className="border-b border-line pb-3">
                  <h3 className="text-base font-black text-ink flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    <span>{tx('Payments, balance updates, and A4 receipts', 'پرداخت‌ها، کسر از قرضداری و چاپ سند A4', 'تادیې، د پور له بیلانس څخه کسر او A4 رسیدونه')}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{tx('Create payment records and receipts for sharing or filing.', 'صدور اسناد پرداخت و رسید برای ارائه به شرکا یا بایگانی', 'د شریکولو یا ساتلو لپاره د تادیې اسناد او رسیدونه جوړ کړئ.')}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-surface-2/60 border border-line">
                    <div className="font-bold text-ink flex items-center gap-1.5 mb-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>{tx('Deduct payments from balances', 'کسر اتوماتیک از قرضداری', 'تادیه له بیلانس څخه کسر کړئ')}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{tx('When paying a supplier, select them from the creditor list so the amount can be deducted from their outstanding balance.', 'هنگام پرداخت به فروشنده، او را از فهرست طلبکاران انتخاب کنید تا مبلغ از بیلانس باقی‌مانده‌اش کسر شود.', 'عرضه‌کوونکي ته د پیسو ورکولو پر مهال هغه د پورورکوونکو له لېست څخه وټاکئ، څو پیسې یې له پاتې بیلانس څخه کسر شي.')}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                    <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 mb-1.5">
                      <Printer className="w-4 h-4 text-emerald-700" />
                      <span>{tx('Print an A4 receipt', 'چاپ سند استاندارد A4', 'A4 رسید چاپ کړئ')}</span>
                    </div>
                    <p className="text-emerald-800 dark:text-emerald-300">{tx('A printable payment document can include the company heading, logo, and three signature lines.', 'برای هر پرداخت می‌توانید سندی آمادهٔ چاپ با سربرگ شرکت، لوگو و سه محل امضا تهیه کنید.', 'د هرې تادیې لپاره د شرکت سرلیک، نښان او د درېیو لاسلیکونو ځای لرونکی سند چاپولای شئ.')}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTopic === 'contractor' && (
              <div className="space-y-4">
                <div className="border-b border-line pb-3">
                  <h3 className="text-base font-black text-ink flex items-center gap-2">
                    <HardHat className="w-5 h-5 text-purple-600" />
                    <span>{tx('Contractors, retention, and project partners', 'قراردادی‌ها، ضمانت حسن نیت و شرکای پروژه', 'قراردادیان، ساتل شوې تضمیني پیسې او د پروژې شریکان')}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{tx('Track contract amounts, work progress, and partner investments.', 'مبالغ قرارداد، پیشرفت کار و سرمایه‌گذاری شرکا را پیگیری کنید.', 'د قرارداد مبلغ، د کار پرمختګ او د شریکانو پانګه‌اچونه وڅارئ.')}</p>
                </div>
                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="p-3 bg-surface-2/60 rounded-2xl border border-line">
                    <strong className="text-ink block font-bold mb-1">{tx('Retained amount:', 'مبلغ تضمین نگه‌داشته‌شده (Retention):', 'ساتل شوې تضمیني پیسې:')}</strong>
                    {tx('A percentage of a contract may be retained as a completion guarantee, according to your agreement.', 'می‌توانید بر اساس قرارداد، درصدی از مبلغ را تا تکمیل کار به‌عنوان تضمین نگه‌دارید.', 'د تړون له مخې د کار تر بشپړېدو پورې د قرارداد یوه سلنه د تضمین په توګه ساتلای شئ.')}
                  </div>
                  <div className="p-3 bg-surface-2/60 rounded-2xl border border-line">
                    <strong className="text-ink block font-bold mb-1">{tx('Transaction ledger:', 'دفتر روزنامچه حساب (Ledger):', 'د راکړې ورکړې حساب‌کتاب:')}</strong>
                    {tx('Review contract totals and payments by date and document.', 'مجموع قرارداد و پرداخت‌ها را بر اساس تاریخ و سند بررسی کنید.', 'د قرارداد ټولیزه اندازه او تادیې د نېټې او سند له مخې وګورئ.')}
                  </div>
                </div>
              </div>
            )}

            {activeTopic === 'report' && (
              <div className="space-y-4">
                <div className="border-b border-line pb-3">
                  <h3 className="text-base font-black text-ink flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-rose-600" />
                    <span>{tx('Printed reports and spreadsheet exports', 'گزارشات چاپی و خروجی اکسل', 'چاپي راپورونه او سپرېډشیټ صادرول')}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{tx('Prepare financial reports for A4 printing or CSV/Excel export.', 'گزارش کامل مالی را برای چاپ A4 یا خروجی CSV/Excel آماده کنید.', 'مالي راپورونه د A4 چاپ یا CSV/Excel صادرولو لپاره چمتو کړئ.')}</p>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl">
                    <strong className="text-rose-900 dark:text-rose-200 block font-bold mb-1">{tx('USD and AFN breakdown:', 'تفکیک دالر و افغانی:', 'د USD او AFN وېش:')}</strong>
                    {tx('Review amounts in USD and AFN, along with the final balance.', 'مبالغ را به دالر و افغانی همراه با بیلانس نهایی بررسی کنید.', 'اندازې په USD او AFN او وروستی بیلانس وګورئ.')}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-surface-2/60 border border-line">
                      <strong className="text-ink block font-bold mb-1">{tx('Spreadsheet export (CSV):', 'خروجی اکسل (CSV):', 'سپرېډشیټ صادرول (CSV):')}</strong>
                      {tx('Download the rows with column headings in a CSV file.', 'همه ردیف‌ها را با سرستون‌های معیار در فایل CSV بارگیری کنید.', 'ټول قطارونه له سرلیکونو سره په CSV فایل کې ښکته کړئ.')}
                    </div>
                    <div className="p-3 rounded-2xl bg-surface-2/60 border border-line">
                      <strong className="text-ink block font-bold mb-1">{tx('Board signatures:', 'امضای هیئت مدیره:', 'د بورډ لاسلیکونه:')}</strong>
                      {tx('Reports can include signature lines for the accountant, site engineer, and company director.', 'گزارش‌ها می‌توانند محل امضای محاسب، انجینر ناظر و رئیس شرکت داشته باشند.', 'په راپورونو کې د محاسب، د ساحې انجینر او د شرکت د رئیس د لاسلیک ځایونه شاملېدای شي.')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTopic === 'bills' && (
              <div className="space-y-4">
                <div className="border-b border-line pb-3">
                  <h3 className="text-base font-black text-ink flex items-center gap-2">
                    <Camera className="w-5 h-5 text-amber-600" />
                    <span>{tx('Photograph and archive receipts', 'عکس‌برداری با کمره و آرشیف بل‌ها', 'رسیدونه انځور او زېرمه کړئ')}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{tx('Keep photo records of weighbridge tickets and invoices.', 'با عکس‌برداری از رسیدهای باسکول و فاکتورها، اسناد را دیجیتالی نگه‌دارید.', 'د تلل‌ځای رسیدونو او بلونو انځورونه وساتئ.')}</p>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-surface-2/60 border border-line rounded-2xl">
                    <strong className="text-ink block font-bold mb-1">{tx('Use the phone camera:', 'کمرهٔ موبایل:', 'د موبایل کمره:')}</strong>
                    {tx('Use the camera control at the project site to photograph and attach a steel or concrete invoice.', 'در محل پروژه با ابزار کمره از فاکتور آهن یا کانکریت عکس بگیرید و آن را پیوست کنید.', 'د پروژې په ساحه کې د کمرې له لارې د سیخ‌ګولو یا کانکریټو د پېرلو بل انځور او ضمیمه کړئ.')}
                  </div>
                </div>
              </div>
            )}

            {activeTopic === 'gdrive' && (
              <div className="space-y-4">
                <div className="border-b border-line pb-3">
                  <h3 className="text-base font-black text-ink flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-sky-600" />
                    <span>{tx('Google Drive connection and backup', 'همگام‌سازی و پشتیبان‌گیری در Google Drive', 'له Google Drive سره نښلول او شاتړ')}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{tx('Connect the company Google Drive account to store financial data and construction documents.', 'حساب Google Drive شرکت را برای نگهداری داده‌های مالی و اسناد ساختمانی وصل کنید.', 'د مالي معلوماتو او ودانیزو اسنادو د ساتلو لپاره د شرکت Google Drive حساب ونښلوئ.')}</p>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-2xl">
                    <strong className="text-sky-900 dark:text-sky-200 block font-bold mb-1">{tx('Cloud backup:', 'پشتیبان‌گیری ابری:', 'ورېځیز شاتړ:')}</strong>
                    {tx('Save selected system data and documents in the NIK SMART COUNT folder on Google Drive.', 'داده‌ها و اسناد انتخاب‌شدهٔ سیستم را در پوشهٔ «NIK SMART COUNT» در Google Drive ذخیره کنید.', 'د سیستم ټاکل شوي معلومات او اسناد په Google Drive کې د «NIK SMART COUNT» پوښۍ ته خوندي کړئ.')}
                  </div>
                  <div className="p-3.5 bg-surface-2/60 border border-line rounded-2xl">
                    <strong className="text-ink block font-bold mb-1">{tx('Access across devices:', 'دسترسی از همه جا:', 'له بېلابېلو وسایلو لاسرسی:')}</strong>
                    {tx('With Google Drive connected, invoices and receipt images can be opened on devices with access to that account.', 'با وصل‌بودن Google Drive، فاکتورها و عکس رسیدها در دستگاه‌های دارای دسترسی به آن حساب دیده می‌شوند.', 'د Google Drive له نښلولو سره، بلونه او د رسیدونو انځورونه په هغو وسایلو کې پرانیستل کېدای شي چې حساب ته لاسرسی لري.')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-2/80 border-t border-line flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium hidden sm:block">
            {tx('Nik Smart Count construction management system', 'سامانه هوشمند محاسبات ساختمانی نیک (NIK SMART COUNT)', 'د نیک سمارټ کاونټ د ودانیزو چارو مدیریت سیستم')}
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold shadow-xs transition-colors"
          >
            {tx('Got it', 'متوجه شدم', 'پوه شوم')}
          </button>
        </div>
      </div>
    </div>
  );
};
