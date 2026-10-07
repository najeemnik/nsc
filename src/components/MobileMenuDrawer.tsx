/**
 * ============================================================================
 * Mobile Menu Drawer — the full app, one thumb away
 * ============================================================================
 * Mirrors the DESKTOP sidebar design language (same sections, same icon
 * palettes, same token-driven chrome) so mobile looks & feels identical to
 * the laptop experience — just thumb-sized:
 *   • All modules, permission-filtered exactly like the sidebar
 *   • Language switcher + day/night toggle (theme selection lives in Settings only)
 *   • User card + logout (replacing the desktop-only dropdowns)
 * Safe-area aware (iPhone Dynamic Island / home indicator), dvh-sized.
 * ============================================================================
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { Language } from '../types';
import {
  LayoutDashboard,
  Building,
  HardHat,
  Truck,
  Receipt,
  Layers,
  CircleDot,
  Home,
  CreditCard,
  Wallet,
  BookOpen,
  FileCheck2,
  BarChart3,
  History,
  Sliders,
  Users,
  UserCheck,
  Wrench,
  ShieldCheck,
  Lock,
  LogOut,
  Moon,
  Sun,
  X,
} from 'lucide-react';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface DrawerItem {
  id: string;
  label: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  gradient: string;
  locked?: boolean;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({ isOpen, onClose, activeTab, setActiveTab }) => {
  const {
    t,
    language,
    setLanguage,
    currentUser,
    logout,
    isTabAllowed,
    appSettings,
    currentProject,
    isSectionProtected,
    isSectionUnlocked,
    cycleThemeSchedule,
    setIsMasterAdminOpen,
  } = useApp();

  if (!isOpen) return null;

  const enabled = appSettings.enabledModules || {};
  const apartmentsLocked = isSectionProtected('apartments') && !isSectionUnlocked('apartments');
  const isAdmin = currentUser?.role === 'admin' || currentUser?.isMasterSuperAdmin;

  const sections: Array<{ title: string; items: DrawerItem[] }> = [
    {
      title: t.navDashboard,
      items: [
        { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard, iconColor: 'text-sky-600', iconBg: 'bg-sky-500/15', gradient: 'from-sky-500 to-blue-600' },
        { id: 'projects', label: t.navProjects, icon: Building, iconColor: 'text-indigo-600', iconBg: 'bg-indigo-500/15', gradient: 'from-indigo-600 to-purple-600' },
      ],
    },
    {
      title: t.constructionExpenses,
      items: [
        ...(enabled.steel !== false ? [{ id: 'steel', label: t.navSteel, icon: Layers, iconColor: 'text-amber-600', iconBg: 'bg-amber-500/15', gradient: 'from-amber-500 to-orange-600' } as DrawerItem] : []),
        ...(enabled.concrete !== false ? [{ id: 'concrete', label: t.navConcrete, icon: CircleDot, iconColor: 'text-teal-600', iconBg: 'bg-teal-500/15', gradient: 'from-teal-500 to-emerald-600' } as DrawerItem] : []),
        ...(enabled.expenses !== false ? [{ id: 'expenses', label: t.navExpenses, icon: Receipt, iconColor: 'text-rose-600', iconBg: 'bg-rose-500/15', gradient: 'from-rose-500 to-red-600' } as DrawerItem] : []),
        ...(enabled.contractors !== false ? [{ id: 'contractors', label: t.navContractors, icon: HardHat, iconColor: 'text-orange-600', iconBg: 'bg-orange-500/15', gradient: 'from-orange-500 to-amber-600' } as DrawerItem] : []),
        ...(enabled.labor !== false ? [{ id: 'labor', label: t.navLabor, icon: UserCheck, iconColor: 'text-purple-600', iconBg: 'bg-purple-500/15', gradient: 'from-purple-600 to-indigo-600' } as DrawerItem] : []),
        ...(enabled.suppliers !== false ? [{ id: 'suppliers', label: t.navSuppliers, icon: Truck, iconColor: 'text-blue-600', iconBg: 'bg-blue-500/15', gradient: 'from-blue-600 to-indigo-600' } as DrawerItem] : []),
        ...(enabled.assets !== false ? [{ id: 'assets', label: t.navAssets, icon: Wrench, iconColor: 'text-amber-600', iconBg: 'bg-amber-500/15', gradient: 'from-amber-600 to-orange-600' } as DrawerItem] : []),
      ],
    },
    {
      title: t.financialOverview,
      items: [
        ...(enabled.apartments !== false ? [{ id: 'apartments', label: t.navApartments, icon: Home, iconColor: 'text-fuchsia-600', iconBg: 'bg-fuchsia-500/15', gradient: 'from-fuchsia-500 to-pink-600', locked: apartmentsLocked } as DrawerItem] : []),
        ...(enabled.payments !== false ? [{ id: 'payments', label: t.navPayments, icon: CreditCard, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-500/15', gradient: 'from-emerald-600 to-teal-600' } as DrawerItem] : []),
        ...(enabled.budget !== false ? [{ id: 'budget', label: t.navBudget, icon: Wallet, iconColor: 'text-teal-600', iconBg: 'bg-teal-500/15', gradient: 'from-teal-500 to-emerald-600' } as DrawerItem] : []),
        ...(enabled.documents !== false ? [{ id: 'documents', label: t.navDocuments, icon: FileCheck2, iconColor: 'text-cyan-600', iconBg: 'bg-cyan-500/15', gradient: 'from-cyan-600 to-blue-600' } as DrawerItem] : []),
        ...(enabled.reports !== false ? [{ id: 'reports', label: t.navReports, icon: BarChart3, iconColor: 'text-purple-600', iconBg: 'bg-purple-500/15', gradient: 'from-purple-600 to-violet-600' } as DrawerItem] : []),
        ...(enabled.accounting !== false ? [{ id: 'accounting', label: t.navAccounting, icon: BookOpen, iconColor: 'text-violet-600', iconBg: 'bg-violet-500/15', gradient: 'from-violet-600 to-purple-600' } as DrawerItem] : []),
      ],
    },
    ...(isAdmin
      ? [{
          title: t.companySettings,
          items: [
            ...(currentUser?.isMasterSuperAdmin ? [{ id: 'super_admin', label: language === 'en' ? 'Office 7 (Master)' : language === 'ps' ? 'دفتر اووه' : 'دفتر هفت', icon: ShieldCheck, iconColor: 'text-rose-600', iconBg: 'bg-rose-500/15', gradient: 'from-rose-600 to-red-600' } as DrawerItem] : []),
            { id: 'settings', label: t.companySettings, icon: Sliders, iconColor: 'text-amber-600', iconBg: 'bg-amber-500/15', gradient: 'from-amber-600 to-yellow-600' } as DrawerItem,
            { id: 'users', label: t.navUsers, icon: Users, iconColor: 'text-blue-600', iconBg: 'bg-blue-500/15', gradient: 'from-blue-500 to-indigo-600' } as DrawerItem,
            { id: 'audit_logs', label: t.navAuditLogs, icon: History, iconColor: 'text-slate-600', iconBg: 'bg-slate-500/15', gradient: 'from-slate-500 to-slate-700' } as DrawerItem,
          ],
        }]
      : []),
  ];

  const go = (id: string) => {
    if (id === 'super_admin') {
      onClose();
      setIsMasterAdminOpen(true);
      return;
    }
    setActiveTab(id);
    onClose();
  };

  const roleBadge =
    currentUser?.role === 'admin'
      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
      : currentUser?.role === 'accountant'
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

  const roleLabel =
    currentUser?.role === 'admin' ? t.roleAdmin : currentUser?.role === 'accountant' ? t.roleAccountant : t.roleViewer;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute inset-x-0 bottom-0 max-h-dscreen-94 mobile-nav-chrome border-t rounded-t-3xl flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Grabber */}
        <div className="flex justify-center pt-2 pb-1 shrink-0" onClick={onClose}>
          <div className="w-10 h-1 rounded-full bg-ink-muted/30" />
        </div>

        <div className="overflow-y-auto scroll-touch px-4 pb-4 safe-bottom space-y-4">
          {/* User card */}
          <div className="flex items-center gap-3 p-3 rounded-2xl theme-project-card">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0 ${
              currentUser?.role === 'admin' ? 'bg-rose-600' : currentUser?.role === 'accountant' ? 'bg-amber-600' : 'bg-slate-600'
            }`}>
              {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-ink truncate">{currentUser?.name}</p>
              <p className="text-[11px] text-ink-muted truncate">{currentProject?.name || ''}</p>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-lg font-bold uppercase shrink-0 ${roleBadge}`}>
              {roleLabel}
            </span>
            <button onClick={onClose} className="p-2 text-ink-muted hover:text-ink rounded-xl transition shrink-0" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Language + Day/Night */}
          <div className="flex items-center gap-2">
            <div className="flex-1 grid grid-cols-3 gap-1 p-1 bg-surface-2/80 border border-line rounded-2xl">
              {([['fa', 'دری'], ['ps', 'پښتو'], ['en', 'EN']] as Array<[Language, string]>).map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`py-2 rounded-xl text-xs font-bold transition tap-target ${
                    language === code ? 'mobile-nav-item-active shadow-xs' : 'text-ink-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={cycleThemeSchedule}
              className="tap-target px-3.5 rounded-2xl border border-line bg-surface-2/80 text-ink hover:bg-surface-2 transition flex items-center justify-center"
              title={t('themeScheduleAuto') || 'Day / Night'}
            >
              {appSettings.darkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>
          </div>

          {/* Nav sections — mirror of desktop sidebar */}
          {sections.map(section => {
            const items = section.items.filter(i => isTabAllowed(i.id));
            if (items.length === 0) return null;
            return (
              <div key={section.title}>
                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5 px-1">{section.title}</p>
                <div className="grid grid-cols-3 gap-2">
                  {items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => go(item.id)}
                        className={`relative flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border transition active:scale-95 ${
                          isActive
                            ? `bg-gradient-to-br ${item.gradient} text-white border-transparent shadow-lg`
                            : 'bg-surface-2/60 border-line text-ink'
                        }`}
                      >
                        <span className={`p-2 rounded-xl ${isActive ? 'bg-white/20' : item.iconBg}`}>
                          <Icon className={`w-5 h-5 ${isActive ? 'text-white' : item.iconColor}`} />
                        </span>
                        <span className={`text-[10px] font-bold leading-tight text-center line-clamp-2 ${isActive ? 'text-white' : ''}`}>
                          {item.label}
                        </span>
                        {item.locked && (
                          <Lock className="w-3 h-3 text-(--color-accent) absolute top-1.5 end-1.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Logout */}
          <button
            onClick={() => { onClose(); logout(); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-black transition active:scale-95 tap-target"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.logout}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
