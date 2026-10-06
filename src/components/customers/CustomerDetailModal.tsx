import React from 'react';
import { Phone, MessageSquare, Mail, MapPin, Building, User, Calendar, CreditCard, Shield } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { Customer, Rental, RentalPayment, DepositLedgerEntry } from '../../types';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  rentals: Rental[];
  payments: RentalPayment[];
  deposits: DepositLedgerEntry[];
  onSelectRental: (r: Rental) => void;
  onNewRentalForCustomer: (c: Customer) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  rentals,
  payments,
  deposits,
  onSelectRental,
  onNewRentalForCustomer,
}) => {
  const { language, t, formatCurrency, formatDate } = useI18n();

  const customerRentals = rentals.filter((r) => r.customerId === customer.id);

  // Outstanding balance
  const totalBilled = customerRentals
    .filter((r) => r.bookingStatus !== 'cancelled' && r.bookingStatus !== 'declined')
    .reduce((s, r) => s + r.rentalTotal, 0);

  const customerRentalIds = new Set(customerRentals.map((r) => r.id));
  const totalPaid = payments
    .filter((p) => customerRentalIds.has(p.rentalId) && p.type === 'rental_charge_payment')
    .reduce((s, p) => s + p.amount, 0);

  const balanceOwed = Math.max(0, totalBilled - totalPaid);

  // Security deposits currently held
  const depositsHeld = deposits
    .filter((d) => customerRentalIds.has(d.rentalId))
    .reduce((bal, d) => {
      if (d.type === 'deposit_received') return bal + d.amount;
      if (d.type === 'deposit_refunded' || d.type === 'deposit_deducted_for_damage') return bal - d.amount;
      return bal;
    }, 0);

  const cleanPhone = customer.phone.replace(/\D/g, '');
  const cleanWhatsapp = (customer.whatsapp || customer.phone).replace(/\D/g, '');

  const whatsappMessage =
    language === 'ar'
      ? `السلام عليكم ${customer.name}، بخصوص حسابكم لدى كريا لتأجير المعدات...`
      : `Bonjour ${customer.name}, concernant vos locations d'équipement chez Kriya...`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer.name}
      subtitle={customer.type === 'company' ? 'Compte Entreprise' : 'Particulier'}
      maxWidth="3xl"
    >
      <div className="space-y-6 text-xs">
        {/* Contact actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-stone-200 bg-stone-50/70">
          <div className="space-y-1">
            <div className="font-bold text-stone-900 text-sm">{customer.name}</div>
            <div className="text-stone-500">
              {customer.cinOrIce || 'Sans référence fiscale'} {customer.contactPerson && `· Contact : ${customer.contactPerson}`}
            </div>
            <div className="text-stone-500 flex items-center gap-1.5 mt-0.5">
              <MapPin className="h-3 w-3 text-stone-400" />
              <span>{customer.address}, {customer.city}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${cleanPhone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white font-medium text-stone-700 hover:bg-stone-50 shadow-2xs"
            >
              <Phone className="h-3.5 w-3.5 text-stone-600" />
              <span>Appeler</span>
            </a>

            <a
              href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700 shadow-2xs"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
            <div className="text-[10px] text-stone-400 uppercase font-semibold">Total dossiers</div>
            <div className="text-xl font-bold text-stone-900 mt-1">{customerRentals.length}</div>
            <div className="text-[11px] text-stone-500 mt-0.5">contrats passés ou en cours</div>
          </div>

          <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
            <div className="text-[10px] text-stone-400 uppercase font-semibold">Solde restant dû</div>
            <div className={`text-xl font-bold mt-1 ${balanceOwed > 0 ? 'text-red-700' : 'text-stone-900'}`}>
              {formatCurrency(balanceOwed)}
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">sur facturations échues</div>
          </div>

          <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
            <div className="text-[10px] text-stone-400 uppercase font-semibold">Cautions détenues</div>
            <div className="text-xl font-bold text-amber-900 mt-1">{formatCurrency(depositsHeld)}</div>
            <div className="text-[11px] text-stone-500 mt-0.5">en garantie financière active</div>
          </div>
        </div>

        {/* Customer Rentals History */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-900">
              Historique des locations ({customerRentals.length})
            </span>
            <button
              onClick={() => {
                onClose();
                onNewRentalForCustomer(customer);
              }}
              className="text-[#1E4D38] font-semibold hover:underline"
            >
              + Nouvelle location pour ce client
            </button>
          </div>

          <div className="rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold text-[11px]">
                <tr>
                  <th className="p-2.5">Référence</th>
                  <th className="p-2.5">Période</th>
                  <th className="p-2.5">Matériels</th>
                  <th className="p-2.5 text-right">Montant</th>
                  <th className="p-2.5 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {customerRentals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-stone-400 italic">
                      Aucune location enregistrée pour ce client.
                    </td>
                  </tr>
                ) : (
                  customerRentals.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => {
                        onClose();
                        onSelectRental(r);
                      }}
                      className="cursor-pointer hover:bg-stone-50/70"
                    >
                      <td className="p-2.5 font-bold text-stone-900">{r.referenceNumber}</td>
                      <td className="p-2.5 text-stone-600">
                        {formatDate(r.startDate)} - {formatDate(r.endDate)}
                      </td>
                      <td className="p-2.5 text-stone-700">
                        {r.lines.map((l) => `${l.quantity}x ${l.equipmentName}`).join(', ')}
                      </td>
                      <td className="p-2.5 text-right font-semibold text-stone-900">
                        {formatCurrency(r.rentalTotal)}
                      </td>
                      <td className="p-2.5 text-center">
                        <StatusBadge type="fulfillment" status={r.fulfillmentStatus} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {customer.notes && (
          <div className="p-3 rounded-lg border border-stone-200 bg-stone-50 text-stone-700">
            <strong className="text-stone-900">Observations client :</strong> {customer.notes}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-200 px-4 py-1.5 font-medium text-stone-700 hover:bg-stone-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
};
