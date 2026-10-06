import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  ArrowRight,
  Shield,
  Wrench,
  Truck,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { Equipment, EquipmentCategory, Rental, MaintenanceLog, TrackingMode } from '../../types';
import { EquipmentDetailModal } from './EquipmentDetailModal';
import { EquipmentFormModal } from './EquipmentFormModal';
import { CsvImportModal } from './CsvImportModal';

interface InventoryListViewProps {
  equipmentList: Equipment[];
  allRentals: Rental[];
  allMaintenance: MaintenanceLog[];
  onSaveEquipment: (eq: Equipment) => void;
  onImportEquipment: (items: Equipment[]) => void;
  locationId: string;
}

export const InventoryListView: React.FC<InventoryListViewProps> = ({
  equipmentList,
  allRentals,
  allMaintenance,
  onSaveEquipment,
  onImportEquipment,
  locationId,
}) => {
  const { t, formatCurrency } = useI18n();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTrackingMode, setSelectedTrackingMode] = useState<string>('all');

  // Modals state
  const [selectedEquipmentForDetail, setSelectedEquipmentForDetail] = useState<Equipment | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);

  // Filtered equipment list
  const filteredEquipment = useMemo(() => {
    return equipmentList.filter((eq) => {
      const matchesSearch =
        eq.name.toLowerCase().includes(search.toLowerCase()) ||
        eq.description.toLowerCase().includes(search.toLowerCase()) ||
        (eq.sku && eq.sku.toLowerCase().includes(search.toLowerCase())) ||
        eq.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;
      if (selectedCategory !== 'all' && eq.category !== selectedCategory) return false;
      if (selectedTrackingMode !== 'all' && eq.trackingMode !== selectedTrackingMode) return false;

      return true;
    });
  }, [equipmentList, search, selectedCategory, selectedTrackingMode]);

  // Handle Export CSV
  const handleExportCsv = () => {
    const headers = 'ID,Nom,Categorie,Mode,QuantiteTotale,TarifJournalier,Caution,ValeurNeuf,SKU\n';
    const rows = equipmentList
      .map(
        (eq) =>
          `"${eq.id}","${eq.name.replace(/"/g, '""')}","${eq.category}","${eq.trackingMode}",${
            eq.trackingMode === 'individual' ? eq.units?.length || 0 : eq.totalQuantity
          },${eq.dailyRate},${eq.suggestedDeposit},${eq.replacementValue},"${eq.sku || ''}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kriya-inventaire-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-stone-900 tracking-tight">{t.inventory.title}</h1>
          <p className="text-xs text-stone-500">{t.inventory.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCsvImportOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-2xs"
          >
            <Upload className="h-3.5 w-3.5 text-stone-500" />
            <span>{t.inventory.importCsv}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-stone-500" />
            <span>{t.inventory.exportCsv}</span>
          </button>

          <button
            onClick={() => {
              setEditingEquipment(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E4D38] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#163B2B]"
          >
            <Plus className="h-4 w-4" />
            <span>{t.inventory.addEquipment}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-white">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.inventory.searchPlaceholder}
            className="w-full rounded-md border border-stone-200 pl-8 pr-3 py-1.5 text-xs bg-stone-50/50 outline-none focus:bg-white focus:border-[#1E4D38]"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-700 outline-none"
          >
            <option value="all">{t.inventory.allCategories}</option>
            <option value="construction">{t.inventory.catConstruction}</option>
            <option value="events">{t.inventory.catEvents}</option>
            <option value="audiovisual">{t.inventory.catAudiovisual}</option>
            <option value="cleaning">{t.inventory.catCleaning}</option>
            <option value="gardening">{t.inventory.catGardening}</option>
            <option value="sports">{t.inventory.catSports}</option>
            <option value="custom">{t.inventory.catCustom}</option>
          </select>

          {/* Tracking Mode Filter */}
          <select
            value={selectedTrackingMode}
            onChange={(e) => setSelectedTrackingMode(e.target.value)}
            className="rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-700 outline-none"
          >
            <option value="all">Tous les modes de suivi</option>
            <option value="individual">Sérialisé individuel</option>
            <option value="quantity">Stock quantitatif</option>
          </select>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold text-[11px]">
              <tr>
                <th className="p-3.5">Matériel & Modèle</th>
                <th className="p-3.5">Catégorie</th>
                <th className="p-3.5">Suivi</th>
                <th className="p-3.5 text-center">Stock total</th>
                <th className="p-3.5 text-center">En location</th>
                <th className="p-3.5 text-center">En atelier</th>
                <th className="p-3.5 text-right">{t.inventory.dailyRate}</th>
                <th className="p-3.5 text-right">Caution</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-stone-400 italic">
                    {t.common.noData}
                  </td>
                </tr>
              ) : (
                filteredEquipment.map((eq) => {
                  // Count how many are in rent right now
                  const activeLines = allRentals
                    .filter(
                      (r) =>
                        r.fulfillmentStatus === 'checked_out' ||
                        r.fulfillmentStatus === 'partially_picked_up'
                    )
                    .flatMap((r) => r.lines.filter((l) => l.equipmentId === eq.id));

                  const rentedNow = activeLines.reduce(
                    (s, l) => s + Math.max(0, l.pickedUpQuantity - l.returnedQuantity),
                    0
                  );

                  // Count in maintenance
                  const maintLogs = allMaintenance.filter(
                    (m) => m.equipmentId === eq.id && m.status !== 'resolved'
                  );
                  const inMaintCount = maintLogs.reduce(
                    (s, m) => s + (m.affectedQuantity || 1),
                    0
                  );

                  const totalCount =
                    eq.trackingMode === 'individual' ? eq.units?.length || 0 : eq.totalQuantity;

                  return (
                    <tr
                      key={eq.id}
                      onClick={() => setSelectedEquipmentForDetail(eq)}
                      className="cursor-pointer hover:bg-stone-50/70 transition-colors"
                    >
                      <td className="p-3.5">
                        <div className="font-semibold text-stone-900">{eq.name}</div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          {eq.sku ? `SKU: ${eq.sku}` : 'Sans SKU'} · Valeur à neuf: {formatCurrency(eq.replacementValue)}
                        </div>
                      </td>
                      <td className="p-3.5 text-stone-600 capitalize">{eq.category}</td>
                      <td className="p-3.5 text-stone-500">
                        {eq.trackingMode === 'individual' ? (
                          <span className="font-medium text-stone-800">Sérialisé</span>
                        ) : (
                          <span>Quantitatif</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-bold text-stone-900">{totalCount}</td>
                      <td className="p-3.5 text-center">
                        {rentedNow > 0 ? (
                          <span className="font-semibold text-stone-800">{rentedNow}</span>
                        ) : (
                          <span className="text-stone-300">0</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {inMaintCount > 0 ? (
                          <span className="font-semibold text-amber-700">{inMaintCount}</span>
                        ) : (
                          <span className="text-stone-300">0</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-bold text-[#1E4D38] whitespace-nowrap">
                        {formatCurrency(eq.dailyRate)}
                      </td>
                      <td className="p-3.5 text-right text-stone-600 whitespace-nowrap">
                        {formatCurrency(eq.suggestedDeposit)}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E4D38] hover:underline">
                          <span>Fiche</span>
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Equipment Detail Modal */}
      {selectedEquipmentForDetail && (
        <EquipmentDetailModal
          isOpen={Boolean(selectedEquipmentForDetail)}
          onClose={() => setSelectedEquipmentForDetail(null)}
          equipment={selectedEquipmentForDetail}
          allRentals={allRentals}
          allMaintenance={allMaintenance}
          onEditEquipment={() => {
            setEditingEquipment(selectedEquipmentForDetail);
            setSelectedEquipmentForDetail(null);
            setIsFormOpen(true);
          }}
        />
      )}

      {/* Equipment Form Modal (Create or Edit) */}
      {isFormOpen && (
        <EquipmentFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingEquipment(null);
          }}
          onSave={onSaveEquipment}
          initialEquipment={editingEquipment}
          locationId={locationId}
        />
      )}

      {/* CSV Import Modal */}
      {isCsvImportOpen && (
        <CsvImportModal
          isOpen={isCsvImportOpen}
          onClose={() => setIsCsvImportOpen(false)}
          existingEquipment={equipmentList}
          onImportSuccess={onImportEquipment}
          locationId={locationId}
        />
      )}
    </div>
  );
};
