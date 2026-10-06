import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { MaintenanceLog, Equipment } from '../../types';
import { Modal } from '../common/Modal';

interface MaintenanceViewProps {
  maintenanceLogs: MaintenanceLog[];
  equipmentList: Equipment[];
  onSaveLog: (log: MaintenanceLog) => void;
  onResolveTicket: (id: string, notes: string, actualCost: number) => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  maintenanceLogs,
  equipmentList,
  onSaveLog,
  onResolveTicket,
}) => {
  const { t, formatCurrency, formatDate } = useI18n();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [resolvingTicket, setResolvingTicket] = useState<MaintenanceLog | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('Réparation effectuée, contrôle qualité conforme.');
  const [resolutionCost, setResolutionCost] = useState<number>(0);

  // New ticket state
  const [selectedEqId, setSelectedEqId] = useState(equipmentList[0]?.id || '');
  const [issueDescription, setIssueDescription] = useState('');
  const [affectedQty, setAffectedQty] = useState<number>(1);
  const [responsibleParty, setResponsibleParty] = useState('Atelier interne');
  const [estimatedCost, setEstimatedCost] = useState<number>(500);

  const activeCount = maintenanceLogs.filter((m) => m.status !== 'resolved').length;

  const filteredLogs = maintenanceLogs.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch =
      m.equipmentName.toLowerCase().includes(q) ||
      m.issueDescription.toLowerCase().includes(q) ||
      m.responsibleParty.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (filterStatus !== 'all' && m.status !== filterStatus) return false;
    return true;
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const eq = equipmentList.find((e) => e.id === selectedEqId);
    if (!eq || !issueDescription) return;

    const newLog: MaintenanceLog = {
      id: `maint-${Date.now()}`,
      workspaceId: eq.workspaceId,
      equipmentId: eq.id,
      equipmentName: eq.name,
      affectedQuantity: affectedQty,
      issueDescription,
      startDate: new Date().toISOString(),
      expectedCompletionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      responsibleParty,
      estimatedCost,
      status: 'in_repair',
      createdAt: new Date().toISOString(),
    };

    onSaveLog(newLog);
    setIsNewTicketOpen(false);
    setIssueDescription('');
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTicket) return;
    onResolveTicket(resolvingTicket.id, resolutionNotes, resolutionCost);
    setResolvingTicket(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-stone-900 tracking-tight">{t.maintenance.title}</h1>
          <p className="text-xs text-stone-500">{t.maintenance.subtitle}</p>
        </div>

        <button
          onClick={() => setIsNewTicketOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E4D38] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#163B2B]"
        >
          <Plus className="h-4 w-4" />
          <span>{t.maintenance.newTicket}</span>
        </button>
      </div>

      {/* Availability Impact Notice */}
      <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 text-xs text-stone-700 flex items-start gap-2.5">
        <Wrench className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-stone-900">
            Impact direct sur les disponibilités ({activeCount} machine(s) immobilisée(s)) :
          </span>{' '}
          Tant qu'un ordre de réparation n'est pas expressément clôturé par un agent d'atelier, le matériel correspondant demeure soustrait des stocks réservables pour les nouvelles demandes.
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-white">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par matériel, panne, prestataire..."
            className="w-full rounded-md border border-stone-200 pl-8 pr-3 py-1.5 text-xs bg-stone-50/50 outline-none focus:bg-white focus:border-[#1E4D38]"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-700 outline-none"
        >
          <option value="all">Tous les états</option>
          <option value="diagnosing">{t.maintenance.statusDiagnosing}</option>
          <option value="in_repair">{t.maintenance.statusInRepair}</option>
          <option value="waiting_parts">{t.maintenance.statusWaitingParts}</option>
          <option value="resolved">{t.maintenance.statusResolved}</option>
        </select>
      </div>

      {/* Tickets List */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold text-[11px]">
            <tr>
              <th className="p-3.5">Équipement immobilisé</th>
              <th className="p-3.5 text-center">Qté bloquée</th>
              <th className="p-3.5">Constat / Panne</th>
              <th className="p-3.5">Prise en charge</th>
              <th className="p-3.5">Prestataire SAV</th>
              <th className="p-3.5 text-right">Coût</th>
              <th className="p-3.5 text-center">État atelier</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-stone-400 italic">
                  Aucun ordre de maintenance correspondant.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-stone-50/70">
                  <td className="p-3.5 font-semibold text-stone-900">
                    <div>{log.equipmentName}</div>
                    {log.unitId && <div className="text-[10px] text-stone-400">Actif : {log.unitId}</div>}
                  </td>
                  <td className="p-3.5 text-center font-bold text-stone-800">
                    {log.affectedQuantity}
                  </td>
                  <td className="p-3.5 text-stone-700 max-w-xs truncate">{log.issueDescription}</td>
                  <td className="p-3.5 text-stone-600 whitespace-nowrap">
                    {formatDate(log.startDate)}
                  </td>
                  <td className="p-3.5 text-stone-600">{log.responsibleParty}</td>
                  <td className="p-3.5 text-right font-medium text-stone-900 whitespace-nowrap">
                    {formatCurrency(log.actualCost || log.estimatedCost)}
                  </td>
                  <td className="p-3.5 text-center whitespace-nowrap">
                    {log.status === 'resolved' ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Remis en stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-800">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        En atelier
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap">
                    {log.status !== 'resolved' ? (
                      <button
                        onClick={() => {
                          setResolvingTicket(log);
                          setResolutionCost(log.estimatedCost);
                        }}
                        className="inline-flex items-center gap-1 rounded bg-[#1E4D38] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#163B2B]"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Remettre en stock</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-stone-400">Clôturé</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Ticket Modal */}
      {isNewTicketOpen && (
        <Modal
          isOpen={isNewTicketOpen}
          onClose={() => setIsNewTicketOpen(false)}
          title="Ouvrir un ordre de maintenance"
          subtitle="Cette opération bloque la quantité indiquée dans le moteur de disponibilité"
          maxWidth="md"
        >
          <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-stone-700 mb-1">Équipement concerné *</label>
              <select
                value={selectedEqId}
                onChange={(e) => setSelectedEqId(e.target.value)}
                className="w-full rounded border border-stone-200 p-2 text-xs bg-white"
              >
                {equipmentList.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} ({eq.sku || eq.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Quantité immobilisée *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={affectedQty}
                  onChange={(e) => setAffectedQty(parseInt(e.target.value) || 1)}
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Coût estimé (MAD)</label>
                <input
                  type="number"
                  min="0"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Description de la panne *</label>
              <textarea
                rows={2}
                required
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="ex. Lance fêlée, révision moteur, charbons usés..."
                className="w-full rounded border border-stone-200 p-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Prestataire ou technicien</label>
              <input
                type="text"
                value={responsibleParty}
                onChange={(e) => setResponsibleParty(e.target.value)}
                placeholder="Atelier interne / SAV constructeur"
                className="w-full rounded border border-stone-200 p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setIsNewTicketOpen(false)}
                className="px-3 py-1.5 rounded border border-stone-200 text-stone-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-[#1E4D38] text-white font-semibold"
              >
                Bloquer et créer le ticket
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Resolve Ticket Modal */}
      {resolvingTicket && (
        <Modal
          isOpen={Boolean(resolvingTicket)}
          onClose={() => setResolvingTicket(null)}
          title="Restituer l'équipement en stock disponible"
          subtitle={resolvingTicket.equipmentName}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmResolve} className="space-y-3 text-xs">
            <p className="text-stone-700">
              Confirmez-vous que l'équipement a été réparé, contrôlé et qu'il peut à nouveau être loué aux clients ?
            </p>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Coût réel de la réparation (MAD)</label>
              <input
                type="number"
                min="0"
                value={resolutionCost}
                onChange={(e) => setResolutionCost(parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-stone-200 p-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Rapport de remise en service</label>
              <textarea
                rows={2}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full rounded border border-stone-200 p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setResolvingTicket(null)}
                className="px-3 py-1.5 rounded border border-stone-200 text-stone-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-[#1E4D38] text-white font-semibold"
              >
                {t.maintenance.restoreToStock}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
