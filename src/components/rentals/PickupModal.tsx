import React, { useState } from 'react';
import { Truck, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { Rental, Equipment, PickupRecord } from '../../types';
import { Modal } from '../common/Modal';

interface PickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: Rental;
  equipmentList: Equipment[];
  onConfirmPickup: (record: PickupRecord) => void;
  userName: string;
}

export const PickupModal: React.FC<PickupModalProps> = ({
  isOpen,
  onClose,
  rental,
  equipmentList,
  onConfirmPickup,
  userName,
}) => {
  const { t, formatCurrency, formatDateTime } = useI18n();

  // Quantities to dispatch per line
  const [itemsToPickup, setItemsToPickup] = useState<{ [lineId: string]: number }>(() => {
    const initial: { [lineId: string]: number } = {};
    rental.lines.forEach((line) => {
      const remaining = Math.max(0, line.quantity - line.pickedUpQuantity);
      initial[line.id] = remaining;
    });
    return initial;
  });

  const [conditionNotes, setConditionNotes] = useState('Matériel vérifié en bon état de fonctionnement.');
  const [customerSignatureName, setCustomerSignatureName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const items = rental.lines
      .map((line) => ({
        lineItemId: line.id,
        quantity: itemsToPickup[line.id] || 0,
        unitIds: line.assignedUnitIds,
      }))
      .filter((i) => i.quantity > 0);

    if (items.length === 0) return;

    const record: PickupRecord = {
      id: `pk-${Date.now()}`,
      timestamp: new Date().toISOString(),
      performedBy: userName,
      items,
      conditionNotes,
      customerSignatureName: customerSignatureName || 'Client',
    };

    onConfirmPickup(record);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bon de sortie matériel · ${rental.referenceNumber}`}
      subtitle="Validation de mise à disposition et contrôle de départ"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Financial requirement alert at desk */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-stone-800 flex items-start gap-2.5">
          <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-900">
              Vérification comptoir : Caution exigible de {formatCurrency(rental.depositRequired)}
            </div>
            <div className="text-[11px] text-amber-800 mt-0.5">
              Statut de règlement actuel : <span className="font-bold">{rental.paymentStatus}</span>. S'assurer de la détention de la garantie avant sortie physique des machines.
            </div>
          </div>
        </div>

        {/* Item check table */}
        <div className="rounded-xl border border-stone-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold text-[11px]">
              <tr>
                <th className="p-3">Équipement</th>
                <th className="p-3 text-center">Déjà sorti</th>
                <th className="p-3 text-center">À sortir maintenant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rental.lines.map((line) => {
                const remaining = Math.max(0, line.quantity - line.pickedUpQuantity);
                return (
                  <tr key={line.id}>
                    <td className="p-3">
                      <div className="font-semibold text-stone-900">{line.equipmentName}</div>
                      <div className="text-[10px] text-stone-400">
                        Total prévu au contrat : {line.quantity} unité(s)
                      </div>
                    </td>
                    <td className="p-3 text-center text-stone-600">
                      {line.pickedUpQuantity} / {line.quantity}
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max={remaining}
                        value={itemsToPickup[line.id] ?? 0}
                        onChange={(e) =>
                          setItemsToPickup({
                            ...itemsToPickup,
                            [line.id]: Math.min(remaining, Math.max(0, parseInt(e.target.value) || 0)),
                          })
                        }
                        className="w-16 rounded border border-stone-200 p-1 text-center font-semibold text-xs"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Condition Notes */}
        <div>
          <label className="block font-medium text-stone-700 mb-1">
            Constat d’état au départ & Accessoires remis
          </label>
          <textarea
            rows={2}
            value={conditionNotes}
            onChange={(e) => setConditionNotes(e.target.value)}
            className="w-full rounded-md border border-stone-200 p-2 text-xs"
          />
        </div>

        {/* Customer representative name */}
        <div>
          <label className="block font-medium text-stone-700 mb-1">
            Nom du réceptionnaire (Client ou convoyeur)
          </label>
          <input
            type="text"
            required
            value={customerSignatureName}
            onChange={(e) => setCustomerSignatureName(e.target.value)}
            placeholder="ex. Karim Bouzidi"
            className="w-full rounded-md border border-stone-200 p-2 text-xs"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-200 px-3 py-1.5 font-medium text-stone-700 hover:bg-stone-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#1E4D38] px-4 py-1.5 font-semibold text-white hover:bg-[#163B2B] shadow-xs"
          >
            Confirmer la sortie du matériel
          </button>
        </div>
      </form>
    </Modal>
  );
};
