import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  DollarSign,
  Shield,
  TrendingUp,
  AlertTriangle,
  Wrench,
  Clock,
  Layers,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import {
  Rental,
  Equipment,
  RentalPayment,
  DepositLedgerEntry,
  MaintenanceLog,
} from '../../types';

interface ReportsViewProps {
  rentals: Rental[];
  equipmentList: Equipment[];
  payments: RentalPayment[];
  deposits: DepositLedgerEntry[];
  maintenance: MaintenanceLog[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  rentals,
  equipmentList,
  payments,
  deposits,
  maintenance,
}) => {
  const { t, formatCurrency } = useI18n();

  const [timeframe, setTimeframe] = useState<'30days' | '90days' | 'all'>('30days');

  // Calculations
  const totalBilled = rentals
    .filter((r) => r.bookingStatus !== 'cancelled' && r.bookingStatus !== 'declined')
    .reduce((s, r) => s + r.rentalTotal, 0);

  const totalCollectedRental = payments
    .filter((p) => p.type === 'rental_charge_payment')
    .reduce((s, p) => s + p.amount, 0);

  const totalRentalRefunds = payments
    .filter((p) => p.type === 'rental_refund')
    .reduce((s, p) => s + p.amount, 0);

  const netRentalCash = totalCollectedRental - totalRentalRefunds;
  const outstandingReceivables = Math.max(0, totalBilled - totalCollectedRental);

  const totalDepositsHeld = deposits.reduce((bal, d) => {
    if (d.type === 'deposit_received') return bal + d.amount;
    if (d.type === 'deposit_refunded' || d.type === 'deposit_deducted_for_damage') return bal - d.amount;
    return bal;
  }, 0);

  const totalMaintenanceCost = maintenance.reduce(
    (s, m) => s + (m.actualCost || m.estimatedCost || 0),
    0
  );

  // Utilization calculation
  const totalEquipmentUnits = equipmentList.reduce(
    (s, eq) => s + (eq.trackingMode === 'individual' ? eq.units?.length || 0 : eq.totalQuantity),
    0
  );

  const activeRentals = rentals.filter(
    (r) => r.fulfillmentStatus === 'checked_out' || r.fulfillmentStatus === 'partially_picked_up'
  );

  const rentedUnitsNow = activeRentals.reduce(
    (sum, r) => sum + r.lines.reduce((lsum, l) => lsum + Math.max(0, l.pickedUpQuantity - l.returnedQuantity), 0),
    0
  );

  const utilizationPercentage = totalEquipmentUnits > 0 ? Math.round((rentedUnitsNow / totalEquipmentUnits) * 100) : 0;

  // Most rented equipment calculation
  const equipmentUsageMap = useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>();
    equipmentList.forEach((eq) => {
      map.set(eq.id, { name: eq.name, count: 0, revenue: 0 });
    });

    rentals.forEach((r) => {
      if (r.bookingStatus === 'cancelled' || r.bookingStatus === 'declined') return;
      r.lines.forEach((line) => {
        const item = map.get(line.equipmentId);
        if (item) {
          item.count += line.quantity;
          item.revenue += line.lineTotal;
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [equipmentList, rentals]);

  // Export report CSV
  const handleExportCsv = () => {
    const csvContent =
      'Metrique,Valeur\n' +
      `"Recettes nettes encaissees (hors cautions)","${netRentalCash} MAD"\n` +
      `"Creances clients restant dues","${outstandingReceivables} MAD"\n` +
      `"Cautions actuellement detenues","${totalDepositsHeld} MAD"\n` +
      `"Depenses de maintenance","${totalMaintenanceCost} MAD"\n` +
      `"Taux instantane d utilisation","${utilizationPercentage}%"\n\n` +
      'Materiel,NombreLocations,RevenusLocatifsTotal\n' +
      equipmentUsageMap
        .map((e) => `"${e.name.replace(/"/g, '""')}",${e.count},${e.revenue}`)
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kriya-rapport-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-stone-900 tracking-tight">{t.reports.title}</h1>
          <p className="text-xs text-stone-500">{t.reports.subtitle}</p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-2xs self-start sm:self-auto"
        >
          <Download className="h-3.5 w-3.5 text-stone-500" />
          <span>{t.reports.exportReportCsv}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs">
          <div className="text-[10px] font-semibold text-stone-400 uppercase">
            {t.reports.revenueExclDeposit}
          </div>
          <div className="text-xl font-bold text-stone-900 mt-1">{formatCurrency(netRentalCash)}</div>
          <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
            100% encaissé (hors cautions)
          </div>
        </div>

        <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs">
          <div className="text-[10px] font-semibold text-stone-400 uppercase">
            {t.reports.unpaidBalances}
          </div>
          <div className="text-xl font-bold text-red-700 mt-1">
            {formatCurrency(outstandingReceivables)}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Créances sur locations confirmées</div>
        </div>

        <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs">
          <div className="text-[10px] font-semibold text-stone-400 uppercase">
            {t.reports.totalDepositsHeld}
          </div>
          <div className="text-xl font-bold text-amber-900 mt-1">
            {formatCurrency(totalDepositsHeld)}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Garanties temporaires en coffre</div>
        </div>

        <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs">
          <div className="text-[10px] font-semibold text-stone-400 uppercase">
            {t.reports.utilizationRate}
          </div>
          <div className="text-xl font-bold text-[#1E4D38] mt-1">{utilizationPercentage}%</div>
          <div className="text-[11px] text-stone-500 mt-0.5">
            {rentedUnitsNow} / {totalEquipmentUnits} unités en location
          </div>
        </div>
      </div>

      {/* Utilization Explanation Box */}
      <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 text-xs text-stone-700 space-y-1">
        <div className="font-semibold text-stone-900 flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-[#1E4D38]" />
          Définition rigoureuse du taux d'utilisation
        </div>
        <p className="text-[11px] leading-relaxed text-stone-600">
          {t.reports.utilizationExplanation} Les équipements bloqués en atelier de réparation sont comptabilisés dans le parc total mais exclus du numérateur d'actifs exploitables.
        </p>
      </div>

      {/* Equipment Revenue Ranking Table */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs space-y-3 text-xs">
        <div className="font-bold text-stone-900 text-sm">
          {t.reports.topRented} & Chiffre d'affaires par matériel
        </div>

        <div className="rounded-lg border border-stone-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold text-[11px]">
              <tr>
                <th className="p-3">Matériel</th>
                <th className="p-3 text-center">Unités louées</th>
                <th className="p-3 text-right">Chiffre d'affaires cumulé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {equipmentUsageMap.slice(0, 10).map((item, idx) => (
                <tr key={idx} className="hover:bg-stone-50/60">
                  <td className="p-3 font-semibold text-stone-900">
                    <span className="text-stone-400 font-mono mr-2">#{idx + 1}</span>
                    {item.name}
                  </td>
                  <td className="p-3 text-center font-bold text-stone-800">{item.count}</td>
                  <td className="p-3 text-right font-bold text-stone-900">
                    {formatCurrency(item.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
