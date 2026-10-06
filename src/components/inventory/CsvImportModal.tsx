import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { Equipment, EquipmentCategory } from '../../types';
import { Modal } from '../common/Modal';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingEquipment: Equipment[];
  onImportSuccess: (imported: Equipment[]) => void;
  locationId: string;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  existingEquipment,
  onImportSuccess,
  locationId,
}) => {
  const { t, formatCurrency } = useI18n();

  // Sample CSV template content that users can test or replace
  const defaultSampleCsv = `Nom,Categorie,Mode,Quantite,TarifJour,Caution,ValeurNeuf,SKU
Perforateur Burineur Hilti TE 70,construction,individual,2,400,3500,12000,BTP-HLT-01
Guirlande Guinguette LED 20m,events,quantity,30,50,150,450,EVT-GRL-20M
Générateur Électrique Inverter 3kVA,construction,individual,1,300,2500,9000,BTP-GEN-01
Pack Micro Sans Fil Shure BLX288,events,individual,2,250,2000,6500,EVT-MIC-SHR`;

  const [csvContent, setCsvContent] = useState(defaultSampleCsv);
  const [parsedRows, setParsedRows] = useState<
    {
      name: string;
      category: EquipmentCategory;
      trackingMode: 'individual' | 'quantity';
      quantity: number;
      dailyRate: number;
      deposit: number;
      replacementValue: number;
      sku: string;
      isDuplicate: boolean;
      isValid: boolean;
    }[]
  >([]);

  // Parse CSV
  const handleParse = () => {
    const lines = csvContent.trim().split('\n');
    if (lines.length <= 1) return;

    const rows = lines.slice(1).map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      const name = parts[0] || '';
      const rawCat = (parts[1] || 'construction').toLowerCase();
      const category: EquipmentCategory = [
        'construction',
        'events',
        'audiovisual',
        'cleaning',
        'gardening',
        'sports',
      ].includes(rawCat)
        ? (rawCat as EquipmentCategory)
        : 'custom';

      const trackingMode: 'individual' | 'quantity' =
        parts[2]?.toLowerCase() === 'quantity' ? 'quantity' : 'individual';
      const quantity = parseInt(parts[3]) || 1;
      const dailyRate = parseFloat(parts[4]) || 100;
      const deposit = parseFloat(parts[5]) || 500;
      const replacementValue = parseFloat(parts[6]) || 2000;
      const sku = parts[7] || '';

      const isDuplicate = existingEquipment.some(
        (eq) => eq.name.toLowerCase() === name.toLowerCase() || (sku && eq.sku === sku)
      );
      const isValid = Boolean(name && dailyRate > 0);

      return {
        name,
        category,
        trackingMode,
        quantity,
        dailyRate,
        deposit,
        replacementValue,
        sku,
        isDuplicate,
        isValid,
      };
    });

    setParsedRows(rows);
  };

  const handleCommitImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid && !r.isDuplicate);
    const newItems: Equipment[] = validRows.map((r, idx) => ({
      id: `eq-imp-${Date.now()}-${idx}`,
      workspaceId: 'ws-atlas-casa',
      name: r.name,
      description: `Équipement importé via CSV (${r.category})`,
      category: r.category,
      tags: [r.category],
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
      trackingMode: r.trackingMode,
      locationId,
      sku: r.sku || undefined,
      dailyRate: r.dailyRate,
      replacementValue: r.replacementValue,
      suggestedDeposit: r.deposit,
      minimumRentalDays: 1,
      turnaroundBufferHours: 2,
      totalQuantity: r.quantity,
      units:
        r.trackingMode === 'individual'
          ? Array.from({ length: r.quantity }).map((_, i) => ({
              id: `u-imp-${Date.now()}-${idx}-${i}`,
              assetNumber: `${r.sku || 'IMP'}-${String(i + 1).padStart(3, '0')}`,
              condition: 'good',
              status: 'available',
            }))
          : undefined,
      isCatalogueVisible: true,
      createdAt: new Date().toISOString(),
    }));

    onImportSuccess(newItems);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importation CSV du parc matériel"
      subtitle="Contrôle de doublons, validation des colonnes et aperçu avant enregistrement"
      maxWidth="3xl"
    >
      <div className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-stone-700 mb-1">
            Données CSV (Collez vos lignes ou utilisez le modèle ci-dessous)
          </label>
          <textarea
            rows={5}
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            className="w-full font-mono text-[11px] rounded-lg border border-stone-200 p-2.5 bg-stone-50"
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[11px] text-stone-500">
            Format attendu : Nom, Categorie, Mode (individual/quantity), Quantite, TarifJour, Caution, ValeurNeuf, SKU
          </span>
          <button
            type="button"
            onClick={handleParse}
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 font-semibold text-stone-800 hover:bg-stone-50 shadow-2xs"
          >
            Analyser et Prévisualiser
          </button>
        </div>

        {/* Parsed Preview Table */}
        {parsedRows.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="font-bold text-stone-900">
              Aperçu des lignes détectées ({parsedRows.length})
            </div>
            <div className="rounded-xl border border-stone-200 overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold text-[11px]">
                  <tr>
                    <th className="p-2.5">Matériel</th>
                    <th className="p-2.5">Catégorie</th>
                    <th className="p-2.5">Mode</th>
                    <th className="p-2.5 text-center">Qté</th>
                    <th className="p-2.5 text-right">Tarif / jour</th>
                    <th className="p-2.5 text-center">Validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {parsedRows.map((r, i) => (
                    <tr key={i} className="hover:bg-stone-50/50">
                      <td className="p-2.5 font-semibold text-stone-900">
                        {r.name} {r.sku && <span className="text-stone-400">({r.sku})</span>}
                      </td>
                      <td className="p-2.5 capitalize text-stone-600">{r.category}</td>
                      <td className="p-2.5 text-stone-600">{r.trackingMode}</td>
                      <td className="p-2.5 text-center font-bold text-stone-800">{r.quantity}</td>
                      <td className="p-2.5 text-right font-medium">{formatCurrency(r.dailyRate)}</td>
                      <td className="p-2.5 text-center">
                        {r.isDuplicate ? (
                          <span className="text-amber-700 font-semibold flex items-center justify-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Doublon
                          </span>
                        ) : r.isValid ? (
                          <span className="text-emerald-700 font-semibold flex items-center justify-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Valide
                          </span>
                        ) : (
                          <span className="text-red-700 font-semibold">Invalide</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-stone-700 hover:bg-stone-50"
          >
            Fermer
          </button>
          <button
            type="button"
            disabled={parsedRows.filter((r) => r.isValid && !r.isDuplicate).length === 0}
            onClick={handleCommitImport}
            className="rounded-lg bg-[#1E4D38] px-4 py-1.5 font-semibold text-white hover:bg-[#163B2B] disabled:opacity-40"
          >
            Importer {parsedRows.filter((r) => r.isValid && !r.isDuplicate).length} équipement(s)
          </button>
        </div>
      </div>
    </Modal>
  );
};
