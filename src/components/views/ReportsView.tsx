import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { localizeText } from '../../i18n/localize';
import { backendApi, type GeneratedWorkspaceReport, type WorkspaceReportType } from '../../services/backendApi';
import { 
  BarChart3, 
  Printer, 
  Building2, 
  Receipt, 
  CreditCard, 
  Layers, 
  CircleDot, 
  Home, 
  Users, 
  TrendingUp, 
  Scale, 
  DollarSign,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  Coins,
  TrendingDown,
  Activity,
  FileSpreadsheet
} from 'lucide-react';

const REPORT_DATA_KEYS: Record<WorkspaceReportType, (keyof GeneratedWorkspaceReport['data'])[]> = {
  financial: ['expenses', 'payments'],
  materials: ['steelRecords', 'concreteRecords'],
  contractors: ['contractors', 'expenses', 'payments'],
  sales: ['apartments', 'payments'],
  monthly_pnl: ['expenses', 'payments', 'apartments'],
};

export const ReportsView: React.FC = () => {
  const { 
    currentProject,
    currentUser,
    workspaceReady,
    workspaceSaving,
    expenses, 
    payments, 
    steelRecords, 
    concreteRecords, 
    apartments, 
    contractors, 
    suppliers,
    projectPartners,
    formatCurrency, 
    formatNumber, 
    t, 
    language,
    appSettings
  } = useApp();
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });

  const [reportType, setReportType] = useState<WorkspaceReportType>('financial');
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [pnlCurrency, setPnlCurrency] = useState<'USD' | 'AFN'>('USD');
  const [pnlViewMode, setPnlViewMode] = useState<'all' | 'cash' | 'accrual'>('all');
  const [generatedReport, setGeneratedReport] = useState<{ report: GeneratedWorkspaceReport; userId: string } | null>(null);
  const [isPreparingReport, setIsPreparingReport] = useState(false);
  const [reportGenerationFailed, setReportGenerationFailed] = useState(false);
  const [printWhenReady, setPrintWhenReady] = useState(false);
  const canGenerateReport = Boolean(currentUser && !currentUser.isMasterSuperAdmin);
  const reportSelectionRef = useRef({
    projectId: currentProject?.id,
    userId: currentUser?.id,
    reportType,
    year: selectedYear,
  });
  reportSelectionRef.current = {
    projectId: currentProject?.id,
    userId: currentUser?.id,
    reportType,
    year: selectedYear,
  };
  const activeServerReport = generatedReport?.userId === currentUser?.id
    && generatedReport?.report.projectId === currentProject?.id
    && generatedReport?.report.reportType === reportType
    && generatedReport?.report.year === selectedYear
    ? generatedReport.report
    : null;

  useEffect(() => {
    setGeneratedReport(null);
    setReportGenerationFailed(false);
    setPrintWhenReady(false);
  }, [currentProject?.id, currentUser?.id, reportType, selectedYear]);

  useEffect(() => {
    if (!printWhenReady || !activeServerReport) return;
    const printTimer = window.setTimeout(() => {
      window.print();
      setPrintWhenReady(false);
    }, 0);
    return () => window.clearTimeout(printTimer);
  }, [activeServerReport, printWhenReady]);

  const reportExpenses = activeServerReport ? activeServerReport.data.expenses ?? [] : expenses;
  const reportPayments = activeServerReport ? activeServerReport.data.payments ?? [] : payments;
  const reportSteelRecords = activeServerReport ? activeServerReport.data.steelRecords ?? [] : steelRecords;
  const reportConcreteRecords = activeServerReport ? activeServerReport.data.concreteRecords ?? [] : concreteRecords;
  const reportApartments = activeServerReport ? activeServerReport.data.apartments ?? [] : apartments;
  const reportContractors = activeServerReport ? activeServerReport.data.contractors ?? [] : contractors;

  // Metrics for the selected project. Print/export always uses the matching server-authorized
  // snapshot before opening the browser print dialog.
  const projectExpenses = reportExpenses.filter(e => e.projectId === currentProject?.id);
  const projectPayments = reportPayments.filter(p => p.projectId === currentProject?.id);
  const projectSteel = reportSteelRecords.filter(s => s.projectId === currentProject?.id);
  const projectConcrete = reportConcreteRecords.filter(c => c.projectId === currentProject?.id);
  const projectApartments = reportApartments.filter(a => a.projectId === currentProject?.id);

  const totalExpenseUSD = projectExpenses.reduce((sum, e) => sum + (e.totalAmountUSD || 0), 0);
  const totalPaidUSD = projectPayments.reduce((sum, p) => sum + (p.amountUSD || 0), 0);
  const totalRemainingDebtUSD = Math.max(0, totalExpenseUSD - totalPaidUSD);

  const totalSteelTons = projectSteel.reduce((sum, s) => sum + (s.totalKg || 0), 0) / 1000;
  const totalSteelCostUSD = projectSteel.reduce((sum, s) => sum + (s.totalCostUSD || 0), 0);

  const totalConcreteM3 = projectConcrete.reduce((sum, c) => sum + (c.volumeM3 || 0), 0);
  const totalConcreteCostUSD = projectConcrete.reduce((sum, c) => sum + (c.totalCostUSD || 0), 0);

  const soldApartments = projectApartments.filter(a => a.status === 'sold');
  const totalApartmentSalesUSD = soldApartments.reduce((sum, a) => sum + (a.totalPriceUSD || 0), 0);
  const totalSalesCashCollectedUSD = soldApartments.reduce((sum, a) => sum + (a.downPaymentUSD || 0) + (a.paidAmountUSD || 0), 0);
  const pendingSalesInstallmentsUSD = Math.max(0, totalApartmentSalesUSD - totalSalesCashCollectedUSD);

  // Group expenses by category
  const expensesByCategory = projectExpenses.reduce((acc: Record<string, number>, exp) => {
    const cat = exp.category || 'Other';
    acc[cat] = (acc[cat] || 0) + (exp.totalAmountUSD || 0);
    return acc;
  }, {});

  // 12 Months Cash Flow & Multi-Year P&L for selectedYear (Solves Excel Flaw #1)
  const monthNames = [
    { num: 1, fa: 'حمل / جنوری', en: 'January', ps: 'وری / جنوري' },
    { num: 2, fa: 'ثور / فبروری', en: 'February', ps: 'غویی / فبروري' },
    { num: 3, fa: 'جوزا / مارچ', en: 'March', ps: 'غبرګولی / مارچ' },
    { num: 4, fa: 'سرطان / اپریل', en: 'April', ps: 'چنګاښ / اپرېل' },
    { num: 5, fa: 'اسد / می', en: 'May', ps: 'زمری / مې' },
    { num: 6, fa: 'سنبله / جون', en: 'June', ps: 'وږی / جون' },
    { num: 7, fa: 'میزان / جولای', en: 'July', ps: 'تله / جولای' },
    { num: 8, fa: 'عقرب / اگست', en: 'August', ps: 'لړم / اګست' },
    { num: 9, fa: 'قوس / سپتمبر', en: 'September', ps: 'لېندۍ / سپټمبر' },
    { num: 10, fa: 'جدی / اکتوبر', en: 'October', ps: 'مرغومی / اکتوبر' },
    { num: 11, fa: 'دلو / نوامبر', en: 'November', ps: 'سلواغه / نومبر' },
    { num: 12, fa: 'حوت / دسمبر', en: 'December', ps: 'کب / ډسمبر' },
  ];

  const rateAFN = (appSettings as any)?.exchangeRate || 70;

  const monthlyTimeline = useMemo(() => {
    let runningCash = 0;

    return monthNames.map(m => {
      // 1. Accrual Expenses / Committed Costs in this month
      const mExpenses = projectExpenses.filter(e => {
        if (!e.date) return false;
        const d = new Date(e.date);
        return d.getFullYear() === selectedYear && (d.getMonth() + 1) === m.num;
      });
      const expenseUSD = mExpenses.reduce((sum, e) => sum + (e.totalAmountUSD || 0), 0);

      // 2. Accrual Revenue (Contracted apartment sales in this month)
      const mSales = projectApartments.filter(a => {
        if (!a.saleDate) return false;
        const d = new Date(a.saleDate);
        return d.getFullYear() === selectedYear && (d.getMonth() + 1) === m.num;
      });
      const revenueUSD = mSales.reduce((sum, a) => sum + (a.totalPriceUSD || 0), 0);

      // 3. Cash Inflows (Actual cash receipts collected)
      const mInflows = projectPayments.filter(p => {
        if (!p.date) return false;
        const d = new Date(p.date);
        const matches = d.getFullYear() === selectedYear && (d.getMonth() + 1) === m.num;
        return matches && ((p as any).paymentType === 'income' || (p as any).type === 'income' || p.relatedType === 'apartment_sale');
      });
      let cashInflowUSD = mInflows.reduce((sum, p) => sum + (p.amountUSD || 0), 0);
      if (cashInflowUSD === 0 && mSales.length > 0) {
        cashInflowUSD = mSales.reduce((sum, a) => sum + (a.downPaymentUSD || a.paidAmountUSD || 0), 0);
      }

      // 4. Cash Outflows (Actual cash paid to contractors, vendors, labor)
      const mOutflows = projectPayments.filter(p => {
        if (!p.date) return false;
        const d = new Date(p.date);
        const matches = d.getFullYear() === selectedYear && (d.getMonth() + 1) === m.num;
        return matches && (p as any).paymentType !== 'income' && (p as any).type !== 'income';
      });
      const cashOutflowUSD = mOutflows.reduce((sum, p) => sum + (p.amountUSD || 0), 0);

      // 5. Net Accrual Profit & Net Cash Flow
      const netProfitUSD = revenueUSD - expenseUSD;
      const netCashUSD = cashInflowUSD - cashOutflowUSD;
      runningCash += netCashUSD;

      return {
        ...m,
        revenue: pnlCurrency === 'AFN' ? revenueUSD * rateAFN : revenueUSD,
        expenseAmount: pnlCurrency === 'AFN' ? expenseUSD * rateAFN : expenseUSD,
        netProfit: pnlCurrency === 'AFN' ? netProfitUSD * rateAFN : netProfitUSD,
        cashInflow: pnlCurrency === 'AFN' ? cashInflowUSD * rateAFN : cashInflowUSD,
        cashOutflow: pnlCurrency === 'AFN' ? cashOutflowUSD * rateAFN : cashOutflowUSD,
        netCash: pnlCurrency === 'AFN' ? netCashUSD * rateAFN : netCashUSD,
        cumulativeCash: pnlCurrency === 'AFN' ? runningCash * rateAFN : runningCash,
        variance: (pnlCurrency === 'AFN' ? netProfitUSD * rateAFN : netProfitUSD) - (pnlCurrency === 'AFN' ? netCashUSD * rateAFN : netCashUSD),
      };
    });
  }, [projectExpenses, projectPayments, projectApartments, selectedYear, pnlCurrency, rateAFN]);

  // Year aggregates
  const yearTotalRevenue = monthlyTimeline.reduce((s, m) => s + m.revenue, 0);
  const yearTotalExpense = monthlyTimeline.reduce((s, m) => s + m.expenseAmount, 0);
  const yearTotalAccrualProfit = yearTotalRevenue - yearTotalExpense;
  const yearProfitMargin = yearTotalRevenue > 0 ? (yearTotalAccrualProfit / yearTotalRevenue) * 100 : 0;

  const yearTotalInflow = monthlyTimeline.reduce((s, m) => s + m.cashInflow, 0);
  const yearTotalOutflow = monthlyTimeline.reduce((s, m) => s + m.cashOutflow, 0);
  const yearNetCashMovement = yearTotalInflow - yearTotalOutflow;
  const yearEndingCash = monthlyTimeline[11]?.cumulativeCash || 0;
  const totalVarianceProfitVsCash = yearTotalAccrualProfit - yearNetCashMovement;

  const handlePrint = async () => {
    setReportGenerationFailed(false);
    if (!currentUser || currentUser.isMasterSuperAdmin || !workspaceReady || workspaceSaving || !currentProject?.id) {
      setReportGenerationFailed(true);
      return;
    }

    const requestSelection = {
      projectId: currentProject.id,
      userId: currentUser.id,
      reportType,
      year: selectedYear,
    };
    setIsPreparingReport(true);
    setGeneratedReport(null);
    const result = await backendApi.generateReport(
      requestSelection.reportType,
      requestSelection.projectId,
      requestSelection.year,
    );
    setIsPreparingReport(false);

    const currentSelection = reportSelectionRef.current;
    if (currentSelection.projectId !== requestSelection.projectId
      || currentSelection.userId !== requestSelection.userId
      || currentSelection.reportType !== requestSelection.reportType
      || currentSelection.year !== requestSelection.year) {
      setPrintWhenReady(false);
      return;
    }

    const report = result.data;
    const hasExpectedCollections = report
      ? REPORT_DATA_KEYS[requestSelection.reportType].every(collection => Array.isArray(report.data?.[collection]))
      : false;
    if (!result.success || !report
      || report.reportType !== requestSelection.reportType
      || report.projectId !== requestSelection.projectId
      || report.year !== requestSelection.year
      || report.project?.id !== requestSelection.projectId
      || !Number.isSafeInteger(report.workspaceRevision)
      || report.workspaceRevision < 0
      || !hasExpectedCollections) {
      setReportGenerationFailed(true);
      return;
    }

    setGeneratedReport({ report, userId: requestSelection.userId });
    setPrintWhenReady(true);
  };

  return (
    <div className={`space-y-6 animate-fade-in print:p-0 ${activeServerReport ? '' : 'print:hidden'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-ink flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>{t('executiveReports') || 'Financial & Executive Reports'}</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            {currentProject?.name} • {t('auditedAccountingStatement') || 'Official building accounting balance sheet and audit statement'}
          </p>
        </div>

        <button
          onClick={handlePrint}
          disabled={isPreparingReport || !canGenerateReport || !workspaceReady || workspaceSaving}
          aria-busy={isPreparingReport || workspaceSaving}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-wait text-white rounded-2xl font-bold text-xs shadow-lg shadow-purple-500/25 transition active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>{isPreparingReport
            ? tx('Preparing report…', 'در حال آماده‌سازی گزارش…', 'راپور چمتو کېږي…')
            : (t('printExecutiveReport') || tx('Print / Export Official Statement', 'چاپ / صدور گزارش رسمی', 'د رسمي راپور چاپ / صادرول'))}</span>
        </button>
      </div>

      {reportGenerationFailed && (
        <div role="alert" className="print:hidden rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
          {tx(
            'The report could not be generated. Verify this project’s data access; staff need both read and report grants for every included module, then try again.',
            'گزارش تولید نشد. دسترسی به داده‌های این پروژه را بررسی کنید؛ کارمند برای هر بخشِ شامل گزارش به مجوز خواندن و گزارش‌گیری نیاز دارد، سپس دوباره تلاش کنید.',
            'راپور جوړ نه شو. دې پروژې ته د معلوماتو لاسرسی وګورئ؛ کارکوونکي د هرې شاملې برخې لپاره د لوستلو او راپور دواړو اجازو ته اړتیا لري، بیا هڅه وکړئ.',
          )}
        </div>
      )}

      {/* Printable Report Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-black text-slate-900">{tx('NIK SMART COUNT - EXECUTIVE AUDIT REPORT', 'نیک اسمارت کانت - گزارش حسابرسی اجرایی', 'نیک سمارټ کاونټ - د اجرائیوي پلټنې راپور')}</h1>
        <p className="text-sm font-bold text-slate-700 mt-1">
          {activeServerReport?.project.name ?? currentProject?.name} ({activeServerReport?.project.projectCode ?? activeServerReport?.project.code ?? currentProject?.code})
        </p>
        {activeServerReport && (
          <p className="text-xs text-slate-500">
            {tx('Server snapshot revision:', 'نسخهٔ تصویر ثبت‌شده در سرور:', 'د سرور د ثبت شوې بڼې نسخه:')} {activeServerReport.workspaceRevision}
          </p>
        )}
        <p className="text-xs text-slate-500">{new Date().toLocaleDateString()}</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-surface-2/80 rounded-2xl w-fit text-xs print:hidden">
        <button
          onClick={() => setReportType('financial')}
          className={`px-3 py-1.5 rounded-xl font-medium transition ${
            reportType === 'financial' 
              ? 'bg-surface text-ink shadow-sm' 
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {t('financialBalanceSheet') || t("accTabBalance")}
        </button>
        <button
          onClick={() => setReportType('materials')}
          className={`px-3 py-1.5 rounded-xl font-medium transition ${
            reportType === 'materials' 
              ? 'bg-surface text-ink shadow-sm' 
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {t('materialsReport') || 'Materials (Steel & Concrete)'}
        </button>
        <button
          onClick={() => setReportType('contractors')}
          className={`px-3 py-1.5 rounded-xl font-medium transition ${
            reportType === 'contractors' 
              ? 'bg-surface text-ink shadow-sm' 
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {t('contractorPayables') || 'Contractor Balances'}
        </button>
        <button
          onClick={() => setReportType('sales')}
          className={`px-3 py-1.5 rounded-xl font-medium transition ${
            reportType === 'sales' 
              ? 'bg-surface text-ink shadow-sm' 
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {t('salesStatement') || 'Apartment Sales & Cash Flow'}
        </button>
        <button
          onClick={() => setReportType('monthly_pnl')}
          className={`px-3 py-1.5 rounded-xl font-medium transition ${
            reportType === 'monthly_pnl' 
              ? 'bg-surface text-ink shadow-sm' 
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {tx('Monthly P&L & Cash Flow', 'سود و زیان و گردش ۱۲ ماهه (P&L)', 'میاشتنی ګټه او زیان او د نغدو پیسو جریان (P&L)')}
        </button>
      </div>

      {/* Financial Report Section */}
      {reportType === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-surface border border-line shadow-sm">
              <span className="text-xs text-slate-400 font-semibold">{t('totalExpensesInvested') || 'Total Construction Expenses'}</span>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">{formatCurrency(totalExpenseUSD, 'USD')}</p>
              <p className="text-xs text-slate-400 mt-1">{projectExpenses.length} {t('invoicesRegistered') || 'Invoices'}</p>
            </div>

            <div className="p-6 rounded-3xl bg-surface border border-line shadow-sm">
              <span className="text-xs text-slate-400 font-semibold">{t('totalCashDisbursed') || 'Total Cash Disbursed'}</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{formatCurrency(totalPaidUSD, 'USD')}</p>
              <p className="text-xs text-slate-400 mt-1">{projectPayments.length} {t('disbursements') || 'Disbursements'}</p>
            </div>

            <div className="p-6 rounded-3xl bg-surface border border-line shadow-sm">
              <span className="text-xs text-slate-400 font-semibold">{t('unpaidLiabilities') || 'Unpaid Project Liabilities'}</span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">{formatCurrency(totalRemainingDebtUSD, 'USD')}</p>
              <p className="text-xs text-slate-400 mt-1">{t('payableToVendorsContractors') || 'Payable to Contractors & Vendors'}</p>
            </div>
          </div>

          {/* Breakdown by Category Table */}
          <div className="bg-surface rounded-3xl border border-line shadow-sm overflow-hidden p-6">
            <h3 className="font-bold text-base text-ink mb-4">
              {t('expensesByCategory') || 'Expense Breakdown by Category'}
            </h3>
            <div className="space-y-3">
              {Object.entries(expensesByCategory).map(([category, amount]) => {
                const percent = totalExpenseUSD ? Math.round((amount / totalExpenseUSD) * 100) : 0;
                return (
                  <div key={category} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{category}</span>
                      <span className="font-mono font-bold text-ink">
                        {formatCurrency(amount, 'USD')} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Materials Report */}
      {reportType === 'materials' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-surface border border-line shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-ink">{t('steelRebar') || t("navSteel")}</h3>
                  <p className="text-xs text-slate-400">{projectSteel.length} {t('purchasesRecorded') || 'Purchases'}</p>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-line">
                  <span className="text-slate-400">{t('totalWeightTon')}:</span>
                  <span className="font-bold">{formatNumber(totalSteelTons, 2)} {t('ton')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line">
                  <span className="text-slate-400">{t('totalWeightKg')}:</span>
                  <span className="font-bold">{formatNumber(totalSteelTons * 1000, 0)} KG</span>
                </div>
                <div className="flex justify-between py-1 font-bold">
                  <span className="text-slate-700 dark:text-slate-200">{t('totalCost')}:</span>
                  <span className="text-amber-600">{formatCurrency(totalSteelCostUSD, 'USD')}</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-surface border border-line shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-teal-500/10 text-teal-600 rounded-2xl">
                  <CircleDot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-ink">{t('concrete') || t("navConcrete")}</h3>
                  <p className="text-xs text-slate-400">{projectConcrete.length} {t('poursRecorded') || 'Pours'}</p>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-line">
                  <span className="text-slate-400">{t('totalVolumeM3')}:</span>
                  <span className="font-bold">{formatNumber(totalConcreteM3, 1)} m³</span>
                </div>
                <div className="flex justify-between py-1 font-bold">
                  <span className="text-slate-700 dark:text-slate-200">{t('totalCost')}:</span>
                  <span className="text-teal-600">{formatCurrency(totalConcreteCostUSD, 'USD')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contractors Balances Report */}
      {reportType === 'contractors' && (
        <div className="bg-surface rounded-3xl border border-line shadow-sm overflow-hidden p-6">
          <h3 className="font-bold text-base text-ink mb-4">
            {t('contractorPayablesReport') || 'Contractor & Vendor Payables Statement'}
          </h3>
          <div className="overflow-x-auto scroll-touch">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-2/60 font-bold border-b border-line text-slate-500">
                <tr>
                  <th className="py-3 px-4">{t('contractor') || 'Name / Trade'}</th>
                  <th className="py-3 px-4">{t('totalWork') || 'Total Work (USD)'}</th>
                  <th className="py-3 px-4">{t('totalPaid') || 'Paid (USD)'}</th>
                  <th className="py-3 px-4 text-right">{t('remainingBalance') || 'Balance Due (USD)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reportContractors.map(c => {
                  const cExpenses = projectExpenses.filter(e => e.recipientId === c.id);
                  const cPayments = projectPayments.filter(p => p.recipientId === c.id);
                  const totalWork = cExpenses.reduce((s, e) => s + (e.totalAmountUSD || 0), 0);
                  const totalPaid = cPayments.reduce((s, p) => s + (p.amountUSD || 0), 0);
                  const debt = Math.max(0, totalWork - totalPaid);

                  return (
                    <tr key={c.id}>
                      <td className="py-3 px-4 font-bold">{c.name} ({c.trade})</td>
                      <td className="py-3 px-4 font-mono">{formatCurrency(totalWork, 'USD')}</td>
                      <td className="py-3 px-4 font-mono text-emerald-600">{formatCurrency(totalPaid, 'USD')}</td>
                      <td className="py-3 px-4 text-right font-black text-amber-600 font-mono">{formatCurrency(debt, 'USD')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sales Report */}
      {reportType === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-surface border border-line shadow-sm">
              <span className="text-xs text-slate-400 font-semibold">{t('totalApartmentSales') || 'Total Contracted Sales'}</span>
              <p className="text-2xl font-black text-ink mt-2">{formatCurrency(totalApartmentSalesUSD, 'USD')}</p>
            </div>
            <div className="p-6 rounded-3xl bg-surface border border-line shadow-sm">
              <span className="text-xs text-slate-400 font-semibold">{t('cashReceived') || 'Cash Received from Buyers'}</span>
              <p className="text-2xl font-black text-emerald-600 mt-2">{formatCurrency(totalSalesCashCollectedUSD, 'USD')}</p>
            </div>
            <div className="p-6 rounded-3xl bg-surface border border-line shadow-sm">
              <span className="text-xs text-slate-400 font-semibold">{t('receivableInstallments') || 'Pending Buyer Installments'}</span>
              <p className="text-2xl font-black text-amber-600 mt-2">{formatCurrency(pendingSalesInstallmentsUSD, 'USD')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Monthly P&L and Timeline Report (Solves Flaw #1: Multi-Year Timeline & Cash Flow vs Accrual Profit) */}
      {reportType === 'monthly_pnl' && (
        <div className="space-y-6">
          {/* Header Controls: Year Navigation, Currency Toggle, View Perspective */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-surface border border-line shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-purple-600 flex items-center justify-center font-bold shadow-xs">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-ink flex items-center gap-2">
                  <span>{tx('Annual Cash Flow & Accrual P&L', 'گزارش سالانه سود/زیان تعهدی و جریان نقدی', 'کلنی راپور: تعهد شوې ګټه او زیان او د نغدو پیسو جریان')}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 font-bold">{tx('MBA standard', 'استاندارد MBA', 'د MBA معیار')}</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {tx('Monthly view separating accrual profit from cash movement.', 'تفکیک ماهانهٔ سود تعهدی از جریان نقدی، بدون تداخل سال‌ها.', 'میاشتنی بڼه چې تعهد شوې ګټه د نغدو پیسو له جریان څخه جلا ښيي.')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Perspective Filter */}
              <div className="flex bg-surface-2 p-1 rounded-2xl text-xs font-bold border border-line">
                <button
                  type="button"
                  onClick={() => setPnlViewMode('all')}
                  className={`px-3 py-1.5 rounded-xl transition ${pnlViewMode === 'all' ? 'bg-surface text-ink shadow-xs' : 'text-slate-500'}`}
                >
                  {tx('All comparisons', 'تحلیل تطبیقی کامل', 'بشپړه پرتله')}
                </button>
                <button
                  type="button"
                  onClick={() => setPnlViewMode('cash')}
                  className={`px-3 py-1.5 rounded-xl transition ${pnlViewMode === 'cash' ? 'bg-surface text-ink shadow-xs' : 'text-slate-500'}`}
                >
                  {tx('Cash flow only', 'فقط جریان نقدینگی', 'یوازې د نغدو پیسو جریان')}
                </button>
                <button
                  type="button"
                  onClick={() => setPnlViewMode('accrual')}
                  className={`px-3 py-1.5 rounded-xl transition ${pnlViewMode === 'accrual' ? 'bg-surface text-ink shadow-xs' : 'text-slate-500'}`}
                >
                  {tx('Accrual P&L only', 'فقط سود و زیان تعهدی (P&L)', 'یوازې تعهد شوې ګټه او زیان (P&L)')}
                </button>
              </div>

              {/* Currency Toggle */}
              <div className="flex bg-surface-2 p-1 rounded-2xl text-xs font-mono font-bold border border-line">
                <button
                  type="button"
                  onClick={() => setPnlCurrency('USD')}
                  className={`px-2.5 py-1.5 rounded-xl transition ${pnlCurrency === 'USD' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500'}`}
                >
                  USD ($)
                </button>
                <button
                  type="button"
                  onClick={() => setPnlCurrency('AFN')}
                  className={`px-2.5 py-1.5 rounded-xl transition ${pnlCurrency === 'AFN' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500'}`}
                >
                  AFN (؋)
                </button>
              </div>

              {/* Year navigation */}
              <div className="flex items-center gap-1.5 bg-surface-2 p-1 rounded-2xl border border-line">
                <button
                  type="button"
                  onClick={() => setSelectedYear(y => y - 1)}
                  className="p-1.5 rounded-xl hover:bg-surface text-slate-600 dark:text-slate-300 transition"
                  title={tx('Previous year', 'سال قبل', 'تېر کال')}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="font-black text-xs px-2.5 py-1 font-mono text-ink">
                  {selectedYear}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedYear(y => y + 1)}
                  className="p-1.5 rounded-xl hover:bg-surface text-slate-600 dark:text-slate-300 transition"
                  title={tx('Next year', 'سال بعد', 'راتلونکی کال')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 6 Executive Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Revenue */}
            <div className="p-4 rounded-3xl bg-surface border border-line shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold block">
                {tx('Accrual revenue for the year', 'عواید تعهدی سال', 'د کال تعهد شوي عواید')}
              </span>
              <p className="text-lg font-black text-ink mt-1 font-mono">
                {formatCurrency(yearTotalRevenue, pnlCurrency)}
              </p>
              <span className="text-[10px] text-indigo-500 font-semibold block mt-0.5">{tx('Signed contracts', 'قراردادهای امضاشده', 'لاسلیک شوي تړونونه')}</span>
            </div>

            {/* Expenses */}
            <div className="p-4 rounded-3xl bg-surface border border-line shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold block">
                {tx('Incurred costs for the year', 'مصارف تعهدی سال', 'د کال واقع شوي لګښتونه')}
              </span>
              <p className="text-lg font-black text-rose-600 mt-1 font-mono">
                {formatCurrency(yearTotalExpense, pnlCurrency)}
              </p>
              <span className="text-[10px] text-rose-500 font-semibold block mt-0.5">{tx('Supplier invoices', 'فاکتورهای تدارکاتی', 'د عرضه‌کوونکو بلونه')}</span>
            </div>

            {/* Accrual Profit */}
            <div className="p-4 rounded-3xl bg-surface border border-line shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold block">
                {tx('Net operating profit (P&L)', 'سود عملیاتی (P&L)', 'خالصه عملیاتي ګټه (P&L)')}
              </span>
              <p className={`text-lg font-black mt-1 font-mono ${yearTotalAccrualProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(yearTotalAccrualProfit, pnlCurrency)}
              </p>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                {tx('Profit margin:', 'حاشیه سود:', 'د ګټې کچه:')} {yearProfitMargin.toFixed(1)}%
              </span>
            </div>

            {/* Cash Inflow */}
            <div className="p-4 rounded-3xl bg-surface border border-line shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold block">
                {tx('Cash inflow', 'ورودی نقدینگی', 'نغدي داخلېدنه')}
              </span>
              <p className="text-lg font-black text-emerald-600 mt-1 font-mono">
                {formatCurrency(yearTotalInflow, pnlCurrency)}
              </p>
              <span className="text-[10px] text-emerald-500 font-semibold block mt-0.5">{tx('Cash and bank receipts', 'وصولی نقد و بانک', 'نغدي او بانکي ترلاسه‌کړې')}</span>
            </div>

            {/* Cash Outflow */}
            <div className="p-4 rounded-3xl bg-surface border border-line shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold block">
                {tx('Cash outflow', 'خروجی نقدینگی', 'نغدي وتل')}
              </span>
              <p className="text-lg font-black text-rose-600 mt-1 font-mono">
                {formatCurrency(yearTotalOutflow, pnlCurrency)}
              </p>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{tx('Cash payments', 'پرداخت‌های نقدی', 'نغدي ورکړې')}</span>
            </div>

            {/* Net Cash Movement */}
            <div className="p-4 rounded-3xl bg-surface border border-line shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold block">
                {tx('Net cash movement', 'خالص گردش نقدینگی', 'د نغدو پیسو خالص جریان')}
              </span>
              <p className={`text-lg font-black mt-1 font-mono ${yearNetCashMovement >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {formatCurrency(yearNetCashMovement, pnlCurrency)}
              </p>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                {tx('Year-end balance:', 'ماندهٔ پایان سال:', 'د کال د پای نغدي بیلانس:')} {formatCurrency(yearEndingCash, pnlCurrency)}
              </span>
            </div>
          </div>

          {/* MBA Financial Health & Risk Assessment Diagnostic Box */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-500/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                {yearTotalAccrualProfit > 0 && yearNetCashMovement < 0 ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-xs text-ink flex items-center gap-2">
                  <span>{tx('Financial health check (accrual profit vs cash):', 'ارزیابی وضعیت مالی (مقایسهٔ سود تعهدی و نقدینگی):', 'د مالي حالت ارزونه (تعهد شوې ګټه او نغدي جریان):')}</span>
                  <span className="font-mono text-purple-600">
                    {tx('Cash gap:', 'فاصلهٔ نقدی:', 'د نغدو پیسو توپیر:')} {formatCurrency(totalVarianceProfitVsCash, pnlCurrency)}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {yearTotalAccrualProfit > 0 && yearNetCashMovement < 0
                    ? tx(
                      '⚠️ Working capital gap: the project is profitable on paper, but cash flow is negative because customer installments are late. Prioritize collecting receivables.',
                      '⚠️ هشدار کمبود نقدینگی: پروژه در حسابداری سودآور است، اما به دلیل تأخیر اقساط مشتریان، جریان نقدی منفی است. پی‌گیری فوری طلب‌ها را در اولویت بگذارید.',
                      '⚠️ د کاري پانګې کمښت: پروژه په حسابونو کې ګټوره ده، خو د پېرودونکو د قسطونو د ځنډ له امله نغدي جریان منفي دی. د پورونو راټولول لومړیتوب وګرځوئ.',
                    )
                    : yearTotalAccrualProfit > 0 && yearNetCashMovement >= 0
                      ? tx(
                        '✅ Balanced finances: both accrual profit and cash flow are positive, so the project can meet its obligations.',
                        '✅ وضعیت مالی متعادل است: سود تعهدی و جریان نقدی هر دو مثبت‌اند و پروژه توان انجام تعهدات خود را دارد.',
                        '✅ مالي حالت متوازن دی: تعهد شوې ګټه او نغدي جریان دواړه مثبت دي، نو پروژه خپل مکلفیتونه پوره کولای شي.',
                      )
                      : tx(
                        'ℹ️ Cash is currently supported mainly by advances, while incurred costs exceed confirmed revenue. Monitor costs and milestones.',
                        'ℹ️ نقدینگی موجود بیشتر از پیش‌دریافت‌ها تأمین شده است، در حالی‌که مصارف واقع‌شده از عواید قطعی بیشتر است. مصارف و مراحل را بررسی کنید.',
                        'ℹ️ اوسنی نغدي حالت تر ډېره د مخکینیو ورکړو له امله دی، حال دا چې واقع شوي لګښتونه له تایید شویو عوایدو زیات دي. لګښتونه او پړاوونه وڅارئ.',
                      )}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 font-bold block">{tx('Cumulative site cash balance:', 'ماندهٔ انباشتهٔ نقد کارگاه:', 'د کارځای د نغدو پیسو ټولیز بیلانس:')}</span>
              <span className={`text-base font-black font-mono ${yearEndingCash >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(yearEndingCash, pnlCurrency)}
              </span>
            </div>
          </div>

          {/* 12 Months Detailed Engineering Table */}
          <div className="bg-surface rounded-3xl border border-line shadow-sm overflow-hidden p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm sm:text-base text-ink flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span>
                  {tx(
                    `12-month performance statement for ${selectedYear} (${pnlCurrency})`,
                    `جدول ماهانهٔ مالی سال ${selectedYear} (${pnlCurrency})`,
                    `د ${selectedYear} کال د مالي فعالیت ۱۲ میاشتنۍ پاڼه (${pnlCurrency})`,
                  )}
                </span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {tx('Exchange rate:', 'نرخ تبادله:', 'د تبادلې نرخ:')} 1 USD = {rateAFN} AFN
              </span>
            </div>

            <div className="overflow-x-auto scroll-touch">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-surface-2/70 font-bold border-b border-line text-slate-500">
                  <tr>
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">{tx('Month', 'ماه مالی', 'میاشت')}</th>

                    {(pnlViewMode === 'all' || pnlViewMode === 'accrual') && (
                      <>
                        <th className="py-3 px-3">{tx('Revenue', 'عواید تعهدی', 'تعهد شوي عواید')}</th>
                        <th className="py-3 px-3">{tx('Costs', 'مصارف تعهدی', 'لګښتونه')}</th>
                        <th className="py-3 px-3">{tx('Net profit', 'سود/زیان ماه', 'خالصه ګټه')}</th>
                      </>
                    )}

                    {(pnlViewMode === 'all' || pnlViewMode === 'cash') && (
                      <>
                        <th className="py-3 px-3">{tx('Cash in', 'نقد ورودی', 'نغدي داخلېدنه')}</th>
                        <th className="py-3 px-3">{tx('Cash out', 'نقد خروجی', 'نغدي وتل')}</th>
                        <th className="py-3 px-3">{tx('Net cash', 'خالص نقدینگی', 'خالص نغدي جریان')}</th>
                        <th className="py-3 px-3 text-right">{tx('Cumulative cash', 'ماندهٔ تجمعی نقد', 'ټولې شوې نغدې پیسې')}</th>
                      </>
                    )}

                    <th className="py-3 px-3 text-center">{tx('Financial status', 'وضعیت مالی', 'مالي حالت')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {monthlyTimeline.map(m => {
                    const isHealthy = m.netProfit >= 0 && m.netCash >= 0;
                    const isCashCrunch = m.netProfit > 0 && m.netCash < 0;

                    return (
                      <tr key={m.num} className="hover:bg-surface-2/40 transition">
                        <td className="py-3 px-3 font-mono text-slate-400">{m.num}</td>
                        <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-100">
                          {localizeText(language, { en: m.en, fa: m.fa, ps: m.ps })}
                        </td>

                        {(pnlViewMode === 'all' || pnlViewMode === 'accrual') && (
                          <>
                            <td className="py-3 px-3 font-mono text-slate-800 dark:text-slate-200">
                              {formatCurrency(m.revenue, pnlCurrency)}
                            </td>
                            <td className="py-3 px-3 font-mono text-rose-600">
                              {formatCurrency(m.expenseAmount, pnlCurrency)}
                            </td>
                            <td className={`py-3 px-3 font-mono font-bold ${m.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatCurrency(m.netProfit, pnlCurrency)}
                            </td>
                          </>
                        )}

                        {(pnlViewMode === 'all' || pnlViewMode === 'cash') && (
                          <>
                            <td className="py-3 px-3 font-mono text-emerald-600">
                              {formatCurrency(m.cashInflow, pnlCurrency)}
                            </td>
                            <td className="py-3 px-3 font-mono text-rose-600">
                              {formatCurrency(m.cashOutflow, pnlCurrency)}
                            </td>
                            <td className={`py-3 px-3 font-mono font-bold ${m.netCash >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {formatCurrency(m.netCash, pnlCurrency)}
                            </td>
                            <td className={`py-3 px-3 text-right font-mono font-bold ${m.cumulativeCash >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatCurrency(m.cumulativeCash, pnlCurrency)}
                            </td>
                          </>
                        )}

                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isHealthy ? 'bg-emerald-500/10 text-emerald-600' :
                            isCashCrunch ? 'bg-amber-500/10 text-amber-600' :
                            'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {isHealthy ? tx('Healthy', 'مطلوب', 'ښه') : isCashCrunch ? tx('Cash deficit', 'کسری نقد', 'د نغدو پیسو کموالی') : tx('Normal', 'عادی', 'عادي')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
