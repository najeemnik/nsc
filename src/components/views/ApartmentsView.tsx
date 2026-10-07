import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
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
              {t('unlockSection') || 'Unlock Section'}
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
            <span>{t('print') || 'Print'}</span>
          </button>

          <button
            onClick={onOpenAddApartment}
            className="flex items-center gap-2 px-4 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-fuchsia-500/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addApartment') || 'Add Apartment Unit'}</span>
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
          <option value="reserved">{t('reserved') || 'Reserved'}</option>
          <option value="sold">{t('sold') || 'Sold'}</option>
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
                      {t('apartmentUnit') || 'Unit'} {apt.unitNumber}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {t('floor') || 'Floor'} {apt.floor} • {apt.areaSqm} m² ({apt.roomsCount || 2} {t('rooms')})
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
                  {apt.status === 'sold' ? t('sold') || 'Sold' : apt.status === 'reserved' ? t('reserved') || 'Reserved' : t('available') || 'Available'}
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
                      <span>{t('remainingDue') || 'Remaining'}:</span>
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
                  <span>دفترچه اقساط و حساب</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-400 font-semibold">آماده واگذاری و فروش</span>
              )}

              <button
                onClick={() => handleDelete(apt.id, apt.unitNumber)}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                title="حذف واحد"
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
          { phase: 'پیش‌پرداخت عقد قرارداد (Initial Down Payment)', percent: 30, amount: totalCost * 0.30, status: 'paid', date: 'در بدو قرارداد' },
          { phase: 'اتمام اسکلت بتنی و سقف طبقات (Concrete Structure)', percent: 25, amount: totalCost * 0.25, status: totalPaid >= (totalCost * 0.55) ? 'paid' : 'pending', date: 'تکمیل اسکلت' },
          { phase: 'اتمام دیوارچینی و تأسیسات (Masonry & MEP)', percent: 20, amount: totalCost * 0.20, status: totalPaid >= (totalCost * 0.75) ? 'paid' : 'pending', date: 'تکمیل سفت‌کاری' },
          { phase: 'گچ‌کاری، کاشی و نازک‌کاری (Finishing & Tiles)', percent: 15, amount: totalCost * 0.15, status: totalPaid >= (totalCost * 0.90) ? 'paid' : 'pending', date: 'تکمیل نازک‌کاری' },
          { phase: 'تحویل کلید و اسناد رسمی (Handover & Final Deed)', percent: 10, amount: totalCost * 0.10, status: remainingDue === 0 ? 'paid' : 'pending', date: 'زمان تحویل کلید' },
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
                      <span>کارنامه مالی واحد {selectedApartment.unitNumber} (طبقه {selectedApartment.floor})</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-600 font-bold">
                        {selectedApartment.areaSqm} متر مربع
                      </span>
                    </h2>
                    <p className="text-xs text-ink-muted">
                      خریدار: <strong className="text-ink">{selectedApartment.buyerName || 'ثبت نشده'}</strong> ({selectedApartment.buyerPhone || 'بدون تماس'}) • پروژه {currentProject?.name}
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
                    <span className="hidden sm:inline">چاپ کارنامه</span>
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
                    <span className="text-slate-400 font-semibold block mb-1">ارزش کل قرارداد فروش:</span>
                    <span className="text-base font-black font-mono text-ink">
                      {formatCurrency(totalCost, 'USD')}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">قیمت مقطوع واحد</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold block mb-1">پیش‌پرداخت اولیه:</span>
                    <span className="text-base font-black font-mono text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(downPay, 'USD')}
                    </span>
                    <span className="block text-[10px] text-emerald-600/80 mt-0.5">وصول در هنگام عقد قرارداد</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold block mb-1">مجموع وصولی نقد:</span>
                    <span className="text-base font-black font-mono text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(totalPaid, 'USD')}
                    </span>
                    <span className="block text-[10px] text-emerald-600/80 mt-0.5">پیش‌پرداخت + اقساط واریزی</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-2/60 border border-line">
                    <span className="text-amber-600 dark:text-amber-400 font-semibold block mb-1">مانده مطالبات شرکت:</span>
                    <span className="text-base font-black font-mono text-amber-600 dark:text-amber-400">
                      {formatCurrency(remainingDue, 'USD')}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">اقساط باقیمانده</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="p-4 rounded-2xl bg-surface-2/40 border border-line space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-ink">
                    <span>پیشرفت تسویه مالی قرارداد:</span>
                    <span className="font-mono text-fuchsia-600">{percentCollected}% وصول شده</span>
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
                    <span>جدول زمان‌بندی مراحل پیشرفت کار و اقساط خریدار</span>
                    <span className="text-[11px] font-mono text-slate-400">۵ مرحله مصوب</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead className="bg-surface-2/40 border-b border-line text-slate-500 font-bold">
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5">مرحله و پیشرفت فیزیکی پروژه</th>
                          <th className="p-2.5 text-center">درصد</th>
                          <th className="p-2.5 text-left">مبلغ قسط (USD)</th>
                          <th className="p-2.5">سررسید مرحله</th>
                          <th className="p-2.5 text-center">وضعیت تسویه</th>
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
                                {m.status === 'paid' ? 'وصول شد' : 'در انتظار سررسید'}
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
                  وضعیت قرارداد: {remainingDue <= 0 ? 'کاملاً تسویه شده (تسویه ۱۰۰٪)' : 'دارای اقساط موعد مقرر'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedApartment(null)}
                  className="px-5 py-2 rounded-xl bg-surface hover:bg-slate-200 dark:hover:bg-slate-700 text-ink font-bold"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
