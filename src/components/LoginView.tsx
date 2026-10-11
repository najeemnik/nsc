import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { isCurrentLanguage, isRtlLanguage, localizeText } from '../i18n/localize';
import { exportLegacyBrowserData } from '../services/legacyBrowserData';
import { 
  Building2,
  Lock, 
  Mail, 
  Phone, 
  User as UserIcon, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  KeyRound, 
  ShieldCheck, 
  Briefcase, 
  MapPin, 
  MessageCircle, 
  Send, 
  Linkedin, 
  Layers, 
  CircleDot, 
  Receipt, 
  Home, 
  Sparkles,
  AlertCircle,
  HardHat,
  Bot,
  BarChart3,
  Calendar,
  Check,
  ChevronRight,
  ChevronLeft,
  Copy,
  Flame,
  Award,
  Sun,
  Moon
} from 'lucide-react';

const NATIVE_LANGUAGE_NAMES = { en: 'English', fa: 'دری', ps: 'پښتو' } as const;

export const LoginView: React.FC = () => {
  const { 
    login, 
    requestPasswordReset, 
    completePasswordReset,
    language, 
    setLanguage, 
    t,
    appSettings,
    themeSchedule,
    cycleThemeSchedule,
    workspaceError
  } = useApp();
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });

  const [authMode, setAuthMode] = useState<'login' | 'forgot_password' | 'reset_otp'>('login');
  const [currentSlide, setCurrentSlide] = useState(0);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [pendingEmail, setPendingEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [simulatedOtpNotice, setSimulatedOtpNotice] = useState<string | null>(null);

  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [legacyExportMessage, setLegacyExportMessage] = useState<string | null>(null);

  const handleLegacyExport = () => {
    const result = exportLegacyBrowserData();
    setLegacyExportMessage(result.success
      ? tx(
        `Exported ${result.exportedCount} business-data items. Nothing was deleted; review the JSON before importing.`,
        `تعداد ${result.exportedCount} مورد دادهٔ تجاری صادر شد. چیزی حذف نشد؛ پیش از واردکردن فایل JSON را بررسی کنید.`,
        `د سوداګریزو معلوماتو ${result.exportedCount} توکي صادر شول. هېڅ شی حذف نه شول؛ د واردولو مخکې JSON وګورئ.`,
      )
      : tx('No legacy data was exported.', 'داده‌ای صادر نشد.', 'معلومات صادر نه شول.'));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 5);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const featureSlides = [
    {
      id: 0,
      title: t.slideRebarTitle,
      desc: t.slideRebarDesc,
      icon: Layers,
      color: 'from-amber-500/25 to-orange-500/25 text-amber-300 border-amber-500/40',
      badge: tx('Steel / rebar', 'سیخ‌گول', 'سیخ‌ګول'),
      statLabel: t.tons,
      statValue: '124.50 Tn',
      detail1: tx('Sizes: 12–32 mm', 'اندازه‌ها: ۱۲ تا ۳۲ ملی‌متر', 'اندازې: ۱۲ تر ۳۲ ملي‌متر'),
      detail2: t.formulaSteelTons,
    },
    {
      id: 1,
      title: t.slideConcreteTitle,
      desc: t.slideConcreteDesc,
      icon: CircleDot,
      color: 'from-emerald-500/25 to-teal-500/25 text-emerald-300 border-emerald-500/40',
      badge: tx('Concrete & pump', 'کانکریت و پمپ', 'کانکریټ او پمپ'),
      statLabel: tx('Ready-mix volume', 'حجم کانکریت آماده', 'د چمتو کانکریټو حجم'),
      statValue: '480 m³',
      detail1: tx('14 mixer trucks', '۱۴ موتر میکسر', '۱۴ مکسر موټر'),
      detail2: tx('Slump: 120 mm • 350 kg/cm²', 'قوام: ۱۲۰ ملی‌متر • ۳۵۰ کیلوگرام/سانتی‌متر²', 'سلمپ: ۱۲۰ ملي‌متر • ۳۵۰ کیلوګرام/سانتي‌متر²'),
    },
    {
      id: 2,
      title: t.slideApartmentsTitle,
      desc: t.slideApartmentsDesc,
      icon: Home,
      color: 'from-blue-500/25 to-indigo-500/25 text-blue-300 border-blue-500/40',
      badge: tx('Apartments & sales', 'آپارتمان‌ها و فروش', 'اپارتمانونه او پلور'),
      statLabel: t.totalSales,
      statValue: '$1,250,000',
      detail1: tx('8 units contracted', '۸ واحد قرارداد شده', 'د ۸ واحدو تړون شوی'),
      detail2: t.apartmentsProtectedSubtitle,
    },
    {
      id: 3,
      title: t.slideFinancialsTitle,
      desc: t.slideFinancialsDesc,
      icon: HardHat,
      color: 'from-purple-500/25 to-pink-500/25 text-purple-300 border-purple-500/40',
      badge: tx('Contractors & suppliers', 'قراردادیان و عرضه‌کنندگان', 'قراردادیان او عرضه‌کوونکي'),
      statLabel: t.totalOutstanding,
      statValue: '$34,800',
      detail1: tx('Ledger overview', 'نمای کلی دفتر حساب', 'د حساب‌کتاب لنډیز'),
      detail2: t.deductFromDebt,
    },
    {
      id: 4,
      title: t.slideAiTitle,
      desc: t.slideAiDesc,
      icon: Bot,
      color: 'from-cyan-500/25 to-sky-500/25 text-cyan-300 border-cyan-500/40',
      badge: tx('Project AI assistant', 'دستیار هوش مصنوعی پروژه', 'د پروژې مصنوعي ځیرکتیا مرستیال'),
      statLabel: tx('Engineering analysis', 'تحلیل انجینری', 'انجنیري شننه'),
      statValue: tx('Instant insights', 'بینش فوری', 'سمدستي شننې'),
      detail1: tx('Three-language interface', 'رابط کاربری به سه زبان', 'درې‌ژبی کارن‌مخ'),
      detail2: tx('Variance forecasts', 'پیش‌بینی انحرافات', 'د توپیرونو وړاندوینه'),
    },
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    try {
      const result = await login(loginEmail, loginPassword);
      if (!result.success) {
        setErrorMessage(tx('Sign-in failed. Check your username and password.', 'ورود انجام نشد؛ نام کاربری و رمز عبور را بررسی کنید.', 'ننوتل ناکام شو؛ خپل کارن‌نوم او پټنوم وګورئ.'));
      }
    } catch {
      setErrorMessage(tx('Could not reach the sign-in server.', 'ارتباط با سرور ورود برقرار نشد.', 'د ننوتلو سرور ته اړیکه ټینګه نه شوه.'));
    } finally {
      setLoading(false);
    }
  };


  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    setTimeout(() => {
      const result = requestPasswordReset(forgotEmail);
      if (!result.success) {
        setErrorMessage(tx('No account was found for that email.', 'حسابی با این نشانی ایمیل پیدا نشد.', 'د دې برېښنالیک لپاره حساب ونه موندل شو.'));
        setLoading(false);
        return;
      }
      setPendingEmail(forgotEmail);
      setSimulatedOtpNotice(result.otpCode || '123456');
      setAuthMode('reset_otp');
      setSuccessMessage(`${t.otpSentNotice} ${forgotEmail}`);
      setLoading(false);
    }, 300);
  };

  const handleResetComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMessage(tx('Passwords do not match.', 'رمزهای عبور یکسان نیستند.', 'پټنومونه سره برابر نه دي.'));
      return;
    }
    setErrorMessage(null);
    setLoading(true);
    setTimeout(() => {
      const result = completePasswordReset(pendingEmail, otpInput, newPassword);
      if (!result.success) {
        setErrorMessage(tx('Password reset failed.', 'تغییر رمز عبور انجام نشد.', 'د پټنوم بدلول ناکام شول.'));
        setLoading(false);
        return;
      }
      setSuccessMessage(tx('New password saved. You can now sign in.', 'رمز عبور جدید ذخیره شد؛ اکنون می‌توانید وارد شوید.', 'نوی پټنوم خوندي شو؛ اوس ننوتلای شئ.'));
      setLoginEmail(pendingEmail);
      setLoginPassword(newPassword);
      setAuthMode('login');
      setLoading(false);
    }, 300);
  };

  const isRtl = isRtlLanguage(language);

  return (
    <div className={`min-h-screen relative flex flex-col justify-between transition-colors duration-300 ${
      appSettings.darkMode ? 'bg-[#080C16] text-slate-100' : 'bg-slate-50 text-slate-900'
    } selection:bg-amber-500/30 selection:text-amber-800 font-vazir overflow-x-hidden`}>
      
      {/* Background Lights */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={`absolute top-0 start-1/2 -translate-x-1/2 w-[1000px] h-[500px] blur-[140px] ${
          appSettings.darkMode 
            ? 'bg-gradient-to-b from-amber-500/12 via-amber-600/5 to-transparent' 
            : 'bg-gradient-to-b from-amber-500/15 via-amber-300/10 to-transparent'
        }`}></div>
        
        <div className={`absolute top-[20%] start-[-10%] w-[550px] h-[550px] rounded-full blur-[150px] ${
          appSettings.darkMode ? 'bg-emerald-500/10' : 'bg-emerald-500/8'
        }`}></div>
        
        <div className={`absolute top-[35%] end-[-10%] w-[600px] h-[600px] rounded-full blur-[160px] ${
          appSettings.darkMode ? 'bg-blue-600/10' : 'bg-blue-400/8'
        }`}></div>
      </div>

      {/* Top Header */}
      <header className={`relative z-30 border-b ${
        appSettings.darkMode ? 'border-white/10 bg-slate-950/80 text-white' : 'border-slate-200 bg-white/90 text-slate-900 shadow-xs'
      } backdrop-blur-2xl sticky top-0`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          
          <div className="flex items-center space-x-3.5 rtl:space-x-reverse">
            <div className="relative w-10 h-10 flex items-center justify-center shrink-0 select-none">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white font-black flex items-center justify-center text-sm shadow-md">
                NIK
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-black text-base sm:text-lg tracking-tight drop-shadow-xs ${
                  appSettings.darkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  {t.appName}
                </span>
                <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full shadow-xs">
                  {t.verifiedActive}
                </span>
              </div>
              <p className={`text-[11px] font-medium line-clamp-1 ${
                appSettings.darkMode ? 'text-amber-100/70' : 'text-slate-600'
              }`}>
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cycleThemeSchedule}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-colors shadow-md ${
                appSettings.darkMode 
                  ? 'bg-slate-900/90 text-slate-200 border border-white/15 hover:bg-slate-800' 
                  : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-100 shadow-xs'
              }`}
            >
              {themeSchedule === 'auto' ? (
                <>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  {appSettings.darkMode ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">{tx('Automatic', 'خودکار', 'اتومات')}</span>
                </>
              ) : appSettings.darkMode ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px] font-bold">{tx('Night', 'شب', 'شپه')}</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] font-bold">{tx('Day', 'روز', 'ورځ')}</span>
                </>
              )}
            </button>

            <div className={`flex items-center space-x-1 rtl:space-x-reverse backdrop-blur-xl p-1 rounded-2xl border text-xs shadow-lg ${
              appSettings.darkMode ? 'bg-slate-900/90 border-white/15' : 'bg-white border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setLanguage('fa')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  isCurrentLanguage(language, 'fa')
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                    : appSettings.darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {NATIVE_LANGUAGE_NAMES.fa}
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ps')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  isCurrentLanguage(language, 'ps')
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                    : appSettings.darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {NATIVE_LANGUAGE_NAMES.ps}
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  isCurrentLanguage(language, 'en')
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                    : appSettings.darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {NATIVE_LANGUAGE_NAMES.en}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Hero & Authentication Container */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Left Column: Visionary Construction Showcase */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs font-black shadow-lg backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{t.landingHeroBadge}</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-amber-500/20 shrink-0">
                  NIK
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400 block">
                    {tx('Construction management suite', 'سیستم تخصصی مدیریت ساختمان و امور مالی', 'د ودانیزو پروژو د مدیریت او مالي چارو سیستم')}
                  </span>
                  <span className={`text-xl sm:text-2xl font-black tracking-tight ${appSettings.darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {t.appName}
                  </span>
                </div>
              </div>

              <h1 className={`text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.3] text-start ${
                appSettings.darkMode ? 'text-white' : 'text-slate-900'
              }`}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 dark:from-amber-300 dark:via-amber-100 dark:to-white">
                  {t.landingHeroTitle}
                </span>
              </h1>
            </div>

            <div className={`p-4 sm:p-5 rounded-2xl border shadow-xl text-justify rtl:text-right ${
              appSettings.darkMode ? 'bg-slate-900/85 border-white/15 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
            }`}>
              <p className="text-xs sm:text-sm leading-relaxed font-normal">
                {t.landingHeroSubtitle}
              </p>
            </div>

            {/* Feature Slider Card */}
            <motion.div
              initial={{ opacity: 0, x: isRtl ? 40 : -40, y: 25 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-amber-500/30 p-6 shadow-2xl overflow-hidden transition-all duration-300"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.exploreFeatureLive}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-amber-200 font-mono">
                    {currentSlide + 1} / 5
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentSlide((prev) => (prev === 0 ? 4 : prev - 1))}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
                  >
                    {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % 5)}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
                  >
                    {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {(() => {
                const slide = featureSlides[currentSlide];
                const SlideIcon = slide.icon;
                return (
                  <div className="pt-5 space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${slide.color} border flex items-center justify-center shrink-0 shadow-lg`}>
                        <SlideIcon className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                          {slide.badge}
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-white">
                          {slide.title}
                        </h3>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {slide.desc}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                      <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/10 backdrop-blur-md">
                        <span className="text-[10px] text-slate-400 block">{slide.statLabel}</span>
                        <span className="text-sm font-black text-amber-300 font-mono">{slide.statValue}</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/10 backdrop-blur-md">
                        <span className="text-[10px] text-slate-400 block">{t.status}</span>
                        <span className="text-xs font-bold text-amber-200 truncate block">{slide.detail1}</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/10 backdrop-blur-md col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-400 block">{t.formulaSteelTotal}</span>
                        <span className="text-xs font-medium text-emerald-300 truncate block">{slide.detail2}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>

            <div className="rounded-2xl border border-amber-500/30 bg-slate-900/70 px-4 py-3 text-xs text-slate-200 leading-relaxed">
              {tx('Sign-in accounts are provisioned and managed on the server. No demo credentials or browser-created accounts are enabled.', 'حساب‌های ورود در سرور ایجاد و مدیریت می‌شوند. هیچ حساب آزمایشی یا حسابی که در مرورگر ساخته شده باشد، فعال نیست.', 'د ننوتلو حسابونه په سرور کې جوړېږي او اداره کېږي. د ازمایښتي حسابونو یا په براوزر کې د جوړو شوو حسابونو اجازه نشته.')}
            </div>
          </div>

          {/* Right Column: High-Contrast Auth Card */}
          <div className="lg:col-span-5 sticky top-16 z-20 self-start">
            <div className={`rounded-3xl ${
              appSettings.darkMode ? 'bg-slate-900/95 border-white/20 text-white' : 'bg-white/95 border-slate-200 text-slate-900 shadow-2xl'
            } backdrop-blur-2xl border p-6 sm:p-8 shadow-2xl space-y-5 relative overflow-hidden transition-all duration-300`}>
              
              <div className="space-y-1.5 pb-2 border-b border-slate-200/80 dark:border-white/10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{tx('Authorized company portal', 'دروازهٔ اختصاصی شرکت', 'د شرکت ځانګړی پورټل')}</span>
                </div>
                <h2 className={`text-xl font-black tracking-tight ${appSettings.darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {t.loginTitle || tx('Sign in to your company workspace', 'ورود به فضای کاری شرکت', 'د شرکت کاري ځای ته ننوتل')}
                </h2>
                <p className={`text-xs ${appSettings.darkMode ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
                  {tx('Company owners and staff: sign in with your username or email.', 'مالکین شرکت و کارمندان: با نام کاربری یا ایمیل خود وارد شوید.', 'د شرکت مالک او کارکوونکي: د خپل کارن‌نوم یا برېښنالیک له لارې ننوځئ.')}
                </p>
              </div>

              {workspaceError && (
                <div className="p-3.5 bg-rose-950/80 border border-rose-600/80 rounded-2xl text-rose-200 text-xs flex items-center gap-2.5 animate-in fade-in" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{tx('The workspace could not be loaded. Contact your company administrator.', 'فضای کاری بارگذاری نشد. با مدیر شرکت تماس بگیرید.', 'کاري ځای بار نه شو. د خپل شرکت له مدیر سره اړیکه ونیسئ.')}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 bg-rose-950/80 border border-rose-600/80 rounded-2xl text-rose-200 text-xs flex items-center gap-2.5 animate-in fade-in" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 bg-emerald-950/80 border border-emerald-600/80 rounded-2xl text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMessage}</span>
                </div>
              )}

              {legacyExportMessage && (
                <div className="p-3 rounded-xl bg-sky-950/70 border border-sky-700 text-sky-100 text-xs" role="status">
                  {legacyExportMessage}
                </div>
              )}
              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-3 space-y-2">
                <p className="text-[11px] leading-relaxed text-slate-300">
                  {tx(
                    'If this browser contains older NSC records, export them for review before importing into the server workspace. The export is read-only and excludes local accounts, passwords, and security logs.',
                    'اگر در این مرورگر سوابق قدیمی NSC موجود است، پیش از واردکردن به فضای کاری سرور آن‌ها را برای بررسی صادر کنید. صادرکردن فقط‌خواندنی است و حساب‌های محلی، گذرواژه‌ها و رویدادهای امنیتی را شامل نمی‌شود.',
                    'که په دې براوزر کې د NSC پخواني ریکارډونه وي، د سرور کاري ځای ته له واردولو مخکې یې د بیاکتنې لپاره صادر کړئ. صادرول یوازې لوستل کوي او محلي حسابونه، پټنومونه او امنیتي لاګونه نه رانغاړي.',
                  )}
                </p>
                <button type="button" onClick={handleLegacyExport} className="w-full rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-200 hover:bg-sky-500/20">
                  {tx('Export older browser business data', 'صادرکردن داده‌های تجاری قدیمی مرورگر', 'د براوزر پخواني سوداګریز معلومات صادرول')}
                </button>
              </div>

              {authMode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className={`block font-bold mb-1.5 ${appSettings.darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                      {tx('Username or email', 'نام کاربری یا ایمیل', 'کارن‌نوم یا برېښنالیک')}
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder={tx('e.g. owner or accountant', 'مثال: مدیر یا حسابدار', 'لکه: مدیر یا محاسب')}
                        className={`w-full ps-10 pe-3.5 py-3 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/60 font-mono ${
                          appSettings.darkMode 
                            ? 'bg-slate-950/90 border border-slate-700 text-white placeholder-slate-500' 
                            : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={`block font-bold ${appSettings.darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                        {t.password}
                      </label>
                      <button
                        type="button"
                        onClick={() => { setAuthMode('forgot_password'); setErrorMessage(null); }}
                        className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-bold"
                      >
                        {t.forgotPasswordTab}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full ps-10 pe-3.5 py-3 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/60 font-mono ${
                          appSettings.darkMode 
                            ? 'bg-slate-950/90 border border-slate-700 text-white placeholder-slate-500' 
                            : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-white font-black text-sm rounded-2xl transition-all shadow-xl shadow-amber-600/30 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                  >
                    <span>{loading ? t.loading : t.loginAction}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                </form>
              )}

              {authMode === 'forgot_password' && (
                <form onSubmit={handleForgotSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className={`block font-bold mb-1.5 ${appSettings.darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{t.email}</label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="owner@company.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl"
                  >
                    {tx('Send reset code', 'فرستادن کد بازیابی', 'د بیاځلي تنظیم کوډ ولېږئ')}
                  </button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="text-slate-400 hover:text-amber-500 text-xs"
                    >
                      {tx('Return to sign in', 'بازگشت به صفحهٔ ورود', 'ننوتلو پاڼې ته ورستنېدل')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Founder & Contact Profile */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`mt-16 pt-10 border-t ${appSettings.darkMode ? 'border-white/10' : 'border-slate-300'} space-y-8`}
        >
          <div className={`rounded-3xl ${
            appSettings.darkMode 
              ? 'bg-slate-900/90 border-white/15 text-white shadow-2xl' 
              : 'bg-white/95 border-slate-200 text-slate-900 shadow-xl'
          } backdrop-blur-2xl border p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6`}>
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-500 font-black text-2xl shrink-0 shadow-lg">
              AN
            </div>
            
            <div className="flex-1 space-y-2 text-center md:text-start">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <h3 className={`text-lg sm:text-xl font-black ${appSettings.darkMode ? 'text-white' : 'text-slate-900'}`}>{t.founderName}</h3>
                <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 w-fit mx-auto sm:mx-0">
                  {t.founderRoleBadge}
                </span>
              </div>
              <p className={`text-xs sm:text-sm ${appSettings.darkMode ? 'text-slate-200' : 'text-slate-700'} leading-relaxed font-normal`}>
                {t.founderBio}
              </p>
            </div>

            <a
              href="https://www.linkedin.com/in/najeem-nik-624120298/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3.5 rounded-2xl bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-xs flex items-center gap-2.5 transition-all shadow-xl hover:scale-105 shrink-0"
            >
              <Linkedin className="w-4 h-4" />
              <span>{t.contactFounderLinkedIn}</span>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="https://wa.me/93783788278"
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 hover:border-emerald-500 flex items-center gap-4 group shadow-sm transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 font-bold uppercase block">{t.contactFounderWhatsApp}</span>
                <div className="font-mono font-bold text-sm text-slate-900 dark:text-white" dir="ltr">+93 783 788 278</div>
                <span className="text-[11px] text-slate-500 block">{t.whatsappSubtitle}</span>
              </div>
            </a>

            <a
              href="tel:+93783788278"
              className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 hover:border-amber-500 flex items-center gap-4 group shadow-sm transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-amber-600 font-bold uppercase block">{t.contactFounderPhone}</span>
                <div className="font-mono font-bold text-sm text-slate-900 dark:text-white" dir="ltr">+93 783 788 278</div>
                <span className="text-[11px] text-slate-500 block">{t.phoneSubtitle}</span>
              </div>
            </a>

            <a
              href="mailto:info@nik-smartcount.com"
              className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 hover:border-blue-500 flex items-center gap-4 group shadow-sm transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-blue-600 font-bold uppercase block">{t.contactFounderEmail}</span>
                <div className="font-mono font-bold text-sm text-slate-900 dark:text-white truncate">info@nik-smartcount.com</div>
                <span className="text-[11px] text-slate-500 block">{t.emailSubtitle}</span>
              </div>
            </a>
          </div>
        </motion.section>
      </main>

      <footer className="relative z-20 border-t border-slate-200 dark:border-white/10 py-6 bg-white/80 dark:bg-slate-950/90 backdrop-blur-xl text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>{t.copyrightNotice}</span>
          <span className="font-mono text-[11px] text-amber-600">nik-smartcount.com</span>
        </div>
      </footer>
    </div>
  );
};
