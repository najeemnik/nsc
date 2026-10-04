import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { User } from '../types';
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
  HardHat
} from 'lucide-react';

interface MasterAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MasterAdminModal: React.FC<MasterAdminModalProps> = ({ isOpen, onClose }) => {
  const { 
    users, 
    projects, 
    chargeUserSubscription, 
    toggleLockUserBySuperAdmin, 
    toggleAiForUser, 
    updateTenantByMasterAdmin,
    impersonateTenant,
    t 
  } = useApp();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [securityPassword, setSecurityPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'locked' | 'ai'>('all');

  const [selectedTenant, setSelectedTenant] = useState<User | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'profile' | 'modules' | 'bill' | 'subscription'>('profile');

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
  });

  const [editAiEnabled, setEditAiEnabled] = useState(true);
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

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

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingSecs = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setAuthError(`دسترسی برای ${remainingSecs} ثانیه مسدود است.`);
      return;
    }

    const cleanPwd = securityPassword.trim();
    const validMasterKeys = [
      'nik@master2026', 
      '0093783788278', 
      'najeemnik@2026',
      'password123'
    ];

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
    });

    setEditAiEnabled(user.permissions?.aiEnabled !== false);
    setEditExpiresAt(user.subscriptionExpiresAt ? user.subscriptionExpiresAt.split('T')[0] : '');
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
      customBillDesign: {
        receiptHeader: editReceiptHeader.trim() || undefined,
        receiptFooter: editReceiptFooter.trim() || undefined,
        receiptContact: editReceiptContact.trim() || undefined,
        taxNumber: editTaxNumber.trim() || undefined,
      },
      customEnabledModules: editModules,
      aiEnabled: editAiEnabled,
      subscriptionExpiresAt: editExpiresAt ? new Date(editExpiresAt).toISOString() : undefined,
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

  const handleClose = () => {
    setIsAuthenticated(false);
    setSecurityPassword('');
    setAuthError(null);
    setSelectedTenant(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in">
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-white font-vazir">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-black shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white">
                  پورتال مدیریت ارشد احمد نجیم نیک (Super Admin Master)
                </h2>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  کنترل کل دیتابیس
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                nik-smartcount.com - دسترسی مستقیم به شرکت‌ها، ماژول‌ها و اشتراک‌ها
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SCREEN 1: Authentication Screen */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-3xl shadow-xl shadow-amber-500/10">
              <KeyRound className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white">ورود محرمانه به پنل ماستر</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                لطفاً کلید امنیتی اختصاصی خود (احمد نجیم نیک) را جهت احراز هویت وارد فرمایید.
              </p>
            </div>

            {authError && (
              <div className="w-full p-3 bg-rose-950/60 border border-rose-700/60 rounded-xl text-rose-300 text-xs flex items-center gap-2 text-start">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="w-full space-y-4">
              <div>
                <input
                  type="password"
                  required
                  autoFocus
                  value={securityPassword}
                  onChange={(e) => setSecurityPassword(e.target.value)}
                  placeholder="کلید امنیتی ماستر..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-center font-mono text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>احراز هویت و ورود</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-[11px] text-slate-500 font-mono">
              IP & Master Session Logged - AES-256 Protected
            </div>
          </div>
        ) : selectedTenant ? (
          /* SCREEN 2: Tenant Inspector Modal */
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/95">
            <div className="p-4 bg-slate-950 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTenant(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>بازگشت به لیست</span>
                </button>
                <div className="border-r border-slate-700 pe-3 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">شرکت منتخب:</span>
                  <span className="text-sm font-black text-amber-400">{editCompanyName || editName}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                {[
                  { id: 'profile', label: 'مشخصات شرکت', icon: UserCheck },
                  { id: 'modules', label: 'کنترل ماژول‌ها', icon: Sliders },
                  { id: 'bill', label: 'طراحی رسید و سربرگ', icon: Receipt },
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
                          ? 'bg-amber-600 text-white shadow-xs' 
                          : 'text-slate-400 hover:text-white'
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
              <div className="p-3 bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between px-6 animate-in fade-in">
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
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-amber-400" />
                      <span>مشخصات مدیر و شرکت</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">نام مدیر</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">نام شرکت</label>
                        <input
                          type="text"
                          value={editCompanyName}
                          onChange={(e) => setEditCompanyName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">ایمیل رسمی</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">شماره تماس</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
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
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-amber-500/40 rounded-xl text-white font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {inspectorTab === 'modules' && (
                <div className="space-y-4 max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      { id: 'steel', label: 'سیخ‌گول و آهن‌آلات', desc: 'محاسبات کیلو و تن و قیمت', icon: Layers },
                      { id: 'concrete', label: 'کانکریت و پمپ', desc: 'بچینگ، مکسر و کرایه پمپ', icon: CircleDot },
                      { id: 'expenses', label: 'مصارف روزمره', desc: 'خریدهای عمومی و متفرقه', icon: Receipt },
                      { id: 'contractors', label: 'قراردادی‌ها', desc: 'قراردادها، پیشرفت و حسن نیت', icon: HardHat },
                      { id: 'suppliers', label: 'تأمین‌کنندگان', desc: 'فروشندگان مصالح و طلبکاری', icon: Building2 },
                      { id: 'apartments', label: 'آپارتمان‌ها', desc: 'فروش، متراژ و اقساط', icon: Home },
                      { id: 'payments', label: 'پرداخت و رسید', desc: 'صدور رسید و ثبت چک و بانکی', icon: CreditCard },
                      { id: 'documents', label: 'اسناد و بل‌ها', desc: 'آرشیو تصاویر و اسناد', icon: FileCheck2 },
                      { id: 'reports', label: 'گزارشات A4', desc: 'بیلان چاپی و خروجی اکسل/PDF', icon: BarChart3 },
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
                              ? 'bg-slate-900 border-amber-500/50 shadow-md ring-1 ring-amber-500/30' 
                              : 'bg-slate-950/60 border-slate-800 opacity-50'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isEnabled ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-white">{mod.label}</h4>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                isEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {isEnabled ? 'فعال' : 'غیرفعال'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{mod.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {inspectorTab === 'subscription' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">تاریخ انقضای اشتراک:</label>
                        <input
                          type="date"
                          value={editExpiresAt}
                          onChange={(e) => setEditExpiresAt(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        <span className="text-[11px] text-slate-400 mb-1">شارژ سریع اشتراک:</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickCharge(6)}
                            className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                          >
                            + تمدید ۶ ماه
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickCharge(12)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                          >
                            + تمدید ۱ سال
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">قفل کردن یا بازگشایی حساب شرکت</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">در صورت مسدود بودن، ورود به این حساب ناممکن می‌شود.</p>
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
                          ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                          : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {selectedTenant.isLockedBySuperAdmin ? 'حساب مسدود است (کلیک برای بازگشایی)' : 'حساب فعال است (کلیک برای قفل)'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleImpersonate(selectedTenant)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center gap-2 transition-colors border border-amber-500/20"
              >
                <LogIn className="w-4 h-4" />
                <span>ورود به عنوان این کاربر (Impersonate)</span>
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTenant(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveTenantChanges()}
                  className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>ذخیره تغییرات</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* SCREEN 3: Tenants Master Overview */
          <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">کل شرکت‌ها:</span>
                <span className="text-xl font-black text-white font-mono">{tenantUsers.length}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">اشتراک فعال:</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {tenantUsers.filter(u => !u.isLockedBySuperAdmin && (!u.subscriptionExpiresAt || new Date(u.subscriptionExpiresAt).getTime() >= Date.now())).length}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-cyan-400 uppercase font-bold block mb-1">هوش مصنوعی فعال:</span>
                <span className="text-xl font-black text-cyan-400 font-mono">
                  {tenantUsers.filter(u => u.permissions?.aiEnabled !== false).length}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-rose-400 uppercase font-bold block mb-1">منقضی / قفل شده:</span>
                <span className="text-xl font-black text-rose-400 font-mono">
                  {tenantUsers.filter(u => u.isLockedBySuperAdmin || (u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt).getTime() < Date.now())).length}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی نام شرکت، نام مدیر، ایمیل یا تیلیفون..."
                  className="w-full ps-9 pe-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pe-1">
              {filteredTenants.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800">
                  هیچ شرکتی یافت نشد.
                </div>
              ) : (
                filteredTenants.map(user => {
                  const isLocked = user.isLockedBySuperAdmin;
                  const isExpired = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt).getTime() < Date.now();
                  const remainingDays = user.subscriptionExpiresAt 
                    ? Math.max(0, Math.ceil((new Date(user.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                    : 180;
                  return (
                    <div 
                      key={user.id}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
                          {user.customLogoUrl ? (
                            <img src={user.customLogoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                          ) : (
                            <Building2 className="w-6 h-6" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-black text-white">{user.companyName || user.name}</h4>
                            <span className="text-[10px] text-slate-400">({user.name})</span>
                            
                            {isLocked ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                مسدود شده
                              </span>
                            ) : isExpired ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                منقضی شده
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                فعال ({remainingDays} روز)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1 font-mono">
                            <span>ایمیل: {user.email}</span>
                            {user.phone && <span>تیلیفون: {user.phone}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => handleImpersonate(user)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="ورود به حساب کاربری این شرکت"
                        >
                          <LogIn className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenTenantInspector(user)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>مدیریت شرکت</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
