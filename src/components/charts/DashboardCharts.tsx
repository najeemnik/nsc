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
  const financials = props.financials || appContext.currentFinancials;
  const expenses = props.expenses || appContext.expenses;
  const payments = props.payments || appContext.payments;
  const steelRecords = props.steelRecords || appContext.steelRecords;
  const concreteRecords = props.concreteRecords || appContext.concreteRecords;
  const apartments = props.apartments || appContext.apartments;
  const contractors = props.contractors || appContext.contractors;
  const suppliers = props.suppliers || appContext.suppliers;
  const projectName = props.projectName || appContext.currentProject?.name || 'پروژه جاری';
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
    const cat = e.category || 'متفرقه';
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
                نمودارها و تحلیل زنده هوشمند
              </h2>
              <p className="text-[11px] text-ink-muted">
                گراف‌های آماری پیشرفت مالی، مصارف، بدهی‌ها و فروشات {projectName}
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
            تراز کل
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
            تفکیک مصارف
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
            طلبکاران
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
            فروش آپارتمان
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
            سیخ و کانکریت
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
            داده‌ای برای رسم نمودار موجود نیست
          </h3>
          <p className="text-xs text-ink-muted max-w-md mx-auto mb-4">
            با ثبت اولین مصارف، فاکتورهای سیخ، کانکریت یا فروش آپارتمان، گراف‌های تحلیلی فوراً فعال می‌شوند.
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
                    <span>تراز درآمدی، مصارف و وضعیت پرداختی‌ها</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-ink-muted">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      <span>وصول فروشات</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      <span>کل مصارف</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                      <span>قرضداری</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-700 dark:text-slate-300">دریافتی از فروش آپارتمان‌ها</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                        ${financials.totalSalesReceived.toLocaleString()}
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
                      <span className="text-slate-700 dark:text-slate-300">مجموع کل مصارف و تعهدات</span>
                      <span className="text-amber-600 dark:text-amber-400 font-mono">
                        ${financials.totalExpenses.toLocaleString()}
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
                      <span className="text-slate-700 dark:text-slate-300">مجموع پرداختی‌های نقدی انجام‌شده</span>
                      <span className="text-blue-600 dark:text-blue-400 font-mono">
                        ${financials.totalPayments.toLocaleString()} ({percentPaid}%)
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
                      <span className="text-slate-700 dark:text-slate-300">کل قرضداری باقیمانده به بازار و قراردادی‌ها</span>
                      <span className="text-rose-600 dark:text-rose-400 font-mono">
                        ${financials.totalOutstanding.toLocaleString()}
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
                    تراز نقدی پروژه (عواید وصول شده منفی کل پرداختی‌ها):
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
                          <span>مازاد مثبت: +${financials.netPosition.toLocaleString()}</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>کسری نقدینگی: -${Math.abs(financials.netPosition).toLocaleString()}</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
                  <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-1">سیخ مصرفی</div>
                  <div className="text-base sm:text-lg font-black text-amber-900 dark:text-amber-100 font-mono">
                    {totalSteelTons.toFixed(1)} <span className="text-xs font-normal">تن</span>
                  </div>
                  <div className="text-[10px] text-amber-700/80 dark:text-amber-400 mt-1 font-mono">
                    ${steelCost.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                  <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-1">کانکریت‌ریزی</div>
                  <div className="text-base sm:text-lg font-black text-emerald-900 dark:text-emerald-100 font-mono">
                    {totalConcreteM3.toFixed(0)} <span className="text-xs font-normal">m³</span>
                  </div>
                  <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400 mt-1 font-mono">
                    ${concreteCost.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40">
                  <div className="text-[11px] font-bold text-blue-800 dark:text-blue-300 mb-1">واحدهای فروخته شده</div>
                  <div className="text-base sm:text-lg font-black text-blue-900 dark:text-blue-100 font-mono">
                    {soldUnits} <span className="text-xs font-normal">از {totalUnits} ({soldPercent}%)</span>
                  </div>
                  <div className="text-[10px] text-blue-700/80 dark:text-blue-400 mt-1">
                    {availableUnits} واحد خالی
                  </div>
                </div>
                <div className="p-3 sm:p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40">
                  <div className="text-[11px] font-bold text-rose-800 dark:text-rose-300 mb-1">کل طلبکاری طلبکاران</div>
                  <div className="text-base sm:text-lg font-black text-rose-900 dark:text-rose-100 font-mono">
                    ${totalDebts.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-rose-700/80 dark:text-rose-400 mt-1">
                    سیخ، کانکریت و متفرقه
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
                    <span>تفکیک هزینه‌ها بر اساس دسته‌بندی ({categoryList.length} دسته)</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                    مجموع: ${totalExp.toLocaleString()}
                  </span>
                </div>
                {categoryList.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">مصرفی برای نمایش ثبت نشده است.</p>
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
                              <span className="font-bold text-ink">${cat.amount.toLocaleString()}</span>
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
                    <span>تفکیک قرضداری‌های باقیمانده به بازار و طلبکاران</span>
                  </h3>
                  <span className="text-xs font-mono font-black text-rose-600 dark:text-rose-400">
                    مجموع کل: ${totalDebts.toLocaleString()}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-surface border border-line/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200">سیخ‌گول و آهن‌آلات</div>
                        <div className="text-[10px] text-slate-400">فابریکات و تأمین‌کنندگان سیخ</div>
                      </div>
                    </div>
                    <div className="text-end font-mono">
                      <div className="font-black text-xs text-rose-600 dark:text-rose-400">${steelDebt.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">پرداخت‌شده: ${financials.steelPaid.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface border border-line/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <CircleDot className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200">کانکریت آماده و پمپ</div>
                        <div className="text-[10px] text-slate-400">بچینگ پلنت و ترانسپورت مکسر</div>
                      </div>
                    </div>
                    <div className="text-end font-mono">
                      <div className="font-black text-xs text-rose-600 dark:text-rose-400">${concreteDebt.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">پرداخت‌شده: ${financials.concretePaid.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface border border-line/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <HardHat className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200">قراردادی‌ها و استادکاران</div>
                        <div className="text-[10px] text-slate-400">قالب‌بندی، خشت‌کاری، برق و نل‌دوانی</div>
                      </div>
                    </div>
                    <div className="text-end font-mono">
                      <div className="font-black text-xs text-rose-600 dark:text-rose-400">${contractorDebt.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">پرداخت‌شده: ${financials.contractorPaid.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface border border-line/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200">سایر تأمین‌کنندگان مصالح</div>
                        <div className="text-[10px] text-slate-400">سمنت، ریگ، جغله و لوازم ساختمانی</div>
                      </div>
                    </div>
                    <div className="text-end font-mono">
                      <div className="font-black text-xs text-rose-600 dark:text-rose-400">${supplierDebt.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">پرداخت‌شده: ${financials.supplierPaid.toLocaleString()}</div>
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
                    <span>آمار فروش و وصول اقساط آپارتمان‌ها ({totalUnits} واحد)</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ارزش کل قراردادها: ${totalSalesVal.toLocaleString()}
                  </span>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-700 dark:text-slate-300">
                        واحدهای فروخته شده: {soldUnits} از {totalUnits}
                      </span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">{soldPercent}% فروخته شده</span>
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
                        مبالغ دریافت شده از اقساط
                      </span>
                      <span className="font-mono text-blue-600 dark:text-blue-400">{salesReceivedPercent}% وصول شده</span>
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
                        وصول شده: ${salesReceived.toLocaleString()}
                      </span>
                      <span className="text-amber-700 dark:text-amber-400 font-bold">
                        طلب باقیمانده: ${salesDue.toLocaleString()}
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
                        <h4 className="text-xs font-black text-blue-950 dark:text-blue-200">سیخ‌گول (فولاد)</h4>
                        <p className="text-[10px] text-blue-700 dark:text-blue-400">تعداد محموله‌ها: {steelRecords.length}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black font-mono text-blue-900 dark:text-blue-100">
                      {totalSteelTons.toFixed(2)} تن
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>ارزش کل:</span>
                      <span className="font-mono font-bold">${steelCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                      <span>پرداخت شده:</span>
                      <span className="font-mono font-bold">${financials.steelPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-rose-700 dark:text-rose-400 pt-1 border-t border-blue-200 dark:border-blue-800/60">
                      <span>باقی‌داری:</span>
                      <span className="font-mono font-bold">${steelDebt.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CircleDot className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <h4 className="text-xs font-black text-emerald-950 dark:text-emerald-200">کانکریت آماده</h4>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400">تعداد تکت‌ها: {concreteRecords.length}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black font-mono text-emerald-900 dark:text-emerald-100">
                      {totalConcreteM3.toFixed(1)} m³
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>ارزش کل:</span>
                      <span className="font-mono font-bold">${concreteCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                      <span>پرداخت شده:</span>
                      <span className="font-mono font-bold">${financials.concretePaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-rose-700 dark:text-rose-400 pt-1 border-t border-emerald-200 dark:border-emerald-800/60">
                      <span>باقی‌داری:</span>
                      <span className="font-mono font-bold">${concreteDebt.toLocaleString()}</span>
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
