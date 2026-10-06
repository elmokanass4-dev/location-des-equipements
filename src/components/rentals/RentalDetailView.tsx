import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  CreditCard,
  Shield,
  FileText,
  Truck,
  RotateCcw,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Phone,
  MessageSquare,
  Wrench,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import {
  Rental,
  Customer,
  Equipment,
  RentalPayment,
  DepositLedgerEntry,
  WorkspaceSettings,
  PickupRecord,
  ReturnRecord,
  MaintenanceLog,
} from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PickupModal } from './PickupModal';
import { ReturnModal } from './ReturnModal';
import { DocumentViewerModal, DocumentType } from '../documents/DocumentViewerModal';

interface RentalDetailViewProps {
  rental: Rental;
  customer?: Customer;
  equipmentList: Equipment[];
  payments: RentalPayment[];
  deposits: DepositLedgerEntry[];
  settings: WorkspaceSettings;
  userName: string;
  onBack: () => void;
  onUpdateRental: (updated: Rental) => void;
  onRecordPayment: (payment: RentalPayment) => void;
  onRecordDeposit: (entry: DepositLedgerEntry) => void;
  onAddMaintenanceLog: (log: MaintenanceLog) => void;
}

export const RentalDetailView: React.FC<RentalDetailViewProps> = ({
  rental,
  customer,
  equipmentList,
  payments,
  deposits,
  settings,
  userName,
  onBack,
  onUpdateRental,
  onRecordPayment,
  onRecordDeposit,
  onAddMaintenanceLog,
}) => {
  const { t, formatCurrency, formatDate, formatDateTime } = useI18n();

  const [activeTab, setActiveTab] = useState<'items' | 'fulfillment' | 'finance' | 'documents'>('items');
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docTypeToView, setDocTypeToView] = useState<DocumentType>('contract');

  // Manual payment modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(rental.rentalTotal);
  const [payMethod, setPayMethod] = useState<RentalPayment['method']>('cash');
  const [payRef, setPayRef] = useState('');

  // Manual deposit modal state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(rental.depositRequired);
  const [depositType, setDepositType] = useState<DepositLedgerEntry['type']>('deposit_received');
  const [depositMethod, setDepositMethod] = useState<DepositLedgerEntry['method']>('cheque_hold');
  const [depositRef, setDepositRef] = useState('');

  // Financial calculations for this rental
  const rentalPayments = payments.filter((p) => p.rentalId === rental.id);
  const totalPaid = rentalPayments
    .filter((p) => p.type === 'rental_charge_payment')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalRefunded = rentalPayments
    .filter((p) => p.type === 'rental_refund')
    .reduce((sum, p) => sum + p.amount, 0);
  const netPaid = totalPaid - totalRefunded;
  const remainingBalance = Math.max(0, rental.rentalTotal - netPaid);

  // Deposit calculations
  const rentalDeposits = deposits.filter((d) => d.rentalId === rental.id);
  const currentDepositHeld = rentalDeposits.reduce((balance, d) => {
    if (d.type === 'deposit_received') return balance + d.amount;
    if (d.type === 'deposit_refunded' || d.type === 'deposit_deducted_for_damage') return balance - d.amount;
    return balance;
  }, 0);

  // Check if overdue
  const now = new Date();
  const plannedEnd = new Date(rental.endDate);
  const isOverdue =
    (rental.fulfillmentStatus === 'checked_out' || rental.fulfillmentStatus === 'partially_picked_up') &&
    plannedEnd < now;

  // Handler for pickup confirmation
  const handleConfirmPickup = (pickupRecord: PickupRecord) => {
    const updatedLines = rental.lines.map((line) => {
      const pickedItem = pickupRecord.items.find((i) => i.lineItemId === line.id);
      const newQty = (line.pickedUpQuantity || 0) + (pickedItem?.quantity || 0);
      return {
        ...line,
        pickedUpQuantity: newQty,
      };
    });

    const totalQty = updatedLines.reduce((s, l) => s + l.quantity, 0);
    const totalPicked = updatedLines.reduce((s, l) => s + l.pickedUpQuantity, 0);

    const newFulfillmentStatus =
      totalPicked >= totalQty ? 'checked_out' : totalPicked > 0 ? 'partially_picked_up' : rental.fulfillmentStatus;

    const updatedRental: Rental = {
      ...rental,
      fulfillmentStatus: newFulfillmentStatus,
      actualPickupDate: rental.actualPickupDate || pickupRecord.timestamp,
      lines: updatedLines,
      pickups: [...rental.pickups, pickupRecord],
      updatedAt: new Date().toISOString(),
    };

    onUpdateRental(updatedRental);
  };

  // Handler for return confirmation
  const handleConfirmReturn = (returnRecord: ReturnRecord, mLogs: MaintenanceLog[]) => {
    mLogs.forEach((log) => onAddMaintenanceLog(log));

    const updatedLines = rental.lines.map((line) => {
      const retItem = returnRecord.items.find((i) => i.lineItemId === line.id);
      const newReturned =
        (line.returnedQuantity || 0) + (retItem?.quantityReturnedGood || 0) + (retItem?.quantityReturnedDamaged || 0);
      const newDamaged = (line.damagedQuantity || 0) + (retItem?.quantityReturnedDamaged || 0);

      return {
        ...line,
        returnedQuantity: newReturned,
        damagedQuantity: newDamaged,
      };
    });

    const totalPicked = updatedLines.reduce((s, l) => s + l.pickedUpQuantity, 0);
    const totalReturned = updatedLines.reduce((s, l) => s + l.returnedQuantity, 0);

    const newFulfillmentStatus =
      totalReturned >= totalPicked ? 'returned' : totalReturned > 0 ? 'partially_returned' : rental.fulfillmentStatus;

    const updatedRental: Rental = {
      ...rental,
      fulfillmentStatus: newFulfillmentStatus,
      actualReturnDate: newFulfillmentStatus === 'returned' ? returnRecord.timestamp : rental.actualReturnDate,
      lines: updatedLines,
      returns: [...rental.returns, returnRecord],
      updatedAt: new Date().toISOString(),
    };

    onUpdateRental(updatedRental);
  };

  // Manual payment submit
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;

    const newPay: RentalPayment = {
      id: `pay-${Date.now()}`,
      rentalId: rental.id,
      type: 'rental_charge_payment',
      amount: payAmount,
      method: payMethod,
      reference: payRef || undefined,
      recordedBy: userName,
      createdAt: new Date().toISOString(),
    };

    onRecordPayment(newPay);

    // Update rental payment status
    const newNetPaid = netPaid + payAmount;
    let newPayStatus = rental.paymentStatus;
    if (newNetPaid >= rental.rentalTotal) newPayStatus = 'paid';
    else if (newNetPaid > 0) newPayStatus = 'partially_paid';

    onUpdateRental({
      ...rental,
      paymentStatus: newPayStatus,
      updatedAt: new Date().toISOString(),
    });

    setShowPayModal(false);
  };

  // Manual deposit submit
  const handleSaveDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (depositAmount <= 0) return;

    const newDep: DepositLedgerEntry = {
      id: `dep-${Date.now()}`,
      rentalId: rental.id,
      type: depositType,
      amount: depositAmount,
      method: depositMethod,
      reference: depositRef || undefined,
      recordedBy: userName,
      createdAt: new Date().toISOString(),
    };

    onRecordDeposit(newDep);
    setShowDepositModal(false);
  };

  const openDocument = (type: DocumentType) => {
    setDocTypeToView(type);
    setShowDocModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-stone-900 tracking-tight">
                {rental.referenceNumber}
              </h1>
              <StatusBadge type="booking" status={rental.bookingStatus} />
              <StatusBadge type="fulfillment" status={rental.fulfillmentStatus} isOverdue={isOverdue} />
              <StatusBadge type="payment" status={rental.paymentStatus} />
            </div>
            <div className="text-xs text-stone-500 mt-0.5">
              Client : <strong className="text-stone-800">{customer?.name || 'Client'}</strong> · Créé le {formatDate(rental.createdAt)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {rental.fulfillmentStatus !== 'returned' && rental.fulfillmentStatus !== 'closed' && (
            <>
              <button
                onClick={() => setShowPickupModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-50 transition-colors shadow-2xs"
              >
                <Truck className="h-3.5 w-3.5 text-[#1E4D38]" />
                <span>Bon de sortie</span>
              </button>
              <button
                onClick={() => setShowReturnModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-50 transition-colors shadow-2xs"
              >
                <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
                <span>Bon de retour</span>
              </button>
            </>
          )}

          <button
            onClick={() => openDocument('contract')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E4D38] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#163B2B] transition-colors shadow-2xs"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Imprimer contrat</span>
          </button>
        </div>
      </div>

      {/* Quick Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Customer Contact */}
        <div className="rounded-xl border border-stone-200 bg-white p-3.5">
          <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
            Locataire
          </div>
          <div className="font-semibold text-stone-900">{customer?.name}</div>
          <div className="text-stone-500 text-[11px] mt-0.5">{customer?.phone}</div>
          {customer?.whatsapp && (
            <a
              href={`https://wa.me/${customer.whatsapp.replace(/\D/g, '')}?text=Bonjour%20${encodeURIComponent(customer.name)},%20concernant%20votre%20location%20${rental.referenceNumber}...`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-2 hover:underline"
            >
              <MessageSquare className="h-3 w-3" />
              <span>Ouvrir WhatsApp</span>
            </a>
          )}
        </div>

        {/* Rental Dates */}
        <div className="rounded-xl border border-stone-200 bg-white p-3.5">
          <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
            Période contractuelle
          </div>
          <div className="text-stone-800 font-medium">Départ : {formatDateTime(rental.startDate)}</div>
          <div className={`mt-0.5 font-medium ${isOverdue ? 'text-amber-700 font-bold' : 'text-stone-800'}`}>
            Retour : {formatDateTime(rental.endDate)} {isOverdue && '(En retard !)'}
          </div>
        </div>

        {/* Financial Balance */}
        <div className="rounded-xl border border-stone-200 bg-white p-3.5">
          <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
            Solde de location
          </div>
          <div className="text-base font-bold text-stone-900">{formatCurrency(rental.rentalTotal)}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">
            Réglé : {formatCurrency(netPaid)} · Reste : <strong className="text-red-700">{formatCurrency(remainingBalance)}</strong>
          </div>
        </div>

        {/* Security Deposit */}
        <div className="rounded-xl border border-stone-200 bg-white p-3.5">
          <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
            Caution de garantie
          </div>
          <div className="text-base font-bold text-amber-900">{formatCurrency(currentDepositHeld)}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">
            Exigée : {formatCurrency(rental.depositRequired)} (détenue séparément)
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200">
        <nav className="flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('items')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'items'
                ? 'border-[#1E4D38] text-[#1E4D38]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Matériels loués ({rental.lines.length})
          </button>
          <button
            onClick={() => setActiveTab('fulfillment')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'fulfillment'
                ? 'border-[#1E4D38] text-[#1E4D38]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Sorties & Retours ({rental.pickups.length + rental.returns.length})
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'finance'
                ? 'border-[#1E4D38] text-[#1E4D38]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Règlements & Grand livre des cautions
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'documents'
                ? 'border-[#1E4D38] text-[#1E4D38]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Documents & Pièces éditables
          </button>
        </nav>
      </div>

      {/* Tab 1: Line Items Table */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200 text-[11px]">
                <tr>
                  <th className="p-3.5">Équipement</th>
                  <th className="p-3.5 text-center">Quantité</th>
                  <th className="p-3.5 text-center">Sortie / Retour</th>
                  <th className="p-3.5 text-right">Tarif unitaire</th>
                  <th className="p-3.5 text-center">Facturable</th>
                  <th className="p-3.5 text-right">Total HT</th>
                  <th className="p-3.5 text-right">Caution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rental.lines.map((line) => (
                  <tr key={line.id} className="hover:bg-stone-50/50">
                    <td className="p-3.5">
                      <div className="font-semibold text-stone-900">{line.equipmentName}</div>
                      {line.assignedUnitIds && line.assignedUnitIds.length > 0 && (
                        <div className="text-[10px] text-stone-500 mt-0.5">
                          Unités assignées : {line.assignedUnitIds.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-center font-medium">{line.quantity}</td>
                    <td className="p-3.5 text-center">
                      <span className="font-semibold text-stone-800">
                        {line.pickedUpQuantity} sortis
                      </span>{' '}
                      / <span className="text-stone-500">{line.returnedQuantity} rendus</span>
                      {line.damagedQuantity > 0 && (
                        <div className="text-[10px] text-red-600 font-semibold">
                          ({line.damagedQuantity} endommagé)
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-right">{formatCurrency(line.rateApplied)}</td>
                    <td className="p-3.5 text-center text-stone-600">
                      {line.billableUnitsCount} j
                    </td>
                    <td className="p-3.5 text-right font-semibold text-stone-900">
                      {formatCurrency(line.lineTotal)}
                    </td>
                    <td className="p-3.5 text-right text-stone-600">
                      {formatCurrency(line.lineDepositTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rental.internalNotes && (
            <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-700">
              <strong className="text-stone-900 font-semibold">Notes internes :</strong> {rental.internalNotes}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Dispatches & Returns Audit Log */}
      {activeTab === 'fulfillment' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pickups */}
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
              <div className="font-semibold text-xs text-stone-900 mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#1E4D38]" />
                Historique des sorties ({rental.pickups.length})
              </div>
              {rental.pickups.length === 0 ? (
                <p className="text-xs text-stone-400 italic">Aucune sortie physique enregistrée.</p>
              ) : (
                <div className="space-y-3">
                  {rental.pickups.map((p) => (
                    <div key={p.id} className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span>Le {formatDateTime(p.timestamp)}</span>
                        <span>Par {p.performedBy}</span>
                      </div>
                      <div className="mt-1 font-semibold text-stone-800">
                        Réceptionné par : {p.customerSignatureName}
                      </div>
                      <div className="text-stone-600 mt-1 italic">"{p.conditionNotes}"</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Returns */}
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
              <div className="font-semibold text-xs text-stone-900 mb-3 flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-amber-600" />
                Historique des retours ({rental.returns.length})
              </div>
              {rental.returns.length === 0 ? (
                <p className="text-xs text-stone-400 italic">Aucun retour physique enregistré.</p>
              ) : (
                <div className="space-y-3">
                  {rental.returns.map((r) => (
                    <div key={r.id} className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span>Le {formatDateTime(r.timestamp)}</span>
                        <span>Contrôlé par {r.performedBy}</span>
                      </div>
                      <div className="text-stone-700 mt-1">{r.conditionNotes}</div>
                      {r.damageNotes && (
                        <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                          <strong>Dégâts signalés :</strong> {r.damageNotes}
                          {r.damageAssessedFee && (
                            <div>Retenue évaluée : {formatCurrency(r.damageAssessedFee)}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Financials & Deposits */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rental Revenue Section */}
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="font-bold text-xs text-stone-900">
                  Règlements locatifs reçus ({rentalPayments.length})
                </span>
                <button
                  onClick={() => setShowPayModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E4D38] hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Encaisser un paiement
                </button>
              </div>

              {rentalPayments.length === 0 ? (
                <p className="text-xs text-stone-400 italic py-2">Aucun règlement perçu.</p>
              ) : (
                <div className="space-y-2">
                  {rentalPayments.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-lg border border-stone-100 bg-stone-50/60 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-stone-800">
                          {p.method} {p.reference && `· Réf: ${p.reference}`}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {formatDateTime(p.createdAt)} par {p.recordedBy}
                        </div>
                      </div>
                      <div className="font-bold text-emerald-800">
                        {p.type === 'rental_refund' ? '-' : '+'}
                        {formatCurrency(p.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Security Deposit Ledger */}
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="font-bold text-xs text-stone-900">
                  Grand livre des cautions ({rentalDeposits.length})
                </span>
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Mouvement de caution
                </button>
              </div>

              {rentalDeposits.length === 0 ? (
                <p className="text-xs text-stone-400 italic py-2">Aucun mouvement de caution enregistré.</p>
              ) : (
                <div className="space-y-2">
                  {rentalDeposits.map((d) => (
                    <div
                      key={d.id}
                      className="p-2.5 rounded-lg border border-stone-100 bg-stone-50/60 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-stone-800">
                          {d.type === 'deposit_received'
                            ? 'Caution reçue'
                            : d.type === 'deposit_refunded'
                            ? 'Caution restituée'
                            : 'Retenue pour dégradation'}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {d.method} · {formatDateTime(d.createdAt)} par {d.recordedBy}
                        </div>
                      </div>
                      <div
                        className={`font-bold ${
                          d.type === 'deposit_received' ? 'text-stone-900' : 'text-amber-700'
                        }`}
                      >
                        {formatCurrency(d.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Printable Documents */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div
            onClick={() => openDocument('contract')}
            className="cursor-pointer p-4 rounded-xl border border-stone-200 bg-white hover:border-[#1E4D38] hover:shadow-xs transition-all text-xs"
          >
            <div className="font-bold text-stone-900 mb-1">Contrat de location</div>
            <p className="text-stone-500 text-[11px]">
              Document contractuel officiel complet avec engagements et conditions générales.
            </p>
          </div>
          <div
            onClick={() => openDocument('quote')}
            className="cursor-pointer p-4 rounded-xl border border-stone-200 bg-white hover:border-[#1E4D38] hover:shadow-xs transition-all text-xs"
          >
            <div className="font-bold text-stone-900 mb-1">Devis de location</div>
            <p className="text-stone-500 text-[11px]">
              Proposition commerciale détaillée adressée au client avant confirmation.
            </p>
          </div>
          <div
            onClick={() => openDocument('pickup_summary')}
            className="cursor-pointer p-4 rounded-xl border border-stone-200 bg-white hover:border-[#1E4D38] hover:shadow-xs transition-all text-xs"
          >
            <div className="font-bold text-stone-900 mb-1">Bon de sortie / Remise</div>
            <p className="text-stone-500 text-[11px]">
              Attestation d'enlèvement signée contradictoirement au comptoir ou sur site.
            </p>
          </div>
          <div
            onClick={() => openDocument('return_summary')}
            className="cursor-pointer p-4 rounded-xl border border-stone-200 bg-white hover:border-[#1E4D38] hover:shadow-xs transition-all text-xs"
          >
            <div className="font-bold text-stone-900 mb-1">Bon de retour & Contrôle</div>
            <p className="text-stone-500 text-[11px]">
              Constat d'état contradictoire de restitution et décompte des dégradations.
            </p>
          </div>
          <div
            onClick={() => openDocument('deposit_receipt')}
            className="cursor-pointer p-4 rounded-xl border border-stone-200 bg-white hover:border-[#1E4D38] hover:shadow-xs transition-all text-xs"
          >
            <div className="font-bold text-stone-900 mb-1">Reçu de caution de garantie</div>
            <p className="text-stone-500 text-[11px]">
              Reçu formel de dépôt de garantie financière (chèque, espèces ou pré-auth).
            </p>
          </div>
        </div>
      )}

      {/* Pickup Modal */}
      {showPickupModal && (
        <PickupModal
          isOpen={showPickupModal}
          onClose={() => setShowPickupModal(false)}
          rental={rental}
          equipmentList={equipmentList}
          onConfirmPickup={handleConfirmPickup}
          userName={userName}
        />
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <ReturnModal
          isOpen={showReturnModal}
          onClose={() => setShowReturnModal(false)}
          rental={rental}
          equipmentList={equipmentList}
          onConfirmReturn={handleConfirmReturn}
          userName={userName}
        />
      )}

      {/* Document Viewer Modal */}
      {showDocModal && (
        <DocumentViewerModal
          isOpen={showDocModal}
          onClose={() => setShowDocModal(false)}
          documentType={docTypeToView}
          rental={rental}
          customer={customer}
          settings={settings}
        />
      )}

      {/* Manual Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 border border-stone-200 shadow-xl text-xs space-y-3">
            <h3 className="font-bold text-sm text-stone-900">Enregistrer un règlement locatif</h3>
            <form onSubmit={handleSavePayment} className="space-y-3">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Montant à encaisser (MAD)</label>
                <input
                  type="number"
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-medium text-stone-700 mb-1">Mode de règlement</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as RentalPayment['method'])}
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                >
                  <option value="cash">Espèces</option>
                  <option value="bank_transfer">Virement bancaire</option>
                  <option value="card_external">Carte bancaire (TPE externe)</option>
                  <option value="cheque">Chèque bancaire</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-stone-700 mb-1">Référence / Numéro de transaction</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="ex. VIR-ATTIJARI-12345"
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-3 py-1.5 rounded border border-stone-200 text-stone-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#1E4D38] text-white font-semibold"
                >
                  Valider l'encaissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 border border-stone-200 shadow-xl text-xs space-y-3">
            <h3 className="font-bold text-sm text-stone-900">Mouvement de caution de garantie</h3>
            <form onSubmit={handleSaveDeposit} className="space-y-3">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Type d'opération</label>
                <select
                  value={depositType}
                  onChange={(e) => setDepositType(e.target.value as DepositLedgerEntry['type'])}
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                >
                  <option value="deposit_received">Réception de la caution (Dépôt)</option>
                  <option value="deposit_refunded">Restitution de la caution au client</option>
                  <option value="deposit_deducted_for_damage">Retenue pour dégradation / réparation</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-stone-700 mb-1">Montant (MAD)</label>
                <input
                  type="number"
                  min="1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-medium text-stone-700 mb-1">Moyen de dépôt / restitution</label>
                <select
                  value={depositMethod}
                  onChange={(e) => setDepositMethod(e.target.value as DepositLedgerEntry['method'])}
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                >
                  <option value="cheque_hold">Chèque de caution (non débité)</option>
                  <option value="cash">Espèces en caisse</option>
                  <option value="card_preauth">Pré-autorisation CB</option>
                  <option value="bank_transfer">Virement</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-stone-700 mb-1">Référence / Numéro de chèque</label>
                <input
                  type="text"
                  value={depositRef}
                  onChange={(e) => setDepositRef(e.target.value)}
                  placeholder="ex. CHQ-CAUTION-99881"
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-3 py-1.5 rounded border border-stone-200 text-stone-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-800 text-white font-semibold"
                >
                  Enregistrer l'opération
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
