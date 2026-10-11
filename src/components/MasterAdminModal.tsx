import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserActivityEvent, CustomActionButton, CustomBillDesign, DEFAULT_ACTION_BUTTONS } from '../types';
import { intlLocaleFor, localizeActionButtonLabel, localizeText } from '../i18n/localize';
import type { LocalizedCopy } from '../i18n/localize';
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
const TAB_OPTIONS: Array<{ id: string; label: LocalizedCopy }> = [
  { id: 'dashboard', label: { en: 'Dashboard', fa: 'داشبورد', ps: 'ډشبورډ' } },
  { id: 'projects', label: { en: 'Projects', fa: 'پروژه‌ها', ps: 'پروژې' } },
  { id: 'income', label: { en: 'Income & collections', fa: 'عواید و دریافت‌ها', ps: 'عواید او ترلاسه کول' } },
  { id: 'materials', label: { en: 'Materials & procurement', fa: 'خرید مصالح و تدارکات', ps: 'د موادو پېرود او تدارکات' } },
  { id: 'labor', label: { en: 'Labor & wages', fa: 'کارکرد و معاشات', ps: 'د کار او معاشاتو ثبت' } },
  { id: 'steel', label: { en: 'Rebar & steel', fa: 'سیخ‌گول و آهن‌آلات', ps: 'سیخ ګول او اوسپنه' } },
  { id: 'concrete', label: { en: 'Concrete', fa: 'کانکریت', ps: 'کانکریټ' } },
  { id: 'expenses', label: { en: 'Expenses', fa: 'مصارف', ps: 'لګښتونه' } },
  { id: 'contractors', label: { en: 'Contractors', fa: 'قراردادی‌ها', ps: 'قراردادیان' } },
  { id: 'suppliers', label: { en: 'Suppliers', fa: 'عرضه‌کنندگان', ps: 'عرضه کوونکي' } },
  { id: 'apartments', label: { en: 'Apartments & sales', fa: 'آپارتمان‌ها و فروش', ps: 'اپارتمانونه او پلور' } },
  { id: 'payments', label: { en: 'Payments', fa: 'پرداخت‌ها', ps: 'تادیات' } },
  { id: 'treasury', label: { en: 'Bank & treasury', fa: 'بانک و خزانه‌داری', ps: 'بانک او خزانه' } },
  { id: 'petty_cash', label: { en: 'Petty cash', fa: 'صندوق خُرد', ps: 'کوچنی صندوق' } },
  { id: 'assets', label: { en: 'Assets & equipment', fa: 'اموال و تجهیزات', ps: 'شتمنۍ او تجهیزات' } },
  { id: 'transfers', label: { en: 'Project transfers', fa: 'انتقالات پروژه‌ای', ps: 'د پروژو ترمنځ لېږدونه' } },
  { id: 'budget', label: { en: 'Project budget', fa: 'بودجه پروژه', ps: 'د پروژې بودجه' } },
  { id: 'accounting', label: { en: 'Accounting books', fa: 'دفاتر حسابداری', ps: 'د محاسبې دفترونه' } },
  { id: 'journal', label: { en: 'Journal entries', fa: 'اسناد روزنامچه', ps: 'د ورځپاڼې اسناد' } },
  { id: 'documents', label: { en: 'Documents & bills', fa: 'اسناد و بل‌ها', ps: 'اسناد او بلونه' } },
  { id: 'reports', label: { en: 'Reports', fa: 'گزارشات', ps: 'راپورونه' } },
  { id: 'settings', label: { en: 'Settings', fa: 'تنظیمات', ps: 'تنظیمات' } },
  { id: 'users', label: { en: 'Employee management', fa: 'مدیریت کارمندان', ps: 'د کارکوونکو مدیریت' } },
  { id: 'audit_logs', label: { en: 'Audit log', fa: 'ثبت رویدادها', ps: 'د پېښو ثبت' } },
];

export const MasterAdminModal: React.FC<MasterAdminModalProps> = ({ isOpen, onClose, directAccess, fullPage }) => {
  const { 
    currentUser,
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
    t,
    language,
  } = useApp();
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });
  const getTabLabel = (id: string) => {
    const option = TAB_OPTIONS.find(tab => tab.id === id);
    return option ? localizeText(language, option.label) : tx('Other section', 'بخش دیگر', 'بله برخه');
  };

  const isAuthenticated = Boolean(currentUser?.isMasterSuperAdmin);

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

    const configuredButtons = user.customButtonConfig && user.customButtonConfig.length > 0
      ? user.customButtonConfig
      : DEFAULT_ACTION_BUTTONS;
    setEditButtonConfig(configuredButtons.map(button => {
      const defaults = DEFAULT_ACTION_BUTTONS.find(candidate => candidate.id === button.id);
      return {
        ...button,
        actionKey: button.actionKey || button.id,
        labelFa: button.labelFa || defaults?.labelFa || button.label,
        labelEn: button.labelEn || defaults?.labelEn || '',
        labelPs: button.labelPs || defaults?.labelPs || '',
        isEnabled: button.isEnabled ?? button.enabled,
      };
    }));

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

  const handleSaveTenantChanges = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTenant) return;

    const result = await updateTenantByMasterAdmin(selectedTenant.id, {
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
      setSaveSuccessNotice(`مشخصات حساب، ماژول‌ها و دسترسی تب‌ها در سرور ذخیره شد؛ تغییرات لوگو، طرح بل و دکمه‌ها هنوز در سرور پشتیبانی نمی‌شود.`);
      setTimeout(() => setSaveSuccessNotice(null), 6000);
    } else {
      setSaveSuccessNotice(result.error || 'تنظیمات در سرور ذخیره نشد.');
      setTimeout(() => setSaveSuccessNotice(null), 6000);
    }
  };

  const handleQuickCharge = async (months: number) => {
    if (!selectedTenant) return;
    const result = await chargeUserSubscription(selectedTenant.id, months);
    if (!result.success) {
      setSaveSuccessNotice(result.error || 'Subscription update failed.');
      setTimeout(() => setSaveSuccessNotice(null), 5000);
      return;
    }
    const nextExpiry = result.subscriptionExpiresAt;
    if (!nextExpiry) {
      setSaveSuccessNotice('اشتراک تمدید شد، اما تاریخ تازه از سرور دریافت نشد؛ فهرست را تازه کنید.');
      setTimeout(() => setSaveSuccessNotice(null), 5000);
      return;
    }
    setSelectedTenant(prev => prev ? { ...prev, subscriptionExpiresAt: nextExpiry } : prev);
    setEditExpiresAt(nextExpiry.split('T')[0]);
    setSaveSuccessNotice(`اشتراک برای ${months} ماه با موفقیت تمدید شد.`);
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  const handleToggleTenantLock = async () => {
    if (!selectedTenant) return;
    const result = await toggleLockUserBySuperAdmin(selectedTenant.id);
    if (!result.success || result.isLocked === undefined) {
      setSaveSuccessNotice(result.error || 'وضعیت حساب در سرور تغییر نکرد.');
      setTimeout(() => setSaveSuccessNotice(null), 5000);
      return;
    }
    setSelectedTenant(prev => prev ? {
      ...prev,
      isLockedBySuperAdmin: result.isLocked,
      active: !result.isLocked,
    } : prev);
    setSaveSuccessNotice(result.isLocked ? 'حساب شرکت در سرور قفل شد.' : 'قفل حساب شرکت در سرور برداشته شد.');
    setTimeout(() => setSaveSuccessNotice(null), 4000);
  };

  const handleImpersonate = (_user: User) => {
    setSaveSuccessNotice('Tenant impersonation is disabled until a server-authorized inspection flow is implemented.');
    setTimeout(() => setSaveSuccessNotice(null), 5000);
  };

  const handleCreateOwner = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccessNotice('Server-side tenant provisioning is not available yet. No account was created.');
    setTimeout(() => setSaveSuccessNotice(null), 5000);
    setNewOwner({ ...emptyNewOwner, password: '' });
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
              <img src={user.customLogoUrl} alt={tx('Company logo', 'لوگوی شرکت', 'د شرکت لوګو')} className="w-full h-full object-contain p-1" />
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
                {isEmployee
                  ? user.role === 'accountant'
                    ? tx('Employee · Accountant', 'کارمند · محاسب', 'کارکوونکی · محاسب')
                    : user.role === 'viewer'
                      ? tx('Employee · Viewer', 'کارمند · ناظر', 'کارکوونکی · کتونکی')
                      : tx('Employee', 'کارمند', 'کارکوونکی')
                  : tx('Company owner', 'مالک کمپنی', 'د شرکت مالک')}
              </span>

              {isLocked ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  {tx('Locked', 'مسدود شده', 'تړل شوی')}
                </span>
              ) : isExpired ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                  {tx('Expired', 'منقضی شده', 'پای ته رسېدلی')}
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  {tx(`${remainingDays} days left`, `${remainingDays} روز باقی‌مانده`, `${remainingDays} ورځې پاتې دي`)}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1 font-mono">
              <span>{tx('Username:', 'یوزر:', 'کارن-نوم:')} {user.username}</span>
              <span>{tx('Email:', 'ایمیل:', 'برېښنالیک:')} {user.email}</span>
              {user.phone && <span>{tx('Phone:', 'تیلیفون:', 'ټیلیفون:')} {user.phone}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => handleImpersonate(user)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors border border-slate-200"
            title={tx('Sign in to view this account as the user', 'ورود به حساب کاربری و دیدن سیستم از دید کاربر', 'د دې کارن په توګه حساب ته ننوتل')}
          >
            <LogIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleOpenTenantInspector(user)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEmployee ? tx('Manage employee', 'مدیریت کارمند', 'د کارکوونکي مدیریت') : tx('Manage company', 'مدیریت شرکت', 'د شرکت مدیریت')}</span>
          </button>
        </div>
      </div>
    );
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
        label: d.toLocaleDateString(intlLocaleFor(language), { weekday: 'short' }),
        count: activityEvents.filter(ev => ev.timestamp.startsWith(dayStr)).length,
      };
    });
  }, [activityEvents, language]);

  const featureUsage: Array<{ feature: string; count: number; color: string }> = useMemo(() => {
    const counts = new Map<string, number>();
    activityEvents.filter(ev => ev.kind === 'feature' && ev.feature).forEach(ev => {
      counts.set(ev.feature!, (counts.get(ev.feature!) || 0) + 1);
    });
    const palette = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#64748b'];
    return TAB_OPTIONS.map(o => ({ feature: getTabLabel(o.id), count: counts.get(o.id) || 0 }))
      .filter(f => f.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 7)
      .map((f, i) => ({ ...f, color: palette[i % palette.length] }));
  }, [activityEvents, language]);

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
    const featureLabel = getTabLabel;
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
  }, [activityEvents, language]);

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
        <text x="21" y="26" textAnchor="middle" fontSize="3.2" fill="#94a3b8">{tx('Events', 'رویدادها', 'پېښې')}</text>
      </svg>
    );
  };

  const handleClose = () => {
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
                  {tx('Office 7 (office_7)', 'دفتر هفت (office_7)', 'دفتر ۷ (office_7)')}
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/15 border border-white/25">
                  {tx('Senior administration portal', 'پورتال مدیریت ارشد', 'د لوړ مدیریت پورټل')}
                </span>
              </div>
              <p className="text-[11px] text-indigo-100/90 mt-0.5">
                {tx(
                  'Full oversight of owners and their employees — usage by each user, minute by minute, with timestamps.',
                  'نظارت کامل بر مالک‌ها و کارمندان‌شان — میزان استفادهٔ هر کاربر، دقیقه‌به‌دقیقه، همراه تاریخ و ساعت.',
                  'د مالکانو او د هغوی د کارکوونکو بشپړه څارنه — د هر کارن کارونه، دقیقه په دقیقه، له نېټې او وخت سره.'
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleClose}
              title={tx('Return to the main system', 'بازگشت به سیستم اصلی', 'بېرته اصلي سیستم ته ستنېدل')}
              className="h-9 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center gap-1.5 text-[11px] font-bold transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="hidden sm:inline">{tx('Back to the app', 'بازگشت به برنامه', 'اپلېکېشن ته بېرته تلل')}</span>
            </button>
            <button
              onClick={() => { handleClose(); logout(); }}
              title={tx('Sign out of the system', 'خروج از سیستم', 'له سیستم څخه وتل')}
              className="h-9 px-3.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-300/30 text-white flex items-center gap-1.5 text-[11px] font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{tx('Sign out', 'خروج', 'وتل')}</span>
            </button>
          </div>
        </div>

        {/* Office 7 relies only on the authenticated, server-verified master session. */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full text-center space-y-5 bg-white/60">
            <div className="w-20 h-20 rounded-3xl bg-rose-50 border-2 border-rose-200 flex items-center justify-center text-rose-600 shadow-xl shadow-rose-200/40">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-black text-slate-900">{tx('Master database session required', 'ورود ماستر به نشست دیتابیس الزامی است', 'د ماستر لپاره ډیټابېس ته ننوتل اړین دي')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {tx(
                'Office 7 accepts only a server-authenticated master account. No browser PIN, shared gate key, or fallback password is accepted.',
                'دفتر هفت تنها حساب ماستری را می‌پذیرد که از سوی سرور تأیید شده باشد. PIN مرورگر، کلید مشترک ورود یا رمز جایگزین پذیرفته نمی‌شود.',
                'دفتر ۷ یوازې هغه ماستر حساب مني چې سرور یې تصدیق کړي. د براوزر PIN، ګډه د ننوتلو کیلي یا بدیل پټنوم نه مني.'
              )}
            </p>
            <button type="button" onClick={handleClose} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold">{t("close")}</button>
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
                  <span>{tx('Back to list', 'بازگشت به فهرست', 'لړلیک ته بېرته تلل')}</span>
                </button>
                <div className="border-r border-slate-300 pe-3 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">{tx('Selected company:', 'شرکت منتخب:', 'ټاکل شوی شرکت:')}</span>
                  <span className="text-sm font-black text-amber-400">{editCompanyName || editName}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                {[
                  { id: 'profile', label: tx('Company profile', 'مشخصات شرکت', 'د شرکت معلومات'), icon: UserCheck },
                  { id: 'access', label: tx('Permissions and access', 'صلاحیت‌ها و دسترسی', 'اجازې او لاسرسی'), icon: UserCog },
                  { id: 'modules', label: tx('Module controls (18)', 'کنترل ماژول‌ها (۱۸)', 'د ماډیولونو کنټرول (۱۸)'), icon: Sliders },
                  { id: 'buttons', label: tx('Buttons and action bar', 'دکمه‌ها و نوار عملیات', 'تڼۍ او د کړنو پټه'), icon: Sliders },
                  { id: 'bill', label: tx('Bill and voucher studio', 'استودیوی بل و واچر', 'د بل او واچر سټوډیو'), icon: Receipt },
                  { id: 'subscription', label: tx('Subscription renewal and lock', 'تمدید و قفل اشتراک', 'د ګډون نوي کول او تړل'), icon: Calendar },
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
                <span className="text-[10px] text-emerald-400 font-mono">{tx('Saved', 'ذخیره شد', 'خوندي شو')}</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {inspectorTab === 'profile' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-slate-200 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-amber-400" />
                      <span>{tx('Administrator and company details', 'مشخصات مدیر و شرکت', 'د مدیر او شرکت معلومات')}</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">{tx('Administrator name', 'نام مدیر', 'د مدیر نوم')}</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">{tx('Company name', 'نام شرکت', 'د شرکت نوم')}</label>
                        <input
                          type="text"
                          value={editCompanyName}
                          onChange={(e) => setEditCompanyName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">{tx('Official email', 'ایمیل رسمی', 'رسمي برېښنالیک')}</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">{t("phone")}</label>
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
                      <span>{tx('Change the user password directly as master', 'تغییر مستقیم رمز عبور کاربر توسط ماستر', 'د ماستر له‌خوا د کارن پټنوم مستقیم بدلول')}</span>
                    </h3>
                    <input
                      type="text"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder={tx('New password...', 'رمز عبور جدید...', 'نوی پټنوم...')}
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
                        <span>{tx('This account is a company owner', 'این حساب «مالک شرکت» است', 'دا حساب د شرکت د مالک دی')}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {tx(
                          'Owners have full access to every enabled company tab. To limit an owner, open the',
                          'مالک به تمام برگه‌های فعال شرکت خود دسترسی کامل دارد. برای محدود کردن دسترسی مالک، برگهٔ',
                          'مالک د خپل شرکت ټولو فعالو ټبونو ته بشپړ لاسرسی لري. د مالک د لاسرسي محدودولو لپاره،'
                        )}
                        <span className="text-amber-300 font-bold"> {tx('Module controls', 'کنترل ماژول‌ها', 'د ماډیولونو کنټرول')} </span>
                        {tx(
                          'and enable or disable modules; the change applies to the owner and all employees. The selected tabs below are also saved and apply to this company’s employees.',
                          'را باز کنید و ماژول‌ها را فعال یا غیرفعال سازید؛ این تغییر یکجا بر مالک و همهٔ کارمندانش تطبیق می‌شود. برگه‌های انتخاب‌شدهٔ زیر نیز ذخیره شده و برای کارمندان همین شرکت به‌کار می‌رود.',
                          'ټب پرانیزئ او ماډیولونه فعال یا بند کړئ؛ دا بدلون پر مالک او د هغه پر ټولو کارکوونکو یوځای تطبیقېږي. لاندې ټاکل شوي ټبونه هم ساتل کېږي او د همدې شرکت د کارکوونکو لپاره کارول کېږي.'
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl space-y-1">
                      <div className="flex items-center gap-2 text-cyan-300 text-xs font-black">
                        <UserCog className="w-4 h-4" />
                        <span>{tx('Tab access for this employee', 'دسترسی برگه‌ها برای این کاربر', 'دې کارکوونکي ته د ټبونو لاسرسی')}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {tx(
                          'For an employee (accountant/viewer), enable only the tabs they are permitted to access. Changes take effect immediately on all devices and navigation surfaces (sidebar, mobile menu, and login screen).',
                          'برای کارمند (محاسب یا ناظر)، فقط برگه‌هایی را فعال کنید که اجازهٔ دیدن آن‌ها را دارد. تغییرات فوراً در همهٔ دستگاه‌ها و بخش‌های ناوبری (نوار کناری، منوی موبایل و صفحهٔ ورود) تطبیق می‌شود.',
                          'د کارکوونکي (محاسب یا کتونکي) لپاره یوازې هغه ټبونه فعال کړئ چې د لیدلو اجازه یې لري. بدلونونه سمدستي په ټولو وسیلو او د تګ راتګ برخو (اړخیز مېنو، موبایل مېنو او د ننوتلو پاڼه) کې پلي کېږي.'
                        )}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditAllowedTabs(TAB_OPTIONS.map(o => o.id))}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-600 text-[11px] font-bold hover:bg-emerald-600/30 transition-colors"
                    >
                      {tx('Select all', 'انتخاب همه', 'ټول ټاکل')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditAllowedTabs(['dashboard'])}
                      className="px-3 py-1.5 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-600 text-[11px] font-bold hover:bg-rose-600/30 transition-colors"
                    >
                      {tx('Dashboard only', 'فقط داشبورد', 'یوازې ډشبورډ')}
                    </button>
                    <span className="text-[11px] text-slate-500 ms-auto">{editAllowedTabs.length} {tx('tabs selected', 'برگهٔ منتخب', 'ټاکل شوي ټبونه')}</span>
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
                          <span className="text-start">{localizeText(language, label)}</span>
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
                      { id: 'income', label: tx('Income & collections', 'عواید و دریافت‌ها', 'عواید او ترلاسه کول'), desc: tx('Installments, unit sales, and investors', 'اقساط، فروش واحد و سرمایه‌گذاران', 'قسطونه، د واحدونو پلور او پانګه‌وال'), icon: Coins },
                      { id: 'materials', label: tx('Materials & procurement', 'خرید مصالح و تدارکات', 'د ساختماني موادو پېرود او تدارکات'), desc: tx('Cement, gravel, and bricks linked to expenses', 'سیمان، ریگ و خشت با اتصال به مصارف', 'سمنټ، جغل او خښتې چې له لګښتونو سره تړلي دي'), icon: Truck },
                      { id: 'labor', label: tx('Worker wages', 'معاشات کارگران', 'د کارګرانو مزدوري'), desc: tx('Wages, advances, and work-settlement records', 'دستمزد، مساعده و تسویهٔ کارکرد', 'مزدوري، مخکې ورکړې او د کار حساب تصفیه'), icon: UserCheck },
                      { id: 'steel', label: tx('Rebar & steel', 'سیخ‌گول و آهن‌آلات', 'سیخ ګول او اوسپنیز توکي'), desc: tx('Weight and price calculations in kilograms and tons', 'محاسبهٔ وزن و قیمت به کیلوگرام و تُن', 'په کیلوګرام او ټنو کې د وزن او بیې محاسبه'), icon: Layers },
                      { id: 'concrete', label: tx('Concrete & pump', 'کانکریت و پمپ', 'کانکریټ او پمپ'), desc: tx('Batching, mixers, and pump rental', 'بچینگ، مکسر و کرایهٔ پمپ', 'بچینګ، مکسرونه او د پمپ کرایه'), icon: CircleDot },
                      { id: 'expenses', label: tx('Daily expenses', 'مصارف روزمره', 'ورځني لګښتونه'), desc: tx('General and miscellaneous purchases', 'خریدهای عمومی و متفرقه', 'عمومي او بېلابېل پېرودونه'), icon: Receipt },
                      { id: 'contractors', label: tx('Contractors', 'قراردادی‌ها', 'قراردادیان'), desc: tx('Contracts, progress, and retention', 'قراردادها، پیشرفت و تضمین حسن اجرا', 'قراردادونه، پرمختګ او د حسن اجرا تضمین'), icon: HardHat },
                      { id: 'suppliers', label: tx('Suppliers', 'عرضه‌کنندگان', 'عرضه کوونکي'), desc: tx('Materials suppliers and outstanding balances', 'فروشندگان مصالح و حساب‌های باقیمانده', 'د موادو عرضه کوونکي او پاتې حسابونه'), icon: Building2 },
                      { id: 'apartments', label: tx('Apartments', 'آپارتمان‌ها', 'اپارتمانونه'), desc: tx('Sales, floor area, and installments', 'فروش، مساحت و اقساط', 'پلور، مساحت او قسطونه'), icon: Home },
                      { id: 'payments', label: tx('Payments & receipts', 'پرداخت و رسید', 'تادیات او رسیدونه'), desc: tx('Issue receipts and record cheques and bank payments', 'صدور رسید و ثبت چک و پرداخت‌های بانکی', 'رسیدونه صادرول او چکونه او بانکي تادیات ثبتول'), icon: CreditCard },
                      { id: 'treasury', label: tx('Bank & treasury', 'بانک و خزانه‌داری', 'بانک او خزانه'), desc: tx('Bank accounts and live balances', 'حساب‌های بانکی و موجودی لحظه‌ای', 'بانکي حسابونه او اوسني بیلانسونه'), icon: Landmark },
                      { id: 'pettyCash', label: tx('Site petty cash', 'تنخواه‌گردان کارگاه', 'د کارځای کوچنی صندوق'), desc: tx('Small site expenses and daily vouchers', 'مصارف خرد و واچرهای روزمرهٔ کارگاه', 'د کارځای کوچني لګښتونه او ورځني واچرونه'), icon: Wallet },
                      { id: 'assets', label: tx('Assets & equipment', 'اموال و تجهیزات', 'شتمنۍ او تجهیزات'), desc: tx('Machinery, cranes, and depreciation', 'ماشین‌آلات، کرین و استهلاک', 'ماشینونه، کرېنونه او استهلاک'), icon: Scale },
                      { id: 'transfers', label: tx('Project transfers', 'انتقالات پروژه‌ای', 'د پروژو ترمنځ لېږدونه'), desc: tx('Transfer money and materials between projects', 'انتقال پول و مصالح میان پروژه‌ها', 'د پروژو ترمنځ د پیسو او موادو لېږد'), icon: ArrowLeftRight },
                      { id: 'journal', label: tx('Journal and adjustments', 'دفتر روزنامچه و تعدیلات', 'د ورځپاڼې دفتر او تعدیلات'), desc: tx('Double-entry debits, credits, and adjustments', 'ثبت دوبل بدهکار، بستانکار و تعدیلات', 'دوه‌اړخیز ډیبیټ، کریډیټ او تعدیلات'), icon: BookOpen },
                      { id: 'documents', label: tx('Documents & bills', 'اسناد و بل‌ها', 'اسناد او بلونه'), desc: tx('Archive of images and documents', 'آرشیف تصاویر و اسناد', 'د انځورونو او اسنادو زېرمتون'), icon: FileCheck2 },
                      { id: 'reports', label: tx('A4 reports & P&L', 'گزارشات A4 و سود و زیان', 'A4 راپورونه او ګټه او زیان'), desc: tx('Printable statements and project profit/loss', 'صورت‌حساب چاپی و سود و زیان پروژه', 'چاپېدونکي راپورونه او د پروژې ګټه/زیان'), icon: BarChart3 },
                      { id: 'auditLogs', label: tx('Security log', 'لاگ امنیتی', 'امنیتي لاګ'), desc: tx('Track all system changes', 'ردیابی تمام تغییرات سیستم', 'د سیستم د ټولو بدلونونو څارنه'), icon: History },
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
                                {isEnabled ? t("active") : t("disabled")}
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
                        <span>{tx('Action bar and quick-entry buttons', 'مدیریت دکمه‌های نوار عملیات و ثبت سریع', 'د کړنو پټې او چټک ثبت تڼۍ')}</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {tx(
                          'Set the order, enabled state, shape, color, and label for each button.',
                          'ترتیب، وضعیت فعال یا غیرفعال، شکل، رنگ و عنوان هر دکمه را تنظیم کنید.',
                          'د هرې تڼۍ ترتیب، فعال یا غیرفعال حالت، بڼه، رنګ او سرلیک وټاکئ.'
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditButtonConfig([...DEFAULT_ACTION_BUTTONS])}
                      className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
                    >
                      {tx('Reset to defaults', 'بازنشانی به حالت اولیه', 'اصلي حالت ته ستنول')}
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
                                    title={tx('Move up', 'حرکت به بالا', 'پورته خوځول')}
                                  >
                                    <MoveUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={index === arr.length - 1}
                                    onClick={moveDown}
                                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 disabled:opacity-30"
                                    title={tx('Move down', 'حرکت به پایین', 'ښکته خوځول')}
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
                                      {localizeActionButtonLabel(btn, language)}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      ({btn.actionKey})
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-x-2 text-[10px] text-slate-400">
                                    <span>{tx('English:', 'انگلیسی:', 'انګلیسي:')} {btn.labelEn || tx('Translation unavailable', 'ترجمه موجود نیست', 'ژباړه نشته')}</span>
                                    <span>{tx('Afghan Dari:', 'دری:', 'د افغانستان دري:')} {btn.labelFa || tx('Translation unavailable', 'ترجمه موجود نیست', 'ژباړه نشته')}</span>
                                    <span>{tx('Pashto:', 'پشتو:', 'پښتو:')} {btn.labelPs || tx('Translation unavailable', 'ترجمه موجود نیست', 'ژباړه نشته')}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Live button style preview */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 font-semibold">{tx('Button preview:', 'پیش‌نمایش دکمه:', 'د تڼۍ بېلګه:')}</span>
                                <div
                                  className={`px-3 py-1.5 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all ${
                                    btn.color === 'primary' || btn.color === 'amber' ? 'bg-amber-600 text-white' :
                                    btn.color === 'success' || btn.color === 'emerald' ? 'bg-emerald-600 text-white' :
                                    btn.color === 'danger' || btn.color === 'rose' ? 'bg-rose-600 text-white' :
                                    btn.color === 'warning' || btn.color === 'orange' ? 'bg-orange-500 text-white' :
                                    btn.color === 'info' || btn.color === 'blue' || btn.color === 'indigo' ? 'bg-blue-600 text-white' :
                                    btn.color === 'purple' ? 'bg-purple-600 text-white' :
                                    'bg-slate-700 text-white'
                                  } ${
                                    btn.shape === 'pill' ? 'rounded-full' :
                                    btn.shape === 'square' || btn.shape === 'rounded-md' ? 'rounded-md' : 'rounded-xl'
                                  }`}
                                >
                                  <span>{localizeActionButtonLabel(btn, language)}</span>
                                </div>
                              </div>

                              {/* Form Controls */}
                              <div className="flex flex-wrap items-center gap-2">
                                {/* One label per supported language; never borrow copy from another locale. */}
                                <input
                                  type="text"
                                  value={btn.labelEn || ''}
                                  onChange={e => updateField('labelEn', e.target.value)}
                                  aria-label={tx('English action label', 'برچسب انگلیسی دکمه', 'د تڼۍ انګلیسي سرلیک')}
                                  placeholder={tx('English label', 'برچسب انگلیسی', 'انګلیسي سرلیک')}
                                  className="w-32 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                                />
                                <input
                                  type="text"
                                  value={btn.labelFa || ''}
                                  onChange={e => updateField('labelFa', e.target.value)}
                                  aria-label={tx('Afghan Dari action label', 'برچسب دری افغانستان', 'د افغانستان دري سرلیک')}
                                  placeholder={tx('Dari label', 'برچسب دری', 'دري سرلیک')}
                                  className="w-32 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                                />
                                <input
                                  type="text"
                                  value={btn.labelPs || ''}
                                  onChange={e => updateField('labelPs', e.target.value)}
                                  aria-label={tx('Pashto action label', 'برچسب پشتو', 'پښتو سرلیک')}
                                  placeholder={tx('Pashto label', 'برچسب پشتو', 'پښتو سرلیک')}
                                  className="w-32 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                                />

                                {/* Color picker */}
                                <select
                                  value={btn.color}
                                  onChange={e => updateField('color', e.target.value as any)}
                                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                                >
                                  <option value="primary">{tx('Gold', 'طلایی', 'زرین')}</option>
                                  <option value="amber">{tx('Amber', 'کهربایی', 'امبر')}</option>
                                  <option value="success">{tx('Green', 'سبز', 'شنه')}</option>
                                  <option value="emerald">{tx('Emerald', 'زمردی', 'زمردي')}</option>
                                  <option value="info">{tx('Blue', 'آبی', 'آبي')}</option>
                                  <option value="blue">{tx('Blue', 'آبی', 'آبي')}</option>
                                  <option value="indigo">{tx('Indigo', 'نیلی', 'نیلي')}</option>
                                  <option value="danger">{tx('Red', 'قرمز', 'سور')}</option>
                                  <option value="rose">{tx('Rose', 'گل‌سرخ', 'ګلابي')}</option>
                                  <option value="warning">{tx('Orange', 'نارنجی', 'نارنجي')}</option>
                                  <option value="orange">{tx('Orange', 'نارنجی', 'نارنجي')}</option>
                                  <option value="purple">{tx('Purple', 'بنفش', 'ارغواني')}</option>
                                  <option value="slate">{tx('Slate', 'خاکستری تیره', 'خړ توره')}</option>
                                </select>

                                {/* Shape picker */}
                                <select
                                  value={btn.shape}
                                  onChange={e => updateField('shape', e.target.value as any)}
                                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                                >
                                  <option value="rounded">{tx('Rounded', 'گوشه‌گرد', 'ګرد کونجونه')}</option>
                                  <option value="rounded-xl">{tx('Extra rounded', 'بسیار گوشه‌گرد', 'ډېر ګرد کونجونه')}</option>
                                  <option value="rounded-md">{tx('Medium rounded', 'گوشه‌گرد متوسط', 'منځني ګرد کونجونه')}</option>
                                  <option value="pill">{tx('Pill-shaped', 'کپسولی', 'کپسول بڼه')}</option>
                                  <option value="square">{tx('Square', 'مربعی', 'څلورګوټیز')}</option>
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
                                  {btn.isEnabled ? t("active") : t("disabled")}
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
                        <span>{tx('Flexible voucher, bill, and receipt design studio', 'استودیوی طراحی انعطاف‌پذیر واچرها، بل‌ها و رسیدها', 'د واچرونو، بلونو او رسیدونو د طرح انعطاف منونکې سټوډیو')}</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {tx(
                          'Configure the header, footer, brand color, retention and withholding tax, authenticity QR code, and live preview.',
                          'سربرگ، پاورقی، رنگ سازمانی، کسور تضمین حسن اجرا و مالیات، کُد QR اصالت و پیش‌نمایش زنده را تنظیم کنید.',
                          'سرلیک، پایلیک، د نښې رنګ، د حسن اجرا تضمین او مالیاتي کسرونه، د اصالت QR کوډ او ژوندۍ بېلګه تنظیم کړئ.'
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setBillPreviewType('pv')}
                          className={`px-2.5 py-1.5 rounded-lg transition ${billPreviewType === 'pv' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
                        >
                          {tx('Payment voucher (PV)', 'واچر پرداخت (PV)', 'د تادیې واچر (PV)')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillPreviewType('rv')}
                          className={`px-2.5 py-1.5 rounded-lg transition ${billPreviewType === 'rv' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
                        >
                          {tx('Receipt voucher (RV)', 'واچر دریافت (RV)', 'د ترلاسه کولو واچر (RV)')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillPreviewType('pcv')}
                          className={`px-2.5 py-1.5 rounded-lg transition ${billPreviewType === 'pcv' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
                        >
                          {tx('Petty cash voucher (PCV)', 'واچر تنخواه‌گردان (PCV)', 'د کوچني صندوق واچر (PCV)')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillPreviewType('contractor')}
                          className={`px-2.5 py-1.5 rounded-lg transition ${billPreviewType === 'contractor' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
                        >
                          {tx('Contractor invoice', 'بل پیمانکار', 'د قراردادي بل')}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{tx('Test print', 'چاپ آزمایشی', 'ازمایښتي چاپ')}</span>
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
                          <span>{tx('Document identity and official letterhead', 'هویت و سربرگ رسمی سند', 'د سند پېژند او رسمي سرلیک')}</span>
                        </h4>

                        <div className="space-y-2.5 text-xs">
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">{tx('Company name or letterhead:', 'نام یا سربرگ شرکت:', 'د شرکت نوم یا رسمي سرلیک:')}</label>
                            <input
                              type="text"
                              value={editBillDesign.receiptHeader || ''}
                              onChange={e => setEditBillDesign(p => ({ ...p, receiptHeader: e.target.value }))}
                              placeholder={tx('Negin Kabul Construction and Engineering Company', 'شرکت ساختمانی و مهندسی نگین کابل', 'د نگین کابل ساختماني او انجینري شرکت')}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-500 font-bold mb-1">{tx('Subtitle or business type:', 'زیرعنوان یا نوع فعالیت:', 'فرعي سرلیک یا د فعالیت ډول:')}</label>
                            <input
                              type="text"
                              value={editBillDesign.receiptSubheader || ''}
                              onChange={e => setEditBillDesign(p => ({ ...p, receiptSubheader: e.target.value }))}
                              placeholder={tx('Private limited company · Kabul trade registration', 'شرکت سهامی خاص · شمارهٔ ثبت تجارتی کابل', 'خصوصي محدود شرکت · د کابل د سوداګرۍ ثبت')}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-slate-500 font-bold mb-1">{tx('Tax identification number (TIN):', 'نمبر تشخیصیهٔ مالیاتی (TIN):', 'د مالیې پېژندنې شمېره (TIN):')}</label>
                              <input
                                type="text"
                                value={editBillDesign.taxNumber || ''}
                                onChange={e => setEditBillDesign(p => ({ ...p, taxNumber: e.target.value }))}
                                placeholder="TIN-908234-AF"
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-500 font-bold mb-1">{tx('Company phone:', 'تلفن تماس شرکت:', 'د شرکت د ټیلیفون شمېره:')}</label>
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
                            <label className="block text-slate-500 font-bold mb-1">{tx('Official office address:', 'آدرس رسمی دفتر:', 'د دفتر رسمي پته:')}</label>
                            <input
                              type="text"
                              value={editBillDesign.companyAddress || ''}
                              onChange={e => setEditBillDesign(p => ({ ...p, companyAddress: e.target.value }))}
                              placeholder={tx('Sadarat Square, Kabul, Afghanistan', 'چهارراهی صدارت، کابل، افغانستان', 'صدارت څلورلارې، کابل، افغانستان')}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Design & Color Palette */}
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <Palette className="w-4 h-4 text-amber-500" />
                          <span>{tx('Print color and layout', 'رنگ و قالب چاپی', 'د چاپ رنګ او بڼه')}</span>
                        </h4>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">{tx('Letterhead brand color:', 'رنگ سازمانی سربرگ:', 'د رسمي سرلیک د نښې رنګ:')}</label>
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
                            <label className="block text-slate-500 font-bold mb-1">{tx('Print paper size:', 'اندازهٔ کاغذ چاپ:', 'د چاپ کاغذ کچه:')}</label>
                            <select
                              value={editBillDesign.paperSize || 'A4'}
                              onChange={e => setEditBillDesign(p => ({ ...p, paperSize: e.target.value as any }))}
                              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                            >
                              <option value="A4">{tx('A4 (company standard)', 'A4 (استاندارد شرکتی)', 'A4 (د شرکت معیاري کچه)')}</option>
                              <option value="A5">{tx('A5 (half-page receipt)', 'A5 (نیم‌صفحهٔ رسید)', 'A5 (د رسید نیم مخ)')}</option>
                              <option value="Letter">{tx('Letter size', 'اندازهٔ Letter', 'د Letter کچه')}</option>
                              <option value="Thermal80mm">{tx('80 mm thermal paper', 'کاغذ حرارتی ۸۰ میلی‌متری', '۸۰ ملي‌متر حرارتي کاغذ')}</option>
                            </select>
                          </div>
                        </div>

                        {/* Presets */}
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] text-slate-400">{tx('Popular colors:', 'رنگ‌های پرکاربرد:', 'ډېر کارېدونکي رنګونه:')}</span>
                          {[
                            { name: tx('Navy', 'سرمه‌ای', 'سمندري شین'), color: '#0f172a' },
                            { name: tx('Emerald', 'زمردی', 'زمردي'), color: '#065f46' },
                            { name: tx('Indigo', 'نیلی', 'نیلي'), color: '#3730a3' },
                            { name: tx('Gold', 'طلایی', 'زرین'), color: '#b45309' },
                            { name: tx('Burgundy', 'زرشکی', 'زرشکي'), color: '#991b1b' },
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
                          <span>{tx('Construction and engineering accounting options', 'گزینه‌های حسابداری ساختمانی و مهندسی', 'د ساختماني او انجینري محاسبې غوراوي')}</span>
                        </h4>

                        <div className="space-y-2 text-xs">
                          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {tx('Show the 10% retention deduction', 'نمایش کسر ۱۰٪ تضمین حسن اجرا', 'د ۱۰٪ د حسن اجرا تضمین کسر وښایئ')}
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
                              {tx('Show 2% or 7% business-receipts tax withholding (BRT)', 'نمایش کسر مالیات بر عواید تجارتی ۲٪ یا ۷٪ (BRT)', 'د ۲٪ یا ۷٪ د سوداګریزو عوایدو مالیاتي کسر (BRT) وښایئ')}
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
                              {tx('Show the document authenticity QR code', 'نمایش کُد QR اصالت سند', 'د سند د اصالت QR کوډ وښایئ')}
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
                              {tx('Two signature lines (accountant / project manager) and stamp area', 'جای دو امضا (محاسب / مدیر پروژه) و محل مهر', 'دوه لاسلیک ځایونه (محاسب / د پروژې مدیر) او د مهر ځای')}
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
                              {tx('Show an official watermark behind the document', 'نمایش نشان رسمی پس‌زمینهٔ سند', 'د سند په شالید کې رسمي واټرمارک وښایئ')}
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
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">{tx('Document terms and footer', 'شرایط و پاورقی سند', 'د سند شرایط او پایلیک')}</h4>
                        <div className="space-y-2 text-xs">
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">{tx('Payment and settlement terms:', 'شرایط پرداخت و تسویه:', 'د تادیې او تصفیې شرایط:')}</label>
                            <textarea
                              rows={2}
                              value={editBillDesign.termsAndConditions || ''}
                              onChange={e => setEditBillDesign(p => ({ ...p, termsAndConditions: e.target.value }))}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">{tx('Footer text:', 'متن پاورقی:', 'د پایلیک متن:')}</label>
                            <input
                              type="text"
                              value={editBillDesign.receiptFooter || ''}
                              onChange={e => setEditBillDesign(p => ({ ...p, receiptFooter: e.target.value }))}
                              placeholder={tx('Kabul, Afghanistan · All financial rights reserved.', 'کابل، افغانستان · تمامی حقوق مالی محفوظ است.', 'کابل، افغانستان · ټول مالي حقونه خوندي دي.')}
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
                            {tx('Live print preview', 'پیش‌نمایش زندهٔ چاپ', 'د چاپ ژوندۍ بېلګه')} ({editBillDesign.paperSize || 'A4'})
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
                              {tx('OFFICIAL VOUCHER', 'واچر رسمی', 'رسمي واچر')}
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
                                  alt={tx('Company logo', 'لوگوی شرکت', 'د شرکت لوګو')}
                                  className="w-12 h-12 rounded-xl object-cover bg-white p-1"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-lg">
                                  NSC
                                </div>
                              )}
                              <div>
                                <h1 className="text-base font-black">
                                  {editBillDesign.receiptHeader || editCompanyName || tx('Negin Kabul Construction Company', 'شرکت ساختمانی نگین کابل', 'د نگین کابل ساختماني شرکت')}
                                </h1>
                                <p className="text-[10px] text-white/80">
                                  {editBillDesign.receiptSubheader || tx('Private limited company · Kabul trade registration', 'شرکت سهامی خاص · شمارهٔ ثبت تجارتی کابل', 'خصوصي محدود شرکت · د کابل د سوداګرۍ ثبت')}
                                </p>
                                <p className="text-[10px] text-white/70 font-mono">
                                  {tx('TIN:', 'شماره تشخیصیه:', 'د مالیې شمېره:')} {editBillDesign.taxNumber || 'TIN-908234-AF'} | {editBillDesign.receiptContact || '0783788278'}
                                </p>
                              </div>
                            </div>

                            <div className="text-left font-mono">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-black uppercase">
                                {billPreviewType === 'rv'
                                  ? tx('Receipt voucher (RV)', 'واچر دریافت (RV)', 'د ترلاسه کولو واچر (RV)')
                                  : billPreviewType === 'pv'
                                    ? tx('Payment voucher (PV)', 'واچر پرداخت (PV)', 'د تادیې واچر (PV)')
                                    : billPreviewType === 'pcv'
                                      ? tx('Petty cash voucher (PCV)', 'واچر تنخواه‌گردان (PCV)', 'د کوچني صندوق واچر (PCV)')
                                      : tx('Contractor invoice', 'صورت‌وضعیت پیمانکار', 'د قراردادي صورت‌حساب')}
                              </span>
                              <div className="text-[11px] font-bold mt-1">
                                {tx('No:', 'شماره:', 'شمېره:')} {billPreviewType.toUpperCase()}-2026-0891
                              </div>
                              <div className="text-[10px] text-white/80">
                                {tx('Date:', 'تاریخ:', 'نېټه:')} {new Date().toISOString().split('T')[0]}
                              </div>
                            </div>
                          </div>

                          {/* Voucher Meta Info */}
                          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] mb-4">
                            <div>
                              <span className="text-slate-500 block">{tx('Building project:', 'پروژه ساختمانی:', 'د ودانیزې پروژې نوم:')}</span>
                              <span className="font-bold text-slate-800">{tx('Negin Kabul Commercial Tower (Phase 2)', 'برج تجارتی نگین کابل (فاز ۲)', 'د نگین کابل سوداګریز برج (۲ پړاو)')}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">
                                {billPreviewType === 'rv' ? tx('Received from:', 'دریافت شده از:', 'ترلاسه شوی له:') : tx('Paid to:', 'پرداخت شده به:', 'تادیه شوی ورته:')}
                              </span>
                              <span className="font-bold text-slate-800">{tx('Rahimi Brothers Building Materials Supply Company', 'شرکت تدارکات مصالح برادران رحیمی', 'د رحیمي وروڼو د ساختماني موادو رسولو شرکت')}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">{tx('Purpose / description:', 'بابت / شرح عملیات:', 'موخه / د کار تشریح:')}</span>
                              <span className="font-semibold text-slate-700">{tx('Supply of 500 bags of Ghori Type 2 cement, including offloading', 'تأمین ۵۰۰ خریطه سیمان غوری نوع ۲ همراه با کرایهٔ تخلیه', 'د غوري دویم ډول سیمنټو ۵۰۰ بوجۍ برابرول، د ښکته کولو له کرایې سره')}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">{tx('Account / source:', 'حساب معین / منبع:', 'ځانګړی حساب / سرچینه:')}</span>
                              <span className="font-semibold text-slate-700">{tx('Project current account at Kabul Bank', 'حساب جاری پروژه در کابل‌بانک', 'د کابل بانک د پروژې جاري حساب')}</span>
                            </div>
                          </div>

                          {/* Line Items Table */}
                          <table className="w-full text-right border-collapse mb-4 text-[11px]">
                            <thead>
                              <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-700 font-bold">
                                <th className="p-2">#</th>
                                <th className="p-2">{tx('Item or service description', 'شرح کالا یا خدمات', 'د توکي یا خدمت تشریح')}</th>
                                <th className="p-2 text-center">{tx('Quantity', 'مقدار', 'اندازه')}</th>
                                <th className="p-2 text-left">{tx('Unit price (AFN)', 'قیمت فی (AFN)', 'د واحد بیه (AFN)')}</th>
                                <th className="p-2 text-left">{tx('Total (AFN)', 'مجموع (AFN)', 'ټول (AFN)')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              <tr>
                                <td className="p-2 font-mono">1</td>
                                <td className="p-2 font-semibold">{tx('Ghori Portland cement, 50 kg bag', 'سیمان پورتلند غوری، خریطهٔ ۵۰ کیلویی', 'د غوري پورټلنډ سیمنټ، ۵۰ کیلوګرامه بوجۍ')}</td>
                                <td className="p-2 text-center font-mono">{tx('500 bags', '۵۰۰ خریطه', '۵۰۰ بوجۍ')}</td>
                                <td className="p-2 text-left font-mono">380</td>
                                <td className="p-2 text-left font-mono font-bold">190,000</td>
                              </tr>
                              <tr>
                                <td className="p-2 font-mono">2</td>
                                <td className="p-2 font-semibold">{tx('Truck rental and unloading labor at the site', 'کرایهٔ لاری و کارگر تخلیه در ساحهٔ کارگاه', 'د کارځای د بار ښکته کولو کارګرانو او لارۍ کرایه')}</td>
                                <td className="p-2 text-center font-mono">{tx('1 service', '۱ خدمت', '۱ خدمت')}</td>
                                <td className="p-2 text-left font-mono">10,000</td>
                                <td className="p-2 text-left font-mono font-bold">10,000</td>
                              </tr>
                            </tbody>
                          </table>

                          {/* Financial Calculations Box (Retention + Tax Deductions) */}
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 mb-4 text-[11px]">
                            <div className="flex justify-between items-center text-slate-600">
                              <span>{tx('Gross amount:', 'مبلغ کل ناخالص:', 'ټوله ناخالصه اندازه:')}</span>
                              <span className="font-mono font-bold">{tx('200,000 AFN', '۲۰۰٬۰۰۰ افغانی', '۲۰۰٬۰۰۰ افغانۍ')}</span>
                            </div>

                            {editBillDesign.showRetentionBox !== false && (
                              <div className="flex justify-between items-center text-amber-700 font-semibold">
                                <span>{tx('10% retention deduction:', 'کسر ۱۰٪ تضمین حسن اجرا:', 'د حسن اجرا د تضمین ۱۰٪ کسر:')}</span>
                                <span className="font-mono">{tx('-20,000 AFN', '−۲۰٬۰۰۰ افغانی', '−۲۰٬۰۰۰ افغانۍ')}</span>
                              </div>
                            )}

                            {editBillDesign.showWithholdingTax !== false && (
                              <div className="flex justify-between items-center text-rose-700 font-semibold">
                                <span>{tx('Business-receipts tax withholding (BRT 2%):', 'کسر مالیات عواید تجارتی (BRT) به نرخ ۲٪:', 'د سوداګریزو عوایدو ۲٪ مالیاتي کسر (BRT):')}</span>
                                <span className="font-mono">{tx('-4,000 AFN', '−۴٬۰۰۰ افغانی', '−۴٬۰۰۰ افغانۍ')}</span>
                              </div>
                            )}

                            <div className="pt-2 border-t border-slate-300 flex justify-between items-center font-black text-sm text-slate-900">
                              <span>{tx('Net payable:', 'خالص قابل پرداخت:', 'خالص تادیه کېدونکې اندازه:')}</span>
                              <span
                                className="font-mono text-base px-2 py-0.5 rounded-lg text-white"
                                style={{ backgroundColor: editBillDesign.primaryColor || '#0f172a' }}
                              >
                                {editBillDesign.showRetentionBox !== false && editBillDesign.showWithholdingTax !== false
                                  ? tx('176,000 AFN', '۱۷۶٬۰۰۰ افغانی', '۱۷۶٬۰۰۰ افغانۍ')
                                  : editBillDesign.showRetentionBox !== false
                                    ? tx('180,000 AFN', '۱۸۰٬۰۰۰ افغانی', '۱۸۰٬۰۰۰ افغانۍ')
                                    : tx('200,000 AFN', '۲۰۰٬۰۰۰ افغانی', '۲۰۰٬۰۰۰ افغانۍ')}
                              </span>
                            </div>
                          </div>

                          {/* Terms & Conditions */}
                          {editBillDesign.termsAndConditions && (
                            <div className="p-2.5 rounded-xl bg-slate-100 text-[10px] text-slate-600 mb-4 leading-relaxed">
                              <span className="font-bold text-slate-800 block mb-0.5">{tx('Terms and notes:', 'شرایط و ملاحظات:', 'شرایط او یادښتونه:')}</span>
                              {editBillDesign.termsAndConditions}
                            </div>
                          )}

                          {/* Signatures & Stamp & QR Section */}
                          <div className="flex items-end justify-between pt-2 border-t border-slate-200">
                            {/* Dual Signatures */}
                            {editBillDesign.showStampSignature !== false ? (
                              <div className="grid grid-cols-2 gap-6 text-center text-[10px]">
                                <div>
                                  <span className="text-slate-500 block mb-6">{tx('Accountant and cashier signature:', 'امضای محاسب و صندوق‌دار:', 'د محاسب او صندوقدار لاسلیک:')}</span>
                                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-700">
                                    {tx('Finance signature', 'امضای امور مالی', 'د مالي برخې لاسلیک')}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-slate-500 block mb-6">{tx('Supervisor engineer / manager approval:', 'تأیید مهندس ناظر / مدیر:', 'د څارونکي انجینر / مدیر تایید:')}</span>
                                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-700">
                                    {tx('Project management signature', 'امضای مدیریت پروژه', 'د پروژې د مدیریت لاسلیک')}
                                  </div>
                                </div>
                              </div>
                            ) : <div />}

                            {/* Official Stamp Box */}
                            <div className="flex items-center gap-3">
                              {editBillDesign.showStampSignature !== false && (
                                <div className="w-16 h-16 rounded-full border-2 border-dashed border-rose-500/60 flex flex-col items-center justify-center text-[8px] font-black text-rose-500 rotate-[-12deg]">
                                  <span>{tx('Official stamp', 'مهر رسمی', 'رسمي مهر')}</span>
                                  <span>{tx('Approved', 'تأیید شد', 'تایید شو')}</span>
                                </div>
                              )}

                              {/* QR Code */}
                              {editBillDesign.showQrCode !== false && (
                                <div className="p-1.5 bg-white border border-slate-300 rounded-xl shadow-xs text-center">
                                  <QrCode className="w-10 h-10 text-slate-800 mx-auto" />
                                  <span className="text-[8px] font-mono block text-slate-500 mt-0.5">{tx('Document authenticity', 'اصالت سند', 'د سند اصالت')}</span>
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
                        <label className="block text-slate-500 font-bold mb-1">{tx('Subscription expiry date:', 'تاریخ انقضای اشتراک:', 'د ګډون د پای نېټه:')}</label>
                        <input
                          type="date"
                          value={editExpiresAt}
                          onChange={(e) => setEditExpiresAt(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-900 font-mono"
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        <span className="text-[11px] text-slate-500 mb-1">{tx('Quick subscription extension:', 'تمدید سریع اشتراک:', 'ګډون ژر غځول:')}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickCharge(6)}
                            className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold text-xs rounded-xl shadow-xs transition-colors"
                          >{t("charge6Months")}</button>
                          <button
                            type="button"
                            onClick={() => handleQuickCharge(12)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold text-xs rounded-xl shadow-xs transition-colors"
                          >{t("charge1Year")}</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{tx('Lock or unlock company account', 'قفل یا بازکردن حساب شرکت', 'د شرکت حساب تړل یا خلاصول')}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{tx('A locked account cannot sign in.', 'اگر حساب قفل باشد، ورود به آن ممکن نیست.', 'که حساب تړلی وي، ننوتل ورته ناشوني دي.')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleTenantLock}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        selectedTenant.isLockedBySuperAdmin 
                          ? 'bg-rose-600 hover:bg-rose-500 text-slate-900' 
                          : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {selectedTenant.isLockedBySuperAdmin
                        ? tx('Account is locked (click to unlock)', 'حساب قفل است (برای بازکردن کلیک کنید)', 'حساب تړلی دی (د خلاصولو لپاره کلیک وکړئ)')
                        : tx('Account is active (click to lock)', 'حساب فعال است (برای قفل‌کردن کلیک کنید)', 'حساب فعال دی (د تړلو لپاره کلیک وکړئ)')}
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
                <span>{tx('Sign in as this user', 'ورود به حساب از دید این کاربر', 'د دې کارن په توګه ننوتل')}</span>
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTenant(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-300 text-slate-600 text-xs font-bold"
                >{t("cancel")}</button>
                <button
                  type="button"
                  onClick={() => handleSaveTenantChanges()}
                  className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-900 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{t("saveChanges")}</span>
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
                { id: 'dashboard', label: tx('Monitoring dashboard', 'داشبورد نظارت', 'د څارنې ډشبورډ'), icon: LayoutDashboard },
                { id: 'owners', label: tx('Owners and employees', 'مالک‌ها و کارمندان', 'مالکان او کارکوونکي'), icon: Crown },
                { id: 'security', label: tx('Security and passwords', 'امنیت و رمز', 'امنیت او پټنومونه'), icon: KeyRound },
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
                    { label: tx('Company owners', 'مالک‌های شرکت', 'د شرکت مالکان'), value: ownerList.length, icon: Crown, grad: 'from-indigo-500 to-violet-500', chip: 'shadow-indigo-500/30' },
                    { label: tx('Employees total', 'مجموع کارمندان', 'ټول کارکوونکي'), value: staffList.length, icon: Users, grad: 'from-cyan-500 to-sky-500', chip: 'shadow-cyan-500/30' },
                    { label: tx('Active subscriptions', 'اشتراک‌های فعال', 'فعال ګډونونه'), value: tenantUsers.filter(u => !u.isLockedBySuperAdmin && (!u.subscriptionExpiresAt || new Date(u.subscriptionExpiresAt).getTime() >= Date.now())).length, icon: CheckCircle2, grad: 'from-emerald-500 to-teal-500', chip: 'shadow-emerald-500/30' },
                    { label: tx('Events today', 'رویدادهای امروز', 'د نن ورځې پېښې'), value: eventsToday.length, icon: Activity, grad: 'from-amber-500 to-orange-500', chip: 'shadow-amber-500/30' },
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
                        <h4 className="text-sm font-black text-slate-800">{tx('System activity — last 7 days', 'فعالیت سیستم — ۷ روز اخیر', 'د سیستم فعالیت — د تېرو ۷ ورځو')}</h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{activityEvents.length} {tx('recorded events', 'رویداد ثبت‌شده', 'ثبت شوې پېښې')}</span>
                    </div>
                    {activityEvents.length === 0 ? (
                      <p className="text-xs text-slate-400 py-10 text-center">{tx('No activity has been recorded yet. This chart will populate as users work.', 'هنوز فعالیتی ثبت نشده است؛ با استفادهٔ کاربران، نمودار به‌روز می‌شود.', 'تر اوسه فعالیت نه ده ثبت شوې؛ د کارنانو په کارولو سره به دا چارټ ډک شي.')}</p>
                    ) : (
                      <MiniArea data={last7Days} />
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-black text-slate-800 mb-2">{tx('Most-used sections', 'بخش‌های پراستفاده', 'تر ټولو ډېر کارېدونکې برخې')}</h4>
                    {featureUsage.length === 0 ? (
                      <p className="text-xs text-slate-400 py-10 text-center">{tx('Usage ranking will appear here when users start opening sections.', 'وقتی کاربران از بخش‌ها استفاده کنند، پربازدیدترین بخش‌ها در اینجا نمایش می‌شود.', 'کله چې کارنان برخې وکاروي، د ډېر کارېدونکو برخو لړلیک به دلته ښکاره شي.')}</p>
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
                      <h4 className="text-sm font-black text-slate-800">{tx('Most active users — actions and time spent', 'کاربران فعال — نوع فعالیت و مدت استفاده', 'ډېر فعال کارنان — کړنې او د کار وخت')}</h4>
                    </div>
                    {userUsage.length === 0 ? (
                      <p className="text-xs text-slate-400 p-6 text-center">{tx('This table will fill after the first user sign-in and activity.', 'پس از نخستین ورود و فعالیت کاربران، این جدول نمایش داده می‌شود.', 'د کارنانو له لومړي ننوتلو او فعالیت وروسته به دا جدول ډک شي.')}</p>
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
                                {tx('Most used:', 'بیشترین استفاده:', 'تر ټولو ډېر کارېدلی:')} <span className="font-bold text-indigo-600">{u.topFeature}</span>
                              </p>
                            </div>
                            <div className="text-left shrink-0">
                              <p className="text-[11px] font-mono font-bold text-slate-700 flex items-center gap-1 justify-end">
                                <Timer className="w-3.5 h-3.5 text-emerald-500" />
                                {u.approxMinutes} {tx('minutes', 'دقیقه', 'دقیقې')}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {tx('Last:', 'آخرین:', 'وروستی:')} {new Date(u.lastActiveAt).toLocaleTimeString(intlLocaleFor(language), { hour: '2-digit', minute: '2-digit' })}
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
                      <h4 className="text-sm font-black text-slate-800">{tx('Recent activity (live)', 'فعالیت‌های تازه (زنده)', 'وروستي فعالیتونه (ژوندي)')}</h4>
                    </div>
                    {recentActivity.length === 0 ? (
                      <p className="text-xs text-slate-400 p-6 text-center">{tx('No activity yet.', 'هنوز فعالیتی ثبت نشده است.', 'تر اوسه هېڅ فعالیت نشته.')}</p>
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
                                {ev.userName} — {ev.kind === 'login'
                                  ? tx('Signed in', 'وارد سیستم شد', 'سیستم ته ننوتل')
                                  : ev.kind === 'logout'
                                    ? tx('Signed out', 'از سیستم خارج شد', 'له سیسټم څخه ووتل')
                                    : `${tx('Opened:', 'باز کرد:', 'پرانیستل:')} ${getTabLabel(ev.feature || '')}`}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {new Date(ev.timestamp).toLocaleDateString(intlLocaleFor(language))} · {new Date(ev.timestamp).toLocaleTimeString(intlLocaleFor(language), { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">{tx('Owners total:', 'کل مالک‌ها:', 'ټول مالکان:')}</span>
                    <span className="text-xl font-black text-slate-900 font-mono">{ownerList.length}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">{tx('Employees total:', 'کل کارمندان:', 'ټول کارکوونکي:')}</span>
                    <span className="text-xl font-black text-slate-900 font-mono">{staffList.length}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-[10px] text-emerald-600 uppercase font-bold block mb-1">{tx('Active subscriptions:', 'اشتراک‌های فعال:', 'فعال ګډونونه:')}</span>
                    <span className="text-xl font-black text-emerald-600 font-mono">
                      {tenantUsers.filter(u => !u.isLockedBySuperAdmin && (!u.subscriptionExpiresAt || new Date(u.subscriptionExpiresAt).getTime() >= Date.now())).length}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-[10px] text-cyan-600 uppercase font-bold block mb-1">{tx('AI enabled:', 'هوش مصنوعی فعال:', 'مصنوعي ځیرکتیا فعاله:')}</span>
                    <span className="text-xl font-black text-cyan-600 font-mono">
                      {tenantUsers.filter(u => u.permissions?.aiEnabled !== false).length}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-[10px] text-rose-500 uppercase font-bold block mb-1">{tx('Expired / locked:', 'منقضی / قفل:', 'پای ته رسېدلي / تړلي:')}</span>
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
                      placeholder={tx('Search company, administrator, email, or phone...', 'جستجوی نام شرکت، مدیر، ایمیل یا تیلیفون...', 'د شرکت، مدیر، برېښنالیک یا ټیلیفون نوم ولټوئ...')}
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
                      <span>{showNewOwnerForm ? tx('Close form', 'بستن فورم', 'فورمه تړل') : tx('New owner', 'مالک جدید', 'نوی مالک')}</span>
                  </button>
                </div>

                {showNewOwnerForm && (
                  <form onSubmit={handleCreateOwner} className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 text-emerald-700 text-xs font-black">
                      <Crown className="w-4 h-4" />
                      <span>{tx('Create a new company-owner account; the owner can add employee accounts later.', 'ساخت حساب مالک شرکت جدید؛ مالک بعداً می‌تواند برای کارمندان خود حساب کاربری بسازد.', 'د شرکت د نوي مالک حساب جوړ کړئ؛ مالک وروسته د خپلو کارکوونکو لپاره حسابونه جوړولی شي.')}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {([
                        { key: 'name', label: tx('Owner name', 'نام مالک', 'د مالک نوم'), ph: tx('Haji Ahmad Shah', 'حاجی احمد شاه', 'حاجي احمد شاه') },
                        { key: 'username', label: tx('Username', 'نام کاربری', 'کارن-نوم'), ph: tx('e.g. ahmadshah', 'مثلاً ahmadshah', 'لکه ahmadshah') },
                        { key: 'password', label: t("password"), ph: tx('Enter a password', 'رمز عبور جدید را وارد کنید', 'نوی پټنوم دننه کړئ'), type: 'password' },
                        { key: 'email', label: tx('Email', 'ایمیل', 'برېښنالیک'), ph: tx('owner@company.com', 'owner@company.com', 'owner@company.com'), type: 'email' },
                        { key: 'phone', label: tx('Phone', 'تیلیفون', 'ټیلیفون'), ph: tx('Example: +93...', 'مثلاً +93...', 'بېلګه: +93...') },
                        { key: 'companyName', label: tx('Company name', 'نام شرکت', 'د شرکت نوم'), ph: tx('Ahmad Shah Construction Company', 'شرکت ساختمانی احمدشاه', 'د احمدشاه ساختماني شرکت') },
                        { key: 'companyAddress', label: tx('Company address', 'آدرس شرکت', 'د شرکت پته'), ph: tx('Kabul, Afghanistan', 'کابل، افغانستان', 'کابل، افغانستان') },
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
                        <label className="text-[10px] font-bold text-slate-500">{tx('Subscription plan', 'طرح اشتراک', 'د ګډون پلان')}</label>
                        <select
                          value={newOwner.subscriptionPlan || 'trial'}
                          onChange={e => setNewOwner(prev => ({ ...prev, subscriptionPlan: e.target.value as User['subscriptionPlan'] }))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="trial">{tx('Trial', 'آزمایشی', 'ازمایښتي')}</option>
                          <option value="6_months">{tx('6 months', '۶ ماهه', '۶ میاشتې')}</option>
                          <option value="1_year">{tx('1 year', '۱ ساله', '۱ کال')}</option>
                          <option value="lifetime">{tx('Lifetime', 'دائمی', 'د تل لپاره')}</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">{tx('Subscription expiry date (optional)', 'تاریخ انقضای اشتراک (اختیاری)', 'د ګډون د پای نېټه (اختیاري)')}</label>
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
                        <span>{tx('Create owner account', 'ساخت حساب مالک', 'د مالک حساب جوړول')}</span>
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
                      {tx('No company found.', 'هیچ شرکتی پیدا نشد.', 'هېڅ شرکت ونه موندل شو.')}
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
                                    <span>{staff.length} {tx('employees under this owner', 'کارمند زیر این مالک', 'د دې مالک کارکوونکي')}</span>
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
                            <span>{tx('Employees / accounts without an assigned owner', 'کارمندان / حساب‌های بدون مالک مشخص', 'کارکوونکي / حسابونه چې مالک ورته نه وي ټاکل شوی')}</span>
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
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-indigo-600" />
                    <h4 className="text-sm font-black text-slate-800">{tx('Master session security', 'امنیت نشست ماستر', 'د ماستر د ناستې امنیت')}</h4>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {tx(
                      'Access is controlled by the authenticated server account and a revocable HttpOnly session. Shared browser gate keys and fallback passwords are disabled.',
                      'دسترسی با حساب تأییدشدهٔ سرور و نشست HttpOnly قابل لغو کنترول می‌شود. کلیدهای مشترک ورود در مرورگر و رمزهای جایگزین غیرفعال‌اند.',
                      'لاسرسی د تصدیق شوي سرور حساب او د لغوه کېدونکي HttpOnly ناستې له لارې کنټرولېږي. د براوزر ګډې کیلي او بدیل پټنومونه بند دي.'
                    )}
                  </p>
                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 leading-relaxed">
                    {tx(
                      'Password changes and account recovery must use a verified server-side account-management flow. These controls are not yet available in this panel.',
                      'تغییر رمز عبور و بازیابی حساب باید از مسیر مدیریت حساب تأییدشده در سرور انجام شود. این گزینه‌ها هنوز در این پنل موجود نیستند.',
                      'د پټنوم بدلول او د حساب بېرته ترلاسه کول باید د سرور له تایید شوې حساب‌مدیریت لارې ترسره شي. دا کنټرولونه لا په دې پینل کې نشته.'
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
