/**
 * ============================================================================
 * NIK SMART COUNT — Chart of Accounts (COA)
 * ============================================================================
 *
 * A standard, three-layer chart of accounts tailored for a construction /
 * real-estate development business (multi-storey apartment projects).
 *
 * Layers:
 *   Group (e.g. 5000)  ->  Main account (e.g. 5100)  ->  Sub account (Phase 2+,
 *   user-creatable, e.g. 5110 "Rebar — Supplier A") via `parentCode`.
 *
 * Design principles:
 *  - Users never see codes. The UI keeps working with «مصارف / پرداخت‌ها /
 *    فروشات / سرمایه‌گذاری» — the journal engine maps them to accounts
 *    behind the scenes (see `src/utils/journalEngine.ts`).
 *  - 5xxx accounts = DIRECT PROJECT costs only (they conceptually feed the
 *    Work-in-Progress asset 1500; the WIP/COGS reclass lands in Phase 3).
 *  - 6xxx accounts = company-level operating/admin expenses (NOT project
 *    costs) so project P&L stays clean.
 *  - Multi-currency: postings keep the original currency plus USD/AFN
 *    normalization at journal-line level (the app's canonical currencies).
 * ============================================================================
 */

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type NormalBalance = 'debit' | 'credit';

export interface Account {
  /** 4-digit account code, e.g. '5100' */
  code: string;
  type: AccountType;
  /** The side on which the account normally increases */
  normalBalance: NormalBalance;
  /** Parent account code for the 3-layer hierarchy (undefined for groups) */
  parentCode?: string;
  nameEn: string;
  /** Dari */
  nameFa: string;
  /** Pashto */
  namePs: string;
  /**
   * Header accounts are grouping nodes only — journal lines must never post
   * directly to them (they roll up from their children).
   */
  isHeader?: boolean;
  /**
   * System accounts are part of the standard chart and cannot be deleted by
   * users (Phase 2+ when a UI for custom sub-accounts exists).
   */
  system?: boolean;
  /** Which implementation phase the account becomes actively posted to */
  activePhase?: 1 | 2 | 3;
  description?: string;
}

/* ------------------------------------------------------------------ */
/* The Chart                                                           */
/* ------------------------------------------------------------------ */

export const CHART_OF_ACCOUNTS: Account[] = [
  /* ============================ 1000 ASSETS ============================ */
  { code: '1000', type: 'asset', normalBalance: 'debit', nameEn: 'Assets', nameFa: 'دارایی‌ها', namePs: 'شتوالۍ', isHeader: true, system: true },
  { code: '1100', type: 'asset', normalBalance: 'debit', parentCode: '1000', nameEn: 'Cash & Bank', nameFa: 'نقد و بانک', namePs: 'نقد او بانک', isHeader: true, system: true },
  { code: '1110', type: 'asset', normalBalance: 'debit', parentCode: '1100', nameEn: 'Cash (AFN)', nameFa: 'صندوق افغانی', namePs: 'د افغانیو صندوق', system: true, activePhase: 1 },
  { code: '1120', type: 'asset', normalBalance: 'debit', parentCode: '1100', nameEn: 'Cash (USD)', nameFa: 'صندوق دالر', namePs: 'د ډالرو صندوق', system: true, activePhase: 1 },
  { code: '1130', type: 'asset', normalBalance: 'debit', parentCode: '1100', nameEn: 'Bank Account', nameFa: 'حساب بانکی', namePs: 'بانکي حساب', system: true, activePhase: 1 },
  { code: '1140', type: 'asset', normalBalance: 'debit', parentCode: '1100', nameEn: 'Hawala / Sarafi Balance', nameFa: 'کمیون صرافی (حواله)', namePs: 'د صرافۍ حساب (حواله)', system: true, activePhase: 1 },
  { code: '1200', type: 'asset', normalBalance: 'debit', parentCode: '1000', nameEn: 'Apartment Receivables', nameFa: 'دریافتنی از خریداران آپارتمان', namePs: 'د اپارتمانونو له پیرودونکو ترلاسه کیدونکي', system: true, activePhase: 1,
    description: 'Amounts still owed by unit buyers (sale price minus receipts).' },
  { code: '1300', type: 'asset', normalBalance: 'debit', parentCode: '1000', nameEn: 'Advances to Suppliers', nameFa: 'پیش‌پرداخت به فروشنده‌گان', namePs: 'پلورونکو ته مخکینۍ تادیه', system: true, activePhase: 3 },
  { code: '1400', type: 'asset', normalBalance: 'debit', parentCode: '1000', nameEn: 'Material Inventory', nameFa: 'موجودی مواد', namePs: 'د موادو زیرمه', system: true, activePhase: 3 },
  { code: '1500', type: 'asset', normalBalance: 'debit', parentCode: '1000', nameEn: 'Construction Work in Progress (WIP)', nameFa: 'پروژه در جریان ساخت (WIP)', namePs: 'روانه پروژه (WIP)', system: true, activePhase: 3,
    description: 'Capitalized direct project costs per project; relieved to COGS on unit sale (Phase 3).' },
  { code: '1600', type: 'asset', normalBalance: 'debit', parentCode: '1000', nameEn: 'Deposits', nameFa: 'ودیعه‌ها و امانت‌های داده‌شده', namePs: 'امانتونه', system: true, activePhase: 2 },
  { code: '1800', type: 'asset', normalBalance: 'debit', parentCode: '1000', nameEn: 'Fixed Assets', nameFa: 'دارایی‌های ثابت (مکینت، داربست، وسایط)', namePs: 'ثابتې شتوالۍ', system: true, activePhase: 2 },

  /* ========================= 2000 LIABILITIES ========================= */
  { code: '2000', type: 'liability', normalBalance: 'credit', nameEn: 'Liabilities', nameFa: 'بدهی‌ها', namePs: 'پورونه', isHeader: true, system: true },
  { code: '2100', type: 'liability', normalBalance: 'credit', parentCode: '2000', nameEn: 'Accounts Payable', nameFa: 'حساب‌های پرداختنی', namePs: 'تادیه وړ حسابونه', isHeader: true, system: true },
  { code: '2200', type: 'liability', normalBalance: 'credit', parentCode: '2100', nameEn: 'Supplier Payables', nameFa: 'بدهی به فروشنده‌گان', namePs: 'پلورونکو ته پور', system: true, activePhase: 1 },
  { code: '2250', type: 'liability', normalBalance: 'credit', parentCode: '2100', nameEn: 'Contractor Payables', nameFa: 'بدهی به قراردادکاران', namePs: 'قراردادکارانو ته پور', system: true, activePhase: 1 },
  { code: '2300', type: 'liability', normalBalance: 'credit', parentCode: '2000', nameEn: 'Customer Advances', nameFa: 'پیش‌دریافت از خریداران (قبل از قرارداد فروش)', namePs: 'له پیرودونکو څخه مخکینۍ ترلاسه کول', system: true, activePhase: 1,
    description: 'Receipts from buyers of RESERVED (not yet formally sold) units.' },
  { code: '2400', type: 'liability', normalBalance: 'credit', parentCode: '2000', nameEn: 'Retention Payable', nameFa: 'امانت نگهداشته‌شده نزد قراردادکار', namePs: 'قراردادکار ته ساتل شوی امانت', system: true, activePhase: 2,
    description: 'Percentage withheld from contractor progress payments (retentionPercentage).' },
  { code: '2500', type: 'liability', normalBalance: 'credit', parentCode: '2000', nameEn: 'Loans Payable', nameFa: 'قرض‌ها و وام‌ها', namePs: 'پورونه او قرضې', system: true, activePhase: 2 },
  { code: '2600', type: 'liability', normalBalance: 'credit', parentCode: '2000', nameEn: 'Taxes Payable', nameFa: 'مالیات قابل پرداخت', namePs: 'تادیه وړ مالیه', system: true, activePhase: 2 },
  { code: '2900', type: 'liability', normalBalance: 'credit', parentCode: '2000', nameEn: 'Other Liabilities', nameFa: 'سایر بدهی‌ها (شامل پرداخت از جیب شخصی)', namePs: 'نور پورونه', system: true, activePhase: 1 },

  /* ============================ 3000 EQUITY =========================== */
  { code: '3000', type: 'equity', normalBalance: 'credit', nameEn: 'Equity', nameFa: 'سرمایه', namePs: 'پانګه', isHeader: true, system: true },
  { code: '3100', type: 'equity', normalBalance: 'credit', parentCode: '3000', nameEn: "Partners' Capital (Initial)", nameFa: 'سرمایه اولی شرکا', namePs: 'د شریکانو لومړنۍ پانګه', system: true, activePhase: 1 },
  { code: '3200', type: 'equity', normalBalance: 'credit', parentCode: '3000', nameEn: 'Additional Investments', nameFa: 'سرمایه‌گذاری‌های اضافی شرکا', namePs: 'د شریکانو اضافي پانګه اچونه', system: true, activePhase: 1 },
  { code: '3300', type: 'equity', normalBalance: 'debit', parentCode: '3000', nameEn: 'Partner Drawings', nameFa: 'برداشت شرکا', namePs: 'د شریکانو را ایستل', system: true, activePhase: 2,
    description: 'Contra-equity: money partners take OUT of the business.' },
  { code: '3400', type: 'equity', normalBalance: 'credit', parentCode: '3000', nameEn: 'Retained Earnings', nameFa: 'سود و زیان انباشته', namePs: 'ذخیره شوې ګټه او زیان', system: true, activePhase: 2 },

  /* ============================ 4000 REVENUE ========================== */
  { code: '4000', type: 'revenue', normalBalance: 'credit', nameEn: 'Revenue', nameFa: 'درآمد', namePs: 'عاید', isHeader: true, system: true },
  { code: '4100', type: 'revenue', normalBalance: 'credit', parentCode: '4000', nameEn: 'Apartment & Unit Sales', nameFa: 'فروش آپارتمان و واحدها', namePs: 'د اپارتمانونو او واحدونو پلور', system: true, activePhase: 1 },
  { code: '4200', type: 'revenue', normalBalance: 'credit', parentCode: '4000', nameEn: 'Rental Income', nameFa: 'درآمد کرایه (دوکان‌ها و غیره)', namePs: 'د کرایې عاید', system: true, activePhase: 2 },
  { code: '4300', type: 'revenue', normalBalance: 'credit', parentCode: '4000', nameEn: 'Other Project Revenue', nameFa: 'سایر درآمدها (فروش مواد مازاد، ضایعات)', namePs: 'د پروژې نور عایدونه', system: true, activePhase: 1 },

  /* ================ 5000 PROJECT / CONSTRUCTION COSTS ================= */
  { code: '5000', type: 'expense', normalBalance: 'debit', nameEn: 'Construction / Project Costs', nameFa: 'هزینه‌های ساخت پروژه', namePs: 'د پروژې د جوړښت لګښتونه', isHeader: true, system: true,
    description: 'DIRECT project costs only. Conceptually these feed WIP (1500); WIP/COGS reclass arrives in Phase 3.' },
  { code: '5050', type: 'expense', normalBalance: 'debit', parentCode: '5000', nameEn: 'Cost of Units Sold (COGS)', nameFa: 'هزینه واحدهای فروخته‌شده', namePs: 'د پلورل شویو واحدونو لګښت', system: true, activePhase: 3 },
  { code: '5100', type: 'expense', normalBalance: 'debit', parentCode: '5000', nameEn: 'Steel & Rebar', nameFa: 'آهن و میل‌گرد', namePs: 'اوسپنه او سیخ ګول', system: true, activePhase: 1 },
  { code: '5200', type: 'expense', normalBalance: 'debit', parentCode: '5000', nameEn: 'Concrete & Pumping', nameFa: 'کانکریت و پمپ', namePs: 'کانکریت او پمپ', system: true, activePhase: 1 },
  { code: '5300', type: 'expense', normalBalance: 'debit', parentCode: '5000', nameEn: 'Cement', nameFa: 'سیمنت', namePs: 'سمنټ', system: true, activePhase: 1 },
  { code: '5400', type: 'expense', normalBalance: 'debit', parentCode: '5000', nameEn: 'Sand & Gravel', nameFa: 'ریگ و شن', namePs: 'شګه او ریګ', system: true, activePhase: 1 },
  { code: '5500', type: 'expense', normalBalance: 'debit', parentCode: '5000', nameEn: 'Masonry (Blocks & Bricks)', nameFa: 'بلاک، آجر و بنایات', namePs: 'بلاک، خشتې او بنایات', system: true, activePhase: 1 },
  { code: '5600', type: 'expense', normalBalance: 'debit', parentCode: '5000', nameEn: 'Labour & Wages', nameFa: 'مزد و نیروی انسانی', namePs: 'مزد او کارګران', system: true, activePhase: 1 },
  { code: '5700', type: 'expense', normalBalance: 'debit', parentCode: '5000', nameEn: 'Machinery & Equipment Rental', nameFa: 'کرایه ماشین‌آلات و تجهیزات', namePs: 'د ماشینونو او تجهیزاتو کرایه', system: true, activePhase: 1 },
  { code: '5800', type: 'expense', normalBalance: 'debit', parentCode: '5000', nameEn: 'Transportation & Logistics', nameFa: 'ترانسپورت و حمل‌ونقل', namePs: 'ترانسپورت او لېږد', system: true, activePhase: 1 },
  { code: '5900', type: 'expense', normalBalance: 'debit', parentCode: '5000', nameEn: 'Site Utilities & Fuel', nameFa: 'آب‌وبرق و تیل ساحه', namePs: 'د ساحې اوبه، برق او تیل', system: true, activePhase: 1 },
  { code: '5910', type: 'expense', normalBalance: 'debit', parentCode: '5000', nameEn: 'Formwork & Scaffolding', nameFa: 'قالب‌بندی و داربست', namePs: 'قالب بندي او داربست', system: true, activePhase: 1 },
  { code: '5920', type: 'expense', normalBalance: 'debit', parentCode: '5000', nameEn: 'Electrical Works', nameFa: 'برق‌کاری و تأسیسات برقی', namePs: 'د برېښنا کارونه', system: true, activePhase: 1 },
  { code: '5930', type: 'expense', normalBalance: 'debit', parentCode: '5000', nameEn: 'Plumbing & Sanitary', nameFa: 'لوله‌کاری و تأسیسات صحی', namePs: 'د لولو او صحي کارونه', system: true, activePhase: 1 },
  { code: '5940', type: 'expense', normalBalance: 'debit', parentCode: '5000', nameEn: 'Carpentry, Doors & Windows', nameFa: 'نجاری، دروازه و ورک', namePs: 'نجاري، دروازې او ورکونه', system: true, activePhase: 1 },
  { code: '5950', type: 'expense', normalBalance: 'debit', parentCode: '5000', nameEn: 'Tiles, Paint & Finishing', nameFa: 'کاشی، نقاشی و تکمیل‌کاری', namePs: 'کاشي، رنګ او بشپړونکي کار', system: true, activePhase: 1 },
  { code: '5960', type: 'expense', normalBalance: 'debit', parentCode: '5000', nameEn: 'Elevator, Excavation & Shoring', nameFa: 'لیفتر، حفاری و تکیه‌گاه', namePs: 'لفټ، کیندنه او تکیه ګاه', system: true, activePhase: 1 },
  { code: '5970', type: 'expense', normalBalance: 'debit', parentCode: '5000', nameEn: 'Permits, Fees & Engineering', nameFa: 'جواز، فیس و انجنیری', namePs: 'جواز، فیس او انجنیري', system: true, activePhase: 1 },
  { code: '5980', type: 'expense', normalBalance: 'debit', parentCode: '5000', nameEn: 'Project & Site Overhead', nameFa: 'مصارف اداری و نگهبانی ساحه', namePs: 'د ساحې اداري لګښتونه', system: true, activePhase: 1 },
  { code: '5990', type: 'expense', normalBalance: 'debit', parentCode: '5000', nameEn: 'Other Project Expenses', nameFa: 'سایر مصارف پروژه', namePs: 'د پروژې نور لګښتونه', system: true, activePhase: 1,
    description: 'Default/fallback bucket for unmapped or custom expense categories.' },

  /* ================= 6000 OPERATING & ADMIN (COMPANY) ================= */
  { code: '6000', type: 'expense', normalBalance: 'debit', nameEn: 'Operating & Admin Expenses', nameFa: 'هزینه‌های اداری عمومی (غیر از پروژه)', namePs: 'عمومي اداري لګښتونه', isHeader: true, system: true,
    description: 'Company-level overheads — NOT project costs, kept out of project P&L.' },
  { code: '6100', type: 'expense', normalBalance: 'debit', parentCode: '6000', nameEn: 'Office Rent & Admin', nameFa: 'کرایه و مصارف دفتر مرکزی', namePs: 'د مرکزي دفتر کرایه او لګښتونه', system: true, activePhase: 2 },
  { code: '6200', type: 'expense', normalBalance: 'debit', parentCode: '6000', nameEn: 'Admin Salaries', nameFa: 'معاشات کارمندان اداری', namePs: 'د اداري کارکوونکو معاشونه', system: true, activePhase: 2 },
  { code: '6300', type: 'expense', normalBalance: 'debit', parentCode: '6000', nameEn: 'Marketing & Advertising', nameFa: 'بازاریابی و تبلیغات', namePs: 'بازار موندنه او اعلانونه', system: true, activePhase: 2 },
  { code: '6900', type: 'expense', normalBalance: 'debit', parentCode: '6000', nameEn: 'Other Operating Expenses', nameFa: 'سایر هزینه‌های عملیاتی', namePs: 'نور عملیاتي لګښتونه', system: true, activePhase: 2 },

  /* ========================= 7000 FINANCE COSTS ======================= */
  { code: '7000', type: 'expense', normalBalance: 'debit', nameEn: 'Finance Costs', nameFa: 'هزینه‌های مالی', namePs: 'مالي لګښتونه', isHeader: true, system: true },
  { code: '7100', type: 'expense', normalBalance: 'debit', parentCode: '7000', nameEn: 'Bank Charges', nameFa: 'کارمزد بانک', namePs: 'د بانک فیس', system: true, activePhase: 2 },
  { code: '7200', type: 'expense', normalBalance: 'debit', parentCode: '7000', nameEn: 'Loan & Finance Cost', nameFa: 'هزینه قرض و سود', namePs: 'د پور لګښت او ګټه', system: true, activePhase: 2 },

  /* ============================ 8000 OTHER ============================ */
  { code: '8000', type: 'expense', normalBalance: 'debit', nameEn: 'Other Accounts', nameFa: 'سایر حساب‌ها', namePs: 'نور حسابونه', isHeader: true, system: true },
  { code: '8100', type: 'expense', normalBalance: 'debit', parentCode: '8000', nameEn: 'Accounting Adjustments', nameFa: 'تعدیلات حسابداری', namePs: 'د محاسبې سمونونه', system: true, activePhase: 2 },
  { code: '8200', type: 'expense', normalBalance: 'debit', parentCode: '8000', nameEn: 'Suspense Account', nameFa: 'حساب موقت (در انتظار طبقه‌بندی)', namePs: 'لنډمهاله حساب', system: true, activePhase: 2,
    description: 'Temporary parking for unclassifiable items until corrected.' },
];

/* ------------------------------------------------------------------ */
/* Lookup helpers                                                      */
/* ------------------------------------------------------------------ */

const ACCOUNT_INDEX: Map<string, Account> = new Map(CHART_OF_ACCOUNTS.map(a => [a.code, a]));

export function getAccount(code: string): Account | undefined {
  return ACCOUNT_INDEX.get(code);
}

export function getAccountName(code: string, lang: 'en' | 'fa' | 'ps' = 'fa'): string {
  const acc = ACCOUNT_INDEX.get(code);
  if (!acc) return code;
  return lang === 'ps' ? acc.namePs : lang === 'en' ? acc.nameEn : acc.nameFa;
}

export function isPostingAccount(code: string): boolean {
  const acc = ACCOUNT_INDEX.get(code);
  return !!acc && !acc.isHeader;
}

/** All postable (non-header) accounts */
export function getPostingAccounts(): Account[] {
  return CHART_OF_ACCOUNTS.filter(a => !a.isHeader);
}

/** Accounts belonging to a top-level group, e.g. groupCode '5000' */
export function getAccountsInGroup(groupCode: string): Account[] {
  return CHART_OF_ACCOUNTS.filter(a => a.code.startsWith(groupCode[0]));
}

/**
 * Walk `parentCode` chain upward and return ancestor codes (closest first).
 */
export function getAncestorCodes(code: string): string[] {
  const chain: string[] = [];
  let current = ACCOUNT_INDEX.get(code);
  let guard = 0;
  while (current?.parentCode && guard++ < 10) {
    chain.push(current.parentCode);
    current = ACCOUNT_INDEX.get(current.parentCode);
  }
  return chain;
}

/* ------------------------------------------------------------------ */
/* Expense category -> account mapping                                 */
/* ------------------------------------------------------------------ */

/**
 * The app never stores account codes — users pick business categories
 * (e.g. 'Cement', 'Formwork', 'Daily Labour Wages', custom categories...).
 * This map routes every known category (English ids, English labels, Dari
 * labels from the modals, and legacy seed values) to its project-cost
 * account. Lookup is normalized (lowercase/trim) and falls back to 5990.
 */
export const EXPENSE_CATEGORY_ACCOUNT_MAP: Record<string, string> = {
  // ---- 5100 Steel ----
  'steel': '5100', 'steel / rebar': '5100', 'steel/rebar': '5100', 'rebar': '5100',
  'سیخ': '5100', 'سیخ‌گول': '5100', 'سیخ‌گول (فولاد)': '5100',

  // ---- 5200 Concrete ----
  'concrete': '5200', 'concrete & pump': '5200', 'concrete & pumping': '5200',
  'کانکریت': '5200', 'کانکریت و پمپ': '5200',

  // ---- 5300 Cement ----
  'cement': '5300', 'سیمنت': '5300',
  'materials': '5300', 'building materials': '5300',

  // ---- 5400 Sand & Gravel ----
  'sand': '5400', 'gravel': '5400', 'sand & gravel': '5400', 'ریگ': '5400',

  // ---- 5500 Masonry ----
  'masonry': '5500', 'brick / block masonry': '5500', 'blocks': '5500',
  'bricks': '5500', 'بلاک': '5500', 'آجر': '5500',

  // ---- 5600 Labour ----
  'labour': '5600', 'labor': '5600', 'direct labour': '5600', 'wages': '5600',
  'daily_labour': '5600', 'daily labour wages': '5600',
  'worker_food': '5600', 'worker meals & food': '5600',
  'مزد': '5600', 'مزد کارگران روزمزد': '5600', 'نان و غذای کارگران': '5600',

  // ---- 5700 Machinery ----
  'machinery': '5700', 'machinery & equipment rental': '5700', 'equipment': '5700',

  // ---- 5800 Transportation ----
  'transportation': '5800', 'transportation & logistics': '5800',
  'transportation & fares': '5800', 'transport': '5800',
  'کرایه موتر و ترانسپورت': '5800',

  // ---- 5900 Utilities & Fuel ----
  'utilities': '5900', 'electricity': '5900', 'water': '5900',
  'fuel': '5900', 'fuel & generator': '5900',

  // ---- 5910 Formwork & Scaffolding ----
  'formwork': '5910', 'formwork & carpentry': '5910', 'formwork & shuttering': '5910',
  'formworkcontract': '5910',
  'scaffolding': '5910', 'scaffolding (rental & fix)': '5910',
  'wood_supplier': '5910', 'plywood & wood supplier': '5910',
  'tie_wire': '5910', 'tie wire & steel fixer': '5910',
  'قالب‌بندی و نجاری (تخته و چوب)': '5910', 'اسکافولد و داربست (کرایه و بستن)': '5910',

  // ---- 5920 Electrical ----
  'electrical': '5920', 'electrical works': '5920', 'برق‌کاری و تأسیسات برقی': '5920',

  // ---- 5930 Plumbing ----
  'plumbing': '5930', 'plumbing & sanitary': '5930',

  // ---- 5940 Carpentry, Doors & Windows ----
  'carpentry': '5940', 'doors': '5940', 'windows': '5940', 'windows & glazing': '5940',
  'doors & windows': '5940', 'doorswindows': '5940',

  // ---- 5950 Tiles, Paint & Finishing ----
  'paint': '5950', 'paint & finishes': '5950', 'painting': '5950', 'painting & finishes': '5950',
  'finishing': '5950', 'finishing materials': '5950',
  'tiles': '5950', 'tiles & flooring': '5950',
  'plaster': '5950', 'plaster & finishing': '5950',

  // ---- 5960 Elevator & Excavation ----
  'elevator': '5960', 'elevator & lifts': '5960',
  'excavation': '5960', 'excavation & shoring': '5960',

  // ---- 5970 Permits, Fees & Engineering ----
  'taxes': '5970', 'taxes & municipal fees': '5970',
  'landpermits': '5970', 'land / municipality / permits': '5970',
  'municipality': '5970', 'district / municipality fee': '5970',
  'تعرفه ناحیه و شاروالی': '5970',
  'engineering': '5970', 'engineering & design': '5970', 'permits': '5970',

  // ---- 5980 Site Overhead ----
  'security': '5980', 'site security guard': '5980',

  // ---- 5990 Other ----
  'other': '5990', 'other construction expenses': '5990', 'other construction costs': '5990',
  'miscellaneous': '5990', 'miscellaneous expenses': '5990',
  'مصارف متفرقه و پیش‌بینی‌نشده': '5990',
};

export const DEFAULT_EXPENSE_ACCOUNT = '5990';

/** Substrings checked (lower-cased) when an exact map entry is missing */
const FUZZY_CATEGORY_HINTS: Array<[string, string]> = [
  ['steel', '5100'], ['rebar', '5100'], ['سیخ', '5100'], ['آهن', '5100'],
  ['concrete', '5200'], ['کانکریت', '5200'], ['pump', '5200'],
  ['cement', '5300'], ['سیمنت', '5300'],
  ['sand', '5400'], ['gravel', '5400'], ['ریگ', '5400'], ['شن', '5400'],
  ['masonry', '5500'], ['block', '5500'], ['brick', '5500'], ['بلاک', '5500'], ['آجر', '5500'],
  ['labour', '5600'], ['labor', '5600'], ['wage', '5600'], ['worker', '5600'], ['کارگر', '5600'], ['مزد', '5600'],
  ['machin', '5700'], ['equipment', '5700'], ['mixer', '5700'], ['crane', '5700'], ['حفار', '5700'],
  ['transport', '5800'], ['فلیت', '5800'], ['کرایه موتر', '5800'],
  ['fuel', '5900'], ['diesel', '5900'], ['generator', '5900'], ['تیل', '5900'], ['برق', '5920'],
  ['formwork', '5910'], ['scaffold', '5910'], ['shutter', '5910'], ['قالب', '5910'], ['داربست', '5910'], ['tie wire', '5910'],
  ['electric', '5920'], ['wire', '5920'],
  ['plumb', '5930'], ['pipe', '5930'], ['sanitary', '5930'], ['لوله', '5930'],
  ['door', '5940'], ['window', '5940'], ['carpent', '5940'], ['نجار', '5940'], ['ورک', '5940'],
  ['paint', '5950'], ['tile', '5950'], ['plaster', '5950'], ['finish', '5950'], ['نقاش', '5950'], ['کاشي', '5950'], ['کاشی', '5950'],
  ['elevator', '5960'], ['lift', '5960'], ['excavat', '5960'], ['لیفتر', '5960'], ['حفار', '5960'],
  ['permit', '5970'], ['municipal', '5970'], ['tax', '5970'], ['engineering', '5970'], ['جواز', '5970'], ['شاروال', '5970'], ['ناحیه', '5970'],
  ['security', '5980'], ['guard', '5980'], ['نگهبان', '5980'],
  ['food', '5600'], ['نان', '5600'],
];

/**
 * Resolve any user-facing expense category (stored on `Expense.category`)
 * to its project-cost account code. Never fails — falls back to 5990.
 */
export function resolveExpenseAccount(category?: string): string {
  if (!category) return DEFAULT_EXPENSE_ACCOUNT;
  const key = category.trim().toLowerCase();
  if (EXPENSE_CATEGORY_ACCOUNT_MAP[key]) return EXPENSE_CATEGORY_ACCOUNT_MAP[key];
  for (const [hint, code] of FUZZY_CATEGORY_HINTS) {
    if (key.includes(hint)) return code;
  }
  return DEFAULT_EXPENSE_ACCOUNT;
}

/* ------------------------------------------------------------------ */
/* Well-known account codes (single source of truth for the engine)    */
/* ------------------------------------------------------------------ */

export const ACC = {
  CASH_AFN: '1110',
  CASH_USD: '1120',
  BANK: '1130',
  HAWALA: '1140',
  APARTMENT_RECEIVABLES: '1200',
  ADVANCES_TO_SUPPLIERS: '1300',
  MATERIAL_INVENTORY: '1400',
  WIP: '1500',
  SUPPLIER_PAYABLES: '2200',
  CONTRACTOR_PAYABLES: '2250',
  CUSTOMER_ADVANCES: '2300',
  RETENTION_PAYABLE: '2400',
  OTHER_LIABILITIES: '2900',
  PARTNERS_CAPITAL: '3100',
  ADDITIONAL_INVESTMENTS: '3200',
  PARTNER_DRAWINGS: '3300',
  UNIT_SALES: '4100',
  OTHER_REVENUE: '4300',
  COGS: '5050',
  STEEL: '5100',
  CONCRETE: '5200',
  OTHER_PROJECT_EXPENSES: '5990',
  SUSPENSE: '8200',
} as const;
