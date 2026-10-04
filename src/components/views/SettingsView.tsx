import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
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
  CheckCircle2, 
  Moon, 
  Sun, 
  ShieldCheck, 
  HardDrive,
  Globe 
} from 'lucide-react';

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
    setLanguage 
  } = useApp();

  const [usdRate, setUsdRate] = useState((appSettings.exchangeRateUSDToAFN || 70.5).toString());
  const [companyName, setCompanyName] = useState(appSettings.companyName || 'NIK SMART COUNT');
  const [defaultCurrency, setDefaultCurrency] = useState(appSettings.defaultCurrency || 'USD');
  const [savedSuccess, setSavedSuccess] = useState(false);

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
          importBackupJSON(json);
          alert('Database restored successfully from local file!');
        } catch (err: any) {
          alert('Failed to parse backup file: ' + err.message);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <Sliders className="w-6 h-6 text-amber-500" />
          <span>{t('companySettings') || 'Company & System Settings'}</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t('settingsDesc') || 'Configure currency exchange rates, cloud storage, themes and backup policies'}
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{t('settingsSavedSuccess') || 'Settings saved successfully!'}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
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
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
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
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
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
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            >
              <option value="USD">USD ($ - US Dollar)</option>
              <option value="AFN">AFN (؋ - Afghan Afghani)</option>
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
                  language === 'fa' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                دری (Farsi)
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ps')}
                className={`flex-1 py-2 text-xs rounded-xl font-bold transition ${
                  language === 'ps' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                پښتو (Pashto)
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex-1 py-2 text-xs rounded-xl font-bold transition ${
                  language === 'en' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            <Save className="w-4 h-4" />
            <span>{t('saveSettings') || 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Cloud & Backup Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Cloud className="w-5 h-5 text-blue-600" />
          <span>{t('googleDriveAndCloud') || 'Google Drive Cloud Storage & Backups'}</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
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
    </div>
  );
};
