import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  FolderKanban,
  Boxes,
  Users,
  CreditCard,
  Wrench,
  BarChart3,
  Store,
  UserCheck,
  Settings,
  HelpCircle,
  X,
  Plus,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';

export type NavSection =
  | 'dashboard'
  | 'calendar'
  | 'rentals'
  | 'inventory'
  | 'customers'
  | 'payments'
  | 'maintenance'
  | 'reports'
  | 'catalogue'
  | 'team'
  | 'settings';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onOpenNewRental: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  badgeCounts: {
    overdueRentals: number;
    activeMaintenance: number;
    publicRequests: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  onOpenNewRental,
  isMobileOpen,
  onCloseMobile,
  badgeCounts,
}) => {
  const { t } = useI18n();

  const navItems = [
    { id: 'dashboard' as NavSection, label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'calendar' as NavSection, label: t.nav.calendar, icon: CalendarDays },
    {
      id: 'rentals' as NavSection,
      label: t.nav.rentals,
      icon: FolderKanban,
      badge: badgeCounts.overdueRentals > 0 ? `${badgeCounts.overdueRentals}` : undefined,
      badgeColor: 'text-amber-700 bg-amber-50',
    },
    { id: 'inventory' as NavSection, label: t.nav.inventory, icon: Boxes },
    { id: 'customers' as NavSection, label: t.nav.customers, icon: Users },
    { id: 'payments' as NavSection, label: t.nav.payments, icon: CreditCard },
    {
      id: 'maintenance' as NavSection,
      label: t.nav.maintenance,
      icon: Wrench,
      badge: badgeCounts.activeMaintenance > 0 ? `${badgeCounts.activeMaintenance}` : undefined,
      badgeColor: 'text-stone-700 bg-stone-100',
    },
    { id: 'reports' as NavSection, label: t.nav.reports, icon: BarChart3 },
    {
      id: 'catalogue' as NavSection,
      label: t.nav.catalogue,
      icon: Store,
      badge: badgeCounts.publicRequests > 0 ? `${badgeCounts.publicRequests}` : undefined,
      badgeColor: 'text-emerald-700 bg-emerald-50',
    },
    { id: 'team' as NavSection, label: t.nav.team, icon: UserCheck },
    { id: 'settings' as NavSection, label: t.nav.settings, icon: Settings },
  ];

  const handleNavClick = (id: NavSection) => {
    onSelectSection(id);
    onCloseMobile();
  };

  const content = (
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        {/* Quick New Rental CTA */}
        <div className="mb-5">
          <button
            onClick={() => {
              onOpenNewRental();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#1E4D38] px-3.5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#163B2B] active:scale-[0.99] transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>{t.dashboard.newRental}</span>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1E4D38]/10 text-[#1E4D38] font-semibold'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-[#1E4D38]' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-stone-200/80">
        <div className="text-[11px] text-stone-500 font-medium">Kriya SaaS v1.2</div>
        <div className="text-[10px] text-stone-400">Casablanca · MAD (Morocco)</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 border-r border-stone-200 bg-white">
        <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">{content}</div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl z-10 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-200">
              <span className="font-semibold text-sm text-stone-800">Menu Kriya</span>
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-md text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{content}</div>
          </div>
        </div>
      )}
    </>
  );
};
