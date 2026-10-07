/**
 * ============================================================================
 * NIK SMART COUNT — Journal Engine (Auto Double-Entry Bookkeeping)
 * ============================================================================
 *
 * Turns the app's everyday business records into a balanced double-entry
 * journal, WITHOUT the user ever touching accounting concepts:
 *
 *   خرید سیخ (نقد/قرض)      ->  Dr 5100 Steel  /  Cr 2200 Supplier Payables
 *   پرداخت به فروشنده        ->  Dr 2200        /  Cr 1110/1120/1130/1140
 *   فروش آپارتمان           ->  Dr 1200 Receivable / Cr 4100 Unit Sales
 *   رسید اقساط              ->  Dr Cash/Bank    /  Cr 1200 (or 2300 advance)
 *   سرمایه‌گذاری شریک        ->  Dr Cash/Bank    /  Cr 3100 (initial) | 3200 (additional)
 *
 * Architecture: the journal is a PURE PROJECTION (built on demand from the
 * live operational records via `buildJournal`). Nothing is persisted, so
 * edits and deletes of business records automatically re-shape the books —
 * the journal can never drift out of sync with the UI data.
 *
 * Posting conventions (documented — do not change silently):
 *  - Purchases (expense/steel/concrete) post FULLY on credit: the purchase
 *    entry debits the Work-in-Progress asset (1500) — Phase 3 developer
 *    model — and credits the payable account for the full amount. The
 *    natural cost classification (5100 Steel, 5200 Concrete...) is kept on
 *    the Dr line as `costAccountCode` for detail reporting. All settlements
 *    (including the amount paid at purchase time, which the app
 *    materializes as a Payment record) post as Dr payable / Cr cash. The
 *    payable balance therefore always equals the outstanding debt shown in
 *    the UI.
 *  - WIP → COGS (Phase 3): when a unit is SOLD, its area-proportional
 *    share of the project's cost pool is relieved with a reclass entry
 *    `Dr 5050 Cost of Units Sold / Cr 1500 WIP`. WIP's remaining balance
 *    is the cost of work not yet sold — a true development asset.
 *  - Cash-less settlements (paymentMethod 'Personal' / «شخصی») credit
 *    2900 Other Liabilities (money a partner paid out of pocket) instead of
 *    a cash account.
 *  - Apartment sales recognize revenue at sale time for units with status
 *    'sold' (full price to 1200). Receipts against RESERVED units park in
 *    2300 Customer Advances until the unit is sold.
 *  - Unlinked receipts/settlements: some records carry an amountPaid with no
 *    matching Payment row (seed data, direct amounts). The engine posts a
 *    reconciliation entry for the difference so the books always agree with
 *    the UI totals.
 *  - Currency: each entry keeps its original currency; every line also
 *    carries USD & AFN normalization (entry exchange rate) so trial
 *    balances and reports can be produced in either base currency.
 * ============================================================================
 */

import {
  Expense,
  SteelRecord,
  ConcreteRecord,
  Payment,
  ApartmentUnit,
  ProjectInvestment,
  Project,
  JournalEntry,
  JournalLine,
  JournalSourceType,
  AccountBalance,
  TrialBalanceRow,
} from '../types';
import {
  ACC,
  CHART_OF_ACCOUNTS,
  getAccount,
  getAncestorCodes,
  resolveExpenseAccount,
} from '../data/chartOfAccounts';
import { computeProjectCostPoolUSD, computeSellableAreaM2, allocateUnitCostUSD } from './wipAllocation';

/* ------------------------------------------------------------------ */
/* Small numeric helpers                                               */
/* ------------------------------------------------------------------ */

const round2 = (n: number) => Number((n || 0).toFixed(2));
const round0 = (n: number) => Math.round(n || 0);

const toUSD = (amount: number, currency: string, rate: number): number =>
  currency === 'USD' ? round2(amount) : rate > 0 ? round2(amount / rate) : round2(amount);

const toAFN = (amount: number, currency: string, rate: number): number =>
  currency === 'AFN' ? round0(amount) : round0(amount * rate);

/* ------------------------------------------------------------------ */
/* Settlement account resolution                                       */
/* ------------------------------------------------------------------ */

/**
 * Maps a payment method to the cash-like account credited on OUTGOING money
 * (or debited on INCOMING money). Handles English, Dari and Pashto labels
 * observed in the app's data ('Cash', 'Bank Transfer', 'نقد', 'بانک',
 * 'صرافی', 'Hawala / Sarafi', 'Cheque', ...).
 */
export function getCashAccountCode(method: string | undefined, currency: string): string {
  const m = (method || '').trim().toLowerCase();
  if (!m) return currency === 'USD' ? ACC.CASH_USD : ACC.CASH_AFN;
  if (/hawala|saraf|sarr?afi|صراف|حواله/.test(m)) return ACC.HAWALA;
  if (/bank|cheque|check|بانک|چک/.test(m)) return ACC.BANK;
  if (/personal|شخصی/.test(m)) return currency === 'USD' ? ACC.CASH_USD : ACC.CASH_AFN; // see getSettlementCreditAccount
  return currency === 'USD' ? ACC.CASH_USD : ACC.CASH_AFN;
}

/**
 * Account CREDITED when the company pays money out. Normally a cash
 * account — but when the payer settles from a personal pocket
 * ('Personal' / «شخصی») the company never touched cash; it now owes the
 * payer -> 2900 Other Liabilities.
 */
export function getSettlementCreditAccount(method: string | undefined, currency: string): string {
  const m = (method || '').trim().toLowerCase();
  if (/personal|شخصی/.test(m)) return ACC.OTHER_LIABILITIES;
  return getCashAccountCode(method, currency);
}

/** Payable account by the party kind of a purchase/payment. */
function payableAccountFor(partyType?: string): string {
  return partyType === 'contractor' ? ACC.CONTRACTOR_PAYABLES : ACC.SUPPLIER_PAYABLES;
}

/** Payable account by payment relatedType (for debt settlements). */
function payableAccountForPayment(p: Payment): string {
  switch (p.relatedType) {
    case 'contractor':
      return ACC.CONTRACTOR_PAYABLES;
    case 'material_concrete':
    case 'concrete':
    case 'material_steel':
    case 'steel':
    case 'supplier':
      return ACC.SUPPLIER_PAYABLES;
    default:
      return ACC.SUPPLIER_PAYABLES;
  }
}

/* ------------------------------------------------------------------ */
/* Entry construction                                                  */
/* ------------------------------------------------------------------ */

interface LineSpec {
  accountCode: string;
  /** Natural cost classification for WIP-capitalized lines (Phase 3) */
  costAccountCode?: string;
  debit?: number;   // entry currency
  credit?: number;  // entry currency
  memo?: string;
}

interface EntrySpec {
  idSuffix: string;
  date: string;
  time?: string;
  projectId?: string;
  description: string;
  sourceType: JournalSourceType;
  sourceId: string;
  currency: string;
  exchangeRate: number;
  lines: LineSpec[];
}

function makeEntry(spec: EntrySpec): JournalEntry {
  const rate = spec.exchangeRate > 0 ? spec.exchangeRate : 1;
  const lines: JournalLine[] = spec.lines
    .filter(l => round2(l.debit || 0) > 0 || round2(l.credit || 0) > 0)
    .map(l => {
      const debit = round2(l.debit || 0);
      const credit = round2(l.credit || 0);
      return {
        accountCode: l.accountCode,
        costAccountCode: l.costAccountCode,
        debit,
        credit,
        debitUSD: toUSD(debit, spec.currency, rate),
        creditUSD: toUSD(credit, spec.currency, rate),
        debitAFN: toAFN(debit, spec.currency, rate),
        creditAFN: toAFN(credit, spec.currency, rate),
        memo: l.memo,
      };
    });

  const totalDebitUSD = round2(lines.reduce((s, l) => s + l.debitUSD, 0));
  const totalCreditUSD = round2(lines.reduce((s, l) => s + l.creditUSD, 0));

  return {
    id: `je-${spec.sourceType}-${spec.sourceId}${spec.idSuffix ? '-' + spec.idSuffix : ''}`,
    date: spec.date,
    time: spec.time,
    projectId: spec.projectId,
    description: spec.description,
    sourceType: spec.sourceType,
    sourceId: spec.sourceId,
    currency: spec.currency,
    exchangeRate: rate,
    lines,
    totalDebitUSD,
    totalCreditUSD,
  };
}

/** Check an entry balances (debit == credit) in its original currency. */
export function isEntryBalanced(e: JournalEntry, tolerance = 0.5): boolean {
  const d = e.lines.reduce((s, l) => s + l.debit, 0);
  const c = e.lines.reduce((s, l) => s + l.credit, 0);
  return Math.abs(d - c) <= tolerance;
}

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */

export interface JournalBuildInput {
  projects: Project[];
  expenses: Expense[];
  steelRecords: SteelRecord[];
  concreteRecords: ConcreteRecord[];
  payments: Payment[];
  apartments: ApartmentUnit[];
  projectInvestments: ProjectInvestment[];
}

/** How a payment is linked back to a purchase record */
function paymentMatches(p: Payment, relatedIds: Set<string>, types: string[]): boolean {
  return !!p.relatedId && relatedIds.has(p.relatedId) && types.includes(p.relatedType);
}

/* ------------------------------------------------------------------ */
/* Main builder                                                        */
/* ------------------------------------------------------------------ */

export function buildJournal(input: JournalBuildInput): JournalEntry[] {
  const entries: JournalEntry[] = [];
  const rateOf = (projectId?: string, fallback?: number) =>
    fallback && fallback > 0
      ? fallback
      : input.projects.find(p => p.id === projectId)?.defaultExchangeRate || 70;

  /* ------------------- 1. Purchases: expenses ------------------- */
  for (const exp of input.expenses) {
    const currency = exp.currency || 'USD';
    const rate = rateOf(exp.projectId, exp.exchangeRate);
    const costAccount = resolveExpenseAccount(exp.category);
    const payable = payableAccountFor(exp.partyType);
    const amount = round2(exp.amount || 0);
    if (amount <= 0) continue;

    // Full accrual posting of the purchase — capitalized into WIP (Phase 3),
    // natural cost class preserved on the line for detail reporting.
    entries.push(makeEntry({
      sourceType: 'expense',
      sourceId: exp.id,
      date: exp.date,
      time: exp.time,
      projectId: exp.projectId,
      description: `مصرف: ${exp.item || exp.description || exp.category} (${exp.category})`,
      currency,
      exchangeRate: rate,
      idSuffix: 'purchase',
      lines: [
        { accountCode: ACC.WIP, costAccountCode: costAccount, debit: amount, memo: exp.category },
        { accountCode: payable, credit: amount, memo: exp.partyName || undefined },
      ],
    }));

    // Reconciliation: record-paid amount not covered by any Payment row
    const linked = input.payments.filter(p => paymentMatches(p, new Set([exp.id]), ['expense']));
    const settledUSD = linked.reduce((s, p) => s + (p.amountInUSD ?? toUSD(p.amount, p.currency || currency, p.exchangeRate || rate)), 0);
    const expectedPaidUSD = toUSD(exp.paidAmount || 0, currency, rate);
    const diffUSD = round2(expectedPaidUSD - settledUSD);
    if (diffUSD > 0.5) {
      const diffOriginal = currency === 'USD' ? diffUSD : round2(diffUSD * rate);
      entries.push(makeEntry({
        sourceType: 'expense',
        sourceId: exp.id,
        date: exp.date,
        projectId: exp.projectId,
        description: `پرداخت ثبت‌نشده برای: ${exp.item || exp.description || exp.category}`,
        currency,
        exchangeRate: rate,
        idSuffix: 'unlinked-settlement',
        lines: [
          { accountCode: payable, debit: diffOriginal, memo: 'Unlinked settlement reconciliation' },
          { accountCode: getSettlementCreditAccount(exp.paymentMethod, currency), credit: diffOriginal, memo: String(exp.paymentMethod || '') },
        ],
      }));
    }
  }

  /* ------------------- 2. Purchases: steel ------------------- */
  for (const rec of input.steelRecords) {
    const currency = rec.currency || 'USD';
    const rate = rateOf(rec.projectId, rec.exchangeRate);
    const amount = round2(rec.totalAmount || 0);
    if (amount <= 0) continue;

    entries.push(makeEntry({
      sourceType: 'steel',
      sourceId: rec.id,
      date: rec.date,
      time: rec.time,
      projectId: rec.projectId,
      description: `خرید سیخ‌گول: ${rec.tons ?? ''} تن — بل #${rec.billNumber || ''} (${rec.supplierName || ''})`,
      currency,
      exchangeRate: rate,
      idSuffix: 'purchase',
      lines: [
        { accountCode: ACC.WIP, costAccountCode: ACC.STEEL, debit: amount, memo: rec.billNumber },
        { accountCode: ACC.SUPPLIER_PAYABLES, credit: amount, memo: rec.supplierName },
      ],
    }));

    const linked = input.payments.filter(p => paymentMatches(p, new Set([rec.id]), ['material_steel', 'steel']));
    const settledUSD = linked.reduce((s, p) => s + (p.amountInUSD ?? toUSD(p.amount, p.currency || currency, p.exchangeRate || rate)), 0);
    const expectedPaidUSD = toUSD(rec.paidAmount || 0, currency, rate);
    const diffUSD = round2(expectedPaidUSD - settledUSD);
    if (diffUSD > 0.5) {
      const diffOriginal = currency === 'USD' ? diffUSD : round2(diffUSD * rate);
      entries.push(makeEntry({
        sourceType: 'steel',
        sourceId: rec.id,
        date: rec.date,
        projectId: rec.projectId,
        description: `پرداخت ثبت‌نشده خرید سیخ‌گول — بل #${rec.billNumber || ''}`,
        currency,
        exchangeRate: rate,
        idSuffix: 'unlinked-settlement',
        lines: [
          { accountCode: ACC.SUPPLIER_PAYABLES, debit: diffOriginal, memo: 'Unlinked settlement reconciliation' },
          { accountCode: ACC.CASH_USD, credit: diffOriginal, memo: 'Default cash settlement' },
        ],
      }));
    }
  }

  /* ------------------- 3. Purchases: concrete ------------------- */
  for (const rec of input.concreteRecords) {
    const currency = rec.currency || 'USD';
    const rate = rateOf(rec.projectId, rec.exchangeRate);
    const amount = round2(rec.totalAmount || 0);
    if (amount <= 0) continue;

    entries.push(makeEntry({
      sourceType: 'concrete',
      sourceId: rec.id,
      date: rec.date,
      time: rec.time,
      projectId: rec.projectId,
      description: `خرید کانکریت: ${rec.quantityM3 ?? ''} م³ — بل #${rec.billNumber || ''} (${rec.supplierName || ''})`,
      currency,
      exchangeRate: rate,
      idSuffix: 'purchase',
      lines: [
        { accountCode: ACC.WIP, costAccountCode: ACC.CONCRETE, debit: amount, memo: rec.billNumber },
        { accountCode: ACC.SUPPLIER_PAYABLES, credit: amount, memo: rec.supplierName },
      ],
    }));

    const linked = input.payments.filter(p => paymentMatches(p, new Set([rec.id]), ['material_concrete', 'concrete']));
    const settledUSD = linked.reduce((s, p) => s + (p.amountInUSD ?? toUSD(p.amount, p.currency || currency, p.exchangeRate || rate)), 0);
    const expectedPaidUSD = toUSD(rec.paidAmount || 0, currency, rate);
    const diffUSD = round2(expectedPaidUSD - settledUSD);
    if (diffUSD > 0.5) {
      const diffOriginal = currency === 'USD' ? diffUSD : round2(diffUSD * rate);
      entries.push(makeEntry({
        sourceType: 'concrete',
        sourceId: rec.id,
        date: rec.date,
        projectId: rec.projectId,
        description: `پرداخت ثبت‌نشده خرید کانکریت — بل #${rec.billNumber || ''}`,
        currency,
        exchangeRate: rate,
        idSuffix: 'unlinked-settlement',
        lines: [
          { accountCode: ACC.SUPPLIER_PAYABLES, debit: diffOriginal, memo: 'Unlinked settlement reconciliation' },
          { accountCode: ACC.CASH_USD, credit: diffOriginal, memo: 'Default cash settlement' },
        ],
      }));
    }
  }

  /* ------------------- 4. Standalone settlements (payments) ------------------- */
  const purchaseIds = {
    expense: new Set(input.expenses.map(e => e.id)),
    steel: new Set(input.steelRecords.map(s => s.id)),
    concrete: new Set(input.concreteRecords.map(c => c.id)),
  };

  for (const pay of input.payments) {
    const currency = pay.currency || 'USD';
    const rate = rateOf(pay.projectId, pay.exchangeRate);
    const amount = round2(pay.amount || 0);
    if (amount <= 0) continue;
    const cashAcct = getSettlementCreditAccount(pay.method || pay.paymentMethod, currency);
    const payDate = pay.date;

    switch (pay.relatedType) {
      case 'expense':
      case 'material_steel':
      case 'steel':
      case 'material_concrete':
      case 'concrete': {
        // Settlement against a posted purchase (posted above) — always a
        // payable settlement; duplicate-protection is the reconciliation.
        entries.push(makeEntry({
          sourceType: 'payment',
          sourceId: pay.id,
          date: payDate,
          time: pay.time,
          projectId: pay.projectId,
          description: pay.description || `پرداخت بدهی (${pay.partyName || ''})`,
          currency,
          exchangeRate: rate,
          idSuffix: 'settle',
          lines: [
            { accountCode: payableAccountForPayment(pay), debit: amount, memo: pay.partyName },
            { accountCode: cashAcct, credit: amount, memo: pay.method },
          ],
        }));
        break;
      }

      case 'contractor':
      case 'supplier': {
        // Direct payment to a party (debt settlement or advance)
        entries.push(makeEntry({
          sourceType: 'payment',
          sourceId: pay.id,
          date: payDate,
          time: pay.time,
          projectId: pay.projectId,
          description: pay.description || `پرداخت به ${pay.partyName || ''}`,
          currency,
          exchangeRate: rate,
          idSuffix: 'party',
          lines: [
            { accountCode: payableAccountForPayment(pay), debit: amount, memo: pay.partyName },
            { accountCode: cashAcct, credit: amount, memo: pay.method },
          ],
        }));
        break;
      }

      case 'apartment_sale': {
        // Receipt from a buyer — analyzed per-unit below; skip here to keep
        // all unit logic in one place.
        break;
      }

      default: {
        // Untyped payment: expense-ish outflow or other inflow
        if (pay.paymentType === 'income') {
          entries.push(makeEntry({
            sourceType: 'payment',
            sourceId: pay.id,
            date: payDate,
            time: pay.time,
            projectId: pay.projectId,
            description: pay.description || `عاید دیگر (${pay.partyName || ''})`,
            currency,
            exchangeRate: rate,
            idSuffix: 'other-income',
            lines: [
              { accountCode: getCashAccountCode(pay.method || pay.paymentMethod, currency), debit: amount, memo: pay.method },
              { accountCode: ACC.OTHER_REVENUE, credit: amount, memo: pay.partyName },
            ],
          }));
        } else {
          entries.push(makeEntry({
            sourceType: 'payment',
            sourceId: pay.id,
            date: payDate,
            time: pay.time,
            projectId: pay.projectId,
            description: pay.description || `پرداخت دیگر (${pay.partyName || ''})`,
            currency,
            exchangeRate: rate,
            idSuffix: 'other-outflow',
            lines: [
              { accountCode: ACC.OTHER_PROJECT_EXPENSES, debit: amount, memo: pay.partyName },
              { accountCode: cashAcct, credit: amount, memo: pay.method },
            ],
          }));
        }
        break;
      }
    }

    // silence unused warnings for purchaseIds when tree-shaken differently
    void purchaseIds;
  }

  /* ------------------- 5. Apartment sales & receipts ------------------- */
  // Phase 3: per-project WIP cost pool + total sellable area, used to
  // relieve sold units' area-proportional cost share from WIP to COGS.
  const wipContext = new Map<string, { poolUSD: number; sellableAreaM2: number }>();
  const getWipContext = (projectId?: string) => {
    const key = projectId || '';
    if (!wipContext.has(key)) {
      const proj = input.projects.find(p => p.id === projectId);
      const projectUnits = input.apartments.filter(u => u.projectId === projectId);
      wipContext.set(key, {
        poolUSD: computeProjectCostPoolUSD({
          projectId: projectId || '',
          project: proj,
          expenses: input.expenses,
          steelRecords: input.steelRecords,
          concreteRecords: input.concreteRecords,
        }),
        sellableAreaM2: computeSellableAreaM2(projectUnits, proj),
      });
    }
    return wipContext.get(key)!;
  };

  for (const unit of input.apartments) {
    const currency = unit.currency || 'USD';
    const rate = rateOf(unit.projectId, unit.exchangeRate);
    const salePrice = round2(unit.salePrice || unit.totalPrice || 0);
    const sold = unit.status === 'sold' && salePrice > 0;
    const unitName = unit.unitNumber || unit.id;
    const saleDate = unit.saleDate || unit.contractDate || unit.createdAt?.split('T')[0] || '';
    const receiptAccount = sold ? ACC.APARTMENT_RECEIVABLES : ACC.CUSTOMER_ADVANCES;

    if (sold) {
      entries.push(makeEntry({
        sourceType: 'apartment_sale',
        sourceId: unit.id,
        date: saleDate,
        projectId: unit.projectId,
        description: `فروش واحد ${unitName} به ${unit.buyerName || ''}`,
        currency,
        exchangeRate: rate,
        idSuffix: 'sale',
        lines: [
          { accountCode: ACC.APARTMENT_RECEIVABLES, debit: salePrice, memo: `Unit ${unitName} — ${unit.buyerName || ''}` },
          { accountCode: ACC.UNIT_SALES, credit: salePrice },
        ],
      }));

      // Phase 3: relieve this unit's area-proportional cost share from WIP
      // to Cost of Units Sold (posted in USD — allocation is computed on
      // USD-normalized values; AFN equivalents are derived automatically).
      const { poolUSD, sellableAreaM2 } = getWipContext(unit.projectId);
      const allocatedUSD = allocateUnitCostUSD(unit, poolUSD, sellableAreaM2);
      if (allocatedUSD > 0) {
        entries.push(makeEntry({
          sourceType: 'apartment_sale',
          sourceId: unit.id,
          date: saleDate,
          projectId: unit.projectId,
          description: `انتقال هزینه ساخت واحد ${unitName} از پروژه در جریان به هزینه واحد فروخته‌شده (COGS)`,
          currency: 'USD',
          exchangeRate: rate,
          idSuffix: 'cogs',
          lines: [
            { accountCode: ACC.COGS, debit: allocatedUSD, memo: `Unit ${unitName}` },
            { accountCode: ACC.WIP, credit: allocatedUSD, memo: `Unit ${unitName}` },
          ],
        }));
      }
    }

    // Receipts recorded as Payment rows
    const unitPayments = input.payments.filter(p => paymentMatches(p, new Set([unit.id]), ['apartment_sale']));
    let settledUSD = 0;
    for (const rcpt of unitPayments) {
      const rc = rcpt.currency || currency;
      const rRate = rateOf(rcpt.projectId, rcpt.exchangeRate);
      const amount = round2(rcpt.amount || 0);
      if (amount <= 0) continue;
      settledUSD += rcpt.amountInUSD ?? toUSD(amount, rc, rRate);
      entries.push(makeEntry({
        sourceType: 'apartment_sale',
        sourceId: rcpt.id,
        date: rcpt.date,
        time: rcpt.time,
        projectId: unit.projectId,
        description: rcpt.description || `رسید اقساط واحد ${unitName} (${rcpt.partyName || unit.buyerName || ''})`,
        currency: rc,
        exchangeRate: rRate,
        idSuffix: 'receipt',
        lines: [
          { accountCode: getCashAccountCode(rcpt.method || rcpt.paymentMethod, rc), debit: amount, memo: rcpt.method },
          { accountCode: receiptAccount, credit: amount, memo: `Unit ${unitName}` },
        ],
      }));
    }

    // Receipts present on the unit but with no Payment row (down payments,
    // seed data, legacy) — reconcile so books match the UI.
    const received = round2(unit.amountReceived ?? unit.totalReceived ?? 0);
    const expectedReceivedUSD = toUSD(received, currency, rate);
    const diffUSD = round2(expectedReceivedUSD - settledUSD);
    if (received > 0 && diffUSD > 0.5) {
      const diffOriginal = currency === 'USD' ? diffUSD : round2(diffUSD * rate);
      entries.push(makeEntry({
        sourceType: 'apartment_sale',
        sourceId: unit.id,
        date: saleDate || new Date().toISOString().split('T')[0],
        projectId: unit.projectId,
        description: `رسید ثبت‌نشده واحد ${unitName} (${unit.buyerName || ''})`,
        currency,
        exchangeRate: rate,
        idSuffix: 'unlinked-receipt',
        lines: [
          { accountCode: currency === 'USD' ? ACC.CASH_USD : ACC.CASH_AFN, debit: diffOriginal, memo: 'Unlinked receipt reconciliation' },
          { accountCode: receiptAccount, credit: diffOriginal, memo: `Unit ${unitName}` },
        ],
      }));
    }
  }

  /* ------------------- 6. Partner investments ------------------- */
  for (const inv of input.projectInvestments) {
    const currency = inv.currency || 'AFN';
    const rate = rateOf(inv.projectId, inv.exchangeRate);
    const amount = round2(inv.amount || 0);
    if (amount <= 0) continue;
    entries.push(makeEntry({
      sourceType: 'investment',
      sourceId: inv.id,
      date: inv.date,
      projectId: inv.projectId,
      description: `${inv.type === 'initial' ? 'سرمایه اولی' : 'سرمایه اضافی'} — ${inv.partnerName || ''}`,
      currency,
      exchangeRate: rate,
      idSuffix: inv.type || 'initial',
      lines: [
        { accountCode: getCashAccountCode(inv.paymentMethod, currency), debit: amount, memo: inv.paymentMethod },
        { accountCode: inv.type === 'additional' ? ACC.ADDITIONAL_INVESTMENTS : ACC.PARTNERS_CAPITAL, credit: amount, memo: inv.partnerName },
      ],
    }));
  }

  /* ------------------- Sort: date, then stable id ------------------- */
  return entries.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  });
}

/* ------------------------------------------------------------------ */
/* Balances                                                            */
/* ------------------------------------------------------------------ */

/**
 * Compute per-account balances from a journal. Postable accounts aggregate
 * their lines; header accounts roll up from their descendants. Balances are
 * signed by the account's normal balance convention (a payable with money
 * owed shows a POSITIVE credit-normal balance).
 */
export function computeAccountBalances(entries: JournalEntry[], projectId?: string): AccountBalance[] {
  const filtered = projectId ? entries.filter(e => e.projectId === projectId) : entries;

  const sums = new Map<string, { dUSD: number; cUSD: number; dAFN: number; cAFN: number; count: number }>();
  for (const e of filtered) {
    for (const l of e.lines) {
      const cur = sums.get(l.accountCode) || { dUSD: 0, cUSD: 0, dAFN: 0, cAFN: 0, count: 0 };
      cur.dUSD += l.debitUSD;
      cur.cUSD += l.creditUSD;
      cur.dAFN += l.debitAFN;
      cur.cAFN += l.creditAFN;
      cur.count += 1;
      sums.set(l.accountCode, cur);

      // Roll up through the hierarchy
      for (const parent of getAncestorCodes(l.accountCode)) {
        const p = sums.get(parent) || { dUSD: 0, cUSD: 0, dAFN: 0, cAFN: 0, count: 0 };
        p.dUSD += l.debitUSD;
        p.cUSD += l.creditUSD;
        p.dAFN += l.debitAFN;
        p.cAFN += l.creditAFN;
        sums.set(parent, p);
      }
    }
  }

  const balances: AccountBalance[] = [];
  for (const acc of CHART_OF_ACCOUNTS) {
    const s = sums.get(acc.code);
    if (!s || (s.count === 0 && !acc.isHeader)) continue;
    const netUSD = acc.normalBalance === 'debit' ? s.dUSD - s.cUSD : s.cUSD - s.dUSD;
    const netAFN = acc.normalBalance === 'debit' ? s.dAFN - s.cAFN : s.cAFN - s.dAFN;
    balances.push({
      accountCode: acc.code,
      nameEn: acc.nameEn,
      nameFa: acc.nameFa,
      namePs: acc.namePs,
      accountType: acc.type,
      isHeader: !!acc.isHeader,
      balanceUSD: round2(netUSD),
      balanceAFN: round0(netAFN),
      debitUSD: round2(s.dUSD),
      creditUSD: round2(s.cUSD),
      debitAFN: round0(s.dAFN),
      creditAFN: round0(s.cAFN),
      entryCount: s.count,
    });
  }
  return balances;
}

/**
 * Phase 3: break down WIP-capitalized construction costs by their natural
 * classification (5100 Steel, 5200 Concrete, 5xxx...) using the
 * `costAccountCode` marker on 1500 WIP debit lines — so cost reporting
 * stays granular even though bookkeeping is functional (WIP/COGS).
 */
export function computeWipCostBreakdown(entries: JournalEntry[], projectId?: string): Array<{
  costAccountCode: string;
  nameEn: string;
  nameFa: string;
  namePs: string;
  totalUSD: number;
}> {
  const filtered = projectId ? entries.filter(e => e.projectId === projectId) : entries;
  const sums = new Map<string, number>();
  for (const e of filtered) {
    for (const l of e.lines) {
      if (l.accountCode !== ACC.WIP || !l.costAccountCode || l.debitUSD <= 0) continue;
      sums.set(l.costAccountCode, (sums.get(l.costAccountCode) || 0) + l.debitUSD);
    }
  }
  return [...sums.entries()]
    .map(([code, total]) => {
      const acc = getAccount(code);
      return {
        costAccountCode: code,
        nameEn: acc?.nameEn || code,
        nameFa: acc?.nameFa || code,
        namePs: acc?.namePs || code,
        totalUSD: round2(total),
      };
    })
    .sort((a, b) => (a.costAccountCode < b.costAccountCode ? -1 : 1));
}

/**
 * Flat trial balance over postable accounts (USD-normalized).
 * Sum of debit column always equals sum of credit column.
 */
export function buildTrialBalance(entries: JournalEntry[], projectId?: string): {
  rows: TrialBalanceRow[];
  totalDebitUSD: number;
  totalCreditUSD: number;
} {
  const filtered = projectId ? entries.filter(e => e.projectId === projectId) : entries;
  const sums = new Map<string, { d: number; c: number }>();
  for (const e of filtered) {
    for (const l of e.lines) {
      if (getAccount(l.accountCode)?.isHeader) continue;
      const cur = sums.get(l.accountCode) || { d: 0, c: 0 };
      cur.d += l.debitUSD;
      cur.c += l.creditUSD;
      sums.set(l.accountCode, cur);
    }
  }
  const rows: TrialBalanceRow[] = [...sums.entries()]
    .map(([code, s]) => {
      const acc = getAccount(code);
      const net = round2(s.d - s.c);
      return {
        accountCode: code,
        nameEn: acc?.nameEn || code,
        nameFa: acc?.nameFa || code,
        namePs: acc?.namePs || code,
        debitUSD: net > 0 ? net : 0,
        creditUSD: net < 0 ? round2(-net) : 0,
      };
    })
    .filter(r => r.debitUSD !== 0 || r.creditUSD !== 0)
    .sort((a, b) => (a.accountCode < b.accountCode ? -1 : 1));

  return {
    rows,
    totalDebitUSD: round2(rows.reduce((s, r) => s + r.debitUSD, 0)),
    totalCreditUSD: round2(rows.reduce((s, r) => s + r.creditUSD, 0)),
  };
}
