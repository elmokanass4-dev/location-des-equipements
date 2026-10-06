import React from 'react';
import { Boxes, Wrench, Shield, Clock, Hash, Tag, CheckCircle2 } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { Equipment, Rental, MaintenanceLog } from '../../types';
import { Modal } from '../common/Modal';

interface EquipmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment;
  allRentals: Rental[];
  allMaintenance: MaintenanceLog[];
  onEditEquipment: () => void;
}

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({
  isOpen,
  onClose,
  equipment,
  allRentals,
  allMaintenance,
  onEditEquipment,
}) => {
  const { t, formatCurrency, formatDate } = useI18n();

  // Find maintenance tickets for this equipment
  const maintenanceHistory = allMaintenance.filter((m) => m.equipmentId === equipment.id);

  // Find rentals involving this equipment
  const rentalHistory = allRentals.filter((r) =>
    r.lines.some((l) => l.equipmentId === equipment.id)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={equipment.name}
      subtitle={`Catégorie : ${equipment.category} · ${equipment.sku || 'Sans SKU'}`}
      maxWidth="3xl"
    >
      <div className="space-y-6 text-xs">
        {/* Top Info Banner */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-stone-200 bg-stone-50/50">
          {equipment.imageUrl && (
            <img
              src={equipment.imageUrl}
              alt={equipment.name}
              className="w-28 h-28 rounded-lg object-cover border border-stone-200 shrink-0"
            />
          )}
          <div className="flex-1 space-y-1.5">
            <div className="text-stone-700">{equipment.description}</div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {equipment.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[10px] bg-stone-200/70 text-stone-700 font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
            <div className="text-[11px] text-stone-500 pt-1">
              Mode de suivi :{' '}
              <strong className="text-stone-800">
                {equipment.trackingMode === 'individual'
                  ? 'Actifs sérialisés individuels'
                  : 'Stock quantitatif en volume'}
              </strong>
            </div>
          </div>
        </div>

        {/* Pricing & Deposit Rates Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-stone-200 bg-white">
            <div className="text-[10px] text-stone-400 uppercase font-semibold">Tarif / Jour</div>
            <div className="text-base font-bold text-stone-900 mt-1">
              {formatCurrency(equipment.dailyRate)}
            </div>
          </div>
          <div className="p-3 rounded-lg border border-stone-200 bg-white">
            <div className="text-[10px] text-stone-400 uppercase font-semibold">Caution suggérée</div>
            <div className="text-base font-bold text-amber-900 mt-1">
              {formatCurrency(equipment.suggestedDeposit)}
            </div>
          </div>
          <div className="p-3 rounded-lg border border-stone-200 bg-white">
            <div className="text-[10px] text-stone-400 uppercase font-semibold">Valeur à neuf</div>
            <div className="text-base font-bold text-stone-900 mt-1">
              {formatCurrency(equipment.replacementValue)}
            </div>
          </div>
          <div className="p-3 rounded-lg border border-stone-200 bg-white">
            <div className="text-[10px] text-stone-400 uppercase font-semibold">Tampon préparation</div>
            <div className="text-base font-bold text-stone-900 mt-1">
              {equipment.turnaroundBufferHours} heures
            </div>
          </div>
        </div>

        {/* Individual Units (if individual tracking) */}
        {equipment.trackingMode === 'individual' && equipment.units && (
          <div className="space-y-2">
            <div className="font-bold text-stone-900">
              Unités physiques enregistrées ({equipment.units.length})
            </div>
            <div className="rounded-xl border border-stone-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold text-[11px]">
                  <tr>
                    <th className="p-2.5">Numéro d'actif</th>
                    <th className="p-2.5">Numéro de série</th>
                    <th className="p-2.5 text-center">État physique</th>
                    <th className="p-2.5 text-center">Statut actuel</th>
                    <th className="p-2.5">Observations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {equipment.units.map((unit) => (
                    <tr key={unit.id} className="hover:bg-stone-50/50">
                      <td className="p-2.5 font-bold text-stone-900">{unit.assetNumber}</td>
                      <td className="p-2.5 font-mono text-[11px] text-stone-600">
                        {unit.serialNumber || 'N/A'}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`font-semibold capitalize ${
                            unit.condition === 'excellent' || unit.condition === 'good'
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {unit.condition}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-medium">
                        {unit.status === 'available' ? (
                          <span className="text-emerald-700">En stock</span>
                        ) : unit.status === 'rented' ? (
                          <span className="text-stone-700">En location</span>
                        ) : (
                          <span className="text-red-700">En maintenance</span>
                        )}
                      </td>
                      <td className="p-2.5 text-stone-500 text-[11px]">{unit.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Maintenance Log History */}
        <div className="space-y-2">
          <div className="font-bold text-stone-900">
            Historique de maintenance & pannes ({maintenanceHistory.length})
          </div>
          {maintenanceHistory.length === 0 ? (
            <p className="text-stone-400 italic">Aucune intervention technique enregistrée.</p>
          ) : (
            <div className="space-y-2">
              {maintenanceHistory.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-lg border border-stone-200 bg-stone-50/60 flex items-start justify-between"
                >
                  <div>
                    <div className="font-semibold text-stone-800">{m.issueDescription}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      Prise en charge le {formatDate(m.startDate)} · Prestataire : {m.responsibleParty}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-semibold text-[11px] ${
                        m.status === 'resolved' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {m.status === 'resolved' ? 'Réparé & remis en service' : 'En atelier'}
                    </span>
                    {m.estimatedCost > 0 && (
                      <div className="text-stone-600 font-medium">
                        {formatCurrency(m.actualCost || m.estimatedCost)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-between pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-200 px-3.5 py-1.5 font-medium text-stone-700 hover:bg-stone-50"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={onEditEquipment}
            className="rounded-lg bg-[#1E4D38] px-4 py-1.5 font-semibold text-white hover:bg-[#163B2B]"
          >
            Modifier cet équipement
          </button>
        </div>
      </div>
    </Modal>
  );
};
