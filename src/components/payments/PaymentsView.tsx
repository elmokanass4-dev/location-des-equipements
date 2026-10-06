import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Shield,
  Plus,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  FileText,
  DollarSign,
  Download,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { RentalPayment, DepositLedgerEntry, Rental, Customer } from '../../types';
import { Modal } from '../common/Modal';

interface PaymentsViewProps {
  payments: RentalPayment[];
  deposits: DepositLedgerEntry[];
  rentals: Rental[];
  customers: Customer[];
  userName: string;
  onRecordPayment: (payment: RentalPayment) => void;
  onRecordDeposit: (entry: DepositLedgerEntry) => void;
  onSelectRental: (rental: Rental) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  deposits,
  rentals,
  customers,
  userName,
  onRecordPayment,
  onRecordDeposit,
  onSelectRental,
}) => {
  const { t, formatCurrency, formatDateTime } = useI18n();

  const [activeTab, setActiveTab] = useState<'revenue' | 'deposits'>('revenue');
  const [search, setSearch] = useState('');

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  // New Payment Form state
  const [selectedRentalIdForPay, setSelectedRentalIdForPay] = useState(rentals[0]?.id || '');
  const [payAmount, setPayAmount] = useState<number>(1000);
  const [payType, setPayType] = useState<RentalPayment['type']>('rental_charge_payment');
  const [payMethod, setPayMethod] = useState<RentalPayment['method']>('cash');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // New Deposit Form state
  const [selectedRentalIdForDep, setSelectedRentalIdForDep] = useState(rentals[0]?.id || '');
  const [depAmount, setDepAmount] = useState<number>(3000);
  const [depType, setDepType] = useState<DepositLedgerEntry['type']>('deposit_received');
  const [depMethod, setDepMethod] = useState<DepositLedgerEntry['method']>('cheque_hold');
  const [depRef, setDepRef] = useState('');
  const [depNotes, setDepNotes] = useState('');

  // Totals calculations
  const totalRentalPayments = payments
    .filter((p) => p.type === 'rental_charge_payment')
    .reduce((s, p) => s + p.amount, 0);

  const totalRentalRefunds = payments
    .filter((p) => p.type === 'rental_refund')
    .reduce((s, p) => s + p.amount, 0);

  const netRentalCash = totalRentalPayments - totalRentalRefunds;

  const totalDepositsReceived = deposits
    .filter((d) => d.type === 'deposit_received')
    .reduce((s, d) => s + d.amount, 0);

  const totalDepositsRefunded = deposits
    .filter((d) => d.type === 'deposit_refunded')
    .reduce((s, d) => s + d.amount, 0);

  const totalDepositsDeducted = deposits
    .filter((d) => d.type === 'deposit_deducted_for_damage')
    .reduce((s, d) => s + d.amount, 0);

  const activeDepositsHeld = totalDepositsReceived - totalDepositsRefunded - totalDepositsDeducted;

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const r = rentals.find((rent) => rent.id === p.rentalId);
      const c = r ? customers.find((cust) => cust.id === r.customerId) : null;
      const q = search.toLowerCase();
      return (
        p.reference?.toLowerCase().includes(q) ||
        r?.referenceNumber.toLowerCase().includes(q) ||
        c?.name.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q)
      );
    });
  }, [payments, rentals, customers, search]);

  // Filtered Deposits
  const filteredDeposits = useMemo(() => {
    return deposits.filter((d) => {
      const r = rentals.find((rent) => rent.id === d.rentalId);
      const c = r ? customers.find((cust) => cust.id === r.customerId) : null;
      const q = search.toLowerCase();
      return (
        d.reference?.toLowerCase().includes(q) ||
        r?.referenceNumber.toLowerCase().includes(q) ||
        c?.name.toLowerCase().includes(q) ||
        d.notes?.toLowerCase().includes(q)
      );
    });
  }, [deposits, rentals, customers, search]);

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;

    const newPay: RentalPayment = {
      id: `pay-${Date.now()}`,
      rentalId: selectedRentalIdForPay,
      type: payType,
      amount: payAmount,
      method: payMethod,
      reference: payRef || undefined,
      notes: payNotes || undefined,
      recordedBy: userName,
      createdAt: new Date().toISOString(),
    };

    onRecordPayment(newPay);
    setShowPaymentModal(false);
  };

  const handleSaveDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (depAmount <= 0) return;

    const newDep: DepositLedgerEntry = {
      id: `dep-${Date.now()}`,
      rentalId: selectedRentalIdForDep,
      type: depType,
      amount: depAmount,
      method: depMethod,
      reference: depRef || undefined,
      notes: depNotes || undefined,
      recordedBy: userName,
      createdAt: new Date().toISOString(),
    };

    onRecordDeposit(newDep);
    setShowDepositModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-stone-900 tracking-tight">{t.payments.title}</h1>
          <p className="text-xs text-stone-500">{t.payments.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E4D38] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#163B2B]"
          >
            <Plus className="h-4 w-4" />
            <span>{t.payments.recordPayment}</span>
          </button>
          <button
            onClick={() => setShowDepositModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 shadow-2xs"
          >
            <Shield className="h-3.5 w-3.5 text-amber-700" />
            <span>{t.payments.recordDeposit}</span>
          </button>
        </div>
      </div>

      {/* Strict Accounting Rule Notice */}
      <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 text-xs text-stone-700 flex items-start gap-2.5 shadow-2xs">
        <AlertCircle className="h-4 w-4 text-[#1E4D38] shrink-0 mt-0.5" />
        <p className="leading-relaxed">{t.payments.noticeSeparation}</p>
      </div>

      {/* Overview Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
          <div className="text-[10px] text-stone-400 uppercase font-semibold">Chiffre d'affaires encaissé</div>
          <div className="text-xl font-bold text-stone-900 mt-1">{formatCurrency(netRentalCash)}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Règlements locatifs réels</div>
        </div>

        <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
          <div className="text-[10px] text-stone-400 uppercase font-semibold">Cautions actuellement détenues</div>
          <div className="text-xl font-bold text-amber-900 mt-1">{formatCurrency(activeDepositsHeld)}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Garanties en coffre / banque</div>
        </div>

        <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
          <div className="text-[10px] text-stone-400 uppercase font-semibold">Cautions restituées</div>
          <div className="text-xl font-bold text-stone-900 mt-1">{formatCurrency(totalDepositsRefunded)}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Rendues après contrôle OK</div>
        </div>

        <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
          <div className="text-[10px] text-stone-400 uppercase font-semibold">Retenues sur caution (Dégâts)</div>
          <div className="text-xl font-bold text-red-700 mt-1">{formatCurrency(totalDepositsDeducted)}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Imputées pour réparations</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-stone-200 pt-2">
        <div className="flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('revenue')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'revenue'
                ? 'border-[#1E4D38] text-[#1E4D38]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {t.payments.rentalRevenueTab} ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('deposits')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'deposits'
                ? 'border-[#1E4D38] text-[#1E4D38]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {t.payments.depositLedgerTab} ({deposits.length})
          </button>
        </div>

        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher écriture..."
            className="rounded border border-stone-200 pl-8 pr-2.5 py-1 text-xs bg-white outline-none focus:border-[#1E4D38]"
          />
        </div>
      </div>

      {/* Tab Content 1: Rental Revenue Ledger */}
      {activeTab === 'revenue' && (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold text-[11px]">
              <tr>
                <th className="p-3.5">Date & Heure</th>
                <th className="p-3.5">Contrat associé</th>
                <th className="p-3.5">Client</th>
                <th className="p-3.5">Mode de règlement</th>
                <th className="p-3.5">Référence pièce</th>
                <th className="p-3.5">Agent</th>
                <th className="p-3.5 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400 italic">
                    Aucun règlement locatif trouvé.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const rental = rentals.find((r) => r.id === p.rentalId);
                  const cust = rental ? customers.find((c) => c.id === rental.customerId) : null;

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/70">
                      <td className="p-3.5 text-stone-600 whitespace-nowrap">
                        {formatDateTime(p.createdAt)}
                      </td>
                      <td className="p-3.5 font-bold text-stone-900">
                        {rental ? (
                          <button
                            onClick={() => onSelectRental(rental)}
                            className="hover:underline text-[#1E4D38]"
                          >
                            {rental.referenceNumber}
                          </button>
                        ) : (
                          p.rentalId
                        )}
                      </td>
                      <td className="p-3.5 text-stone-800 font-medium">{cust?.name || 'Client'}</td>
                      <td className="p-3.5 text-stone-700 capitalize">{p.method}</td>
                      <td className="p-3.5 font-mono text-[11px] text-stone-500">
                        {p.reference || '—'}
                      </td>
                      <td className="p-3.5 text-stone-500">{p.recordedBy}</td>
                      <td
                        className={`p-3.5 text-right font-bold whitespace-nowrap ${
                          p.type === 'rental_refund' ? 'text-red-700' : 'text-emerald-800'
                        }`}
                      >
                        {p.type === 'rental_refund' ? '-' : '+'}
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content 2: Security Deposit Ledger */}
      {activeTab === 'deposits' && (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold text-[11px]">
              <tr>
                <th className="p-3.5">Date & Heure</th>
                <th className="p-3.5">Contrat</th>
                <th className="p-3.5">Client</th>
                <th className="p-3.5">Type d'opération</th>
                <th className="p-3.5">Moyen de garantie</th>
                <th className="p-3.5">Référence chèque / reçu</th>
                <th className="p-3.5">Agent</th>
                <th className="p-3.5 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400 italic">
                    Aucune écriture de caution trouvée.
                  </td>
                </tr>
              ) : (
                filteredDeposits.map((d) => {
                  const rental = rentals.find((r) => r.id === d.rentalId);
                  const cust = rental ? customers.find((c) => c.id === rental.customerId) : null;

                  return (
                    <tr key={d.id} className="hover:bg-stone-50/70">
                      <td className="p-3.5 text-stone-600 whitespace-nowrap">
                        {formatDateTime(d.createdAt)}
                      </td>
                      <td className="p-3.5 font-bold text-stone-900">
                        {rental ? (
                          <button
                            onClick={() => onSelectRental(rental)}
                            className="hover:underline text-[#1E4D38]"
                          >
                            {rental.referenceNumber}
                          </button>
                        ) : (
                          d.rentalId
                        )}
                      </td>
                      <td className="p-3.5 text-stone-800 font-medium">{cust?.name || 'Client'}</td>
                      <td className="p-3.5">
                        <span
                          className={`font-semibold ${
                            d.type === 'deposit_received'
                              ? 'text-emerald-800'
                              : d.type === 'deposit_refunded'
                              ? 'text-stone-700'
                              : 'text-red-700'
                          }`}
                        >
                          {d.type === 'deposit_received'
                            ? t.payments.depositReceived
                            : d.type === 'deposit_refunded'
                            ? t.payments.depositRefunded
                            : t.payments.depositDeducted}
                        </span>
                      </td>
                      <td className="p-3.5 text-stone-700 capitalize">{d.method}</td>
                      <td className="p-3.5 font-mono text-[11px] text-stone-500">
                        {d.reference || '—'}
                      </td>
                      <td className="p-3.5 text-stone-500">{d.recordedBy}</td>
                      <td className="p-3.5 text-right font-bold text-stone-900 whitespace-nowrap">
                        {formatCurrency(d.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title="Enregistrer un règlement locatif"
          subtitle="Ce montant sera comptabilisé en chiffre d'affaires locatif"
          maxWidth="md"
        >
          <form onSubmit={handleSavePayment} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-stone-700 mb-1">Contrat de location lié *</label>
              <select
                value={selectedRentalIdForPay}
                onChange={(e) => setSelectedRentalIdForPay(e.target.value)}
                className="w-full rounded border border-stone-200 p-2 text-xs bg-white"
              >
                {rentals.map((r) => {
                  const c = customers.find((cu) => cu.id === r.customerId);
                  return (
                    <option key={r.id} value={r.id}>
                      {r.referenceNumber} · {c?.name} ({formatCurrency(r.rentalTotal)})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Montant (MAD) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Type d'opération</label>
                <select
                  value={payType}
                  onChange={(e) => setPayType(e.target.value as RentalPayment['type'])}
                  className="w-full rounded border border-stone-200 p-2 text-xs bg-white"
                >
                  <option value="rental_charge_payment">Encaissement</option>
                  <option value="rental_refund">Remboursement client</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Mode de paiement</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as RentalPayment['method'])}
                className="w-full rounded border border-stone-200 p-2 text-xs bg-white"
              >
                <option value="cash">Espèces</option>
                <option value="bank_transfer">Virement bancaire</option>
                <option value="card_external">Carte bancaire (TPE externe)</option>
                <option value="cheque">Chèque</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Référence pièce</label>
              <input
                type="text"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="ex. VIR-12345"
                className="w-full rounded border border-stone-200 p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-3 py-1.5 rounded border border-stone-200 text-stone-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-[#1E4D38] text-white font-semibold"
              >
                Valider
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Record Deposit Modal */}
      {showDepositModal && (
        <Modal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          title="Mouvement de caution de garantie"
          subtitle="Non comptabilisé en chiffre d'affaires locatif"
          maxWidth="md"
        >
          <form onSubmit={handleSaveDeposit} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-stone-700 mb-1">Contrat de location lié *</label>
              <select
                value={selectedRentalIdForDep}
                onChange={(e) => setSelectedRentalIdForDep(e.target.value)}
                className="w-full rounded border border-stone-200 p-2 text-xs bg-white"
              >
                {rentals.map((r) => {
                  const c = customers.find((cu) => cu.id === r.customerId);
                  return (
                    <option key={r.id} value={r.id}>
                      {r.referenceNumber} · {c?.name} (Caution req: {formatCurrency(r.depositRequired)})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Type d'opération</label>
              <select
                value={depType}
                onChange={(e) => setDepType(e.target.value as DepositLedgerEntry['type'])}
                className="w-full rounded border border-stone-200 p-2 text-xs bg-white"
              >
                <option value="deposit_received">Réception de caution (Dépôt)</option>
                <option value="deposit_refunded">Restitution de caution au client</option>
                <option value="deposit_deducted_for_damage">Retenue pour dégradation / réparation</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Montant (MAD) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={depAmount}
                  onChange={(e) => setDepAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Moyen de dépôt</label>
                <select
                  value={depMethod}
                  onChange={(e) => setDepMethod(e.target.value as DepositLedgerEntry['method'])}
                  className="w-full rounded border border-stone-200 p-2 text-xs bg-white"
                >
                  <option value="cheque_hold">Chèque de caution (non débité)</option>
                  <option value="cash">Espèces en caisse</option>
                  <option value="card_preauth">Pré-autorisation CB</option>
                  <option value="bank_transfer">Virement</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Référence / Numéro</label>
              <input
                type="text"
                value={depRef}
                onChange={(e) => setDepRef(e.target.value)}
                placeholder="ex. CHQ-CAUTION-99881"
                className="w-full rounded border border-stone-200 p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
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
        </Modal>
      )}
    </div>
  );
};
