/**
 * ============================================================================
 * Accounting Reports View (گزارش‌های حسابداری) — Phase 2
 * ============================================================================
 * Reads exclusively from the auto-generated double-entry journal
 * (AppContext.journalEntries) — the single source of bookkeeping truth:
 *
 *   • Trial Balance    — all postable accounts, Dr/Cr columns, must balance
 *   • Income Statement — revenue − expenses → net income (per project)
 *   • Balance Sheet    — Assets = Liabilities + Equity(+current income)
 *   • Journal Ledger   — every derived posting, expandable to its lines
 *
 * Amounts are USD-normalized (each posting carries its own rate).
 * ============================================================================
 */

import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  Printer,
  Scale,
  TrendingUp,
  Landmark,
  ListOrdered,
  ChevronDown,
  ChevronUp,
  Wallet,
  HardHat,
  Building2,
  Home,
  Box,
} from 'lucide-react';
import { JournalEntry } from '../../types';
import { computeWipCostBreakdown } from '../../utils/journalEngine';
import { computeUnitProfitability } from '../../utils/wipAllocation';

type ReportTab = 'trial' | 'income' | 'balance' | 'units' | 'journal';

export const AccountingView: React.FC = () => {
  const {
    currentProject,
    journalEntries,
    getTrialBalance,
    accountBalances,
    getAccountBalance,
    apartments,
    expenses,
    steelRecords,
    concreteRecords,
    formatCurrency,
    formatNumber,
    t,
    language,
    getAccountDisplayName,
  } = useApp();

  const [tab, setTab] = useState<ReportTab>('trial');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const projectId = currentProject?.id;
  const projectJournal = useMemo(
    () => (projectId ? journalEntries.filter(e => e.projectId === projectId) : journalEntries),
    [journalEntries, projectId]
  );

  const tb = useMemo(() => getTrialBalance(projectId), [getTrialBalance, projectId, journalEntries]);

  const wipBreakdown = useMemo(
    () => computeWipCostBreakdown(journalEntries, projectId),
    [journalEntries, projectId]
  );

  const unitProfit = useMemo(
    () =>
      computeUnitProfitability({
        projectId: projectId || '',
        project: currentProject ?? undefined,
        units: apartments,
        expenses,
        steelRecords,
        concreteRecords,
      }),
    [projectId, currentProject, apartments, expenses, steelRecords, concreteRecords]
  );

  const bal = (code: string) => {
    if (!projectId) return accountBalances.find(b => b.accountCode === code)?.balanceUSD ?? 0;
    return getAccountBalance(code, projectId)?.balanceUSD ?? 0;
  };

  const fmt = (n: number) => formatCurrency(n, 'USD');
  const nameOf = (r: { accountCode: string }) => getAccountDisplayName(r.accountCode, language);

  /* --------- income statement (developer model: Revenue − COGS) --------- */
  const revenueRows = tb.rows.filter(r => r.accountCode.startsWith('4'));
  const cogsRow = tb.rows.find(r => r.accountCode === '5050');
  const totalRevenue = revenueRows.reduce((s, r) => s + r.creditUSD, 0);
  const totalCogs = cogsRow?.debitUSD || 0;
  const grossProfit = totalRevenue - totalCogs;
  // Period expenses = direct 5xxx that were NOT capitalized (misc 5990
  // outflows) + operating (6xxx) + finance (7xxx) costs
  const periodExpenseRows = tb.rows.filter(
    r => (r.accountCode.startsWith('5') && r.accountCode !== '5050') || r.accountCode.startsWith('6') || r.accountCode.startsWith('7')
  );
  const totalPeriodExpenses = periodExpenseRows.reduce((s, r) => s + r.debitUSD, 0);
  const netIncome = grossProfit - totalPeriodExpenses;
  const capitalizedUSD = wipBreakdown.reduce((s, r) => s + r.totalUSD, 0);
  const wipRemainingUSD = capitalizedUSD - totalCogs;

  /* -------------------------- balance sheet --------------------------- */
  const assetRows = tb.rows.filter(r => r.accountCode.startsWith('1'));
  const liabRows = tb.rows.filter(r => r.accountCode.startsWith('2'));
  const equityRows = tb.rows.filter(r => r.accountCode.startsWith('3'));
  const totalAssets = assetRows.reduce((s, r) => s + (r.debitUSD - r.creditUSD), 0);
  const totalLiab = liabRows.reduce((s, r) => s + (r.creditUSD - r.debitUSD), 0);
  const totalEquity = equityRows.reduce((s, r) => s + (r.creditUSD - r.debitUSD), 0) + netIncome;

  const tabs: Array<{ id: ReportTab; label: string; Icon: any }> = [
    { id: 'trial', label: t('accTabTrial') || 'Trial Balance', Icon: Scale },
    { id: 'income', label: t('accTabIncome') || 'Income Statement', Icon: TrendingUp },
    { id: 'balance', label: t('accTabBalance') || 'Balance Sheet', Icon: Landmark },
    { id: 'units', label: t('accTabUnits') || 'Per-Unit Profit', Icon: Home },
    { id: 'journal', label: t('accTabJournal') || 'Journal Ledger', Icon: ListOrdered },
  ];

  const SectionHeader: React.FC<{ Icon: any; title: string; tint: string }> = ({ Icon, title, tint }) => (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black ${tint}`}>
      <Icon className="w-4 h-4" />
      <span>{title}</span>
    </div>
  );

  const TBRow: React.FC<{ code: string; name: string; dr: number; cr: number; bold?: boolean }> = ({ code, name, dr, cr, bold }) => (
    <tr className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${bold ? 'font-black bg-surface-2/40' : ''}`}>
      <td className="py-2.5 px-4 font-mono text-ink-muted">{code}</td>
      <td className="py-2.5 px-4 text-ink">{name}</td>
      <td className="py-2.5 px-4 text-end font-mono text-ink whitespace-nowrap">{dr ? fmt(dr) : '—'}</td>
      <td className="py-2.5 px-4 text-end font-mono text-ink whitespace-nowrap">{cr ? fmt(cr) : '—'}</td>
    </tr>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-violet-500" />
            <span>{t('accTitle') || 'Accounting Reports'}</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            {currentProject?.name || ''} • {t('accSubtitle') || 'Auto-generated from the double-entry journal'}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-semibold transition self-start"
        >
          <Printer className="w-4 h-4" />
          <span>{t('print') || 'Print'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-surface border border-line rounded-2xl w-fit max-w-full overflow-x-auto scroll-touch">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              tab === id ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25' : 'text-ink-muted hover:bg-surface-2'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ======================= Trial Balance ======================= */}
      {tab === 'trial' && (
        <div className="bg-surface rounded-3xl border border-line shadow-sm overflow-hidden">
          <div className="overflow-x-auto scroll-touch">
            <table className="w-full text-xs">
              <thead className="bg-surface-2/60 text-ink-muted font-bold border-b border-line">
                <tr>
                  <th className="py-3.5 px-4 text-start">{t('accColCode') || 'Code'}</th>
                  <th className="py-3.5 px-4 text-start">{t('accColAccount') || 'Account'}</th>
                  <th className="py-3.5 px-4 text-end">{t('accColDebit') || 'Debit ($)'}</th>
                  <th className="py-3.5 px-4 text-end">{t('accColCredit') || 'Credit ($)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tb.rows.map(r => (
                  <TBRow key={r.accountCode} code={r.accountCode} name={nameOf(r)} dr={r.debitUSD} cr={r.creditUSD} />
                ))}
                {tb.rows.length === 0 && (
                  <tr><td colSpan={4} className="py-12 text-center text-slate-400">{t('accEmpty') || 'No postings yet for this project'}</td></tr>
                )}
              </tbody>
              {tb.rows.length > 0 && (
                <tfoot className="bg-surface-2/60 font-black text-ink border-t border-line">
                  <tr>
                    <td colSpan={2} className="py-3 px-4">{t('total') || 'Total'}</td>
                    <td className="py-3 px-4 text-end font-mono">{fmt(tb.totalDebitUSD)}</td>
                    <td className="py-3 px-4 text-end font-mono">{fmt(tb.totalCreditUSD)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <div className={`px-5 py-3 text-[11px] font-bold border-t border-line ${
            Math.abs(tb.totalDebitUSD - tb.totalCreditUSD) < 1 ? 'text-emerald-600 bg-emerald-500/5' : 'text-rose-600 bg-rose-500/5'
          }`}>
            {Math.abs(tb.totalDebitUSD - tb.totalCreditUSD) < 1
              ? (t('accBalancedOk') || '✅ Books are balanced — total debits equal total credits')
              : (t('accBalancedBad') || '⚠️ Out of balance — posting error detected')}
          </div>
        </div>
      )}

      {/* ===================== Income Statement ======================= */}
      {tab === 'income' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* P&L core: Revenue − COGS − Period expenses */}
          <div className="bg-surface rounded-3xl border border-line shadow-sm p-4 space-y-2 h-fit">
            <SectionHeader Icon={Wallet} title={t('accRevenue') || 'Revenue'} tint="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" />
            {revenueRows.map(r => (
              <div key={r.accountCode} className="flex items-center justify-between px-3 py-2 text-xs">
                <span className="text-ink">{nameOf(r)} <span className="font-mono text-ink-muted text-[10px]">({r.accountCode})</span></span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{fmt(r.creditUSD)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 py-2 mt-1 border-t border-line text-xs font-black">
              <span className="text-ink">{t('accTotalRevenue') || 'Total Revenue'}</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">{fmt(totalRevenue)}</span>
            </div>

            <SectionHeader Icon={Box} title={t('accCogs') || 'Cost of Units Sold (COGS)'} tint="bg-rose-500/10 text-rose-700 dark:text-rose-300" />
            <div className="flex items-center justify-between px-3 py-2 text-xs">
              <span className="text-ink">{t('accCogsDesc') || 'Area-allocated construction cost of sold units'} <span className="font-mono text-ink-muted text-[10px]">(5050)</span></span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">({fmt(totalCogs)})</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 border-t border-line text-xs font-black bg-emerald-500/5 rounded-xl">
              <span className="text-ink">{t('accGrossProfit') || 'Gross Profit (Revenue − COGS)'}</span>
              <span className={`font-mono ${grossProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{fmt(grossProfit)}</span>
            </div>

            {periodExpenseRows.length > 0 && (
              <>
                <SectionHeader Icon={Building2} title={t('accOpex') || 'Period Expenses (unallocated 5xxx / 6xxx / 7xxx)'} tint="bg-slate-500/10 text-slate-700 dark:text-slate-300" />
                {periodExpenseRows.map(r => (
                  <div key={r.accountCode} className="flex items-center justify-between px-3 py-1.5 text-xs">
                    <span className="text-ink">{nameOf(r)} <span className="font-mono text-ink-muted text-[10px]">({r.accountCode})</span></span>
                    <span className="font-mono font-bold text-slate-600 dark:text-slate-400">({fmt(r.debitUSD)})</span>
                  </div>
                ))}
              </>
            )}
            <div className="flex items-center justify-between px-3 py-2 border-t border-line text-xs font-black">
              <span className="text-ink">{t('accNetIncome') || 'Net Income'}</span>
              <span className={`font-mono ${netIncome >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{fmt(netIncome)}</span>
            </div>
          </div>

          {/* WIP capitalization detail (natural cost classification) */}
          <div className="bg-surface rounded-3xl border border-line shadow-sm p-4 space-y-2 h-fit">
            <SectionHeader Icon={HardHat} title={t('accWipDetail') || 'Construction Costs Capitalized in WIP (by category)'} tint="bg-amber-500/10 text-amber-700 dark:text-amber-300" />
            <div className="max-h-72 overflow-y-auto space-y-0.5">
              {wipBreakdown.map(r => (
                <div key={r.costAccountCode} className="flex items-center justify-between px-3 py-1.5 text-xs">
                  <span className="text-ink">{getAccountDisplayName(r.costAccountCode, language)} <span className="font-mono text-ink-muted text-[10px]">({r.costAccountCode})</span></span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{fmt(r.totalUSD)}</span>
                </div>
              ))}
              {wipBreakdown.length === 0 && (
                <p className="px-3 py-6 text-center text-slate-400 text-xs">{t('accEmpty') || 'No postings yet for this project'}</p>
              )}
            </div>
            <div className="flex items-center justify-between px-3 py-2 border-t border-line text-xs font-black">
              <span className="text-ink">{t('accTotalCapitalized') || 'Total Capitalized'}</span>
              <span className="font-mono text-amber-600 dark:text-amber-400">{fmt(capitalizedUSD)}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 text-xs">
              <span className="text-ink-muted">− {t('accCogs') || 'Relieved to COGS (sold units)'}</span>
              <span className="font-mono text-rose-600 dark:text-rose-400">({fmt(totalCogs)})</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 border-t border-line text-xs font-black bg-sky-500/5 rounded-xl">
              <span className="text-ink">{t('accWipRemaining') || 'Remaining in WIP (unsold work — asset 1500)'}</span>
              <span className="font-mono text-sky-600 dark:text-sky-400">{fmt(wipRemainingUSD)}</span>
            </div>
          </div>

          {/* Net income banner */}
          <div className={`lg:col-span-2 rounded-3xl border p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            netIncome >= 0
              ? 'bg-gradient-to-l from-emerald-500/10 to-teal-500/5 border-emerald-500/25'
              : 'bg-gradient-to-l from-rose-500/10 to-red-500/5 border-rose-500/25'
          }`}>
            <div>
              <p className="text-[11px] text-ink-muted font-semibold">{t('accNetIncome') || 'Net Income (Revenue − COGS − Period Expenses)'}</p>
              <p className={`text-2xl font-black mt-0.5 ${netIncome >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {fmt(netIncome)}
              </p>
            </div>
            <p className="text-[11px] text-ink-muted max-w-md">
              {t('accWipNote') || 'Developer model: construction costs are capitalized into WIP and expensed (COGS) only when a unit sells — so profit reflects sold units, not cash outflow.'}
            </p>
          </div>
        </div>
      )}

      {/* ==================== Per-Unit Profitability =================== */}
      {tab === 'units' && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-surface border border-line shadow-sm">
              <span className="text-[10px] text-ink-muted font-semibold">{t('accUnitCostPool') || 'Cost Pool (WIP to date)'}</span>
              <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">{fmt(unitProfit.costPoolUSD)}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface border border-line shadow-sm">
              <span className="text-[10px] text-ink-muted font-semibold">{t('accUnitAllocated') || 'Allocated to Sold Units (COGS)'}</span>
              <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1">{fmt(unitProfit.allocatedToSoldUSD)}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface border border-line shadow-sm">
              <span className="text-[10px] text-ink-muted font-semibold">{t('accWipRemaining') || 'Remaining in WIP'}</span>
              <p className="text-lg font-black text-sky-600 dark:text-sky-400 mt-1">{fmt(unitProfit.remainingInWipUSD)}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface border border-line shadow-sm">
              <span className="text-[10px] text-ink-muted font-semibold">{t('accUnitTotalMargin') || 'Gross Profit on Sales'}</span>
              <p className={`text-lg font-black mt-1 ${unitProfit.totals.grossProfitUSD >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {fmt(unitProfit.totals.grossProfitUSD)}
                {unitProfit.totals.marginPct !== null && (
                  <span className="text-[11px] font-bold text-ink-muted"> ({unitProfit.totals.marginPct.toFixed(1)}%)</span>
                )}
              </p>
            </div>
          </div>

          <div className="bg-surface rounded-3xl border border-line shadow-sm overflow-hidden">
            <div className="overflow-x-auto scroll-touch">
              <table className="w-full text-xs">
                <thead className="bg-surface-2/60 text-ink-muted font-bold border-b border-line">
                  <tr>
                    <th className="py-3.5 px-4 text-start">{t('accUnitColUnit') || 'Unit'}</th>
                    <th className="py-3.5 px-4 text-end">{t('accUnitColArea') || 'Area (m²)'}</th>
                    <th className="py-3.5 px-4 text-end">{t('accUnitColShare') || 'Area Share'}</th>
                    <th className="py-3.5 px-4 text-end">{t('accUnitColSale') || 'Sale Price'}</th>
                    <th className="py-3.5 px-4 text-end">{t('accUnitColReceived') || 'Received'}</th>
                    <th className="py-3.5 px-4 text-end">{t('accUnitColCost') || 'Allocated Cost (COGS)'}</th>
                    <th className="py-3.5 px-4 text-end">{t('accUnitColProfit') || 'Gross Profit'}</th>
                    <th className="py-3.5 px-4 text-end">{t('accUnitColMargin') || 'Margin %'}</th>
                    <th className="py-3.5 px-4 text-center">{t('budgetColStatus') || 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {unitProfit.rows.map(r => {
                    const sold = r.status === 'sold';
                    return (
                      <tr key={r.unitId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-ink">{r.unitNumber}</div>
                          {sold && r.buyerName && <div className="text-[10px] text-ink-muted">{r.buyerName}</div>}
                        </td>
                        <td className="py-3 px-4 text-end font-mono text-ink">{formatNumber(r.areaM2, 0)}</td>
                        <td className="py-3 px-4 text-end font-mono text-ink-muted">{r.areaSharePct.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-end font-mono text-ink whitespace-nowrap">{sold || r.salePriceUSD > 0 ? fmt(r.salePriceUSD) : '—'}</td>
                        <td className="py-3 px-4 text-end font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{sold && r.receivedUSD > 0 ? fmt(r.receivedUSD) : '—'}</td>
                        <td className="py-3 px-4 text-end font-mono text-amber-600 dark:text-amber-400 whitespace-nowrap">{sold ? fmt(r.allocatedCostUSD) : '—'}</td>
                        <td className={`py-3 px-4 text-end font-mono font-bold whitespace-nowrap ${sold ? (r.grossProfitUSD >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400') : 'text-ink-muted'}`}>
                          {sold ? fmt(r.grossProfitUSD) : '—'}
                        </td>
                        <td className="py-3 px-4 text-end font-mono text-ink-muted">{r.marginPct !== null ? `${r.marginPct.toFixed(1)}%` : '—'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full border text-[10px] font-bold whitespace-nowrap ${
                            sold
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              : r.status === 'reserved'
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                : 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/30'
                          }`}>
                            {sold ? (t('accUnitSold') || 'Sold') : r.status === 'reserved' ? (t('accUnitReserved') || 'Reserved') : (t('accUnitAvailable') || 'Available')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {unitProfit.rows.length === 0 && (
                    <tr><td colSpan={9} className="py-12 text-center text-slate-400">{t('accEmpty') || 'No postings yet for this project'}</td></tr>
                  )}
                </tbody>
                {unitProfit.rows.some(r => r.status === 'sold') && (
                  <tfoot className="bg-surface-2/60 font-black text-ink border-t border-line">
                    <tr>
                      <td className="py-3 px-4" colSpan={3}>{t('total') || 'Total'} — {t('accUnitSold') || 'Sold'}</td>
                      <td className="py-3 px-4 text-end font-mono">{fmt(unitProfit.totals.saleUSD)}</td>
                      <td className="py-3 px-4 text-end font-mono text-emerald-600 dark:text-emerald-400">{fmt(unitProfit.totals.receivedUSD)}</td>
                      <td className="py-3 px-4 text-end font-mono text-amber-600 dark:text-amber-400">{fmt(unitProfit.totals.cogsUSD)}</td>
                      <td className="py-3 px-4 text-end font-mono text-emerald-600 dark:text-emerald-400">{fmt(unitProfit.totals.grossProfitUSD)}</td>
                      <td className="py-3 px-4 text-end font-mono">{unitProfit.totals.marginPct !== null ? `${unitProfit.totals.marginPct.toFixed(1)}%` : '—'}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <div className="px-5 py-3 text-[11px] text-ink-muted border-t border-line">
              {t('accUnitAllocNote') || 'Allocation method: area-proportional (unit m² ÷ total sellable m²) over the cost pool. Margins refine automatically as more construction costs arrive — final margins are known at project completion.'}
            </div>
          </div>
        </div>
      )}

      {/* ======================= Balance Sheet ======================== */}
      {tab === 'balance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Assets */}
          <div className="bg-surface rounded-3xl border border-line shadow-sm p-4 space-y-2 h-fit">
            <SectionHeader Icon={Landmark} title={t('accAssets') || 'Assets'} tint="bg-sky-500/10 text-sky-700 dark:text-sky-300" />
            {assetRows.map(r => {
              const net = r.debitUSD - r.creditUSD;
              return (
                <div key={r.accountCode} className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="text-ink">{nameOf(r)} <span className="font-mono text-ink-muted text-[10px]">({r.accountCode})</span></span>
                  <span className={`font-mono font-bold ${net < 0 ? 'text-rose-600' : 'text-sky-600 dark:text-sky-400'}`}>{fmt(net)}</span>
                </div>
              );
            })}
            <div className="flex items-center justify-between px-3 py-2 mt-1 border-t border-line text-xs font-black">
              <span className="text-ink">{t('accTotalAssets') || 'Total Assets'}</span>
              <span className="font-mono text-sky-600 dark:text-sky-400">{fmt(totalAssets)}</span>
            </div>
          </div>

          {/* Liabilities + Equity */}
          <div className="bg-surface rounded-3xl border border-line shadow-sm p-4 space-y-2 h-fit">
            <SectionHeader Icon={Scale} title={t('accLiabilities') || 'Liabilities'} tint="bg-rose-500/10 text-rose-700 dark:text-rose-300" />
            {liabRows.map(r => {
              const net = r.creditUSD - r.debitUSD;
              return (
                <div key={r.accountCode} className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="text-ink">{nameOf(r)} <span className="font-mono text-ink-muted text-[10px]">({r.accountCode})</span></span>
                  <span className={`font-mono font-bold ${net < 0 ? 'text-amber-600' : 'text-rose-600 dark:text-rose-400'}`}>{fmt(net)}</span>
                </div>
              );
            })}
            <div className="flex items-center justify-between px-3 py-2 border-t border-line text-xs font-black">
              <span className="text-ink">{t('accTotalLiab') || 'Total Liabilities'}</span>
              <span className="font-mono text-rose-600 dark:text-rose-400">{fmt(totalLiab)}</span>
            </div>

            <SectionHeader Icon={Wallet} title={t('accEquity') || 'Equity'} tint="bg-violet-500/10 text-violet-700 dark:text-violet-300" />
            {equityRows.map(r => {
              const net = r.creditUSD - r.debitUSD;
              return (
                <div key={r.accountCode} className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="text-ink">{nameOf(r)} <span className="font-mono text-ink-muted text-[10px]">({r.accountCode})</span></span>
                  <span className="font-mono font-bold text-violet-600 dark:text-violet-400">{fmt(net)}</span>
                </div>
              );
            })}
            <div className="flex items-center justify-between px-3 py-2 text-xs">
              <span className="text-ink italic">{t('accCurrentIncome') || 'Current period net income'} </span>
              <span className={`font-mono font-bold ${netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(netIncome)}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 mt-1 border-t border-line text-xs font-black">
              <span className="text-ink">{t('accTotalEquityPlus') || 'Total Liabilities + Equity'}</span>
              <span className="font-mono text-violet-600 dark:text-violet-400">{fmt(totalLiab + totalEquity)}</span>
            </div>
          </div>

          <div className={`lg:col-span-2 px-5 py-3 rounded-2xl text-[11px] font-bold border ${
            Math.abs(totalAssets - (totalLiab + totalEquity)) < 1
              ? 'text-emerald-600 bg-emerald-500/5 border-emerald-500/25'
              : 'text-rose-600 bg-rose-500/5 border-rose-500/25'
          }`}>
            {Math.abs(totalAssets - (totalLiab + totalEquity)) < 1
              ? `✅ ${t('accEquationOk') || 'Accounting equation holds'}: ${t('accAssets') || 'Assets'} ${fmt(totalAssets)} = ${fmt(totalLiab + totalEquity)}`
              : `⚠️ ${t('accEquationBad') || 'Equation mismatch detected'}`}
          </div>
        </div>
      )}

      {/* ========================= Journal ============================ */}
      {tab === 'journal' && (
        <div className="bg-surface rounded-3xl border border-line shadow-sm overflow-hidden">
          <div className="overflow-x-auto scroll-touch">
            <table className="w-full text-xs">
              <thead className="bg-surface-2/60 text-ink-muted font-bold border-b border-line">
                <tr>
                  <th className="py-3.5 px-4 text-start w-24">{t('accColDate') || 'Date'}</th>
                  <th className="py-3.5 px-4 text-start">{t('accColDescription') || 'Description'}</th>
                  <th className="py-3.5 px-4 text-start w-28">{t('accColSource') || 'Source'}</th>
                  <th className="py-3.5 px-4 text-end w-32">{t('accColAmount') || 'Amount ($)'}</th>
                  <th className="py-3.5 px-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[...projectJournal].reverse().slice(0, 200).map((e: JournalEntry) => (
                  <React.Fragment key={e.id}>
                    <tr
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition cursor-pointer"
                      onClick={() => setExpanded(prev => ({ ...prev, [e.id]: !prev[e.id] }))}
                    >
                      <td className="py-3 px-4 text-ink-muted whitespace-nowrap">{e.date}</td>
                      <td className="py-3 px-4 text-ink">{e.description}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 text-[10px] font-bold">
                          {e.sourceType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-end font-mono font-bold text-ink whitespace-nowrap">{fmt(e.totalDebitUSD)}</td>
                      <td className="py-3 px-4 text-ink-muted">
                        {expanded[e.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </td>
                    </tr>
                    {expanded[e.id] && (
                      <tr className="bg-surface-2/40">
                        <td colSpan={5} className="px-8 py-3">
                          <div className="space-y-1">
                            {e.lines.map((l, i) => (
                              <div key={i} className="flex items-center justify-between text-[11px] font-mono">
                                <span className={`${l.debit > 0 ? 'text-ink font-bold' : 'text-ink-muted ps-6'}`}>
                                  {l.accountCode} — {getAccountDisplayName(l.accountCode, language)} {l.memo ? `(${l.memo})` : ''}
                                </span>
                                <span className={l.debit > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                                  {l.debit > 0 ? `Dr ${formatNumber(l.debit, 2)}` : `Cr ${formatNumber(l.credit, 2)}`} {e.currency}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {projectJournal.length === 0 && (
                  <tr><td colSpan={5} className="py-12 text-center text-slate-400">{t('accEmpty') || 'No postings yet for this project'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {projectJournal.length > 200 && (
            <div className="px-5 py-3 text-[11px] text-ink-muted border-t border-line">
              {t('accJournalTruncated') || `Showing latest 200 of ${projectJournal.length} entries`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
