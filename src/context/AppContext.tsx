import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { 
  Language, 
  User, 
  Project, 
  Expense, 
  SteelRecord, 
  ConcreteRecord, 
  Contractor, 
  Supplier, 
  ApartmentUnit, 
  Payment, 
  PaymentStatus,
  DocumentRecord, 
  AuditLog, 
  ProjectFinancialSummary,
  AppSettings,
  AppTheme,
  ProjectPartner,
  ProjectInvestment,
  ProjectTransferEvent,
  GoogleDriveConfig,
  InstallmentRecord,
  InstallmentPaymentRecord,
  SystemReminderNotification,
  JournalEntry,
  AccountBalance,
  TrialBalanceRow,
  ProjectBudget,
  BudgetLineReport,
  UserPermissions,
  UserActivityEvent,
  CustomBillDesign,
  CustomActionButton,
  LaborRecord,
  FixedAsset,
  PartnerEquityTransfer,
  IncomeRecord,
  MaterialProcurementRecord,
  InterProjectTransferRecord
} from '../types';
import { translations } from '../i18n/translations';
import { isRtlLanguage } from '../i18n/localize';
import { calculateInstallmentStatus, normalizeApartmentInstallments, generateSmartReminders } from '../utils/installmentUtils';
import { buildJournal, computeAccountBalances, buildTrialBalance } from '../utils/journalEngine';
import { CHART_OF_ACCOUNTS, getAccountName } from '../data/chartOfAccounts';
import type { Account } from '../data/chartOfAccounts';
import { computeBudgetReport } from '../utils/budgetUtils';
import { backendApi } from '../services/backendApi';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  authLoading: boolean;
  workspaceReady: boolean;
  workspaceSaving: boolean;
  workspaceError: string | null;
  t: ((key: string) => string) & typeof translations['en'];
  currentUser: User | null;
  login: (usernameOrEmail: string, password?: string, loginType?: 'admin' | 'employee') => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchUserRole: (role: 'admin' | 'accountant' | 'viewer') => void;
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  /** دفتر هفت: per-user usage telemetry (features visited, login/logout moments) */
  activityEvents: UserActivityEvent[];
  trackFeature: (feature: string, label?: string) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  toggleUserActive: (id: string) => void;
  registerCompanyOwner: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    companyName: string;
    companyAddress: string;
  }) => { success: boolean; otpCode: string; error?: string };
  verifyOtpAndActivate: (email: string, otpCode: string) => { success: boolean; error?: string };
  requestPasswordReset: (email: string) => { success: boolean; otpCode?: string; error?: string };
  completePasswordReset: (email: string, otpCode: string, newPassword: string) => { success: boolean; error?: string };
  chargeUserSubscription: (userId: string, durationMonths: number) => Promise<{ success: boolean; error?: string; subscriptionExpiresAt?: string }>;
  toggleLockUserBySuperAdmin: (userId: string) => Promise<{ success: boolean; error?: string; isLocked?: boolean }>;
  createTenantCompanyOwnerBySuperAdmin: (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    phone: string;
    companyName: string;
    companyAddress?: string;
    subscriptionMonths?: number;
    initialProjectName?: string;
  }) => { success: boolean; user?: User; error?: string };
  createEmployeeAccount: (employee: {
    name: string;
    username: string;
    email: string;
    password: string;
    phone?: string;
    role: 'accountant' | 'viewer';
    permissions: User['permissions'];
  }) => { success: boolean; error?: string };
  updateEmployeeAccount: (employeeId: string, updates: {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    permissions?: User['permissions'];
    active?: boolean;
  }) => { success: boolean; error?: string };
  deleteEmployeeAccount: (employeeId: string) => void;
  toggleAiForUser: (userId: string, enabled: boolean) => void;
  updateTenantByMasterAdmin: (userId: string, updates: {
    name?: string;
    email?: string;
    phone?: string;
    companyName?: string;
    companyAddress?: string;
    password?: string;
    customLogoUrl?: string;
    customBillDesign?: CustomBillDesign;
    customButtonConfig?: CustomActionButton[];
    customEnabledModules?: User['customEnabledModules'];
    aiEnabled?: boolean;
    subscriptionExpiresAt?: string;
    isLockedBySuperAdmin?: boolean;
    active?: boolean;
    /** Master-level permission merge (tab access, manage flags) */
    permissions?: Partial<UserPermissions>;
  }) => Promise<{ success: boolean; error?: string }>;
  impersonateTenant: (user: User) => void;
  toggleDarkMode: () => void;
  setTheme: (theme: AppTheme) => void;
  themeSchedule: 'auto' | 'light' | 'dark';
  setThemeSchedule: (mode: 'auto' | 'light' | 'dark') => void;
  cycleThemeSchedule: () => void;
  isTabAllowed: (tabId: string) => boolean;
  updateReportCustomization: (updates: Partial<import('../types').ReportCustomization>) => void;
  uploadCustomReportTemplate: (fileName: string, fileContent: string) => void;
  projects: Project[];
  currentProject: Project | null;
  setCurrentProjectId: (id: string) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  transferProject: (transferData: Omit<import('../types').ProjectTransferEvent, 'id' | 'createdAt'>) => import('../types').ProjectTransferEvent;
  projectPartners: ProjectPartner[];
  projectInvestments: ProjectInvestment[];
  addProjectPartner: (partner: Omit<ProjectPartner, 'id' | 'createdAt'>) => ProjectPartner;
  updateProjectPartner: (id: string, updates: Partial<ProjectPartner>) => void;
  deleteProjectPartner: (id: string) => void;
  addProjectInvestment: (investment: Omit<ProjectInvestment, 'id' | 'createdAt'>) => ProjectInvestment;
  updateProjectInvestment: (id: string, updates: Partial<ProjectInvestment>) => void;
  deleteProjectInvestment: (id: string) => void;
  partnerEquityTransfers: PartnerEquityTransfer[];
  transferPartnerEquity: (transfer: Omit<PartnerEquityTransfer, 'id' | 'createdAt'>) => PartnerEquityTransfer;
  getProjectPartners: (projectId: string) => ProjectPartner[];
  getProjectInvestments: (projectId: string) => ProjectInvestment[];
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'createdBy'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  getExpensePayments: (expenseId: string) => Payment[];
  steelRecords: SteelRecord[];
  addSteelRecord: (record: Omit<SteelRecord, 'id' | 'tons' | 'totalAmount' | 'remainingBalance' | 'createdAt'>) => void;
  updateSteelRecord: (id: string, updates: Partial<SteelRecord>) => void;
  deleteSteelRecord: (id: string) => void;
  concreteRecords: ConcreteRecord[];
  addConcreteRecord: (record: Omit<ConcreteRecord, 'id' | 'totalAmount' | 'remainingBalance' | 'createdAt'>) => void;
  updateConcreteRecord: (id: string, updates: Partial<ConcreteRecord>) => void;
  deleteConcreteRecord: (id: string) => void;
  contractors: Contractor[];
  addContractor: (contractor: Omit<Contractor, 'id' | 'createdAt'>) => void;
  updateContractor: (id: string, updates: Partial<Contractor>) => void;
  deleteContractor: (id: string) => void;
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  laborRecords: LaborRecord[];
  addLaborRecord: (record: Omit<LaborRecord, 'id' | 'createdAt'>) => void;
  deleteLaborRecord: (id: string) => void;
  assets: FixedAsset[];
  addAsset: (asset: Omit<FixedAsset, 'id' | 'createdAt'>) => void;
  updateAsset: (id: string, updates: Partial<FixedAsset>) => void;
  deleteAsset: (id: string) => void;
  apartments: ApartmentUnit[];
  addApartment: (unit: Omit<ApartmentUnit, 'id' | 'salePrice' | 'remainingBalance' | 'createdAt'> & { salePrice?: number }) => void;
  updateApartment: (id: string, updates: Partial<ApartmentUnit>) => void;
  deleteApartment: (id: string) => void;
  addInstallmentPayment: (apartmentId: string, installmentId: string, amount: number, paymentMethod?: string, receiptNumber?: string, notes?: string) => void;
  updateInstallment: (apartmentId: string, installmentId: string, updates: Partial<InstallmentRecord>) => void;
  addInstallmentToApartment: (apartmentId: string, installmentData: Omit<InstallmentRecord, 'id' | 'remainingAmount' | 'status' | 'paymentHistory'>) => void;
  deleteInstallment: (apartmentId: string, installmentId: string) => void;
  // Notifications & Reminders
  notifications: SystemReminderNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  refreshReminders: () => void;
  isNotificationCenterOpen: boolean;
  setIsNotificationCenterOpen: (open: boolean) => void;
  selectedNotification: SystemReminderNotification | null;
  setSelectedNotification: (n: SystemReminderNotification | null) => void;
  payments: Payment[];
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt' | 'createdBy'>) => void;
  updatePayment: (id: string, updates: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
  appSettings: AppSettings;
  updateAppSettings: (updates: Partial<AppSettings>) => void;
  debtorParties: Array<{
    partyName: string;
    category: string;
    relatedType: 'contractor' | 'supplier' | 'steel' | 'concrete' | 'expense' | 'material_steel' | 'material_concrete';
    relatedId: string;
    debtAmount: number;
    title: string;
  }>;
  documents: DocumentRecord[];
  addDocument: (doc: Omit<DocumentRecord, 'id' | 'createdAt'>) => void;
  deleteDocument: (id: string) => void;
  auditLogs: AuditLog[];
  logAudit: (
    action: 'create' | 'update' | 'delete' | 'login' | string,
    entityType: AuditLog['entityType'],
    entityId: string,
    recordTitle: string,
    details: string,
    previousValue?: string,
    newValue?: string,
    projId?: string
  ) => void;
  currentFinancials: ProjectFinancialSummary;
  getProjectFinancials: (projectId: string) => ProjectFinancialSummary;
  /**
   * Accounting layer (Chart of Accounts). The double-entry journal is a
   * pure projection derived from the business records — it is rebuilt
   * automatically whenever expenses/steel/concrete/payments/apartments/
   * investments change, so it can never drift out of sync with the UI data.
   */
  chartOfAccounts: Account[];
  getAccountDisplayName: (code: string, lang?: Language) => string;
  journalEntries: JournalEntry[];
  accountBalances: AccountBalance[];
  getAccountBalance: (accountCode: string, projectId?: string) => AccountBalance | undefined;
  getTrialBalance: (projectId?: string) => { rows: TrialBalanceRow[]; totalDebitUSD: number; totalCreditUSD: number };
  getProjectJournal: (projectId: string) => JournalEntry[];
  /** Project Budget: one budget line per (project, COA account) */
  projectBudgets: ProjectBudget[];
  incomeRecords: IncomeRecord[];
  addIncomeRecord: (record: Omit<IncomeRecord, 'id' | 'createdAt'>) => void;
  materialProcurements: MaterialProcurementRecord[];
  addMaterialProcurement: (record: Omit<MaterialProcurementRecord, 'id' | 'totalCost' | 'createdAt' | 'accountCode'>) => void;
  interProjectTransfers: InterProjectTransferRecord[];
  addInterProjectTransfer: (record: Omit<InterProjectTransferRecord, 'id' | 'createdAt'>) => void;
  getProjectBudgets: (projectId: string) => ProjectBudget[];
  getBudgetReport: (projectId: string) => BudgetLineReport[];
  addProjectBudget: (budget: Omit<ProjectBudget, 'id' | 'createdAt' | 'createdBy'>) => void;
  updateProjectBudget: (id: string, updates: Partial<ProjectBudget>) => void;
  deleteProjectBudget: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: {
    projects: Project[];
    contractors: Contractor[];
    suppliers: Supplier[];
    apartments: ApartmentUnit[];
    expenses: Expense[];
    steel: SteelRecord[];
    concrete: ConcreteRecord[];
    payments: Payment[];
  };
  cameraModalOpen: boolean;
  setCameraModalOpen: (open: boolean) => void;
  cameraTargetData: { title?: string; relatedType?: string; relatedId?: string; amount?: number } | null;
  openCameraForCapture: (target?: { title?: string; relatedType?: string; relatedId?: string; amount?: number }) => void;
  saveCameraPhotoAsDocument: (photoDataUrl: string, title: string, amount?: number) => void;
  isApartmentsUnlocked: boolean;
  unlockApartments: (password: string) => boolean;
  lockApartments: () => void;
  isSectionProtected: (sectionId: string) => boolean;
  isSectionUnlocked: (sectionId: string) => boolean;
  unlockSection: (sectionId: string, passwordAttempt: string) => boolean;
  lockSection: (sectionId: string) => void;
  setSectionPassword: (sectionId: string, newPassword: string, isEnabled?: boolean) => void;
  clearSampleData: () => void;
  exportJsonBackup: () => void;
  restoreJsonBackup: (jsonContent: string) => { success: boolean; error?: string };
  exportBackupJSON: () => void;
  importBackupJSON: (json: any) => { success: boolean; error?: string };
  clearAuditLogs: () => void;
  formatCurrency: (amount: number | undefined, currency?: string) => string;
  formatNumber: (value: number | undefined, decimals?: number) => string;
  isDarkMode: boolean;
  // Google Drive integration
  isGoogleDriveConnected: boolean;
  googleDriveUserEmail: string | null;
  googleUser: { displayName?: string; email?: string } | null;
  connectGoogleDrive: () => Promise<any>;
  disconnectGoogleDrive: () => Promise<void>;
  backupToGoogleDrive: () => Promise<any>;
  uploadDocumentToGoogleDrive: (docId: string) => Promise<{ success: boolean; link?: string; error?: string }>;
  uploadDocumentToDrive: (doc: DocumentRecord) => Promise<any>;
  restoreFromGoogleDrive: (fileId: string) => Promise<any>;
  isAiAssistantOpen: boolean;
  setIsAiAssistantOpen: (open: boolean) => void;
  isMasterAdminOpen: boolean;
  setIsMasterAdminOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function mapBackendUser(raw: any): User {
  const master = Boolean(raw?.isMasterSuperAdmin ?? raw?.is_master);
  const rawRole = raw?.role === 'master' ? 'admin' : raw?.role;
  const role: User['role'] = rawRole === 'admin' || rawRole === 'accountant' || rawRole === 'viewer' ? rawRole : 'viewer';
  const rawExpiry = raw?.subscriptionExpiresAt ?? raw?.subscription_expires_at;
  const subscriptionExpiresAt = typeof rawExpiry === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(rawExpiry)
    ? `${rawExpiry.replace(' ', 'T')}Z`
    : (typeof rawExpiry === 'string' ? rawExpiry : undefined);
  return {
    id: String(raw?.id || ''),
    username: String(raw?.username || ''),
    email: String(raw?.email || ''),
    name: String(raw?.name || ''),
    phone: raw?.phone ? String(raw.phone) : undefined,
    companyName: String(raw?.companyName ?? raw?.company_name ?? ''),
    companyAddress: String(raw?.companyAddress ?? raw?.company_address ?? ''),
    role,
    isMasterSuperAdmin: master,
    ownerAdminId: raw?.ownerAdminId ?? raw?.owner_admin_id ?? undefined,
    active: !Boolean(raw?.is_locked),
    isLockedBySuperAdmin: Boolean(raw?.is_locked),
    verified: true,
    subscriptionPlan: raw?.subscriptionPlan ?? raw?.subscription_plan,
    subscriptionExpiresAt,
    permissions: raw?.permissions || {},
    customEnabledModules: raw?.customEnabledModules || {},
    allowedTabs: raw?.allowedTabs || [],
    createdAt: raw?.created_at || raw?.createdAt || new Date().toISOString(),
    lastLoginAt: raw?.last_login_at || raw?.lastLoginAt,
  };
}
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [workspaceSaving, setWorkspaceSaving] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [workspaceRevision, setWorkspaceRevision] = useState(0);
  const workspaceRevisionRef = useRef(0);
  const latestWorkspaceJsonRef = useRef('');
  const workspaceSaveInFlightRef = useRef(false);
  const workspaceSavePromiseRef = useRef<Promise<void> | null>(null);
  const workspaceGenerationRef = useRef(0);
  const activeWorkspaceOwnerRef = useRef<string | null>(null);
  const workspaceWriteBlockedRef = useRef(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectIdState] = useState<string>('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [steelRecords, setSteelRecords] = useState<SteelRecord[]>([]);
  const [concreteRecords, setConcreteRecords] = useState<ConcreteRecord[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [apartments, setApartments] = useState<ApartmentUnit[]>([]);
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [laborRecords, setLaborRecords] = useState<LaborRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activityEvents, setActivityEvents] = useState<UserActivityEvent[]>([]);
  const [projectPartners, setProjectPartners] = useState<ProjectPartner[]>([]);
  const [projectInvestments, setProjectInvestments] = useState<ProjectInvestment[]>([]);
  const [partnerEquityTransfers, setPartnerEquityTransfers] = useState<PartnerEquityTransfer[]>([]);
  const [projectBudgets, setProjectBudgets] = useState<ProjectBudget[]>([]);
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [materialProcurements, setMaterialProcurements] = useState<MaterialProcurementRecord[]>([]);
  const [interProjectTransfers, setInterProjectTransfers] = useState<InterProjectTransferRecord[]>([]);
  const [notifications, setNotifications] = useState<SystemReminderNotification[]>([]);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<SystemReminderNotification | null>(null);

  // Google Drive state (in-memory token cached in googleDriveAuth)
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState<boolean>(false);
  const [googleDriveUserEmail, setGoogleDriveUserEmail] = useState<string | null>(null);

  // Keep Firebase and Google Drive code in a separate async chunk instead of
  // pulling the full SDK into the main application entry bundle.
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    void import('../services/googleDriveAuth')
      .then(({ initAuth }) => {
        if (cancelled) return;
        unsubscribe = initAuth(
          (user) => {
            setIsGoogleDriveConnected(true);
            setGoogleDriveUserEmail(user.email);
          },
          () => {
            setIsGoogleDriveConnected(false);
            setGoogleDriveUserEmail(null);
          }
        );
      })
      .catch((error) => console.error('Google Drive auth initialization failed:', error));
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const connectGoogleDrive = async (): Promise<boolean> => {
    try {
      const { googleSignIn } = await import('../services/googleDriveAuth');
      const res = await googleSignIn();
      if (res) {
        setIsGoogleDriveConnected(true);
        setGoogleDriveUserEmail(res.user.email);
        logAudit('login', 'user', res.user.uid, `Connected Google Drive (${res.user.email})`, 'Google Drive OAuth Authorized');
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Google Drive connection failed:', err);
      return false;
    }
  };

  const disconnectGoogleDrive = async (): Promise<void> => {
    const { googleSignOut } = await import('../services/googleDriveAuth');
    await googleSignOut();
    setIsGoogleDriveConnected(false);
    setGoogleDriveUserEmail(null);
    logAudit('update', 'user', 'gdrive', 'Disconnected Google Drive', 'User signed out from Google Drive');
  };


  const isCurrentTimeDay = (): boolean => {
    const hour = new Date().getHours();
    return hour >= 7 && hour < 19;
  };

  const defaultAppSettings: AppSettings = {
    companyName: 'شرکت ساختمانی احمد شاه',
    companySubtitle: 'سیستم جامع مدیریت پروژه‌ها و حسابداری بلندمنزل',
    logoUrl: '/assets/logo.png',
    receiptHeader: 'شرکت ساختمانی احمد شاه - سند رسمی پرداخت و رسید',
    receiptFooter: 'این سند صرف با مهر و امضای رسمی اداره معتبر می‌باشد.',
    receiptContact: '0093783788278 / info@nik-smartcount.com',
    theme: 'glassmorphism',
    darkMode: !isCurrentTimeDay(),
    themeSchedule: 'auto',
    backgroundImageUrl: '',
    backgroundOpacity: 12,
    customCategories: [],
    aiEnabled: true,
    notificationPreferences: {
      installments: true,
      purchases: true,
      debts: true,
      documents: true,
      projects: true,
      financial: true,
    },
    googleDrive: {
      connected: false,
    },
    // Client-side section PINs are not an authorization boundary; server ACLs are used instead.
    sectionProtection: { enabled: {} },
    reportCustomization: {
      style: 'classic',
      showLogo: true,
      showSignatures: true,
      signature1Title: 'مسؤول مالی و محاسب',
      signature2Title: 'انجنیر ساحه و نظارت',
      signature3Title: 'رئیس عمومی شرکت',
      headerNote: 'گزارش رسمی مصارف و عواید ساختمانی',
      footerNote: 'تمامی ارقام و محاسبات با اسناد دست‌داشته و دفاتر رسمی مطابقت دارد.',
      watermarkText: '',
    }
  };

  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings);

  const clearTenantWorkspaceState = () => {
    setProjects([]);
    setCurrentProjectIdState('');
    setExpenses([]);
    setSteelRecords([]);
    setConcreteRecords([]);
    setContractors([]);
    setSuppliers([]);
    setApartments([]);
    setAssets([]);
    setLaborRecords([]);
    setPayments([]);
    setDocuments([]);
    setProjectPartners([]);
    setProjectInvestments([]);
    setPartnerEquityTransfers([]);
    setProjectBudgets([]);
    setIncomeRecords([]);
    setMaterialProcurements([]);
    setInterProjectTransfers([]);
    setAuditLogs([]);
    setActivityEvents([]);
    setNotifications([]);
    setIsNotificationCenterOpen(false);
    setSelectedNotification(null);
    setAppSettings(defaultAppSettings);
    setLanguageState('en');
  };

  const activateServerUser = async (rawUser: any): Promise<{ success: boolean; error?: string }> => {
    const user = mapBackendUser(rawUser);
    const previousOwnerId = activeWorkspaceOwnerRef.current;
    if ((currentUser && currentUser.id !== user.id) || (previousOwnerId && previousOwnerId !== user.id)) {
      clearTenantWorkspaceState();
      workspaceRevisionRef.current = 0;
      setWorkspaceRevision(0);
    }
    setWorkspaceReady(false);
    setWorkspaceError(null);
    workspaceGenerationRef.current += 1;
    activeWorkspaceOwnerRef.current = null;
    latestWorkspaceJsonRef.current = '';
    workspaceWriteBlockedRef.current = false;

    if (user.isMasterSuperAdmin) {
      const tenantsResult = await backendApi.getOffice7Tenants();
      if (tenantsResult.success && tenantsResult.data?.users) {
        setUsers(tenantsResult.data.users.map(mapBackendUser));
      } else {
        setUsers([user]);
      }
      setCurrentUser(user);
      setWorkspaceRevision(0);
      workspaceRevisionRef.current = 0;
      setWorkspaceReady(true);
      setAuthLoading(false);
      return { success: true };
    }

    // Fail closed in the UI until employee session activation and grant management
    // have been exercised end-to-end against the deployed PHP/MySQL runtime.
    if (user.role !== 'admin' || user.ownerAdminId) {
      await backendApi.logout().catch(() => undefined);
      activeWorkspaceOwnerRef.current = null;
      workspaceGenerationRef.current += 1;
      setCurrentUser(null);
      setUsers([]);
      setWorkspaceError('Employee access is not enabled in this application build. Server-side project/module/action checks still require PHP/MySQL integration testing and a security review.');
      setWorkspaceReady(false);
      setAuthLoading(false);
      return { success: false, error: 'Employee sign-in remains disabled until server permissions pass end-to-end PHP/MySQL verification.' };
    }

    const result = await backendApi.getWorkspace();
    if (!result.success || !result.data) {
      await backendApi.logout().catch(() => undefined);
      activeWorkspaceOwnerRef.current = null;
      workspaceGenerationRef.current += 1;
      setCurrentUser(null);
      setUsers([]);
      setWorkspaceReady(false);
      setWorkspaceError(result.error || 'Could not load the server database.');
      setAuthLoading(false);
      return { success: false, error: result.error || 'Could not load the server database.' };
    }

    const workspace = result.data.workspace || {};
    const storedProjects = Array.isArray(workspace.projects) ? workspace.projects as Project[] : [];
    setProjects(storedProjects);
    setCurrentProjectIdState(
      typeof workspace.currentProjectId === 'string' && storedProjects.some(p => p.id === workspace.currentProjectId)
        ? workspace.currentProjectId
        : storedProjects[0]?.id || ''
    );
    setExpenses(Array.isArray(workspace.expenses) ? workspace.expenses as Expense[] : []);
    setSteelRecords(Array.isArray(workspace.steelRecords) ? workspace.steelRecords as SteelRecord[] : []);
    setConcreteRecords(Array.isArray(workspace.concreteRecords) ? workspace.concreteRecords as ConcreteRecord[] : []);
    setContractors(Array.isArray(workspace.contractors) ? workspace.contractors as Contractor[] : []);
    setSuppliers(Array.isArray(workspace.suppliers) ? workspace.suppliers as Supplier[] : []);
    setApartments(Array.isArray(workspace.apartments) ? workspace.apartments as ApartmentUnit[] : []);
    setPayments(Array.isArray(workspace.payments) ? workspace.payments as Payment[] : []);
    setDocuments(Array.isArray(workspace.documents) ? workspace.documents as DocumentRecord[] : []);
    setLaborRecords(Array.isArray(workspace.laborRecords) ? workspace.laborRecords as LaborRecord[] : []);
    setAssets(Array.isArray(workspace.assets) ? workspace.assets as FixedAsset[] : []);
    setProjectPartners(Array.isArray(workspace.projectPartners) ? workspace.projectPartners as ProjectPartner[] : []);
    setProjectInvestments(Array.isArray(workspace.projectInvestments) ? workspace.projectInvestments as ProjectInvestment[] : []);
    setPartnerEquityTransfers(Array.isArray(workspace.partnerEquityTransfers) ? workspace.partnerEquityTransfers as PartnerEquityTransfer[] : []);
    setProjectBudgets(Array.isArray(workspace.projectBudgets) ? workspace.projectBudgets as ProjectBudget[] : []);
    setIncomeRecords(Array.isArray(workspace.incomeRecords) ? workspace.incomeRecords as IncomeRecord[] : []);
    setMaterialProcurements(Array.isArray(workspace.materialProcurements) ? workspace.materialProcurements as MaterialProcurementRecord[] : []);
    setInterProjectTransfers(Array.isArray(workspace.interProjectTransfers) ? workspace.interProjectTransfers as InterProjectTransferRecord[] : []);
    setAuditLogs([]);
    setActivityEvents([]);

    const remoteSettings = workspace.appSettings && typeof workspace.appSettings === 'object'
      ? workspace.appSettings as Partial<AppSettings>
      : {};
    const safeSectionProtection = remoteSettings.sectionProtection
      ? { enabled: remoteSettings.sectionProtection.enabled || {} }
      : { enabled: {} };
    setAppSettings({
      ...defaultAppSettings,
      ...remoteSettings,
      companyName: user.companyName || remoteSettings.companyName || defaultAppSettings.companyName,
      geminiApiKey: undefined,
      sectionProtection: safeSectionProtection,
    });

    const savedLanguage = workspace.language || result.data.defaultLanguage || 'en';
    setLanguageState(savedLanguage === 'fa' || savedLanguage === 'ps' ? savedLanguage : 'en');
    setUsers([user]);
    setCurrentUser(user);
    activeWorkspaceOwnerRef.current = user.id;
    workspaceRevisionRef.current = Number(result.data.revision) || 0;
    setWorkspaceRevision(workspaceRevisionRef.current);
    setWorkspaceReady(true);
    setAuthLoading(false);
    return { success: true };
  };

  useEffect(() => {
    let active = true;
    backendApi.getCurrentUser().then(async result => {
      if (!active) return;
      if (!result.success || !result.data?.user) {
        const authError = result.error || '';
        setWorkspaceError(authError && !/authentication required|session expired/i.test(authError) ? authError : null);
        setCurrentUser(null);
        setAuthLoading(false);
        setWorkspaceReady(false);
        return;
      }
      await activateServerUser(result.data.user);
    }).catch(() => {
      if (!active) return;
      setCurrentUser(null);
      setWorkspaceError('Unable to contact the authentication server.');
      setAuthLoading(false);
      setWorkspaceReady(false);
    });
    return () => { active = false; };
    // Session is checked once at startup; subsequent login/logout is handled explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const workspaceSnapshot = useMemo(() => {
    const safeSettings: AppSettings = {
      ...appSettings,
      geminiApiKey: undefined,
      sectionProtection: appSettings.sectionProtection
        ? { enabled: appSettings.sectionProtection.enabled || {} }
        : undefined,
    };
    return {
      projects,
      currentProjectId,
      expenses,
      steelRecords,
      concreteRecords,
      contractors,
      suppliers,
      apartments,
      payments,
      documents,
      laborRecords,
      assets,
      projectPartners,
      projectInvestments,
      partnerEquityTransfers,
      projectBudgets,
      incomeRecords,
      materialProcurements,
      interProjectTransfers,
      appSettings: safeSettings,
      language,
    };
  }, [
    projects, currentProjectId, expenses, steelRecords, concreteRecords, contractors, suppliers,
    apartments, payments, documents, laborRecords, assets, projectPartners, projectInvestments,
    partnerEquityTransfers, projectBudgets, incomeRecords, materialProcurements, interProjectTransfers, appSettings, language,
  ]);

  useEffect(() => {
    if (!workspaceReady || !currentUser || currentUser.isMasterSuperAdmin || currentUser.ownerAdminId) return;
    const ownerId = currentUser.id;
    const generation = workspaceGenerationRef.current;
    const snapshotJson = JSON.stringify(workspaceSnapshot);
    latestWorkspaceJsonRef.current = snapshotJson;
    if (workspaceWriteBlockedRef.current) return;

    const timer = window.setTimeout(() => {
      if (workspaceSaveInFlightRef.current || workspaceWriteBlockedRef.current) return;
      workspaceSaveInFlightRef.current = true;
      setWorkspaceSaving(true);

      const savePromise = (async () => {
        try {
          while (!workspaceWriteBlockedRef.current
            && workspaceGenerationRef.current === generation
            && activeWorkspaceOwnerRef.current === ownerId) {
            const jsonToSave = latestWorkspaceJsonRef.current;
            const payload = JSON.parse(jsonToSave) as Record<string, unknown>;
            const result = await backendApi.saveWorkspace(payload, workspaceRevisionRef.current, ownerId);
            if (workspaceGenerationRef.current !== generation || activeWorkspaceOwnerRef.current !== ownerId) break;
            if (!result.success || !result.data) {
              workspaceWriteBlockedRef.current = true;
              setWorkspaceError(result.error || 'Database save failed. Changes are not confirmed as saved.');
              break;
            }
            workspaceRevisionRef.current = result.data.revision;
            setWorkspaceRevision(result.data.revision);
            if (latestWorkspaceJsonRef.current === jsonToSave) break;
          }
        } catch (error: any) {
          if (workspaceGenerationRef.current === generation && activeWorkspaceOwnerRef.current === ownerId) {
            workspaceWriteBlockedRef.current = true;
            setWorkspaceError(error?.message || 'Database save failed. Changes are not confirmed as saved.');
          }
        } finally {
          workspaceSaveInFlightRef.current = false;
          setWorkspaceSaving(false);
        }
      })();
      workspaceSavePromiseRef.current = savePromise;
      void savePromise.finally(() => {
        if (workspaceSavePromiseRef.current === savePromise) workspaceSavePromiseRef.current = null;
      });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [workspaceSnapshot, workspaceReady, currentUser?.id, currentUser?.isMasterSuperAdmin, currentUser?.ownerAdminId]);

  useEffect(() => {
    if (appSettings.themeSchedule === 'auto') {
      const isNight = !isCurrentTimeDay();
      if (appSettings.darkMode !== isNight) {
        setAppSettings(prev => ({ ...prev, darkMode: isNight }));
      }
      const interval = setInterval(() => {
        const night = !isCurrentTimeDay();
        setAppSettings(prev => {
          if (prev.themeSchedule === 'auto' && prev.darkMode !== night) {
            return { ...prev, darkMode: night };
          }
          return prev;
        });
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [appSettings.themeSchedule]);

  useEffect(() => {
    if (appSettings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [appSettings.darkMode]);

  useEffect(() => {
    const morphismClasses = [
      'theme-glassmorphism',
      'theme-neumorphism',
      'theme-skeuomorphism',
      'theme-squirclemorphism',
      'theme-metalmorphism',
      'theme-ar-morphism',
      'theme-cosmic-orange',
      'theme-blue-titanium',
      'theme-desert-titanium'
    ];
    // Stored theme values map to CSS hook classes (note: 'ar_morphism' → 'theme-ar-morphism')
    const themeClassMap: Record<string, string> = {
      glassmorphism: 'theme-glassmorphism',
      neumorphism: 'theme-neumorphism',
      skeuomorphism: 'theme-skeuomorphism',
      squirclemorphism: 'theme-squirclemorphism',
      metalmorphism: 'theme-metalmorphism',
      ar_morphism: 'theme-ar-morphism',
      'ar-morphism': 'theme-ar-morphism',
      cosmic_orange: 'theme-cosmic-orange',
      blue_titanium: 'theme-blue-titanium',
      desert_titanium: 'theme-desert-titanium',
    };
    document.documentElement.classList.remove(...morphismClasses);
    const activeClass = themeClassMap[appSettings.theme || 'glassmorphism'] || 'theme-glassmorphism';
    document.documentElement.classList.add(activeClass);
  }, [appSettings.theme]);

  // Section protection
  const [unlockedSections, setUnlockedSections] = useState<Record<string, boolean>>({
    apartments: false,
  });

  // Section-level client PINs are not an authorization control. Server permissions are authoritative.
  const isSectionProtected = (_sectionId: string): boolean => false;
  const isSectionUnlocked = (_sectionId: string): boolean => true;
  const unlockSection = (_sectionId: string, _passwordAttempt: string): boolean => false;
  const lockSection = (_sectionId: string) => undefined;
  const setSectionPassword = (_sectionId: string, _newPassword: string, _isEnabled?: boolean) => {
    console.warn('Client-side section passwords are disabled; configure server-side permissions instead.');
  };

  const isApartmentsUnlocked = isSectionUnlocked('apartments');
  const unlockApartments = (pwd: string) => unlockSection('apartments', pwd);
  const lockApartments = () => lockSection('apartments');

  const [searchQuery, setSearchQuery] = useState('');
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraTargetData, setCameraTargetData] = useState<{ title?: string; relatedType?: string; relatedId?: string; amount?: number } | null>(null);

  const updateAppSettings = (updates: Partial<AppSettings>) => {
    setAppSettings(prev => ({ ...prev, ...updates }));
    logAudit('update', 'user', 'settings', 'App Settings & Branding', 'Updated system branding, theme or wallpaper');
  };

  const isTabAllowed = (tabId: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.isMasterSuperAdmin) {
      return true;
    }
    // بررسی وضعیت ماژول غیرفعال‌شده توسط دفتر هفت
    const modules = currentUser.customEnabledModules;
    if (modules && (modules as any)[tabId] === false) {
      return false;
    }
    if (currentUser.role === 'admin') {
      return true;
    }
    if (tabId === 'settings' || tabId === 'users' || tabId === 'admin') {
      return false;
    }
    const allowed = currentUser.permissions?.allowedTabs;
    if (Array.isArray(allowed) && allowed.length > 0) {
      return allowed.includes(tabId);
    }
    if (currentUser.role === 'accountant') {
      return ['dashboard', 'projects', 'steel', 'concrete', 'expenses', 'contractors', 'suppliers', 'payments', 'budget', 'accounting', 'documents', 'reports'].includes(tabId);
    }
    if (currentUser.role === 'viewer') {
      return ['dashboard', 'projects', 'apartments', 'budget', 'accounting', 'documents', 'reports'].includes(tabId);
    }
    return true;
  };

  const cycleThemeSchedule = () => {
    setAppSettings(prev => {
      const current = prev.themeSchedule || 'auto';
      let nextMode: 'auto' | 'light' | 'dark' = 'light';
      let nextDark = false;
      if (current === 'auto') {
        nextMode = 'light';
        nextDark = false;
      } else if (current === 'light') {
        nextMode = 'dark';
        nextDark = true;
      } else {
        nextMode = 'auto';
        nextDark = !isCurrentTimeDay();
      }
      return {
        ...prev,
        themeSchedule: nextMode,
        darkMode: nextDark,
      };
    });
  };

  const setThemeSchedule = (mode: 'auto' | 'light' | 'dark') => {
    setAppSettings(prev => ({
      ...prev,
      themeSchedule: mode,
      darkMode: mode === 'auto' ? !isCurrentTimeDay() : (mode === 'dark'),
    }));
  };

  const updateReportCustomization = (updates: Partial<import('../types').ReportCustomization>) => {
    setAppSettings(prev => ({
      ...prev,
      reportCustomization: {
        ...(prev.reportCustomization || defaultAppSettings.reportCustomization!),
        ...updates,
      }
    }));
  };

  const uploadCustomReportTemplate = (fileName: string, fileContent: string) => {
    setAppSettings(prev => ({
      ...prev,
      reportCustomization: {
        ...(prev.reportCustomization || defaultAppSettings.reportCustomization!),
        uploadedWordTemplateName: fileName,
        uploadedTemplateContent: fileContent,
      }
    }));
    logAudit('update', 'user', currentUser?.id || 'admin', `Uploaded custom report template: ${fileName}`, 'Report template updated');
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRtlLanguage(language) ? 'rtl' : 'ltr';
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = useMemo(() => {
    const raw = translations[language] || translations['en'];
    const fn = ((key: string) => (raw as any)[key] ?? key) as any;
    return Object.assign(fn, raw);
  }, [language]);

  const currentProject = useMemo(() => {
    return projects.find(p => p.id === currentProjectId) || projects[0] || null;
  }, [projects, currentProjectId]);

  const setCurrentProjectId = (id: string) => {
    setCurrentProjectIdState(id);
  };

  const logAudit = (
    action: 'create' | 'update' | 'delete' | 'login' | string,
    entityType: AuditLog['entityType'],
    entityId: string,
    recordTitle: string,
    details: string,
    previousValue?: string,
    newValue?: string,
    projId?: string
  ) => {
    const now = new Date();
    const targetProj = projects.find(p => p.id === (projId || currentProjectId));
    const newLog: AuditLog = {
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      projectId: projId || currentProjectId,
      projectName: targetProj?.name || 'Project',
      userId: currentUser?.id || 'unknown',
      userName: currentUser?.name || 'System User',
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      action,
      entityType,
      entityId,
      recordTitle,
      previousValue,
      newValue,
      details,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const recordActivity = (user: User, kind: UserActivityEvent['kind'], feature?: string, label?: string) => {
    const ev: UserActivityEvent = {
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      userId: user.id,
      userName: user.name,
      role: user.role,
      kind,
      feature,
      label,
      timestamp: new Date().toISOString(),
    };
    setActivityEvents(prev => [...prev.slice(-599), ev]);
  };

  const trackFeature = (feature: string, label?: string) => {
    if (!currentUser) return;
    recordActivity(currentUser, 'feature', feature, label);
  };

  const login = async (
    usernameOrEmail: string,
    password?: string,
    _loginType?: 'admin' | 'employee'
  ): Promise<{ success: boolean; error?: string }> => {
    const identifier = usernameOrEmail.trim();
    if (!identifier || !password) {
      return { success: false, error: 'Enter your username and password.' };
    }
    setAuthLoading(true);
    setWorkspaceReady(false);
    setWorkspaceError(null);
    workspaceWriteBlockedRef.current = false;
    try {
      const result = await backendApi.login(identifier, password);
      if (!result.success || !result.data?.user) {
        setAuthLoading(false);
        return { success: false, error: result.error || 'Sign-in failed.' };
      }
      return await activateServerUser(result.data.user);
    } catch (error: any) {
      setAuthLoading(false);
      return { success: false, error: error?.message || 'Unable to contact the authentication server.' };
    }
  };

  const createTenantCompanyOwnerBySuperAdmin = (_data: {
    name: string;
    username: string;
    email: string;
    password: string;
    phone: string;
    companyName: string;
    companyAddress?: string;
    subscriptionMonths?: number;
    initialProjectName?: string;
  }): { success: boolean; user?: User; error?: string } => ({
    success: false,
    error: 'Server-side tenant provisioning is not yet configured. No account was created.',
  });

  const registerCompanyOwner = (_data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    companyName: string;
    companyAddress: string;
  }): { success: boolean; otpCode: string; error?: string } => ({
    success: false,
    otpCode: '',
    error: 'Self-registration is disabled until verified server-side account provisioning is available.',
  });

  const verifyOtpAndActivate = (_email: string, _otpCode: string): { success: boolean; error?: string } => ({
    success: false,
    error: 'Verification codes must be validated by the authentication server.',
  });

  const requestPasswordReset = (_email: string): { success: boolean; otpCode?: string; error?: string } => ({
    success: false,
    error: 'Password reset is not configured. Contact the system administrator.',
  });

  const completePasswordReset = (_email: string, _otpCode: string, _newPassword: string): { success: boolean; error?: string } => ({
    success: false,
    error: 'Password reset is not configured. Contact the system administrator.',
  });

  const chargeUserSubscription = async (userId: string, durationMonths: number): Promise<{ success: boolean; error?: string; subscriptionExpiresAt?: string }> => {
    if (!currentUser?.isMasterSuperAdmin) return { success: false, error: 'Master session required.' };
    const target = users.find(u => u.id === userId);
    if (!target || target.isMasterSuperAdmin || !Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 60) {
      return { success: false, error: 'Invalid account or subscription duration.' };
    }
    const result = await backendApi.extendTenantSubscriptionByOffice7(userId, durationMonths);
    const subscriptionExpiresAt = result.data?.subscriptionExpiresAt;
    if (!result.success || !subscriptionExpiresAt) {
      return { success: false, error: result.error || 'Subscription could not be updated on the server.' };
    }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscriptionExpiresAt } : u));
    logAudit('update', 'user', userId, `Subscription extended for ${target.name}`, `Added ${durationMonths} calendar months through server action.`);
    return { success: true, subscriptionExpiresAt };
  };

  const toggleLockUserBySuperAdmin = async (userId: string): Promise<{ success: boolean; error?: string; isLocked?: boolean }> => {
    if (!currentUser?.isMasterSuperAdmin) return { success: false, error: 'Master session required.' };
    const target = users.find(u => u.id === userId);
    if (!target || target.isMasterSuperAdmin) return { success: false, error: 'Tenant account not found.' };
    const nextLocked = !target.isLockedBySuperAdmin;
    const result = await backendApi.toggleUserLock(userId, nextLocked);
    if (!result.success) return { success: false, error: result.error || 'Account status could not be updated on the server.' };
    const isLocked = typeof result.data?.isLocked === 'boolean' ? result.data.isLocked : nextLocked;
    setUsers(prev => prev.map(u => u.id === userId
      ? { ...u, isLockedBySuperAdmin: isLocked, active: !isLocked }
      : u));
    logAudit('update', 'user', userId, `Master account status changed for ${target.name}`, `Locked: ${isLocked}`);
    return { success: true, isLocked };
  };

  const createEmployeeAccount = (_employee: {
    name: string;
    username: string;
    email: string;
    password: string;
    phone?: string;
    role: 'accountant' | 'viewer';
    permissions: User['permissions'];
  }): { success: boolean; error?: string } => ({
    success: false,
    error: 'Employee account provisioning remains disabled; the server-side account lifecycle API and PHP/MySQL verification are not implemented yet.',
  });

  const updateEmployeeAccount = (_employeeId: string, _updates: {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    permissions?: User['permissions'];
    active?: boolean;
  }): { success: boolean; error?: string } => ({
    success: false,
    error: 'Employee account changes remain disabled until a server-side account lifecycle API is implemented and verified.',
  });

  const deleteEmployeeAccount = (_employeeId: string) => {
    console.warn('Employee removal remains disabled until server-side employee management is integrated and tested.');
  };

  const toggleAiForUser = (_userId: string, _enabled: boolean) => {
    console.warn('AI access changes are disabled until they can be saved and enforced by the server.');
  };

  const updateTenantByMasterAdmin = async (userId: string, updates: {
    name?: string;
    email?: string;
    phone?: string;
    companyName?: string;
    companyAddress?: string;
    password?: string;
    customLogoUrl?: string;
    customBillDesign?: CustomBillDesign;
    customButtonConfig?: CustomActionButton[];
    customEnabledModules?: User['customEnabledModules'];
    aiEnabled?: boolean;
    subscriptionExpiresAt?: string;
    isLockedBySuperAdmin?: boolean;
    active?: boolean;
    permissions?: Partial<UserPermissions>;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser?.isMasterSuperAdmin) return { success: false, error: 'Master session required.' };
    const target = users.find(u => u.id === userId);
    if (!target || target.isMasterSuperAdmin) return { success: false, error: 'Tenant account not found.' };

    const permissions = {
      ...(target.permissions || {}),
      ...(updates.permissions || {}),
      ...(updates.aiEnabled !== undefined ? { aiEnabled: updates.aiEnabled } : {}),
    };
    const payload: Record<string, unknown> = { id: userId, permissions };
    for (const key of ['name', 'email', 'phone', 'companyName', 'companyAddress', 'subscriptionExpiresAt'] as const) {
      if (updates[key] !== undefined) payload[key] = updates[key];
    }
    if (updates.password?.trim()) payload.password = updates.password.trim();
    if (updates.customEnabledModules !== undefined) payload.customEnabledModules = updates.customEnabledModules;
    if (Array.isArray(permissions.allowedTabs)) payload.allowedTabs = permissions.allowedTabs;

    const result = await backendApi.updateTenantByOffice7(payload);
    if (!result.success) return { success: false, error: result.error || 'Tenant settings were not saved.' };

    setUsers(prev => prev.map(u => u.id === userId ? {
      ...u,
      name: updates.name ?? u.name,
      email: updates.email ?? u.email,
      phone: updates.phone ?? u.phone,
      companyName: updates.companyName ?? u.companyName,
      companyAddress: updates.companyAddress ?? u.companyAddress,
      subscriptionExpiresAt: updates.subscriptionExpiresAt ?? u.subscriptionExpiresAt,
      customEnabledModules: updates.customEnabledModules ?? u.customEnabledModules,
      permissions,
      allowedTabs: Array.isArray(permissions.allowedTabs) ? permissions.allowedTabs : u.allowedTabs,
    } : u));
    logAudit('update', 'user', userId, `Master Admin updated ${target.companyName || target.name}`, 'Supported account profile, subscription, module, and tab fields saved by server.');
    return { success: true };
  };

  const impersonateTenant = (_user: User) => {
    console.warn('Tenant impersonation is disabled until a separately authorized server-side inspection flow is available.');
  };

  const toggleDarkMode = () => {
    setAppSettings(prev => ({
      ...prev,
      darkMode: !prev.darkMode,
    }));
  };

  const setTheme = (newTheme: AppTheme) => {
    setAppSettings(prev => ({
      ...prev,
      theme: newTheme,
    }));
  };

  const logout = async () => {
    setAuthLoading(true);
    setWorkspaceReady(false);
    workspaceGenerationRef.current += 1;
    activeWorkspaceOwnerRef.current = null;
    latestWorkspaceJsonRef.current = '';
    workspaceWriteBlockedRef.current = true;
    const pendingSave = workspaceSavePromiseRef.current;
    setWorkspaceError(null);
    setCurrentUser(null);
    setUsers([]);
    setProjects([]);
    setCurrentProjectIdState('');
    setExpenses([]);
    setSteelRecords([]);
    setConcreteRecords([]);
    setContractors([]);
    setSuppliers([]);
    setApartments([]);
    setAssets([]);
    setLaborRecords([]);
    setPayments([]);
    setDocuments([]);
    setProjectPartners([]);
    setProjectInvestments([]);
    setPartnerEquityTransfers([]);
    setProjectBudgets([]);
    setIncomeRecords([]);
    setMaterialProcurements([]);
    setInterProjectTransfers([]);
    setNotifications([]);
    setIsNotificationCenterOpen(false);
    setSelectedNotification(null);
    setAuditLogs([]);
    setActivityEvents([]);
    setLanguageState('en');
    setAppSettings(defaultAppSettings);
    try {
      await pendingSave;
    } catch {
      // The save task already surfaced its own error; continue revoking the session.
    }
    try {
      await backendApi.logout();
    } catch {
      // Client state is cleared even if the server cannot be reached; server expiry still applies.
    } finally {
      workspaceRevisionRef.current = 0;
      setWorkspaceRevision(0);
      setAuthLoading(false);
    }
  };

  const switchUserRole = (_role: 'admin' | 'accountant' | 'viewer') => {
    console.warn('Client-side role switching is disabled. Sign in with a server-authorized account.');
  };

  const addUser = (_userData: Omit<User, 'id' | 'createdAt'>) => {
    console.warn('Client-side account creation is disabled. Use a server-side provisioning flow.');
  };

  const updateUser = (_id: string, _updates: Partial<User>) => {
    console.warn('Client-side account updates are disabled.');
  };

  const toggleUserActive = (_id: string) => {
    console.warn('Account status changes must be applied by the server.');
  };

  const deleteUser = (_id: string) => {
    console.warn('Client-side account deletion is disabled.');
  };

  // Projects CRUD
  const addProject = (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...projectData,
      id: 'proj-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setProjects(prev => [...prev, newProject]);
    setCurrentProjectIdState(newProject.id);

    if (newProject.initialGeneralExpenses && newProject.initialGeneralExpenses.length > 0) {
      const createdExpenses: Expense[] = newProject.initialGeneralExpenses
        .filter(item => item.amount > 0)
        .map((item, idx) => {
          const exchangeRate = newProject.defaultExchangeRate || 70;
          const amountUSD = item.currency === 'USD' 
            ? item.amount 
            : (exchangeRate > 0 ? parseFloat((item.amount / exchangeRate).toFixed(2)) : item.amount);
          const amountAFN = item.currency === 'AFN'
            ? item.amount
            : Math.round(item.amount * exchangeRate);
          return {
            id: `exp-init-${Date.now()}-${idx}`,
            projectId: newProject.id,
            category: item.title,
            description: item.notes || `مصرف عمومی اولیه: ${item.title}`,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            amount: amountUSD,
            currency: item.currency,
            exchangeRate,
            amountInUSD: amountUSD,
            amountInAFN: amountAFN,
            paymentStatus: 'paid',
            paidAmount: amountUSD,
            remainingAmount: 0,
            paymentMethod: 'Cash',
            createdAt: new Date().toISOString(),
          };
        });
      if (createdExpenses.length > 0) {
        setExpenses(prev => [...prev, ...createdExpenses]);
      }
    }

    if (newProject.partners && newProject.partners.length > 0) {
      newProject.partners.forEach((part, pIdx) => {
        const pId = 'part-' + Date.now() + '-' + pIdx;
        const newPart: ProjectPartner = {
          ...part,
          id: pId,
          projectId: newProject.id,
          currency: part.currency || newProject.currency || 'AFN',
          createdAt: new Date().toISOString(),
        };
        setProjectPartners(prev => [...prev, newPart]);
        if (newPart.initialInvestment && newPart.initialInvestment > 0) {
          const newInv: ProjectInvestment = {
            id: 'inv-' + Date.now() + '-' + pIdx,
            projectId: newProject.id,
            partnerId: pId,
            partnerName: newPart.name || 'شریک',
            amount: newPart.initialInvestment,
            currency: newPart.currency,
            exchangeRate: newProject.defaultExchangeRate || 70,
            date: newPart.investmentDate || new Date().toISOString().split('T')[0],
            type: 'initial',
            paymentMethod: 'نقد',
            notes: newPart.notes || 'سرمایه‌گذاری اولیه ثبت پروژه',
            createdAt: new Date().toISOString(),
          };
          setProjectInvestments(prev => [newInv, ...prev]);
        }
      });
    }
    logAudit('create', 'project', newProject.id, newProject.name, `New building project created: ${newProject.floors} floors, ${newProject.units} units`, undefined, undefined, newProject.id);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    const oldProj = projects.find(p => p.id === id);
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    logAudit('update', 'project', id, updates.name || oldProj?.name || 'Project', `Project details updated`, JSON.stringify(oldProj), JSON.stringify(updates), id);
  };

  const deleteProject = (id: string) => {
    const oldProj = projects.find(p => p.id === id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (currentProjectId === id) {
      const remaining = projects.filter(p => p.id !== id);
      if (remaining.length > 0) {
        setCurrentProjectIdState(remaining[0].id);
      }
    }
    setProjectPartners(prev => prev.filter(p => p.projectId !== id));
    setProjectInvestments(prev => prev.filter(i => i.projectId !== id));
    logAudit('delete', 'project', id, oldProj?.name || 'Project', 'Project removed from system');
  };

  const transferProject = (transferData: Omit<ProjectTransferEvent, 'id' | 'createdAt'>): ProjectTransferEvent => {
    const newEvent: ProjectTransferEvent = {
      ...transferData,
      id: 'trans-' + Date.now(),
      createdAt: new Date().toISOString(),
    };

    setProjects(prev => prev.map(proj => {
      if (proj.id === transferData.projectId) {
        const initialOwner = proj.initialOwner || proj.clientOwner || transferData.previousOwner || 'مالک اولیه';
        const updatedHistory = [...(proj.transferHistory || []), newEvent];
        return {
          ...proj,
          initialOwner,
          currentOwner: transferData.newOwner,
          clientOwner: transferData.newOwner,
          transferHistory: updatedHistory,
        };
      }
      return proj;
    }));

    if (transferData.contractDocumentUrl) {
      const docRecord: DocumentRecord = {
        id: 'doc-trans-' + Date.now(),
        projectId: transferData.projectId,
        title: transferData.contractDocumentName || `سند انتقال پروژه به ${transferData.newOwner}`,
        category: 'contracts',
        fileUrl: transferData.contractDocumentUrl,
        notes: `سند توافق‌نامه و واگذاری به ${transferData.newOwner} در تاریخ ${transferData.transferDate}. ارزش انتقال: ${transferData.transferValue} ${transferData.currency}`,
        date: transferData.transferDate,
        createdAt: new Date().toISOString(),
      };
      setDocuments(prev => [docRecord, ...prev]);
    }

    logAudit(
      'transfer', 
      'project', 
      transferData.projectId, 
      `انتقال پروژه به ${transferData.newOwner}`, 
      `از: ${transferData.previousOwner} ➔ به: ${transferData.newOwner} • ارزش: ${transferData.transferValue} ${transferData.currency} • پرداخت‌شده: ${transferData.amountPaid} • باقی‌داری: ${transferData.remainingAmount} • مرحله: ${transferData.projectStage}`,
      transferData.previousOwner,
      transferData.newOwner,
      transferData.projectId
    );

    return newEvent;
  };

  // Partners & Investments Management
  const addProjectPartner = (partnerData: Omit<ProjectPartner, 'id' | 'createdAt'>): ProjectPartner => {
    const newPartner: ProjectPartner = {
      ...partnerData,
      id: 'part-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
    };
    setProjectPartners(prev => [...prev, newPartner]);

    if (newPartner.initialInvestment && newPartner.initialInvestment > 0) {
      const proj = projects.find(p => p.id === newPartner.projectId);
      const exRate = proj?.defaultExchangeRate || 70;
      const initialInv: ProjectInvestment = {
        id: 'inv-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        projectId: newPartner.projectId,
        partnerId: newPartner.id,
        partnerName: newPartner.name || 'شریک',
        amount: newPartner.initialInvestment,
        currency: newPartner.currency || 'AFN',
        exchangeRate: exRate,
        date: newPartner.investmentDate || new Date().toISOString().split('T')[0],
        type: 'initial',
        paymentMethod: 'نقد',
        notes: newPartner.notes || 'سرمایه‌گذاری اولیه ثبت شریک',
        createdAt: new Date().toISOString(),
      };
      setProjectInvestments(prev => [initialInv, ...prev]);
    }
    logAudit('create', 'project', newPartner.projectId, `Partner: ${newPartner.name}`, `Added partner with share: ${newPartner.sharePercentage || 0}%`, undefined, undefined, newPartner.projectId);
    return newPartner;
  };

  const updateProjectPartner = (id: string, updates: Partial<ProjectPartner>) => {
    const old = projectPartners.find(p => p.id === id);
    setProjectPartners(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    if (updates.name && old && updates.name !== old.name) {
      setProjectInvestments(prev => prev.map(inv => inv.partnerId === id ? { ...inv, partnerName: updates.name! } : inv));
    }
    logAudit('update', 'project', id, `Partner: ${updates.name || old?.name || id}`, 'Updated partner information', undefined, undefined, old?.projectId);
  };

  const deleteProjectPartner = (id: string) => {
    const old = projectPartners.find(p => p.id === id);
    setProjectPartners(prev => prev.filter(p => p.id !== id));
    setProjectInvestments(prev => prev.filter(inv => inv.partnerId !== id));
    logAudit('delete', 'project', id, `Partner: ${old?.name || id}`, 'Deleted partner and associated records', undefined, undefined, old?.projectId);
  };

  const addProjectInvestment = (invData: Omit<ProjectInvestment, 'id' | 'createdAt'>): ProjectInvestment => {
    const proj = projects.find(p => p.id === invData.projectId);
    const newInv: ProjectInvestment = {
      ...invData,
      exchangeRate: invData.exchangeRate || proj?.defaultExchangeRate || 70,
      id: 'inv-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
    };
    setProjectInvestments(prev => [newInv, ...prev]);
    logAudit('create', 'project', newInv.id, `Investment: ${newInv.partnerName}`, `Added ${newInv.type === 'initial' ? 'initial' : 'additional'} investment of ${newInv.amount.toLocaleString()} ${newInv.currency}`, undefined, undefined, newInv.projectId);
    return newInv;
  };

  const updateProjectInvestment = (id: string, updates: Partial<ProjectInvestment>) => {
    const old = projectInvestments.find(inv => inv.id === id);
    setProjectInvestments(prev => prev.map(inv => (inv.id === id ? { ...inv, ...updates } : inv)));
    logAudit('update', 'project', id, `Investment: ${old?.partnerName || id}`, `Updated investment transaction`, undefined, undefined, old?.projectId);
  };

  const deleteProjectInvestment = (id: string) => {
    const old = projectInvestments.find(inv => inv.id === id);
    setProjectInvestments(prev => prev.filter(inv => inv.id !== id));
    logAudit('delete', 'project', id, `Investment: ${old?.partnerName || id}`, `Deleted investment record of ${old?.amount} ${old?.currency}`, undefined, undefined, old?.projectId);
  };

  const transferPartnerEquity = (data: Omit<PartnerEquityTransfer, 'id' | 'createdAt'>): PartnerEquityTransfer => {
    const id = 'eq-tr-' + Date.now();
    const newTransfer: PartnerEquityTransfer = {
      ...data,
      id,
      createdAt: new Date().toISOString()
    };
    setPartnerEquityTransfers(prev => [newTransfer, ...prev]);

    // Update seller partner
    setProjectPartners(prev => prev.map(p => {
      if (p.id === data.fromPartnerId) {
        const remainingShare = Math.max(0, (p.sharePercentage || 0) - data.transferredPercentage);
        return {
          ...p,
          sharePercentage: remainingShare,
          status: remainingShare === 0 ? 'exited' : p.status,
          exitDate: remainingShare === 0 ? data.transferDate : p.exitDate,
          exitReason: remainingShare === 0 ? `واگذاری کامل سهم به ${data.toPartnerName}` : p.exitReason,
          transferredToPartnerId: data.toPartnerId,
          transferredToPartnerName: data.toPartnerName,
          transferPrice: data.transferPrice,
          transferCurrency: data.currency,
        };
      }
      // If buyer is an existing partner, increase their share
      if (data.toPartnerId && p.id === data.toPartnerId) {
        return {
          ...p,
          sharePercentage: (p.sharePercentage || 0) + data.transferredPercentage,
        };
      }
      return p;
    }));

    // If buyer is a new partner (no toPartnerId or transferType === 'new_partner'), create new partner
    if (!data.toPartnerId && data.transferType === 'new_partner') {
      const newPartnerId = 'pp-' + Date.now();
      const createdBuyer: ProjectPartner = {
        id: newPartnerId,
        projectId: data.projectId,
        name: data.toPartnerName,
        sharePercentage: data.transferredPercentage,
        initialInvestment: data.transferPrice,
        currency: data.currency,
        investmentDate: data.transferDate,
        notes: `خرید سهم از ${data.fromPartnerName} (سند صلح: ${data.deedNumber || '—'})`,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      setProjectPartners(prev => [...prev, createdBuyer]);
    }

    logAudit('create', 'project', data.projectId, data.fromPartnerName, `انتقال ${data.transferredPercentage}٪ سهم‌الشرکه از ${data.fromPartnerName} به ${data.toPartnerName} به مبلغ ${data.transferPrice} ${data.currency}`, undefined, undefined, data.projectId);

    return newTransfer;
  };

  const getProjectPartners = (projectId: string): ProjectPartner[] => {
    return projectPartners.filter(p => p.projectId === projectId);
  };

  const getProjectInvestments = (projectId: string): ProjectInvestment[] => {
    return projectInvestments.filter(inv => inv.projectId === projectId);
  };

  // Expenses CRUD
  const addExpense = (expenseData: Omit<Expense, 'id' | 'createdAt' | 'createdBy'>) => {
    const time = expenseData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const amount = Number(Number(expenseData.amount || 0).toFixed(2));
    const paidAmount = expenseData.paidAmount !== undefined ? Number(Number(expenseData.paidAmount).toFixed(2)) : 0;
    const remainingAmount = Math.max(0, Number((amount - paidAmount).toFixed(2)));
    const paymentStatus: PaymentStatus = expenseData.paymentStatus || (paidAmount >= amount ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid'));
    const proj = projects.find(p => p.id === expenseData.projectId);
    const exRate = expenseData.exchangeRate || proj?.defaultExchangeRate || 70;
    const currency = expenseData.currency || 'USD';
    const amountInUSD = currency === 'USD' ? amount : (exRate > 0 ? parseFloat((amount / exRate).toFixed(2)) : amount);
    const amountInAFN = currency === 'AFN' ? amount : Math.round(amount * exRate);

    const newExpense: Expense = {
      ...expenseData,
      time,
      amount,
      paidAmount,
      remainingAmount,
      paymentStatus,
      currency,
      exchangeRate: exRate,
      amountInUSD,
      amountInAFN,
      id: 'exp-' + Date.now(),
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || 'Admin',
    };
    setExpenses(prev => [newExpense, ...prev]);

    if (paidAmount > 0) {
      const paidInUSD = currency === 'USD' ? paidAmount : (exRate > 0 ? parseFloat((paidAmount / exRate).toFixed(2)) : paidAmount);
      const paidInAFN = currency === 'AFN' ? paidAmount : Math.round(paidAmount * exRate);
      const newPay: Payment = {
        id: 'pay-exp-' + Date.now(),
        projectId: newExpense.projectId,
        date: newExpense.date,
        time: newExpense.time || time,
        receiptNumber: newExpense.billNumber || `EXP-${Date.now().toString().slice(-4)}`,
        partyName: newExpense.partyName || newExpense.category,
        amount: paidInUSD,
        currency,
        exchangeRate: exRate,
        amountInUSD: paidInUSD,
        amountInAFN: paidInAFN,
        method: (newExpense.paymentMethod as any) || 'Cash',
        description: `پرداخت نقدی برای: ${newExpense.item || newExpense.description} (${newExpense.category})`,
        relatedId: newExpense.id,
        relatedType: 'expense',
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.name || 'Admin',
      };
      setPayments(prev => [newPay, ...prev]);
    }

    if (newExpense.partyName && newExpense.partyName.trim()) {
      setSuppliers(prev => {
        const existing = prev.find(s => s.projectId === newExpense.projectId && s.name.trim().toLowerCase() === newExpense.partyName!.trim().toLowerCase());
        if (existing) {
          const purchases = (existing.totalPurchases || 0) + amountInUSD;
          const paid = (existing.totalPaid || 0) + (paidAmount > 0 ? (currency === 'USD' ? paidAmount : (exRate > 0 ? paidAmount / exRate : paidAmount)) : 0);
          return prev.map(s => s.id === existing.id ? { ...s, totalPurchases: purchases, remainingBalance: Math.max(0, purchases - paid) } : s);
        } else {
          const purchases = amountInUSD;
          const paid = paidAmount > 0 ? (currency === 'USD' ? paidAmount : (exRate > 0 ? paidAmount / exRate : paidAmount)) : 0;
          const newSupp: Supplier = {
            id: 'supp-' + Date.now(),
            projectId: newExpense.projectId,
            name: newExpense.partyName!.trim(),
            phone: '',
            materialsSupplied: newExpense.item || newExpense.category,
            totalPurchases: purchases,
            totalPaid: paid,
            remainingBalance: Math.max(0, purchases - paid),
            createdAt: new Date().toISOString(),
          };
          return [...prev, newSupp];
        }
      });
    }
    logAudit('create', 'expense', newExpense.id, `${newExpense.category}: ${newExpense.description}`, `Amount: $${newExpense.amount.toLocaleString()} - Status: ${newExpense.paymentStatus}`, undefined, `$${newExpense.amount}`, newExpense.projectId);
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    const old = expenses.find(e => e.id === id);
    if (!old) return;
    const amount = updates.amount !== undefined ? Number(Number(updates.amount).toFixed(2)) : old.amount;
    const paidAmount = updates.paidAmount !== undefined ? Number(Number(updates.paidAmount).toFixed(2)) : (old.paidAmount ?? amount);
    const remainingAmount = Math.max(0, Number((amount - paidAmount).toFixed(2)));
    const paymentStatus: PaymentStatus = updates.paymentStatus || (paidAmount >= amount ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid'));
    setExpenses(prev => prev.map(e => (e.id === id ? { 
      ...e, 
      ...updates,
      amount,
      paidAmount,
      remainingAmount,
      paymentStatus
    } : e)));

    if (updates.paidAmount !== undefined || updates.description !== undefined) {
      setPayments(prev => prev.map(p => {
        if (p.relatedType === 'expense' && p.relatedId === id) {
          const proj = projects.find(pr => pr.id === (updates.projectId || old.projectId));
          const exRate = p.exchangeRate || proj?.defaultExchangeRate || 70;
          const newAmt = updates.paidAmount !== undefined ? updates.paidAmount : p.amount;
          return {
            ...p,
            amount: newAmt,
            amountInUSD: p.currency === 'USD' ? newAmt : (exRate > 0 ? parseFloat((newAmt / exRate).toFixed(2)) : newAmt),
            amountInAFN: p.currency === 'AFN' ? newAmt : Math.round(newAmt * exRate),
            description: updates.description ? `پرداخت برای: ${updates.description}` : p.description,
          };
        }
        return p;
      }));
    }
    logAudit('update', 'expense', id, updates.description || old.description || 'Expense', `Updated expense record`, `$${old.amount}`, `$${amount}`, old.projectId);
  };

  const deleteExpense = (id: string) => {
    const old = expenses.find(e => e.id === id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    setPayments(prev => prev.filter(p => !(p.relatedType === 'expense' && p.relatedId === id)));
    logAudit('delete', 'expense', id, old?.description || 'Expense', `Deleted expense of $${old?.amount}`, `$${old?.amount}`, undefined, old?.projectId);
  };

  const getExpensePayments = (expenseId: string): Payment[] => {
    return payments.filter(p => p.relatedType === 'expense' && p.relatedId === expenseId);
  };

  // Steel CRUD
  const addSteelRecord = (data: Omit<SteelRecord, 'id' | 'tons' | 'totalAmount' | 'remainingBalance' | 'createdAt'>) => {
    const tons = Number((data.kg / 1000).toFixed(3));
    const totalAmount = Number((tons * data.pricePerTon).toFixed(2));
    const paidAmount = Number(Number(data.paidAmount || 0).toFixed(2));
    const remainingBalance = Math.max(0, Number((totalAmount - paidAmount).toFixed(2)));
    const time = (data as any).time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const proj = projects.find(p => p.id === data.projectId);
    const exRate = (data as any).exchangeRate || proj?.defaultExchangeRate || 70;
    const newRecord: SteelRecord = {
      currency: 'USD',
      time,
      ...data,
      id: 'stl-' + Date.now(),
      tons,
      totalAmount,
      paidAmount,
      remainingBalance,
      exchangeRate: exRate,
      amountInUSD: totalAmount,
      amountInAFN: Math.round(totalAmount * exRate),
      createdAt: new Date().toISOString(),
    };
    setSteelRecords(prev => [newRecord, ...prev]);

    if (paidAmount > 0) {
      const newPay: Payment = {
        id: 'pay-stl-' + Date.now(),
        projectId: newRecord.projectId,
        date: newRecord.date,
        time: newRecord.time || time,
        receiptNumber: newRecord.billNumber,
        partyName: newRecord.supplierName,
        amount: paidAmount,
        currency: 'USD',
        exchangeRate: exRate,
        amountInUSD: paidAmount,
        amountInAFN: Math.round(paidAmount * exRate),
        method: 'Cash',
        description: `خرید نقدی سیخ‌گول (بل #${newRecord.billNumber})`,
        relatedId: newRecord.id,
        relatedType: 'material_steel',
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.name || 'Admin',
      };
      setPayments(prev => [newPay, ...prev]);
    }

    if (newRecord.supplierName.trim()) {
      setSuppliers(prev => {
        const existing = prev.find(s => s.projectId === newRecord.projectId && s.name.trim().toLowerCase() === newRecord.supplierName.trim().toLowerCase());
        if (existing) {
          return prev;
        } else {
          const newSupp: Supplier = {
            id: 'supp-' + Date.now(),
            projectId: newRecord.projectId,
            name: newRecord.supplierName.trim(),
            phone: '',
            materialsSupplied: 'سیخ‌گول / فولاد',
            totalPurchases: totalAmount,
            totalPaid: paidAmount,
            remainingBalance,
            createdAt: new Date().toISOString(),
          };
          return [...prev, newSupp];
        }
      });
    }
    logAudit('create', 'steel', newRecord.id, `Steel Bill #${newRecord.billNumber} (${newRecord.supplierName})`, `${newRecord.kg} KG (${newRecord.tons} Tons) @ $${newRecord.pricePerTon}/Ton = $${newRecord.totalAmount.toLocaleString()}`, undefined, `$${newRecord.totalAmount}`, newRecord.projectId);
  };

  const updateSteelRecord = (id: string, updates: Partial<SteelRecord>) => {
    const old = steelRecords.find(s => s.id === id);
    if (!old) return;
    const kg = updates.kg !== undefined ? updates.kg : old.kg;
    const pricePerTon = updates.pricePerTon !== undefined ? updates.pricePerTon : old.pricePerTon;
    const paidAmount = updates.paidAmount !== undefined ? Number(Number(updates.paidAmount).toFixed(2)) : old.paidAmount;
    const tons = Number((kg / 1000).toFixed(3));
    const totalAmount = Number((tons * pricePerTon).toFixed(2));
    const remainingBalance = Math.max(0, Number((totalAmount - paidAmount).toFixed(2)));
    setSteelRecords(prev => prev.map(s => (s.id === id ? { 
      ...s, 
      ...updates, 
      kg, 
      pricePerTon, 
      tons, 
      totalAmount, 
      paidAmount, 
      remainingBalance 
    } : s)));
    logAudit('update', 'steel', id, `Steel Bill #${updates.billNumber || old.billNumber}`, `Updated steel record`, `$${old.totalAmount}`, `$${totalAmount}`, old.projectId);
  };

  const deleteSteelRecord = (id: string) => {
    const old = steelRecords.find(s => s.id === id);
    setSteelRecords(prev => prev.filter(s => s.id !== id));
    setPayments(prev => prev.filter(p => !(p.relatedType === 'material_steel' && p.relatedId === id)));
    logAudit('delete', 'steel', id, `Steel Bill #${old?.billNumber}`, `Deleted steel record of $${old?.totalAmount}`, `$${old?.totalAmount}`, undefined, old?.projectId);
  };

  // Concrete CRUD
  const addConcreteRecord = (data: Omit<ConcreteRecord, 'id' | 'totalAmount' | 'remainingBalance' | 'createdAt'>) => {
    const totalAmount = Number(((data.quantityM3 * data.pricePerM3) + (data.pumpCharge || 0)).toFixed(2));
    const paidAmount = Number(Number(data.paidAmount || 0).toFixed(2));
    const remainingBalance = Math.max(0, Number((totalAmount - paidAmount).toFixed(2)));
    const time = (data as any).time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const proj = projects.find(p => p.id === data.projectId);
    const exRate = (data as any).exchangeRate || proj?.defaultExchangeRate || 70;
    const newRecord: ConcreteRecord = {
      currency: 'USD',
      time,
      ...data,
      id: 'cnc-' + Date.now(),
      totalAmount,
      paidAmount,
      remainingBalance,
      exchangeRate: exRate,
      amountInUSD: totalAmount,
      amountInAFN: Math.round(totalAmount * exRate),
      createdAt: new Date().toISOString(),
    };
    setConcreteRecords(prev => [newRecord, ...prev]);

    if (paidAmount > 0) {
      const newPay: Payment = {
        id: 'pay-cnc-' + Date.now(),
        projectId: newRecord.projectId,
        date: newRecord.date,
        time: newRecord.time || time,
        receiptNumber: newRecord.billNumber,
        partyName: newRecord.supplierName,
        amount: paidAmount,
        currency: 'USD',
        exchangeRate: exRate,
        amountInUSD: paidAmount,
        amountInAFN: Math.round(paidAmount * exRate),
        method: 'Cash',
        description: `پرداخت نقدی کانکریت‌ریزی (تکت #${newRecord.billNumber})`,
        relatedId: newRecord.id,
        relatedType: 'material_concrete',
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.name || 'Admin',
      };
      setPayments(prev => [newPay, ...prev]);
    }

    if (newRecord.supplierName.trim()) {
      setSuppliers(prev => {
        const existing = prev.find(s => s.projectId === newRecord.projectId && s.name.trim().toLowerCase() === newRecord.supplierName.trim().toLowerCase());
        if (existing) {
          return prev;
        } else {
          const newSupp: Supplier = {
            id: 'supp-' + Date.now(),
            projectId: newRecord.projectId,
            name: newRecord.supplierName.trim(),
            phone: '',
            materialsSupplied: 'کانکریت آماده و پمپ',
            totalPurchases: totalAmount,
            totalPaid: paidAmount,
            remainingBalance,
            createdAt: new Date().toISOString(),
          };
          return [...prev, newSupp];
        }
      });
    }
    logAudit('create', 'concrete', newRecord.id, `Concrete Bill #${newRecord.billNumber} (${newRecord.supplierName})`, `${newRecord.quantityM3} m³ @ $${newRecord.pricePerM3}/m³ = $${newRecord.totalAmount.toLocaleString()}`, undefined, `$${newRecord.totalAmount}`, newRecord.projectId);
  };

  const updateConcreteRecord = (id: string, updates: Partial<ConcreteRecord>) => {
    const old = concreteRecords.find(c => c.id === id);
    if (!old) return;
    const quantityM3 = updates.quantityM3 !== undefined ? updates.quantityM3 : old.quantityM3;
    const pricePerM3 = updates.pricePerM3 !== undefined ? updates.pricePerM3 : old.pricePerM3;
    const pumpCharge = updates.pumpCharge !== undefined ? updates.pumpCharge : (old.pumpCharge || 0);
    const paidAmount = updates.paidAmount !== undefined ? Number(Number(updates.paidAmount).toFixed(2)) : old.paidAmount;
    const totalAmount = Number(((quantityM3 * pricePerM3) + pumpCharge).toFixed(2));
    const remainingBalance = Math.max(0, Number((totalAmount - paidAmount).toFixed(2)));
    setConcreteRecords(prev => prev.map(c => (c.id === id ? {
      ...c,
      ...updates,
      quantityM3,
      pricePerM3,
      pumpCharge,
      totalAmount,
      paidAmount,
      remainingBalance
    } : c)));
    logAudit('update', 'concrete', id, `Concrete Bill #${updates.billNumber || old.billNumber}`, `Updated concrete pour record`, `$${old.totalAmount}`, `$${totalAmount}`, old.projectId);
  };

  const deleteConcreteRecord = (id: string) => {
    const old = concreteRecords.find(c => c.id === id);
    setConcreteRecords(prev => prev.filter(c => c.id !== id));
    setPayments(prev => prev.filter(p => !(p.relatedType === 'material_concrete' && p.relatedId === id)));
    logAudit('delete', 'concrete', id, `Concrete Bill #${old?.billNumber}`, `Deleted concrete record of $${old?.totalAmount}`, `$${old?.totalAmount}`, undefined, old?.projectId);
  };

  // Contractors CRUD
  const addContractor = (data: Omit<Contractor, 'id' | 'createdAt'>) => {
    const newContractor: Contractor = {
      workDescription: '',
      ...data,
      id: 'cont-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setContractors(prev => [...prev, newContractor]);
    logAudit('create', 'contractor', newContractor.id, newContractor.name, `New contractor added: ${newContractor.contractType}, Contract: $${newContractor.contractAmount.toLocaleString()}`, undefined, `$${newContractor.contractAmount}`, newContractor.projectId);
  };

  const updateContractor = (id: string, updates: Partial<Contractor>) => {
    const old = contractors.find(c => c.id === id);
    setContractors(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    logAudit('update', 'contractor', id, updates.name || old?.name || 'Contractor', `Updated contractor terms`, `$${old?.contractAmount}`, `$${updates.contractAmount ?? old?.contractAmount}`, old?.projectId);
  };

  const deleteContractor = (id: string) => {
    const old = contractors.find(c => c.id === id);
    setContractors(prev => prev.filter(c => c.id !== id));
    logAudit('delete', 'contractor', id, old?.name || 'Contractor', `Deleted contractor`, `$${old?.contractAmount}`, undefined, old?.projectId);
  };

  // Suppliers CRUD
  const addSupplier = (data: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newSupplier: Supplier = {
      contact: '',
      ...data,
      id: 'supp-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setSuppliers(prev => [...prev, newSupplier]);
    logAudit('create', 'supplier', newSupplier.id, newSupplier.name, `Registered supplier: ${newSupplier.materialsSupplied}`, undefined, undefined, newSupplier.projectId);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    const old = suppliers.find(s => s.id === id);
    setSuppliers(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    logAudit('update', 'supplier', id, updates.name || old?.name || 'Supplier', `Updated supplier information`, undefined, undefined, old?.projectId);
  };

  const deleteSupplier = (id: string) => {
    const old = suppliers.find(s => s.id === id);
    setSuppliers(prev => prev.filter(s => s.id !== id));
    logAudit('delete', 'supplier', id, old?.name || 'Supplier', `Deleted supplier`, undefined, undefined, old?.projectId);
  };

  // Labor & Payroll Records
  const addLaborRecord = (record: Omit<LaborRecord, 'id' | 'createdAt'>) => {
    const id = 'lab-' + Date.now();
    const newRecord: LaborRecord = {
      ...record,
      id,
      createdAt: new Date().toISOString()
    };
    setLaborRecords(prev => [newRecord, ...prev]);
    logAudit('create', 'expense', id, record.workerName, `ثبت معاش کارگری برای ${record.workerName}: ${record.netPayable} AFN`, undefined, undefined, record.projectId);
  };

  const deleteLaborRecord = (id: string) => {
    const old = laborRecords.find(l => l.id === id);
    setLaborRecords(prev => prev.filter(l => l.id !== id));
    logAudit('delete', 'expense', id, old?.workerName || 'Labor Record', `حذف رکورد معاش کارگری`, undefined, undefined, old?.projectId);
  };

  // Fixed Assets & Heavy Machinery CRUD
  const addAsset = (asset: Omit<FixedAsset, 'id' | 'createdAt'>) => {
    const id = 'ast-' + Date.now();
    const newAsset: FixedAsset = {
      ...asset,
      id,
      createdAt: new Date().toISOString()
    };
    setAssets(prev => [newAsset, ...prev]);
    logAudit('create', 'expense', id, asset.name, `ثبت دارایی ثابت/ماشین‌آلات: ${asset.name} (${asset.assetTag}) - قیمت: $${asset.purchaseCost}`, undefined, undefined, asset.assignedProjectId);
  };

  const updateAsset = (id: string, updates: Partial<FixedAsset>) => {
    const old = assets.find(a => a.id === id);
    setAssets(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));
    logAudit('update', 'expense', id, updates.name || old?.name || 'Asset', `ویرایش مشخصات ماشین‌آلات/دارایی`, undefined, undefined, old?.assignedProjectId);
  };

  const deleteAsset = (id: string) => {
    const old = assets.find(a => a.id === id);
    setAssets(prev => prev.filter(a => a.id !== id));
    logAudit('delete', 'expense', id, old?.name || 'Asset', `حذف دارایی ثابت/ماشین‌آلات`, undefined, undefined, old?.assignedProjectId);
  };

  // Apartments & Sales CRUD
  const addApartment = (data: Omit<ApartmentUnit, 'id' | 'salePrice' | 'remainingBalance' | 'createdAt'> & { salePrice?: number }) => {
    const pricePerM2 = data.pricePerM2 || (data.salePrice && data.areaM2 ? Math.round(data.salePrice / data.areaM2) : 0);
    const salePrice = data.salePrice || Math.round(data.areaM2 * pricePerM2);
    const amountReceived = data.amountReceived || 0;
    const remainingBalance = salePrice - amountReceived;
    const newUnit: ApartmentUnit = {
      ...data,
      id: 'unit-' + Date.now(),
      pricePerM2,
      salePrice,
      amountReceived,
      remainingBalance,
      createdAt: new Date().toISOString(),
    };
    setApartments(prev => [...prev, newUnit]);
    logAudit('create', 'apartment', newUnit.id, `Unit #${newUnit.unitNumber} (Floor ${newUnit.floor})`, `Added apartment unit: ${newUnit.areaM2} m², Status: ${newUnit.status}${newUnit.buyerName ? ` - Buyer: ${newUnit.buyerName}` : ''}`, undefined, `$${newUnit.salePrice}`, newUnit.projectId);
  };

  const updateApartment = (id: string, updates: Partial<ApartmentUnit>) => {
    const old = apartments.find(a => a.id === id);
    if (!old) return;
    const areaM2 = updates.areaM2 !== undefined ? updates.areaM2 : old.areaM2;
    const pricePerM2 = updates.pricePerM2 !== undefined ? updates.pricePerM2 : old.pricePerM2 || 0;
    const salePrice = updates.salePrice !== undefined ? updates.salePrice : (pricePerM2 > 0 ? Math.round(areaM2 * pricePerM2) : (old.salePrice || 0));
    const amountReceived = updates.amountReceived !== undefined ? updates.amountReceived : (old.amountReceived || 0);
    const remainingBalance = salePrice - amountReceived;
    setApartments(prev => prev.map(a => (a.id === id ? {
      ...a,
      ...updates,
      areaM2,
      pricePerM2,
      salePrice,
      amountReceived,
      remainingBalance
    } : a)));
    logAudit('update', 'apartment', id, `Unit #${updates.unitNumber || old.unitNumber}`, `Updated apartment / buyer details`, `$${old.salePrice}`, `$${salePrice}`, old.projectId);
  };

  const deleteApartment = (id: string) => {
    const old = apartments.find(a => a.id === id);
    setApartments(prev => prev.filter(a => a.id !== id));
    logAudit('delete', 'apartment', id, `Unit #${old?.unitNumber}`, `Deleted apartment unit`, `$${old?.salePrice}`, undefined, old?.projectId);
  };

  const addInstallmentPayment = (
    apartmentId: string,
    installmentId: string,
    amount: number,
    paymentMethod?: string,
    receiptNumber?: string,
    notes?: string,
  ) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const apartment = apartments.find(unit => unit.id === apartmentId);
    if (!apartment) return;
    const installments = normalizeApartmentInstallments(apartment);
    const target = installments.find(item => item.id === installmentId);
    if (!target || amount > target.remainingAmount + 0.001) return;
    const today = new Date().toISOString().slice(0, 10);
    const paidAmount = target.paidAmount + amount;
    const remainingAmount = Math.max(0, target.amount - paidAmount);
    const payment = {
      id: `installment-payment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      paymentNumber: target.paymentHistory.length + 1,
      amount,
      currency: target.currency || apartment.currency || 'USD',
      date: today,
      receiptNumber,
      notes: [paymentMethod, notes].filter(Boolean).join(' · ') || undefined,
      receivedBy: currentUser?.name,
    };
    const updatedInstallments = installments.map(item => item.id === installmentId ? {
      ...item,
      paidAmount,
      remainingAmount,
      status: calculateInstallmentStatus(item.amount, paidAmount, item.dueDate),
      paymentHistory: [...item.paymentHistory, payment],
      received: remainingAmount === 0,
      receivedDate: remainingAmount === 0 ? today : item.receivedDate,
    } : item);
    const totalRemaining = updatedInstallments.reduce((sum, item) => sum + item.remainingAmount, 0);
    const totalPaidNow = updatedInstallments.reduce((sum, item) => sum + item.paidAmount, 0);
    setApartments(prev => prev.map(unit => unit.id === apartmentId ? {
      ...unit,
      installments: updatedInstallments,
      amountReceived: totalPaidNow,
      totalReceived: totalPaidNow,
      remainingBalance: totalRemaining,
    } : unit));
    logAudit('update', 'apartment', apartmentId, `Installment #${target.installmentNumber} payment`, `Received ${amount} ${payment.currency}; remaining ${remainingAmount} ${payment.currency}.`, undefined, receiptNumber, apartment.projectId);
  };

  const updateInstallment = (apartmentId: string, installmentId: string, updates: Partial<InstallmentRecord>) => {
    const apartment = apartments.find(unit => unit.id === apartmentId);
    if (!apartment) return;
    const installments = normalizeApartmentInstallments(apartment);
    const updatedInstallments = installments.map(item => {
      if (item.id !== installmentId) return item;
      const merged = { ...item, ...updates, id: item.id };
      const paidAmount = Math.max(0, Math.min(merged.amount, merged.paidAmount || 0));
      const remainingAmount = Math.max(0, merged.amount - paidAmount);
      return {
        ...merged,
        paidAmount,
        remainingAmount,
        status: calculateInstallmentStatus(merged.amount, paidAmount, merged.dueDate),
        paymentHistory: merged.paymentHistory || [],
      };
    });
    const totalRemaining = updatedInstallments.reduce((sum, item) => sum + item.remainingAmount, 0);
    const totalPaid = updatedInstallments.reduce((sum, item) => sum + item.paidAmount, 0);
    setApartments(prev => prev.map(unit => unit.id === apartmentId ? {
      ...unit,
      installments: updatedInstallments,
      amountReceived: totalPaid,
      totalReceived: totalPaid,
      remainingBalance: totalRemaining,
    } : unit));
  };

  const addInstallmentToApartment = (
    apartmentId: string,
    installmentData: Omit<InstallmentRecord, 'id' | 'remainingAmount' | 'status' | 'paymentHistory'>,
  ) => {
    const apartment = apartments.find(unit => unit.id === apartmentId);
    if (!apartment || !Number.isFinite(installmentData.amount) || installmentData.amount <= 0) return;
    const current = normalizeApartmentInstallments(apartment);
    const remainingAmount = Math.max(0, installmentData.amount - installmentData.paidAmount);
    const newInstallment: InstallmentRecord = {
      ...installmentData,
      id: `installment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      apartmentId,
      projectId: apartment.projectId,
      remainingAmount,
      status: calculateInstallmentStatus(installmentData.amount, installmentData.paidAmount, installmentData.dueDate),
      paymentHistory: [],
    };
    const updatedInstallments = [...current, newInstallment];
    setApartments(prev => prev.map(unit => unit.id === apartmentId ? {
      ...unit,
      installments: updatedInstallments,
      remainingBalance: updatedInstallments.reduce((sum, item) => sum + item.remainingAmount, 0),
    } : unit));
  };

  const deleteInstallment = (apartmentId: string, installmentId: string) => {
    const apartment = apartments.find(unit => unit.id === apartmentId);
    if (!apartment) return;
    const updatedInstallments = normalizeApartmentInstallments(apartment).filter(item => item.id !== installmentId);
    setApartments(prev => prev.map(unit => unit.id === apartmentId ? {
      ...unit,
      installments: updatedInstallments,
      remainingBalance: updatedInstallments.reduce((sum, item) => sum + item.remainingAmount, 0),
    } : unit));
  };

  // Payments CRUD
  const addPayment = (paymentData: Omit<Payment, 'id' | 'createdAt' | 'createdBy'>) => {
    const time = paymentData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const newPayment: Payment = {
      ...paymentData,
      time,
      id: 'pay-' + Date.now(),
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || 'Admin',
    };
    setPayments(prev => [newPayment, ...prev]);

    if (paymentData.relatedType === 'apartment_sale' && paymentData.relatedId) {
      setApartments(prev => prev.map(u => {
        if (u.id === paymentData.relatedId) {
          const currentReceived = u.amountReceived || 0;
          const newReceived = currentReceived + paymentData.amount;
          const salePrice = u.salePrice || 0;
          return {
            ...u,
            amountReceived: newReceived,
            remainingBalance: Math.max(0, salePrice - newReceived),
            status: newReceived >= salePrice ? 'sold' : u.status,
          };
        }
        return u;
      }));
    } else if ((paymentData.relatedType === 'material_steel' || paymentData.relatedType === 'steel') && paymentData.relatedId) {
      setSteelRecords(prev => prev.map(s => {
        if (s.id === paymentData.relatedId) {
          const paidAmount = (s.paidAmount || 0) + paymentData.amount;
          return {
            ...s,
            paidAmount,
            remainingBalance: Math.max(0, s.totalAmount - paidAmount),
          };
        }
        return s;
      }));
    } else if ((paymentData.relatedType === 'material_concrete' || paymentData.relatedType === 'concrete') && paymentData.relatedId) {
      setConcreteRecords(prev => prev.map(c => {
        if (c.id === paymentData.relatedId) {
          const paidAmount = (c.paidAmount || 0) + paymentData.amount;
          return {
            ...c,
            paidAmount,
            remainingBalance: Math.max(0, c.totalAmount - paidAmount),
          };
        }
        return c;
      }));
    } else if (paymentData.relatedType === 'contractor') {
      setContractors(prev => prev.map(c => {
        if (c.id === paymentData.relatedId || c.name.toLowerCase() === paymentData.partyName.toLowerCase()) {
          const currentPaid = c.totalPaid || 0;
          const newPaid = currentPaid + paymentData.amount;
          return {
            ...c,
            totalPaid: newPaid,
            remainingBalance: Math.max(0, c.contractAmount - newPaid),
          };
        }
        return c;
      }));
    } else if (paymentData.relatedType === 'supplier') {
      setSuppliers(prev => prev.map(s => {
        if (s.id === paymentData.relatedId || s.name.toLowerCase() === paymentData.partyName.toLowerCase()) {
          const currentPaid = s.totalPaid || 0;
          const newPaid = currentPaid + paymentData.amount;
          const purchases = s.totalPurchases || 0;
          return {
            ...s,
            totalPaid: newPaid,
            remainingBalance: Math.max(0, purchases - newPaid),
          };
        }
        return s;
      }));
    } else if (paymentData.relatedType === 'expense' && paymentData.relatedId) {
      const targetExp = expenses.find(e => e.id === paymentData.relatedId);
      setExpenses(prev => prev.map(e => {
        if (e.id === paymentData.relatedId) {
          const paidAmount = (e.paidAmount || 0) + paymentData.amount;
          return {
            ...e,
            paidAmount,
            remainingAmount: Math.max(0, e.amount - paidAmount),
            paymentStatus: paidAmount >= e.amount ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid'),
          };
        }
        return e;
      }));
      const supplierName = targetExp?.partyName || paymentData.partyName;
      if (supplierName && supplierName.trim()) {
        setSuppliers(prev => prev.map(s => {
          if (s.projectId === (targetExp?.projectId || currentProjectId) && s.name.trim().toLowerCase() === supplierName.trim().toLowerCase()) {
            const currentPaid = (s.totalPaid || 0) + paymentData.amount;
            const purchases = s.totalPurchases || 0;
            return {
              ...s,
              totalPaid: currentPaid,
              remainingBalance: Math.max(0, purchases - currentPaid),
            };
          }
          return s;
        }));
      }
    }
    logAudit('create', 'payment', newPayment.id, `Payment to/from: ${newPayment.partyName}`, `Amount: $${newPayment.amount.toLocaleString()} (${newPayment.method}) - ${newPayment.description}`, undefined, `$${newPayment.amount}`, newPayment.projectId);
  };

  const deletePayment = (id: string) => {
    const old = payments.find(p => p.id === id);
    if (!old) return;
    setPayments(prev => prev.filter(p => p.id !== id));

    if (old.relatedType === 'apartment_sale' && old.relatedId) {
      setApartments(prev => prev.map(u => {
        if (u.id === old.relatedId) {
          const currentReceived = u.amountReceived || 0;
          const newReceived = Math.max(0, currentReceived - old.amount);
          const salePrice = u.salePrice || 0;
          return {
            ...u,
            amountReceived: newReceived,
            remainingBalance: Math.max(0, salePrice - newReceived),
            status: newReceived < salePrice && u.status === 'sold' ? 'reserved' : u.status,
          };
        }
        return u;
      }));
    } else if ((old.relatedType === 'material_steel' || old.relatedType === 'steel') && old.relatedId) {
      setSteelRecords(prev => prev.map(s => {
        if (s.id === old.relatedId) {
          const paidAmount = Math.max(0, (s.paidAmount || 0) - old.amount);
          return {
            ...s,
            paidAmount,
            remainingBalance: Math.max(0, s.totalAmount - paidAmount),
          };
        }
        return s;
      }));
    } else if ((old.relatedType === 'material_concrete' || old.relatedType === 'concrete') && old.relatedId) {
      setConcreteRecords(prev => prev.map(c => {
        if (c.id === old.relatedId) {
          const paidAmount = Math.max(0, (c.paidAmount || 0) - old.amount);
          return {
            ...c,
            paidAmount,
            remainingBalance: Math.max(0, c.totalAmount - paidAmount),
          };
        }
        return c;
      }));
    } else if (old.relatedType === 'contractor') {
      setContractors(prev => prev.map(c => {
        if (c.id === old.relatedId || c.name.toLowerCase() === old.partyName.toLowerCase()) {
          const currentPaid = c.totalPaid || 0;
          const newPaid = Math.max(0, currentPaid - old.amount);
          return {
            ...c,
            totalPaid: newPaid,
            remainingBalance: Math.max(0, c.contractAmount - newPaid),
          };
        }
        return c;
      }));
    } else if (old.relatedType === 'supplier') {
      setSuppliers(prev => prev.map(s => {
        if (s.id === old.relatedId || s.name.toLowerCase() === old.partyName.toLowerCase()) {
          const currentPaid = s.totalPaid || 0;
          const newPaid = Math.max(0, currentPaid - old.amount);
          const purchases = s.totalPurchases || 0;
          return {
            ...s,
            totalPaid: newPaid,
            remainingBalance: Math.max(0, purchases - newPaid),
          };
        }
        return s;
      }));
    } else if (old.relatedType === 'expense' && old.relatedId) {
      const targetExp = expenses.find(e => e.id === old.relatedId);
      setExpenses(prev => prev.map(e => {
        if (e.id === old.relatedId) {
          const paidAmount = Math.max(0, (e.paidAmount || 0) - old.amount);
          return {
            ...e,
            paidAmount,
            remainingAmount: Math.max(0, e.amount - paidAmount),
            paymentStatus: paidAmount >= e.amount ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid'),
          };
        }
        return e;
      }));
      const supplierName = targetExp?.partyName || old.partyName;
      if (supplierName && supplierName.trim()) {
        setSuppliers(prev => prev.map(s => {
          if (s.projectId === (targetExp?.projectId || old.projectId) && s.name.trim().toLowerCase() === supplierName.trim().toLowerCase()) {
            const currentPaid = Math.max(0, (s.totalPaid || 0) - old.amount);
            const purchases = s.totalPurchases || 0;
            return {
              ...s,
              totalPaid: currentPaid,
              remainingBalance: Math.max(0, purchases - currentPaid),
            };
          }
          return s;
        }));
      }
    }
    logAudit('delete', 'payment', id, `Payment: ${old?.partyName}`, `Deleted payment voucher #${old?.receiptNumber || id}`, `$${old?.amount}`, undefined, old?.projectId);
  };

  const updatePayment = (id: string, updates: Partial<Payment>) => {
    setPayments(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    logAudit('update', 'payment', id, updates.partyName || 'Payment', 'Updated payment details', undefined, undefined, currentProjectId);
  };

  const debtorParties = useMemo(() => {
    const list: Array<{
      partyName: string;
      category: string;
      relatedType: 'contractor' | 'supplier' | 'steel' | 'concrete' | 'expense' | 'material_steel' | 'material_concrete';
      relatedId: string;
      debtAmount: number;
      title: string;
    }> = [];

    contractors.filter(c => c.projectId === currentProjectId).forEach(c => {
      const remaining = Math.max(0, c.contractAmount - (c.totalPaid || 0));
      if (remaining > 0) {
        list.push({
          partyName: c.name,
          category: 'contractor',
          relatedType: 'contractor',
          relatedId: c.id,
          debtAmount: remaining,
          title: `${c.name} (${c.contractType || 'Contractor'}) - باقی‌داری: $${remaining.toLocaleString()}`,
        });
      }
    });

    suppliers.filter(s => s.projectId === currentProjectId).forEach(s => {
      const remaining = s.remainingBalance !== undefined ? s.remainingBalance : Math.max(0, (s.totalPurchases || 0) - (s.totalPaid || 0));
      if (remaining > 0) {
        list.push({
          partyName: s.name,
          category: 'supplier',
          relatedType: 'supplier',
          relatedId: s.id,
          debtAmount: remaining,
          title: `${s.name} (${s.materialsSupplied || 'Supplier'}) - باقی‌داری: $${remaining.toLocaleString()}`,
        });
      }
    });

    steelRecords.filter(s => s.projectId === currentProjectId && s.remainingBalance > 0).forEach(s => {
      list.push({
        partyName: s.supplierName,
        category: 'steel',
        relatedType: 'material_steel',
        relatedId: s.id,
        debtAmount: s.remainingBalance,
        title: `${s.supplierName} (بل سیخ #${s.billNumber}) - باقی‌داری: $${s.remainingBalance.toLocaleString()}`,
      });
    });

    concreteRecords.filter(c => c.projectId === currentProjectId && c.remainingBalance > 0).forEach(c => {
      list.push({
        partyName: c.supplierName,
        category: 'concrete',
        relatedType: 'material_concrete',
        relatedId: c.id,
        debtAmount: c.remainingBalance,
        title: `${c.supplierName} (تکت کانکریت #${c.billNumber}) - باقی‌داری: $${c.remainingBalance.toLocaleString()}`,
      });
    });

    expenses.filter(e => e.projectId === currentProjectId && (e.remainingAmount || 0) > 0).forEach(e => {
      const itemTitle = e.item ? `${e.item}${e.quantity ? ` (${e.quantity} ${e.unit || ''})` : ''}` : e.description;
      const billInfo = e.billNumber ? ` (بل #${e.billNumber})` : '';
      const party = e.partyName ? ` - فروشنده: ${e.partyName}` : e.category;
      list.push({
        partyName: e.partyName || e.category,
        category: 'expense',
        relatedType: 'expense',
        relatedId: e.id,
        debtAmount: e.remainingAmount || 0,
        title: `خریداری: ${itemTitle} ${billInfo ? ` ${billInfo}` : ''} - ${party} - باقی‌داری: $${(e.remainingAmount || 0).toLocaleString()}`,
      });
    });

    return list;
  }, [contractors, suppliers, steelRecords, concreteRecords, expenses, currentProjectId]);

  // Documents CRUD & Camera Capture
  const addDocument = (docData: Omit<DocumentRecord, 'id' | 'createdAt'>) => {
    const newDoc: DocumentRecord = {
      ...docData,
      id: 'doc-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setDocuments(prev => [newDoc, ...prev]);
    logAudit('create', 'expense', newDoc.id, `Document: ${newDoc.title}`, `Category: ${newDoc.category} - File: ${newDoc.fileName}`, undefined, undefined, newDoc.projectId);
  };

  const deleteDocument = (id: string) => {
    const old = documents.find(d => d.id === id);
    setDocuments(prev => prev.filter(d => d.id !== id));
    logAudit('delete', 'expense', id, `Document: ${old?.title}`, `Removed attached document`, undefined, undefined, old?.projectId);
  };

  const openCameraForCapture = (target?: { title?: string; relatedType?: string; relatedId?: string; amount?: number }) => {
    setCameraTargetData(target || null);
    setCameraModalOpen(true);
  };

  const saveCameraPhotoAsDocument = (photoDataUrl: string, title: string, amount?: number) => {
    const newDoc: DocumentRecord = {
      id: 'doc-cam-' + Date.now(),
      projectId: currentProjectId,
      title: title || `عکس فاکتور ${new Date().toLocaleDateString()}`,
      category: 'bill',
      fileUrl: photoDataUrl,
      fileName: `Camera_Receipt_${Date.now()}.jpg`,
      fileType: 'image/jpeg',
      fileSize: 'تصویر کمره',
      relatedType: cameraTargetData?.relatedType || 'expense',
      relatedId: cameraTargetData?.relatedId,
      amount: amount || cameraTargetData?.amount,
      date: new Date().toISOString().split('T')[0],
      notes: 'ثبت مستقیم با کمره از ساحه کار.',
      createdAt: new Date().toISOString(),
    };
    setDocuments(prev => [newDoc, ...prev]);
    setCameraModalOpen(false);
    setCameraTargetData(null);
    logAudit('create', 'expense', newDoc.id, newDoc.title, 'Photo of physical bill captured and saved to project', undefined, undefined, currentProjectId);
  };

  // Google Drive: Backup database to Google Drive
  const backupToGoogleDrive = async (): Promise<{ success: boolean; fileLink?: string; error?: string }> => {
    try {
      const [{ getAccessToken }, { getOrCreateFolder, uploadFileToGoogleDrive }] = await Promise.all([
        import('../services/googleDriveAuth'),
        import('../services/googleDriveService'),
      ]);
      const token = await getAccessToken();
      if (!token) {
        const connected = await connectGoogleDrive();
        if (!connected) {
          return { success: false, error: 'لطفاً ابتدا با حساب گوگل خود وارد شوید.' };
        }
      }

      // 1. Create/Find parent folder "NIK SMART COUNT"
      const parentFolderId = await getOrCreateFolder('NIK SMART COUNT');
      // 2. Create/Find project subfolder
      const projFolderId = await getOrCreateFolder(currentProject?.name || 'Main Project', parentFolderId);

      // 3. Prepare JSON backup
      const backupData = {
        appName: 'NIK SMART COUNT Database',
        exportedAt: new Date().toISOString(),
        project: currentProject,
        projects,
        expenses,
        steelRecords,
        concreteRecords,
        materialProcurements,
        contractors,
        suppliers,
        apartments,
        payments,
        documents,
        projectPartners,
        projectInvestments,
        appSettings,
      };

      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `Backup_${(currentProject?.name || 'Project').replace(/\s+/g, '_')}_${dateStr}.json`;

      const uploaded = await uploadFileToGoogleDrive({
        fileName,
        mimeType: 'application/json',
        content: JSON.stringify(backupData, null, 2),
        folderId: projFolderId,
      });

      // Also record as a document in the app
      addDocument({
        projectId: currentProjectId,
        title: `Google Drive Backup - ${dateStr}`,
        category: 'backup',
        fileUrl: uploaded.webViewLink || '#',
        fileName,
        fileType: 'application/json',
        date: dateStr,
        googleDriveFileId: uploaded.id,
        googleDriveLink: uploaded.webViewLink,
        notes: `نسخه پشتیبان کامل دیتابیس در گوگل درایو ذخیره شد.`,
      });

      logAudit('create', 'project', uploaded.id, `Google Drive Backup: ${fileName}`, 'Full JSON database backed up to Google Drive', undefined, undefined, currentProjectId);
      return { success: true, fileLink: uploaded.webViewLink };
    } catch (err: any) {
      console.error('Backup to Google Drive error:', err);
      return { success: false, error: err.message || 'خطا در پشتیبان‌گیری در گوگل درایو' };
    }
  };

  // Google Drive: Upload specific document to Google Drive
  const uploadDocumentToGoogleDrive = async (docId: string): Promise<{ success: boolean; link?: string; error?: string }> => {
    try {
      const [{ getAccessToken }, { getOrCreateFolder, uploadFileToGoogleDrive }] = await Promise.all([
        import('../services/googleDriveAuth'),
        import('../services/googleDriveService'),
      ]);
      const doc = documents.find(d => d.id === docId);
      if (!doc) return { success: false, error: 'سند یافت نشد' };

      const token = await getAccessToken();
      if (!token) {
        const connected = await connectGoogleDrive();
        if (!connected) return { success: false, error: 'لطفاً ابتدا با حساب گوگل خود وارد شوید.' };
      }

      const parentFolderId = await getOrCreateFolder('NIK SMART COUNT');
      const projFolderId = await getOrCreateFolder(currentProject?.name || 'Documents', parentFolderId);

      const uploaded = await uploadFileToGoogleDrive({
        fileName: doc.fileName || `${doc.title.replace(/\s+/g, '_')}.jpg`,
        mimeType: doc.fileType || 'image/jpeg',
        content: doc.fileUrl,
        folderId: projFolderId,
      });

      // Update document record with Google Drive link
      setDocuments(prev => prev.map(d => d.id === docId ? {
        ...d,
        googleDriveFileId: uploaded.id,
        googleDriveLink: uploaded.webViewLink,
      } : d));

      logAudit('update', 'expense', doc.id, doc.title, `Uploaded to Google Drive: ${uploaded.webViewLink}`, undefined, undefined, doc.projectId);
      return { success: true, link: uploaded.webViewLink };
    } catch (err: any) {
      return { success: false, error: err.message || 'خطا در آپلود به گوگل درایو' };
    }
  };

  const getProjectFinancials = (projId: string): ProjectFinancialSummary => {
    const projExpenses = expenses.filter(e => e.projectId === projId);
    const projSteel = steelRecords.filter(s => s.projectId === projId);
    const projConcrete = concreteRecords.filter(c => c.projectId === projId);
    const projMaterials = materialProcurements.filter(m => m.projectId === projId);
    const projContractors = contractors.filter(c => c.projectId === projId);
    const projSuppliers = suppliers.filter(s => s.projectId === projId);
    const projApartments = apartments.filter(a => a.projectId === projId);
    const projPayments = payments.filter(p => p.projectId === projId);

    const steelTotal = projSteel.reduce((acc, s) => acc + s.totalAmount, 0);
    const steelPaid = projSteel.reduce((acc, s) => acc + s.paidAmount, 0);
    const steelRemaining = steelTotal - steelPaid;
    const steelUSD = projSteel.filter(s => (s.currency || 'USD') === 'USD').reduce((acc, s) => acc + s.totalAmount, 0);
    const steelAFN = projSteel.filter(s => s.currency === 'AFN').reduce((acc, s) => acc + s.totalAmount, 0);

    const concreteTotal = projConcrete.reduce((acc, c) => acc + c.totalAmount, 0);
    const concretePaid = projConcrete.reduce((acc, c) => acc + c.paidAmount, 0);
    const concreteRemaining = concreteTotal - concretePaid;
    const concreteUSD = projConcrete.filter(c => (c.currency || 'USD') === 'USD').reduce((acc, c) => acc + c.totalAmount, 0);
    const concreteAFN = projConcrete.filter(c => c.currency === 'AFN').reduce((acc, c) => acc + c.totalAmount, 0);

    const materialTotal = projMaterials.reduce((acc, material) => acc + (material.totalCost || material.quantity * material.unitPrice), 0);
    const materialPaid = projMaterials.filter(material => material.isPaid).reduce((acc, material) => acc + (material.totalCost || material.quantity * material.unitPrice), 0);
    const materialUSD = projMaterials.filter(material => material.currency === 'USD').reduce((acc, material) => acc + (material.totalCost || material.quantity * material.unitPrice), 0);
    const materialAFN = projMaterials.filter(material => material.currency === 'AFN').reduce((acc, material) => acc + (material.totalCost || material.quantity * material.unitPrice), 0);

    const otherExpensesTotal = projExpenses.reduce((acc, e) => acc + e.amount, 0);
    const otherExpensesPaid = projExpenses.reduce((acc, e) => acc + (e.paidAmount || 0), 0);
    const otherExpUSD = projExpenses.filter(e => (e.currency || 'USD') === 'USD').reduce((acc, e) => acc + e.amount, 0);
    const otherExpAFN = projExpenses.filter(e => e.currency === 'AFN').reduce((acc, e) => acc + e.amount, 0);

    const contractorTotal = projContractors.reduce((acc, c) => acc + c.contractAmount, 0);
    const contractorPayments = projPayments.filter(p => p.relatedType === 'contractor');
    const contractorPaid = contractorPayments.reduce((acc, p) => acc + p.amount, 0);
    const contractorRemaining = Math.max(0, contractorTotal - contractorPaid);
    const contractorUSD = projContractors.filter(c => (c.currency || 'USD') === 'USD').reduce((acc, c) => acc + c.contractAmount, 0);
    const contractorAFN = projContractors.filter(c => c.currency === 'AFN').reduce((acc, c) => acc + c.contractAmount, 0);

    const supplierPurchases = steelTotal + concreteTotal + materialTotal + projExpenses.filter(e => e.partyType === 'supplier').reduce((acc, e) => acc + e.amount, 0);
    const supplierPayments = projPayments.filter(p => p.relatedType === 'supplier' || p.relatedType === 'material_steel' || p.relatedType === 'material_concrete');
    const supplierPaid = supplierPayments.reduce((acc, p) => acc + p.amount, 0) + materialPaid;
    const supplierRemaining = Math.max(0, supplierPurchases - supplierPaid);
    const supplierUSD = projSuppliers.filter(s => (s.currency || 'USD') === 'USD').reduce((acc, s) => acc + (s.totalPurchases || 0), 0);
    const supplierAFN = projSuppliers.filter(s => s.currency === 'AFN').reduce((acc, s) => acc + (s.totalPurchases || 0), 0);

    const expensesUSD = steelUSD + concreteUSD + materialUSD + otherExpUSD;
    const expensesAFN = steelAFN + concreteAFN + materialAFN + otherExpAFN;
    const totalExpenses = steelTotal + concreteTotal + materialTotal + otherExpensesTotal;

    const outflowPayments = projPayments.filter(p => p.relatedType !== 'apartment_sale');
    const paymentsUSD = outflowPayments.filter(p => (p.currency || 'USD') === 'USD').reduce((acc, p) => acc + p.amount, 0) + projMaterials.filter(m => m.currency === 'USD' && m.isPaid).reduce((acc, m) => acc + (m.totalCost || m.quantity * m.unitPrice), 0);
    const paymentsAFN = outflowPayments.filter(p => p.currency === 'AFN').reduce((acc, p) => acc + p.amount, 0) + projMaterials.filter(m => m.currency === 'AFN' && m.isPaid).reduce((acc, m) => acc + (m.totalCost || m.quantity * m.unitPrice), 0);
    const totalPayments = outflowPayments.reduce((acc, p) => acc + p.amount, 0) + materialPaid;

    const outstandingUSD = Math.max(0, expensesUSD - paymentsUSD);
    const outstandingAFN = Math.max(0, expensesAFN - paymentsAFN);
    const totalOutstanding = Math.max(0, totalExpenses - totalPayments);

    const soldApartments = projApartments.filter(a => a.status === 'sold' || a.status === 'reserved');
    const totalSales = soldApartments.reduce((acc, a) => acc + (a.salePrice || 0), 0);
    const salesUSD = soldApartments.filter(a => (a.currency || 'USD') === 'USD').reduce((acc, a) => acc + (a.salePrice || a.totalPrice || 0), 0);
    const salesAFN = soldApartments.filter(a => a.currency === 'AFN').reduce((acc, a) => acc + (a.salePrice || a.totalPrice || 0), 0);
    
    const salesPayments = projPayments.filter(p => p.relatedType === 'apartment_sale');
    const salesReceivedUSD = salesPayments.filter(p => (p.currency || 'USD') === 'USD').reduce((acc, p) => acc + p.amount, 0);
    const salesReceivedAFN = salesPayments.filter(p => p.currency === 'AFN').reduce((acc, p) => acc + p.amount, 0);
    const totalSalesReceived = salesPayments.reduce((acc, p) => acc + p.amount, 0);
    
    const salesOutstanding = Math.max(0, totalSales - totalSalesReceived);
    const salesOutstandingUSD = Math.max(0, salesUSD - salesReceivedUSD);
    const salesOutstandingAFN = Math.max(0, salesAFN - salesReceivedAFN);

    const netPosition = totalSalesReceived - totalPayments;
    const netPositionUSD = salesReceivedUSD - paymentsUSD;
    const netPositionAFN = salesReceivedAFN - paymentsAFN;

    return {
      totalExpenses,
      totalPayments,
      totalOutstanding,
      totalSales,
      totalSalesReceived,
      salesOutstanding,
      netPosition,
      steelTotal,
      steelPaid,
      steelRemaining,
      concreteTotal,
      concretePaid,
      concreteRemaining,
      contractorTotal,
      contractorPaid,
      contractorRemaining,
      supplierTotal: supplierPurchases,
      supplierPaid,
      supplierRemaining,
      expensesUSD,
      expensesAFN,
      paymentsUSD,
      paymentsAFN,
      outstandingUSD,
      outstandingAFN,
      salesUSD,
      salesAFN,
      salesReceivedUSD,
      salesReceivedAFN,
      salesOutstandingUSD,
      salesOutstandingAFN,
      netPositionUSD,
      netPositionAFN,
      steelUSD,
      steelAFN,
      concreteUSD,
      concreteAFN,
      contractorUSD,
      contractorAFN,
      supplierUSD,
      supplierAFN,
    };
  };

  const currentFinancials = useMemo(() => {
    return getProjectFinancials(currentProjectId);
  }, [currentProjectId, expenses, steelRecords, concreteRecords, materialProcurements, contractors, suppliers, apartments, payments]);

  /* ------------------------------------------------------------------ */
  /* Accounting layer: auto-derived double-entry journal                  */
  /* ------------------------------------------------------------------ */
  const journalEntries = useMemo<JournalEntry[]>(() => {
    return buildJournal({
      projects,
      expenses,
      steelRecords,
      concreteRecords,
      materialProcurements,
      payments,
      apartments,
      projectInvestments,
    });
  }, [projects, expenses, steelRecords, concreteRecords, materialProcurements, payments, apartments, projectInvestments]);

  const accountBalances = useMemo<AccountBalance[]>(() => {
    return computeAccountBalances(journalEntries);
  }, [journalEntries]);

  const getAccountBalance = (accountCode: string, projectId?: string): AccountBalance | undefined => {
    if (!projectId) return accountBalances.find(b => b.accountCode === accountCode);
    return computeAccountBalances(journalEntries, projectId).find(b => b.accountCode === accountCode);
  };

  const getTrialBalance = (projectId?: string) => buildTrialBalance(journalEntries, projectId);

  const getProjectJournal = (projectId: string): JournalEntry[] =>
    journalEntries.filter(e => e.projectId === projectId);

  const getAccountDisplayName = (code: string, lang?: Language): string =>
    getAccountName(code, lang || language);

  /* ------------------------------------------------------------------ */
  /* Project Budget (per project, per COA account)                      */
  /* ------------------------------------------------------------------ */
  const getProjectBudgets = (projectId: string): ProjectBudget[] =>
    projectBudgets.filter(b => b.projectId === projectId);

  const getBudgetReport = (projectId: string): BudgetLineReport[] =>
    computeBudgetReport({
      projectId,
      project: projects.find(p => p.id === projectId),
      budgets: projectBudgets,
      expenses,
      steelRecords,
      concreteRecords,
      materialProcurements,
    });

  const budgetWithNorm = (
    data: { amount: number; currency: string; exchangeRate?: number; projectId: string }
  ) => {
    const proj = projects.find(p => p.id === data.projectId);
    const rate = data.exchangeRate || proj?.defaultExchangeRate || 70;
    const amountUSD = data.currency === 'USD' ? data.amount : (rate > 0 ? Number((data.amount / rate).toFixed(2)) : data.amount);
    const amountAFN = data.currency === 'AFN' ? Math.round(data.amount) : Math.round(data.amount * rate);
    return { exchangeRate: rate, amountUSD, amountAFN };
  };

  const addProjectBudget = (data: Omit<ProjectBudget, 'id' | 'createdAt' | 'createdBy'>) => {
    // Standard: single budget line per (project, account). If one exists,
    // update it instead of creating a duplicate row.
    const existing = projectBudgets.find(b => b.projectId === data.projectId && b.accountCode === data.accountCode);
    if (existing) {
      updateProjectBudget(existing.id, data);
      return;
    }
    const norm = budgetWithNorm(data);
    const newBudget: ProjectBudget = {
      ...data,
      ...norm,
      id: 'bdg-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || 'Admin',
    };
    setProjectBudgets(prev => [...prev, newBudget]);
    logAudit('create', 'expense', newBudget.id, `Budget: ${getAccountName(newBudget.accountCode, 'fa')}`, `Set budget ${newBudget.amount.toLocaleString()} ${newBudget.currency} for account ${newBudget.accountCode}`, undefined, `${newBudget.amount} ${newBudget.currency}`, newBudget.projectId);
  };

  const updateProjectBudget = (id: string, updates: Partial<ProjectBudget>) => {
    const old = projectBudgets.find(b => b.id === id);
    if (!old) return;
    const merged = { ...old, ...updates };
    const norm = budgetWithNorm({ amount: merged.amount, currency: merged.currency, exchangeRate: updates.exchangeRate, projectId: merged.projectId });
    setProjectBudgets(prev => prev.map(b => (b.id === id ? { ...merged, ...norm, updatedAt: new Date().toISOString() } : b)));
    logAudit('update', 'expense', id, `Budget: ${getAccountName(merged.accountCode, 'fa')}`, `Updated budget for account ${merged.accountCode}`, `${old.amount} ${old.currency}`, `${merged.amount} ${merged.currency}`, merged.projectId);
  };

  const deleteProjectBudget = (id: string) => {
    const old = projectBudgets.find(b => b.id === id);
    if (!old) return;
    setProjectBudgets(prev => prev.filter(b => b.id !== id));
    logAudit('delete', 'expense', id, `Budget: ${getAccountName(old.accountCode, 'fa')}`, `Removed budget of ${old.amount.toLocaleString()} ${old.currency} (account ${old.accountCode})`, `${old.amount} ${old.currency}`, undefined, old.projectId);
  };

  const addIncomeRecord = (record: Omit<IncomeRecord, 'id' | 'createdAt'>) => {
    const saved: IncomeRecord = { ...record, id: `income-${Date.now()}-${Math.floor(Math.random() * 10000)}`, createdAt: new Date().toISOString() };
    setIncomeRecords(prev => [saved, ...prev]);
    logAudit('create', 'payment', saved.id, `Income: ${saved.receivedFrom}`, `Income recorded: ${saved.amount} ${saved.currency}`, undefined, `${saved.amount} ${saved.currency}`, saved.projectId);
  };

  const addMaterialProcurement = (record: Omit<MaterialProcurementRecord, 'id' | 'totalCost' | 'createdAt' | 'accountCode'>) => {
    const saved: MaterialProcurementRecord = {
      ...record,
      id: `mat-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      totalCost: Number((record.quantity * record.unitPrice).toFixed(2)),
      createdAt: new Date().toISOString(),
    };
    setMaterialProcurements(prev => [saved, ...prev]);
    logAudit('create', 'expense', saved.id, `Material: ${saved.materialName}`, `Procurement recorded: ${saved.totalCost} ${saved.currency}`, undefined, `${saved.totalCost} ${saved.currency}`, saved.projectId);
  };

  const addInterProjectTransfer = (record: Omit<InterProjectTransferRecord, 'id' | 'createdAt'>) => {
    const saved: InterProjectTransferRecord = { ...record, id: `transfer-${Date.now()}-${Math.floor(Math.random() * 10000)}`, createdAt: new Date().toISOString() };
    setInterProjectTransfers(prev => [saved, ...prev]);
    logAudit('create', 'project', saved.id, `Transfer ${saved.fromProjectId} → ${saved.toProjectId}`, `Inter-project ${saved.transferNature} transfer recorded: ${saved.amount} ${saved.currency}`, undefined, `${saved.amount} ${saved.currency}`, saved.fromProjectId);
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return {
        projects: [],
        contractors: [],
        suppliers: [],
        apartments: [],
        expenses: [],
        steel: [],
        concrete: [],
        payments: [],
      };
    }
    return {
      projects: projects.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.code.toLowerCase().includes(q) || 
        p.city.toLowerCase().includes(q) || 
        p.address.toLowerCase().includes(q)
      ),
      contractors: contractors.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.contractType.toLowerCase().includes(q) || 
        c.phone.toLowerCase().includes(q) || 
        (c.workDescription || '').toLowerCase().includes(q)
      ),
      suppliers: suppliers.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.materialsSupplied.toLowerCase().includes(q) || 
        (s.contact || '').toLowerCase().includes(q)
      ),
      apartments: apartments.filter(a => 
        a.unitNumber.toLowerCase().includes(q) || 
        (a.buyerName && a.buyerName.toLowerCase().includes(q)) || 
        (a.buyerPhone && a.buyerPhone.toLowerCase().includes(q))
      ),
      expenses: expenses.filter(e => 
        e.description.toLowerCase().includes(q) || 
        e.category.toLowerCase().includes(q) || 
        (e.partyName && e.partyName.toLowerCase().includes(q))
      ),
      steel: steelRecords.filter(s => 
        s.billNumber.toLowerCase().includes(q) || 
        s.supplierName.toLowerCase().includes(q)
      ),
      concrete: concreteRecords.filter(c => 
        c.billNumber.toLowerCase().includes(q) || 
        c.concreteGrade.toLowerCase().includes(q) || 
        c.supplierName.toLowerCase().includes(q)
      ),
      payments: payments.filter(p => 
        p.partyName.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) || 
        (p.receiptNumber && p.receiptNumber.toLowerCase().includes(q))
      ),
    };
  }, [searchQuery, projects, contractors, suppliers, apartments, expenses, steelRecords, concreteRecords, payments]);

  const clearSampleData = () => {
    console.warn('Bulk data deletion is disabled. Use reviewed, server-side archival procedures.');
  };

  const exportJsonBackup = () => {
    const safeAppSettings: AppSettings = {
      ...appSettings,
      geminiApiKey: undefined,
      sectionProtection: appSettings.sectionProtection
        ? { enabled: appSettings.sectionProtection.enabled || {} }
        : undefined,
    };
    const backupData = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      appName: 'Nik Smart Count Database',
      language,
      currentProjectId,
      projects,
      projectPartners,
      projectInvestments,
      partnerEquityTransfers,
      projectBudgets,
      incomeRecords,
      materialProcurements,
      interProjectTransfers,
      expenses,
      steelRecords,
      concreteRecords,
      contractors,
      suppliers,
      apartments,
      payments,
      documents,
      laborRecords,
      assets,
      appSettings: safeAppSettings,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nik_smart_count_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const restoreJsonBackup = (jsonContent: string) => {
    try {
      if (typeof jsonContent !== 'string' || jsonContent.length > 15 * 1024 * 1024) {
        return { success: false, error: 'Backup file is too large.' };
      }
      const data = JSON.parse(jsonContent);
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return { success: false, error: 'Backup must contain a JSON object.' };
      }

      const collectionNames = [
        'projects', 'projectPartners', 'projectInvestments', 'partnerEquityTransfers', 'projectBudgets',
        'incomeRecords', 'materialProcurements', 'interProjectTransfers', 'expenses', 'steelRecords', 'concreteRecords', 'contractors', 'suppliers', 'apartments',
        'payments', 'documents', 'laborRecords', 'assets',
      ] as const;
      const validatedCollections: Partial<Record<typeof collectionNames[number], any[]>> = {};
      for (const key of collectionNames) {
        if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
        const value = data[key];
        if (!Array.isArray(value) || value.length > 20000) {
          return { success: false, error: `Invalid or oversized collection: ${key}.` };
        }
        const ids = new Set<string>();
        for (const record of value) {
          if (!record || typeof record !== 'object' || Array.isArray(record) || !['string', 'number'].includes(typeof record.id)) {
            return { success: false, error: `Invalid record in collection: ${key}.` };
          }
          const id = String(record.id);
          if (!id || ids.has(id)) return { success: false, error: `Duplicate or empty record identifier in ${key}.` };
          ids.add(id);
        }
        validatedCollections[key] = value;
      }

      const settings = data.appSettings && typeof data.appSettings === 'object' && !Array.isArray(data.appSettings)
        ? data.appSettings as Partial<AppSettings>
        : null;
      const backupLanguage = data.language;
      if (backupLanguage !== undefined && !['en', 'fa', 'ps'].includes(backupLanguage)) {
        return { success: false, error: 'Backup contains an unsupported language.' };
      }

      for (const key of collectionNames) {
        const value = validatedCollections[key];
        if (!value) continue;
        switch (key) {
          case 'projects': setProjects(value as Project[]); break;
          case 'projectPartners': setProjectPartners(value as ProjectPartner[]); break;
          case 'projectInvestments': setProjectInvestments(value as ProjectInvestment[]); break;
          case 'partnerEquityTransfers': setPartnerEquityTransfers(value as PartnerEquityTransfer[]); break;
          case 'projectBudgets': setProjectBudgets(value as ProjectBudget[]); break;
          case 'incomeRecords': setIncomeRecords(value as IncomeRecord[]); break;
          case 'materialProcurements': setMaterialProcurements(value as MaterialProcurementRecord[]); break;
          case 'interProjectTransfers': setInterProjectTransfers(value as InterProjectTransferRecord[]); break;
          case 'expenses': setExpenses(value as Expense[]); break;
          case 'steelRecords': setSteelRecords(value as SteelRecord[]); break;
          case 'concreteRecords': setConcreteRecords(value as ConcreteRecord[]); break;
          case 'contractors': setContractors(value as Contractor[]); break;
          case 'suppliers': setSuppliers(value as Supplier[]); break;
          case 'apartments': setApartments(value as ApartmentUnit[]); break;
          case 'payments': setPayments(value as Payment[]); break;
          case 'documents': setDocuments(value as DocumentRecord[]); break;
          case 'laborRecords': setLaborRecords(value as LaborRecord[]); break;
          case 'assets': setAssets(value as FixedAsset[]); break;
        }
      }
      if (settings) {
        setAppSettings(prev => ({
          ...prev,
          ...settings,
          geminiApiKey: undefined,
          sectionProtection: settings.sectionProtection ? { enabled: settings.sectionProtection.enabled || {} } : undefined,
        }));
      }
      if (backupLanguage) setLanguageState(backupLanguage as Language);
      if (typeof data.currentProjectId === 'string') setCurrentProjectIdState(data.currentProjectId);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Backup file is invalid.' };
    }
  };

  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isMasterAdminOpen, setIsMasterAdminOpen] = useState(false);

  const formatCurrency = (amount: number | undefined, currency: string = 'USD'): string => {
    if (amount === undefined || isNaN(amount)) return '0 ' + currency;
    const formatted = Math.round(amount).toLocaleString('en-US');
    if (currency === 'USD') return `$${formatted}`;
    if (currency === 'AFN') return `${formatted} ؋`;
    return `${formatted} ${currency}`;
  };

  const formatNumber = (value: number | undefined, decimals: number = 0): string => {
    if (value === undefined || isNaN(value)) return '0';
    return Number(value).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const unreadNotificationCount = notifications.filter(notification => !notification.read && !notification.dismissed).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(notification => notification.id === id ? { ...notification, read: true } : notification));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.map(notification => notification.id === id ? { ...notification, dismissed: true } : notification));
    setSelectedNotification(prev => prev?.id === id ? null : prev);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setSelectedNotification(null);
  };

  const refreshReminders = () => {
    if (!workspaceReady || !currentUser || currentUser.isMasterSuperAdmin) return;
    const now = new Date();
    const preferences = appSettings.notificationPreferences || {};
    const categoryForType: Record<SystemReminderNotification['type'], keyof NonNullable<AppSettings['notificationPreferences']>> = {
      installment_due_soon: 'installments',
      installment_overdue: 'installments',
      installment_paid: 'installments',
      unpaid_purchase: 'purchases',
      outstanding_debt: 'debts',
      missing_document: 'documents',
      project_inactivity: 'projects',
      general_financial: 'financial',
    };
    const isEnabled = (notification: SystemReminderNotification) => {
      const category = categoryForType[notification.type];
      return !category || preferences[category] !== false;
    };

    setNotifications(prev => {
      const reminders = generateSmartReminders({
        apartments,
        expenses,
        payments,
        contractors,
        suppliers,
        documents,
        projects,
        existingNotifications: prev,
        now,
        formatCurrency,
      });
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const recent = prev.filter(notification => notification.date >= cutoff);
      const all = [...reminders, ...recent];
      const seen = new Set<string>();
      return all.filter(notification => {
        if (!isEnabled(notification) || seen.has(notification.reminderKey)) return false;
        seen.add(notification.reminderKey);
        return true;
      }).slice(0, 500);
    });
  };

  useEffect(() => {
    refreshReminders();
    // Reminders are derived from the signed-in owner's server snapshot and kept in memory.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceReady, currentUser?.id, projects, apartments, expenses, payments, contractors, suppliers, documents, appSettings.notificationPreferences]);

  const clearAuditLogs = () => {
    setAuditLogs([]);
  };

  const exportBackupJSON = exportJsonBackup;
  const importBackupJSON = (json: any) => {
    return restoreJsonBackup(typeof json === 'string' ? json : JSON.stringify(json));
  };

  const uploadDocumentToDrive = async (doc: DocumentRecord) => {
    return await uploadDocumentToGoogleDrive(doc.id);
  };

  const restoreFromGoogleDrive = async (fileId: string) => {
    const { getAccessToken } = await import('../services/googleDriveAuth');
    const token = await getAccessToken();
    if (!token) throw new Error('Not authenticated with Google Drive.');
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to download backup from Google Drive');
    const content = await res.text();
    const result = restoreJsonBackup(content);
    if (!result.success) throw new Error(result.error || 'Failed to restore');
    return result;
  };

  return (
    <AppContext.Provider value={{
      language,
      setLanguage,
      authLoading,
      workspaceReady,
      workspaceSaving,
      workspaceError,
      t,
      currentUser,
      login,
      logout,
      switchUserRole,
      users,
      addUser,
      activityEvents,
      trackFeature,
      updateUser,
      toggleUserActive,
      createTenantCompanyOwnerBySuperAdmin,
      registerCompanyOwner,
      verifyOtpAndActivate,
      requestPasswordReset,
      completePasswordReset,
      chargeUserSubscription,
      toggleLockUserBySuperAdmin,
      createEmployeeAccount,
      updateEmployeeAccount,
      deleteEmployeeAccount,
      toggleAiForUser,
      updateTenantByMasterAdmin,
      impersonateTenant,
      toggleDarkMode,
      setTheme,
      projects,
      currentProject,
      setCurrentProjectId,
      addProject,
      updateProject,
      deleteProject,
      transferProject,
      projectPartners,
      projectInvestments,
      addProjectPartner,
      updateProjectPartner,
      deleteProjectPartner,
      addProjectInvestment,
      updateProjectInvestment,
      deleteProjectInvestment,
      partnerEquityTransfers,
      transferPartnerEquity,
      getProjectPartners,
      getProjectInvestments,
      expenses,
      addExpense,
      updateExpense,
      deleteExpense,
      getExpensePayments,
      steelRecords,
      addSteelRecord,
      updateSteelRecord,
      deleteSteelRecord,
      concreteRecords,
      addConcreteRecord,
      updateConcreteRecord,
      deleteConcreteRecord,
      contractors,
      addContractor,
      updateContractor,
      deleteContractor,
      suppliers,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      laborRecords,
      addLaborRecord,
      deleteLaborRecord,
      assets,
      addAsset,
      updateAsset,
      deleteAsset,
      apartments,
      addApartment,
      updateApartment,
      deleteApartment,
      addInstallmentPayment,
      updateInstallment,
      addInstallmentToApartment,
      deleteInstallment,
      notifications,
      unreadNotificationCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      dismissNotification,
      clearAllNotifications,
      refreshReminders,
      isNotificationCenterOpen,
      setIsNotificationCenterOpen,
      selectedNotification,
      setSelectedNotification,
      payments,
      addPayment,
      updatePayment,
      deletePayment,
      appSettings,
      updateAppSettings,
      debtorParties,
      documents,
      addDocument,
      deleteDocument,
      auditLogs,
      logAudit,
      currentFinancials,
      getProjectFinancials,
      chartOfAccounts: CHART_OF_ACCOUNTS,
      getAccountDisplayName,
      journalEntries,
      accountBalances,
      getAccountBalance,
      getTrialBalance,
      getProjectJournal,
      projectBudgets,
      incomeRecords,
      addIncomeRecord,
      materialProcurements,
      addMaterialProcurement,
      interProjectTransfers,
      addInterProjectTransfer,
      getProjectBudgets,
      getBudgetReport,
      addProjectBudget,
      updateProjectBudget,
      deleteProjectBudget,
      searchQuery,
      setSearchQuery,
      searchResults,
      cameraModalOpen,
      setCameraModalOpen,
      cameraTargetData,
      openCameraForCapture,
      saveCameraPhotoAsDocument,
      isApartmentsUnlocked,
      unlockApartments,
      lockApartments,
      themeSchedule: appSettings.themeSchedule || 'auto',
      setThemeSchedule,
      cycleThemeSchedule,
      isTabAllowed,
      updateReportCustomization,
      uploadCustomReportTemplate,
      isSectionProtected,
      isSectionUnlocked,
      unlockSection,
      lockSection,
      setSectionPassword,
      clearSampleData,
      exportJsonBackup,
      restoreJsonBackup,
      exportBackupJSON,
      importBackupJSON,
      clearAuditLogs,
      deleteUser,
      formatCurrency,
      formatNumber,
      isDarkMode: appSettings.darkMode ?? false,
      isGoogleDriveConnected,
      googleDriveUserEmail,
      googleUser: googleDriveUserEmail ? { displayName: googleDriveUserEmail.split('@')[0], email: googleDriveUserEmail } : null,
      connectGoogleDrive,
      disconnectGoogleDrive,
      backupToGoogleDrive,
      uploadDocumentToGoogleDrive,
      uploadDocumentToDrive,
      restoreFromGoogleDrive,
      isAiAssistantOpen,
      setIsAiAssistantOpen,
      isMasterAdminOpen,
      setIsMasterAdminOpen,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
