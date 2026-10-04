import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Receipt, 
  CreditCard, 
  Home, 
  Menu,
  Lock
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenMobileMenu?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, onOpenMobileMenu }) => {
  const { t, isTabAllowed, isSectionProtected, isSectionUnlocked } = useApp();

  const allTabs = [
    { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { id: 'expenses', label: t.navExpenses, icon: Receipt },
    { id: 'payments', label: t.navPayments, icon: CreditCard },
    { 
      id: 'apartments', 
      label: t.navApartments.split(' ')[0], 
      icon: Home,
      isProtected: isSectionProtected('apartments') && !isSectionUnlocked('apartments')
    },
    { id: 'menu', label: t.actions || 'منو', icon: Menu, isAction: true },
  ];

  const visibleTabs = allTabs.filter(tab => tab.isAction || isTabAllowed(tab.id));

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900/98 backdrop-blur-md border-t border-slate-800 text-slate-400 z-40 px-1 py-0.5 flex items-center justify-around no-print shadow-xl">
      {visibleTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              if (tab.isAction) {
                onOpenMobileMenu?.();
              } else {
                setActiveTab(tab.id);
              }
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 min-h-[42px] rounded-lg transition-all ${
              isActive 
                ? 'text-amber-400 font-bold bg-slate-800/80 shadow-xs' 
                : 'hover:text-slate-200 active:scale-95'
            }`}
          >
            <div className="relative">
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              {tab.isProtected && (
                <Lock className="w-2 h-2 text-amber-400 absolute -top-1 -end-1 bg-slate-900 rounded-full p-0.5" />
              )}
            </div>
            <span className="text-[9px] mt-0.5 truncate max-w-[56px] font-medium leading-none">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
