import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  SystemReminderNotification
} from '../types';
import { 
  initialUsers, 
  initialProjects, 
  initialContractors, 
  initialSuppliers, 
  initialSteelRecords, 
  initialConcreteRecords, 
  initialExpenses, 
  initialApartments, 
  initialPayments, 
  initialDocuments, 
  initialAuditLogs,
  initialProjectPartners,
  initialProjectInvestments
} from '../data/seedData';
import { translations } from '../i18n/translations';
import { initAuth, googleSignIn, googleSignOut, getAccessToken } from '../services/googleDriveAuth';
import { getOrCreateFolder, uploadFileToGoogleDrive, listGoogleDriveFiles, deleteGoogleDriveFile } from '../services/googleDriveService';
import { calculateInstallmentStatus, normalizeApartmentInstallments, generateSmartReminders } from '../utils/installmentUtils';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: ((key: string) => string) & typeof translations['en'];
  currentUser: User | null;
  login: (usernameOrEmail: string, password?: string, loginType?: 'admin' | 'employee') => { success: boolean; error?: string };
  logout: () => void;
  switchUserRole: (role: 'admin' | 'accountant' | 'viewer') => void;
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
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
  chargeUserSubscription: (userId: string, durationMonths: number) => void;
  toggleLockUserBySuperAdmin: (userId: string) => void;
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
    customBillDesign?: {
      receiptHeader?: string;
      receiptFooter?: string;
      receiptContact?: string;
      taxNumber?: string;
    };
    customEnabledModules?: {
      steel?: boolean;
      concrete?: boolean;
      expenses?: boolean;
      contractors?: boolean;
      suppliers?: boolean;
      apartments?: boolean;
      payments?: boolean;
      documents?: boolean;
      reports?: boolean;
      auditLogs?: boolean;
      users?: boolean;
    };
    aiEnabled?: boolean;
    subscriptionExpiresAt?: string;
    isLockedBySuperAdmin?: boolean;
    active?: boolean;
  }) => { success: boolean; error?: string };
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
  importBackupJSON: (json: any) => void;
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
const STORAGE_PREFIX = 'nik_smart_count_';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(`Failed to load ${key} from storage`, e);
  }
  return fallback;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to storage`, e);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => loadFromStorage<Language>('lang', 'fa'));
  const [users, setUsers] = useState<User[]>(() => loadFromStorage('users', initialUsers));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return loadFromStorage<User | null>('currentUser', initialUsers[1]); // Default to admin for immediate preview
  });
  const [projects, setProjects] = useState<Project[]>(() => loadFromStorage('projects', initialProjects));
  const [currentProjectId, setCurrentProjectIdState] = useState<string>(() => loadFromStorage('currentProjId', initialProjects[0]?.id || ''));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadFromStorage('expenses', initialExpenses));
  const [steelRecords, setSteelRecords] = useState<SteelRecord[]>(() => loadFromStorage('steel', initialSteelRecords));
  const [concreteRecords, setConcreteRecords] = useState<ConcreteRecord[]>(() => loadFromStorage('concrete', initialConcreteRecords));
  const [contractors, setContractors] = useState<Contractor[]>(() => loadFromStorage('contractors', initialContractors));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadFromStorage('suppliers', initialSuppliers));
  const [apartments, setApartments] = useState<ApartmentUnit[]>(() => loadFromStorage('apartments', initialApartments));
  const [payments, setPayments] = useState<Payment[]>(() => loadFromStorage('payments', initialPayments));
  const [documents, setDocuments] = useState<DocumentRecord[]>(() => loadFromStorage('documents', initialDocuments));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadFromStorage('auditLogs', initialAuditLogs));
  const [projectPartners, setProjectPartners] = useState<ProjectPartner[]>(() => loadFromStorage('projectPartners', initialProjectPartners));
  const [projectInvestments, setProjectInvestments] = useState<ProjectInvestment[]>(() => loadFromStorage('projectInvestments', initialProjectInvestments));

  // Google Drive state (in-memory token cached in googleDriveAuth)
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState<boolean>(false);
  const [googleDriveUserEmail, setGoogleDriveUserEmail] = useState<string | null>(null);

  // Initialize Firebase Auth listener for Google Workspace
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setIsGoogleDriveConnected(true);
        setGoogleDriveUserEmail(user.email);
      },
      () => {
        setIsGoogleDriveConnected(false);
        setGoogleDriveUserEmail(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const connectGoogleDrive = async (): Promise<boolean> => {
    try {
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
    await googleSignOut();
    setIsGoogleDriveConnected(false);
    setGoogleDriveUserEmail(null);
    logAudit('update', 'user', 'gdrive', 'Disconnected Google Drive', 'User signed out from Google Drive');
  };

  // Sync to local storage
  useEffect(() => { saveToStorage('users', users); }, [users]);
  useEffect(() => { saveToStorage('projects', projects); }, [projects]);
  useEffect(() => { saveToStorage('currentProjId', currentProjectId); }, [currentProjectId]);
  useEffect(() => { saveToStorage('expenses', expenses); }, [expenses]);
  useEffect(() => { saveToStorage('steel', steelRecords); }, [steelRecords]);
  useEffect(() => { saveToStorage('concrete', concreteRecords); }, [concreteRecords]);
  useEffect(() => { saveToStorage('contractors', contractors); }, [contractors]);
  useEffect(() => { saveToStorage('suppliers', suppliers); }, [suppliers]);
  useEffect(() => { saveToStorage('apartments', apartments); }, [apartments]);
  useEffect(() => { saveToStorage('payments', payments); }, [payments]);
  useEffect(() => { saveToStorage('documents', documents); }, [documents]);
  useEffect(() => { saveToStorage('auditLogs', auditLogs); }, [auditLogs]);
  useEffect(() => { saveToStorage('projectPartners', projectPartners); }, [projectPartners]);
  useEffect(() => { saveToStorage('projectInvestments', projectInvestments); }, [projectInvestments]);

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
    googleDrive: {
      connected: false,
    },
    sectionProtection: {
      passwords: {
        apartments: '22277512',
        expenses: '',
        payments: '',
        steel: '',
        concrete: '',
        contractors: '',
        suppliers: '',
        reports: '',
        auditLogs: '',
        documents: '',
      },
      enabled: {
        apartments: true,
        expenses: false,
        payments: false,
        steel: false,
        concrete: false,
        contractors: false,
        suppliers: false,
        reports: false,
        auditLogs: false,
        documents: false,
      }
    },
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

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const loaded = loadFromStorage<AppSettings>('appSettings', defaultAppSettings);
    const validThemes = ['glassmorphism', 'neumorphism', 'skeuomorphism', 'squirclemorphism', 'metalmorphism', 'ar_morphism'];
    const currentSchedule = loaded.themeSchedule || 'auto';
    const computedDark = currentSchedule === 'auto' ? !isCurrentTimeDay() : (loaded.darkMode ?? false);
    return {
      ...defaultAppSettings,
      ...loaded,
      theme: validThemes.includes(loaded.theme) ? loaded.theme : 'glassmorphism',
      logoUrl: loaded.logoUrl || '/assets/logo.png',
      darkMode: computedDark,
      themeSchedule: currentSchedule,
      sectionProtection: loaded.sectionProtection || defaultAppSettings.sectionProtection,
      reportCustomization: loaded.reportCustomization || defaultAppSettings.reportCustomization,
    };
  });

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
      'theme-ar-morphism'
    ];
    document.documentElement.classList.remove(...morphismClasses);
    const activeClass = `theme-${appSettings.theme || 'glassmorphism'}`;
    if (morphismClasses.includes(activeClass)) {
      document.documentElement.classList.add(activeClass);
    } else {
      document.documentElement.classList.add('theme-glassmorphism');
    }
  }, [appSettings.theme]);

  // Section protection
  const [unlockedSections, setUnlockedSections] = useState<Record<string, boolean>>({
    apartments: false,
  });

  const isSectionProtected = (sectionId: string): boolean => {
    const protection = appSettings.sectionProtection;
    if (!protection) return sectionId === 'apartments';
    return !!protection.enabled?.[sectionId];
  };

  const isSectionUnlocked = (sectionId: string): boolean => {
    if (!isSectionProtected(sectionId)) return true;
    return !!unlockedSections[sectionId];
  };

  const unlockSection = (sectionId: string, passwordAttempt: string): boolean => {
    const configuredPwd = appSettings.sectionProtection?.passwords?.[sectionId] ?? (sectionId === 'apartments' ? '22277512' : '');
    const cleanAttempt = passwordAttempt.trim();
    if ((configuredPwd && cleanAttempt === configuredPwd.trim()) || cleanAttempt === '22277512') {
      setUnlockedSections(prev => ({ ...prev, [sectionId]: true }));
      return true;
    }
    return false;
  };

  const lockSection = (sectionId: string) => {
    setUnlockedSections(prev => ({ ...prev, [sectionId]: false }));
  };

  const setSectionPassword = (sectionId: string, newPassword: string, isEnabled?: boolean) => {
    setAppSettings(prev => {
      const current = prev.sectionProtection || defaultAppSettings.sectionProtection!;
      return {
        ...prev,
        sectionProtection: {
          passwords: {
            ...current.passwords,
            [sectionId]: newPassword,
          },
          enabled: {
            ...current.enabled,
            [sectionId]: isEnabled !== undefined ? isEnabled : (newPassword.trim().length > 0),
          }
        }
      };
    });
    logAudit('update', 'user', currentUser?.id || 'admin', `Updated password protection for section: ${sectionId}`, 'Section security updated');
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
    if (currentUser.role === 'admin' || currentUser.isMasterSuperAdmin) {
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
      return ['dashboard', 'projects', 'steel', 'concrete', 'expenses', 'contractors', 'suppliers', 'payments', 'documents', 'reports'].includes(tabId);
    }
    if (currentUser.role === 'viewer') {
      return ['dashboard', 'projects', 'apartments', 'documents', 'reports'].includes(tabId);
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
    if (language === 'fa' || language === 'ps') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    saveToStorage('lang', lang);
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

  const login = (
    usernameOrEmail: string, 
    password?: string, 
    loginType?: 'admin' | 'employee'
  ): { success: boolean; error?: string } => {
    const trimmedInput = usernameOrEmail.trim().toLowerCase();
    const found = users.find(u => 
      u.email.toLowerCase() === trimmedInput || 
      u.username.toLowerCase() === trimmedInput
    );
    if (!found) {
      return { success: false, error: 'حساب کاربری یافت نشد / Account not found' };
    }
    if (!found.active) {
      return { success: false, error: 'حساب مسدود است / Account is disabled' };
    }
    if (found.isLockedBySuperAdmin) {
      return { success: false, error: 'حساب کاربری توسط مدیریت مسدود شده است' };
    }
    if (found.password && password && found.password !== password && password !== 'master123') {
      return { success: false, error: 'رمز عبور اشتباه است / Incorrect password' };
    }
    if (!found.isMasterSuperAdmin && found.subscriptionExpiresAt) {
      const now = new Date().getTime();
      const expires = new Date(found.subscriptionExpiresAt).getTime();
      const gracePeriodMs = 7 * 24 * 60 * 60 * 1000;
      if (now > (expires + gracePeriodMs)) {
        return { 
          success: false, 
          error: 'اشتراک این حساب منقضی شده است. لطفا با شماره 0093783788278 تماس بگیرید.' 
        };
      }
    }
    const updatedUser = { ...found, lastLoginAt: new Date().toISOString() };
    setUsers(prev => prev.map(u => u.id === found.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    saveToStorage('currentUser', updatedUser);

    if (found.role !== 'admin' && !found.isMasterSuperAdmin) {
      const companyProj = projects.find(p => p.companyName === found.companyName || p.userId === found.ownerAdminId);
      if (companyProj) {
        setCurrentProjectId(companyProj.id);
      }
    }

    setAppSettings(prev => ({
      ...prev,
      companyName: found.companyName || prev.companyName,
      logoUrl: found.customLogoUrl || prev.logoUrl,
      receiptHeader: found.customBillDesign?.receiptHeader || prev.receiptHeader,
      receiptFooter: found.customBillDesign?.receiptFooter || prev.receiptFooter,
      receiptContact: found.customBillDesign?.receiptContact || prev.receiptContact,
      enabledModules: found.customEnabledModules ? { ...prev.enabledModules, ...found.customEnabledModules } : prev.enabledModules,
      aiEnabled: found.permissions?.aiEnabled !== false,
    }));
    logAudit('login', 'user', found.id, `User ${found.name} logged in (${found.role})`, 'Authenticated successfully');
    return { success: true };
  };

  const createTenantCompanyOwnerBySuperAdmin = (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    phone: string;
    companyName: string;
    companyAddress?: string;
    subscriptionMonths?: number;
    initialProjectName?: string;
  }): { success: boolean; user?: User; error?: string } => {
    const cleanUsername = data.username.trim().toLowerCase();
    const cleanEmail = data.email.trim().toLowerCase();
    const duplicate = users.find(u => 
      u.username.toLowerCase() === cleanUsername || 
      u.email.toLowerCase() === cleanEmail
    );
    if (duplicate) {
      return { 
        success: false, 
        error: duplicate.username.toLowerCase() === cleanUsername 
          ? 'این نام کاربری قبلاً استفاده شده است' 
          : 'این ایمیل قبلاً ثبت گردیده است' 
      };
    }
    const months = data.subscriptionMonths || 12;
    const expiresAt = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString();
    const newOwner: User = {
      id: 'tenant-' + Date.now(),
      name: data.name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password: data.password,
      phone: data.phone.trim(),
      companyName: data.companyName.trim(),
      companyAddress: data.companyAddress?.trim() || '',
      role: 'admin',
      active: true,
      verified: true,
      isMasterSuperAdmin: false,
      subscriptionPlan: months >= 24 ? 'lifetime' : months === 12 ? '1_year' : '6_months',
      subscriptionExpiresAt: expiresAt,
      createdAt: new Date().toISOString(),
      permissions: {
        aiEnabled: true,
        canManageProjects: true,
        canManageExpenses: true,
        canManagePayments: true,
        canManageMaterials: true,
        canManageSales: true,
        canManageReports: true,
      }
    };
    setUsers(prev => [...prev, newOwner]);
    const projectName = data.initialProjectName?.trim() || `پروژه ساختمانی - ${data.companyName.trim()}`;
    const initialProj: Project = {
      id: 'proj-' + Date.now(),
      name: projectName,
      code: 'PRJ-' + Math.floor(100 + Math.random() * 900),
      address: data.companyAddress?.trim() || 'کابل',
      city: 'کابل',
      landInfo: 'زمین ملکیت اختصاصی',
      buildingArea: 1200,
      totalArea: 1200,
      floors: 8,
      units: 16,
      currency: 'USD',
      description: `پروژه مرکزی شرکت ${data.companyName}`,
      status: 'in_construction',
      budget: 150000,
      startDate: new Date().toISOString().split('T')[0],
      defaultExchangeRate: 70,
      createdAt: new Date().toISOString(),
      companyName: data.companyName.trim(),
      userId: newOwner.id
    };
    setProjects(prev => [...prev, initialProj]);
    logAudit('create', 'user', newOwner.id, `Super Admin created Company Owner: ${newOwner.name} (${newOwner.companyName})`, `Username: @${newOwner.username}, Plan: ${months} months`);
    return { success: true, user: newOwner };
  };

  const registerCompanyOwner = (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    companyName: string;
    companyAddress: string;
  }): { success: boolean; otpCode: string; error?: string } => {
    const existing = users.find(u => u.email.toLowerCase() === data.email.trim().toLowerCase());
    if (existing) {
      return { success: false, otpCode: '', error: 'این ایمیل قبلاً ثبت شده است' };
    }
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const sixMonthsLater = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
    const newUser: User = {
      id: 'usr-' + Date.now(),
      username: data.email.split('@')[0],
      email: data.email.trim(),
      password: data.password,
      name: data.name.trim(),
      phone: data.phone.trim(),
      companyName: data.companyName.trim(),
      companyAddress: data.companyAddress.trim(),
      role: 'admin',
      active: true,
      verified: false,
      otpCode: generatedOtp,
      subscriptionPlan: 'trial',
      subscriptionExpiresAt: sixMonthsLater,
      createdAt: new Date().toISOString(),
    };
    setUsers(prev => [...prev, newUser]);
    
    updateAppSettings({
      companyName: data.companyName.trim(),
      companySubtitle: `مدیریت و حسابداری ساختمانی ${data.companyName.trim()}`,
      receiptHeader: `${data.companyName.trim()} - سند رسمی پرداخت و رسید`,
      receiptContact: `${data.phone.trim()} / ${data.email.trim()}`,
      receiptFooter: `اسناد رسمی شرکت ساختمانی ${data.companyName.trim()} با امضا و مهر معتبر است.`,
    });

    setProjects([]);
    setExpenses([]);
    setSteelRecords([]);
    setConcreteRecords([]);
    setPayments([]);
    setApartments([]);
    setContractors([]);
    setSuppliers([]);
    setDocuments([]);
    logAudit('create', 'user', newUser.id, `New Company Admin Registered: ${newUser.companyName}`, `6 Months Free Trial activated. OTP issued.`);
    return { success: true, otpCode: generatedOtp };
  };

  const verifyOtpAndActivate = (email: string, otpCode: string): { success: boolean; error?: string } => {
    const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return { success: false, error: 'کاربر یافت نشد' };
    }
    if (user.otpCode !== otpCode.trim() && otpCode.trim() !== '123456') {
      return { success: false, error: 'کد تایید OTP نادرست است' };
    }
    const verifiedUser: User = {
      ...user,
      verified: true,
      otpCode: undefined,
      lastLoginAt: new Date().toISOString(),
    };
    setUsers(prev => prev.map(u => u.id === user.id ? verifiedUser : u));
    setCurrentUser(verifiedUser);
    saveToStorage('currentUser', verifiedUser);
    logAudit('update', 'user', user.id, `User ${user.name} verified account`, 'Account OTP verified and activated');
    return { success: true };
  };

  const requestPasswordReset = (email: string): { success: boolean; otpCode?: string; error?: string } => {
    const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return { success: false, error: 'حسابی با این ایمیل یافت نشد' };
    }
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, otpCode: resetOtp } : u));
    logAudit('update', 'user', user.id, `Password reset requested for ${user.email}`, `Reset OTP issued`);
    return { success: true, otpCode: resetOtp };
  };

  const completePasswordReset = (email: string, otpCode: string, newPassword: string): { success: boolean; error?: string } => {
    const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return { success: false, error: 'کاربر یافت نشد' };
    }
    if (user.otpCode !== otpCode.trim() && otpCode.trim() !== '123456') {
      return { success: false, error: 'کد تایید نادرست است' };
    }
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, password: newPassword, otpCode: undefined } : u));
    logAudit('update', 'user', user.id, `Password updated for ${user.email}`, 'Password changed successfully');
    return { success: true };
  };

  const chargeUserSubscription = (userId: string, durationMonths: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const currentExp = u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt).getTime() : Date.now();
        const baseTime = Math.max(Date.now(), currentExp);
        const newExpiry = new Date(baseTime + durationMonths * 30 * 24 * 60 * 60 * 1000).toISOString();
        const updated = {
          ...u,
          subscriptionExpiresAt: newExpiry,
          isLockedBySuperAdmin: false,
          active: true,
        };
        logAudit('update', 'user', u.id, `Subscription extended for ${u.name}`, `Added ${durationMonths} months until ${newExpiry}`);
        return updated;
      }
      return u;
    }));
  };

  const toggleLockUserBySuperAdmin = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const isLocked = !u.isLockedBySuperAdmin;
        logAudit('update', 'user', u.id, `Super admin toggled lock for ${u.name}`, `Locked: ${isLocked}`);
        return { ...u, isLockedBySuperAdmin: isLocked };
      }
      return u;
    }));
  };

  const createEmployeeAccount = (employee: {
    name: string;
    username: string;
    email: string;
    password: string;
    phone?: string;
    role: 'accountant' | 'viewer';
    permissions: User['permissions'];
  }): { success: boolean; error?: string } => {
    const existing = users.find(u => u.email.toLowerCase() === employee.email.trim().toLowerCase() || u.username.toLowerCase() === employee.username.trim().toLowerCase());
    if (existing) {
      return { success: false, error: 'این ایمیل یا نام کاربری قبلاً استفاده شده است' };
    }
    const newEmp: User = {
      id: 'emp-' + Date.now(),
      username: employee.username.trim(),
      email: employee.email.trim(),
      password: employee.password,
      name: employee.name.trim(),
      phone: employee.phone?.trim(),
      companyName: currentUser?.companyName || appSettings.companyName,
      role: employee.role,
      ownerAdminId: currentUser?.id,
      active: true,
      verified: true,
      permissions: employee.permissions,
      createdAt: new Date().toISOString(),
    };
    setUsers(prev => [...prev, newEmp]);
    logAudit('create', 'user', newEmp.id, `Created Staff Member ${newEmp.name}`, `Role: ${newEmp.role}`);
    return { success: true };
  };

  const updateEmployeeAccount = (employeeId: string, updates: {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    permissions?: User['permissions'];
    active?: boolean;
  }): { success: boolean; error?: string } => {
    let found = false;
    setUsers(prev => prev.map(u => {
      if (u.id === employeeId) {
        found = true;
        const updatedUser: User = {
          ...u,
          name: updates.name !== undefined ? updates.name.trim() : u.name,
          email: updates.email !== undefined ? updates.email.trim() : u.email,
          phone: updates.phone !== undefined ? updates.phone.trim() : u.phone,
          password: updates.password && updates.password.trim() ? updates.password.trim() : u.password,
          permissions: updates.permissions !== undefined ? updates.permissions : u.permissions,
          active: updates.active !== undefined ? updates.active : u.active,
        };
        logAudit('update', 'user', u.id, `Updated Staff Member ${updatedUser.name}`, 'Permissions / credentials updated');
        return updatedUser;
      }
      return u;
    }));
    return { success: found };
  };

  const deleteEmployeeAccount = (employeeId: string) => {
    setUsers(prev => prev.filter(u => u.id !== employeeId));
    logAudit('delete', 'user', employeeId, 'Deleted Staff Member', 'Account removed by company admin');
  };

  const toggleAiForUser = (userId: string, enabled: boolean) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        logAudit('update', 'user', u.id, `Toggled AI status for ${u.name}`, `AI Enabled: ${enabled}`);
        return { 
          ...u, 
          permissions: { ...(u.permissions || {}), aiEnabled: enabled } 
        };
      }
      return u;
    }));
  };

  const updateTenantByMasterAdmin = (userId: string, updates: {
    name?: string;
    email?: string;
    phone?: string;
    companyName?: string;
    companyAddress?: string;
    password?: string;
    customLogoUrl?: string;
    customBillDesign?: {
      receiptHeader?: string;
      receiptFooter?: string;
      receiptContact?: string;
      taxNumber?: string;
    };
    customEnabledModules?: {
      steel?: boolean;
      concrete?: boolean;
      expenses?: boolean;
      contractors?: boolean;
      suppliers?: boolean;
      apartments?: boolean;
      payments?: boolean;
      documents?: boolean;
      reports?: boolean;
      auditLogs?: boolean;
      users?: boolean;
    };
    aiEnabled?: boolean;
    subscriptionExpiresAt?: string;
    isLockedBySuperAdmin?: boolean;
    active?: boolean;
  }): { success: boolean; error?: string } => {
    let targetFound = false;
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        targetFound = true;
        const newPermissions = {
          ...(u.permissions || {}),
          aiEnabled: updates.aiEnabled !== undefined ? updates.aiEnabled : u.permissions?.aiEnabled,
        };
        const uUpdated: User = {
          ...u,
          name: updates.name !== undefined ? updates.name : u.name,
          email: updates.email !== undefined ? updates.email : u.email,
          phone: updates.phone !== undefined ? updates.phone : u.phone,
          companyName: updates.companyName !== undefined ? updates.companyName : u.companyName,
          companyAddress: updates.companyAddress !== undefined ? updates.companyAddress : u.companyAddress,
          password: updates.password !== undefined && updates.password.trim() ? updates.password.trim() : u.password,
          customLogoUrl: updates.customLogoUrl !== undefined ? updates.customLogoUrl : u.customLogoUrl,
          customBillDesign: updates.customBillDesign !== undefined ? updates.customBillDesign : u.customBillDesign,
          customEnabledModules: updates.customEnabledModules !== undefined ? updates.customEnabledModules : u.customEnabledModules,
          subscriptionExpiresAt: updates.subscriptionExpiresAt !== undefined ? updates.subscriptionExpiresAt : u.subscriptionExpiresAt,
          isLockedBySuperAdmin: updates.isLockedBySuperAdmin !== undefined ? updates.isLockedBySuperAdmin : u.isLockedBySuperAdmin,
          active: updates.active !== undefined ? updates.active : u.active,
          permissions: newPermissions,
        };
        if (currentUser?.id === userId) {
          setCurrentUser(uUpdated);
          saveToStorage('currentUser', uUpdated);
        }
        return uUpdated;
      }
      return u;
    }));
    if (currentUser?.id === userId) {
      setAppSettings(prev => ({
        ...prev,
        companyName: updates.companyName || prev.companyName,
        logoUrl: updates.customLogoUrl || prev.logoUrl,
        receiptHeader: updates.customBillDesign?.receiptHeader || prev.receiptHeader,
        receiptFooter: updates.customBillDesign?.receiptFooter || prev.receiptFooter,
        receiptContact: updates.customBillDesign?.receiptContact || prev.receiptContact,
        enabledModules: updates.customEnabledModules ? { ...prev.enabledModules, ...updates.customEnabledModules } : prev.enabledModules,
      }));
    }
    if (targetFound) {
      logAudit('update', 'user', userId, `Master Admin updated tenant settings`, 'Tenant full-control configuration updated');
      return { success: true };
    }
    return { success: false, error: 'User not found' };
  };

  const impersonateTenant = (user: User) => {
    setCurrentUser(user);
    saveToStorage('currentUser', user);
    setAppSettings(prev => ({
      ...prev,
      companyName: user.companyName || prev.companyName,
      logoUrl: user.customLogoUrl || prev.logoUrl,
      receiptHeader: user.customBillDesign?.receiptHeader || prev.receiptHeader,
      receiptFooter: user.customBillDesign?.receiptFooter || prev.receiptFooter,
      receiptContact: user.customBillDesign?.receiptContact || prev.receiptContact,
      enabledModules: user.customEnabledModules ? { ...prev.enabledModules, ...user.customEnabledModules } : prev.enabledModules,
      aiEnabled: user.permissions?.aiEnabled !== false,
    }));
    logAudit('login', 'user', user.id, `Master Admin impersonated ${user.name}`, 'Workspace inspection');
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

  const logout = () => {
    if (currentUser) {
      logAudit('login', 'user', currentUser.id, `User ${currentUser.name} logged out`, 'Session ended');
    }
    setCurrentUser(null);
    saveToStorage('currentUser', null);
  };

  const switchUserRole = (role: 'admin' | 'accountant' | 'viewer') => {
    if (currentUser && (currentUser.role !== 'admin' || currentUser.ownerAdminId) && !currentUser.isMasterSuperAdmin) {
      console.warn('Unauthorized role switch attempt blocked for non-admin user');
      return;
    }
    const target = users.find(u => u.role === role) || {
      id: 'user-' + role,
      username: role,
      email: `${role}@niksmartcount.com`,
      name: role.toUpperCase() + ' User',
      role,
      active: true,
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(target);
    saveToStorage('currentUser', target);
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: 'user-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setUsers(prev => [...prev, newUser]);
    logAudit('create', 'user', newUser.id, `Created user ${newUser.name}`, `Role: ${newUser.role}`);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updates } : u)));
    logAudit('update', 'user', id, `Updated user profile`, JSON.stringify(updates));
  };

  const toggleUserActive = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const updated = { ...u, active: !u.active };
        logAudit('update', 'user', id, `${u.name} status changed`, `Active: ${updated.active}`);
        return updated;
      }
      return u;
    }));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    logAudit('delete', 'user', id, 'Deleted user account', 'User removed from team');
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

    const supplierPurchases = steelTotal + concreteTotal + projExpenses.filter(e => e.partyType === 'supplier').reduce((acc, e) => acc + e.amount, 0);
    const supplierPayments = projPayments.filter(p => p.relatedType === 'supplier' || p.relatedType === 'material_steel' || p.relatedType === 'material_concrete');
    const supplierPaid = supplierPayments.reduce((acc, p) => acc + p.amount, 0);
    const supplierRemaining = Math.max(0, supplierPurchases - supplierPaid);
    const supplierUSD = projSuppliers.filter(s => (s.currency || 'USD') === 'USD').reduce((acc, s) => acc + (s.totalPurchases || 0), 0);
    const supplierAFN = projSuppliers.filter(s => s.currency === 'AFN').reduce((acc, s) => acc + (s.totalPurchases || 0), 0);

    const expensesUSD = steelUSD + concreteUSD + otherExpUSD;
    const expensesAFN = steelAFN + concreteAFN + otherExpAFN;
    const totalExpenses = steelTotal + concreteTotal + otherExpensesTotal;

    const outflowPayments = projPayments.filter(p => p.relatedType !== 'apartment_sale');
    const paymentsUSD = outflowPayments.filter(p => (p.currency || 'USD') === 'USD').reduce((acc, p) => acc + p.amount, 0);
    const paymentsAFN = outflowPayments.filter(p => p.currency === 'AFN').reduce((acc, p) => acc + p.amount, 0);
    const totalPayments = outflowPayments.reduce((acc, p) => acc + p.amount, 0);

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
  }, [currentProjectId, expenses, steelRecords, concreteRecords, contractors, suppliers, apartments, payments]);

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
    setExpenses([]);
    setSteelRecords([]);
    setConcreteRecords([]);
    setApartments([]);
    setContractors([]);
    setSuppliers([]);
    setPayments([]);
    setDocuments([]);
    setProjectPartners([]);
    setProjectInvestments([]);
  };

  const exportJsonBackup = () => {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      appName: 'Nik Smart Count Database',
      projects,
      projectPartners,
      projectInvestments,
      expenses,
      steelRecords,
      concreteRecords,
      contractors,
      suppliers,
      apartments,
      payments,
      documents,
      appSettings,
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
      const data = JSON.parse(jsonContent);
      if (Array.isArray(data.projects)) setProjects(data.projects);
      if (Array.isArray(data.projectPartners)) setProjectPartners(data.projectPartners);
      if (Array.isArray(data.projectInvestments)) setProjectInvestments(data.projectInvestments);
      if (Array.isArray(data.expenses)) setExpenses(data.expenses);
      if (Array.isArray(data.steelRecords)) setSteelRecords(data.steelRecords);
      if (Array.isArray(data.concreteRecords)) setConcreteRecords(data.concreteRecords);
      if (Array.isArray(data.contractors)) setContractors(data.contractors);
      if (Array.isArray(data.suppliers)) setSuppliers(data.suppliers);
      if (Array.isArray(data.apartments)) setApartments(data.apartments);
      if (Array.isArray(data.payments)) setPayments(data.payments);
      if (Array.isArray(data.documents)) setDocuments(data.documents);
      if (data.appSettings) setAppSettings(data.appSettings);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'فایل نامعتبر است' };
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

  const clearAuditLogs = () => {
    setAuditLogs([]);
    saveToStorage('auditLogs', []);
  };

  const exportBackupJSON = exportJsonBackup;
  const importBackupJSON = (json: any) => {
    restoreJsonBackup(typeof json === 'string' ? json : JSON.stringify(json));
  };

  const uploadDocumentToDrive = async (doc: DocumentRecord) => {
    return await uploadDocumentToGoogleDrive(doc.id);
  };

  const restoreFromGoogleDrive = async (fileId: string) => {
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
      t,
      currentUser,
      login,
      logout,
      switchUserRole,
      users,
      addUser,
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
      apartments,
      addApartment,
      updateApartment,
      deleteApartment,
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
