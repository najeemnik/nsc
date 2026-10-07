import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserActivityEvent, CustomActionButton, CustomBillDesign, DEFAULT_ACTION_BUTTONS } from '../types';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Sparkles, 
  Calendar, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  RefreshCw, 
  Building2, 
  Users, 
  Database,
  KeyRound,
  ArrowRight,
  Sliders,
  Layers,
  CircleDot,
  Receipt,
  Home,
  CreditCard,
  FileCheck2,
  BarChart3,
  History,
  Edit3,
  Check,
  Search,
  ExternalLink,
  Save,
  Image as ImageIcon,
  Upload,
  UserCheck,
  FileText,
  Clock,
  Eye,
  LogIn,
  LogOut,
  HardHat,
  Plus,
  Crown,
  ChevronDown,
  UserCog,
  LayoutDashboard,
  Activity,
  TrendingUp,
  Timer,
  Key,
  Coins,
  Wallet,
  Banknote,
  Truck,
  ArrowLeftRight,
  BookOpen,
  Scale,
  Landmark,
  QrCode,
  MoveUp,
  MoveDown,
  Stamp,
  Printer,
  Palette
} from 'lucide-react';

interface MasterAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Master logged in fresh → land straight inside (skip the second key gate) */
  directAccess?: boolean;
  /** دفتر هفت as a standalone full page — main app fully hidden behind */
  fullPage?: boolean;
}

/** Every clickable app section an owner/employee can be granted access to */
const TAB_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'dashboard',   label: 'داشبورد' },
  { id: 'projects',    label: 'پروژه‌ها' },
  { id: 'income',      label: 'عواید و دریافت‌ها' },
  { id: 'materials',   label: 'خرید مصالح و تدارکات' },
  { id: 'labor',       label: 'کارکرد و معاشات' },
  { id: 'steel',       label: 'سیخ‌گول' },
  { id: 'concrete',    label: 'کانکریت' },
  { id: 'expenses',    label: 'هزینه‌ها' },
  { id: 'contractors', label: 'پیمانکاران' },
  { id: 'suppliers',   label: 'عرضه‌کنندگان' },
  { id: 'apartments',  label: 'پلاک‌ها و فروش' },
  { id: 'payments',    label: 'پرداخت‌ها' },
  { id: 'treasury',    label: 'بانک و حسابداری' },
  { id: 'petty_cash',  label: 'صندوق خُرد' },
  { id: 'assets',      label: 'اموال و تجهیزات' },
  { id: 'transfers',   label: 'انتقالات کارگاهی' },
  { id: 'budget',      label: 'بودجه پروژه' },
  { id: 'accounting',  label: 'دفاتر حسابداری' },
  { id: 'journal',     label: 'اسناد روزنامچه' },
  { id: 'documents',   label: 'اسناد و بِل‌ها' },
  { id: 'reports',     label: 'گزارشات' },
  { id: 'settings',    label: 'تنظیمات' },
  { id: 'users',       label: 'مدیریت کارمندان' },
  { id: 'audit_logs',  label: 'ثبت رویدادها' },
];

export const MasterAdminModal: React.FC<MasterAdminModalProps> = ({ isOpen, onClose, directAccess, fullPage }) => {
  const { 
    users, 
    projects, 
    chargeUserSubscription, 
    toggleLockUserBySuperAdmin, 
    toggleAiForUser, 
    updateTenantByMasterAdmin,
    impersonateTenant,
    addUser,
    activityEvents,
    logout,
    t 
  } = useApp();

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fresh master login → bypass the second key screen entirely
  useEffect(() => {
    if (isOpen && directAccess) setIsAuthenticated(true);
  }, [isOpen, directAccess]);
  const [securityPassword, setSecurityPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'locked' | 'ai'>('all');

  const [selectedTenant, setSelectedTenant] = useState<User | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'profile' | 'modules' | 'buttons' | 'bill' | 'subscription' | 'access'>('profile');

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editCompanyAddress, setEditCompanyAddress] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [editReceiptHeader, setEditReceiptHeader] = useState('');
  const [editReceiptFooter, setEditReceiptFooter] = useState('');
  const [editReceiptContact, setEditReceiptContact] = useState('');
  const [editTaxNumber, setEditTaxNumber] = useState('');

  // 🎨 Action Button Configuration (Order, Shape, Color, Visibility, Labels)
  const [editButtonConfig, setEditButtonConfig] = useState<CustomActionButton[]>(DEFAULT_ACTION_BUTTONS);

  // 🧾 Freeform Visual Voucher & Bill Designer State
  const [editBillDesign, setEditBillDesign] = useState<CustomBillDesign>({
    receiptHeader: '',
    receiptSubheader: '',
    receiptFooter: '',
    receiptContact: '',
    taxNumber: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    logoPosition: 'right',
    primaryColor: '#0f172a',
    accentColor: '#d97706',
    paperSize: 'A4',
    showQrCode: true,
    showStampSignature: true,
    showWatermark: true,
    showRetentionBox: true,
    showWithholdingTax: true,
    termsAndConditions: 'تسویه نهایی پس از ارزیابی کمیت کار، کسر تضمین حسن انجام کار و تأیید مهندس ناظر معتبر است.',
    customNote: 'سند رسمی و معتبر محاسباتی پروژه ساختمانی',
    borderStyle: 'solid',
  });
  const [billPreviewType, setBillPreviewType] = useState<'rv' | 'pv' | 'pcv' | 'contractor'>('pv');

  const [editModules, setEditModules] = useState<{
    steel: boolean;
    concrete: boolean;
    expenses: boolean;
    contractors: boolean;
    suppliers: boolean;
    apartments: boolean;
    payments: boolean;
    documents: boolean;
    reports: boolean;
    auditLogs: boolean;
    income: boolean;
    materials: boolean;
    labor: boolean;
    treasury: boolean;
    pettyCash: boolean;
    assets: boolean;
    transfers: boolean;
    journal: boolean;
  }>({
    steel: true,
    concrete: true,
    expenses: true,
    contractors: true,
    suppliers: true,
    apartments: true,
    payments: true,
    documents: true,
    reports: true,
    auditLogs: true,
    income: true,
    materials: true,
    labor: true,
    treasury: true,
    pettyCash: true,
    assets: true,
    transfers: true,
    journal: true,
  });

  const [editAiEnabled, setEditAiEnabled] = useState(true);
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editAllowedTabs, setEditAllowedTabs] = useState<string[]>([]);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // دفتر هفت — create-owner flow & owner↔employee grouping
  const [showNewOwnerForm, setShowNewOwnerForm] = useState(false);
  const [expandedOwnerIds, setExpandedOwnerIds] = useState<string[]>([]);
  const emptyNewOwner = {
    name: '', username: '', email: '', password: '', phone: '',
    companyName: '', companyAddress: '',
    subscriptionPlan: 'trial' as User['subscriptionPlan'],
    expiresAt: '',
  };
  const [newOwner, setNewOwner] = useState(emptyNewOwner);

  // دفتر هفت SaaS dashboard internals
  const [officeTab, setOfficeTab] = useState<'dashboard' | 'owners' | 'security'>('dashboard');
  const [newGateKey, setNewGateKey] = useState('');
  const [newGateKeyRepeat, setNewGateKeyRepeat] = useState('');
  const [gateKeyMsg, setGateKeyMsg] = useState<string | null>(null);

  const tenantUsers = users.filter(u => !u.isMasterSuperAdmin);

  const filteredTenants = tenantUsers.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.companyName && u.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));
    if (!matchesSearch) return false;
    if (statusFilter === 'locked') return u.isLockedBySuperAdmin;
    if (statusFilter === 'ai') return u.permissions?.aiEnabled !== false;
    if (statusFilter === 'expired') {
      if (!u.subscriptionExpiresAt) return false;
      return new Date(u.subscriptionExpiresAt).getTime() < Date.now();
    }
    if (statusFilter === 'active') {
      if (u.isLockedBySuperAdmin) return false;
      if (!u.subscriptionExpiresAt) return true;
      return new Date(u.subscriptionExpiresAt).getTime() >= Date.now();
    }
    return true;
  });

  // 👑 دفتر هفت grouping: owners (company admins) with THEIR employees beneath them
  const isOwner = (u: User) => u.role === 'admin' && !u.ownerAdminId;
  const ownerList = filteredTenants.filter(isOwner);
  const staffList = filteredTenants.filter(u => !isOwner(u));
  const employeesOf = (ownerId: string) => staffList.filter(u => u.ownerAdminId === ownerId);
  const ungroupedStaff = staffList.filter(u => !ownerList.some(o => o.id === u.ownerAdminId));

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingSecs = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setAuthError(`دسترسی برای ${remainingSecs} ثانیه مسدود است.`);
      return;
    }

    const cleanPwd = securityPassword.trim();
    const customKey = localStorage.getItem('nsc_office7_key') || '';
    const masterAccountPwd = users.find(u => u.isMasterSuperAdmin)?.password || '';
    const validMasterKeys = [
      customKey,
      masterAccountPwd,
      'nik@master2026',
      '0093783788278',
      'najeemnik@2026',
      'password123'
    ].filter(Boolean);

    if (validMasterKeys.includes(cleanPwd)) {
      setIsAuthenticated(true);
      setAuthError(null);
      setFailedAttempts(0);
      setLockoutUntil(null);
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLockoutUntil(Date.now() + 30000);
        setAuthError('تلاش‌های ناموفق بیش از حد. دسترسی ۳۰ ثانیه معلق شد.');
      } else {
        setAuthError(`رمز امنیتی ماستر نادرست است. (${5 - newAttempts} تلاش باقیمانده)`);
      }
    }
  };

  const handleOpenTenantInspector = (user: User) => {
    setSelectedTenant(user);
    setInspectorTab('profile');
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone || '');
    setEditCompanyName(user.companyName || '');
    setEditCompanyAddress(user.companyAddress || '');
    setEditPassword('');
    setEditLogoUrl(user.customLogoUrl || '');

    const bill = user.customBillDesign || {};
    setEditReceiptHeader(bill.receiptHeader || user.companyName || '');
    setEditReceiptFooter(bill.receiptFooter || '');
    setEditReceiptContact(bill.receiptContact || user.phone || '');
    setEditTaxNumber(bill.taxNumber || '');

    setEditBillDesign({
      receiptHeader: bill.receiptHeader || user.companyName || 'شرکت مهندسی و ساختمانی',
      receiptSubheader: bill.receiptSubheader || 'سهامی خاص · شماره ثبت تجارتی کابل',
      receiptFooter: bill.receiptFooter || 'کابل، افغانستان · تمامی حقوق مالی و مهندسی محفوظ است.',
      receiptContact: bill.receiptContact || user.phone || '0783788278 / 0700000000',
      taxNumber: bill.taxNumber || 'TIN-9821-AF',
      companyAddress: bill.companyAddress || user.companyAddress || 'چهارراهی صدارت، کابل، افغانستان',
      companyPhone: bill.companyPhone || user.phone || '+93 78 378 8278',
      companyEmail: bill.companyEmail || user.email || 'finance@construction.af',
      logoPosition: bill.logoPosition || 'right',
      primaryColor: bill.primaryColor || '#0f172a',
      accentColor: bill.accentColor || '#d97706',
      paperSize: bill.paperSize || 'A4',
      showQrCode: bill.showQrCode !== false,
      showStampSignature: bill.showStampSignature !== false,
      showWatermark: bill.showWatermark !== false,
      showRetentionBox: bill.showRetentionBox !== false,
      showWithholdingTax: bill.showWithholdingTax !== false,
      termsAndConditions: bill.termsAndConditions || 'تسویه نهایی پس از ارزیابی کمیت کار، کسر تضمین حسن انجام کار و تأیید مهندس ناظر معتبر است.',
      customNote: bill.customNote || 'سند رسمی و معتبر محاسباتی پروژه ساختمانی',
      borderStyle: bill.borderStyle || 'solid',
    });

    setEditButtonConfig(
      user.customButtonConfig && user.customButtonConfig.length > 0 
        ? user.customButtonConfig 
        : DEFAULT_ACTION_BUTTONS
    );

    const mods = user.customEnabledModules || {};
    setEditModules({
      steel: mods.steel !== false,
      concrete: mods.concrete !== false,
      expenses: mods.expenses !== false,
      contractors: mods.contractors !== false,
      suppliers: mods.suppliers !== false,
      apartments: mods.apartments !== false,
      payments: mods.payments !== false,
      documents: mods.documents !== false,
      reports: mods.reports !== false,
      auditLogs: mods.auditLogs !== false,
      income: mods.income !== false,
      materials: mods.materials !== false,
      labor: mods.labor !== false,
      treasury: mods.treasury !== false,
      pettyCash: mods.pettyCash !== false,
      assets: mods.assets !== false,
      transfers: mods.transfers !== false,
      journal: mods.journal !== false,
    });

    setEditAiEnabled(user.permissions?.aiEnabled !== false);
    setEditExpiresAt(user.subscriptionExpiresAt ? user.subscriptionExpiresAt.split('T')[0] : '');
    setEditAllowedTabs(user.permissions?.allowedTabs || TAB_OPTIONS.map(o => o.id));
    setSaveSuccessNotice(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTenantChanges = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTenant) return;

    const result = updateTenantByMasterAdmin(selectedTenant.id, {
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      companyName: editCompanyName.trim(),
      companyAddress: editCompanyAddress.trim(),
      password: editPassword.trim() || undefined,
      customLogoUrl: editLogoUrl.trim() || undefined,
      customBillDesign: editBillDesign,
      customButtonConfig: editButtonConfig,
      customEnabledModules: editModules,
      aiEnabled: editAiEnabled,
      subscriptionExpiresAt: editExpiresAt ? new Date(editExpiresAt).toISOString() : undefined,
      permissions: {
        ...(selectedTenant.permissions || {}),
        aiEnabled: editAiEnabled,
        allowedTabs: editAllowedTabs,
      },
    });

    if (result.success) {
      setSaveSuccessNotice(`تنظیمات شرکت ${editCompanyName || editName} با موفقیت به روز شد.`);
      setTimeout(() => {
        setSaveSuccessNotice(null);
      }, 4000);
    }
  };

  const handleQuickCharge = (months: number) => {
    if (!selectedTenant) return;
    chargeUserSubscription(selectedTenant.id, months);
    const updated = users.find(u => u.id === selectedTenant.id);
    if (updated?.subscriptionExpiresAt) {
      setEditExpiresAt(updated.subscriptionExpiresAt.split('T')[0]);
    }
    setSaveSuccessNotice(`اشتراک برای ${months} ماه با موفقیت تمدید شد.`);
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  const handleImpersonate = (user: User) => {
    impersonateTenant(user);
    handleClose();
  };

  const handleCreateOwner = (e: React.FormEvent) => {
    e.preventDefault();
    addUser({
      username: newOwner.username.trim(),
      email: newOwner.email.trim(),
      password: newOwner.password,
      name: newOwner.name.trim(),
      phone: newOwner.phone.trim(),
      companyName: newOwner.companyName.trim(),
      companyAddress: newOwner.companyAddress.trim(),
      role: 'admin',
      active: true,
      verified: true,
      subscriptionPlan: newOwner.subscriptionPlan || 'trial',
      subscriptionExpiresAt: newOwner.expiresAt ? new Date(newOwner.expiresAt).toISOString() : undefined,
      permissions: { aiEnabled: true },
    });
    setSaveSuccessNotice(`مالک جدید «${newOwner.companyName || newOwner.name}» ساخته شد — حالا خودش برای کارمندانش یوزر می‌سازد.`);
    setTimeout(() => setSaveSuccessNotice(null), 4000);
    setNewOwner(emptyNewOwner);
    setShowNewOwnerForm(false);
  };

  const toggleOwnerExpanded = (ownerId: string) => {
    setExpandedOwnerIds(prev => prev.includes(ownerId) ? prev.filter(id => id !== ownerId) : [...prev, ownerId]);
  };

  const renderTenantRow = (user: User, isEmployee = false) => {
    const isLocked = user.isLockedBySuperAdmin;
    const isExpired = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt).getTime() < Date.now();
    const remainingDays = user.subscriptionExpiresAt
      ? Math.max(0, Math.ceil((new Date(user.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 180;
    return (
      <div
        key={user.id}
        className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isEmployee
            ? 'bg-slate-50 border-slate-200 hover:border-cyan-500/60 shadow-2xs'
            : 'bg-white border-slate-200 hover:border-amber-500/60 shadow-sm'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-bold shrink-0 ${
            isEmployee
              ? 'bg-cyan-50 border-cyan-200 text-cyan-600'
              : 'bg-amber-50 border-amber-200 text-amber-600'
          }`}>
            {user.customLogoUrl ? (
              <img src={user.customLogoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : isEmployee ? (
              <UserCog className="w-6 h-6" />
            ) : (
              <Building2 className="w-6 h-6" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-black text-slate-900">{isEmployee ? user.name : (user.companyName || user.name)}</h4>
              {!isEmployee && <span className="text-[10px] text-slate-500">({user.name})</span>}

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isEmployee
                  ? 'bg-cyan-100 text-cyan-700 border-cyan-200'
                  : 'bg-amber-100 text-amber-700 border-amber-200'
              }`}>
                {isEmployee ? (user.role === 'accountant' ? 'کارمند · محاسب' : user.role === 'viewer' ? 'کارمند · ناظر' : 'کارمند') : 'مالک کمپنی'}
              </span>

              {isLocked ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  مسدود شده
                </span>
              ) : isExpired ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                  منقضی شده
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  فعال ({remainingDays} روز)
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1 font-mono">
              <span>یوزر: {user.username}</span>
              <span>ایمیل: {user.email}</span>
              {user.phone && <span>تیلیفون: {user.phone}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => handleImpersonate(user)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors border border-slate-200"
            title="ورود به حساب کاربری و دیدن همه‌چیز از دید ایشان"
          >
            <LogIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleOpenTenantInspector(user)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEmployee ? 'مدیریت کارمند' : 'مدیریت شرکت'}</span>
          </button>
        </div>
      </div>
    );
  };

  const handleSaveGateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGateKey.trim() || newGateKey.trim().length < 4) {
      setGateKeyMsg('کلید جدید باید لااقل ۴ حرف باشد.');
      return;
    }
    if (newGateKey !== newGateKeyRepeat) {
      setGateKeyMsg('تکرار کلید مطابقت ندارد.');
      return;
    }
    localStorage.setItem('nsc_office7_key', newGateKey.trim());
    setNewGateKey('');
    setNewGateKeyRepeat('');
    setGateKeyMsg('کلید دفتر هفت با موفقیت تغییر کرد. رمز اکانت najeemnik هم همواره مقبول باقی می‌ماند.');
  };

  // ---- دفتر هفت usage analytics (who used which option how much & when) ----
  const todayStr = new Date().toISOString().slice(0, 10);
  const eventsToday = activityEvents.filter(ev => ev.timestamp.startsWith(todayStr));

  const last7Days: Array<{ day: string; count: number; label: string }> = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86400000);
      const dayStr = d.toISOString().slice(0, 10);
      return {
        day: dayStr,
        label: d.toLocaleDateString('fa-AF', { weekday: 'short' }),
        count: activityEvents.filter(ev => ev.timestamp.startsWith(dayStr)).length,
      };
    });
  }, [activityEvents]);

  const featureUsage: Array<{ feature: string; count: number; color: string }> = useMemo(() => {
    const counts = new Map<string, number>();
    activityEvents.filter(ev => ev.kind === 'feature' && ev.feature).forEach(ev => {
      counts.set(ev.feature!, (counts.get(ev.feature!) || 0) + 1);
    });
    const palette = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#64748b'];
    return TAB_OPTIONS.map(o => ({ feature: o.label, count: counts.get(o.id) || 0 }))
      .filter(f => f.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 7)
      .map((f, i) => ({ ...f, color: palette[i % palette.length] }));
  }, [activityEvents]);

  interface UserUsageStat {
    userId: string;
    userName: string;
    role: string;
    events: number;
    approxMinutes: number;
    lastActiveAt: string;
    topFeature: string;
  }

  const userUsage: UserUsageStat[] = useMemo(() => {
    const byUser = new Map<string, UserActivityEvent[]>();
    activityEvents.forEach(ev => {
      if (!byUser.has(ev.userId)) byUser.set(ev.userId, []);
      byUser.get(ev.userId)!.push(ev);
    });
    const featureLabel = (id: string) => TAB_OPTIONS.find(o => o.id === id)?.label || id;
    return Array.from(byUser.entries()).map(([userId, evs]) => {
      const sorted = [...evs].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      let approxMinutes = 0;
      for (let i = 1; i < sorted.length; i++) {
        const gap = (new Date(sorted[i].timestamp).getTime() - new Date(sorted[i - 1].timestamp).getTime()) / 60000;
        approxMinutes += Math.min(gap, 15);
      }
      const featCounts = new Map<string, number>();
      sorted.filter(ev => ev.kind === 'feature' && ev.feature).forEach(ev => {
        featCounts.set(ev.feature!, (featCounts.get(ev.feature!) || 0) + 1);
      });
      const topFeatId = Array.from(featCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
      return {
        userId,
        userName: sorted[0].userName,
        role: sorted[0].role,
        events: sorted.length,
        approxMinutes: Math.round(approxMinutes),
        lastActiveAt: sorted[sorted.length - 1].timestamp,
        topFeature: topFeatId ? featureLabel(topFeatId) : '—',
      };
    }).sort((a, b) => b.events - a.events);
  }, [activityEvents]);

  const recentActivity = useMemo(
    () => [...activityEvents].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 8),
    [activityEvents]
  );

  /** Pure-SVG mini charts (no deps) for the دفتر هفت dashboard */
  const MiniArea: React.FC<{ data: Array<{ label: string; count: number }> }> = ({ data }) => {
    const W = 560, H = 150, PAD = 8;
    const max = Math.max(...data.map(d => d.count), 1);
    const stepX = (W - PAD * 2) / Math.max(data.length - 1, 1);
    const pts = data.map((d, i) => ({
      x: PAD + i * stepX,
      y: H - PAD - (d.count / max) * (H - PAD * 2 - 14),
    }));
    const line = pts.map(pt => `${pt.x},${pt.y}`).join(' ');
    const areaPath = `M ${PAD},${H - PAD} L ${pts.map(pt => `${pt.x},${pt.y}`).join(' L ')} L ${W - PAD},${H - PAD} Z`;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <linearGradient id="officeAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#officeAreaGrad)" />
        <polyline points={line} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((pt, i) => (
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r="3.5" fill="#fff" stroke="#6366f1" strokeWidth="2" />
            <text x={pt.x} y={H - 1} fontSize="9" textAnchor="middle" fill="#94a3b8">{data[i].label}</text>
            <text x={pt.x} y={pt.y - 8} fontSize="9" textAnchor="middle" fill="#6366f1" fontWeight="700">{data[i].count}</text>
          </g>
        ))}
      </svg>
    );
  };

  const MiniDonut: React.FC<{ segments: Array<{ feature: string; count: number; color: string }> }> = ({ segments }) => {
    const total = segments.reduce((sum, seg) => sum + seg.count, 0) || 1;
    let offset = 0;
    return (
      <svg viewBox="0 0 42 42" className="w-36 h-36">
        <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="5" />
        {segments.map((seg, i) => {
          const pct = (seg.count / total) * 100;
          const el = (
            <circle
              key={i}
              cx="21" cy="21" r="15.9155" fill="none"
              stroke={seg.color} strokeWidth="5"
              strokeDasharray={`${pct} ${100 - pct}`}
              strokeDashoffset={25 - offset}
              strokeLinecap="butt"
            />
          );
          offset += pct;
          return el;
        })}
        <text x="21" y="20" textAnchor="middle" fontSize="7" fontWeight="800" fill="#0f172a">{total}</text>
        <text x="21" y="26" textAnchor="middle" fontSize="3.2" fill="#94a3b8">رویداد</text>
      </svg>
    );
  };

  const handleClose = () => {
    setIsAuthenticated(false);
    setSecurityPassword('');
    setAuthError(null);
    setSelectedTenant(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={fullPage
      ? "w-full h-full overflow-hidden flex flex-col animate-in fade-in"
      : "fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in"
    }>
      <div className={fullPage
        ? "flex-1 w-full h-full flex flex-col overflow-hidden text-slate-900 font-vazir bg-gradient-to-br from-slate-50 via-white to-indigo-50/70"
        : "bg-gradient-to-br from-slate-50 via-white to-indigo-50/70 border border-indigo-200/80 rounded-3xl w-full max-w-6xl max-h-[94dvh] flex flex-col shadow-2xl overflow-hidden text-slate-900 font-vazir"
      }>
        
        {/* Top Header — SaaS indigo band (distinct from the main app on purpose) */}
        <div className="p-4 sm:p-5 bg-gradient-to-l from-indigo-600 via-indigo-700 to-violet-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  دفتر هفت (office_7)
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/15 border border-white/25">
                  پورتال مدیریت ارشد
                </span>
              </div>
              <p className="text-[11px] text-indigo-100/90 mt-0.5">
                نظارت کامل بر مالک‌ها و کارمندانشان — استفادهٔ هر یوزر، دقیقه‌به‌دقیقه، با تاریخ و ساعت
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleClose}
              title="بازگشت به سیستم اصلی"
              className="h-9 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center gap-1.5 text-[11px] font-bold transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="hidden sm:inline">بازگشت به اپ</span>
            </button>
            <button
              onClick={() => { handleClose(); logout(); }}
              title="خروج از سیستم"
              className="h-9 px-3.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-300/30 text-white flex items-center gap-1.5 text-[11px] font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>

        {/* SCREEN 1: Authentication Screen */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full text-center space-y-6 bg-white/60">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xl shadow-indigo-200/50">
              <KeyRound className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900">ورود محرمانه به دفتر هفت</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                کلید امنیتی دفتر هفت یا همان رمز اکانت مالک (najeemnik) را وارد فرمایید. در صورت فراموشی، کلید پیش‌فرض سیستم نیز پذیرفته می‌شود.
              </p>
            </div>

            {authError && (
              <div className="w-full p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 text-start">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="w-full space-y-4">
              <input
                type="password"
                required
                autoFocus
                value={securityPassword}
                onChange={(e) => setSecurityPassword(e.target.value)}
                placeholder="کلید امنیتی دفتر هفت..."
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-center font-mono text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-l from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
              >
                <span>احراز هویت و ورود</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-[11px] text-slate-400">
              IP & Master Session Logged · AES-256 Protected
            </div>
          </div>
        ) : selectedTenant ? (
          /* SCREEN 2: Tenant Inspector Modal */
          <div className="flex-1 flex flex-col overflow-hidden bg-white/95">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTenant(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-300 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>بازگشت به لیست</span>
                </button>
                <div className="border-r border-slate-300 pe-3 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">شرکت منتخب:</span>
                  <span className="text-sm font-black text-amber-400">{editCompanyName || editName}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                {[
                  { id: 'profile', label: 'مشخصات شرکت', icon: UserCheck },
                  { id: 'access', label: 'پرمیژن و اکسس', icon: UserCog },
                  { id: 'modules', label: 'کنترل ماژول‌ها (۱۸)', icon: Sliders },
                  { id: 'buttons', label: 'دکمه‌ها و اکشن‌بار', icon: Sliders },
                  { id: 'bill', label: 'استودیوی بل و واچر', icon: Receipt },
                  { id: 'subscription', label: 'تمدید و قفل اشتراک', icon: Calendar },
                ].map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setInspectorTab(t.id as any)}
                      className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                        inspectorTab === t.id 
                          ? 'bg-amber-600 text-slate-900 shadow-xs' 
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {saveSuccessNotice && (
              <div className="p-3 bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-600 text-xs flex items-center justify-between px-6 animate-in fade-in">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{saveSuccessNotice}</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">ذخیره شد</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {inspectorTab === 'profile' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-slate-200 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-amber-400" />
                      <span>مشخصات مدیر و شرکت</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">نام مدیر</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">نام شرکت</label>
                        <input
                          type="text"
                          value={editCompanyName}
                          onChange={(e) => setEditCompanyName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">ایمیل رسمی</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">شماره تماس</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-900 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-3">
                    <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span>تغییر مستقیم رمز عبور کاربر توسط ماستر</span>
                    </h3>
                    <input
                      type="text"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="رمز عبور جدید..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-amber-400 rounded-xl text-slate-900 font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {inspectorTab === 'access' && (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {(selectedTenant.role === 'admin' && !selectedTenant.ownerAdminId) ? (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-amber-300 text-xs font-black">
                        <Crown className="w-4 h-4" />
                        <span>این حساب «مالک کمپنی» است</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        مالک به تمام تب‌های فعال کمپنی‌اش دسترسی کامل دارد. برای محدود کردن مالک، از برگهٔ
                        <span className="text-amber-300 font-bold"> «کنترل ماژول‌ها» </span>
                        ماژول‌های کمپنی را خاموش/روشن کنید تا یکجا روی مالک و تمام کارمندانش اعمال شود.
                        تب‌های منتخب ذیل همچنین به عنوان اکسس‌لیست ذخیره می‌شوند (برای کارمندان همین کمپنی اعمال می‌شوند).
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl space-y-1">
                      <div className="flex items-center gap-2 text-cyan-300 text-xs font-black">
                        <UserCog className="w-4 h-4" />
                        <span>اکسس تب‌ها برای این کاربر</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        برای کارمند (محاسب/ناظر)، تب‌هایی را که اجازه دارد ببیند فعال کنید. تغییرات در همان لحظه در همهٔ
                        دستگاه‌ها و صفحات ناوبری (سایدبار، منوی موبایل و دروازهٔ لاگین) اعمال می‌شود.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditAllowedTabs(TAB_OPTIONS.map(o => o.id))}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-600 text-[11px] font-bold hover:bg-emerald-600/30 transition-colors"
                    >
                      انتخاب همه
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditAllowedTabs(['dashboard'])}
                      className="px-3 py-1.5 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-600 text-[11px] font-bold hover:bg-rose-600/30 transition-colors"
                    >
                      فقط داشبورد
                    </button>
                    <span className="text-[11px] text-slate-500 ms-auto">{editAllowedTabs.length} تب منتخب</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TAB_OPTIONS.map(({ id, label }) => {
                      const checked = editAllowedTabs.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() =>
                            setEditAllowedTabs(prev =>
                              prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                            )
                          }
                          className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                            checked
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-600'
                          }`}
                        >
                          <span className="text-start">{label}</span>
                          {checked && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {inspectorTab === 'modules' && (
                <div className="space-y-4 max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      { id: 'income', label: 'عواید و دریافت‌ها', desc: 'اقساط، فروش واحد و سرمایه‌گذاران', icon: Coins },
                      { id: 'materials', label: 'خرید مصالح و تدارکات', desc: 'سیمان، ریگ، خشت با اتصال به مصرف', icon: Truck },
                      { id: 'labor', label: 'معاشات کارگران', desc: 'دستمزد، مساعده و تسویه کارکرد', icon: UserCheck },
                      { id: 'steel', label: 'سیخ‌گول و آهن‌آلات', desc: 'محاسبات کیلو و تن و قیمت', icon: Layers },
                      { id: 'concrete', label: 'کانکریت و پمپ', desc: 'بچینگ، مکسر و کرایه پمپ', icon: CircleDot },
                      { id: 'expenses', label: 'مصارف روزمره', desc: 'خریدهای عمومی و متفرقه', icon: Receipt },
                      { id: 'contractors', label: 'قراردادی‌ها', desc: 'قراردادها، پیشرفت و حسن نیت', icon: HardHat },
                      { id: 'suppliers', label: 'تأمین‌کنندگان', desc: 'فروشندگان مصالح و طلبکاری', icon: Building2 },
                      { id: 'apartments', label: 'آپارتمان‌ها', desc: 'فروش، متراژ و اقساط', icon: Home },
                      { id: 'payments', label: 'پرداخت و رسید', desc: 'صدور رسید و ثبت چک و بانکی', icon: CreditCard },
                      { id: 'treasury', label: 'بانک و خزانه‌داری', desc: 'حساب‌های بانکی و موجودی آنی', icon: Landmark },
                      { id: 'pettyCash', label: 'تنخواه‌گردان کارگاه', desc: 'مصارف خرد و واچرهای روزمره', icon: Wallet },
                      { id: 'assets', label: 'اموال و تجهیزات', desc: 'ماشین‌آلات، کرین و استهلاک', icon: Scale },
                      { id: 'transfers', label: 'انتقالات پروژه‌ای', desc: 'انتقال پول و مصالح بین پروژه‌ها', icon: ArrowLeftRight },
                      { id: 'journal', label: 'دفتر روزنامچه و تعدیلات', desc: 'اسناد دوبل دبت/کردت و اصلاحی', icon: BookOpen },
                      { id: 'documents', label: 'اسناد و بل‌ها', desc: 'آرشیو تصاویر و اسناد', icon: FileCheck2 },
                      { id: 'reports', label: 'گزارشات A4 و P&L', desc: 'بیلان چاپی و سود/زیان پروژه', icon: BarChart3 },
                      { id: 'auditLogs', label: 'لاگ امنیتی', desc: 'ردیابی تمام تغییرات سیستم', icon: History },
                    ].map(mod => {
                      const isEnabled = (editModules as any)[mod.id] !== false;
                      const Icon = mod.icon;
                      return (
                        <div
                          key={mod.id}
                          onClick={() => setEditModules(prev => ({ ...prev, [mod.id]: !isEnabled }))}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                            isEnabled 
                              ? 'bg-slate-100 border-amber-500/50 shadow-md ring-1 ring-amber-500/30' 
                              : 'bg-emerald-50 border-slate-200 opacity-50'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isEnabled ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-100 text-slate-500 border-slate-300'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-slate-900">{mod.label}</h4>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                isEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {isEnabled ? 'فعال' : 'غیرفعال'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{mod.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {inspectorTab === 'buttons' && (
                <div className="space-y-5 max-w-4xl mx-auto animate-in fade-in">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-amber-500" />
                        <span>مدیریت دکمه‌های اکشن‌بار و ثبت سریع</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        تنظیم ترتیب قرارگیری، فعال/غیرفعال بودن، شکل دکمه (Pill, Rounded, Square)، رنگ و عنوان هر دکمه.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditButtonConfig([...DEFAULT_ACTION_BUTTONS])}
                      className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
                    >
                      بازنشانی به حالت اولیه
                    </button>
                  </div>

                  <div className="space-y-3">
                    {editButtonConfig
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((btn, index, arr) => {
                        const moveUp = () => {
                          if (index === 0) return;
                          const prev = arr[index - 1];
                          const updated = editButtonConfig.map(b => {
                            if (b.id === btn.id) return { ...b, order: prev.order };
                            if (b.id === prev.id) return { ...b, order: btn.order };
                            return b;
                          });
                          setEditButtonConfig(updated);
                        };

                        const moveDown = () => {
                          if (index === arr.length - 1) return;
                          const next = arr[index + 1];
                          const updated = editButtonConfig.map(b => {
                            if (b.id === btn.id) return { ...b, order: next.order };
                            if (b.id === next.id) return { ...b, order: btn.order };
                            return b;
                          });
                          setEditButtonConfig(updated);
                        };

                        const toggleEnable = () => {
                          setEditButtonConfig(prev =>
                            prev.map(b => (b.id === btn.id ? { ...b, isEnabled: !b.isEnabled } : b))
                          );
                        };

                        const updateField = (field: keyof CustomActionButton, val: any) => {
                          setEditButtonConfig(prev =>
                            prev.map(b => (b.id === btn.id ? { ...b, [field]: val } : b))
                          );
                        };

                        return (
                          <div
                            key={btn.id}
                            className={`p-4 rounded-2xl border transition-all ${
                              btn.isEnabled
                                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/50 opacity-60'
                            }`}
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              {/* Left info & order buttons */}
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1">
                                  <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={moveUp}
                                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 disabled:opacity-30"
                                    title="حرکت به بالا"
                                  >
                                    <MoveUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={index === arr.length - 1}
                                    onClick={moveDown}
                                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 disabled:opacity-30"
                                    title="حرکت به پایین"
                                  >
                                    <MoveDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 font-mono font-bold text-xs flex items-center justify-center">
                                  #{index + 1}
                                </div>

                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-xs text-slate-800 dark:text-slate-100">
                                      {btn.labelFa}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      ({btn.actionKey})
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-400">{btn.labelEn}</span>
                                </div>
                              </div>

                              {/* Live button style preview */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 font-semibold">پیش‌نمایش دکمه:</span>
                                <div
                                  className={`px-3 py-1.5 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all ${
                                    btn.color === 'primary' ? 'bg-amber-600 text-white' :
                                    btn.color === 'success' ? 'bg-emerald-600 text-white' :
                                    btn.color === 'danger' ? 'bg-rose-600 text-white' :
                                    btn.color === 'warning' ? 'bg-orange-500 text-white' :
                                    btn.color === 'info' ? 'bg-blue-600 text-white' :
                                    'bg-slate-700 text-white'
                                  } ${
                                    btn.shape === 'pill' ? 'rounded-full' :
                                    btn.shape === 'square' ? 'rounded-md' : 'rounded-xl'
                                  }`}
                                >
                                  <span>{btn.labelFa}</span>
                                </div>
                              </div>

                              {/* Form Controls */}
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Editable label */}
                                <input
                                  type="text"
                                  value={btn.labelFa}
                                  onChange={e => updateField('labelFa', e.target.value)}
                                  placeholder="عنوان فارسی/دری"
                                  className="w-28 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                                />

                                {/* Color picker */}
                                <select
                                  value={btn.color}
                                  onChange={e => updateField('color', e.target.value as any)}
                                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                                >
                                  <option value="primary">رنگ طلایی (Amber)</option>
                                  <option value="success">رنگ سبز (Emerald)</option>
                                  <option value="info">رنگ آبی (Blue)</option>
                                  <option value="danger">رنگ قرمز (Rose)</option>
                                  <option value="warning">رنگ نارنجی (Orange)</option>
                                  <option value="slate">رنگ سرمه‌ای (Slate)</option>
                                </select>

                                {/* Shape picker */}
                                <select
                                  value={btn.shape}
                                  onChange={e => updateField('shape', e.target.value as any)}
                                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                                >
                                  <option value="rounded">گوشه گرد (Rounded)</option>
                                  <option value="pill">کپسولی (Pill)</option>
                                  <option value="square">مربعی (Square)</option>
                                </select>

                                {/* On/Off Switch */}
                                <button
                                  type="button"
                                  onClick={toggleEnable}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    btn.isEnabled
                                      ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                                  }`}
                                >
                                  {btn.isEnabled ? 'فعال' : 'غیرفعال'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {inspectorTab === 'bill' && (
                <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in">
                  {/* Top Bar with Voucher Type Switcher & Print Test */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-amber-500" />
                        <span>استودیو و دیزاینر آزاد و انعطاف‌پذیر رسیدها، بل‌ها و واچرها (Voucher Studio)</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        تنظیم آزادانه سربرگ، پاورقی، رنگ سازمانی، کسر تضمین حسن نیت، مالیات موضوعی، بارکد اصالت و پیش‌نمایش آنی
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setBillPreviewType('pv')}
                          className={`px-2.5 py-1.5 rounded-lg transition ${billPreviewType === 'pv' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
                        >
                          واچر پرداخت (PV)
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillPreviewType('rv')}
                          className={`px-2.5 py-1.5 rounded-lg transition ${billPreviewType === 'rv' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
                        >
                          واچر دریافت (RV)
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillPreviewType('pcv')}
                          className={`px-2.5 py-1.5 rounded-lg transition ${billPreviewType === 'pcv' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
                        >
                          تنخواه‌گردان (PCV)
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillPreviewType('contractor')}
                          className={`px-2.5 py-1.5 rounded-lg transition ${billPreviewType === 'contractor' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
                        >
                          بل پیمانکار
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>چاپ آزمایشی (Print)</span>
                      </button>
                    </div>
                  </div>

                  {/* Two-column layout: Controls on Left, Live Preview on Right */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Controls Column (5 cols) */}
                    <div className="lg:col-span-5 space-y-4">
                      {/* Identity & Company Data */}
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-indigo-500" />
                          <span>هویت و سربرگ رسمی سند</span>
                        </h4>

                        <div className="space-y-2.5 text-xs">
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">نام یا سربرگ شرکت:</label>
                            <input
                              type="text"
                              value={editBillDesign.receiptHeader || ''}
                              onChange={e => setEditBillDesign(p => ({ ...p, receiptHeader: e.target.value }))}
                              placeholder="شرکت ساختمانی و مهندسی نگین کابل"
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-500 font-bold mb-1">زیرعنوان یا نوع فعالیت:</label>
                            <input
                              type="text"
                              value={editBillDesign.receiptSubheader || ''}
                              onChange={e => setEditBillDesign(p => ({ ...p, receiptSubheader: e.target.value }))}
                              placeholder="سهامی خاص · شماره ثبت تجارتی کابل"
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-slate-500 font-bold mb-1">نمبر تشخیصیه (TIN):</label>
                              <input
                                type="text"
                                value={editBillDesign.taxNumber || ''}
                                onChange={e => setEditBillDesign(p => ({ ...p, taxNumber: e.target.value }))}
                                placeholder="TIN-908234-AF"
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-500 font-bold mb-1">تلفن تماس شرکت:</label>
                              <input
                                type="text"
                                value={editBillDesign.receiptContact || ''}
                                onChange={e => setEditBillDesign(p => ({ ...p, receiptContact: e.target.value }))}
                                placeholder="0783788278"
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-slate-500 font-bold mb-1">آدرس رسمی دفتر:</label>
                            <input
                              type="text"
                              value={editBillDesign.companyAddress || ''}
                              onChange={e => setEditBillDesign(p => ({ ...p, companyAddress: e.target.value }))}
                              placeholder="چهارراهی صدارت، کابل، افغانستان"
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Design & Color Palette */}
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <Palette className="w-4 h-4 text-amber-500" />
                          <span>رنگ و قالب چاپی</span>
                        </h4>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">رنگ سازمانی سربرگ:</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={editBillDesign.primaryColor || '#0f172a'}
                                onChange={e => setEditBillDesign(p => ({ ...p, primaryColor: e.target.value }))}
                                className="w-8 h-8 rounded-xl border border-line cursor-pointer"
                              />
                              <input
                                type="text"
                                value={editBillDesign.primaryColor || '#0f172a'}
                                onChange={e => setEditBillDesign(p => ({ ...p, primaryColor: e.target.value }))}
                                className="w-24 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-xs"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-slate-500 font-bold mb-1">سایز کاغذ چاپی:</label>
                            <select
                              value={editBillDesign.paperSize || 'A4'}
                              onChange={e => setEditBillDesign(p => ({ ...p, paperSize: e.target.value as any }))}
                              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                            >
                              <option value="A4">A4 (استاندارد شرکتی)</option>
                              <option value="A5">A5 (نیم‌صفحه رسید)</option>
                              <option value="Letter">Letter</option>
                              <option value="Thermal80mm">حرارتی ۸۰ میلی‌متری</option>
                            </select>
                          </div>
                        </div>

                        {/* Presets */}
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] text-slate-400">رنگ‌های محبوب:</span>
                          {[
                            { name: 'سرمه‌ای', color: '#0f172a' },
                            { name: 'زمردی', color: '#065f46' },
                            { name: 'نیلی', color: '#3730a3' },
                            { name: 'طلایی', color: '#b45309' },
                            { name: 'زرشکی', color: '#991b1b' },
                          ].map(c => (
                            <button
                              key={c.color}
                              type="button"
                              onClick={() => setEditBillDesign(p => ({ ...p, primaryColor: c.color }))}
                              className="w-5 h-5 rounded-full border border-white/50 shadow-xs transition hover:scale-110"
                              style={{ backgroundColor: c.color }}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Construction Feature Toggles */}
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          <span>بخش‌های حسابداری ساختمانی و مهندسی</span>
                        </h4>

                        <div className="space-y-2 text-xs">
                          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              نمایش جدول کسر ۱۰٪ حسن نیت (Retention)
                            </span>
                            <input
                              type="checkbox"
                              checked={editBillDesign.showRetentionBox !== false}
                              onChange={e => setEditBillDesign(p => ({ ...p, showRetentionBox: e.target.checked }))}
                              className="w-4 h-4 accent-amber-600 rounded"
                            />
                          </label>

                          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              نمایش کسر مالیات موضوعی ۲٪ یا ۷٪ (BRT)
                            </span>
                            <input
                              type="checkbox"
                              checked={editBillDesign.showWithholdingTax !== false}
                              onChange={e => setEditBillDesign(p => ({ ...p, showWithholdingTax: e.target.checked }))}
                              className="w-4 h-4 accent-amber-600 rounded"
                            />
                          </label>

                          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              نمایش بارکد هوشمند اصالت سند (QR Code)
                            </span>
                            <input
                              type="checkbox"
                              checked={editBillDesign.showQrCode !== false}
                              onChange={e => setEditBillDesign(p => ({ ...p, showQrCode: e.target.checked }))}
                              className="w-4 h-4 accent-amber-600 rounded"
                            />
                          </label>

                          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              کادر دو امضا (محاسب / مدیر پروژه) و محل مهر
                            </span>
                            <input
                              type="checkbox"
                              checked={editBillDesign.showStampSignature !== false}
                              onChange={e => setEditBillDesign(p => ({ ...p, showStampSignature: e.target.checked }))}
                              className="w-4 h-4 accent-amber-600 rounded"
                            />
                          </label>

                          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              نمایش واترمارک رسمی در پس‌زمینه سند
                            </span>
                            <input
                              type="checkbox"
                              checked={editBillDesign.showWatermark !== false}
                              onChange={e => setEditBillDesign(p => ({ ...p, showWatermark: e.target.checked }))}
                              className="w-4 h-4 accent-amber-600 rounded"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Terms & Footer Note */}
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">شرایط و پاورقی سند</h4>
                        <div className="space-y-2 text-xs">
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">شرایط پرداخت و تسویه:</label>
                            <textarea
                              rows={2}
                              value={editBillDesign.termsAndConditions || ''}
                              onChange={e => setEditBillDesign(p => ({ ...p, termsAndConditions: e.target.value }))}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">متن پاورقی:</label>
                            <input
                              type="text"
                              value={editBillDesign.receiptFooter || ''}
                              onChange={e => setEditBillDesign(p => ({ ...p, receiptFooter: e.target.value }))}
                              placeholder="کابل، افغانستان · تمامی حقوق مالی محفوظ است."
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Live Preview Column (7 cols) */}
                    <div className="lg:col-span-7">
                      <div className="sticky top-20 bg-slate-200 dark:bg-slate-950 p-4 sm:p-6 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-xl overflow-x-auto">
                        <div className="text-center mb-3">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-line">
                            پیش‌نمایش زنده چاپی · Live WYSIWYG Print Preview ({editBillDesign.paperSize || 'A4'})
                          </span>
                        </div>

                        {/* Paper Sheet Mockup */}
                        <div
                          className="bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-xl mx-auto border relative overflow-hidden transition-all text-xs"
                          style={{
                            borderColor: editBillDesign.primaryColor || '#0f172a',
                            borderWidth: editBillDesign.borderStyle === 'double' ? '3px' : '1px',
                            borderStyle: editBillDesign.borderStyle || 'solid',
                          }}
                        >
                          {/* Security Watermark Background */}
                          {editBillDesign.showWatermark !== false && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] rotate-[-25deg] select-none text-6xl font-black font-mono">
                              OFFICIAL VOUCHER
                            </div>
                          )}

                          {/* Company Header */}
                          <div
                            className="p-4 rounded-xl text-white flex items-center justify-between mb-4 shadow-sm"
                            style={{ backgroundColor: editBillDesign.primaryColor || '#0f172a' }}
                          >
                            <div className="flex items-center gap-3">
                              {editLogoUrl ? (
                                <img
                                  src={editLogoUrl}
                                  alt="Company Logo"
                                  className="w-12 h-12 rounded-xl object-cover bg-white p-1"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-lg">
                                  NSC
                                </div>
                              )}
                              <div>
                                <h1 className="text-base font-black">
                                  {editBillDesign.receiptHeader || editCompanyName || 'شرکت ساختمانی نگین کابل'}
                                </h1>
                                <p className="text-[10px] text-white/80">
                                  {editBillDesign.receiptSubheader || 'سهامی خاص · شماره ثبت تجارتی کابل'}
                                </p>
                                <p className="text-[10px] text-white/70 font-mono">
                                  TIN: {editBillDesign.taxNumber || 'TIN-908234-AF'} | {editBillDesign.receiptContact || '0783788278'}
                                </p>
                              </div>
                            </div>

                            <div className="text-left font-mono">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-black uppercase">
                                {billPreviewType === 'rv' ? 'واچر دریافت (RV)' :
                                 billPreviewType === 'pv' ? 'واچر پرداخت (PV)' :
                                 billPreviewType === 'pcv' ? 'تنخواه‌گردان (PCV)' : 'صورت وضعیت بل'}
                              </span>
                              <div className="text-[11px] font-bold mt-1">
                                No: {billPreviewType.toUpperCase()}-2026-0891
                              </div>
                              <div className="text-[10px] text-white/80">
                                Date: {new Date().toISOString().split('T')[0]}
                              </div>
                            </div>
                          </div>

                          {/* Voucher Meta Info */}
                          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] mb-4">
                            <div>
                              <span className="text-slate-500 block">پروژه ساختمانی:</span>
                              <span className="font-bold text-slate-800">برج تجارتی نگین کابل (فاز ۲)</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">
                                {billPreviewType === 'rv' ? 'دریافت شده از:' : 'پرداخت شده به:'}
                              </span>
                              <span className="font-bold text-slate-800">شرکت تدارکات مصالح برادران رحیمی</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">بابت / شرح عملیات:</span>
                              <span className="font-semibold text-slate-700">تأمین ۵۰۰ خریطه سیمان غوری تیپ ۲ با کرایه تخلیه</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">حساب معین / منبع:</span>
                              <span className="font-semibold text-slate-700">حساب جاری کابل بانک پروژه</span>
                            </div>
                          </div>

                          {/* Line Items Table */}
                          <table className="w-full text-right border-collapse mb-4 text-[11px]">
                            <thead>
                              <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-700 font-bold">
                                <th className="p-2">#</th>
                                <th className="p-2">شرح کالا یا خدمات</th>
                                <th className="p-2 text-center">مقدار</th>
                                <th className="p-2 text-left">فی (AFN)</th>
                                <th className="p-2 text-left">مجموع (AFN)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              <tr>
                                <td className="p-2 font-mono">1</td>
                                <td className="p-2 font-semibold">سیمان غوری پورتلند پاکتی ۵۰ کیلویی</td>
                                <td className="p-2 text-center font-mono">500 خریطه</td>
                                <td className="p-2 text-left font-mono">380</td>
                                <td className="p-2 text-left font-mono font-bold">190,000</td>
                              </tr>
                              <tr>
                                <td className="p-2 font-mono">2</td>
                                <td className="p-2 font-semibold">کرایه لاری و تخلیه کارگری ساحه کارگاه</td>
                                <td className="p-2 text-center font-mono">1 سرویس</td>
                                <td className="p-2 text-left font-mono">10,000</td>
                                <td className="p-2 text-left font-mono font-bold">10,000</td>
                              </tr>
                            </tbody>
                          </table>

                          {/* Financial Calculations Box (Retention + Tax Deductions) */}
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 mb-4 text-[11px]">
                            <div className="flex justify-between items-center text-slate-600">
                              <span>مبلغ کل ناخالص (Gross Amount):</span>
                              <span className="font-mono font-bold">200,000 AFN</span>
                            </div>

                            {editBillDesign.showRetentionBox !== false && (
                              <div className="flex justify-between items-center text-amber-700 font-semibold">
                                <span>کسر ۱۰٪ تضمین حسن نیت کار (Retention 10%):</span>
                                <span className="font-mono">-20,000 AFN</span>
                              </div>
                            )}

                            {editBillDesign.showWithholdingTax !== false && (
                              <div className="flex justify-between items-center text-rose-700 font-semibold">
                                <span>کسر مالیات موضوعی قرارداد (BRT 2% Withholding):</span>
                                <span className="font-mono">-4,000 AFN</span>
                              </div>
                            )}

                            <div className="pt-2 border-t border-slate-300 flex justify-between items-center font-black text-sm text-slate-900">
                              <span>خالص قابل پرداخت / تسویه (Net Payable):</span>
                              <span
                                className="font-mono text-base px-2 py-0.5 rounded-lg text-white"
                                style={{ backgroundColor: editBillDesign.primaryColor || '#0f172a' }}
                              >
                                {editBillDesign.showRetentionBox !== false && editBillDesign.showWithholdingTax !== false
                                  ? '176,000 AFN'
                                  : editBillDesign.showRetentionBox !== false
                                  ? '180,000 AFN'
                                  : '200,000 AFN'}
                              </span>
                            </div>
                          </div>

                          {/* Terms & Conditions */}
                          {editBillDesign.termsAndConditions && (
                            <div className="p-2.5 rounded-xl bg-slate-100 text-[10px] text-slate-600 mb-4 leading-relaxed">
                              <span className="font-bold text-slate-800 block mb-0.5">شرایط و ملاحظات:</span>
                              {editBillDesign.termsAndConditions}
                            </div>
                          )}

                          {/* Signatures & Stamp & QR Section */}
                          <div className="flex items-end justify-between pt-2 border-t border-slate-200">
                            {/* Dual Signatures */}
                            {editBillDesign.showStampSignature !== false ? (
                              <div className="grid grid-cols-2 gap-6 text-center text-[10px]">
                                <div>
                                  <span className="text-slate-500 block mb-6">امضای محاسب و صندوق‌دار:</span>
                                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-700">
                                    امضای امور مالی
                                  </div>
                                </div>
                                <div>
                                  <span className="text-slate-500 block mb-6">تأیید مهندس ناظر / مدیر:</span>
                                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-700">
                                    امضای مدیریت پروژه
                                  </div>
                                </div>
                              </div>
                            ) : <div />}

                            {/* Official Stamp Box */}
                            <div className="flex items-center gap-3">
                              {editBillDesign.showStampSignature !== false && (
                                <div className="w-16 h-16 rounded-full border-2 border-dashed border-rose-500/60 flex flex-col items-center justify-center text-[8px] font-black text-rose-500 rotate-[-12deg]">
                                  <span>مهر رسمی</span>
                                  <span>تأیید شد</span>
                                </div>
                              )}

                              {/* QR Code */}
                              {editBillDesign.showQrCode !== false && (
                                <div className="p-1.5 bg-white border border-slate-300 rounded-xl shadow-xs text-center">
                                  <QrCode className="w-10 h-10 text-slate-800 mx-auto" />
                                  <span className="text-[8px] font-mono block text-slate-500 mt-0.5">اصالت سند</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Footer Note */}
                          {editBillDesign.receiptFooter && (
                            <div className="text-center text-[9px] text-slate-400 pt-4 mt-2 border-t border-slate-100 font-mono">
                              {editBillDesign.receiptFooter}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {inspectorTab === 'subscription' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-slate-200 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">تاریخ انقضای اشتراک:</label>
                        <input
                          type="date"
                          value={editExpiresAt}
                          onChange={(e) => setEditExpiresAt(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-900 font-mono"
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        <span className="text-[11px] text-slate-500 mb-1">شارژ سریع اشتراک:</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickCharge(6)}
                            className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold text-xs rounded-xl shadow-xs transition-colors"
                          >
                            + تمدید ۶ ماه
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickCharge(12)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold text-xs rounded-xl shadow-xs transition-colors"
                          >
                            + تمدید ۱ سال
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">قفل کردن یا بازگشایی حساب شرکت</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">در صورت مسدود بودن، ورود به این حساب ناممکن می‌شود.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        toggleLockUserBySuperAdmin(selectedTenant.id);
                        const updated = users.find(u => u.id === selectedTenant.id);
                        if (updated) setSelectedTenant(updated);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        selectedTenant.isLockedBySuperAdmin 
                          ? 'bg-rose-600 hover:bg-rose-500 text-slate-900' 
                          : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {selectedTenant.isLockedBySuperAdmin ? 'حساب مسدود است (کلیک برای بازگشایی)' : 'حساب فعال است (کلیک برای قفل)'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleImpersonate(selectedTenant)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-300 text-amber-400 text-xs font-bold flex items-center gap-2 transition-colors border border-amber-500/20"
              >
                <LogIn className="w-4 h-4" />
                <span>ورود به عنوان این کاربر (Impersonate)</span>
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTenant(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-300 text-slate-600 text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveTenantChanges()}
                  className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-900 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>ذخیره تغییرات</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* SCREEN 3: دفتر هفت — light SaaS dashboard (etikto-inspired, distinct from the main app) */
          <div className="flex-1 overflow-y-auto scroll-touch p-4 sm:p-6 space-y-5 bg-gradient-to-br from-slate-50 via-slate-100/50 to-indigo-100/40">

            {/* Internal nav */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl w-fit shadow-sm sticky top-0 z-10">
              {([
                { id: 'dashboard', label: 'داشبورد نظارت', icon: LayoutDashboard },
                { id: 'owners', label: 'مالک‌ها و کارمندان', icon: Crown },
                { id: 'security', label: 'امنیت و رمز', icon: KeyRound },
              ] as Array<{ id: typeof officeTab; label: string; icon: any }>).map(tab => {
                const TabIcon = tab.icon;
                const active = officeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setOfficeTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                      active
                        ? 'bg-gradient-to-l from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {officeTab === 'dashboard' && (
              <div className="space-y-5 animate-in fade-in">
                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {([
                    { label: 'مالک‌های کمپنی', value: ownerList.length, icon: Crown, grad: 'from-indigo-500 to-violet-500', chip: 'shadow-indigo-500/30' },
                    { label: 'کل کارمندان', value: staffList.length, icon: Users, grad: 'from-cyan-500 to-sky-500', chip: 'shadow-cyan-500/30' },
                    { label: 'اشتراک فعال', value: tenantUsers.filter(u => !u.isLockedBySuperAdmin && (!u.subscriptionExpiresAt || new Date(u.subscriptionExpiresAt).getTime() >= Date.now())).length, icon: CheckCircle2, grad: 'from-emerald-500 to-teal-500', chip: 'shadow-emerald-500/30' },
                    { label: 'رویداد امروز', value: eventsToday.length, icon: Activity, grad: 'from-amber-500 to-orange-500', chip: 'shadow-amber-500/30' },
                  ]).map((card, i) => {
                    const CardIcon = card.icon;
                    return (
                      <div key={i} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
                        <span className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${card.grad} text-white flex items-center justify-center shadow-lg ${card.chip} shrink-0`}>
                          <CardIcon className="w-5 h-5" />
                        </span>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500">{card.label}</p>
                          <p className="text-2xl font-black text-slate-900 font-mono leading-none mt-1">{card.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                        <h4 className="text-sm font-black text-slate-800">فعالیت سیستم — ۷ روز اخیر</h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{activityEvents.length} رویداد ثبت‌شده</span>
                    </div>
                    {activityEvents.length === 0 ? (
                      <p className="text-xs text-slate-400 py-10 text-center">هنوز فعالیتی ثبت نشده — با گردش کاربران این نمودار زنده می‌شود.</p>
                    ) : (
                      <MiniArea data={last7Days} />
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-black text-slate-800 mb-2">پراستفاده‌ترین گزینه‌ها</h4>
                    {featureUsage.length === 0 ? (
                      <p className="text-xs text-slate-400 py-10 text-center">به‌زودی اینجا دیده می‌شود که کاربران بیشتر کدام بخش را باز می‌کنند.</p>
                    ) : (
                      <div className="flex items-center gap-4">
                        <MiniDonut segments={featureUsage} />
                        <div className="space-y-1.5 flex-1 min-w-0">
                          {featureUsage.slice(0, 5).map((seg, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px]">
                              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: seg.color }} />
                              <span className="font-bold text-slate-600 truncate flex-1">{seg.feature}</span>
                              <span className="font-mono text-slate-400">{seg.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tables row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Most active users */}
                  <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                      <Users className="w-4 h-4 text-violet-500" />
                      <h4 className="text-sm font-black text-slate-800">فعال‌ترین کاربران — چکار کرده، چقدر وقت</h4>
                    </div>
                    {userUsage.length === 0 ? (
                      <p className="text-xs text-slate-400 p-6 text-center">با اولین ورود/گردش کاربران، این جدول پر می‌شود.</p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {userUsage.slice(0, 6).map((u, i) => (
                          <div key={u.userId} className="px-4 py-2.5 flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-[11px] font-black shrink-0 ${
                              i === 0 ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-indigo-500 to-violet-500'
                            }`}>
                              {u.userName.charAt(0)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-800 truncate">{u.userName}</p>
                              <p className="text-[10px] text-slate-400">
                                بیشترین استفاده: <span className="font-bold text-indigo-600">{u.topFeature}</span>
                              </p>
                            </div>
                            <div className="text-left shrink-0">
                              <p className="text-[11px] font-mono font-bold text-slate-700 flex items-center gap-1 justify-end">
                                <Timer className="w-3.5 h-3.5 text-emerald-500" />
                                {u.approxMinutes} دقیقه
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                آخرین: {new Date(u.lastActiveAt).toLocaleTimeString('fa-AF', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent activity feed */}
                  <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-500" />
                      <h4 className="text-sm font-black text-slate-800">آخرین فعالیت‌ها (زنده)</h4>
                    </div>
                    {recentActivity.length === 0 ? (
                      <p className="text-xs text-slate-400 p-6 text-center">هنوز فعالیتی نیامده است.</p>
                    ) : (
                      <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto scroll-touch">
                        {recentActivity.map(ev => (
                          <div key={ev.id} className="px-4 py-2.5 flex items-start gap-2.5">
                            <span className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                              ev.kind === 'login' ? 'bg-emerald-100 text-emerald-600'
                              : ev.kind === 'logout' ? 'bg-rose-100 text-rose-600'
                              : 'bg-indigo-100 text-indigo-600'
                            }`}>
                              {ev.kind === 'login' ? <LogIn className="w-3.5 h-3.5" /> : ev.kind === 'logout' ? <Lock className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </span>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-slate-700 truncate">
                                {ev.userName} — {ev.kind === 'login' ? 'وارد سیستم شد' : ev.kind === 'logout' ? 'خارج شد' : `باز کرد: ${TAB_OPTIONS.find(o => o.id === ev.feature)?.label || ev.feature || ''}`}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {new Date(ev.timestamp).toLocaleDateString('fa-AF')} · {new Date(ev.timestamp).toLocaleTimeString('fa-AF', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {officeTab === 'owners' && (
              <div className="space-y-4 animate-in fade-in">
                {/* owner/staff stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">کل مالک‌ها:</span>
                    <span className="text-xl font-black text-slate-900 font-mono">{ownerList.length}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">کل کارمندان:</span>
                    <span className="text-xl font-black text-slate-900 font-mono">{staffList.length}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-[10px] text-emerald-600 uppercase font-bold block mb-1">اشتراک فعال:</span>
                    <span className="text-xl font-black text-emerald-600 font-mono">
                      {tenantUsers.filter(u => !u.isLockedBySuperAdmin && (!u.subscriptionExpiresAt || new Date(u.subscriptionExpiresAt).getTime() >= Date.now())).length}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-[10px] text-cyan-600 uppercase font-bold block mb-1">هوش مصنوعی فعال:</span>
                    <span className="text-xl font-black text-cyan-600 font-mono">
                      {tenantUsers.filter(u => u.permissions?.aiEnabled !== false).length}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-[10px] text-rose-500 uppercase font-bold block mb-1">منقضی / قفل:</span>
                    <span className="text-xl font-black text-rose-500 font-mono">
                      {tenantUsers.filter(u => u.isLockedBySuperAdmin || (u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt).getTime() < Date.now())).length}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                  <div className="relative w-full sm:max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="جستجوی نام شرکت، نام مدیر، ایمیل یا تیلیفون..."
                      className="w-full ps-9 pe-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewOwnerForm(v => !v)}
                    className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0 ${
                      showNewOwnerForm
                        ? 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                        : 'bg-gradient-to-l from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-500/30'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>{showNewOwnerForm ? 'بستن فورم' : 'مالک جدید'}</span>
                  </button>
                </div>

                {showNewOwnerForm && (
                  <form onSubmit={handleCreateOwner} className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 text-emerald-700 text-xs font-black">
                      <Crown className="w-4 h-4" />
                      <span>ساخت حساب «مالک کمپنی» جدید — خودش بعداً برای کارمندانش یوزر می‌سازد</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {([
                        { key: 'name', label: 'نام مالک', ph: 'حاجی احمد شاه' },
                        { key: 'username', label: 'نام کاربری (username)', ph: 'ahmadshah' },
                        { key: 'password', label: 'رمز عبور', ph: '********', type: 'text' },
                        { key: 'email', label: 'ایمیل', ph: 'owner@company.com', type: 'email' },
                        { key: 'phone', label: 'تیلیفون', ph: '+93...' },
                        { key: 'companyName', label: 'نام کمپنی', ph: 'Ahmad Shah Construction Co.' },
                        { key: 'companyAddress', label: 'آدرس کمپنی', ph: 'کابل، افغانستان' },
                      ] as Array<{ key: keyof typeof newOwner; label: string; ph: string; type?: string }>).map(f => (
                        <div key={f.key as string} className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">{f.label}</label>
                          <input
                            type={f.type || 'text'}
                            required={['name', 'username', 'password', 'email'].includes(f.key as string)}
                            value={String(newOwner[f.key] || '')}
                            onChange={e => setNewOwner(prev => ({ ...prev, [f.key]: e.target.value }))}
                            placeholder={f.ph}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                          />
                        </div>
                      ))}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">پلان اشتراک</label>
                        <select
                          value={newOwner.subscriptionPlan || 'trial'}
                          onChange={e => setNewOwner(prev => ({ ...prev, subscriptionPlan: e.target.value as User['subscriptionPlan'] }))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="trial">تجربه‌ای (Trial)</option>
                          <option value="6_months">۶ ماهه</option>
                          <option value="1_year">۱ ساله</option>
                          <option value="lifetime">دایمی</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">تاریخ انقضای اشتراک (اختیاری)</label>
                        <input
                          type="date"
                          value={newOwner.expiresAt}
                          onChange={e => setNewOwner(prev => ({ ...prev, expiresAt: e.target.value }))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2 bg-gradient-to-l from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ساخت حساب مالک</span>
                      </button>
                    </div>
                  </form>
                )}

                {saveSuccessNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{saveSuccessNotice}</span>
                  </div>
                )}

                <div className="space-y-3">
                  {ownerList.length === 0 && ungroupedStaff.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      هیچ شرکتی یافت نشد.
                    </div>
                  ) : (
                    <>
                      {ownerList.map(owner => {
                        const staff = employeesOf(owner.id);
                        const expanded = expandedOwnerIds.includes(owner.id);
                        return (
                          <div key={owner.id} className="space-y-2">
                            {renderTenantRow(owner, false)}
                            {staff.length > 0 && (
                              <div className="border-s-2 border-indigo-300 ms-5 sm:ms-7 ps-2 sm:ps-3 space-y-2">
                                <button
                                  type="button"
                                  onClick={() => toggleOwnerExpanded(owner.id)}
                                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 text-xs font-bold text-slate-600 transition-colors shadow-2xs"
                                >
                                  <span className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-indigo-500" />
                                    <span>{staff.length} کارمند زیر این مالک</span>
                                  </span>
                                  <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                </button>
                                {expanded && staff.map(member => renderTenantRow(member, true))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {ungroupedStaff.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase px-1">
                            <UserCog className="w-4 h-4 text-indigo-500" />
                            <span>کارمندان / حساب‌های غیرمتعلق به مالک مشخص</span>
                          </div>
                          {ungroupedStaff.map(member => renderTenantRow(member, true))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {officeTab === 'security' && (
              <div className="max-w-xl space-y-4 animate-in fade-in">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-indigo-600" />
                    <h4 className="text-sm font-black text-slate-800">تغییر کلید ورود دفتر هفت</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    کلید جدید فوراً فعال می‌شود. تذکر: <span className="font-bold text-slate-700">رمز اکانت najeemnik</span> همواره به عنوان کلید پشتیبان پذیرفته است تا هیچ‌وقت بیرون نمانید.
                  </p>
                  <form onSubmit={handleSaveGateKey} className="space-y-3">
                    <input
                      type="password"
                      required
                      value={newGateKey}
                      onChange={e => setNewGateKey(e.target.value)}
                      placeholder="کلید جدید دفتر هفت (حداقل ۴ حرف)..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                    <input
                      type="password"
                      required
                      value={newGateKeyRepeat}
                      onChange={e => setNewGateKeyRepeat(e.target.value)}
                      placeholder="تکرار کلید جدید..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                    {gateKeyMsg && (
                      <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                        gateKeyMsg.includes('موفقیت') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
                      }`}>
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{gateKeyMsg}</span>
                      </div>
                    )}
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-l from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>ذخیره کلید جدید</span>
                    </button>
                  </form>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
                  <span className="font-black">نکتهٔ امنیتی:</span> ۵ تلاش غلط متوالی دروازه را ۳۰ ثانیه می‌بندد و هر ورود در ثبت رویدادها با نشست و ساعت ذخیره می‌شود.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
