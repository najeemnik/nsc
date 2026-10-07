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
  ChevronRight
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
    language 
  } = useApp();

  const [reportType, setReportType] = useState<'financial' | 'materials' | 'contractors' | 'sales' | 'monthly_pnl'>('financial');
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());

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

  const monthlyTimeline = useMemo(() => {
    return monthNames.map(m => {
      // Invoiced expenses in selectedYear
      const mExpenses = projectExpenses.filter(e => {
        if (!e.date) return false;
        const d = new Date(e.date);
        return d.getFullYear() === selectedYear && (d.getMonth() + 1) === m.num;
      });
      const expenseAmount = mExpenses.reduce((sum, e) => sum + (e.totalAmountUSD || 0), 0);

      // Payments disbursed in selectedYear
      const mPayments = projectPayments.filter(p => {
        if (!p.date) return false;
        const d = new Date(p.date);
        return d.getFullYear() === selectedYear && (d.getMonth() + 1) === m.num;
      });
      const disbursedAmount = mPayments.reduce((sum, p) => sum + (p.amountUSD || 0), 0);

      return {
        ...m,
        expenseAmount,
        disbursedAmount,
        netCash: disbursedAmount - expenseAmount,
      };
    });
  }, [projectExpenses, projectPayments, selectedYear]);

  const yearTotalExpense = monthlyTimeline.reduce((s, m) => s + m.expenseAmount, 0);
  const yearTotalDisbursed = monthlyTimeline.reduce((s, m) => s + m.disbursedAmount, 0);
  const yearNetMovement = yearTotalDisbursed - yearTotalExpense;

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

      {/* Monthly P&L and Timeline Report (Solves Flaw #1: Year + Month Filtering) */}
      {reportType === 'monthly_pnl' && (
        <div className="space-y-6">
          {/* Year Selector & Annual Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-surface border border-line shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-ink">
                  {language === 'fa' ? 'گزارش سود و زیان و گردش مالی تفکیک سال' : 'Annual Cash Flow & P&L Statement'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {language === 'fa' ? 'تفکیک دقیق ۱۲ ماه سال مالی بدون تداخل سال‌ها' : 'Clean monthly breakdown with strict year isolation'}
                </p>
              </div>
            </div>

            {/* Year navigation */}
            <div className="flex items-center gap-2 bg-surface-2 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setSelectedYear(y => y - 1)}
                className="p-1.5 rounded-xl hover:bg-surface text-slate-600 dark:text-slate-300 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="font-black text-sm px-3 py-1 font-mono text-ink">
                {selectedYear}
              </span>
              <button
                type="button"
                onClick={() => setSelectedYear(y => y + 1)}
                className="p-1.5 rounded-xl hover:bg-surface text-slate-600 dark:text-slate-300 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-surface border border-line shadow-sm">
              <span className="text-xs text-slate-400 font-semibold">
                {language === 'fa' ? `مجموع مصارف فاکتورشده (${selectedYear})` : `Total Invoiced (${selectedYear})`}
              </span>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
                {formatCurrency(yearTotalExpense, 'USD')}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-surface border border-line shadow-sm">
              <span className="text-xs text-slate-400 font-semibold">
                {language === 'fa' ? `مجموع پرداخت‌های نقدی (${selectedYear})` : `Total Paid Out (${selectedYear})`}
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                {formatCurrency(yearTotalDisbursed, 'USD')}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-surface border border-line shadow-sm">
              <span className="text-xs text-slate-400 font-semibold">
                {language === 'fa' ? `گردش خالص نقدینگی (${selectedYear})` : `Net Movement (${selectedYear})`}
              </span>
              <p className={`text-2xl font-black mt-2 ${yearNetMovement >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {formatCurrency(yearNetMovement, 'USD')}
              </p>
            </div>
          </div>

          {/* 12 Months Detailed Table */}
          <div className="bg-surface rounded-3xl border border-line shadow-sm overflow-hidden p-6">
            <h3 className="font-bold text-base text-ink mb-4">
              {language === 'fa' ? `جدول تفصیلی ماهانه سال مالی ${selectedYear}` : `12-Month Detailed Performance for ${selectedYear}`}
            </h3>
            <div className="overflow-x-auto scroll-touch">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-2/60 font-bold border-b border-line text-slate-500">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">{language === 'fa' ? 'ماه مالی' : 'Month'}</th>
                    <th className="py-3 px-4">{language === 'fa' ? 'مصارف تعهدشده (USD)' : 'Committed Costs (USD)'}</th>
                    <th className="py-3 px-4">{language === 'fa' ? 'پرداخت نقدی (USD)' : 'Disbursed Cash (USD)'}</th>
                    <th className="py-3 px-4 text-right">{language === 'fa' ? 'گردش خالص ماهانه' : 'Net Cash Movement'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {monthlyTimeline.map(m => (
                    <tr key={m.num} className="hover:bg-surface-2/40 transition">
                      <td className="py-3 px-4 font-mono text-slate-400">{m.num}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">
                        {language === 'fa' ? m.fa : m.en}
                      </td>
                      <td className="py-3 px-4 font-mono text-rose-600">
                        {formatCurrency(m.expenseAmount, 'USD')}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-600">
                        {formatCurrency(m.disbursedAmount, 'USD')}
                      </td>
                      <td className="py-3 px-4 text-right font-black font-mono">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] ${
                          m.netCash >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                        }`}>
                          {formatCurrency(m.netCash, 'USD')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
