import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
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
    connectGoogleDrive,
    isGoogleDriveConnected,
    googleDriveUserEmail
  } = useApp();

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
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

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
      badge: 'STEEL / REBAR',
      statLabel: t.tons,
      statValue: '124.50 Tn',
      detail1: 'سایزهای ۱۲ الی ۳۲ ملی',
      detail2: t.formulaSteelTons,
    },
    {
      id: 1,
      title: t.slideConcreteTitle,
      desc: t.slideConcreteDesc,
      icon: CircleDot,
      color: 'from-emerald-500/25 to-teal-500/25 text-emerald-300 border-emerald-500/40',
      badge: 'CONCRETE & PUMP',
      statLabel: 'Ready-Mix Volume',
      statValue: '480 m³',
      detail1: '14 Mixer Trucks',
      detail2: 'Slump: 120mm • 350 kg/cm²',
    },
    {
      id: 2,
      title: t.slideApartmentsTitle,
      desc: t.slideApartmentsDesc,
      icon: Home,
      color: 'from-blue-500/25 to-indigo-500/25 text-blue-300 border-blue-500/40',
      badge: 'APARTMENTS & SALES',
      statLabel: t.totalSales,
      statValue: '$1,250,000',
      detail1: '8 Units Contracted',
      detail2: t.apartmentsProtectedSubtitle,
    },
    {
      id: 3,
      title: t.slideFinancialsTitle,
      desc: t.slideFinancialsDesc,
      icon: HardHat,
      color: 'from-purple-500/25 to-pink-500/25 text-purple-300 border-purple-500/40',
      badge: 'CONTRACTORS & SUPPLIERS',
      statLabel: t.totalOutstanding,
      statValue: '$34,800',
      detail1: '100% Real-time Ledger',
      detail2: t.deductFromDebt,
    },
    {
      id: 4,
      title: t.slideAiTitle,
      desc: t.slideAiDesc,
      icon: Bot,
      color: 'from-cyan-500/25 to-sky-500/25 text-cyan-300 border-cyan-500/40',
      badge: 'PROJECT AI AGENT',
      statLabel: 'Civil Analysis',
      statValue: 'Instant Insights',
      detail1: 'Multi-lingual Intelligence',
      detail2: 'Automated Variance Forecasts',
    },
  ];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    setTimeout(() => {
      const result = login(loginEmail, loginPassword);
      if (!result.success) {
        setErrorMessage(result.error || (language === 'en' ? 'Sign in failed. Please verify credentials.' : language === 'ps' ? 'ننوتل ناکام شول.' : 'نام کاربری یا رمز عبور اشتباه است.'));
      }
      setLoading(false);
    }, 300);
  };

  const handleGoogleSignInClick = async () => {
    setIsGoogleSigningIn(true);
    setErrorMessage(null);
    try {
      const ok = await connectGoogleDrive();
      if (ok) {
        // Also auto-login with default admin role
        login('admin', 'password123');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ورود با گوگل');
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    setTimeout(() => {
      const result = requestPasswordReset(forgotEmail);
      if (!result.success) {
        setErrorMessage(result.error || (language === 'en' ? 'Email not found in records.' : language === 'ps' ? 'بریښنالیک ونه موندل شو.' : 'حسابی با این ایمیل یافت نشد.'));
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
      setErrorMessage(language === 'en' ? 'Passwords do not match.' : language === 'ps' ? 'پټ نومونه سره سمون نه خوري.' : 'رمزهای عبور با یکدیگر مطابقت ندارند.');
      return;
    }
    setErrorMessage(null);
    setLoading(true);
    setTimeout(() => {
      const result = completePasswordReset(pendingEmail, otpInput, newPassword);
      if (!result.success) {
        setErrorMessage(result.error || (language === 'en' ? 'Password reset failed.' : language === 'ps' ? 'د پټ نوم بدلول ناکام شول.' : 'تغییر رمز عبور با خطا مواجه شد.'));
        setLoading(false);
        return;
      }
      setSuccessMessage(language === 'en' ? 'New password saved successfully. You may now sign in.' : language === 'ps' ? 'نوی پټ نوم په بریالیتوب سره ثبت شو.' : 'رمز عبور جدید با موفقیت ذخیره شد.');
      setLoginEmail(pendingEmail);
      setLoginPassword(newPassword);
      setAuthMode('login');
      setLoading(false);
    }, 300);
  };

  const isRtl = language === 'fa' || language === 'ps';

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
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">خودکار</span>
                </>
              ) : appSettings.darkMode ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px] font-bold">شب</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] font-bold">روز</span>
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
                  language === 'fa' 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md' 
                    : appSettings.darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                دری
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ps')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  language === 'ps' 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md' 
                    : appSettings.darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                پښتو
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  language === 'en' 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md' 
                    : appSettings.darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
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
                    {language === 'en' ? 'OFFICIAL CIVIL ENGINEERING SUITE' : 'سیستم تخصصی محاسبات و مدیریت مالی ساختمان'}
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

            {/* Quick Demo Credentials Panel */}
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
              className="p-4 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/15 text-xs text-slate-200 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>{t.demoAccountsTitle}</span>
                </span>
                <span className="text-[10px] text-slate-400">{t.copyEmail}</span>
              </div>
              
              <div className="flex flex-wrap gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setLoginEmail('admin');
                    setLoginPassword('password123');
                    setErrorMessage(null);
                  }}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-xl border border-amber-500/40 transition-all font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{t.demoAdminLabel} (@admin)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setLoginEmail('accountant');
                    setLoginPassword('password123');
                    setErrorMessage(null);
                  }}
                  className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-xl border border-blue-500/40 transition-all font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{t.demoStaffLabel} (@accountant)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setLoginEmail('sales');
                    setLoginPassword('password123');
                    setErrorMessage(null);
                  }}
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 rounded-xl border border-emerald-500/40 transition-all font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>مسؤول فروشات (@sales)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setLoginEmail('najeemnik');
                    setLoginPassword('password123');
                    setErrorMessage(null);
                  }}
                  className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-xl border border-rose-500/40 transition-all font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{t.demoSuperAdminLabel} (@najeemnik)</span>
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right Column: High-Contrast Auth Card */}
          <div className="lg:col-span-5 sticky top-16 z-20 self-start">
            <div className={`rounded-3xl ${
              appSettings.darkMode ? 'bg-slate-900/95 border-white/20 text-white' : 'bg-white/95 border-slate-200 text-slate-900 shadow-2xl'
            } backdrop-blur-2xl border p-6 sm:p-8 shadow-2xl space-y-5 relative overflow-hidden transition-all duration-300`}>
              
              <div className="space-y-1.5 pb-2 border-b border-slate-200/80 dark:border-white/10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Authorized Corporate Portal' : 'سامانه اختصاصی ورود به سیستم'}</span>
                </div>
                <h2 className={`text-xl font-black tracking-tight ${appSettings.darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {t.loginTitle || 'ورود به دیتابیس پروژه ساختمانی'}
                </h2>
                <p className={`text-xs ${appSettings.darkMode ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
                  صاحبان شرکت‌ها و کارمندان: با نام کاربری یا ایمیل خود وارد شوید.
                </p>
              </div>

              {/* Official Google Sign In Button (Google Workspace Skill Standard) */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleSignInClick}
                  disabled={isGoogleSigningIn}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-850 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>{isGoogleSigningIn ? 'در حال ورود با گوگل...' : 'ورود مستقیم با گوگل (Google Drive)'}</span>
                </button>
                <div className="flex items-center gap-2 my-2 text-slate-400">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
                  <span className="text-[10px] font-bold uppercase">یا ورود با نام کاربری</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 bg-rose-950/80 border border-rose-600/80 rounded-2xl text-rose-200 text-xs flex items-center gap-2.5 animate-in fade-in">
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

              {authMode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className={`block font-bold mb-1.5 ${appSettings.darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                      {language === 'en' ? 'Username or Email' : 'نام کاربری یا ایمیل'}
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="مثال: admin یا accountant"
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
                    ارسال کد بازیابی
                  </button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="text-slate-400 hover:text-amber-500 text-xs"
                    >
                      بازگشت به صفحه ورود
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
