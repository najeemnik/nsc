import React from 'react';
import { useApp } from '../context/AppContext';
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
  FileCheck2, 
  BarChart3, 
  History, 
  Lock, 
  Unlock, 
  Sliders, 
  Moon, 
  Sun,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Users,
  ShieldCheck,
  Cloud
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSystemGuide?: () => void;
}

interface NavItemConfig {
  id: string;
  label: string;
  icon: any;
  colorName: string;
  iconColor: string;
  iconBgLight: string;
  iconBgDark: string;
  borderColorLight: string;
  borderColorDark: string;
  activeGradient: string;
  activeShadow: string;
  isProtected?: boolean;
  isUnlocked?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onOpenSystemGuide }) => {
  const { 
    t, 
    currentUser, 
    currentProject, 
    isApartmentsUnlocked, 
    appSettings, 
    toggleDarkMode, 
    language,
    isTabAllowed,
    isSectionProtected,
    isSectionUnlocked,
    isGoogleDriveConnected
  } = useApp();

  const enabled = appSettings.enabledModules || {};
  const isRtl = language === 'fa' || language === 'ps';

  const sections: Array<{ title: string; items: NavItemConfig[] }> = [
    {
      title: t.navDashboard,
      items: [
        { 
          id: 'dashboard', 
          label: t.navDashboard, 
          icon: LayoutDashboard,
          colorName: 'sky',
          iconColor: 'text-sky-600 dark:text-sky-300',
          iconBgLight: 'bg-sky-500/15',
          iconBgDark: 'dark:bg-sky-500/25',
          borderColorLight: 'border-sky-200',
          borderColorDark: 'dark:border-sky-500/30',
          activeGradient: 'from-sky-500 to-blue-600',
          activeShadow: 'shadow-sky-500/35'
        },
        { 
          id: 'projects', 
          label: t.navProjects, 
          icon: Building,
          colorName: 'indigo',
          iconColor: 'text-indigo-600 dark:text-indigo-300',
          iconBgLight: 'bg-indigo-500/15',
          iconBgDark: 'dark:bg-indigo-500/25',
          borderColorLight: 'border-indigo-200',
          borderColorDark: 'dark:border-indigo-500/30',
          activeGradient: 'from-indigo-600 to-purple-600',
          activeShadow: 'shadow-indigo-500/35'
        },
      ]
    },
    {
      title: t.constructionExpenses,
      items: [
        (enabled.steel !== false ? { 
          id: 'steel', 
          label: t.navSteel, 
          icon: Layers,
          colorName: 'amber',
          iconColor: 'text-amber-600 dark:text-amber-300',
          iconBgLight: 'bg-amber-500/15',
          iconBgDark: 'dark:bg-amber-500/25',
          borderColorLight: 'border-amber-200',
          borderColorDark: 'dark:border-amber-500/30',
          activeGradient: 'from-amber-500 to-orange-600',
          activeShadow: 'shadow-amber-500/35'
        } : null),
        (enabled.concrete !== false ? { 
          id: 'concrete', 
          label: t.navConcrete, 
          icon: CircleDot,
          colorName: 'teal',
          iconColor: 'text-teal-600 dark:text-teal-300',
          iconBgLight: 'bg-teal-500/15',
          iconBgDark: 'dark:bg-teal-500/25',
          borderColorLight: 'border-teal-200',
          borderColorDark: 'dark:border-teal-500/30',
          activeGradient: 'from-teal-500 to-emerald-600',
          activeShadow: 'shadow-teal-500/35'
        } : null),
        (enabled.expenses !== false ? { 
          id: 'expenses', 
          label: t.navExpenses, 
          icon: Receipt,
          colorName: 'rose',
          iconColor: 'text-rose-600 dark:text-rose-300',
          iconBgLight: 'bg-rose-500/15',
          iconBgDark: 'dark:bg-rose-500/25',
          borderColorLight: 'border-rose-200',
          borderColorDark: 'dark:border-rose-500/30',
          activeGradient: 'from-rose-500 to-red-600',
          activeShadow: 'shadow-rose-500/35'
        } : null),
        (enabled.contractors !== false ? { 
          id: 'contractors', 
          label: t.navContractors, 
          icon: HardHat,
          colorName: 'orange',
          iconColor: 'text-orange-600 dark:text-orange-300',
          iconBgLight: 'bg-orange-500/15',
          iconBgDark: 'dark:bg-orange-500/25',
          borderColorLight: 'border-orange-200',
          borderColorDark: 'dark:border-orange-500/30',
          activeGradient: 'from-orange-500 to-amber-600',
          activeShadow: 'shadow-orange-500/35'
        } : null),
        (enabled.suppliers !== false ? { 
          id: 'suppliers', 
          label: t.navSuppliers, 
          icon: Truck,
          colorName: 'blue',
          iconColor: 'text-blue-600 dark:text-blue-300',
          iconBgLight: 'bg-blue-500/15',
          iconBgDark: 'dark:bg-blue-500/25',
          borderColorLight: 'border-blue-200',
          borderColorDark: 'dark:border-blue-500/30',
          activeGradient: 'from-blue-600 to-indigo-600',
          activeShadow: 'shadow-blue-500/35'
        } : null),
      ].filter(Boolean) as NavItemConfig[]
    },
    {
      title: t.financialOverview,
      items: [
        (enabled.apartments !== false ? { 
          id: 'apartments', 
          label: t.navApartments, 
          icon: Home, 
          colorName: 'fuchsia',
          iconColor: 'text-fuchsia-600 dark:text-fuchsia-300',
          iconBgLight: 'bg-fuchsia-500/15',
          iconBgDark: 'dark:bg-fuchsia-500/25',
          borderColorLight: 'border-fuchsia-200',
          borderColorDark: 'dark:border-fuchsia-500/30',
          activeGradient: 'from-fuchsia-500 to-pink-600',
          activeShadow: 'shadow-fuchsia-500/35',
          isProtected: true, 
          isUnlocked: isApartmentsUnlocked 
        } : null),
        (enabled.payments !== false ? { 
          id: 'payments', 
          label: t.navPayments, 
          icon: CreditCard,
          colorName: 'emerald',
          iconColor: 'text-emerald-600 dark:text-emerald-300',
          iconBgLight: 'bg-emerald-500/15',
          iconBgDark: 'dark:bg-emerald-500/25',
          borderColorLight: 'border-emerald-200',
          borderColorDark: 'dark:border-emerald-500/30',
          activeGradient: 'from-emerald-600 to-teal-600',
          activeShadow: 'shadow-emerald-500/35'
        } : null),
        (enabled.documents !== false ? { 
          id: 'documents', 
          label: t.navDocuments, 
          icon: FileCheck2,
          colorName: 'cyan',
          iconColor: 'text-cyan-600 dark:text-cyan-300',
          iconBgLight: 'bg-cyan-500/15',
          iconBgDark: 'dark:bg-cyan-500/25',
          borderColorLight: 'border-cyan-200',
          borderColorDark: 'dark:border-cyan-500/30',
          activeGradient: 'from-cyan-600 to-blue-600',
          activeShadow: 'shadow-cyan-500/35'
        } : null),
        (enabled.reports !== false ? { 
          id: 'reports', 
          label: t.navReports, 
          icon: BarChart3,
          colorName: 'purple',
          iconColor: 'text-purple-600 dark:text-purple-300',
          iconBgLight: 'bg-purple-500/15',
          iconBgDark: 'dark:bg-purple-500/25',
          borderColorLight: 'border-purple-200',
          borderColorDark: 'dark:border-purple-500/30',
          activeGradient: 'from-purple-600 to-violet-600',
          activeShadow: 'shadow-purple-500/35'
        } : null),
      ].filter(Boolean) as NavItemConfig[]
    }
  ];

  if (currentUser?.role === 'admin' || currentUser?.isMasterSuperAdmin) {
    sections.push({
      title: t.companySettings,
      items: [
        (currentUser?.isMasterSuperAdmin ? {
          id: 'super_admin',
          label: language === 'en' ? 'Super Admin Portal' : language === 'ps' ? 'عمومي مدیر' : 'مدیر ارشد (احمد نجیم نیک)',
          icon: ShieldCheck,
          colorName: 'rose',
          iconColor: 'text-rose-600 dark:text-rose-300',
          iconBgLight: 'bg-rose-500/15',
          iconBgDark: 'dark:bg-rose-500/25',
          borderColorLight: 'border-rose-200',
          borderColorDark: 'dark:border-rose-500/30',
          activeGradient: 'from-rose-600 to-red-600',
          activeShadow: 'shadow-rose-500/35'
        } : null),
        { 
          id: 'settings', 
          label: t.companySettings, 
          icon: Sliders,
          colorName: 'amber',
          iconColor: 'text-amber-600 dark:text-amber-300',
          iconBgLight: 'bg-amber-500/15',
          iconBgDark: 'dark:bg-amber-500/25',
          borderColorLight: 'border-amber-200',
          borderColorDark: 'dark:border-amber-500/30',
          activeGradient: 'from-amber-600 to-yellow-600',
          activeShadow: 'shadow-amber-500/35'
        },
        { 
          id: 'users', 
          label: language === 'en' ? 'Staff & Team' : language === 'ps' ? 'کاروونکي' : 'مدیریت کارمندان',
          icon: Users,
          colorName: 'blue',
          iconColor: 'text-blue-600 dark:text-blue-300',
          iconBgLight: 'bg-blue-500/15',
          iconBgDark: 'dark:bg-blue-500/25',
          borderColorLight: 'border-blue-200',
          borderColorDark: 'dark:border-blue-500/30',
          activeGradient: 'from-blue-600 to-indigo-600',
          activeShadow: 'shadow-blue-500/35'
        },
        (enabled.auditLogs !== false ? { 
          id: 'audit_logs', 
          label: t.navAuditLogs, 
          icon: History,
          colorName: 'teal',
          iconColor: 'text-teal-600 dark:text-teal-300',
          iconBgLight: 'bg-teal-500/15',
          iconBgDark: 'dark:bg-teal-500/25',
          borderColorLight: 'border-teal-200',
          borderColorDark: 'dark:border-teal-500/30',
          activeGradient: 'from-teal-600 to-cyan-600',
          activeShadow: 'shadow-teal-500/35'
        } : null),
      ].filter(Boolean) as NavItemConfig[]
    });
  }

  const filteredSections = sections
    .map(section => ({
      ...section,
      items: section.items
        .map(item => ({
          ...item,
          isProtected: isSectionProtected(item.id),
          isUnlocked: isSectionUnlocked(item.id),
        }))
        .filter(item => isTabAllowed(item.id))
    }))
    .filter(section => section.items.length > 0);

  return (
    <aside className="theme-sidebar w-64 flex-shrink-0 flex flex-col justify-between hidden md:flex border-e no-print min-h-[calc(100vh-4rem)] z-10 transition-all duration-300">
      
      {/* Top Project Badge */}
      <div className="p-3.5 space-y-3.5 overflow-y-auto">
        {currentProject && (
          <div className="theme-project-card rounded-2xl p-3 border transition-all shadow-xs backdrop-blur-md">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-black tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50"></span>
                <span>{t.currentProject}</span>
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                {currentProject.status || 'Active'}
              </span>
            </div>
            <div className="font-extrabold text-sm truncate">{currentProject.name}</div>
            <div className="text-xs opacity-75 flex items-center gap-2 mt-1 font-semibold">
              <span>{currentProject.floors} {t.floors}</span>
              <span>•</span>
              <span>{currentProject.units} {t.units}</span>
            </div>

            {/* Google Drive Status Pill */}
            <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-300">
                <Cloud className={`w-3.5 h-3.5 ${isGoogleDriveConnected ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span>Google Drive</span>
              </span>
              <span className={`px-1.5 py-0.2 rounded font-bold ${
                isGoogleDriveConnected ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}>
                {isGoogleDriveConnected ? 'متصل' : 'غیرفعال'}
              </span>
            </div>
          </div>
        )}

        {/* Organized Navigation Menu */}
        <nav className="space-y-3.5">
          {filteredSections.map((sec, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="theme-nav-section-title px-2.5 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider opacity-70">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80"></span>
                <span>{sec.title}</span>
              </div>
              
              <div className="space-y-1">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`theme-nav-item w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 group border relative overflow-hidden ${
                        isActive 
                          ? `active bg-gradient-to-r ${item.activeGradient} text-white ${item.activeShadow} shadow-md border-transparent font-black ring-1 ring-white/30` 
                          : `bg-white/65 hover:bg-white/95 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs hover:translate-x-0.5 rtl:hover:-translate-x-0.5`
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 rtl:space-x-reverse truncate z-10">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 border ${
                          isActive 
                            ? 'bg-white/20 text-white border-white/30 shadow-xs' 
                            : `${item.iconBgLight} ${item.iconBgDark} ${item.iconColor} ${item.borderColorLight} ${item.borderColorDark} shadow-2xs`
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="truncate">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 z-10">
                        {item.isProtected && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1 font-bold ${
                            isActive 
                              ? 'bg-white/25 text-white' 
                              : item.isUnlocked 
                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30' 
                                : 'text-amber-600 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30'
                          }`}>
                            {item.isUnlocked ? (
                              <Unlock className="w-2.5 h-2.5" />
                            ) : (
                              <Lock className="w-2.5 h-2.5" />
                            )}
                          </span>
                        )}
                        {isActive ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        ) : (
                          <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity ${isRtl ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Footer Info & Sleek Dark Mode Button */}
      <div className="theme-sidebar-footer border-t p-3 space-y-2 backdrop-blur-md">
        
        {onOpenSystemGuide && (
          <button
            type="button"
            onClick={onOpenSystemGuide}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-all shadow-2xs"
            title="راهنمای کامل سیستم"
          >
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>راهنمای استفاده</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20">Help</span>
          </button>
        )}

        <button
          onClick={toggleDarkMode}
          className="theme-mode-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-black transition-all border shadow-xs hover:shadow-md hover:scale-[1.01]"
          title={t.darkModeToggle}
        >
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {appSettings.darkMode ? (
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
            <span>{appSettings.darkMode ? t.lightMode : t.darkMode}</span>
          </div>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            {appSettings.darkMode ? 'شب' : 'روز'}
          </span>
        </button>

        <div className="px-2 pt-1 text-[11px] opacity-75 space-y-0.5 text-center">
          <div className="font-extrabold truncate">{appSettings.companyName || 'NIK SMART COUNT'}</div>
          <div className="text-[10px] opacity-65">Building Project & Engineering Accounting</div>
        </div>
      </div>
    </aside>
  );
};
