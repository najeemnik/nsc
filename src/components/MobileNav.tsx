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
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 no-print mobile-nav-chrome safe-bottom"
      aria-label="Mobile navigation"
    >
      <div className="px-1 pt-0.5 flex items-stretch justify-around">
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
              className={`flex-1 flex flex-col items-center justify-center tap-target py-1 px-0.5 rounded-xl transition-all active:scale-95 ${
                isActive
                  ? 'mobile-nav-item-active font-bold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {tab.isProtected && (
                  <Lock className="w-2 h-2 text-(--color-accent) absolute -top-1 -end-1 rounded-full" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 truncate max-w-[64px] font-medium leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
