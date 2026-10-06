import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, Sparkles, Shield, Wrench } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { Rental, Equipment, ReturnRecord, MaintenanceLog } from '../../types';
import { Modal } from '../common/Modal';
import { analyzeConditionAndDamage, DamageAnalysisResult } from '../../services/geminiService';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: Rental;
  equipmentList: Equipment[];
  onConfirmReturn: (record: ReturnRecord, maintenanceLogs: MaintenanceLog[]) => void;
  userName: string;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  isOpen,
  onClose,
  rental,
  equipmentList,
  onConfirmReturn,
  userName,
}) => {
  const { t, formatCurrency } = useI18n();

  // Quantities returning per line: good vs damaged vs missing
  const [returnItems, setReturnItems] = useState<{
    [lineId: string]: { good: number; damaged: number; missing: number };
  }>(() => {
    const initial: { [lineId: string]: { good: number; damaged: number; missing: number } } = {};
    rental.lines.forEach((line) => {
      const outstanding = Math.max(0, line.pickedUpQuantity - line.returnedQuantity);
      initial[line.id] = {
        good: outstanding,
        damaged: 0,
        missing: 0,
      };
    });
    return initial;
  });

  const [conditionNotes, setConditionNotes] = useState('Matériel restitué nettoyé et conforme.');
  const [damageNotes, setDamageNotes] = useState('');
  const [damageFee, setDamageFee] = useState<number>(0);
  const [routeToMaintenance, setRouteToMaintenance] = useState(false);

  // Gemini Smart inspection state
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<DamageAnalysisResult | null>(null);

  const handleAiAnalyze = async () => {
    if (!damageNotes) return;
    setIsAnalyzingAi(true);
    try {
      const firstDamagedLine = rental.lines.find((l) => (returnItems[l.id]?.damaged || 0) > 0) || rental.lines[0];
      const eq = equipmentList.find((e) => e.id === firstDamagedLine.equipmentId);
      const res = await analyzeConditionAndDamage(
        firstDamagedLine.equipmentName,
        damageNotes,
        eq?.replacementValue || 5000
      );
      setAiAnalysis(res);
      if (res.routeToMaintenanceRecommended) {
        setRouteToMaintenance(true);
      }
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const createdMaintenanceLogs: MaintenanceLog[] = [];

    const items = rental.lines
      .map((line) => {
        const counts = returnItems[line.id] || { good: 0, damaged: 0, missing: 0 };
        const eq = equipmentList.find((e) => e.id === line.equipmentId);

        // If items are damaged, generate a maintenance log to block availability!
        if (counts.damaged > 0 && routeToMaintenance && eq) {
          const mLog: MaintenanceLog = {
            id: `maint-${Date.now()}-${line.id}`,
            workspaceId: rental.workspaceId,
            equipmentId: eq.id,
            equipmentName: eq.name,
            unitId: line.assignedUnitIds?.[0],
            affectedQuantity: counts.damaged,
            issueDescription: damageNotes || `Dégradation signalée au retour du contrat ${rental.referenceNumber}`,
            startDate: new Date().toISOString(),
            expectedCompletionDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
            responsibleParty: 'Atelier de maintenance interne',
            estimatedCost: damageFee,
            status: 'diagnosing',
            createdAt: new Date().toISOString(),
          };
          createdMaintenanceLogs.push(mLog);
        }

        return {
          lineItemId: line.id,
          quantityReturnedGood: counts.good,
          quantityReturnedDamaged: counts.damaged,
          quantityMissing: counts.missing,
          unitIds: line.assignedUnitIds,
        };
      })
      .filter((i) => i.quantityReturnedGood + i.quantityReturnedDamaged + i.quantityMissing > 0);

    if (items.length === 0) return;

    const returnRecord: ReturnRecord = {
      id: `rt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      performedBy: userName,
      items,
      conditionNotes,
      damageNotes: damageNotes || undefined,
      damageAssessedFee: damageFee > 0 ? damageFee : undefined,
      routedToMaintenance: createdMaintenanceLogs.length > 0,
    };

    onConfirmReturn(returnRecord, createdMaintenanceLogs);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bon de restitution matériel · ${rental.referenceNumber}`}
      subtitle="Contrôle technique de retour, détection de dommages et libération du stock"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Item inspection table */}
        <div className="rounded-xl border border-stone-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold text-[11px]">
              <tr>
                <th className="p-3">Équipement</th>
                <th className="p-3 text-center">Actuellement dehors</th>
                <th className="p-3 text-center">Bon état (restitué)</th>
                <th className="p-3 text-center">Endommagé</th>
                <th className="p-3 text-center">Manquant / Perdu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rental.lines.map((line) => {
                const outstanding = Math.max(0, line.pickedUpQuantity - line.returnedQuantity);
                const counts = returnItems[line.id] || { good: 0, damaged: 0, missing: 0 };

                return (
                  <tr key={line.id}>
                    <td className="p-3">
                      <div className="font-semibold text-stone-900">{line.equipmentName}</div>
                      <div className="text-[10px] text-stone-400">
                        Total loué : {line.quantity} | Restitué à ce jour : {line.returnedQuantity}
                      </div>
                    </td>
                    <td className="p-3 text-center font-bold text-stone-800">{outstanding}</td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max={outstanding}
                        value={counts.good}
                        onChange={(e) =>
                          setReturnItems({
                            ...returnItems,
                            [line.id]: {
                              ...counts,
                              good: Math.max(0, parseInt(e.target.value) || 0),
                            },
                          })
                        }
                        className="w-16 rounded border border-emerald-300 bg-emerald-50/40 p-1 text-center font-semibold text-emerald-900"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max={outstanding}
                        value={counts.damaged}
                        onChange={(e) => {
                          const dmg = Math.max(0, parseInt(e.target.value) || 0);
                          setReturnItems({
                            ...returnItems,
                            [line.id]: {
                              ...counts,
                              damaged: dmg,
                            },
                          });
                          if (dmg > 0) setRouteToMaintenance(true);
                        }}
                        className="w-16 rounded border border-amber-300 bg-amber-50/40 p-1 text-center font-semibold text-amber-900"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max={outstanding}
                        value={counts.missing}
                        onChange={(e) =>
                          setReturnItems({
                            ...returnItems,
                            [line.id]: {
                              ...counts,
                              missing: Math.max(0, parseInt(e.target.value) || 0),
                            },
                          })
                        }
                        className="w-16 rounded border border-red-300 bg-red-50/40 p-1 text-center font-semibold text-red-900"
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
            Observations générales lors du contrôle
          </label>
          <textarea
            rows={2}
            value={conditionNotes}
            onChange={(e) => setConditionNotes(e.target.value)}
            className="w-full rounded-md border border-stone-200 p-2 text-xs"
          />
        </div>

        {/* Damage Section */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-amber-950 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Dommages ou dégradations constatés
            </span>
            <button
              type="button"
              onClick={handleAiAnalyze}
              disabled={!damageNotes || isAnalyzingAi}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" />
              <span>{isAnalyzingAi ? 'Analyse...' : 'Évaluer avec l’IA Gemini'}</span>
            </button>
          </div>

          <div>
            <textarea
              rows={2}
              value={damageNotes}
              onChange={(e) => setDamageNotes(e.target.value)}
              placeholder="Description précise des dégâts (ex. câble sectionné, carter fendu, flexible éclaté...)"
              className="w-full rounded-md border border-amber-200 bg-white p-2 text-xs"
            />
          </div>

          {/* AI Guidance Feedback */}
          {aiAnalysis && (
            <div className="rounded-lg border border-emerald-300 bg-white p-3 text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold text-emerald-900">
                <span>Évaluation technique suggérée : {aiAnalysis.severity.toUpperCase()}</span>
                <span>Fourchette de frais : {aiAnalysis.estimatedCostRangeMAD}</span>
              </div>
              <p className="text-stone-700">{aiAnalysis.suggestedAction}</p>
              <p className="text-[10px] text-stone-500 italic">{aiAnalysis.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-stone-700 mb-1">
                Frais de réparation / remise en état évalués (MAD)
              </label>
              <input
                type="number"
                min="0"
                value={damageFee}
                onChange={(e) => setDamageFee(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full rounded-md border border-stone-200 bg-white p-1.5 text-xs"
              />
              <span className="text-[10px] text-stone-500">
                À imputer sur la caution ou à facturer en accord avec le client
              </span>
            </div>

            <div className="flex items-center pt-4">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-800">
                <input
                  type="checkbox"
                  checked={routeToMaintenance}
                  onChange={(e) => setRouteToMaintenance(e.target.checked)}
                  className="rounded text-[#1E4D38]"
                />
                <span className="flex items-center gap-1">
                  <Wrench className="h-3.5 w-3.5 text-stone-600" />
                  Créer un ordre de maintenance (bloque la disponibilité)
                </span>
              </label>
            </div>
          </div>
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
            Valider le retour et mettre à jour le stock
          </button>
        </div>
      </form>
    </Modal>
  );
};
