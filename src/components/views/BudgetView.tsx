/**
 * ============================================================================
 * Project Budget View (بودجه پروژه)
 * ============================================================================
 * Per-project budget control tied to the Chart of Accounts:
 *  - One budget line per COA 5xxx account (no parallel category system)
 *  - Committed (actual) spending auto-derived from purchases — never typed in
 *  - Paid vs Payable shown separately (credit purchases consume budget
 *    immediately but cash is tracked independently)
 *  - Status thresholds: >=80% warning, >=100% over budget
 *  - Unbudgeted spending section (costs with no approved budget line)
 * All CRUD writes go through AppContext (audit-logged, role-gated).
 * ============================================================================
 */

import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { localizeText } from '../../i18n/localize';
import {
  Wallet,
  Plus,
  Pencil,
  Trash2,
  Printer,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CircleDashed,
  TrendingUp,
  Banknote,
  CreditCard,
  Landmark,
  PiggyBank,
  Percent,
  X,
} from 'lucide-react';
import { BudgetLineReport, BudgetStatus, ProjectBudget } from '../../types';
import { CHART_OF_ACCOUNTS, getPostingAccounts } from '../../data/chartOfAccounts';
import { summarizeBudgetReport } from '../../utils/budgetUtils';
import { CurrencyAmountInput } from '../CurrencyAmountInput';

/* ------------------------------- helpers ------------------------------- */

const STATUS_META: Record<BudgetStatus, { chip: string; bar: string; track: string; Icon: any; key: string }> = {
  normal: {
    chip: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    bar: 'bg-gradient-to-l from-emerald-500 to-teal-500',
    track: 'bg-emerald-500/15',
    Icon: CheckCircle2,
    key: 'budgetStatusNormal',
  },
  warning: {
    chip: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    bar: 'bg-gradient-to-l from-amber-500 to-orange-500',
    track: 'bg-amber-500/15',
    Icon: AlertTriangle,
    key: 'budgetStatusWarning',
  },
  over: {
    chip: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
    bar: 'bg-gradient-to-l from-rose-500 to-red-600',
    track: 'bg-rose-500/15',
    Icon: XCircle,
    key: 'budgetStatusOver',
  },
  unbudgeted: {
    chip: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/30',
    bar: 'bg-gradient-to-l from-slate-400 to-slate-500',
    track: 'bg-slate-400/15',
    Icon: CircleDashed,
    key: 'budgetStatusUnbudgeted',
  },
};

const StatusChip: React.FC<{ status: BudgetStatus; label: string }> = ({ status, label }) => {
  const meta = STATUS_META[status];
  const Icon = meta.Icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold whitespace-nowrap ${meta.chip}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

/* ------------------------------ budget modal ---------------------------- */

interface BudgetModalProps {
  onClose: () => void;
  editing?: ProjectBudget | null;
}

const BudgetModal: React.FC<BudgetModalProps> = ({ onClose, editing }) => {
  const { t, currentProject, addProjectBudget, updateProjectBudget, getAccountDisplayName, language } = useApp();

  const costAccounts = useMemo(() => {
    const parentCodes = new Set(CHART_OF_ACCOUNTS.flatMap(account => account.parentCode ? [account.parentCode] : []));
    return getPostingAccounts().filter(account =>
      account.code.startsWith('5')
      && (!parentCodes.has(account.code) || account.code === editing?.accountCode)
    );
  }, [editing?.accountCode]);

  const [accountCode, setAccountCode] = useState<string>(editing?.accountCode || costAccounts[0]?.code || '51001');
  const [amount, setAmount] = useState<string>(editing ? String(editing.amount) : '');
  const [currency, setCurrency] = useState<'USD' | 'AFN'>((editing?.currency as 'USD' | 'AFN') || 'USD');
  const [rate, setRate] = useState<number>(editing?.exchangeRate || currentProject?.defaultExchangeRate || 70);
  const [notes, setNotes] = useState<string>(editing?.notes || '');

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0 || !currentProject) return;
    const payload = {
      projectId: currentProject.id,
      accountCode,
      amount: numAmount,
      currency,
      exchangeRate: rate,
      notes: notes.trim() || undefined,
    };
    if (editing) {
      updateProjectBudget(editing.id, payload);
    } else {
      addProjectBudget(payload);
    }
    onClose();
  };

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
        <div
          className="w-full max-w-md bg-surface rounded-3xl border border-line shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-ink flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-500" />
              {editing ? (t('budgetEditTitle') || t("budgetEditTitle")) : (t('budgetAddTitle') || t("budgetAddTitle"))}
            </h3>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">{t('budgetAccount') || 'Cost Account'}</label>
            <select
              value={accountCode}
              onChange={e => setAccountCode(e.target.value)}
              disabled={!!editing}
              className="w-full px-3 py-2.5 bg-surface-2/80 border border-line rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
            >
              {costAccounts.map(acc => (
                <option key={acc.code} value={acc.code}>
                  {acc.code} — {getAccountDisplayName(acc.code, language)}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-ink-muted mt-1">{t('budgetAccountHint') || t("budgetAccountHint")}</p>
          </div>

          <CurrencyAmountInput
            amount={amount}
            onChangeAmount={setAmount}
            currency={currency}
            onChangeCurrency={(c) => setCurrency(c as 'USD' | 'AFN')}
            exchangeRate={rate}
            onChangeExchangeRate={setRate}
            label={t('budgetAmountLabel') || t("budgetAmountLabel")}
          />

          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">{t('notes') || t("notes")}</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder={t('budgetNotesPlaceholder') || t("budgetNotesPlaceholder")}
              className="w-full px-3 py-2 bg-surface-2/80 border border-line rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={!amount || parseFloat(amount) <= 0}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-600/25 transition active:scale-95"
            >
              {editing ? (t('update') || t("update")) : (t('save') || 'Save')}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-semibold transition"
            >
              {t('cancel') || t("cancel")}
            </button>
          </div>
        </div>
      </div>
  );
};

/* ------------------------------ budget chart ---------------------------- */

const BudgetVsSpentChart: React.FC<{ rows: BudgetLineReport[]; fmt: (n: number) => string; t: (k: string) => string }> = ({ rows, fmt, t }) => {
  const budgeted = rows.filter(r => r.hasBudget);
  if (budgeted.length === 0) return null;
  const maxVal = Math.max(...budgeted.flatMap(r => [r.budgetUSD, r.committedUSD]), 1);
  return (
    <div className="bg-surface rounded-3xl border border-line shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-ink flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          {t('budgetChartVsTitle') || t("budgetChartVsTitle")}
        </h3>
        <div className="flex items-center gap-3 text-[10px] text-ink-muted">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-slate-600 inline-block" />{t('budgetColBudget') || t("budgetColBudget")}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />{t('budgetColSpent') || t("budgetColSpent")}</span>
        </div>
      </div>
      <div className="space-y-3">
        {budgeted.map(r => {
          const budgetPct = (r.budgetUSD / maxVal) * 100;
          const spentPct = (r.committedUSD / maxVal) * 100;
          return (
            <div key={r.accountCode} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-ink">{r.nameFa}</span>
                <span className="font-mono text-ink-muted">{fmt(r.committedUSD)} / {fmt(r.budgetUSD)}</span>
              </div>
              <div className="space-y-0.5">
                <div className="h-2 rounded-full bg-slate-200/70 dark:bg-slate-700/60 overflow-hidden">
                  <div className="h-full rounded-full bg-slate-300 dark:bg-slate-600 transition-all" style={{ width: `${budgetPct}%` }} />
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${STATUS_META[r.status].track}`}>
                  <div className={`h-full rounded-full ${STATUS_META[r.status].bar} transition-all`} style={{ width: `${spentPct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const UsageChart: React.FC<{ rows: BudgetLineReport[]; t: (k: string) => string }> = ({ rows, t }) => {
  const budgeted = rows.filter(r => r.hasBudget && r.budgetUSD > 0);
  if (budgeted.length === 0) return null;
  return (
    <div className="bg-surface rounded-3xl border border-line shadow-sm p-5 space-y-4">
      <h3 className="text-sm font-black text-ink flex items-center gap-2">
        <Percent className="w-4 h-4 text-amber-500" />
        {t('budgetChartUsageTitle') || t("budgetUsagePct")}
      </h3>
      <div className="space-y-3">
        {budgeted.map(r => {
          const pct = Math.min(r.usagePct ?? 0, 150);
          const widthPct = Math.min(pct, 100);
          return (
            <div key={r.accountCode} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-ink">{r.nameFa}</span>
                <span className={`font-mono font-black ${r.status === 'over' ? 'text-rose-600' : r.status === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {(r.usagePct ?? 0).toFixed(1)}%
                </span>
              </div>
              <div className={`h-2.5 rounded-full overflow-hidden ${STATUS_META[r.status].track}`}>
                <div className={`h-full rounded-full ${STATUS_META[r.status].bar} transition-all`} style={{ width: `${widthPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-ink-muted pt-1">{t('budgetThresholdNote') || t("budgetThresholdNote")}</p>
    </div>
  );
};

/* ------------------------------ main view ------------------------------- */

export const BudgetView: React.FC = () => {
  const {
    currentProject,
    currentUser,
    getBudgetReport,
    projectBudgets,
    deleteProjectBudget,
    formatCurrency,
    t,
    language,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<ProjectBudget | null>(null);

  const canManage =
    currentUser?.role === 'admin' ||
    currentUser?.isMasterSuperAdmin ||
    (currentUser?.role === 'accountant' && currentUser?.permissions?.canManageExpenses !== false);

  const rows = useMemo(
    () => (currentProject ? getBudgetReport(currentProject.id) : []),
    [currentProject, getBudgetReport, projectBudgets]
  );
  const totals = useMemo(() => summarizeBudgetReport(rows), [rows]);

  const budgetedRows = rows.filter(r => r.hasBudget);
  const unbudgetedRows = rows.filter(r => !r.hasBudget && r.committedUSD > 0);

  const fmt = (n: number) => formatCurrency(n, 'USD');
  const nameOf = (r: BudgetLineReport) => localizeText(language, { en: r.nameEn, fa: r.nameFa, ps: r.namePs });

  const handleEdit = (row: BudgetLineReport) => {
    const stored = projectBudgets.find(b => b.projectId === currentProject?.id && b.accountCode === row.accountCode);
    setEditingBudget(stored || null);
    setIsModalOpen(true);
  };

  const handleDelete = (row: BudgetLineReport) => {
    const stored = projectBudgets.find(b => b.projectId === currentProject?.id && b.accountCode === row.accountCode);
    if (!stored) return;
    if (confirm(t('budgetDeleteConfirm') || localizeText(language, {
      en: `Remove budget for ${row.nameEn}?`,
      fa: `بودجهٔ ${row.nameFa} حذف شود؟`,
      ps: `د ${row.namePs} بودجه لرې شي؟`,
    }))) {
      deleteProjectBudget(stored.id);
    }
  };

  const kpis = [
    { label: t('budgetTotalBudget') || 'Total Project Budget', value: fmt(totals.totalBudgetUSD), Icon: PiggyBank, color: 'text-indigo-600 dark:text-indigo-400', bg: 'from-indigo-500/10 to-indigo-600/5 border-indigo-500/20' },
    { label: t('budgetTotalSpent') || 'Total Spent (Committed)', value: fmt(totals.totalCommittedUSD), Icon: TrendingUp, color: 'text-amber-600 dark:text-amber-400', bg: 'from-amber-500/10 to-amber-600/5 border-amber-500/20' },
    { label: t('budgetTotalPaid') || 'Total Paid', value: fmt(totals.totalPaidUSD), Icon: Banknote, color: 'text-emerald-600 dark:text-emerald-400', bg: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20' },
    { label: t('budgetTotalPayable') || 'Total Payable', value: fmt(totals.totalPayableUSD), Icon: CreditCard, color: 'text-rose-600 dark:text-rose-400', bg: 'from-rose-500/10 to-rose-600/5 border-rose-500/20' },
    { label: t('budgetRemaining') || 'Remaining Budget', value: fmt(totals.totalRemainingUSD), Icon: Landmark, color: totals.totalRemainingUSD < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-sky-600 dark:text-sky-400', bg: 'from-sky-500/10 to-sky-600/5 border-sky-500/20' },
    { label: t('budgetUsagePct') || 'Budget Usage %', value: totals.usagePct === null ? '—' : `${totals.usagePct.toFixed(1)}%`, Icon: Percent, color: totals.status === 'over' ? 'text-rose-600 dark:text-rose-400' : totals.status === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400', bg: 'from-teal-500/10 to-teal-600/5 border-teal-500/20' },
  ];

  if (!currentProject) {
    return <div className="p-8 text-center text-ink-muted text-xs">{t('selectProject') || 'Select a project first'}</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-emerald-500" />
            <span>{t('budgetTitle') || t("navBudget")}</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            {currentProject.name} • {t('budgetSubtitle') || t("budgetSubtitle")}
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
          {canManage && (
            <button
              onClick={() => { setEditingBudget(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-600/25 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t('budgetAddTitle') || t("budgetAddTitle")}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((k, i) => (
          <div key={i} className={`p-3.5 rounded-2xl bg-gradient-to-br border ${k.bg} shadow-sm`}>
            <div className="flex items-center gap-1.5">
              <k.Icon className={`w-3.5 h-3.5 ${k.color}`} />
              <span className="text-[10px] text-ink-muted font-semibold leading-tight">{k.label}</span>
            </div>
            <p className={`text-lg font-black mt-1.5 truncate ${k.color}`} title={k.value}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BudgetVsSpentChart rows={budgetedRows} fmt={fmt} t={t} />
        <UsageChart rows={budgetedRows} t={t} />
      </div>

      {/* Main table */}
      <div className="bg-surface rounded-3xl border border-line shadow-sm overflow-hidden">
        <div className="overflow-x-auto scroll-touch">
          <table className="w-full text-xs">
            <thead className="bg-surface-2/60 text-ink-muted font-bold border-b border-line">
              <tr>
                <th className="py-3.5 px-4 text-start">{t('budgetColCategory') || t("budgetColCategory")}</th>
                <th className="py-3.5 px-4 text-end">{t('budgetColBudget') || t("budgetColBudget")}</th>
                <th className="py-3.5 px-4 text-end">{t('budgetColSpent') || t("budgetColSpent")}</th>
                <th className="py-3.5 px-4 text-end">{t('budgetColPaid') || t("budgetColPaid")}</th>
                <th className="py-3.5 px-4 text-end">{t('budgetColPayable') || t("budgetColPayable")}</th>
                <th className="py-3.5 px-4 text-end">{t('budgetColRemaining') || t("budgetColRemaining")}</th>
                <th className="py-3.5 px-4 text-center min-w-[120px]">{t('budgetColUsage') || t("budgetColUsage")}</th>
                <th className="py-3.5 px-4 text-center">{t('budgetColStatus') || t("budgetColStatus")}</th>
                {canManage && <th className="py-3.5 px-4 text-center">{t('actions') || t("actions")}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {budgetedRows.map(r => (
                <tr key={r.accountCode} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-ink">{nameOf(r)}</div>
                    <div className="text-[10px] text-ink-muted font-mono">{r.accountCode}</div>
                  </td>
                  <td className="py-3 px-4 text-end font-mono font-bold text-ink whitespace-nowrap">{fmt(r.budgetUSD)}</td>
                  <td className="py-3 px-4 text-end font-mono text-amber-600 dark:text-amber-400 whitespace-nowrap">{fmt(r.committedUSD)}</td>
                  <td className="py-3 px-4 text-end font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{fmt(r.paidUSD)}</td>
                  <td className="py-3 px-4 text-end font-mono text-rose-600 dark:text-rose-400 whitespace-nowrap">{fmt(r.payableUSD)}</td>
                  <td className={`py-3 px-4 text-end font-mono font-bold whitespace-nowrap ${r.remainingUSD < 0 ? 'text-rose-600' : 'text-sky-600 dark:text-sky-400'}`}>{fmt(r.remainingUSD)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 justify-center">
                      <div className={`flex-1 max-w-[90px] h-2 rounded-full overflow-hidden ${STATUS_META[r.status].track}`}>
                        <div className={`h-full rounded-full ${STATUS_META[r.status].bar}`} style={{ width: `${Math.min(r.usagePct ?? 0, 100)}%` }} />
                      </div>
                      <span className="font-mono text-[10px] font-black text-ink-muted w-11 text-end">{(r.usagePct ?? 0).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center"><StatusChip status={r.status} label={t(STATUS_META[r.status].key)} /></td>
                  {canManage && (
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleEdit(r)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition" title={t('edit') || t("edit")}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(r)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition" title={t('delete') || t("delete")}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {budgetedRows.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 9 : 8} className="py-12 text-center text-slate-400 text-xs">
                    {t('budgetEmpty') || t("budgetEmpty")}
                  </td>
                </tr>
              )}
            </tbody>
            {budgetedRows.length > 0 && (
              <tfoot className="bg-surface-2/60 font-black text-ink border-t border-line">
                <tr>
                  <td className="py-3 px-4">{t('total') || t("total")}</td>
                  <td className="py-3 px-4 text-end font-mono">{fmt(totals.totalBudgetUSD)}</td>
                  <td className="py-3 px-4 text-end font-mono text-amber-600 dark:text-amber-400">{fmt(totals.totalCommittedUSD)}</td>
                  <td className="py-3 px-4 text-end font-mono text-emerald-600 dark:text-emerald-400">{fmt(totals.totalPaidUSD)}</td>
                  <td className="py-3 px-4 text-end font-mono text-rose-600 dark:text-rose-400">{fmt(totals.totalPayableUSD)}</td>
                  <td className="py-3 px-4 text-end font-mono text-sky-600 dark:text-sky-400">{fmt(totals.totalRemainingUSD)}</td>
                  <td className="py-3 px-4 text-center font-mono">{totals.usagePct === null ? '—' : `${totals.usagePct.toFixed(1)}%`}</td>
                  <td className="py-3 px-4 text-center"><StatusChip status={totals.status} label={t(STATUS_META[totals.status].key)} /></td>
                  {canManage && <td />}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Unbudgeted spending control section */}
      {unbudgetedRows.length > 0 && (
        <div className="bg-surface rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-2 border-b border-line">
            <CircleDashed className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-black text-ink">{t('budgetUnbudgetedTitle') || t("budgetUnbudgetedTitle")}</h3>
            <span className="text-[10px] text-ink-muted">({t('budgetUnbudgetedHint') || t("budgetUnbudgetedHint")})</span>
          </div>
          <div className="overflow-x-auto scroll-touch">
            <table className="w-full text-xs">
              <thead className="bg-surface-2/60 text-ink-muted font-bold border-b border-line">
                <tr>
                  <th className="py-3 px-4 text-start">{t('budgetColCategory') || t("budgetColCategory")}</th>
                  <th className="py-3 px-4 text-end">{t('budgetColSpent') || t("budgetColSpent")}</th>
                  <th className="py-3 px-4 text-end">{t('budgetColPaid') || t("budgetColPaid")}</th>
                  <th className="py-3 px-4 text-end">{t('budgetColPayable') || t("budgetColPayable")}</th>
                  {canManage && <th className="py-3 px-4 text-center">{t('actions') || t("actions")}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {unbudgetedRows.map(r => (
                  <tr key={r.accountCode} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-ink">{nameOf(r)}</div>
                      <div className="text-[10px] text-ink-muted font-mono">{r.accountCode}</div>
                    </td>
                    <td className="py-3 px-4 text-end font-mono text-amber-600 dark:text-amber-400 whitespace-nowrap">{fmt(r.committedUSD)}</td>
                    <td className="py-3 px-4 text-end font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{fmt(r.paidUSD)}</td>
                    <td className="py-3 px-4 text-end font-mono text-rose-600 dark:text-rose-400 whitespace-nowrap">{fmt(r.payableUSD)}</td>
                    {canManage && (
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => handleEdit(r)} className="px-2.5 py-1.5 text-[10px] font-bold bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/20 rounded-lg transition">
                          {t('budgetAssign') || t("budgetAssign")}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <BudgetModal
          editing={editingBudget}
          onClose={() => { setIsModalOpen(false); setEditingBudget(null); }}
        />
      )}
    </div>
  );
};
