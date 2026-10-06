import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { Equipment, EquipmentCategory, TrackingMode, AssetUnit } from '../../types';
import { Modal } from '../common/Modal';

interface EquipmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (equipment: Equipment) => void;
  initialEquipment?: Equipment | null;
  locationId: string;
}

export const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEquipment,
  locationId,
}) => {
  const { t } = useI18n();

  const [name, setName] = useState(initialEquipment?.name || '');
  const [description, setDescription] = useState(initialEquipment?.description || '');
  const [category, setCategory] = useState<EquipmentCategory>(initialEquipment?.category || 'construction');
  const [sku, setSku] = useState(initialEquipment?.sku || '');
  const [tagsStr, setTagsStr] = useState(initialEquipment?.tags?.join(', ') || '');
  const [trackingMode, setTrackingMode] = useState<TrackingMode>(initialEquipment?.trackingMode || 'individual');
  const [dailyRate, setDailyRate] = useState<number>(initialEquipment?.dailyRate || 250);
  const [hourlyRate, setHourlyRate] = useState<number>(initialEquipment?.hourlyRate || 50);
  const [weeklyRate, setWeeklyRate] = useState<number>(initialEquipment?.weeklyRate || 1200);
  const [replacementValue, setReplacementValue] = useState<number>(initialEquipment?.replacementValue || 8000);
  const [suggestedDeposit, setSuggestedDeposit] = useState<number>(
    initialEquipment?.suggestedDeposit || 2000
  );
  const [turnaroundBufferHours, setTurnaroundBufferHours] = useState<number>(
    initialEquipment?.turnaroundBufferHours || 2
  );
  const [totalQuantity, setTotalQuantity] = useState<number>(initialEquipment?.totalQuantity || 1);
  const [isCatalogueVisible, setIsCatalogueVisible] = useState(
    initialEquipment?.isCatalogueVisible !== false
  );

  // Serialized units for individual mode
  const [units, setUnits] = useState<AssetUnit[]>(
    initialEquipment?.units || [
      {
        id: `u-${Date.now()}-1`,
        assetNumber: 'ACT-001',
        serialNumber: '',
        condition: 'good',
        status: 'available',
      },
    ]
  );

  const handleAddUnit = () => {
    const nextNum = units.length + 1;
    setUnits([
      ...units,
      {
        id: `u-${Date.now()}-${nextNum}`,
        assetNumber: `ACT-${String(nextNum).padStart(3, '0')}`,
        serialNumber: '',
        condition: 'good',
        status: 'available',
      },
    ]);
  };

  const handleRemoveUnit = (idx: number) => {
    setUnits(units.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const saved: Equipment = {
      id: initialEquipment?.id || `eq-${Date.now()}`,
      workspaceId: 'ws-atlas-casa',
      name,
      description,
      category,
      tags,
      imageUrl:
        initialEquipment?.imageUrl ||
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
      trackingMode,
      locationId: initialEquipment?.locationId || locationId,
      sku: sku || undefined,
      dailyRate,
      hourlyRate: hourlyRate || undefined,
      weeklyRate: weeklyRate || undefined,
      replacementValue,
      suggestedDeposit,
      minimumRentalDays: 1,
      turnaroundBufferHours,
      totalQuantity: trackingMode === 'individual' ? units.length : totalQuantity,
      units: trackingMode === 'individual' ? units : undefined,
      isCatalogueVisible,
      createdAt: initialEquipment?.createdAt || new Date().toISOString(),
    };

    onSave(saved);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialEquipment ? 'Modifier le matériel' : 'Ajouter un équipement au parc'}
      subtitle="Fiche technique, tarification, mode de suivi et unités"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block font-medium text-stone-700 mb-1">Désignation du matériel *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex. Marteau Piqueur BOSCH GSH 11 VC"
              className="w-full rounded-md border border-stone-200 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-stone-700 mb-1">Catégorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
              className="w-full rounded-md border border-stone-200 p-2 text-xs"
            >
              <option value="construction">BTP & Outillage</option>
              <option value="events">Événementiel & Mobilier</option>
              <option value="audiovisual">Audiovisuel & Caméras</option>
              <option value="cleaning">Nettoyage professionnel</option>
              <option value="gardening">Espaces verts & Jardin</option>
              <option value="sports">Sports & Loisirs</option>
              <option value="custom">Catégorie spécifique</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-stone-700 mb-1">Référence SKU / Code barre</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="ex. BTP-MP-001"
              className="w-full rounded-md border border-stone-200 p-2 text-xs"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-medium text-stone-700 mb-1">Description & Fiche d'usage</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Caractéristiques techniques, accessoires fournis, consignes..."
              className="w-full rounded-md border border-stone-200 p-2 text-xs"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-medium text-stone-700 mb-1">Mots-clés / Tags (séparés par virgules)</label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="BTP, Béton, Démolition, Perforateur"
              className="w-full rounded-md border border-stone-200 p-2 text-xs"
            />
          </div>
        </div>

        {/* Tracking Mode Selection */}
        <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/70 space-y-2">
          <label className="block font-semibold text-stone-800">Mode de suivi de l'actif</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tracking"
                checked={trackingMode === 'individual'}
                onChange={() => setTrackingMode('individual')}
              />
              <span>Actifs sérialisés individuels (unités avec N° de série)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tracking"
                checked={trackingMode === 'quantity'}
                onChange={() => setTrackingMode('quantity')}
              />
              <span>Stock quantitatif en volume (chaises, barrières...)</span>
            </label>
          </div>
        </div>

        {/* Units manager if individual */}
        {trackingMode === 'individual' ? (
          <div className="p-3 rounded-lg border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-800">Unités physiques ({units.length})</span>
              <button
                type="button"
                onClick={handleAddUnit}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E4D38] hover:underline"
              >
                <Plus className="h-3 w-3" />
                Ajouter une unité
              </button>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {units.map((u, idx) => (
                <div key={u.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={u.assetNumber}
                    onChange={(e) => {
                      const updated = [...units];
                      updated[idx].assetNumber = e.target.value;
                      setUnits(updated);
                    }}
                    placeholder="N° d'actif"
                    className="w-28 rounded border border-stone-200 p-1 text-xs"
                  />
                  <input
                    type="text"
                    value={u.serialNumber || ''}
                    onChange={(e) => {
                      const updated = [...units];
                      updated[idx].serialNumber = e.target.value;
                      setUnits(updated);
                    }}
                    placeholder="N° de série constructeur"
                    className="flex-1 rounded border border-stone-200 p-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveUnit(idx)}
                    className="p-1 text-stone-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="block font-medium text-stone-700 mb-1">Quantité totale en stock</label>
            <input
              type="number"
              min="1"
              value={totalQuantity}
              onChange={(e) => setTotalQuantity(parseInt(e.target.value) || 1)}
              className="w-32 rounded border border-stone-200 p-2 text-xs"
            />
          </div>
        )}

        {/* Pricing & Deposit */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div>
            <label className="block font-medium text-stone-700 mb-1">Tarif journalier (MAD) *</label>
            <input
              type="number"
              required
              min="1"
              value={dailyRate}
              onChange={(e) => setDailyRate(parseFloat(e.target.value) || 0)}
              className="w-full rounded border border-stone-200 p-2 text-xs"
            />
          </div>
          <div>
            <label className="block font-medium text-stone-700 mb-1">Tarif hebdo (MAD)</label>
            <input
              type="number"
              min="0"
              value={weeklyRate}
              onChange={(e) => setWeeklyRate(parseFloat(e.target.value) || 0)}
              className="w-full rounded border border-stone-200 p-2 text-xs"
            />
          </div>
          <div>
            <label className="block font-medium text-stone-700 mb-1">Caution suggérée (MAD)</label>
            <input
              type="number"
              min="0"
              value={suggestedDeposit}
              onChange={(e) => setSuggestedDeposit(parseFloat(e.target.value) || 0)}
              className="w-full rounded border border-stone-200 p-2 text-xs"
            />
          </div>
          <div>
            <label className="block font-medium text-stone-700 mb-1">Valeur à neuf (MAD)</label>
            <input
              type="number"
              min="0"
              value={replacementValue}
              onChange={(e) => setReplacementValue(parseFloat(e.target.value) || 0)}
              className="w-full rounded border border-stone-200 p-2 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-700">
            <input
              type="checkbox"
              checked={isCatalogueVisible}
              onChange={(e) => setIsCatalogueVisible(e.target.checked)}
              className="rounded"
            />
            <span>Afficher dans la vitrine du catalogue public</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-stone-700 hover:bg-stone-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#1E4D38] px-4 py-1.5 font-semibold text-white hover:bg-[#163B2B]"
          >
            Enregistrer l'équipement
          </button>
        </div>
      </form>
    </Modal>
  );
};
