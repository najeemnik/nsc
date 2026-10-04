import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
  Receipt, 
  CreditCard, 
  Layers, 
  CircleDot, 
  HardHat, 
  Home, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Cloud, 
  Upload, 
  CheckCircle2, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { DashboardCharts } from '../charts/DashboardCharts';

interface DashboardViewProps {
  onOpenNewProject?: () => void;
  onOpenAddExpense?: () => void;
  onOpenAddPayment?: () => void;
  onOpenAddSteel?: () => void;
  onOpenAddConcrete?: () => void;
  onOpenAddApartment?: () => void;
  onOpenGoogleDrive?: () => void;
  setActiveTab?: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewProject,
  onOpenAddExpense,
  onOpenAddPayment,
  onOpenAddSteel,
  onOpenAddConcrete,
  onOpenAddApartment,
  onOpenGoogleDrive,
  setActiveTab
}) => {
  const { 
    currentProject, 
    projects, 
    expenses, 
    steelRecords, 
    concreteRecords, 
    apartments, 
    payments, 
    contractors, 
    suppliers,
    formatCurrency, 
    formatNumber, 
    t, 
    language,
    isGoogleDriveConnected,
    backupToGoogleDrive
  } = useApp();

  const [backingUp, setBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);

  // Financial calculations for current project
  const projectExpenses = expenses.filter(e => e.projectId === currentProject?.id);
  const projectPayments = payments.filter(p => p.projectId === currentProject?.id);
  const projectApartments = apartments.filter(a => a.projectId === currentProject?.id);
  const projectSteel = steelRecords.filter(s => s.projectId === currentProject?.id);
  const projectConcrete = concreteRecords.filter(c => c.projectId === currentProject?.id);

  const totalExpenseUSD = projectExpenses.reduce((sum, e) => sum + (e.totalAmountUSD || 0), 0);
  const totalPaidUSD = projectPayments.reduce((sum, p) => sum + (p.amountUSD || 0), 0);
  const totalDebtUSD = Math.max(0, totalExpenseUSD - totalPaidUSD);

  const totalSteelKG = projectSteel.reduce((sum, s) => sum + (s.totalKg || 0), 0);
  const totalSteelTons = totalSteelKG / 1000;
  const totalSteelCostUSD = projectSteel.reduce((sum, s) => sum + (s.totalCostUSD || 0), 0);

  const totalConcreteM3 = projectConcrete.reduce((sum, c) => sum + (c.volumeM3 || 0), 0);
  const totalConcreteCostUSD = projectConcrete.reduce((sum, c) => sum + (c.totalCostUSD || 0), 0);

  const soldApartments = projectApartments.filter(a => a.status === 'sold');
  const totalSalesUSD = soldApartments.reduce((sum, a) => sum + (a.totalPriceUSD || 0), 0);
  const totalSalesReceivedUSD = soldApartments.reduce((sum, a) => sum + (a.downPaymentUSD || 0) + (a.paidAmountUSD || 0), 0);

  const handleQuickBackup = async () => {
    if (!isGoogleDriveConnected) {
      if (onOpenGoogleDrive) onOpenGoogleDrive();
      return;
    }
    setBackingUp(true);
    try {
      const res = await backupToGoogleDrive();
      setBackupSuccess(res.name);
      setTimeout(() => setBackupSuccess(null), 4000);
    } catch (e: any) {
      alert(e.message || 'Backup failed');
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / Project Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-blue-100 mb-3">
              <Building2 className="w-3.5 h-3.5" />
              <span>{currentProject?.name || t('allProjects')}</span>
              {currentProject?.code && <span className="opacity-75 font-mono">({currentProject.code})</span>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {currentProject ? currentProject.name : t('appName')}
            </h1>
            <p className="mt-1 text-sm text-blue-100/90 max-w-xl">
              {currentProject?.address || currentProject?.description || t('appSubtitle')}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenAddExpense && (
              <button
                onClick={onOpenAddExpense}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-900 rounded-2xl font-bold text-xs shadow-lg hover:bg-blue-50 transition transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{t('addExpense')}</span>
              </button>
            )}

            {onOpenAddPayment && (
              <button
                onClick={onOpenAddPayment}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-xs shadow-lg transition transform active:scale-95"
              >
                <CreditCard className="w-4 h-4" />
                <span>{t('addPayment')}</span>
              </button>
            )}

            <button
              onClick={handleQuickBackup}
              disabled={backingUp}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-lg transition transform active:scale-95 ${
                isGoogleDriveConnected 
                  ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              <Cloud className={`w-4 h-4 ${backingUp ? 'animate-bounce' : ''}`} />
              <span>
                {backingUp 
                  ? 'Backing up...' 
                  : isGoogleDriveConnected 
                  ? t('backupToDrive') || 'Google Drive Backup' 
                  : t('connectDrive') || 'Connect Drive'}
              </span>
            </button>
          </div>
        </div>

        {/* Backup Success Toast */}
        {backupSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 rounded-xl text-xs text-emerald-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{t('googleDriveBackupSuccess') || 'Successfully backed up to Google Drive:'} <strong>{backupSuccess}</strong></span>
          </div>
        )}

        {/* Decorative background shapes */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-1/3 -top-10 w-40 h-40 bg-purple-500/20 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Expenses Card */}
        <div 
          onClick={() => setActiveTab && setActiveTab('expenses')}
          className="p-5 rounded-3xl bg-surface border border-line shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-ink-muted">{t('totalExpenses')}</span>
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-ink">
            {formatCurrency(totalExpenseUSD, 'USD')}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-500">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{projectExpenses.length} {t('registeredBills')}</span>
          </div>
        </div>

        {/* Total Payments Made */}
        <div 
          onClick={() => setActiveTab && setActiveTab('payments')}
          className="p-5 rounded-3xl bg-surface border border-line shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-ink-muted">{t('totalPaid')}</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-ink">
            {formatCurrency(totalPaidUSD, 'USD')}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-500">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>{projectPayments.length} {t('paymentTransactions')}</span>
          </div>
        </div>

        {/* Remaining Debt/Liabilities */}
        <div 
          onClick={() => setActiveTab && setActiveTab('contractors')}
          className="p-5 rounded-3xl bg-surface border border-line shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-ink-muted">{t('remainingLiabilities')}</span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-ink">
            {formatCurrency(totalDebtUSD, 'USD')}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-500">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{contractors.length + suppliers.length} {t('vendorsContractors')}</span>
          </div>
        </div>

        {/* Steel & Concrete Quick Metric */}
        <div 
          onClick={() => setActiveTab && setActiveTab('steel')}
          className="p-5 rounded-3xl bg-surface border border-line shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-ink-muted">{t('steelRebar')} / {t('concrete')}</span>
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-ink flex items-center justify-between">
            <span>{formatNumber(totalSteelTons, 1)} {t('ton')}</span>
            <span className="text-xs text-slate-400 font-normal">|</span>
            <span>{formatNumber(totalConcreteM3, 1)} m³</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-teal-600 dark:text-teal-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{formatCurrency(totalSteelCostUSD + totalConcreteCostUSD, 'USD')}</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Visual Analytics */}
      <DashboardCharts />

      {/* Recent Activity / Recent Bills & Payments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Expenses / Bills */}
        <div className="p-6 rounded-3xl bg-surface border border-line shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl">
                <Receipt className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{t('recentExpenses')}</h3>
            </div>
            {setActiveTab && (
              <button 
                onClick={() => setActiveTab('expenses')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                {t('viewAll')}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {projectExpenses.slice(0, 5).map(exp => (
              <div 
                key={exp.id}
                className="p-3.5 rounded-2xl bg-surface-2/50 border border-line flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{exp.title}</p>
                  <p className="text-[11px] text-slate-400 truncate">{exp.category} • {exp.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-extrabold text-rose-600 dark:text-rose-400">
                    {formatCurrency(exp.totalAmountUSD, 'USD')}
                  </p>
                  <p className="text-[10px] text-slate-400">{exp.currency !== 'USD' ? `${exp.amount} ${exp.currency}` : ''}</p>
                </div>
              </div>
            ))}

            {projectExpenses.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                {t('noExpensesYet')}
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="p-6 rounded-3xl bg-surface border border-line shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{t('recentPayments')}</h3>
            </div>
            {setActiveTab && (
              <button 
                onClick={() => setActiveTab('payments')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                {t('viewAll')}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {projectPayments.slice(0, 5).map(pay => (
              <div 
                key={pay.id}
                className="p-3.5 rounded-2xl bg-surface-2/50 border border-line flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{pay.recipientName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{pay.paymentMethod} • {pay.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(pay.amountUSD, 'USD')}
                  </p>
                  <p className="text-[10px] text-slate-400">{pay.currency !== 'USD' ? `${pay.amount} ${pay.currency}` : ''}</p>
                </div>
              </div>
            ))}

            {projectPayments.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                {t('noPaymentsYet')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
