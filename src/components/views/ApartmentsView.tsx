import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { localizeText } from '../../i18n/localize';
import { 
  Home, 
  Plus, 
  Search, 
  User, 
  Phone, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Lock, 
  DollarSign, 
  Printer, 
  Key,
  FileText,
  X,
  Calendar,
  Building2,
  CreditCard,
  Coins
} from 'lucide-react';
import { ApartmentUnit } from '../../types';

interface ApartmentsViewProps {
  onOpenAddApartment: () => void;
}

export const ApartmentsView: React.FC<ApartmentsViewProps> = ({ onOpenAddApartment }) => {
  const { 
    currentProject, 
    apartments, 
    deleteApartment, 
    formatCurrency, 
    formatNumber, 
    isApartmentsUnlocked, 
    unlockApartments, 
    t, 
    language 
  } = useApp();
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'reserved' | 'sold'>('all');
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState<ApartmentUnit | null>(null);

  const projectApartments = useMemo(() => {
    return apartments.filter(a => a.projectId === currentProject?.id);
  }, [apartments, currentProject]);

  const filteredApartments = useMemo(() => {
    return projectApartments.filter(a => {
      const matchesSearch = 
        (a.unitNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.buyerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.buyerPhone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.unitType || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projectApartments, searchTerm, statusFilter]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockApartments(passwordInput)) {
      setPasswordError(false);
      setPasswordInput('');
    } else {
      setPasswordError(true);
    }
  };

  const handleDelete = (id: string, unitNumber: string) => {
    if (confirm(t('confirmDeleteApartment') || `Are you sure you want to delete apartment "${unitNumber}"?`)) {
      deleteApartment(id);
    }
  };

  // If section is password protected and not unlocked yet:
  if (!isApartmentsUnlocked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface rounded-3xl p-8 border border-line shadow-xl text-center">
          <div className="w-16 h-16 bg-fuchsia-50 dark:bg-fuchsia-950/50 text-fuchsia-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">
            {t('apartmentsProtected') || 'Apartment Sales & Clients Section'}
          </h2>
          <p className="text-xs text-ink-muted mb-6">
            {t('apartmentsPasswordDesc') || 'This section contains sensitive client data and sales revenues. Enter master security PIN to proceed.'}
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder={t('enterPassword') || 'Enter Security PIN (e.g. 1234)'}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className={`w-full px-4 py-3 bg-surface-2 border rounded-2xl text-center text-sm font-bold tracking-widest focus:outline-none ${
                  passwordError ? 'border-rose-500' : 'border-line'
                }`}
                autoFocus
              />
              {passwordError && (
                <p className="text-xs text-rose-500 mt-1.5">{t('incorrectPassword') || 'Incorrect PIN code'}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-fuchsia-500/25 transition"
            >
              {t('unlockSection') || t("unlock")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Calculate sales stats
  const totalUnits = projectApartments.length;
  const soldUnits = projectApartments.filter(a => a.status === 'sold').length;
  const totalSalesRevenueUSD = projectApartments
    .filter(a => a.status === 'sold')
    .reduce((sum, a) => sum + (a.totalPriceUSD || 0), 0);
  const totalCashCollectedUSD = projectApartments
    .filter(a => a.status === 'sold')
    .reduce((sum, a) => sum + (a.downPaymentUSD || 0) + (a.paidAmountUSD || 0), 0);
  const totalUnpaidInstallmentsUSD = Math.max(0, totalSalesRevenueUSD - totalCashCollectedUSD);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink flex items-center gap-2.5">
            <Home className="w-6 h-6 text-fuchsia-600 dark:text-fuchsia-400" />
            <span>{t('apartmentsAndSales') || 'Apartment Units & Sales Portfolio'}</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            {currentProject?.name} • {soldUnits}/{totalUnits} {t('unitsSold') || 'Units Sold'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4" />
            <span>{t('print') || t("print")}</span>
          </button>

          <button
            onClick={onOpenAddApartment}
            className="flex items-center gap-2 px-4 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-fuchsia-500/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addApartment') || t("addUnit")}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-sm">
          <span className="text-xs text-slate-400 font-medium">{t('totalSalesContract') || 'Total Sales Contract'}</span>
          <p className="text-xl font-black text-ink mt-1">{formatCurrency(totalSalesRevenueUSD, 'USD')}</p>
        </div>
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-sm">
          <span className="text-xs text-slate-400 font-medium">{t('cashReceived') || 'Cash Received'}</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(totalCashCollectedUSD, 'USD')}</p>
        </div>
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-sm">
          <span className="text-xs text-slate-400 font-medium">{t('receivableInstallments') || 'Pending Installments'}</span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(totalUnpaidInstallmentsUSD, 'USD')}</p>
        </div>
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-sm">
          <span className="text-xs text-slate-400 font-medium">{t('occupancyRate') || 'Sales Status'}</span>
          <p className="text-xl font-black text-fuchsia-600 dark:text-fuchsia-400 mt-1">
            {totalUnits ? Math.round((soldUnits / totalUnits) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="p-4 rounded-2xl bg-surface border border-line flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchApartments') || 'Search unit #, floor, buyer name...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-2/80 border border-line rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e: any) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-surface-2/80 border border-line rounded-xl text-xs focus:outline-none"
        >
          <option value="all">{t('allApartments') || 'All Units'}</option>
          <option value="available">{t('available') || 'Available for Sale'}</option>
          <option value="reserved">{t('reserved') || t("accUnitReserved")}</option>
          <option value="sold">{t('sold') || t("accUnitSold")}</option>
        </select>
      </div>

      {/* Apartments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApartments.map(apt => (
          <div 
            key={apt.id}
            className="p-6 rounded-3xl bg-surface border border-line shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-fuchsia-50 dark:bg-fuchsia-950/50 text-fuchsia-600 dark:text-fuchsia-400 rounded-2xl">
                    <Home className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-ink">
                      {t('apartmentUnit') || t("accUnitColUnit")} {apt.unitNumber}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {t('floor') || t("floorNumber")} {apt.floor} • {apt.areaSqm} m² ({apt.roomsCount || 2} {t('rooms')})
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                  apt.status === 'sold'
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : apt.status === 'reserved'
                    ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                    : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                }`}>
                  {apt.status === 'sold' ? t('sold') || t("accUnitSold") : apt.status === 'reserved' ? t('reserved') || t("accUnitReserved") : t('available') || t("accUnitAvailable")}
                </span>
              </div>

              {/* Price Details */}
              <div className="p-3.5 rounded-2xl bg-surface-2/50 border border-line space-y-2 text-xs mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{t('totalPrice') || 'Total Price'}:</span>
                  <span className="font-black text-ink">{formatCurrency(apt.totalPriceUSD, 'USD')}</span>
                </div>

                {apt.status === 'sold' && (
                  <>
                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                      <span>{t('paidAmount') || 'Collected'}:</span>
                      <span className="font-bold">{formatCurrency((apt.downPaymentUSD || 0) + (apt.paidAmountUSD || 0), 'USD')}</span>
                    </div>
                    <div className="flex justify-between items-center text-amber-600 dark:text-amber-400 font-semibold pt-1 border-t border-line/60">
                      <span>{t('remainingDue') || t("budgetColRemaining")}:</span>
                      <span>{formatCurrency(Math.max(0, (apt.totalPriceUSD || 0) - (apt.downPaymentUSD || 0) - (apt.paidAmountUSD || 0)), 'USD')}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Buyer info if sold */}
              {apt.buyerName && (
                <div className="space-y-1.5 text-xs text-ink-muted mb-4 p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{apt.buyerName}</span>
                  </div>
                  {apt.buyerPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`tel:${apt.buyerPhone}`} className="hover:underline font-mono">{apt.buyerPhone}</a>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-line">
              {(apt.status === 'sold' || apt.status === 'reserved') ? (
                <button
                  type="button"
                  onClick={() => setSelectedApartment(apt)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-fuchsia-50 hover:bg-fuchsia-100 dark:bg-fuchsia-950/40 dark:hover:bg-fuchsia-900/40 text-fuchsia-700 dark:text-fuchsia-300 rounded-xl text-xs font-bold transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{tx('Installment and account ledger', 'دفترچه اقساط و حساب', 'د قسطونو او حساب ثبت')}</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-400 font-semibold">{tx('Ready for transfer and sale', 'آماده واگذاری و فروش', 'د لېږد او پلور لپاره چمتو')}</span>
              )}

              <button
                onClick={() => handleDelete(apt.id, apt.unitNumber)}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                title={tx('Delete unit', 'حذف واحد', 'واحد ړنګول')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Apartment Installment Schedule & Financial Ledger Modal */}
      {selectedApartment && (() => {
        const totalCost = selectedApartment.totalPriceUSD || 0;
        const downPay = selectedApartment.downPaymentUSD || 0;
        const paidInst = selectedApartment.paidAmountUSD || 0;
        const totalPaid = downPay + paidInst;
        const remainingDue = Math.max(0, totalCost - totalPaid);
        const percentCollected = totalCost > 0 ? Math.min(100, Math.round((totalPaid / totalCost) * 100)) : 0;

        // Realistic Construction Installment Milestones
        const milestones = [
          { phase: tx('Contract down payment (Initial Down Payment)', 'پیش‌پرداخت عقد قرارداد', 'د تړون لومړنۍ پیشکي'), percent: 30, amount: totalCost * 0.30, status: 'paid', date: tx('At contract signing', 'در بدو قرارداد', 'د تړون پر مهال') },
          { phase: tx('Concrete frame and floor slabs completed', 'اتمام اسکلت بتنی و سقف طبقات', 'د کانکریټي چوکاټ او چتونو بشپړېدل'), percent: 25, amount: totalCost * 0.25, status: totalPaid >= (totalCost * 0.55) ? 'paid' : 'pending', date: tx('Concrete frame completed', 'تکمیل اسکلت', 'د کانکریټي چوکاټ بشپړېدل') },
          { phase: tx('Masonry and building services (MEP)', 'اتمام دیوارچینی و تأسیسات', 'د دېوالونو او ودانیزو تاسیساتو بشپړېدل'), percent: 20, amount: totalCost * 0.20, status: totalPaid >= (totalCost * 0.75) ? 'paid' : 'pending', date: tx('Masonry and rough-in completed', 'تکمیل سفت‌کاری', 'د خښتو کار او لومړنیو تاسیساتو بشپړېدل') },
          { phase: tx('Plaster, tile and finishing work', 'گچ‌کاری، کاشی و نازک‌کاری', 'پلستر، کاشي او وروستي کارونه'), percent: 15, amount: totalCost * 0.15, status: totalPaid >= (totalCost * 0.90) ? 'paid' : 'pending', date: tx('Finishing work completed', 'تکمیل نازک‌کاری', 'د وروستیو کارونو بشپړېدل') },
          { phase: tx('Key handover and final deed', 'تحویل کلید و اسناد رسمی', 'د کیلي سپارل او رسمي سند'), percent: 10, amount: totalCost * 0.10, status: remainingDue === 0 ? 'paid' : 'pending', date: tx('At key handover', 'زمان تحویل کلید', 'د کیلي سپارلو پر مهال') },
        ];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-4xl bg-surface border border-line rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-line bg-gradient-to-r from-fuchsia-600/10 via-purple-600/5 to-transparent shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/20 text-fuchsia-600 flex items-center justify-center font-bold">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-ink flex items-center gap-2">
                      <span>{tx('Financial statement for unit', 'کارنامه مالی واحد', 'د واحد مالي صورت‌حساب')} {selectedApartment.unitNumber} ({tx('Floor', 'طبقه', 'پوړ')} {selectedApartment.floor})</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-600 font-bold">
                        {selectedApartment.areaSqm} {tx('m²', 'متر مربع', 'مربع متر')}
                      </span>
                    </h2>
                    <p className="text-xs text-ink-muted">
                      {tx('Buyer:', 'خریدار:', 'پېرودونکی:')} <strong className="text-ink">{selectedApartment.buyerName || tx('Not recorded', 'ثبت نشده', 'نه دی ثبت شوی')}</strong> ({selectedApartment.buyerPhone || tx('No phone', 'بدون تماس', 'اړیکه نشته')}) • {tx('Project', 'پروژه', 'پروژه')} {currentProject?.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    <span className="hidden sm:inline">{tx('Print statement', 'چاپ کارنامه', 'صورت‌حساب چاپول')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedApartment(null)}
                    className="p-2 text-slate-400 hover:text-ink rounded-xl hover:bg-surface-2 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs">
                {/* 4 Financial Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-surface-2/60 border border-line">
                    <span className="text-slate-400 font-semibold block mb-1">{tx('Total sale contract value:', 'ارزش کل قرارداد فروش:', 'د پلور د تړون ټول ارزښت:')}</span>
                    <span className="text-base font-black font-mono text-ink">
                      {formatCurrency(totalCost, 'USD')}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{tx('Fixed unit price', 'قیمت مقطوع واحد', 'د واحد ټاکل شوې بیه')}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold block mb-1">{tx('Initial down payment:', 'پیش‌پرداخت اولیه:', 'لومړنۍ پیشکي:')}</span>
                    <span className="text-base font-black font-mono text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(downPay, 'USD')}
                    </span>
                    <span className="block text-[10px] text-emerald-600/80 mt-0.5">{tx('Collected when the contract is signed', 'وصول در هنگام عقد قرارداد', 'د تړون د لاسلیک پر مهال ترلاسه کېږي')}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold block mb-1">{tx('Total cash received:', 'مجموع وصولی نقد:', 'ټولې ترلاسه شوې نغدې پیسې:')}</span>
                    <span className="text-base font-black font-mono text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(totalPaid, 'USD')}
                    </span>
                    <span className="block text-[10px] text-emerald-600/80 mt-0.5">{tx('Down payment + installments received', 'پیش‌پرداخت + اقساط واریزی', 'پیشکي + ترلاسه شوي قسطونه')}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-2/60 border border-line">
                    <span className="text-amber-600 dark:text-amber-400 font-semibold block mb-1">{tx('Company receivable balance:', 'مانده مطالبات شرکت:', 'د شرکت د ترلاسه کېدونکو پیسو پاتې بیلانس:')}</span>
                    <span className="text-base font-black font-mono text-amber-600 dark:text-amber-400">
                      {formatCurrency(remainingDue, 'USD')}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{tx('Remaining installments', 'اقساط باقیمانده', 'پاتې قسطونه')}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="p-4 rounded-2xl bg-surface-2/40 border border-line space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-ink">
                    <span>{tx('Contract financial settlement progress:', 'پیشرفت تسویه مالی قرارداد:', 'د تړون د مالي تصفیې پرمختګ:')}</span>
                    <span className="font-mono text-fuchsia-600">{percentCollected}% {tx('collected', 'وصول شده', 'ترلاسه شوي')}</span>
                  </div>
                  <div className="w-full h-3 bg-surface-2 rounded-full overflow-hidden border border-line">
                    <div 
                      className="h-full bg-gradient-to-r from-fuchsia-600 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentCollected}%` }}
                    />
                  </div>
                </div>

                {/* Milestones Schedule Table */}
                <div className="border border-line rounded-2xl overflow-hidden">
                  <div className="p-3 bg-surface-2 font-black text-xs text-ink flex items-center justify-between">
                    <span>{tx('Construction milestones and buyer installment schedule', 'جدول زمان‌بندی مراحل پیشرفت کار و اقساط خریدار', 'د ودانیزو پړاوونو او د پېرودونکي د قسطونو مهال‌وېش')}</span>
                    <span className="text-[11px] font-mono text-slate-400">{tx('5 approved milestones', '۵ مرحله مصوب', '۵ منل شوي پړاوونه')}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead className="bg-surface-2/40 border-b border-line text-slate-500 font-bold">
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5">{tx('Project milestone and physical progress', 'مرحله و پیشرفت فیزیکی پروژه', 'د پروژې پړاو او فزیکي پرمختګ')}</th>
                          <th className="p-2.5 text-center">{tx('Percent', 'درصد', 'سلنه')}</th>
                          <th className="p-2.5 text-left">{tx('Installment amount (USD)', 'مبلغ قسط (USD)', 'د قسط اندازه (USD)')}</th>
                          <th className="p-2.5">{tx('Milestone due date', 'سررسید مرحله', 'د پړاو د ورکړې نېټه')}</th>
                          <th className="p-2.5 text-center">{tx('Settlement status', 'وضعیت تسویه', 'د تصفیې حالت')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {milestones.map((m, idx) => (
                          <tr key={idx} className="hover:bg-surface-2/30">
                            <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-2.5 font-semibold text-ink">{m.phase}</td>
                            <td className="p-2.5 text-center font-mono">{m.percent}%</td>
                            <td className="p-2.5 text-left font-mono font-bold text-ink">{formatCurrency(m.amount, 'USD')}</td>
                            <td className="p-2.5 font-mono text-slate-400">{m.date}</td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                m.status === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-amber-500/10 text-amber-600'
                              }`}>
                                {m.status === 'paid' ? tx('Paid', 'وصول شد', 'ترلاسه شوی') : tx('Awaiting due date', 'در انتظار سررسید', 'د نېټې په تمه')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-line bg-surface-2 flex items-center justify-between shrink-0">
                <span className="text-slate-400 text-[11px]">
                  {tx('Contract status:', 'وضعیت قرارداد:', 'د تړون حالت:')} {remainingDue <= 0 ? tx('Fully paid (100% settled)', 'کاملاً تسویه شده (تسویه ۱۰۰٪)', 'بشپړ ورکړل شوی (۱۰۰٪ تصفیه)') : tx('Installments remain due', 'دارای اقساط موعد مقرر', 'قسطونه لا پاتې دي')}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedApartment(null)}
                  className="px-5 py-2 rounded-xl bg-surface hover:bg-slate-200 dark:hover:bg-slate-700 text-ink font-bold"
                >{t("close")}</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
