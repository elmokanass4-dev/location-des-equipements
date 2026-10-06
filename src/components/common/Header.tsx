import React, { useState } from 'react';
import {
  Bell,
  Search,
  MapPin,
  Globe,
  ChevronDown,
  User as UserIcon,
  Shield,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { WorkspaceSettings, WorkspaceLocation, User, NotificationItem } from '../../types';
import { SyncStatusIndicator } from './SyncStatusIndicator';

interface HeaderProps {
  settings: WorkspaceSettings;
  locations: WorkspaceLocation[];
  selectedLocationId: string;
  onSelectLocation: (id: string) => void;
  activeUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  notifications: NotificationItem[];
  onMarkNotificationsRead: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenMobileMenu: () => void;
  onExportBackup?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  locations,
  selectedLocationId,
  onSelectLocation,
  activeUser,
  allUsers,
  onSelectUser,
  notifications,
  onMarkNotificationsRead,
  searchQuery,
  onSearchChange,
  onOpenMobileMenu,
  onExportBackup,
}) => {
  const { language, setLanguage, t } = useI18n();
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const currentLocation = locations.find((l) => l.id === selectedLocationId) || locations[0];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-stone-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
      {/* Left: Mobile Toggle & Workspace Name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-stone-600 hover:bg-stone-100 rounded-lg"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E4D38] text-white font-bold text-sm tracking-wide shadow-xs">
            K
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm sm:text-base text-stone-900 leading-tight">
                {settings.businessName}
              </span>
              <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60 hidden sm:inline-block">
                Démo
              </span>
            </div>
            <div className="text-[11px] text-stone-500 hidden sm:block">
              {settings.city}, {settings.country} · {settings.currency}
            </div>
          </div>
        </div>

        {/* Location Selector */}
        <div className="relative hidden md:block ml-4">
          <button
            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
            className="flex items-center gap-1.5 rounded-md border border-stone-200 bg-stone-50/70 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <MapPin className="h-3.5 w-3.5 text-stone-500" />
            <span className="max-w-[150px] truncate">{currentLocation?.name || t.app.allLocations}</span>
            <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
          </button>

          {showLocationDropdown && (
            <div className="absolute left-0 mt-1.5 w-64 rounded-lg border border-stone-200 bg-white p-1.5 shadow-lg z-50">
              <div className="px-2 py-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                {t.app.allLocations}
              </div>
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => {
                    onSelectLocation(loc.id);
                    setShowLocationDropdown(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md flex flex-col transition-colors ${
                    selectedLocationId === loc.id
                      ? 'bg-emerald-50 text-[#1E4D38] font-medium'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span>{loc.name}</span>
                  <span className="text-[10px] text-stone-400">{loc.city}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Search input */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.app.searchPlaceholder}
            className="w-full rounded-lg border border-stone-200 bg-stone-50/60 pl-9 pr-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:bg-white focus:border-[#1E4D38] focus:ring-1 focus:ring-[#1E4D38] outline-none transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Sync Indicator, Notifications, Language, Active Role & User */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Local Storage Sync & Connectivity Indicator */}
        <SyncStatusIndicator onExportBackup={onExportBackup} />

        {/* Language selector */}
        <div className="flex items-center border border-stone-200 rounded-md bg-stone-50/60 p-0.5 text-xs">
          <button
            onClick={() => setLanguage('fr')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              language === 'fr' ? 'bg-white text-[#1E4D38] shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Français"
          >
            FR
          </button>
          <button
            onClick={() => setLanguage('ar')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              language === 'ar' ? 'bg-white text-[#1E4D38] shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
            title="العربية (RTL)"
          >
            عر
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              language === 'en' ? 'bg-white text-[#1E4D38] shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
            title="English"
          >
            EN
          </button>
        </div>

        {/* Notifications toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
            aria-label={t.app.notifications}
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-stone-200 bg-white p-3 shadow-xl z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100">
                <span className="text-xs font-semibold text-stone-900">
                  {t.app.notifications} ({notifications.length})
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      onMarkNotificationsRead();
                      setShowNotifDropdown(false);
                    }}
                    className="text-[11px] text-[#1E4D38] hover:underline font-medium"
                  >
                    {t.app.markAllRead}
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-stone-500 py-3 text-center">{t.app.noNotifications}</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-2.5 rounded-lg border text-xs transition-colors ${
                        notif.severity === 'urgent'
                          ? 'border-amber-200 bg-amber-50/60'
                          : notif.severity === 'warning'
                          ? 'border-amber-100 bg-stone-50'
                          : 'border-stone-100 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {notif.severity === 'urgent' ? (
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-semibold text-stone-800">{notif.title}</div>
                          <div className="text-stone-600 mt-0.5">{notif.message}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Role & Persona switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50/70 p-1.5 sm:px-2.5 sm:py-1 text-xs text-stone-800 hover:bg-stone-100 transition-colors"
          >
            <div className="h-6 w-6 rounded-full bg-[#1E4D38]/10 text-[#1E4D38] flex items-center justify-center font-bold text-xs">
              {activeUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <div className="font-medium text-xs leading-none">{activeUser.name}</div>
              <div className="text-[10px] text-stone-500 capitalize">{activeUser.role}</div>
            </div>
            <ChevronDown className="h-3 w-3 text-stone-400" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-stone-200 bg-white p-2 shadow-xl z-50">
              <div className="px-2 py-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                {t.team.simulateRoleSwitch}
              </div>
              {allUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    onSelectUser(u);
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 text-xs rounded-lg flex items-center justify-between transition-colors ${
                    activeUser.id === u.id
                      ? 'bg-emerald-50 text-[#1E4D38] font-medium'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-[10px] text-stone-400 capitalize">{u.role}</div>
                  </div>
                  {activeUser.id === u.id && <CheckCircle2 className="h-4 w-4 text-[#1E4D38]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
