import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { isCurrentLanguage, localizeText } from '../../i18n/localize';
import { 
  Sliders, 
  DollarSign, 
  Building2, 
  Cloud, 
  Database, 
  Upload, 
  Download, 
  RefreshCw, 
  Save, 
  Moon, 
  Sun, 
  SunMoon,
  Palette,
  ShieldCheck, 
  HardDrive,
  Globe 
} from 'lucide-react';
import { AppTheme, NotificationCategory } from '../../types';
import { backendApi } from '../../services/backendApi';

const THEME_OPTIONS: { id: AppTheme; labelKey: string; swatch: string }[] = [
  { id: 'glassmorphism',   labelKey: 'themeGlassmorphism',   swatch: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(191,219,254,0.85))' },
  { id: 'neumorphism',     labelKey: 'themeNeumorphism',     swatch: 'linear-gradient(135deg, #eef3fb, #d3deef)' },
  { id: 'skeuomorphism',   labelKey: 'themeSkeuomorphism',   swatch: 'linear-gradient(135deg, #d9b98a, #8a6a3e)' },
  { id: 'squirclemorphism',labelKey: 'themeSquirclemorphism',swatch: 'linear-gradient(135deg, #818cf8, #f59e0b)' },
  { id: 'metalmorphism',   labelKey: 'themeMetalmorphism',   swatch: 'linear-gradient(135deg, #f2f4f7, #98a3b0)' },
  { id: 'ar_morphism',     labelKey: 'themeArmorphism',      swatch: 'linear-gradient(135deg, #0e7490, #22d3ee)' },
  { id: 'cosmic_orange',   labelKey: 'themeCosmicOrange',    swatch: 'linear-gradient(135deg, #fff7ed, #f96b1f)' },
  { id: 'blue_titanium',   labelKey: 'themeBlueTitanium',    swatch: 'linear-gradient(135deg, #eaf1fb, #3b6fe0)' },
  { id: 'desert_titanium', labelKey: 'themeDesertTitanium', swatch: 'linear-gradient(135deg, #faf3e3, #c08a3e)' },
];

const NOTIFICATION_OPTIONS: Array<{ key: NotificationCategory; en: string; fa: string; ps: string }> = [
  { key: 'installments', en: 'Apartment installment reminders', fa: 'یادآوری اقساط اپارتمان‌ها', ps: 'د اپارتمانونو د قسطونو یادونې' },
  { key: 'purchases', en: 'Unpaid purchase alerts', fa: 'هشدار خریدهای پرداخت‌نشده', ps: 'د نه‌ورکړل شوو پېرودونو خبرتیاوې' },
  { key: 'debts', en: 'Outstanding debt notices', fa: 'یادآوری بدهی‌های باقی‌مانده', ps: 'د پاتې پورونو خبرتیاوې' },
  { key: 'documents', en: 'Missing document alerts', fa: 'هشدار اسناد ناقص', ps: 'د نیمګړو اسنادو خبرتیاوې' },
  { key: 'projects', en: 'Project inactivity reminders', fa: 'یادآوری بی‌فعالیتی پروژه', ps: 'د پروژې د نه‌فعالیت یادونې' },
  { key: 'financial', en: 'General financial notices', fa: 'هشدارهای عمومی مالی', ps: 'عمومي مالي خبرتیاوې' },
];

interface SettingsViewProps {
  onOpenGoogleDrive: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenGoogleDrive }) => {
  const { 
    appSettings, 
    updateAppSettings, 
    isDarkMode, 
    toggleDarkMode, 
    isGoogleDriveConnected, 
    backupToGoogleDrive, 
    exportBackupJSON, 
    importBackupJSON, 
    t, 
    language,
    setLanguage,
    setTheme,
    themeSchedule,
    setThemeSchedule
  } = useApp();
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });

  const [usdRate, setUsdRate] = useState((appSettings.exchangeRateUSDToAFN || 70.5).toString());
  const [companyName, setCompanyName] = useState(appSettings.companyName || 'NIK SMART COUNT');
  const [defaultCurrency, setDefaultCurrency] = useState(appSettings.defaultCurrency || 'USD');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testingDb, setTestingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ checked: boolean; ok: boolean; message: string } | null>(null);
  const notificationPreferences = {
    installments: true,
    purchases: true,
    debts: true,
    documents: true,
    projects: true,
    financial: true,
    ...appSettings.notificationPreferences,
  };

  const toggleNotificationPreference = (key: NotificationCategory, enabled: boolean) => {
    updateAppSettings({
      notificationPreferences: { ...notificationPreferences, [key]: enabled },
    });
  };

  const handleTestDatabaseConnection = async () => {
    setTestingDb(true);
    setDbStatus(null);
    try {
      const res = await backendApi.getCurrentUser();
      if (res.success) {
        setDbStatus({
          checked: true,
          ok: true,
          message: tx('Connected to Shahhost MySQL Server.', 'ارتباط با هاست Shahhost و پایگاه داده MySQL برقرار است.', 'د Shahhost کوربه او MySQL ډیټابېس سره اړیکه ټینګه ده.')
        });
      } else {
        setDbStatus({
          checked: true,
          ok: false,
          message: tx('The server could not be reached; check the server configuration.', 'سرور در دسترس نیست؛ تنظیمات سرور را بررسی کنید.', 'سرور ته لاسرسی نشته؛ د سرور امستنې وګورئ.')
        });
      }
    } catch {
      setDbStatus({
        checked: true,
        ok: false,
        message: tx('Could not contact the server.', 'تماس با سرور برقرار نشد.', 'له سرور سره اړیکه ټینګه نه شوه.')
      });
    } finally {
      setTestingDb(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = parseFloat(usdRate) || 70.5;
    updateAppSettings({
      exchangeRateUSDToAFN: rateNum,
      companyName,
      defaultCurrency
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportLocal = () => {
    exportBackupJSON();
  };

  const handleImportLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const result = importBackupJSON(json);
          if (!result.success) throw new Error('invalid-backup');
          alert(tx('Backup validated and queued for server save. Check the database status banner before leaving this page.', 'پشتیبان بررسی شد و برای ذخیره در سرور فرستاده شد. پیش از ترک صفحه، وضعیت پایگاه داده را ببینید.', 'بیک‌اپ تایید شو او سرور ته د خوندي کولو لپاره ولېږل شو. له پاڼې وتلو مخکې د ډیټابېس حالت وګورئ.'));
        } catch {
          alert(tx('The backup file could not be read or validated.', 'خواندن یا بررسی فایل پشتیبان ممکن نشد.', 'د بیک‌اپ فایل لوستل یا تاییدول ممکن نه شول.'));
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-ink flex items-center gap-2.5">
          <Sliders className="w-6 h-6 text-amber-500" />
          <span>{t('companySettings') || t("companySettings")}</span>
        </h1>
        <p className="text-xs text-ink-muted mt-1">
          {t('settingsDesc') || 'Configure currency exchange rates, cloud storage, themes and backup policies'}
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
          <Save className="w-4 h-4" />
          <span>
            {tx('Settings update queued for server autosave; check the database status banner.', 'تغییرات تنظیمات برای ذخیرهٔ خودکار در سرور فرستاده شد؛ وضعیت پایگاه داده را بررسی کنید.', 'د ترتیباتو بدلونونه سرور ته د اتومات خوندي کولو لپاره ولېږل شول؛ د ډیټابېس حالت وګورئ.')}
          </span>
        </div>
      )}

      {/* Appearance: Morphism Theme & Day/Night Mode */}
      <div className="p-6 rounded-3xl bg-surface border border-line shadow-sm space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Palette className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-black text-ink">{t('themeSettings') || 'Theme & Appearance'}</h2>
              <p className="text-[11px] text-ink-muted">{t('appearanceDesc') || 'Visual style of the whole system'}</p>
            </div>
          </div>
        </div>

        {/* Theme picker */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {THEME_OPTIONS.map(opt => {
            const isActive = (appSettings.theme || 'glassmorphism') === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
                className={`group p-2.5 rounded-2xl border text-start transition-all ${
                  isActive
                    ? 'border-amber-500 ring-2 ring-amber-500/25 bg-amber-500/5 shadow-sm'
                    : 'border-line bg-surface-2 hover:border-amber-500/40 hover:shadow-sm'
                }`}
              >
                <span
                  className="block h-10 w-full rounded-xl border border-black/10 mb-2 group-hover:scale-[1.02] transition-transform"
                  style={{ background: opt.swatch }}
                />
                <span className={`block text-[10px] leading-tight font-bold ${isActive ? 'text-amber-700 dark:text-amber-400' : 'text-ink-muted'}`}>
                  {t(opt.labelKey as any) || opt.id}
                </span>
              </button>
            );
          })}
        </div>

        {/* Day / Night schedule */}
        <div>
          <p className="text-xs font-black text-ink mb-2">{t('darkModeToggle') || t("darkModeToggle")}</p>
          <div className="flex flex-wrap gap-2">
            {([
              { id: 'auto' as const, label: t('autoMode') || 'Auto', icon: <SunMoon className="w-3.5 h-3.5" /> },
              { id: 'light' as const, label: t('lightMode') || 'Light', icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
              { id: 'dark' as const, label: t('darkMode') || 'Dark', icon: <Moon className="w-3.5 h-3.5 text-indigo-400" /> },
            ]).map(mode => {
              const isActive = (themeSchedule || 'auto') === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setThemeSchedule(mode.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                    isActive
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                      : 'bg-surface-2 text-ink-muted border-line hover:text-ink hover:border-amber-500/40'
                  }`}
                >
                  {mode.icon}
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="p-6 rounded-3xl bg-surface border border-line shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Company Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('companyName') || 'Company / Firm Name'}
            </label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-2 border border-line rounded-xl text-xs font-semibold"
            />
          </div>

          {/* Exchange Rate */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('exchangeRateUSDToAFN') || 'Exchange Rate (1 USD = ? AFN)'}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={usdRate}
                onChange={e => setUsdRate(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-2 border border-line rounded-xl text-xs font-mono font-bold"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">AFN</span>
            </div>
          </div>

          {/* Default Currency */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('defaultCurrency') || 'Default Project Currency'}
            </label>
            <select
              value={defaultCurrency}
              onChange={e => setDefaultCurrency(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-2 border border-line rounded-xl text-xs"
            >
              <option value="USD">USD ($ - {tx('US Dollar', 'دالر آمریکایی', 'امریکايي ډالر')})</option>
              <option value="AFN">AFN (؋ - {tx('Afghan Afghani', 'افغانی', 'افغانۍ')})</option>
            </select>
          </div>

          {/* Interface Language */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('language') || 'Language'}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLanguage('fa')}
                className={`flex-1 py-2 text-xs rounded-xl font-bold transition ${
                  isCurrentLanguage(language, 'fa') ? 'bg-blue-600 text-white' : 'bg-surface-2 text-slate-700 dark:text-slate-300'
                }`}
              >
                {tx('Afghan Dari', 'دری افغانستان', 'افغان دری')}
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ps')}
                className={`flex-1 py-2 text-xs rounded-xl font-bold transition ${
                  isCurrentLanguage(language, 'ps') ? 'bg-blue-600 text-white' : 'bg-surface-2 text-slate-700 dark:text-slate-300'
                }`}
              >
                {tx('Pashto', 'پشتو', 'پښتو')}
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex-1 py-2 text-xs rounded-xl font-bold transition ${
                  isCurrentLanguage(language, 'en') ? 'bg-blue-600 text-white' : 'bg-surface-2 text-slate-700 dark:text-slate-300'
                }`}
              >
                {tx('English', 'انگلیسی', 'انګلیسي')}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-line">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            <Save className="w-4 h-4" />
            <span>{t('saveSettings') || 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Persisted notification category preferences */}
      <section className="p-6 rounded-3xl bg-surface border border-line shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-black text-ink">
            {tx('Notification preferences', 'ترجیحات اعلان‌ها', 'د خبرتیاوو غوره‌توبونه')}
          </h2>
          <p className="text-xs text-ink-muted mt-1">
            {tx('Choose which business categories may generate reminders.', 'انتخاب کنید برای کدام بخش‌های کاری یادآوری ایجاد شود.', 'وټاکئ چې د کومو کاري برخو لپاره یادونې جوړې شي.')}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {NOTIFICATION_OPTIONS.map(option => (
            <label key={option.key} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-2 border border-line cursor-pointer">
              <span className="text-xs font-semibold text-ink">
                {localizeText(language, { en: option.en, fa: option.fa, ps: option.ps })}
              </span>
              <input
                type="checkbox"
                checked={notificationPreferences[option.key] !== false}
                onChange={event => toggleNotificationPreference(option.key, event.target.checked)}
                className="w-4 h-4 accent-amber-600 shrink-0"
              />
            </label>
          ))}
        </div>
        <p className="text-[11px] text-ink-muted">
          {tx('Changes are queued for the owner workspace autosave; verify the database status banner above.', 'تغییرات برای ذخیرهٔ خودکار فضای کاری مالک فرستاده می‌شود؛ وضعیت پایگاه داده را در نوار بالا بررسی کنید.', 'بدلونونه د مالک د کاري ځای د اتومات خوندي کولو لپاره لېږل کېږي؛ پورته د ډیټابېس حالت وګورئ.')}
        </p>
      </section>

      {/* Cloud & Backup Section */}
      <div className="p-6 rounded-3xl bg-surface border border-line shadow-sm space-y-4">
        <h3 className="font-bold text-base text-ink flex items-center gap-2">
          <Cloud className="w-5 h-5 text-blue-600" />
          <span>{t('googleDriveAndCloud') || 'Google Drive Cloud Storage & Backups'}</span>
        </h3>
        <p className="text-xs text-ink-muted">
          {t('googleDriveBackupHelp') || 'Secure your complete database, contractor balances, apartments, and receipts in your private Google Drive account.'}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onOpenGoogleDrive}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <Cloud className="w-4 h-4" />
            <span>{isGoogleDriveConnected ? (t('manageGoogleDrive') || 'Manage Google Drive') : (t('connectDrive') || 'Connect Google Drive')}</span>
          </button>

          <button
            type="button"
            onClick={handleExportLocal}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            <Download className="w-4 h-4" />
            <span>{t('exportLocalJSON') || 'Download Local Backup (JSON)'}</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{t('restoreFromLocalJSON') || 'Restore from Local File'}</span>
            <input type="file" accept=".json" onChange={handleImportLocal} className="hidden" />
          </label>
        </div>
      </div>

      {/* Shahhost MySQL Database Integration Section */}
      <div className="p-6 rounded-3xl bg-surface border border-line shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-ink">
                {tx('Shahhost MySQL Cloud Database', 'پایگاه دادهٔ آنلاین Shahhost (SSD Silver)', 'د Shahhost MySQL کلاوډ ډیټابېس')}
              </h3>
              <p className="text-xs text-ink-muted">
                {tx('Relational MySQL database with cloud synchronization', 'پایگاه دادهٔ رابطه‌ای MySQL با همگام‌سازی ابری', 'اړیکه‌لرونکی MySQL ډیټابېس له کلاوډ همغږۍ سره')}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {tx('MySQL & PHP support', 'پشتیبانی MySQL و PHP', 'د MySQL او PHP ملاتړ')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3.5 rounded-2xl bg-surface-2 border border-line">
            <span className="text-slate-400 font-medium">{tx('Hosting plan:', 'نوع هاست:', 'د کوربه‌توب بسته:')}</span>
            <p className="font-bold text-ink mt-0.5">Shahhost NVMe SSD Silver</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-surface-2 border border-line">
            <span className="text-slate-400 font-medium">{tx('Database tables:', 'جدول‌های پایگاه داده:', 'د ډیټابېس جدولونه:')}</span>
            <p className="font-bold text-ink mt-0.5">{tx('Database schema status varies by installation', 'وضعیت ساختار پایگاه داده به نصب بستگی دارد', 'د ډیټابېس جوړښت د نصب له ډول سره بدلېږي')}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-surface-2 border border-line">
            <span className="text-slate-400 font-medium">{tx('Security and administration:', 'امنیت و مدیریت:', 'امنیت او اداره:')}</span>
            <p className="font-bold text-ink mt-0.5">{tx('Office 7 administration', 'مدیریت دفتر هفت', 'د دفتر اووه اداره')}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestDatabaseConnection}
            disabled={testingDb}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${testingDb ? 'animate-spin' : ''}`} />
            <span>{tx('Test server connection', 'آزمایش اتصال سرور', 'د سرور اړیکه وازمویئ')}</span>
          </button>
        </div>

        {dbStatus && (
          <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
            dbStatus.ok 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
              : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
          }`}>
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{dbStatus.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};
