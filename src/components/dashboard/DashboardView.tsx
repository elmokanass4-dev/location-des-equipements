import React from 'react';
import {
  Calendar,
  AlertCircle,
  Truck,
  RotateCcw,
  Boxes,
  Wrench,
  CreditCard,
  ShieldAlert,
  ArrowUpRight,
  Plus,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import {
  Rental,
  Equipment,
  Customer,
  RentalPayment,
  DepositLedgerEntry,
  MaintenanceLog,
  AuditEvent,
} from '../../types';
import { NavSection } from '../common/Sidebar';
import { outstandingUnits, isActiveBooking, outstandingBalance } from '../../services/dashboardMetrics';
import { StatusBadge } from '../common/StatusBadge';

interface DashboardViewProps {
  rentals: Rental[];
  equipment: Equipment[];
  customers: Customer[];
  payments: RentalPayment[];
  deposits: DepositLedgerEntry[];
  maintenance: MaintenanceLog[];
  auditLogs: AuditEvent[];
  onNavigate: (section: NavSection) => void;
  onOpenNewRental: () => void;
  onSelectRental: (rental: Rental) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  rentals,
  equipment,
  customers,
  payments,
  deposits,
  maintenance,
  auditLogs,
  onNavigate,
  onOpenNewRental,
  onSelectRental,
}) => {
  const { t, formatCurrency, formatDate, formatDateTime } = useI18n();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // 1. Pickups scheduled today
  const pickupsToday = rentals.filter((r) => {
    if (r.bookingStatus !== 'confirmed') return false;
    const start = new Date(r.startDate);
    return (
      start >= todayStart &&
      start <= todayEnd &&
      (r.fulfillmentStatus === 'not_picked_up' || r.fulfillmentStatus === 'partially_picked_up')
    );
  });

  // 2. Returns expected today
  const returnsExpectedToday = rentals.filter((r) => {
    if (!isActiveBooking(r) || outstandingUnits(r) === 0) return false;
    const end = new Date(r.endDate);
    return end >= todayStart && end <= todayEnd;
  });

  // 3. Overdue rentals
  const overdueRentals = rentals.filter((r) => {
    if (r.fulfillmentStatus === 'returned' || r.fulfillmentStatus === 'closed') return false;
    if (r.bookingStatus !== 'confirmed') return false;
    const end = new Date(r.endDate);
    return end < now && outstandingUnits(r) > 0;
  });

  // 4. Equipment currently rented
  const activeRentals = rentals.filter(
    (r) => isActiveBooking(r) && outstandingUnits(r) > 0
  );
  const rentedUnitsCount = activeRentals.reduce(
    (sum, r) => sum + r.lines.reduce((lsum, line) => lsum + Math.max(0, line.pickedUpQuantity - line.returnedQuantity), 0),
    0
  );

  // 5. Equipment in maintenance
  const activeMaintenanceLogs = maintenance.filter((m) => m.status !== 'resolved');
  const maintenanceCount = activeMaintenanceLogs.reduce((sum, m) => sum + (m.affectedQuantity || 1), 0);

  const totalOutstandingBalance = outstandingBalance(rentals, payments);
  const activeCustomerCount = new Set(activeRentals.map(rental => rental.customerId)).size;

  // 7. Deposits currently held (Deposits received - refunded - deducted)
  const depositsHeld = deposits.reduce((balance, d) => {
    if (d.type === 'deposit_received') return balance + d.amount;
    if (d.type === 'deposit_refunded' || d.type === 'deposit_deducted_for_damage') return balance - d.amount;
    return balance;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-semibold tracking-tight text-stone-900">{t.dashboard.headline}</h1><p className="mt-1 text-sm text-stone-500">{formatDate(now.toISOString())}</p></div>
        <button type="button" onClick={onOpenNewRental} className="inline-flex items-center gap-2 rounded-xl bg-[#1E4D38] px-5 py-3 text-sm font-semibold text-white hover:bg-[#163B2B] focus-visible:outline-2 focus-visible:outline-offset-2"><Plus className="h-4 w-4" />{t.dashboard.newRental}</button>
      </div>
      {/* Demo Workspace Banner */}
      <div className="rounded-xl border border-stone-200/90 bg-stone-50/80 p-4 text-xs text-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <div className="h-2 w-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
          <div>
            <span className="font-semibold text-stone-900">{t.app.demoWorkspace}</span>
            <span className="mx-1.5 text-stone-300">|</span>
            <span className="text-stone-600">{t.app.demoNote}</span>
          </div>
        </div>
        <div className="text-[11px] font-medium text-stone-500 whitespace-nowrap">
          Devise active : <strong className="text-stone-800">MAD (Maroc)</strong> · Fuseau : Africa/Casablanca
        </div>
      </div>

      {/* Overdue Alert Banner if any */}
      {overdueRentals.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Retards critiques de restitution ({overdueRentals.length})
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Ouvrez le dossier pour enregistrer la restitution du matériel encore chez le client.
              </p>
              <div className="mt-3 space-y-2">
                {overdueRentals.map((rental) => {
                  const cust = customers.find((c) => c.id === rental.customerId);
                  return (
                    <div
                      key={rental.id}
                      role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelectRental(rental); } }} onClick={() => onSelectRental(rental)}
                      className="cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-white/80 border border-amber-200/80 hover:bg-white text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900">{rental.referenceNumber}</span>
                        <span>·</span>
                        <span className="text-stone-700">{cust?.name || 'Client'}</span>
                        <span>·</span>
                        <span className="text-stone-500">
                          {rental.lines.filter(l => l.pickedUpQuantity > l.returnedQuantity).map((l) => `${l.pickedUpQuantity - l.returnedQuantity}× ${l.equipmentName}`).join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-amber-800 font-medium">
                          Retour prévu le {formatDateTime(rental.endDate)}
                        </span>
                        <span className="text-[#1E4D38] font-semibold hover:underline">
                          Gérer le dossier →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* The 5 Key Operational Questions - Answer Cards */}
      <div>
        <div className="mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-600">
            {t.dashboard.headline}
          </h2>
          <p className="text-xs text-stone-500">{t.dashboard.subheadline}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {/* Card 1: Availability */}
          <div
            role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onNavigate('inventory'); } }} onClick={() => onNavigate('inventory')}
            className="group cursor-pointer rounded-xl border border-stone-200 bg-white p-5 transition-all hover:border-[#1E4D38]/50 hover:shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="text-[11px] font-medium text-stone-500 flex items-center justify-between">
                <span>Catalogue matériel</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-stone-400 group-hover:text-[#1E4D38]" />
              </div>
              <div className="mt-2 text-2xl font-bold text-stone-900 tracking-tight">
                {equipment.length}
              </div>
              <div className="text-xs text-stone-600 mt-0.5">références cataloguées</div>
            </div>
            <div className="mt-3 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
              Consulter les stocks et disponibilités
            </div>
          </div>

          {/* Card 2: Who currently has our equipment? */}
          <div
            role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onNavigate('rentals'); } }} onClick={() => onNavigate('rentals')}
            className="group cursor-pointer rounded-xl border border-stone-200 bg-white p-4 transition-all hover:border-[#1E4D38]/50 hover:shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="text-[11px] font-medium text-stone-500 flex items-center justify-between">
                <span>Matériel sorti</span>
                <Truck className="h-3.5 w-3.5 text-stone-400 group-hover:text-[#1E4D38]" />
              </div>
              <div className="mt-2 text-2xl font-bold text-stone-900 tracking-tight">
                {rentedUnitsCount}
              </div>
              <div className="text-xs text-stone-600 mt-0.5">unités chez {activeCustomerCount} clients</div>
            </div>
            <div className="mt-3 pt-2 border-t border-stone-100 text-[11px] text-[#1E4D38] font-medium">
              Voir les détenteurs actuels →
            </div>
          </div>

          {/* Card 3: When should it come back? */}
          <div
            role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onNavigate('rentals'); } }} onClick={() => onNavigate('rentals')}
            className={`group cursor-pointer rounded-xl border p-4 transition-all flex flex-col justify-between ${
              overdueRentals.length > 0
                ? 'border-amber-200 bg-amber-50/40 hover:border-amber-300'
                : 'border-stone-200 bg-white hover:border-[#1E4D38]/50'
            }`}
          >
            <div>
              <div className="text-[11px] font-medium text-stone-500 flex items-center justify-between">
                <span>Retours attendus</span>
                <Clock className="h-3.5 w-3.5 text-stone-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-stone-900 tracking-tight">
                {returnsExpectedToday.length}
              </div>
              <div className="text-xs text-stone-600 mt-0.5">prévus aujourd’hui</div>
            </div>
            <div className="mt-3 pt-2 border-t border-stone-100/80 text-[11px]">
              {overdueRentals.length > 0 ? (
                <span className="font-semibold text-amber-700">
                  {overdueRentals.length} retour(s) en retard !
                </span>
              ) : (
                <span className="text-stone-500">Aucun retard en cours</span>
              )}
            </div>
          </div>

          {/* Card 4: What is paid vs owed? */}
          <div
            role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onNavigate('payments'); } }} onClick={() => onNavigate('payments')}
            className="group cursor-pointer rounded-xl border border-stone-200 bg-white p-4 transition-all hover:border-[#1E4D38]/50 hover:shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="text-[11px] font-medium text-stone-500 flex items-center justify-between">
                <span>Solde à encaisser</span>
                <CreditCard className="h-3.5 w-3.5 text-stone-400 group-hover:text-[#1E4D38]" />
              </div>
              <div className="mt-2 text-xl font-bold text-stone-900 tracking-tight">
                {formatCurrency(totalOutstandingBalance)}
              </div>
              <div className="text-xs text-stone-600 mt-0.5">restant dû par clients</div>
            </div>
            <div className="mt-3 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
              Cautions : <strong className="text-stone-800">{formatCurrency(depositsHeld)}</strong>
            </div>
          </div>

          {/* Card 5: Which equipment is damaged / unavailable? */}
          <div
            role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onNavigate('maintenance'); } }} onClick={() => onNavigate('maintenance')}
            className={`group cursor-pointer rounded-xl border p-4 transition-all flex flex-col justify-between ${
              maintenanceCount > 0
                ? 'border-stone-200 bg-white hover:border-amber-400'
                : 'border-stone-200 bg-white hover:border-[#1E4D38]/50'
            }`}
          >
            <div>
              <div className="text-[11px] font-medium text-stone-500 flex items-center justify-between">
                <span>Maintenance</span>
                <Wrench className="h-3.5 w-3.5 text-stone-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-stone-900 tracking-tight">
                {maintenanceCount}
              </div>
              <div className="text-xs text-stone-600 mt-0.5">en maintenance ou diagnostic</div>
            </div>
            <div className="mt-3 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
              Exclus du calcul de disponibilité
            </div>
          </div>
        </div>
      </div>

      {/* Operational Split: Today's Tasks & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Operational Workflows (Pickups & Returns for today) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-sm font-semibold text-stone-900">{t.dashboard.todaysTasks}</h3>
                <p className="text-xs text-stone-500">Départs, restitutions et contrôles programmés</p>
              </div>
              <button
                onClick={() => onNavigate('rentals')}
                className="text-xs font-semibold text-[#1E4D38] hover:underline"
              >
                {t.dashboard.viewAll}
              </button>
            </div>

            <div className="space-y-3">
              {/* Pickups Today */}
              <div>
                <div className="text-[11px] font-semibold uppercase text-stone-400 tracking-wider mb-2">
                  Départs prévus aujourd’hui ({pickupsToday.length})
                </div>
                {pickupsToday.length === 0 ? (
                  <p className="text-xs text-stone-400 italic py-2">Aucun départ prévu ce jour.</p>
                ) : (
                  pickupsToday.map((rental) => {
                    const cust = customers.find((c) => c.id === rental.customerId);
                    return (
                      <div
                        key={rental.id}
                        role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelectRental(rental); } }} onClick={() => onSelectRental(rental)}
                        className="cursor-pointer flex items-center justify-between p-3 rounded-lg border border-stone-100 bg-stone-50/50 hover:bg-stone-50 transition-colors mb-2 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-stone-900">{rental.referenceNumber}</span>
                            <StatusBadge type="fulfillment" status={rental.fulfillmentStatus} />
                          </div>
                          <div className="text-stone-600 mt-1">
                            Client : <strong className="font-medium text-stone-800">{cust?.name}</strong> ·{' '}
                            {rental.lines.reduce((s, l) => s + l.quantity, 0)} équipement(s)
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-stone-800">
                            {formatDateTime(rental.startDate)}
                          </div>
                          <span className="text-[11px] text-[#1E4D38] font-semibold mt-0.5 hover:underline">
                            Valider le bon de sortie
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Returns Expected Today */}
              <div className="pt-3">
                <div className="text-[11px] font-semibold uppercase text-stone-400 tracking-wider mb-2">
                  Restitutions attendues ({returnsExpectedToday.length})
                </div>
                {returnsExpectedToday.length === 0 ? (
                  <p className="text-xs text-stone-400 italic py-2">Aucune restitution attendue aujourd’hui.</p>
                ) : (
                  returnsExpectedToday.map((rental) => {
                    const cust = customers.find((c) => c.id === rental.customerId);
                    return (
                      <div
                        key={rental.id}
                        role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelectRental(rental); } }} onClick={() => onSelectRental(rental)}
                        className="cursor-pointer flex items-center justify-between p-3 rounded-lg border border-stone-100 bg-stone-50/50 hover:bg-stone-50 transition-colors mb-2 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-stone-900">{rental.referenceNumber}</span>
                            <StatusBadge type="fulfillment" status={rental.fulfillmentStatus} />
                          </div>
                          <div className="text-stone-600 mt-1">
                            Client : <strong className="font-medium text-stone-800">{cust?.name}</strong>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-stone-800">
                            Échéance : {formatDateTime(rental.endDate)}
                          </div>
                          <span className="text-[11px] text-[#1E4D38] font-semibold mt-0.5 hover:underline">
                            Enregistrer le retour & contrôle
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Quick Actions & Audit Trail */}
        <div className="space-y-4">
          {/* Quick Actions Card */}
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs">
            <h3 className="text-sm font-semibold text-stone-900 mb-3">{t.app.quickActions}</h3>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <button
                onClick={onOpenNewRental}
                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-[#1E4D38] hover:text-white hover:border-[#1E4D38] text-stone-800 font-medium transition-colors text-left"
              >
                <Plus className="h-4 w-4" />
                <span>{t.dashboard.newRental}</span>
              </button>
              <button
                onClick={() => onNavigate('inventory')}
                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-[#1E4D38] hover:text-white hover:border-[#1E4D38] text-stone-800 font-medium transition-colors text-left"
              >
                <Boxes className="h-4 w-4" />
                <span>{t.dashboard.addEquipment}</span>
              </button>
              <button
                onClick={() => onNavigate('customers')}
                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-[#1E4D38] hover:text-white hover:border-[#1E4D38] text-stone-800 font-medium transition-colors text-left"
              >
                <UserCheck className="h-4 w-4" />
                <span>{t.dashboard.addCustomer}</span>
              </button>
              <button
                onClick={() => onNavigate('payments')}
                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-[#1E4D38] hover:text-white hover:border-[#1E4D38] text-stone-800 font-medium transition-colors text-left"
              >
                <CreditCard className="h-4 w-4" />
                <span>Enregistrer un paiement / caution</span>
              </button>
            </div>
          </div>

          {/* Recent Activity Audit Trail */}
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs">
            <h3 className="text-sm font-semibold text-stone-900 mb-3">{t.dashboard.recentActivity}</h3>
            <div className="space-y-3">
              {[...auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5).map((log) => (
                <div key={log.id} className="text-xs pb-2 border-b border-stone-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span className="font-semibold text-stone-600 uppercase tracking-wider">
                      {log.action}
                    </span>
                    <span>{formatDateTime(log.timestamp)}</span>
                  </div>
                  <div className="text-stone-700 mt-1">{log.details}</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">Par {log.userName}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
