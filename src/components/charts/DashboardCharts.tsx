import React, { useState } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Layers, 
  CircleDot, 
  AlertCircle, 
  DollarSign, 
  CreditCard, 
  Home, 
  Receipt,
  Scale,
  Calendar,
  CheckCircle2,
  HardHat,
  Truck,
  ArrowUpRight,
  ArrowDownLeft,
  Filter
} from 'lucide-react';
import { 
  ProjectFinancialSummary, 
  SteelRecord, 
  ConcreteRecord, 
  Expense, 
  Payment, 
  ApartmentUnit, 
  Contractor, 
  Supplier 
} from '../../types';

import { useApp } from '../../context/AppContext';
import { intlLocaleFor, localizeText } from '../../i18n/localize';

interface DashboardChartsProps {
  financials?: ProjectFinancialSummary;
  expenses?: Expense[];
  payments?: Payment[];
  steelRecords?: SteelRecord[];
  concreteRecords?: ConcreteRecord[];
  apartments?: ApartmentUnit[];
  contractors?: Contractor[];
  suppliers?: Supplier[];
  projectName?: string;
  isLoading?: boolean;
  onOpenAddExpense?: () => void;
  onOpenAddPayment?: () => void;
  onOpenAddSteel?: () => void;
  onOpenAddConcrete?: () => void;
  onOpenAddSale?: () => void;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = (props) => {
  const appContext = useApp();
  const language = appContext.language;
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });
  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => value.toLocaleString(intlLocaleFor(language), options);
  const financials = props.financials || appContext.currentFinancials;
  const expenses = props.expenses || appContext.expenses;
  const payments = props.payments || appContext.payments;
  const steelRecords = props.steelRecords || appContext.steelRecords;
  const concreteRecords = props.concreteRecords || appContext.concreteRecords;
  const apartments = props.apartments || appContext.apartments;
  const contractors = props.contractors || appContext.contractors;
  const suppliers = props.suppliers || appContext.suppliers;
  const projectName = props.projectName || appContext.currentProject?.name || tx('Current project', 'پروژهٔ جاری', 'اوسنۍ پروژه');
  const isLoading = props.isLoading ?? false;
  const { onOpenAddExpense, onOpenAddPayment, onOpenAddSteel, onOpenAddConcrete, onOpenAddSale } = props;
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses_payments' | 'debts' | 'sales' | 'materials'>('overview');
  const [timeRange, setTimeRange] = useState<'all' | '30' | '90'>('all');

  if (isLoading) {
    return (
      <div className="bg-surface rounded-3xl p-5 sm:p-6 border border-line shadow-xs space-y-4 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="h-64 bg-surface-2/60 rounded-2xl" />
      </div>
    );
  }

  const now = new Date();
  const filterByDate = (dateStr: string) => {
    if (timeRange === 'all') return true;
    const days = parseInt(timeRange, 10);
    const itemDate = new Date(dateStr);
    const diffTime = Math.abs(now.getTime() - itemDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days;
  };

  const filteredExpenses = expenses.filter(e => filterByDate(e.date));
  const filteredPayments = payments.filter(p => filterByDate(p.date));

  const totalExp = filteredExpenses.reduce((sum, e) => sum + (e.amountInUSD || e.amount), 0);
  const totalPay = filteredPayments.reduce((sum, p) => sum + (p.amountInUSD || p.amount), 0);
  const expPaid = filteredExpenses.reduce((sum, e) => sum + (e.paidAmount || 0), 0);
  const expDue = filteredExpenses.reduce((sum, e) => sum + (e.remainingAmount || 0), 0);
  const percentPaid = totalExp > 0 ? Math.min(100, Math.round((expPaid / totalExp) * 100)) : 0;

  const categoryMap: Record<string, number> = {};
  filteredExpenses.forEach(e => {
    const cat = e.category || tx('Other', 'متفرقه', 'نور');
    categoryMap[cat] = (categoryMap[cat] || 0) + (e.amountInUSD || e.amount);
  });
  const categoryList = Object.entries(categoryMap)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  const steelDebt = financials.steelRemaining || 0;
  const concreteDebt = financials.concreteRemaining || 0;
  const contractorDebt = financials.contractorRemaining || 0;
  const supplierDebt = financials.supplierRemaining || 0;
  const totalDebts = steelDebt + concreteDebt + contractorDebt + supplierDebt;

  const totalUnits = apartments.length;
  const soldUnits = apartments.filter(a => a.status === 'sold').length;
  const availableUnits = apartments.filter(a => a.status === 'available').length;
  const reservedUnits = apartments.filter(a => a.status === 'reserved').length;
  const soldPercent = totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0;

  const totalSalesVal = financials.totalSales || 0;
  const salesReceived = financials.totalSalesReceived || 0;
  const salesDue = financials.salesOutstanding || 0;
  const salesReceivedPercent = totalSalesVal > 0 ? Math.min(100, Math.round((salesReceived / totalSalesVal) * 100)) : 0;

  const totalSteelTons = steelRecords.reduce((sum, s) => sum + (s.tons || (s.kg ? s.kg / 1000 : 0)), 0);
  const steelCost = steelRecords.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalConcreteM3 = concreteRecords.reduce((sum, c) => sum + c.quantityM3, 0);
  const concreteCost = concreteRecords.reduce((sum, c) => sum + c.totalAmount, 0);

  const hasNoData = 
    expenses.length === 0 && 
    payments.length === 0 && 
    steelRecords.length === 0 && 
    concreteRecords.length === 0 && 
    apartments.length === 0;

  return (
    <div className="bg-surface rounded-3xl p-4 sm:p-6 border border-line shadow-xs transition-colors">
      
      {/* Header with Title and Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-line">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-ink tracking-tight">
                {tx('Smart live charts and analysis', 'نمودارها و تحلیل هوشمند و زنده', 'هوښیار ژوندي چارټونه او شننه')}
              </h2>
              <p className="text-[11px] text-ink-muted">
                {tx('Financial progress, expenses, debts, and sales for', 'گراف‌های آماری پیشرفت مالی، مصارف، بدهی‌ها و فروشات پروژهٔ', 'د مالي پرمختګ، لګښتونو، پورونو او پلور احصایوي چارټونه د')} {projectName}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto scroll-touch no-scrollbar py-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'overview'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-surface-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tx('Overview', 'نمای کلی', 'لنډیز')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expenses_payments')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'expenses_payments'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-surface-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tx('Expenses', 'مصارف', 'لګښتونه')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('debts')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'debts'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-surface-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tx('Outstanding balances', 'بدهی‌ها', 'پاتې پورونه')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'sales'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-surface-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tx('Apartment sales', 'فروش آپارتمان', 'د اپارتمانونو پلور')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('materials')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'materials'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-surface-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tx('Steel and concrete', 'سیخ‌گول و کانکریت', 'سیخ‌ګول او کانکریټ')}
          </button>
        </div>
      </div>

      {/* Global Empty State */}
      {hasNoData ? (
        <div className="py-12 px-4 text-center">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
            {tx('No data available for charts', 'داده‌ای برای رسم نمودار موجود نیست', 'د چارټونو لپاره معلومات نشته')}
          </h3>
          <p className="text-xs text-ink-muted max-w-md mx-auto mb-4">
            {tx('Charts will appear after you record your first expense, steel or concrete invoice, or apartment sale.', 'با ثبت نخستین مصرف، فاکتور سیخ‌گول یا کانکریت، یا فروش آپارتمان، نمودارهای تحلیلی فعال می‌شوند.', 'کله چې لومړی لګښت، د سیخ‌ګول یا کانکریټو بل، یا د اپارتمان پلور ثبت کړئ، تحلیلي چارټونه به ښکاره شي.')}
          </p>
        </div>
      ) : (
        <div className="mt-4">
          
          {/* TAB 1: OVERVIEW & CASHFLOW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-amber-500" />
                    <span>{tx('Income, expenses, and payment status', 'تراز عواید، مصارف و وضعیت پرداخت‌ها', 'عواید، لګښتونه او د تادیاتو حالت')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-ink-muted">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      <span>{tx('Sales received', 'عواید فروش دریافت‌شده', 'ترلاسه شوي د پلور عواید')}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      <span>{tx('Total expenses', 'مجموع مصارف', 'ټول لګښتونه')}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                      <span>{tx('Outstanding debt', 'بدهی باقی‌مانده', 'پاتې پور')}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-700 dark:text-slate-300">{tx('Received from apartment sales', 'دریافتی از فروش آپارتمان‌ها', 'د اپارتمانونو له پلور ترلاسه شوي')}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                        ${formatNumber(financials.totalSalesReceived)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, Math.max(8, (financials.totalSalesReceived / Math.max(financials.totalSales || 1, financials.totalExpenses || 1)) * 100))}%`
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-700 dark:text-slate-300">{tx('Total expenses and commitments', 'مجموع کل مصارف و تعهدات', 'ټول لګښتونه او ژمنې')}</span>
                      <span className="text-amber-600 dark:text-amber-400 font-mono">
                        ${formatNumber(financials.totalExpenses)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, Math.max(8, (financials.totalExpenses / Math.max(financials.totalSales || 1, financials.totalExpenses || 1)) * 100))}%`
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-700 dark:text-slate-300">{tx('Cash payments made', 'مجموع پرداخت‌های نقدی انجام‌شده', 'ترسره شوې نغدي تادیې')}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-mono">
                        ${formatNumber(financials.totalPayments)} ({percentPaid}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-700"
                        style={{ width: `${percentPaid}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-700 dark:text-slate-300">{tx('Outstanding balances owed to suppliers and contractors', 'مجموع بدهی باقی‌مانده به بازار و قراردادی‌ها', 'عرضه‌کوونکو او قراردادیانو ته پاتې ټول پور')}</span>
                      <span className="text-rose-600 dark:text-rose-400 font-mono">
                        ${formatNumber(financials.totalOutstanding)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-rose-500 h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, Math.max(8, (financials.totalOutstanding / Math.max(1, financials.totalExpenses)) * 100))}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-ink-muted">
                    {tx('Project cash balance (receipts minus payments):', 'تراز نقدی پروژه (عواید دریافت‌شده منهای کل پرداخت‌ها):', 'د پروژې نغدي بیلانس (ترلاسه شوي عواید منفي ټولې تادیې):')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-xl font-black font-mono text-xs flex items-center gap-1 ${
                      financials.netPosition >= 0 
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    }`}>
                      {financials.netPosition >= 0 ? (
                        <>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>{tx('Surplus:', 'مازاد:', 'اضافي پیسې:')} +${formatNumber(financials.netPosition)}</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>{tx('Cash shortfall:', 'کمبود نقدینگی:', 'د نغدو پیسو کموالی:')} -${formatNumber(Math.abs(financials.netPosition))}</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
                  <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-1">{tx('Rebar used', 'سیخ‌گول مصرف‌شده', 'کارول شوی سیخ‌ګول')}</div>
                  <div className="text-base sm:text-lg font-black text-amber-900 dark:text-amber-100 font-mono">
                    {formatNumber(totalSteelTons, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-xs font-normal">{tx('tonnes', 'تن', 'ټنه')}</span>
                  </div>
                  <div className="text-[10px] text-amber-700/80 dark:text-amber-400 mt-1 font-mono">
                    ${formatNumber(steelCost)}
                  </div>
                </div>
                <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                  <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-1">{tx('Concrete poured', 'کانکریت‌ریزی', 'اچول شوی کانکریټ')}</div>
                  <div className="text-base sm:text-lg font-black text-emerald-900 dark:text-emerald-100 font-mono">
                    {formatNumber(totalConcreteM3, { maximumFractionDigits: 0 })} <span className="text-xs font-normal">m³</span>
                  </div>
                  <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400 mt-1 font-mono">
                    ${formatNumber(concreteCost)}
                  </div>
                </div>
                <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40">
                  <div className="text-[11px] font-bold text-blue-800 dark:text-blue-300 mb-1">{tx('Units sold', 'واحدهای فروخته‌شده', 'پلورل شوي واحدونه')}</div>
                  <div className="text-base sm:text-lg font-black text-blue-900 dark:text-blue-100 font-mono">
                    <span>{formatNumber(soldUnits)} {tx('of', 'از', 'له')} {formatNumber(totalUnits)} ({formatNumber(soldPercent)}%)</span>
                  </div>
                  <div className="text-[10px] text-blue-700/80 dark:text-blue-400 mt-1">
                    {formatNumber(availableUnits)} {tx('available units', 'واحد خالی', 'شته واحدونه')}
                  </div>
                </div>
                <div className="p-3 sm:p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40">
                  <div className="text-[11px] font-bold text-rose-800 dark:text-rose-300 mb-1">{tx('Total outstanding debts', 'مجموع بدهی به طلبکاران', 'ټول پاتې پورونه')}</div>
                  <div className="text-base sm:text-lg font-black text-rose-900 dark:text-rose-100 font-mono">
                    ${formatNumber(totalDebts)}
                  </div>
                  <div className="text-[10px] text-rose-700/80 dark:text-rose-400 mt-1">
                    {tx('Steel, concrete, and other', 'سیخ‌گول، کانکریت و سایر موارد', 'سیخ‌ګول، کانکریټ او نور')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXPENSES & PAYMENTS */}
          {activeTab === 'expenses_payments' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-amber-500" />
                    <span>{tx('Expenses by category', 'تفکیک مصارف بر اساس دسته‌بندی', 'د لګښتونو وېش د کټګورۍ له مخې')} ({formatNumber(categoryList.length)} {tx('categories', 'دسته', 'کټګورۍ')})</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                    {tx('Total:', 'مجموع:', 'ټول:')} ${formatNumber(totalExp)}
                  </span>
                </div>
                {categoryList.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">{tx('No expenses recorded to display.', 'مصرفی برای نمایش ثبت نشده است.', 'د ښودلو لپاره لګښتونه نه دي ثبت شوي.')}</p>
                ) : (
                  <div className="space-y-2.5">
                    {categoryList.slice(0, 8).map((cat, idx) => {
                      const share = totalExp > 0 ? Math.round((cat.amount / totalExp) * 100) : 0;
                      const colors = [
                        'bg-amber-500', 
                        'bg-blue-500', 
                        'bg-emerald-500', 
                        'bg-purple-500', 
                        'bg-orange-500', 
                        'bg-teal-500', 
                        'bg-rose-500', 
                        'bg-indigo-500'
                      ];
                      const barColor = colors[idx % colors.length];
                      return (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${barColor}`} />
                              <span>{cat.name}</span>
                            </span>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-ink-muted text-[11px]">{share}%</span>
                              <span className="font-bold text-ink">${formatNumber(cat.amount)}</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                              style={{ width: `${Math.max(3, share)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DEBTS */}
          {activeTab === 'debts' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <span>{tx('Outstanding balances by supplier and contractor', 'تفکیک بدهی‌های باقی‌مانده به بازار و طلبکاران', 'عرضه‌کوونکو او قراردادیانو ته د پاتې پورونو وېش')}</span>
                  </h3>
                  <span className="text-xs font-mono font-black text-rose-600 dark:text-rose-400">
                    {tx('Total:', 'مجموع:', 'ټول:')} ${formatNumber(totalDebts)}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-surface border border-line/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200">{tx('Rebar and steel products', 'سیخ‌گول و آهن‌آلات', 'سیخ‌ګول او اوسپنیز توکي')}</div>
                        <div className="text-[10px] text-slate-400">{tx('Steel mills and rebar suppliers', 'کارخانه‌ها و عرضه‌کنندگان سیخ‌گول', 'د سیخ‌ګول فابریکې او عرضه‌کوونکي')}</div>
                      </div>
                    </div>
                    <div className="text-end font-mono">
                      <div className="font-black text-xs text-rose-600 dark:text-rose-400">${formatNumber(steelDebt)}</div>
                      <div className="text-[10px] text-slate-500">{tx('Paid:', 'پرداخت‌شده:', 'ورکړل شوي:')} ${formatNumber(financials.steelPaid)}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface border border-line/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <CircleDot className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200">{tx('Ready-mix concrete and pump', 'کانکریت آماده و پمپ', 'چمتو کانکریټ او پمپ')}</div>
                        <div className="text-[10px] text-slate-400">{tx('Batching plant and mixer transport', 'بچینگ پلنت و انتقال موترهای میکسر', 'د بېچنګ دستګاه او د مکسر موټرو لېږد')}</div>
                      </div>
                    </div>
                    <div className="text-end font-mono">
                      <div className="font-black text-xs text-rose-600 dark:text-rose-400">${formatNumber(concreteDebt)}</div>
                      <div className="text-[10px] text-slate-500">{tx('Paid:', 'پرداخت‌شده:', 'ورکړل شوي:')} ${formatNumber(financials.concretePaid)}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface border border-line/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <HardHat className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200">{tx('Contractors and tradespeople', 'قراردادی‌ها و استادکاران', 'قراردادیان او کسبه‌کاران')}</div>
                        <div className="text-[10px] text-slate-400">{tx('Formwork, masonry, electrical, and plumbing', 'قالب‌بندی، خشت‌کاری، برق‌کاری و نلدوانی', 'قالب‌بندي، خښته‌کاري، برېښنا او نلدواني')}</div>
                      </div>
                    </div>
                    <div className="text-end font-mono">
                      <div className="font-black text-xs text-rose-600 dark:text-rose-400">${formatNumber(contractorDebt)}</div>
                      <div className="text-[10px] text-slate-500">{tx('Paid:', 'پرداخت‌شده:', 'ورکړل شوي:')} ${formatNumber(financials.contractorPaid)}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface border border-line/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200">{tx('Other material suppliers', 'سایر عرضه‌کنندگان مصالح', 'د توکو نور عرضه‌کوونکي')}</div>
                        <div className="text-[10px] text-slate-400">{tx('Cement, sand, gravel, and building supplies', 'سمنت، ریگ، جغل و لوازم ساختمانی', 'سمنټ، شګه، جغل او د ودانۍ توکي')}</div>
                      </div>
                    </div>
                    <div className="text-end font-mono">
                      <div className="font-black text-xs text-rose-600 dark:text-rose-400">${formatNumber(supplierDebt)}</div>
                      <div className="text-[10px] text-slate-500">{tx('Paid:', 'پرداخت‌شده:', 'ورکړل شوي:')} ${formatNumber(financials.supplierPaid)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: APARTMENT SALES */}
          {activeTab === 'sales' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Home className="w-4 h-4 text-emerald-500" />
                    <span>{tx('Apartment sales and installment receipts', 'آمار فروش و دریافت اقساط آپارتمان‌ها', 'د اپارتمانونو پلور او د قسطونو ترلاسه کول')} ({formatNumber(totalUnits)} {tx('units', 'واحد', 'واحدونه')})</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {tx('Total contract value:', 'ارزش کل قراردادها:', 'د تړونونو ټول ارزښت:')} ${formatNumber(totalSalesVal)}
                  </span>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-700 dark:text-slate-300">
                        {tx('Units sold:', 'واحدهای فروخته‌شده:', 'پلورل شوي واحدونه:')} {formatNumber(soldUnits)} {tx('of', 'از', 'له')} {formatNumber(totalUnits)}
                      </span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatNumber(soldPercent)}% {tx('sold', 'فروخته‌شده', 'پلورل شوي')}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-500"
                        style={{ width: `${soldPercent}%` }}
                      />
                      <div 
                        className="bg-slate-300 dark:bg-slate-600 h-full transition-all duration-500"
                        style={{ width: `${100 - soldPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700">
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-700 dark:text-slate-300">
                        {tx('Installment payments received', 'مبالغ دریافت‌شده از اقساط', 'د قسطونو له لارې ترلاسه شوې پیسې')}
                      </span>
                      <span className="font-mono text-blue-600 dark:text-blue-400">{formatNumber(salesReceivedPercent)}% {tx('received', 'دریافت‌شده', 'ترلاسه شوي')}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-500"
                        style={{ width: `${salesReceivedPercent}%` }}
                      />
                      <div 
                        className="bg-amber-400 h-full transition-all duration-500"
                        style={{ width: `${100 - salesReceivedPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-mono mt-1">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                        {tx('Received:', 'دریافت‌شده:', 'ترلاسه شوي:')} ${formatNumber(salesReceived)}
                      </span>
                      <span className="text-amber-700 dark:text-amber-400 font-bold">
                        {tx('Outstanding:', 'طلب باقی‌مانده:', 'پاتې طلب:')} ${formatNumber(salesDue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MATERIALS */}
          {activeTab === 'materials' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <h4 className="text-xs font-black text-blue-950 dark:text-blue-200">{tx('Rebar (steel)', 'سیخ‌گول (فولاد)', 'سیخ‌ګول (فولاد)')}</h4>
                        <p className="text-[10px] text-blue-700 dark:text-blue-400">{tx('Deliveries:', 'تعداد محموله‌ها:', 'لېږدونې:')} {formatNumber(steelRecords.length)}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black font-mono text-blue-900 dark:text-blue-100">
                      {formatNumber(totalSteelTons, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {tx('tonnes', 'تن', 'ټنه')}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>{tx('Total value:', 'ارزش کل:', 'ټول ارزښت:')}</span>
                      <span className="font-mono font-bold">${formatNumber(steelCost)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                      <span>{tx('Paid:', 'پرداخت‌شده:', 'ورکړل شوي:')}</span>
                      <span className="font-mono font-bold">${formatNumber(financials.steelPaid)}</span>
                    </div>
                    <div className="flex justify-between text-rose-700 dark:text-rose-400 pt-1 border-t border-blue-200 dark:border-blue-800/60">
                      <span>{tx('Outstanding:', 'باقی‌داری:', 'پاتې:')}</span>
                      <span className="font-mono font-bold">${formatNumber(steelDebt)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CircleDot className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <h4 className="text-xs font-black text-emerald-950 dark:text-emerald-200">{tx('Ready-mix concrete', 'کانکریت آماده', 'چمتو کانکریټ')}</h4>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400">{tx('Tickets:', 'تعداد تکت‌ها:', 'ټکټونه:')} {formatNumber(concreteRecords.length)}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black font-mono text-emerald-900 dark:text-emerald-100">
                      {formatNumber(totalConcreteM3, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m³
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>{tx('Total value:', 'ارزش کل:', 'ټول ارزښت:')}</span>
                      <span className="font-mono font-bold">${formatNumber(concreteCost)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                      <span>{tx('Paid:', 'پرداخت‌شده:', 'ورکړل شوي:')}</span>
                      <span className="font-mono font-bold">${formatNumber(financials.concretePaid)}</span>
                    </div>
                    <div className="flex justify-between text-rose-700 dark:text-rose-400 pt-1 border-t border-emerald-200 dark:border-emerald-800/60">
                      <span>{tx('Outstanding:', 'باقی‌داری:', 'پاتې:')}</span>
                      <span className="font-mono font-bold">${formatNumber(concreteDebt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
