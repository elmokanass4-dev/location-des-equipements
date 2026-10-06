import React, { useState, useEffect } from 'react';
import { I18nProvider, useI18n } from './i18n/context';
import { Header } from './components/common/Header';
import { Sidebar, NavSection } from './components/common/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { RentalsListView } from './components/rentals/RentalsListView';
import { RentalDetailView } from './components/rentals/RentalDetailView';
import { RentalCreateModal } from './components/rentals/RentalCreateModal';
import { InventoryListView } from './components/inventory/InventoryListView';
import { CustomersListView } from './components/customers/CustomersListView';
import { PaymentsView } from './components/payments/PaymentsView';
import { MaintenanceView } from './components/maintenance/MaintenanceView';
import { CalendarView } from './components/calendar/CalendarView';
import { ReportsView } from './components/reports/ReportsView';
import { PublicCatalogueView } from './components/catalogue/PublicCatalogueView';
import { TeamView } from './components/team/TeamView';
import { SettingsView } from './components/settings/SettingsView';
import { StorageService } from './services/storage';
import {
  Rental,
  Equipment,
  Customer,
  RentalPayment,
  DepositLedgerEntry,
  MaintenanceLog,
  WorkspaceSettings,
  WorkspaceLocation,
  User,
  AuditEvent,
  NotificationItem,
  PublicBookingRequest,
} from './types';

function MainApp() {
  const { t } = useI18n();

  // Primary Domain State (backed by localStorage)
  const [settings, setSettings] = useState<WorkspaceSettings>(() => StorageService.getSettings());
  const [locations, setLocations] = useState<WorkspaceLocation[]>(() => StorageService.getLocations());
  const [selectedLocationId, setSelectedLocationId] = useState<string>(() => locations[0]?.id || '');
  const [allUsers, setAllUsers] = useState<User[]>(() => StorageService.getUsers());
  const [activeUser, setActiveUser] = useState<User>(() => StorageService.getActiveUser());

  const [equipmentList, setEquipmentList] = useState<Equipment[]>(() => StorageService.getEquipment());
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [rentals, setRentals] = useState<Rental[]>(() => StorageService.getRentals());
  const [payments, setPayments] = useState<RentalPayment[]>(() => StorageService.getPayments());
  const [deposits, setDeposits] = useState<DepositLedgerEntry[]>(() => StorageService.getDeposits());
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>(() => StorageService.getMaintenance());
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>(() => StorageService.getAuditLogs());
  const [publicRequests, setPublicRequests] = useState<PublicBookingRequest[]>(() => StorageService.getPublicRequests());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => StorageService.getNotifications());

  // Navigation & UI State
  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [isNewRentalModalOpen, setIsNewRentalModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Synchronize state changes to Storage
  const handleSaveSettings = (newSettings: WorkspaceSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const handleSelectUser = (u: User) => {
    setActiveUser(u);
    StorageService.setActiveUser(u);
  };

  const handleAddUser = (u: User) => {
    const updated = [...allUsers, u];
    setAllUsers(updated);
    StorageService.addAuditLog({
      workspaceId: settings.id,
      entityType: 'customer',
      entityId: u.id,
      action: 'TEAM_MEMBER_INVITED',
      details: `Nouveau membre ${u.name} invité avec le rôle ${u.role}.`,
      userId: activeUser.id,
      userName: activeUser.name,
    });
  };

  const handleSaveEquipment = (eq: Equipment) => {
    const exists = equipmentList.some((e) => e.id === eq.id);
    const updated = exists ? equipmentList.map((e) => (e.id === eq.id ? eq : e)) : [eq, ...equipmentList];
    setEquipmentList(updated);
    StorageService.saveEquipment(updated);
    StorageService.addAuditLog({
      workspaceId: settings.id,
      entityType: 'equipment',
      entityId: eq.id,
      action: exists ? 'EQUIPMENT_UPDATED' : 'EQUIPMENT_CREATED',
      details: `${eq.name} (${eq.sku || eq.category}) enregistré au parc.`,
      userId: activeUser.id,
      userName: activeUser.name,
    });
    setAuditLogs(StorageService.getAuditLogs());
  };

  const handleImportEquipment = (items: Equipment[]) => {
    const updated = [...items, ...equipmentList];
    setEquipmentList(updated);
    StorageService.saveEquipment(updated);
    StorageService.addAuditLog({
      workspaceId: settings.id,
      entityType: 'equipment',
      entityId: 'csv-import',
      action: 'CSV_IMPORT_SUCCESS',
      details: `Importation groupée de ${items.length} équipements via fichier CSV.`,
      userId: activeUser.id,
      userName: activeUser.name,
    });
    setAuditLogs(StorageService.getAuditLogs());
  };

  const handleAddCustomer = (c: Customer) => {
    const updated = [c, ...customers];
    setCustomers(updated);
    StorageService.saveCustomers(updated);
    StorageService.addAuditLog({
      workspaceId: settings.id,
      entityType: 'customer',
      entityId: c.id,
      action: 'CUSTOMER_CREATED',
      details: `Client ${c.name} créé (${c.phone}).`,
      userId: activeUser.id,
      userName: activeUser.name,
    });
    setAuditLogs(StorageService.getAuditLogs());
  };

  const handleSaveRental = (newRental: Rental) => {
    const updated = [newRental, ...rentals];
    setRentals(updated);
    StorageService.saveRentals(updated);
    StorageService.addAuditLog({
      workspaceId: settings.id,
      entityType: 'rental',
      entityId: newRental.id,
      action: 'RENTAL_CREATED',
      details: `Dossier ${newRental.referenceNumber} créé (${newRental.bookingStatus}).`,
      userId: activeUser.id,
      userName: activeUser.name,
    });
    setAuditLogs(StorageService.getAuditLogs());
    setSelectedRental(newRental);
    setCurrentSection('rentals');
  };

  const handleUpdateRental = (updatedRental: Rental) => {
    const updated = rentals.map((r) => (r.id === updatedRental.id ? updatedRental : r));
    setRentals(updated);
    StorageService.saveRentals(updated);
    setSelectedRental(updatedRental);
    StorageService.addAuditLog({
      workspaceId: settings.id,
      entityType: 'rental',
      entityId: updatedRental.id,
      action: 'RENTAL_STATUS_UPDATE',
      details: `Contrat ${updatedRental.referenceNumber} mis à jour : ${updatedRental.fulfillmentStatus} / ${updatedRental.paymentStatus}.`,
      userId: activeUser.id,
      userName: activeUser.name,
    });
    setAuditLogs(StorageService.getAuditLogs());
  };

  const handleRecordPayment = (pay: RentalPayment) => {
    const updated = [pay, ...payments];
    setPayments(updated);
    StorageService.savePayments(updated);
    StorageService.addAuditLog({
      workspaceId: settings.id,
      entityType: 'payment',
      entityId: pay.id,
      action: 'PAYMENT_RECORDED',
      details: `Règlement locatif de ${pay.amount} MAD enregistré (${pay.method}).`,
      userId: activeUser.id,
      userName: activeUser.name,
    });
    setAuditLogs(StorageService.getAuditLogs());
  };

  const handleRecordDeposit = (dep: DepositLedgerEntry) => {
    const updated = [dep, ...deposits];
    setDeposits(updated);
    StorageService.saveDeposits(updated);
    StorageService.addAuditLog({
      workspaceId: settings.id,
      entityType: 'deposit',
      entityId: dep.id,
      action: 'DEPOSIT_TRANSACTION',
      details: `Mouvement de caution : ${dep.type} (${dep.amount} MAD via ${dep.method}).`,
      userId: activeUser.id,
      userName: activeUser.name,
    });
    setAuditLogs(StorageService.getAuditLogs());
  };

  const handleSaveMaintenanceLog = (mLog: MaintenanceLog) => {
    const updated = [mLog, ...maintenance];
    setMaintenance(updated);
    StorageService.saveMaintenance(updated);
    StorageService.addAuditLog({
      workspaceId: settings.id,
      entityType: 'maintenance',
      entityId: mLog.id,
      action: 'MAINTENANCE_TICKET_OPENED',
      details: `Ticket atelier ouvert pour ${mLog.equipmentName} (${mLog.affectedQuantity} bloqués).`,
      userId: activeUser.id,
      userName: activeUser.name,
    });
    setAuditLogs(StorageService.getAuditLogs());
  };

  const handleResolveMaintenanceTicket = (id: string, notes: string, actualCost: number) => {
    const updated = maintenance.map((m) =>
      m.id === id
        ? {
            ...m,
            status: 'resolved' as const,
            resolutionNotes: notes,
            actualCost,
            actualCompletionDate: new Date().toISOString(),
          }
        : m
    );
    setMaintenance(updated);
    StorageService.saveMaintenance(updated);
    StorageService.addAuditLog({
      workspaceId: settings.id,
      entityType: 'maintenance',
      entityId: id,
      action: 'EQUIPMENT_RESTORED_TO_STOCK',
      details: `Machine remise en stock disponible après réparation (Coût: ${actualCost} MAD).`,
      userId: activeUser.id,
      userName: activeUser.name,
    });
    setAuditLogs(StorageService.getAuditLogs());
  };

  const handleSubmitPublicRequest = (req: PublicBookingRequest) => {
    const updated = [req, ...publicRequests];
    setPublicRequests(updated);
    StorageService.savePublicRequests(updated);

    // Create In-App Notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      type: 'public_request',
      title: 'Nouvelle demande catalogue public',
      message: `${req.customerName} a demandé ${req.items.length} matériel(s) pour un total estimé de ${req.estimatedTotal} MAD.`,
      severity: 'info',
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    const notifs = [newNotif, ...notifications];
    setNotifications(notifs);
    StorageService.saveNotifications(notifs);
  };

  const handleMarkNotificationsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    StorageService.saveNotifications(updated);
  };

  const handleResetDemoData = () => {
    StorageService.resetToDemoData();
    setSettings(StorageService.getSettings());
    setLocations(StorageService.getLocations());
    setEquipmentList(StorageService.getEquipment());
    setCustomers(StorageService.getCustomers());
    setRentals(StorageService.getRentals());
    setPayments(StorageService.getPayments());
    setDeposits(StorageService.getDeposits());
    setMaintenance(StorageService.getMaintenance());
    setAuditLogs(StorageService.getAuditLogs());
    setNotifications(StorageService.getNotifications());
    setSelectedRental(null);
    setCurrentSection('dashboard');
  };

  const handleExportJson = () => {
    const jsonStr = StorageService.exportAllDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kriya-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  // Badge counters
  const now = new Date();
  const overdueCount = rentals.filter((r) => {
    if (r.fulfillmentStatus === 'returned' || r.fulfillmentStatus === 'closed') return false;
    if (r.bookingStatus !== 'confirmed') return false;
    return new Date(r.endDate) < now && (r.fulfillmentStatus === 'checked_out' || r.fulfillmentStatus === 'partially_picked_up');
  }).length;

  const activeMaintCount = maintenance.filter((m) => m.status !== 'resolved').length;
  const pendingRequestsCount = publicRequests.filter((p) => p.status === 'pending_review').length;

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col text-stone-900">
      {/* Top Header */}
      <Header
        settings={settings}
        locations={locations}
        selectedLocationId={selectedLocationId}
        onSelectLocation={setSelectedLocationId}
        activeUser={activeUser}
        allUsers={allUsers}
        onSelectUser={handleSelectUser}
        notifications={notifications}
        onMarkNotificationsRead={handleMarkNotificationsRead}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onExportBackup={handleExportJson}
      />

      {/* Main Shell: Sidebar + Content Workspace */}
      <div className="flex-1 flex w-full">
        <Sidebar
          currentSection={currentSection}
          onSelectSection={(sec) => {
            setCurrentSection(sec);
            setSelectedRental(null);
          }}
          onOpenNewRental={() => setIsNewRentalModalOpen(true)}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          badgeCounts={{
            overdueRentals: overdueCount,
            activeMaintenance: activeMaintCount,
            publicRequests: pendingRequestsCount,
          }}
        />

        {/* Workspace Content Pane */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Detailed Rental Screen */}
          {selectedRental ? (
            <RentalDetailView
              rental={selectedRental}
              customer={customers.find((c) => c.id === selectedRental.customerId)}
              equipmentList={equipmentList}
              payments={payments}
              deposits={deposits}
              settings={settings}
              userName={activeUser.name}
              onBack={() => setSelectedRental(null)}
              onUpdateRental={handleUpdateRental}
              onRecordPayment={handleRecordPayment}
              onRecordDeposit={handleRecordDeposit}
              onAddMaintenanceLog={handleSaveMaintenanceLog}
            />
          ) : (
            <>
              {currentSection === 'dashboard' && (
                <DashboardView
                  rentals={rentals}
                  equipment={equipmentList}
                  customers={customers}
                  payments={payments}
                  deposits={deposits}
                  maintenance={maintenance}
                  auditLogs={auditLogs}
                  onNavigate={setCurrentSection}
                  onOpenNewRental={() => setIsNewRentalModalOpen(true)}
                  onSelectRental={(r) => {
                    setSelectedRental(r);
                    setCurrentSection('rentals');
                  }}
                />
              )}

              {currentSection === 'calendar' && (
                <CalendarView
                  rentals={rentals}
                  equipmentList={equipmentList}
                  maintenanceLogs={maintenance}
                  locations={locations}
                  onSelectRental={(r) => {
                    setSelectedRental(r);
                    setCurrentSection('rentals');
                  }}
                />
              )}

              {currentSection === 'rentals' && (
                <RentalsListView
                  rentals={rentals}
                  customers={customers}
                  onSelectRental={(r) => setSelectedRental(r)}
                  onOpenCreateRental={() => setIsNewRentalModalOpen(true)}
                />
              )}

              {currentSection === 'inventory' && (
                <InventoryListView
                  equipmentList={equipmentList}
                  allRentals={rentals}
                  allMaintenance={maintenance}
                  onSaveEquipment={handleSaveEquipment}
                  onImportEquipment={handleImportEquipment}
                  locationId={selectedLocationId}
                />
              )}

              {currentSection === 'customers' && (
                <CustomersListView
                  customers={customers}
                  rentals={rentals}
                  payments={payments}
                  deposits={deposits}
                  onAddCustomer={handleAddCustomer}
                  onSelectRental={(r) => {
                    setSelectedRental(r);
                    setCurrentSection('rentals');
                  }}
                  onNewRentalForCustomer={(cust) => {
                    setIsNewRentalModalOpen(true);
                  }}
                />
              )}

              {currentSection === 'payments' && (
                <PaymentsView
                  payments={payments}
                  deposits={deposits}
                  rentals={rentals}
                  customers={customers}
                  userName={activeUser.name}
                  onRecordPayment={handleRecordPayment}
                  onRecordDeposit={handleRecordDeposit}
                  onSelectRental={(r) => {
                    setSelectedRental(r);
                    setCurrentSection('rentals');
                  }}
                />
              )}

              {currentSection === 'maintenance' && (
                <MaintenanceView
                  maintenanceLogs={maintenance}
                  equipmentList={equipmentList}
                  onSaveLog={handleSaveMaintenanceLog}
                  onResolveTicket={handleResolveMaintenanceTicket}
                />
              )}

              {currentSection === 'reports' && (
                <ReportsView
                  rentals={rentals}
                  equipmentList={equipmentList}
                  payments={payments}
                  deposits={deposits}
                  maintenance={maintenance}
                />
              )}

              {currentSection === 'catalogue' && (
                <PublicCatalogueView
                  settings={settings}
                  equipmentList={equipmentList}
                  allRentals={rentals}
                  allMaintenance={maintenance}
                  onSubmitBookingRequest={handleSubmitPublicRequest}
                />
              )}

              {currentSection === 'team' && (
                <TeamView
                  users={allUsers}
                  activeUser={activeUser}
                  onSelectActiveUser={handleSelectUser}
                  onAddUser={handleAddUser}
                />
              )}

              {currentSection === 'settings' && (
                <SettingsView
                  settings={settings}
                  locations={locations}
                  onSaveSettings={handleSaveSettings}
                  onResetDemoData={handleResetDemoData}
                  onExportJson={handleExportJson}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Guided Rental Creation Modal */}
      {isNewRentalModalOpen && (
        <RentalCreateModal
          isOpen={isNewRentalModalOpen}
          onClose={() => setIsNewRentalModalOpen(false)}
          onSaveRental={handleSaveRental}
          customers={customers}
          onAddCustomer={handleAddCustomer}
          equipmentList={equipmentList}
          locations={locations}
          allRentals={rentals}
          allMaintenance={maintenance}
          taxRateDefault={settings.taxRate}
          bufferHoursDefault={settings.turnaroundBufferHours}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <MainApp />
    </I18nProvider>
  );
}
