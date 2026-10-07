import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
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

export const ReportsView: React.FC = () => {
  const { 
    currentProject, 
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

  const [reportType, setReportType] = useState<'financial' | 'materials' | 'contractors' | 'sales' | 'monthly_pnl'>('financial');
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [pnlCurrency, setPnlCurrency] = useState<'USD' | 'AFN'>('USD');
  const [pnlViewMode, setPnlViewMode] = useState<'all' | 'cash' | 'accrual'>('all');

  // Metrics for current project
  const projectExpenses = expenses.filter(e => e.projectId === currentProject?.id);
  const projectPayments = payments.filter(p => p.projectId === currentProject?.id);
  const projectSteel = steelRecords.filter(s => s.projectId === currentProject?.id);
  const projectConcrete = concreteRecords.filter(c => c.projectId === currentProject?.id);
  const projectApartments = apartments.filter(a => a.projectId === currentProject?.id);

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
    { num: 1, fa: 'حمل / جنوری', en: 'January' },
    { num: 2, fa: 'ثور / فبروری', en: 'February' },
    { num: 3, fa: 'جوزا / مارچ', en: 'March' },
    { num: 4, fa: 'سرطان / اپریل', en: 'April' },
    { num: 5, fa: 'اسد / می', en: 'May' },
    { num: 6, fa: 'سنبله / جون', en: 'June' },
    { num: 7, fa: 'میزان / جولای', en: 'July' },
    { num: 8, fa: 'عقرب / اگست', en: 'August' },
    { num: 9, fa: 'قوس / سپتمبر', en: 'September' },
    { num: 10, fa: 'جدی / اکتوبر', en: 'October' },
    { num: 11, fa: 'دلو / نوامبر', en: 'November' },
    { num: 12, fa: 'حوت / دسمبر', en: 'December' },
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
        return matches && ((p as any).paymentType === 'income' || (p as any).type === 'income' || p.recipientType === 'apartment_buyer');
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in print:p-0">
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
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-purple-500/25 transition active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>{t('printExecutiveReport') || 'Print / Export Official Statement'}</span>
        </button>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-black text-slate-900">NIK SMART COUNT - EXECUTIVE AUDIT REPORT</h1>
        <p className="text-sm font-bold text-slate-700 mt-1">{currentProject?.name} ({currentProject?.code})</p>
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
          {t('financialBalanceSheet') || 'Balance Sheet'}
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
          {language === 'fa' ? 'سود و زیان و گردش ۱۲ ماهه (P&L)' : 'Monthly P&L & Cash Flow'}
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
                  <h3 className="font-bold text-base text-ink">{t('steelRebar') || 'Steel / Rebar'}</h3>
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
                  <h3 className="font-bold text-base text-ink">{t('concrete') || 'Concrete'}</h3>
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
                {contractors.map(c => {
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
                  <span>{language === 'fa' ? 'گزارش سود/زیان و جریان نقدینگی ماهانه (P&L vs Cash Flow)' : 'Annual Cash Flow & Accrual P&L'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 font-bold">MBA Standard</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {language === 'fa' 
                    ? 'تفکیک جریان وجوه نقد (نقد ورودی و خروجی) از سود تعهدی حسابداری با جلوگیری از تداخل سال‌ها' 
                    : 'Clean monthly breakdown strictly isolating Accrual Net Profit from Cash Movement'}
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
                  {language === 'fa' ? 'تحلیل تطبیقی کامل' : 'All Comparison'}
                </button>
                <button
                  type="button"
                  onClick={() => setPnlViewMode('cash')}
                  className={`px-3 py-1.5 rounded-xl transition ${pnlViewMode === 'cash' ? 'bg-surface text-ink shadow-xs' : 'text-slate-500'}`}
                >
                  {language === 'fa' ? 'فقط جریان نقدینگی' : 'Cash Flow Only'}
                </button>
                <button
                  type="button"
                  onClick={() => setPnlViewMode('accrual')}
                  className={`px-3 py-1.5 rounded-xl transition ${pnlViewMode === 'accrual' ? 'bg-surface text-ink shadow-xs' : 'text-slate-500'}`}
                >
                  {language === 'fa' ? 'فقط سود و زیان (P&L)' : 'Accrual P&L Only'}
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
                  title="سال قبل"
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
                  title="سال بعد"
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
                {language === 'fa' ? 'عواید تعهدی سال' : 'Accrual Revenue'}
              </span>
              <p className="text-lg font-black text-ink mt-1 font-mono">
                {formatCurrency(yearTotalRevenue, pnlCurrency)}
              </p>
              <span className="text-[10px] text-indigo-500 font-semibold block mt-0.5">قراردادهای امضاشده</span>
            </div>

            {/* Expenses */}
            <div className="p-4 rounded-3xl bg-surface border border-line shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold block">
                {language === 'fa' ? 'مصارف تعهدی سال' : 'Incurred Costs'}
              </span>
              <p className="text-lg font-black text-rose-600 mt-1 font-mono">
                {formatCurrency(yearTotalExpense, pnlCurrency)}
              </p>
              <span className="text-[10px] text-rose-500 font-semibold block mt-0.5">فاکتورهای تدارکاتی</span>
            </div>

            {/* Accrual Profit */}
            <div className="p-4 rounded-3xl bg-surface border border-line shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold block">
                {language === 'fa' ? 'سود عملیاتی (P&L)' : 'Net Operating Profit'}
              </span>
              <p className={`text-lg font-black mt-1 font-mono ${yearTotalAccrualProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(yearTotalAccrualProfit, pnlCurrency)}
              </p>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                حاشیه سود: {yearProfitMargin.toFixed(1)}%
              </span>
            </div>

            {/* Cash Inflow */}
            <div className="p-4 rounded-3xl bg-surface border border-line shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold block">
                {language === 'fa' ? 'ورودی نقدینگی' : 'Cash Inflow'}
              </span>
              <p className="text-lg font-black text-emerald-600 mt-1 font-mono">
                {formatCurrency(yearTotalInflow, pnlCurrency)}
              </p>
              <span className="text-[10px] text-emerald-500 font-semibold block mt-0.5">وصولی نقد و بانک</span>
            </div>

            {/* Cash Outflow */}
            <div className="p-4 rounded-3xl bg-surface border border-line shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold block">
                {language === 'fa' ? 'خروجی نقدینگی' : 'Cash Outflow'}
              </span>
              <p className="text-lg font-black text-rose-600 mt-1 font-mono">
                {formatCurrency(yearTotalOutflow, pnlCurrency)}
              </p>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">پرداخت‌های نقدی</span>
            </div>

            {/* Net Cash Movement */}
            <div className="p-4 rounded-3xl bg-surface border border-line shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold block">
                {language === 'fa' ? 'خالص گردش نقدینگی' : 'Net Cash Movement'}
              </span>
              <p className={`text-lg font-black mt-1 font-mono ${yearNetCashMovement >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {formatCurrency(yearNetCashMovement, pnlCurrency)}
              </p>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                پایان سال: {formatCurrency(yearEndingCash, pnlCurrency)}
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
                  <span>{language === 'fa' ? 'ارزیابی مهندسی مالی MBA (تحلیل مغایرت سود تعهدی و نقدینگی):' : 'MBA Financial Health Diagnostic:'}</span>
                  <span className="font-mono text-purple-600">
                    شکاف نقدینگی: {formatCurrency(totalVarianceProfitVsCash, pnlCurrency)}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {yearTotalAccrualProfit > 0 && yearNetCashMovement < 0 ? (
                    language === 'fa' 
                      ? '⚠️ هشدار تله نقدینگی (Cash Crunch): پروژه در حسابداری سودآور است، اما به دلیل وصول نشدن اقساط خریداران، مانده جریان نقد منفی است. وصول مطالبات فوری از مشتریان اولویت حیاتی دارد.'
                      : '⚠️ Working Capital Gap: Project shows accounting profit, but cash movement is negative due to delayed receivables. Expedite customer collections.'
                  ) : yearTotalAccrualProfit > 0 && yearNetCashMovement >= 0 ? (
                    language === 'fa'
                      ? '✅ وضعیت متعادل و باثبات (Optimal Liquidity): هر دو شاخص سود خالص تعهدی و جریان نقدینگی مثبت هستند و پروژه توانایی کامل انجام تعهدات کارگاهی را داراست.'
                      : '✅ Balanced Financial Health: Both Net Profit and Net Cash Movement are positive. Project maintains excellent solvency.'
                  ) : (
                    language === 'fa'
                      ? 'ℹ️ ورود نقدینگی موقت (Advance Cash): نقدینگی موجود عمدتاً از محل پیش‌دریافت‌ها است در حالی که هزینه‌های واقع‌شده بیشتر از عواید قطعی بوده‌اند.'
                      : 'ℹ️ Cash advances cushion pending milestones. Monitor cost control to protect target profit margin.'
                  )}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 font-bold block">مانده انباشته نقد کارگاه:</span>
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
                  {language === 'fa' 
                    ? `جدول ماهانه مهندسی مالی سال ${selectedYear} (${pnlCurrency})` 
                    : `12-Month Performance Statement for ${selectedYear} (${pnlCurrency})`}
                </span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                نرخ تسعیر: ۱ دلار = {rateAFN} افغانی
              </span>
            </div>

            <div className="overflow-x-auto scroll-touch">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-surface-2/70 font-bold border-b border-line text-slate-500">
                  <tr>
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">{language === 'fa' ? 'ماه مالی' : 'Month'}</th>

                    {(pnlViewMode === 'all' || pnlViewMode === 'accrual') && (
                      <>
                        <th className="py-3 px-3">{language === 'fa' ? 'عواید تعهدی' : 'Revenue'}</th>
                        <th className="py-3 px-3">{language === 'fa' ? 'مصارف تعهدی' : 'Costs'}</th>
                        <th className="py-3 px-3">{language === 'fa' ? 'سود/زیان ماه' : 'Net Profit'}</th>
                      </>
                    )}

                    {(pnlViewMode === 'all' || pnlViewMode === 'cash') && (
                      <>
                        <th className="py-3 px-3">{language === 'fa' ? 'نقد ورودی' : 'Cash In'}</th>
                        <th className="py-3 px-3">{language === 'fa' ? 'نقد خروجی' : 'Cash Out'}</th>
                        <th className="py-3 px-3">{language === 'fa' ? 'خالص نقدینگی' : 'Net Cash'}</th>
                        <th className="py-3 px-3 text-right">{language === 'fa' ? 'مانده تجمعی نقد' : 'Cumul. Cash'}</th>
                      </>
                    )}

                    <th className="py-3 px-3 text-center">{language === 'fa' ? 'وضعیت مالی' : 'Status'}</th>
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
                          {language === 'fa' ? m.fa : m.en}
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
                            {isHealthy ? 'مطلوب' : isCashCrunch ? 'کسری نقد' : 'عادی'}
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
